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
accuracy: string;
status: string;
remark: string;
};

type InspectionRequestBody = {
departmentId: number;
inspectionStartDate: string;
inspectionEndDate: string;
inspectorIds: string[];
rows: InspectionRowInput[];
};

function parseDateOnly(value: string) {
const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

if (!match) {
return null;
}

const year = Number(match[1]);
const month = Number(match[2]);
const day = Number(match[3]);

const date = new Date(year, month - 1, day);

if (
date.getFullYear() !== year ||
date.getMonth() !== month - 1 ||
date.getDate() !== day
) {
return null;
}

return date;
}

function getFiscalYear(date: Date) {
const year = date.getFullYear();

return date.getMonth() >= 9
? year + 1 + 543
: year + 543;
}

function getQuarter(date: Date) {
const month = date.getMonth() + 1;

if (month >= 10 && month <= 12) {
return "Q1";
}

if (month >= 1 && month <= 3) {
return "Q2";
}

if (month >= 4 && month <= 6) {
return "Q3";
}

return "Q4";
}

export async function POST(request: Request) {
try {
// =====================================================
// ตรวจสอบ Session
// =====================================================


const cookieStore = await cookies();

const token =
  cookieStore.get("session")?.value ??
  cookieStore.get("token")?.value;

if (!token) {
  return NextResponse.json(
    {
      success: false,
      message: "ไม่ได้เข้าสู่ระบบ",
    },
    { status: 401 }
  );
}

let session;

try {
  session = await verifySession(token);
} catch {
  return NextResponse.json(
    {
      success: false,
      message: "Session ไม่ถูกต้องหรือหมดอายุ",
    },
    { status: 401 }
  );
}

// =====================================================
// เฉพาะ ADMIN
// =====================================================

if (session.role !== "ADMIN") {
  return NextResponse.json(
    {
      success: false,
      message: "ไม่มีสิทธิ์บันทึกผลการตรวจสอบ",
    },
    { status: 403 }
  );
}

// =====================================================
// อ่านข้อมูล
// =====================================================

const body = (await request.json()) as InspectionRequestBody;

const departmentId = Number(body.departmentId);

if (!Number.isInteger(departmentId) || departmentId <= 0) {
  return NextResponse.json(
    {
      success: false,
      message: "รหัสหน่วยงานไม่ถูกต้อง",
    },
    { status: 400 }
  );
}

const inspectionStartDate =
  parseDateOnly(body.inspectionStartDate);

const inspectionEndDate =
  parseDateOnly(body.inspectionEndDate);

if (!inspectionStartDate || !inspectionEndDate) {
  return NextResponse.json(
    {
      success: false,
      message: "วันที่ตรวจสอบไม่ถูกต้อง",
    },
    { status: 400 }
  );
}

if (inspectionEndDate < inspectionStartDate) {
  return NextResponse.json(
    {
      success: false,
      message: "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ",
    },
    { status: 400 }
  );
}

// =====================================================
// ตรวจสอบ Department
// =====================================================

const department = await prisma.department.findUnique({
  where: {
    id: departmentId,
  },
  select: {
    id: true,
    name: true,
  },
});

if (!department) {
  return NextResponse.json(
    {
      success: false,
      message: "ไม่พบหน่วยงานที่ระบุ",
    },
    { status: 404 }
  );
}

// =====================================================
// ตรวจสอบผู้ตรวจสอบ 5 คน
// =====================================================

if (!Array.isArray(body.inspectorIds)) {
  return NextResponse.json(
    {
      success: false,
      message: "ข้อมูลผู้ตรวจสอบไม่ถูกต้อง",
    },
    { status: 400 }
  );
}

if (body.inspectorIds.length !== 5) {
  return NextResponse.json(
    {
      success: false,
      message: "ต้องระบุผู้ตรวจสอบจำนวน 5 คน",
    },
    { status: 400 }
  );
}

const inspectorIds = body.inspectorIds.map((id) =>
  Number(id)
);

if (
  inspectorIds.some(
    (id) => !Number.isInteger(id) || id <= 0
  )
) {
  return NextResponse.json(
    {
      success: false,
      message: "รหัสผู้ตรวจสอบไม่ถูกต้อง",
    },
    { status: 400 }
  );
}

if (new Set(inspectorIds).size !== inspectorIds.length) {
  return NextResponse.json(
    {
      success: false,
      message: "ไม่สามารถเลือกผู้ตรวจสอบซ้ำกันได้",
    },
    { status: 400 }
  );
}

const officers = await prisma.officer.findMany({
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
});

if (officers.length !== inspectorIds.length) {
  return NextResponse.json(
    {
      success: false,
      message: "พบผู้ตรวจสอบบางรายไม่อยู่ในระบบ",
    },
    { status: 400 }
  );
}

const officerMap = new Map(
  officers.map((officer) => [
    officer.id,
    officer,
  ])
);

const inspectorNames = inspectorIds.map((id) => {
  const officer = officerMap.get(id);

  return officer
    ? `${officer.firstName} ${officer.lastName}`.trim()
    : "";
});

// =====================================================
// ตรวจสอบรายการครุภัณฑ์
// =====================================================

if (!Array.isArray(body.rows) || body.rows.length === 0) {
  return NextResponse.json(
    {
      success: false,
      message: "ไม่พบรายการครุภัณฑ์ที่ต้องการบันทึก",
    },
    { status: 400 }
  );
}

const assetIds = body.rows.map((row) =>
  Number(row.assetId)
);

if (
  assetIds.some(
    (id) => !Number.isInteger(id) || id <= 0
  )
) {
  return NextResponse.json(
    {
      success: false,
      message: "รหัสครุภัณฑ์ไม่ถูกต้อง",
    },
    { status: 400 }
  );
}

if (new Set(assetIds).size !== assetIds.length) {
  return NextResponse.json(
    {
      success: false,
      message: "มีรายการครุภัณฑ์ซ้ำกัน",
    },
    { status: 400 }
  );
}

const assets = await prisma.asset.findMany({
  where: {
    id: {
      in: assetIds,
    },
  },
  select: {
    id: true,
    departmentId: true,
  },
});

if (assets.length !== assetIds.length) {
  return NextResponse.json(
    {
      success: false,
      message: "พบครุภัณฑ์บางรายการไม่อยู่ในระบบ",
    },
    { status: 400 }
  );
}

const invalidDepartmentAsset = assets.some(
  (asset) => asset.departmentId !== departmentId
);

if (invalidDepartmentAsset) {
  return NextResponse.json(
    {
      success: false,
      message: "พบครุภัณฑ์ที่ไม่ได้อยู่ในหน่วยงานที่เลือก",
    },
    { status: 400 }
  );
}

// =====================================================
// ตรวจสอบข้อมูลแต่ละรายการ
// =====================================================

for (const row of body.rows) {
  const countedQty = Number(row.countedQty);

  if (
    !Number.isInteger(countedQty) ||
    countedQty < 0
  ) {
    return NextResponse.json(
      {
        success: false,
        message: `จำนวนที่ตรวจนับของครุภัณฑ์ ${row.assetId} ไม่ถูกต้อง`,
      },
      { status: 400 }
    );
  }

  if (
    !accuracyOptions.includes(
      row.accuracy as (typeof accuracyOptions)[number]
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message: `กรุณาระบุผลการตรวจนับของครุภัณฑ์ ${row.assetId}`,
      },
      { status: 400 }
    );
  }

  if (
    !inspectionStatuses.includes(
      row.status as (typeof inspectionStatuses)[number]
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message: `กรุณาระบุสถานะของครุภัณฑ์ ${row.assetId}`,
      },
      { status: 400 }
    );
  }
}

// =====================================================
// ปีงบประมาณ / ไตรมาส
// =====================================================

const fiscalYear =
  getFiscalYear(inspectionStartDate);

const quarter =
  getQuarter(inspectionStartDate);

// =====================================================
// บันทึกผลตรวจสอบ
// =====================================================

await prisma.$transaction(
  body.rows.map((row) => {
    const countedQty = Number(row.countedQty);

    const officerNames = inspectorNames.filter(
      (name) => name.length > 0
    );

    return prisma.assetInspection.upsert({
      where: {
        assetId_year_quarter: {
          assetId: Number(row.assetId),
          year: fiscalYear,
          quarter,
        },
      },
      create: {
        assetId: Number(row.assetId),
        year: fiscalYear,
        quarter,

        inspectionDate: inspectionEndDate,

        inspectionStartDate,
        inspectionEndDate,

        status:
          row.status as
            | "IN_USE"
            | "RETURNED"
            | "DAMAGED"
            | "MISSING"
            | "NOT_FOUND"
            | "DETERIORATED"
            | "UNUSABLE",

        countedQty,

        accuracy: row.accuracy,

        inspectorIds,
        inspectorNames: officerNames,

        inspectorName:
          officerNames.length > 0
            ? officerNames.join(", ")
            : null,

        condition: row.status,

        location: null,

        remark:
          row.remark?.trim()
            ? row.remark.trim()
            : null,
      },

      update: {
        inspectionDate: inspectionEndDate,

        inspectionStartDate,
        inspectionEndDate,

        status:
          row.status as
            | "IN_USE"
            | "RETURNED"
            | "DAMAGED"
            | "MISSING"
            | "NOT_FOUND"
            | "DETERIORATED"
            | "UNUSABLE",

        countedQty,

        accuracy: row.accuracy,

        inspectorIds,
        inspectorNames: officerNames,

        inspectorName:
          officerNames.length > 0
            ? officerNames.join(", ")
            : null,

        condition: row.status,

        remark:
          row.remark?.trim()
            ? row.remark.trim()
            : null,
      },
    });
  })
);

// =====================================================
// สำเร็จ
// =====================================================

return NextResponse.json({
  success: true,
  message: "บันทึกผลการตรวจสอบเรียบร้อยแล้ว",
  fiscalYear,
  quarter,
  department: {
    id: department.id,
    name: department.name,
  },
  savedCount: body.rows.length,
});


} catch (error) {
console.error(
"POST /api/assets/inspection error:",
error
);


return NextResponse.json(
  {
    success: false,
    message: "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ",
  },
  { status: 500 }
);


}
}
