import { prisma } from "../lib/prisma";

import {
  DEPARTMENT_1_ID,
  DEPARTMENT_1_NAME,
  department1Assets,
  type Department1AssetData,
} from "./asset-data/department-1";

/* =========================================================
   สถิติการ Import
   ========================================================= */

type ImportStats = {
  total: number;
  created: number;
  updated: number;
  failed: number;

  sectionMatched: number;
  officerMatched: number;
  responsibleOnly: number;

  duplicateSourceGovernmentNo: number;
  duplicateSourceOfficeNo: number;
};

/* =========================================================
   จัดรูปแบบข้อความ
   ========================================================= */

function normalizeText(
  value: string | null | undefined
): string {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .trim();
}

/* =========================================================
   จัดรูปแบบชื่อบุคคล
   ========================================================= */

function normalizePersonName(
  value: string | null | undefined
): string {
  return normalizeText(value)
    .replace(/^(นาย|นางสาว|นาง)\s*/u, "")
    .trim();
}

/* =========================================================
   ปรับชื่อผู้รับผิดชอบตามที่กำหนด

   งานธุรการ / เจ้าหน้าที่
   งานธุรการ/เจ้าหน้าที่
   งานธุรการ
   -> งานสารบรรณ
   ========================================================= */

function normalizeResponsibleName(
  value: string | null | undefined
): string {
  const normalized = normalizeText(value);

  if (!normalized || normalized === "-") {
    return "";
  }

  const compact = normalized.replace(/\s/g, "");

  if (
    compact === "งานธุรการ/เจ้าหน้าที่" ||
    compact === "งานธุรการ"
  ) {
    return "งานสารบรรณ";
  }

  return normalized;
}

/* =========================================================
   แยกข้อมูลผู้รับผิดชอบ
   ========================================================= */

function parseResponsibleName(
  value: string | null | undefined
) {
  const original = normalizeResponsibleName(value);

  if (!original) {
    return {
      original: "",
      officerName: "",
      sectionName: "",
      singleValue: "",
    };
  }

  const parts = original
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      original,
      officerName: parts[0],
      sectionName: parts.slice(1).join(" / "),
      singleValue: "",
    };
  }

  return {
    original,
    officerName: "",
    sectionName: "",
    singleValue: original,
  };
}

/* =========================================================
   นับรหัสซ้ำในต้นฉบับ

   หมายเหตุ:
   schema ล่าสุดอนุญาตให้ governmentAssetNo และ
   officeAssetNo ซ้ำได้แล้ว

   ส่วนนี้ใช้สำหรับ "รายงานสถิติ" เท่านั้น
   จะไม่ทำรหัสซ้ำเป็น null
   ========================================================= */

function buildSourceCodeCounts() {
  const governmentCounts = new Map<string, number>();
  const officeCounts = new Map<string, number>();

  for (const asset of department1Assets) {
    const governmentAssetNo = normalizeText(
      asset.governmentAssetNo
    );

    const officeAssetNo = normalizeText(
      asset.officeAssetNo
    );

    if (governmentAssetNo) {
      governmentCounts.set(
        governmentAssetNo,
        (governmentCounts.get(governmentAssetNo) ?? 0) + 1
      );
    }

    if (officeAssetNo) {
      officeCounts.set(
        officeAssetNo,
        (officeCounts.get(officeAssetNo) ?? 0) + 1
      );
    }
  }

  return {
    governmentCounts,
    officeCounts,
  };
}

/* =========================================================
   หา Asset เดิมด้วย sourceOrder

   Marker:
   SOURCE:DEPARTMENT_1:<sourceOrder>

   ทำให้รัน Import ซ้ำแล้วเป็น UPDATE
   ไม่สร้างรายการเพิ่ม
   ========================================================= */

async function findExistingAssetBySourceOrder(
  sourceOrder: number
) {
  const marker = `SOURCE:DEPARTMENT_1:${sourceOrder}`;

  return prisma.asset.findFirst({
    where: {
      departmentId: DEPARTMENT_1_ID,
      remark: {
        contains: marker,
      },
    },
    select: {
      id: true,
    },
  });
}

