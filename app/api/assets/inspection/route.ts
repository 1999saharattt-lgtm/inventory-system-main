import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

const inspectionStatuses = [
  "IN_USE",
  "DAMAGED",
  "DETERIORATED",
  "UNUSABLE",
] as const;

const accuracyOptions = [
  "CORRECT",
  "INCORRECT",
] as const;

type InspectionRowInput = {
  assetId: number;
  countedQty: string | number;
  accuracy: string | null;
  status: string | null;
  remark: string;
};

type AssetEditInput = {
  assetId: number;
  governmentAssetNo?: string | null;
  officeAssetNo?: string | null;
  location?: string | null;
  responsibleName?: string | null;
  category?: string;
  categoryDetail?: string | null;
  officerId?: number | null;
  sectionId?: number | null;
  name?: string;
  brand?: string | null;
  model?: string | null;
  unit?: string | null;
};

type InspectionRequestBody = {
  assetEdits?: AssetEditInput[];
  departmentId: number;
  inspectionStartDate: string;
  inspectionEndDate: string;
  inspectorIds: string[];
  rows: InspectionRowInput[];
};

function parseDateOnly(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const year = Number(
    match[1]
  );

  const month = Number(
    match[2]
  );

  const day = Number(
    match[3]
  );

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return date;
}

function getFiscalYear(
  date: Date
) {
  const year =
    date.getFullYear();

  return date.getMonth() >= 9
    ? year + 1 + 543
    : year + 543;
}

