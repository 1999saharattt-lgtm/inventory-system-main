import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  prisma,
} from "@/lib/prisma";

import {
  verifySession,
} from "@/lib/session";

/* =========================================================
   TYPES
========================================================= */

type InspectionRowPayload = {
  materialId?: unknown;

  accuracy?: unknown;

  shortageQty?: unknown;
  excessQty?: unknown;

  baht?: unknown;
  satang?: unknown;

  damagedQty?: unknown;
  deterioratedQty?: unknown;
  unnecessaryQty?: unknown;

  remark?: unknown;
};

type InspectionPayload = {
  fiscalYear?: unknown;

  inspectionDate?: unknown;

  inspectorIds?: unknown;

  rows?: unknown;
};

type ParsedInspectionRow = {
  materialId: number;

  accuracy:
    | string
    | null;

  shortageQty:
    | number
    | null;

  excessQty:
    | number
    | null;

  baht:
    | number
    | null;

  satang:
    | number
    | null;

  damagedQty:
    | number
    | null;

  deterioratedQty:
    | number
    | null;

  unnecessaryQty:
    | number
    | null;

  remark:
    | string
    | null;
};

type ParsedInspectionPayload = {
  fiscalYear: number;

  inspectionDate: Date;

  inspectorIds: number[];

  rows: ParsedInspectionRow[];
};

type ParsePayloadResult =
  | {
      ok: true;

      data: ParsedInspectionPayload;
    }
  | {
      ok: false;

      response: NextResponse;
    };

/* =========================================================
   JSON RESPONSE
========================================================= */

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    }
  );
}

/* =========================================================
   SESSION
========================================================= */

async function getSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "session"
    )?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(
      token
    );
  } catch {
    return null;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function parsePositiveInteger(
  value: unknown
) {
  const parsed =
    typeof value ===
      "number"
      ? value
      : Number(
          String(
            value ?? ""
          ).trim()
        );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

/* =========================================================
   OPTIONAL NON-NEGATIVE INTEGER

   ""
   null
   undefined
   -> null

   0+
   -> number

   invalid
   -> undefined
========================================================= */

function parseOptionalNonNegativeInteger(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    String(
      value
    ).trim() === ""
  ) {
    return null;
  }

  const parsed =
    typeof value ===
      "number"
      ? value
      : Number(
          String(
            value
          ).trim()
        );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed < 0
  ) {
    return undefined;
  }

  return parsed;
}

/* =========================================================
   TEXT
========================================================= */

function parseText(
  value: unknown
) {
  const text =
    String(
      value ?? ""
    ).trim();

  return text
    ? text
    : null;
}

/* =========================================================
   DATE ONLY

   YYYY-MM-DD
   ->
   UTC 00:00:00

   ป้องกันวันที่เลื่อนจาก timezone
========================================================= */

function parseDateOnly(
  value: unknown
) {
  const text =
    String(
      value ?? ""
    ).trim();

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      text
    );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
      )
    );

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   ACCURACY
========================================================= */

function parseAccuracy(
  value: unknown
) {
  const accuracy =
    String(
      value ?? ""
    )
      .trim()
      .toUpperCase();

  if (!accuracy) {
    return null;
  }

  if (
    accuracy !==
      "CORRECT" &&
    accuracy !==
      "INCORRECT"
  ) {
    return undefined;
  }

  return accuracy;
}

/* =========================================================
   PARSE REQUEST BODY

   ใช้ร่วมกันทั้ง POST และ PUT
========================================================= */

async function parsePayload(
  request: Request
): Promise<ParsePayloadResult> {
  /* =======================================================
     BODY
  ======================================================= */

  let body:
    | InspectionPayload
    | null =
    null;

  try {
    body =
      (await request.json()) as
        InspectionPayload;
  } catch {
    return {
      ok: false,

      response:
        jsonError(
          "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          400
        ),
    };
  }

  if (
    !body ||
    typeof body !==
      "object"
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          400
        ),
    };
  }

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const fiscalYear =
    parsePositiveInteger(
      body.fiscalYear
    );

  if (
    fiscalYear ===
      null ||
    fiscalYear < 2400 ||
    fiscalYear > 3000
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "ปีงบประมาณไม่ถูกต้อง",
          400
        ),
    };
  }

  /* =======================================================
     INSPECTION DATE
  ======================================================= */

  const inspectionDate =
    parseDateOnly(
      body.inspectionDate
    );

  if (
    !inspectionDate
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "วันที่ตรวจสอบไม่ถูกต้อง",
          400
        ),
    };
  }

  /* =======================================================
     INSPECTORS

     ต้องครบ 3 คน
     และห้ามซ้ำ
  ======================================================= */

  if (
    !Array.isArray(
      body.inspectorIds
    )
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน",
          400
        ),
    };
  }

  const inspectorIds =
    body.inspectorIds.map(
      (
        value
      ) =>
        parsePositiveInteger(
          value
        )
    );

  if (
    inspectorIds.length !==
      3 ||
    inspectorIds.some(
      (
        id
      ) =>
        id === null
    )
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน",
          400
        ),
    };
  }

  const validInspectorIds =
    inspectorIds as number[];

  if (
    new Set(
      validInspectorIds
    ).size !== 3
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้",
          400
        ),
    };
  }

  /* =======================================================
     ROWS
  ======================================================= */

  if (
    !Array.isArray(
      body.rows
    ) ||
    body.rows.length ===
      0
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "ไม่พบรายการพัสดุสำหรับบันทึก",
          400
        ),
    };
  }

  const rows: ParsedInspectionRow[] =
    [];

  for (
    let index = 0;
    index <
    body.rows.length;
    index++
  ) {
    const rawRow =
      body.rows[
        index
      ] as InspectionRowPayload;

    if (
      !rawRow ||
      typeof rawRow !==
        "object"
    ) {
      return {
        ok: false,

        response:
          jsonError(
            `ข้อมูลรายการที่ ${
              index +
              1
            } ไม่ถูกต้อง`,
            400
          ),
      };
    }

    /* ===============================================
       MATERIAL
    =============================================== */

    const materialId =
      parsePositiveInteger(
        rawRow.materialId
      );

    if (
      materialId ===
      null
    ) {
      return {
        ok: false,

        response:
          jsonError(
            `รหัสพัสดุรายการที่ ${
              index +
              1
            } ไม่ถูกต้อง`,
            400
          ),
      };
    }

    /* ===============================================
       ACCURACY
    =============================================== */

    const accuracy =
      parseAccuracy(
        rawRow.accuracy
      );

    if (
      accuracy ===
      undefined
    ) {
      return {
        ok: false,

        response:
          jsonError(
            `ผลการตรวจสอบรายการที่ ${
              index +
              1
            } ไม่ถูกต้อง`,
            400
          ),
      };
    }

    /* ===============================================
       NUMBER VALUES
    =============================================== */

    const shortageQty =
      parseOptionalNonNegativeInteger(
        rawRow.shortageQty
      );

    const excessQty =
      parseOptionalNonNegativeInteger(
        rawRow.excessQty
      );

    const baht =
      parseOptionalNonNegativeInteger(
        rawRow.baht
      );

    const satang =
      parseOptionalNonNegativeInteger(
        rawRow.satang
      );

    const damagedQty =
      parseOptionalNonNegativeInteger(
        rawRow.damagedQty
      );

    const deterioratedQty =
      parseOptionalNonNegativeInteger(
        rawRow.deterioratedQty
      );

    const unnecessaryQty =
      parseOptionalNonNegativeInteger(
        rawRow.unnecessaryQty
      );

    if (
      shortageQty ===
        undefined ||
      excessQty ===
        undefined ||
      baht ===
        undefined ||
      satang ===
        undefined ||
      damagedQty ===
        undefined ||
      deterioratedQty ===
        undefined ||
      unnecessaryQty ===
        undefined
    ) {
      return {
        ok: false,

        response:
          jsonError(
            `จำนวนในรายการที่ ${
              index +
              1
            } ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`,
            400
          ),
      };
    }

    /* ===============================================
       PUSH
    =============================================== */

    rows.push({
      materialId,

      accuracy,

      shortageQty,

      excessQty,

      baht,

      satang,

      damagedQty,

      deterioratedQty,

      unnecessaryQty,

      remark:
        parseText(
          rawRow.remark
        ),
    });
  }

  /* =======================================================
     MATERIAL ID ห้ามซ้ำ
  ======================================================= */

  const materialIds =
    rows.map(
      (
        row
      ) =>
        row.materialId
    );

  if (
    new Set(
      materialIds
    ).size !==
    materialIds.length
  ) {
    return {
      ok: false,

      response:
        jsonError(
          "พบรายการพัสดุซ้ำในข้อมูลที่ส่งมา",
          400
        ),
    };
  }

  /* =======================================================
     RESULT
  ======================================================= */

  return {
    ok: true,

    data: {
      fiscalYear,

      inspectionDate,

      inspectorIds:
        validInspectorIds,

      rows,
    },
  };
}

/* =========================================================
   VALIDATE REFERENCES

   - กรรมการต้องมีอยู่จริง
   - พัสดุต้องมีอยู่จริง
   - สร้าง snapshot ชื่อกรรมการ
========================================================= */

async function validateReferences(
  data: ParsedInspectionPayload
) {
  const materialIds =
    data.rows.map(
      (
        row
      ) =>
        row.materialId
    );

  /* =======================================================
     OFFICERS
  ======================================================= */

  const officers =
    await prisma.officer.findMany(
      {
        where: {
          id: {
            in:
              data.inspectorIds,
          },
        },

        select: {
          id: true,
          firstName:
            true,
          lastName:
            true,
        },
      }
    );

  if (
    officers.length !==
    data.inspectorIds.length
  ) {
    return {
      ok:
        false as const,

      response:
        jsonError(
          "ไม่พบข้อมูลคณะกรรมการตรวจสอบบางราย",
          400
        ),
    };
  }

  const officerMap =
    new Map(
      officers.map(
        (
          officer
        ) => [
          officer.id,
          officer,
        ]
      )
    );

  const inspectorNames =
    data.inspectorIds.map(
      (
        id
      ) => {
        const officer =
          officerMap.get(
            id
          );

        if (
          !officer
        ) {
          return "";
        }

        return `${officer.firstName} ${officer.lastName}`.trim();
      }
    );

  /* =======================================================
     MATERIALS
  ======================================================= */

  const materials =
    await prisma.material.findMany(
      {
        where: {
          id: {
            in:
              materialIds,
          },
        },

        select: {
          id: true,
        },
      }
    );

  if (
    materials.length !==
    materialIds.length
  ) {
    return {
      ok:
        false as const,

      response:
        jsonError(
          "ไม่พบข้อมูลพัสดุบางรายการ กรุณาเปิดหน้าใหม่แล้วลองอีกครั้ง",
          400
        ),
    };
  }

  return {
    ok:
      true as const,

    inspectorNames,
  };
}

/* =========================================================
   SAME ID SET
========================================================= */

function sameIdSet(
  first: number[],
  second: number[]
) {
  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  const secondSet =
    new Set(
      second
    );

  return first.every(
    (
      id
    ) =>
      secondSet.has(
        id
      )
  );
}

/* =========================================================
   POST

   สร้างผลตรวจสอบบัญชีพัสดุประจำปี

   สำคัญ:
   - ไม่แก้ Material.balance
   - ไม่สร้าง Transaction
   - ไม่แก้ Transaction
   - ไม่กระทบ Stock Card เดิม
========================================================= */

export async function POST(
  request: Request
) {
  /* =======================================================
     LOGIN
  ======================================================= */

  const session =
    await getSession();

  if (
    !session
  ) {
    return jsonError(
      "กรุณาเข้าสู่ระบบ",
      401
    );
  }

  /* =======================================================
     PARSE
  ======================================================= */

  const parsed =
    await parsePayload(
      request
    );

  if (
    !parsed.ok
  ) {
    return parsed.response;
  }

  const data =
    parsed.data;

  /* =======================================================
     CHECK DUPLICATE YEAR

     1 ปีงบประมาณ
     =
     1 รอบการตรวจ
  ======================================================= */

  const existingInspection =
    await prisma.stockCardInspection.findUnique(
      {
        where: {
          fiscalYear:
            data.fiscalYear,
        },

        select: {
          id: true,
        },
      }
    );

  if (
    existingInspection
  ) {
    return jsonError(
      `มีข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${data.fiscalYear} แล้ว`,
      409
    );
  }

  /* =======================================================
     REFERENCES
  ======================================================= */

  const references =
    await validateReferences(
      data
    );

  if (
    !references.ok
  ) {
    return references.response;
  }

  /* =======================================================
     CREATE
  ======================================================= */

  try {
    const inspection =
      await prisma.$transaction(
        async (
          tx
        ) => {
          /* =============================================
             HEADER
          ============================================= */

          const created =
            await tx.stockCardInspection.create(
              {
                data: {
                  fiscalYear:
                    data.fiscalYear,

                  inspectionDate:
                    data.inspectionDate,

                  inspectorIds:
                    data.inspectorIds,

                  inspectorNames:
                    references.inspectorNames,
                },

                select: {
                  id: true,

                  fiscalYear:
                    true,

                  inspectionDate:
                    true,
                },
              }
            );

          /* =============================================
             ROWS
          ============================================= */

          await tx.stockCardInspectionRow.createMany(
            {
              data:
                data.rows.map(
                  (
                    row
                  ) => ({
                    inspectionId:
                      created.id,

                    materialId:
                      row.materialId,

                    accuracy:
                      row.accuracy,

                    shortageQty:
                      row.shortageQty,

                    excessQty:
                      row.excessQty,

                    baht:
                      row.baht,

                    satang:
                      row.satang,

                    damagedQty:
                      row.damagedQty,

                    deterioratedQty:
                      row.deterioratedQty,

                    unnecessaryQty:
                      row.unnecessaryQty,

                    remark:
                      row.remark,
                  })
                ),
            }
          );

          return created;
        }
      );

    return NextResponse.json(
      {
        ok: true,

        message:
          "บันทึกผลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว",

        inspection: {
          id:
            inspection.id,

          fiscalYear:
            inspection.fiscalYear,

          inspectionDate:
            inspection.inspectionDate,

          rowCount:
            data.rows.length,
        },
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Create stock card inspection error:",
      error
    );

    /* =====================================================
       ตรวจซ้ำอีกครั้ง
       เผื่อมี request เข้ามาพร้อมกัน
    ===================================================== */

    try {
      const duplicate =
        await prisma.stockCardInspection.findUnique(
          {
            where: {
              fiscalYear:
                data.fiscalYear,
            },

            select: {
              id: true,
            },
          }
        );

      if (
        duplicate
      ) {
        return jsonError(
          `มีข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${data.fiscalYear} แล้ว`,
          409
        );
      }
    } catch (
      duplicateCheckError
    ) {
      console.error(
        "Check duplicate stock card inspection error:",
        duplicateCheckError
      );
    }

    return jsonError(
      "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบบัญชีพัสดุ",
      500
    );
  }
}

/* =========================================================
   PUT

   แก้ไขผลตรวจสอบบัญชีพัสดุประจำปี

   หลักการ:
   - หา Inspection จาก fiscalYear
   - ไม่เปลี่ยนปีงบประมาณ
   - แก้ inspectionDate
   - แก้กรรมการ 3 คน
   - แทนที่ผลตรวจของรายการเดิม
   - ห้ามเพิ่ม/ลด Material จากประวัติเดิม
   - ไม่แตะ Material.balance
   - ไม่แตะ Transaction
========================================================= */

export async function PUT(
  request: Request
) {
  /* =======================================================
     LOGIN
  ======================================================= */

  const session =
    await getSession();

  if (
    !session
  ) {
    return jsonError(
      "กรุณาเข้าสู่ระบบ",
      401
    );
  }

  /* =======================================================
     PARSE BODY
  ======================================================= */

  const parsed =
    await parsePayload(
      request
    );

  if (
    !parsed.ok
  ) {
    return parsed.response;
  }

  const data =
    parsed.data;

  /* =======================================================
     QUERY FISCAL YEAR

     หน้าแก้ไขเรียก:
     /api/stock-card/inspection?fiscalYear=2569
  ======================================================= */

  const url =
    new URL(
      request.url
    );

  const queryFiscalYearText =
    url.searchParams.get(
      "fiscalYear"
    );

  if (
    queryFiscalYearText
  ) {
    const queryFiscalYear =
      parsePositiveInteger(
        queryFiscalYearText
      );

    if (
      queryFiscalYear ===
        null ||
      queryFiscalYear <
        2400 ||
      queryFiscalYear >
        3000
    ) {
      return jsonError(
        "ปีงบประมาณใน URL ไม่ถูกต้อง",
        400
      );
    }

    if (
      queryFiscalYear !==
      data.fiscalYear
    ) {
      return jsonError(
        "ปีงบประมาณของข้อมูลไม่ตรงกับรายการที่ต้องการแก้ไข",
        400
      );
    }
  }

  /* =======================================================
     EXISTING INSPECTION
  ======================================================= */

  const existingInspection =
    await prisma.stockCardInspection.findUnique(
      {
        where: {
          fiscalYear:
            data.fiscalYear,
        },

        select: {
          id: true,

          fiscalYear:
            true,

          rows: {
            select: {
              materialId:
                true,
            },
          },
        },
      }
    );

  if (
    !existingInspection
  ) {
    return jsonError(
      `ไม่พบข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${data.fiscalYear}`,
      404
    );
  }

  /* =======================================================
     ตรวจรายการพัสดุกับประวัติเดิม

     หน้าแก้ไขประวัติ:
     ไม่อนุญาตให้เพิ่ม/ลดรายการ
     เพราะต้องการรักษารอบตรวจเดิมไว้
  ======================================================= */

  const oldMaterialIds =
    existingInspection.rows.map(
      (
        row
      ) =>
        row.materialId
    );

  const newMaterialIds =
    data.rows.map(
      (
        row
      ) =>
        row.materialId
    );

  if (
    !sameIdSet(
      oldMaterialIds,
      newMaterialIds
    )
  ) {
    return jsonError(
      "รายการพัสดุที่ส่งมาไม่ตรงกับข้อมูลการตรวจสอบเดิม กรุณาเปิดหน้าแก้ไขใหม่แล้วลองอีกครั้ง",
      400
    );
  }

  /* =======================================================
     REFERENCES
  ======================================================= */

  const references =
    await validateReferences(
      data
    );

  if (
    !references.ok
  ) {
    return references.response;
  }

  /* =======================================================
     UPDATE TRANSACTION

     ทำทั้งหมดใน transaction เดียว

     1. Update Header
     2. Delete inspection rows เดิม
     3. Create inspection rows ชุดใหม่

     หากขั้นตอนไหนล้มเหลว
     จะ rollback ทั้งหมด
  ======================================================= */

  try {
    const inspection =
      await prisma.$transaction(
        async (
          tx
        ) => {
          /* =============================================
             UPDATE HEADER
          ============================================= */

          const updated =
            await tx.stockCardInspection.update(
              {
                where: {
                  id:
                    existingInspection.id,
                },

                data: {
                  inspectionDate:
                    data.inspectionDate,

                  inspectorIds:
                    data.inspectorIds,

                  inspectorNames:
                    references.inspectorNames,
                },

                select: {
                  id: true,

                  fiscalYear:
                    true,

                  inspectionDate:
                    true,

                  updatedAt:
                    true,
                },
              }
            );

          /* =============================================
             DELETE OLD ROWS

             ลบเฉพาะ StockCardInspectionRow
             ไม่แตะ Material
             ไม่แตะ Transaction
          ============================================= */

          await tx.stockCardInspectionRow.deleteMany(
            {
              where: {
                inspectionId:
                  existingInspection.id,
              },
            }
          );

          /* =============================================
             CREATE UPDATED ROWS
          ============================================= */

          await tx.stockCardInspectionRow.createMany(
            {
              data:
                data.rows.map(
                  (
                    row
                  ) => ({
                    inspectionId:
                      existingInspection.id,

                    materialId:
                      row.materialId,

                    accuracy:
                      row.accuracy,

                    shortageQty:
                      row.shortageQty,

                    excessQty:
                      row.excessQty,

                    baht:
                      row.baht,

                    satang:
                      row.satang,

                    damagedQty:
                      row.damagedQty,

                    deterioratedQty:
                      row.deterioratedQty,

                    unnecessaryQty:
                      row.unnecessaryQty,

                    remark:
                      row.remark,
                  })
                ),
            }
          );

          return updated;
        }
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        ok: true,

        message:
          "แก้ไขข้อมูลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว",

        inspection: {
          id:
            inspection.id,

          fiscalYear:
            inspection.fiscalYear,

          inspectionDate:
            inspection.inspectionDate,

          updatedAt:
            inspection.updatedAt,

          rowCount:
            data.rows.length,
        },
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Update stock card inspection error:",
      error
    );

    return jsonError(
      "เกิดข้อผิดพลาดในการแก้ไขข้อมูลการตรวจสอบบัญชีพัสดุ",
      500
    );
  }
}