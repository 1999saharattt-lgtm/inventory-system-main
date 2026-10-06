import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

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

/* =========================================================
   JSON RESPONSE
========================================================= */

function jsonError(message: string, status: number) {
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
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function parsePositiveInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").trim());

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseOptionalNonNegativeInteger(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).trim());

  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function parseText(value: unknown) {
  const text = String(value ?? "").trim();

  return text ? text : null;
}

/* =========================================================
   DATE ONLY

   YYYY-MM-DD
   -> UTC 00:00:00

   ใช้มาตรฐานเดียวกับข้อมูล date-only ของระบบ
========================================================= */

function parseDateOnly(value: unknown) {
  const text = String(value ?? "").trim();

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
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
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   ACCURACY
========================================================= */

function parseAccuracy(value: unknown) {
  const accuracy = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!accuracy) {
    return null;
  }

  if (
    accuracy !== "CORRECT" &&
    accuracy !== "INCORRECT"
  ) {
    return undefined;
  }

  return accuracy;
}

/* =========================================================
   POST
   บันทึกผลตรวจสอบบัญชีพัสดุประจำปี

   หมายเหตุ:
   - ไม่แก้ Material.balance
   - ไม่สร้าง/แก้ Transaction
   - ไม่กระทบ Stock Card เดิม
========================================================= */

export async function POST(request: Request) {
  /* =======================================================
     LOGIN
  ======================================================= */

  const session = await getSession();

  if (!session) {
    return jsonError("กรุณาเข้าสู่ระบบ", 401);
  }

  /* =======================================================
     BODY
  ======================================================= */

  let body: InspectionPayload | null = null;

  try {
    body = (await request.json()) as InspectionPayload;
  } catch {
    return jsonError("ข้อมูลที่ส่งมาไม่ถูกต้อง", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("ข้อมูลที่ส่งมาไม่ถูกต้อง", 400);
  }

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const fiscalYear = parsePositiveInteger(body.fiscalYear);

  if (
    fiscalYear === null ||
    fiscalYear < 2400 ||
    fiscalYear > 3000
  ) {
    return jsonError("ปีงบประมาณไม่ถูกต้อง", 400);
  }

  /* =======================================================
     INSPECTION DATE
  ======================================================= */

  const inspectionDate = parseDateOnly(body.inspectionDate);

  if (!inspectionDate) {
    return jsonError("วันที่ตรวจสอบไม่ถูกต้อง", 400);
  }

  /* =======================================================
     INSPECTORS
     ต้องครบ 3 คน และห้ามซ้ำ
  ======================================================= */

  if (!Array.isArray(body.inspectorIds)) {
    return jsonError(
      "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน",
      400
    );
  }

  const inspectorIds = body.inspectorIds.map((value) =>
    parsePositiveInteger(value)
  );

  if (
    inspectorIds.length !== 3 ||
    inspectorIds.some((id) => id === null)
  ) {
    return jsonError(
      "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน",
      400
    );
  }

  const validInspectorIds = inspectorIds as number[];

  if (new Set(validInspectorIds).size !== 3) {
    return jsonError(
      "ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้",
      400
    );
  }

  /* =======================================================
     ROWS
  ======================================================= */

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return jsonError(
      "ไม่พบรายการพัสดุสำหรับบันทึก",
      400
    );
  }

  const rows: Array<{
    materialId: number;
    accuracy: string | null;
    shortageQty: number | null;
    excessQty: number | null;
    baht: number | null;
    satang: number | null;
    damagedQty: number | null;
    deterioratedQty: number | null;
    unnecessaryQty: number | null;
    remark: string | null;
  }> = [];

  for (let index = 0; index < body.rows.length; index++) {
    const rawRow =
      body.rows[index] as InspectionRowPayload;

    if (!rawRow || typeof rawRow !== "object") {
      return jsonError(
        `ข้อมูลรายการที่ ${index + 1} ไม่ถูกต้อง`,
        400
      );
    }

    const materialId =
      parsePositiveInteger(rawRow.materialId);

    if (materialId === null) {
      return jsonError(
        `รหัสพัสดุรายการที่ ${index + 1} ไม่ถูกต้อง`,
        400
      );
    }

    const accuracy = parseAccuracy(rawRow.accuracy);

    if (accuracy === undefined) {
      return jsonError(
        `ผลการตรวจสอบรายการที่ ${index + 1} ไม่ถูกต้อง`,
        400
      );
    }

    const shortageQty =
      parseOptionalNonNegativeInteger(rawRow.shortageQty);

    const excessQty =
      parseOptionalNonNegativeInteger(rawRow.excessQty);

    const baht =
      parseOptionalNonNegativeInteger(rawRow.baht);

    const satang =
      parseOptionalNonNegativeInteger(rawRow.satang);

    const damagedQty =
      parseOptionalNonNegativeInteger(rawRow.damagedQty);

    const deterioratedQty =
      parseOptionalNonNegativeInteger(
        rawRow.deterioratedQty
      );

    const unnecessaryQty =
      parseOptionalNonNegativeInteger(
        rawRow.unnecessaryQty
      );

    if (
      shortageQty === undefined ||
      excessQty === undefined ||
      baht === undefined ||
      satang === undefined ||
      damagedQty === undefined ||
      deterioratedQty === undefined ||
      unnecessaryQty === undefined
    ) {
      return jsonError(
        `จำนวนในรายการที่ ${index + 1} ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`,
        400
      );
    }

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
      remark: parseText(rawRow.remark),
    });
  }

  /* =======================================================
     MATERIAL ID ห้ามซ้ำ
  ======================================================= */

  const materialIds = rows.map((row) => row.materialId);

  if (new Set(materialIds).size !== materialIds.length) {
    return jsonError(
      "พบรายการพัสดุซ้ำในข้อมูลที่ส่งมา",
      400
    );
  }

  /* =======================================================
     CHECK EXISTING INSPECTION
     1 ปีงบประมาณ = 1 รอบการตรวจ
  ======================================================= */

  const existingInspection =
    await prisma.stockCardInspection.findUnique({
      where: {
        fiscalYear,
      },
      select: {
        id: true,
      },
    });

  if (existingInspection) {
    return jsonError(
      `มีข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${fiscalYear} แล้ว`,
      409
    );
  }

  /* =======================================================
     CHECK INSPECTORS
  ======================================================= */

  const officers = await prisma.officer.findMany({
    where: {
      id: {
        in: validInspectorIds,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  if (officers.length !== validInspectorIds.length) {
    return jsonError(
      "ไม่พบข้อมูลคณะกรรมการตรวจสอบบางราย",
      400
    );
  }

  const officerMap = new Map(
    officers.map((officer) => [
      officer.id,
      officer,
    ])
  );

  const inspectorNames = validInspectorIds.map((id) => {
    const officer = officerMap.get(id);

    if (!officer) {
      return "";
    }

    return `${officer.firstName} ${officer.lastName}`.trim();
  });

  /* =======================================================
     CHECK MATERIALS
  ======================================================= */

  const materials = await prisma.material.findMany({
    where: {
      id: {
        in: materialIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (materials.length !== materialIds.length) {
    return jsonError(
      "ไม่พบข้อมูลพัสดุบางรายการ กรุณาเปิดหน้าใหม่แล้วลองอีกครั้ง",
      400
    );
  }

  /* =======================================================
     CREATE
     ใช้ Transaction เพื่อให้หัวรายการและทุกรายการย่อย
     ถูกบันทึกพร้อมกันทั้งหมด
  ======================================================= */

  try {
    const inspection = await prisma.$transaction(
      async (tx) => {
        const created =
          await tx.stockCardInspection.create({
            data: {
              fiscalYear,
              inspectionDate,
              inspectorIds: validInspectorIds,
              inspectorNames,
            },
            select: {
              id: true,
              fiscalYear: true,
              inspectionDate: true,
            },
          });

        await tx.stockCardInspectionRow.createMany({
          data: rows.map((row) => ({
            inspectionId: created.id,
            materialId: row.materialId,
            accuracy: row.accuracy,
            shortageQty: row.shortageQty,
            excessQty: row.excessQty,
            baht: row.baht,
            satang: row.satang,
            damagedQty: row.damagedQty,
            deterioratedQty: row.deterioratedQty,
            unnecessaryQty: row.unnecessaryQty,
            remark: row.remark,
          })),
        });

        return created;
      }
    );

    return NextResponse.json(
      {
        ok: true,
        message:
          "บันทึกผลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว",
        inspection: {
          id: inspection.id,
          fiscalYear: inspection.fiscalYear,
          inspectionDate: inspection.inspectionDate,
          rowCount: rows.length,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create stock card inspection error:",
      error
    );

    /*
     * เผื่อมี request ซ้ำเข้าพร้อมกัน
     * โดย fiscalYear มี @unique ใน schema
     */
    const duplicate =
      await prisma.stockCardInspection.findUnique({
        where: {
          fiscalYear,
        },
        select: {
          id: true,
        },
      });

    if (duplicate) {
      return jsonError(
        `มีข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${fiscalYear} แล้ว`,
        409
      );
    }

    return jsonError(
      "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบบัญชีพัสดุ",
      500
    );
  }
}