function getQuarter(
  date: Date
) {
  const month =
    date.getMonth() + 1;

  if (
    month >= 10 &&
    month <= 12
  ) {
    return "Q1";
  }

  if (
    month >= 1 &&
    month <= 3
  ) {
    return "Q2";
  }

  if (
    month >= 4 &&
    month <= 6
  ) {
    return "Q3";
  }

  return "Q4";
}

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       ตรวจสอบ Session
       ===================================================== */

    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "session"
      )?.value ??
      cookieStore.get(
        "token"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่ได้เข้าสู่ระบบ",
        },
        {
          status: 401,
        }
      );
    }

    let session;

    try {
      session =
        await verifySession(
          token
        );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Session ไม่ถูกต้องหรือหมดอายุ",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       เฉพาะ ADMIN
       ===================================================== */

    if (
      session.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่มีสิทธิ์บันทึกผลการตรวจสอบ",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       อ่านข้อมูล
       ===================================================== */

    const body =
      (await request.json()) as InspectionRequestBody;

    const departmentId =
      Number(
        body.departmentId
      );

    if (
      !Number.isInteger(
        departmentId
      ) ||
      departmentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รหัสหน่วยงานไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const inspectionStartDate =
      parseDateOnly(
        body.inspectionStartDate
      );

    const inspectionEndDate =
      parseDateOnly(
        body.inspectionEndDate
      );

    if (
      !inspectionStartDate ||
      !inspectionEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "วันที่ตรวจสอบไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (
      inspectionEndDate <
      inspectionStartDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ตรวจสอบ Department
       ===================================================== */

    const department =
      await prisma.department.findUnique(
        {
          where: {
            id: departmentId,
          },

          select: {
            id: true,
            name: true,
          },
        }
      );

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบหน่วยงานที่ระบุ",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       ตรวจสอบผู้ตรวจสอบ 5 คน
       ===================================================== */

    if (
      !Array.isArray(
        body.inspectorIds
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ข้อมูลผู้ตรวจสอบไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.inspectorIds
        .length !== 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ต้องระบุผู้ตรวจสอบจำนวน 5 คน",
        },
        {
          status: 400,
        }
      );
    }

    const inspectorIds =
      body.inspectorIds.map(
        (id) =>
          Number(id)
      );

    if (
      inspectorIds.some(
        (id) =>
          !Number.isInteger(
            id
          ) ||
          id <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รหัสผู้ตรวจสอบไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (
      new Set(
        inspectorIds
      ).size !==
      inspectorIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถเลือกผู้ตรวจสอบซ้ำกันได้",
        },
        {
          status: 400,
        }
      );
    }

    const officers =
      await prisma.officer.findMany(
        {
          where: {
            id: {
              in: inspectorIds,
            },
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        }
      );

    if (
      officers.length !==
      inspectorIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "พบผู้ตรวจสอบบางรายไม่อยู่ในระบบ",
        },
        {
          status: 400,
        }
      );
    }

    const officerMap =
      new Map(
        officers.map(
          (officer) => [
            officer.id,
            officer,
          ]
        )
      );

    const inspectorNames =
      inspectorIds.map(
        (id) => {
          const officer =
            officerMap.get(id);

          return officer
            ? `${officer.firstName} ${officer.lastName}`.trim()
            : "";
        }
      );

    const officerNames =
      inspectorNames.filter(
        (name) =>
          name.length > 0
      );

    /* =====================================================
       ตรวจสอบรายการครุภัณฑ์
       ===================================================== */

    if (
      !Array.isArray(
        body.rows
      ) ||
      body.rows.length ===
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรายการครุภัณฑ์ที่ต้องการบันทึก",
        },
        {
          status: 400,
        }
      );
    }

    const assetIds =
      body.rows.map(
        (row) =>
          Number(
            row.assetId
          )
      );

    if (
      assetIds.some(
        (id) =>
          !Number.isInteger(
            id
          ) ||
          id <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รหัสครุภัณฑ์ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (
      new Set(
        assetIds
      ).size !==
      assetIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "มีรายการครุภัณฑ์ซ้ำกัน",
        },
        {
          status: 400,
        }
      );
    }

    const assets =
      await prisma.asset.findMany(
        {
          where: {
            id: {
              in: assetIds,
            },
          },

          select: {
            id: true,
            departmentId: true,
          },
        }
      );

    if (
      assets.length !==
      assetIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "พบครุภัณฑ์บางรายการไม่อยู่ในระบบ",
        },
        {
          status: 400,
        }
      );
    }

    const invalidDepartmentAsset =
      assets.some(
        (asset) =>
          asset.departmentId !==
          departmentId
      );

    if (
      invalidDepartmentAsset
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "พบครุภัณฑ์ที่ไม่ได้อยู่ในหน่วยงานที่เลือก",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ตรวจสอบข้อมูลแต่ละรายการ
       ===================================================== */

    for (
      const row of
      body.rows
    ) {
      const countedQty =
        Number(
          row.countedQty
        );

      if (
        !Number.isInteger(
          countedQty
        ) ||
        countedQty < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `จำนวนที่ตรวจนับของครุภัณฑ์ ${row.assetId} ไม่ถูกต้อง`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        (row.accuracy ?? "").trim() !== "" &&
        !accuracyOptions.includes(
          row.accuracy as
            (typeof accuracyOptions)[number]
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `กรุณาระบุผลการตรวจนับของครุภัณฑ์ ${row.assetId}`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        (row.status ?? "").trim() !== "" &&
        !inspectionStatuses.includes(
          row.status as
            (typeof inspectionStatuses)[number]
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `กรุณาระบุสถานะของครุภัณฑ์ ${row.assetId}`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       ปีงบประมาณ / ไตรมาส
       ===================================================== */

    const assetEdits = body.assetEdits ?? [];
    if (!Array.isArray(assetEdits) || assetEdits.some((edit) => !assetIds.includes(Number(edit.assetId))) ||
        new Set(assetEdits.map((edit) => edit.assetId)).size !== assetEdits.length) {
      return NextResponse.json({ success: false, message: "รายการแก้ไขครุภัณฑ์ไม่ถูกต้อง" }, { status: 400 });
    }
    // ตรวจสอบความสัมพันธ์กลุ่มงานและผู้รับผิดชอบก่อนบันทึก
    const currentAssets = await prisma.asset.findMany({
      where: { id: { in: assetIds }, departmentId },
      select: { id: true, sectionId: true, officerId: true },
    });
    const currentAssetMap = new Map(currentAssets.map((asset) => [asset.id, asset]));
    const editedSectionIds = assetEdits
      .filter((edit) => edit.sectionId != null)
      .map((edit) => Number(edit.sectionId));
    if (editedSectionIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ success: false, message: "รหัสกลุ่ม/งานไม่ถูกต้อง" }, { status: 400 });
    }
    const validSections = await prisma.section.findMany({
      where: { id: { in: editedSectionIds }, departmentId },
      select: { id: true },
    });
    const validSectionIds = new Set(validSections.map((section) => section.id));
    if (editedSectionIds.some((id) => !validSectionIds.has(id))) {
      return NextResponse.json({ success: false, message: "กลุ่ม/งานที่เลือกไม่อยู่ในหน่วยงานนี้" }, { status: 400 });
    }
    const editOfficerIds = assetEdits
      .filter((edit) => edit.officerId != null)
      .map((edit) => Number(edit.officerId));
    if (editOfficerIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ success: false, message: "รหัสผู้รับผิดชอบไม่ถูกต้อง" }, { status: 400 });
    }
    const editedOfficers = await prisma.officer.findMany({
      where: { id: { in: editOfficerIds } },
      select: { id: true, sectionId: true, departmentId: true, section: { select: { departmentId: true } } },
    });
    const editedOfficerMap = new Map(editedOfficers.map((officer) => [officer.id, officer]));
    for (const edit of assetEdits) {
      const asset = currentAssetMap.get(Number(edit.assetId));
      if (!asset) {
        return NextResponse.json({ success: false, message: "ไม่พบครุภัณฑ์ที่ต้องการแก้ไข" }, { status: 400 });
      }
      const effectiveSectionId = edit.sectionId !== undefined ? edit.sectionId : asset.sectionId;
      const effectiveOfficerId = edit.officerId !== undefined ? edit.officerId : asset.officerId;
      if (effectiveOfficerId != null) {
        const officer = editedOfficerMap.get(Number(effectiveOfficerId)) ??
          (await prisma.officer.findUnique({
            where: { id: Number(effectiveOfficerId) },
            select: { id: true, sectionId: true, departmentId: true, section: { select: { departmentId: true } } },
          }));
        if (!officer || effectiveSectionId == null || officer.sectionId !== Number(effectiveSectionId) ||
            (officer.departmentId !== departmentId && officer.section?.departmentId !== departmentId)) {
          return NextResponse.json({ success: false, message: `ผู้รับผิดชอบของครุภัณฑ์ ${edit.assetId} ไม่ตรงกับกลุ่ม/งานที่เลือก` }, { status: 400 });
        }
      }
    }
    if (assetEdits.some((edit) => edit.name !== undefined && (typeof edit.name !== "string" || !edit.name.trim()))) {
      return NextResponse.json({ success: false, message: "ชื่อครุภัณฑ์ต้องไม่ว่าง" }, { status: 400 });
    }

    const fiscalYear =
      getFiscalYear(
        inspectionStartDate
      );

    const quarter =
      getQuarter(
        inspectionStartDate
      );

    /* =====================================================
       บันทึกผลตรวจสอบ

       เปลี่ยนเป็น Interactive Transaction
       เพื่อกำหนด timeout ได้

       maxWait = 10 วินาที
       timeout = 30 วินาที

       เวลาเริ่มนับเฉพาะตอน Transaction ทำงาน
       ไม่เกี่ยวกับเวลาที่ผู้ใช้กรอกข้อมูลบนหน้าเว็บ
       ===================================================== */

    await prisma.$transaction(
      async (tx) => {
        for (const edit of assetEdits) {
          await tx.asset.update({
            where: { id: Number(edit.assetId) },
            data: {
              ...(edit.governmentAssetNo !== undefined ? { governmentAssetNo: edit.governmentAssetNo?.trim() || null } : {}),
              ...(edit.officeAssetNo !== undefined ? { officeAssetNo: edit.officeAssetNo?.trim() || null } : {}),
              ...(edit.location !== undefined ? { location: edit.location?.trim() || null } : {}),
              ...(edit.responsibleName !== undefined ? { responsibleName: edit.responsibleName?.trim() || null } : {}),
              ...(edit.sectionId !== undefined ? { sectionId: edit.sectionId } : {}),
              ...(edit.categoryDetail !== undefined ? { categoryDetail: edit.categoryDetail?.trim() || null } : {}),
              ...(edit.officerId !== undefined ? { officerId: edit.officerId } : {}),
              ...(edit.name !== undefined ? { name: edit.name.trim() } : {}),
              ...(edit.brand !== undefined ? { brand: edit.brand?.trim() || null } : {}),
              ...(edit.model !== undefined ? { model: edit.model?.trim() || null } : {}),
              ...(edit.unit !== undefined ? { unit: edit.unit?.trim() || null } : {}),
            },
          });
        }
        for (
          const row of
          body.rows
        ) {
          const countedQty =
            Number(
              row.countedQty
            );

          await tx.assetInspection.upsert(
            {
              where: {
                assetId_year_quarter:
                  {
                    assetId:
                      Number(
                        row.assetId
                      ),

                    year:
                      fiscalYear,

                    quarter,
                  },
              },

              create: {
                assetId:
                  Number(
                    row.assetId
                  ),

                year:
                  fiscalYear,

                quarter,

                inspectionDate:
                  inspectionEndDate,

                inspectionStartDate,

                inspectionEndDate,

                status: (row.status?.trim() || null) as
                  | "IN_USE"
                  | "DAMAGED"
                  | "DETERIORATED"
                  | "UNUSABLE"
                  | null,

                countedQty,

                accuracy:
                  row.accuracy?.trim() || null,

                inspectorIds,

                inspectorNames:
                  officerNames,

                inspectorName:
                  officerNames.length >
                  0
                    ? officerNames.join(
                        ", "
                      )
                    : null,

                condition:
                  row.status?.trim() || null,

                location:
                  null,

                remark:
                  row.remark?.trim()
                    ? row.remark.trim()
                    : null,
              },

              update: {
                inspectionDate:
                  inspectionEndDate,

                inspectionStartDate,

                inspectionEndDate,

                status: (row.status?.trim() || null) as
                  | "IN_USE"
                  | "DAMAGED"
                  | "DETERIORATED"
                  | "UNUSABLE"
                  | null,

                countedQty,

                accuracy:
                  row.accuracy?.trim() || null,

                inspectorIds,

                inspectorNames:
                  officerNames,

                inspectorName:
                  officerNames.length >
                  0
                    ? officerNames.join(
                        ", "
                      )
                    : null,

                condition:
                  row.status?.trim() || null,

                remark:
                  row.remark?.trim()
                    ? row.remark.trim()
                    : null,
              },
            }
          );
        }
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      }
    );

    /* =====================================================
       สำเร็จ
       ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "บันทึกผลการตรวจสอบเรียบร้อยแล้ว",

        fiscalYear,

        quarter,

        department: {
          id: department.id,
          name: department.name,
        },

        savedCount:
          body.rows.length,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/assets/inspection error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ",
      },
      {
        status: 500,
      }
    );
  }
}