/* =========================================================
   อ่าน quantity จากต้นฉบับอย่างปลอดภัย

   รองรับกรณี Department1AssetData เดิมยังไม่มี quantity
   ========================================================= */

function getAssetQuantity(
  asset: Department1AssetData
): number {
  const source = asset as Department1AssetData & {
    quantity?: number | string | null;
  };

  const value = Number(source.quantity ?? 1);

  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.trunc(value);
}

/* =========================================================
   อ่าน unit จากต้นฉบับ
   ========================================================= */

function getAssetUnit(
  asset: Department1AssetData
): string | null {
  const value = normalizeText(asset.unit);

  return value || null;
}

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log(
    "======================================================"
  );
  console.log(" นำเข้าครุภัณฑ์กลุ่มอำนวยการ");
  console.log(" จากทะเบียนต้นฉบับ 446 รายการ");
  console.log(
    "======================================================"
  );

  console.log(`Department ID : ${DEPARTMENT_1_ID}`);
  console.log(`Department    : ${DEPARTMENT_1_NAME}`);
  console.log(
    `จำนวนต้นฉบับ : ${department1Assets.length} รายการ`
  );
  console.log("");

  /* =======================================================
     1. ตรวจสอบ Department
     ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: DEPARTMENT_1_ID,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!department) {
    throw new Error(
      `ไม่พบ Department ID ${DEPARTMENT_1_ID} กรุณาสร้าง "${DEPARTMENT_1_NAME}" ในฐานข้อมูลก่อน`
    );
  }

  if (
    normalizeText(department.name) !==
    normalizeText(DEPARTMENT_1_NAME)
  ) {
    throw new Error(
      [
        `Department ID ${DEPARTMENT_1_ID} ไม่ตรงกับข้อมูลต้นฉบับ`,
        `ฐานข้อมูล : "${department.name}"`,
        `ไฟล์       : "${DEPARTMENT_1_NAME}"`,
        "ยกเลิกการ Import เพื่อป้องกันข้อมูลเข้าผิดกลุ่ม",
      ].join("\n")
    );
  }

  console.log(`✓ พบ Department: ${department.name}`);

  /* =======================================================
     2. โหลด Section
     ======================================================= */

  const sections =
    await prisma.section.findMany({
      where: {
        departmentId: DEPARTMENT_1_ID,
      },
      select: {
        id: true,
        name: true,
      },
    });

  console.log(`✓ พบ Section: ${sections.length} รายการ`);

  /* =======================================================
     3. โหลด Officer
     ======================================================= */

  const officers =
    await prisma.officer.findMany({
      where: {
        departmentId: DEPARTMENT_1_ID,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        sectionId: true,
      },
    });

  console.log(`✓ พบ Officer: ${officers.length} คน`);
  console.log("");

  /* =======================================================
     4. Section Map
     ======================================================= */

  const sectionMap = new Map<string, number>();

  for (const section of sections) {
    const key = normalizeText(section.name);

    if (key) {
      sectionMap.set(key, section.id);
    }
  }

  /* =======================================================
     เพิ่ม alias งานธุรการ -> งานสารบรรณ

     ถ้าในฐานข้อมูลมี Section "งานสารบรรณ"
     ข้อมูลต้นฉบับที่เป็นงานธุรการจะชี้มาที่ Section นี้
     ======================================================= */

  const correspondenceSectionId =
    sectionMap.get("งานสารบรรณ");

  if (correspondenceSectionId !== undefined) {
    sectionMap.set(
      "งานธุรการ",
      correspondenceSectionId
    );

    sectionMap.set(
      "งานธุรการ / เจ้าหน้าที่",
      correspondenceSectionId
    );
  }

  /* =======================================================
     5. Officer Map
     ======================================================= */

  const officerMap = new Map<
    string,
    {
      id: number;
      sectionId: number | null;
    }
  >();

  for (const officer of officers) {
    const fullName = normalizePersonName(
      `${officer.firstName} ${officer.lastName}`
    );

    if (!fullName) {
      continue;
    }

    officerMap.set(fullName, {
      id: officer.id,
      sectionId: officer.sectionId,
    });
  }

  /* =======================================================
     6. ตรวจรหัสซ้ำในต้นฉบับ
     ======================================================= */

  const {
    governmentCounts,
    officeCounts,
  } = buildSourceCodeCounts();

  const duplicateGovernmentCodes = [
    ...governmentCounts.entries(),
  ].filter(([, count]) => count > 1);

  const duplicateOfficeCodes = [
    ...officeCounts.entries(),
  ].filter(([, count]) => count > 1);

  console.log(
    `รหัส GFMIS ซ้ำในต้นฉบับ     : ${duplicateGovernmentCodes.length} รหัส`
  );

  console.log(
    `รหัสครุภัณฑ์ซ้ำในต้นฉบับ   : ${duplicateOfficeCodes.length} รหัส`
  );

  console.log("");

  /* =======================================================
     7. สถิติ
     ======================================================= */

  const stats: ImportStats = {
    total: department1Assets.length,
    created: 0,
    updated: 0,
    failed: 0,

    sectionMatched: 0,
    officerMatched: 0,
    responsibleOnly: 0,

    duplicateSourceGovernmentNo:
      duplicateGovernmentCodes.length,

    duplicateSourceOfficeNo:
      duplicateOfficeCodes.length,
  };

  /* =======================================================
     8. Import ทีละรายการ
     ======================================================= */

  for (const asset of department1Assets) {
    try {
      await importAsset(
        asset,
        sectionMap,
        officerMap,
        stats
      );
    } catch (error) {
      stats.failed += 1;

      console.error(
        `❌ ${asset.sourceOrder}. นำเข้าไม่สำเร็จ: ${asset.name}`
      );

      console.error(error);
    }
  }

  /* =======================================================
     9. ตรวจฐานข้อมูลหลัง Import
     ======================================================= */

  const totalAfterImport =
    await prisma.asset.count({
      where: {
        departmentId: DEPARTMENT_1_ID,
      },
    });

  const importedAfterImport =
    await prisma.asset.count({
      where: {
        departmentId: DEPARTMENT_1_ID,
        remark: {
          contains: "SOURCE:DEPARTMENT_1:",
        },
      },
    });

  /* =======================================================
     10. ตรวจจำนวนข้อมูลที่มีค่า
     ======================================================= */

  const assetsAfterImport =
    await prisma.asset.findMany({
      where: {
        departmentId: DEPARTMENT_1_ID,
        remark: {
          contains: "SOURCE:DEPARTMENT_1:",
        },
      },
      select: {
        id: true,
        governmentAssetNo: true,
        officeAssetNo: true,
        quantity: true,
        unit: true,
        responsibleName: true,
      },
    });

  const governmentCodeCount =
    assetsAfterImport.filter(
      (item) =>
        normalizeText(item.governmentAssetNo) !== ""
    ).length;

  const officeCodeCount =
    assetsAfterImport.filter(
      (item) =>
        normalizeText(item.officeAssetNo) !== ""
    ).length;

  const unitCount =
    assetsAfterImport.filter(
      (item) =>
        normalizeText(item.unit) !== ""
    ).length;

  const responsibleCount =
    assetsAfterImport.filter(
      (item) =>
        normalizeText(item.responsibleName) !== ""
    ).length;

  /* =======================================================
     11. สรุปผล
     ======================================================= */

  console.log("");
  console.log(
    "======================================================"
  );
  console.log(" สรุปผลการนำเข้า");
  console.log(
    "======================================================"
  );

  console.log(
    `ต้นฉบับทั้งหมด              : ${stats.total}`
  );
  console.log(
    `สร้างใหม่                    : ${stats.created}`
  );
  console.log(
    `อัปเดต                       : ${stats.updated}`
  );
  console.log(
    `ผิดพลาด                      : ${stats.failed}`
  );

  console.log("");

  console.log(
    `จับคู่ Section สำเร็จ        : ${stats.sectionMatched}`
  );
  console.log(
    `จับคู่ Officer สำเร็จ        : ${stats.officerMatched}`
  );
  console.log(
    `เก็บผู้รับผิดชอบตามต้นฉบับ : ${stats.responsibleOnly}`
  );

  console.log("");

  console.log(
    `รหัส GFMIS ซ้ำในต้นฉบับ     : ${stats.duplicateSourceGovernmentNo} รหัส`
  );
  console.log(
    `รหัสครุภัณฑ์ซ้ำในต้นฉบับ   : ${stats.duplicateSourceOfficeNo} รหัส`
  );

  console.log("");

  console.log(
    "======================================================"
  );
  console.log(" ตรวจข้อมูลหลัง Import");
  console.log(
    "======================================================"
  );

  console.log(
    `Department 1 ทั้งหมด        : ${totalAfterImport}`
  );

  console.log(
    `รายการที่มี Source Marker   : ${importedAfterImport}`
  );

  console.log(
    `รายการที่มี GFMIS           : ${governmentCodeCount}`
  );

  console.log(
    `รายการที่มีรหัสครุภัณฑ์     : ${officeCodeCount}`
  );

  console.log(
    `รายการที่มีหน่วย            : ${unitCount}`
  );

  console.log(
    `รายการที่มีผู้รับผิดชอบ     : ${responsibleCount}`
  );

  console.log("");

  const processed =
    stats.created +
    stats.updated +
    stats.failed;

  if (processed !== stats.total) {
    console.warn(
      `⚠ จำนวนผลลัพธ์ไม่ตรงกับต้นฉบับ: ${processed}/${stats.total}`
    );
  }

  if (stats.failed === 0) {
    console.log(
      `✅ ประมวลผลครบ ${stats.total} รายการ ไม่มีรายการผิดพลาด`
    );
  } else {
    console.warn(
      `⚠ มีรายการผิดพลาด ${stats.failed} รายการ`
    );
  }

  console.log("");
  console.log(
    "======================================================"
  );
  console.log(" เสร็จสิ้น");
  console.log(
    "======================================================"
  );
}

/* =========================================================
   IMPORT ASSET
   ========================================================= */

async function importAsset(
  asset: Department1AssetData,

  sectionMap: Map<string, number>,

  officerMap: Map<
    string,
    {
      id: number;
      sectionId: number | null;
    }
  >,

  stats: ImportStats
) {
  /* =======================================================
     1. ผู้รับผิดชอบ
     ======================================================= */

  const responsible = parseResponsibleName(
    asset.responsibleName
  );

  let sectionId: number | null = null;
  let officerId: number | null = null;

  let sectionMatched = false;
  let officerMatched = false;

  /* =======================================================
     2. กรณีมีข้อมูลแบบ A / B
     ======================================================= */

  if (responsible.sectionName) {
    const rightSectionId = sectionMap.get(
      normalizeText(responsible.sectionName)
    );

    if (rightSectionId !== undefined) {
      sectionId = rightSectionId;
      sectionMatched = true;
    }

    if (sectionId === null) {
      const leftSectionId = sectionMap.get(
        normalizeText(responsible.officerName)
      );

      if (leftSectionId !== undefined) {
        sectionId = leftSectionId;
        sectionMatched = true;
      }
    }
  }

  /* =======================================================
     3. ลองจับ Officer
     ======================================================= */

  if (responsible.officerName) {
    const matchedOfficer = officerMap.get(
      normalizePersonName(
        responsible.officerName
      )
    );

    if (matchedOfficer) {
      officerId = matchedOfficer.id;
      officerMatched = true;

      if (
        sectionId === null &&
        matchedOfficer.sectionId !== null
      ) {
        sectionId = matchedOfficer.sectionId;
      }
    }
  }

  /* =======================================================
     4. กรณีผู้รับผิดชอบเป็นข้อความเดียว
     ======================================================= */

  if (responsible.singleValue) {
    const singleValue = normalizeText(
      responsible.singleValue
    );

    const matchedSectionId =
      sectionMap.get(singleValue);

    if (matchedSectionId !== undefined) {
      sectionId = matchedSectionId;
      sectionMatched = true;
    } else {
      const matchedOfficer = officerMap.get(
        normalizePersonName(singleValue)
      );

      if (matchedOfficer) {
        officerId = matchedOfficer.id;
        officerMatched = true;

        if (
          matchedOfficer.sectionId !== null
        ) {
          sectionId =
            matchedOfficer.sectionId;
        }
      }
    }
  }

  /* =======================================================
     นับสถิติครั้งเดียวต่อ Asset
     ======================================================= */

  if (sectionMatched) {
    stats.sectionMatched += 1;
  }

  if (officerMatched) {
    stats.officerMatched += 1;
  }

  if (
    responsible.original &&
    !sectionMatched &&
    !officerMatched
  ) {
    stats.responsibleOnly += 1;
  }

  /* =======================================================
     5. ข้อมูลจากต้นฉบับ
     ======================================================= */

  const governmentAssetNo =
    normalizeText(
      asset.governmentAssetNo
    ) || null;

  const officeAssetNo =
    normalizeText(
      asset.officeAssetNo
    ) || null;

  const quantity = getAssetQuantity(asset);

  const unit = getAssetUnit(asset);

  /* =======================================================
     6. หา Asset เดิม
     ======================================================= */

  const existingAsset =
    await findExistingAssetBySourceOrder(
      asset.sourceOrder
    );

  /* =======================================================
     7. Remark

     ไม่ทำรหัสซ้ำเป็น null อีกแล้ว
     เพราะ schema ล่าสุดอนุญาตให้ซ้ำ
     ======================================================= */

  const sourceMarker =
    `SOURCE:DEPARTMENT_1:${asset.sourceOrder}`;

  const remark = [
    sourceMarker,

    "นำเข้าจากทะเบียนกลุ่มอำนวยการ ปี 2568",

    `ลำดับต้นฉบับ ${asset.sourceOrder}`,

    asset.sourcePage !== null &&
    asset.sourcePage !== undefined
      ? `หน้า ${asset.sourcePage}`
      : null,

    `จำนวน ${quantity}`,

    unit
      ? `หน่วยนับ ${unit}`
      : null,

    governmentAssetNo
      ? `GFMIS ต้นฉบับ ${governmentAssetNo}`
      : null,

    officeAssetNo
      ? `รหัสครุภัณฑ์ต้นฉบับ ${officeAssetNo}`
      : null,

    asset.sourceCondition
      ? `สภาพต้นฉบับ ${normalizeText(
          asset.sourceCondition
        )}`
      : null,

    asset.sourceRemark
      ? `หมายเหตุต้นฉบับ ${normalizeText(
          asset.sourceRemark
        )}`
      : null,
  ]
    .filter(
      (value): value is string =>
        Boolean(value)
    )
    .join(" | ");

  /* =======================================================
     8. ข้อมูลที่จะบันทึก

     จุดสำคัญ:
     - quantity ลง DB
     - unit ลง DB
     - GFMIS ลง DB ตรง ๆ
     - รหัสครุภัณฑ์ลง DB ตรง ๆ
     - responsibleName ลง DB
     ======================================================= */

  const data = {
    name: normalizeText(asset.name),

    category: asset.category,

    quantity,

    unit,

    governmentAssetNo,

    officeAssetNo,

    departmentId:
      DEPARTMENT_1_ID,

    sectionId,

    officerId,

    responsibleName:
      responsible.original || null,

    status:
      asset.status,

    remark,
  };

  /* =======================================================
     9. UPDATE
     ======================================================= */

  if (existingAsset) {
    await prisma.asset.update({
      where: {
        id: existingAsset.id,
      },
      data,
    });

    stats.updated += 1;

    console.log(
      `🔄 ${asset.sourceOrder}. อัปเดต: ${asset.name}`
    );

    return;
  }

  /* =======================================================
     10. CREATE
     ======================================================= */

  await prisma.asset.create({
    data,
  });

  stats.created += 1;

  console.log(
    `✅ ${asset.sourceOrder}. เพิ่ม: ${asset.name}`
  );
}

/* =========================================================
   RUN
   ========================================================= */

main()
  .catch((error) => {
    console.error("");

    console.error(
      "======================================================"
    );

    console.error(" IMPORT FAILED");

    console.error(
      "======================================================"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });