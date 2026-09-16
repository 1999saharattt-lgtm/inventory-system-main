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
   แยกข้อมูลผู้รับผิดชอบ

   รองรับ:
   - ชื่อบุคคล / ชื่องาน
   - งาน...
   - ห้อง...
   - ข้อความอื่นตามต้นฉบับ

   responsibleName ต้นฉบับจะถูกเก็บลง Asset เสมอ
   ========================================================= */

function parseResponsibleName(
  value: string | null | undefined
) {
  const original = normalizeText(value);

  if (!original || original === "-") {
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
   ตรวจรหัสซ้ำภายในไฟล์ต้นฉบับ

   สำคัญ:
   schema ปัจจุบันกำหนด governmentAssetNo / officeAssetNo
   เป็น unique ดังนั้นรหัสที่ซ้ำใน Excel ไม่สามารถบันทึก
   ซ้ำลง column unique ได้

   แนวทาง:
   - occurrence แรกเก็บรหัสตามต้นฉบับใน column
   - occurrence ถัดไปเก็บ null ใน column unique
   - รหัสต้นฉบับยังเก็บครบใน remark
   - ใช้ sourceOrder ใน remark เพื่อระบุแต่ละแถว
   ========================================================= */

function buildSourceCodeCounts() {
  const governmentCounts = new Map<string, number>();
  const officeCounts = new Map<string, number>();

  for (const asset of department1Assets) {
    const governmentAssetNo =
      normalizeText(asset.governmentAssetNo);

    const officeAssetNo =
      normalizeText(asset.officeAssetNo);

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
   หา Asset เดิมจาก sourceOrder

   Import รุ่นนี้ใส่ marker:
   SOURCE:DEPARTMENT_1:<sourceOrder>

   ทำให้รันซ้ำได้โดยไม่สร้างรายการเพิ่ม
   และไม่ต้องพึ่งรหัสที่อาจซ้ำใน Excel
   ========================================================= */

async function findExistingAssetBySourceOrder(
  sourceOrder: number
) {
  const marker =
    `SOURCE:DEPARTMENT_1:${sourceOrder}`;

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
   ตรวจว่ารหัส unique ถูก Asset อื่นใช้อยู่หรือไม่
   ========================================================= */

async function isGovernmentNoUsedByOtherAsset(
  governmentAssetNo: string,
  currentAssetId: number | null
) {
  const found =
    await prisma.asset.findUnique({
      where: {
        governmentAssetNo,
      },
      select: {
        id: true,
      },
    });

  return Boolean(
    found &&
      (currentAssetId === null ||
        found.id !== currentAssetId)
  );
}

async function isOfficeNoUsedByOtherAsset(
  officeAssetNo: string,
  currentAssetId: number | null
) {
  const found =
    await prisma.asset.findUnique({
      where: {
        officeAssetNo,
      },
      select: {
        id: true,
      },
    });

  return Boolean(
    found &&
      (currentAssetId === null ||
        found.id !== currentAssetId)
  );
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

  const sectionMap =
    new Map<string, number>();

  for (const section of sections) {
    const key =
      normalizeText(section.name);

    if (key) {
      sectionMap.set(
        key,
        section.id
      );
    }
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
    const fullName =
      normalizePersonName(
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

  const duplicateGovernmentCodes =
    [...governmentCounts.entries()].filter(
      ([, count]) => count > 1
    );

  const duplicateOfficeCodes =
    [...officeCounts.entries()].filter(
      ([, count]) => count > 1
    );

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
     8. ใช้ Set คุม occurrence ของรหัสซ้ำ
     ======================================================= */

  const seenGovernmentCodes =
    new Set<string>();

  const seenOfficeCodes =
    new Set<string>();

  /* =======================================================
     9. Import ทีละรายการ
     ======================================================= */

  for (const asset of department1Assets) {
    try {
      await importAsset(
        asset,
        sectionMap,
        officerMap,
        governmentCounts,
        officeCounts,
        seenGovernmentCodes,
        seenOfficeCodes,
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
     10. สรุปผล
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

  governmentCounts: Map<string, number>,

  officeCounts: Map<string, number>,

  seenGovernmentCodes: Set<string>,

  seenOfficeCodes: Set<string>,

  stats: ImportStats
) {
  /* =======================================================
     1. ผู้รับผิดชอบ
     ======================================================= */

  const responsible =
    parseResponsibleName(
      asset.responsibleName
    );

  let sectionId: number | null =
    null;

  let officerId: number | null =
    null;

  let matchedResponsible = false;

  /* =======================================================
     2. กรณี "ชื่อบุคคล / ชื่องาน"

     หมายเหตุ:
     ถ้าข้อมูลต้นฉบับเป็น "งานธุรการ/เจ้าหน้าที่"
     ส่วนแรกอาจเป็น Section ไม่ใช่ชื่อบุคคล
     จึงลองจับ Section ทั้งสองฝั่งก่อน
     ======================================================= */

  if (responsible.sectionName) {
    const rightSectionId =
      sectionMap.get(
        normalizeText(
          responsible.sectionName
        )
      );

    if (rightSectionId !== undefined) {
      sectionId = rightSectionId;
      stats.sectionMatched += 1;
      matchedResponsible = true;
    }

    if (sectionId === null) {
      const leftSectionId =
        sectionMap.get(
          normalizeText(
            responsible.officerName
          )
        );

      if (leftSectionId !== undefined) {
        sectionId = leftSectionId;
        stats.sectionMatched += 1;
        matchedResponsible = true;
      }
    }
  }

  /* =======================================================
     3. ลองจับ Officer
     ======================================================= */

  if (responsible.officerName) {
    const matchedOfficer =
      officerMap.get(
        normalizePersonName(
          responsible.officerName
        )
      );

    if (matchedOfficer) {
      officerId =
        matchedOfficer.id;

      stats.officerMatched += 1;
      matchedResponsible = true;

      if (
        sectionId === null &&
        matchedOfficer.sectionId !== null
      ) {
        sectionId =
          matchedOfficer.sectionId;
      }
    }
  }

  /* =======================================================
     4. กรณีข้อความเดียว
     ======================================================= */

  if (responsible.singleValue) {
    const singleValue =
      normalizeText(
        responsible.singleValue
      );

    const matchedSectionId =
      sectionMap.get(singleValue);

    if (matchedSectionId !== undefined) {
      sectionId = matchedSectionId;

      stats.sectionMatched += 1;
      matchedResponsible = true;
    } else {
      const matchedOfficer =
        officerMap.get(
          normalizePersonName(
            singleValue
          )
        );

      if (matchedOfficer) {
        officerId =
          matchedOfficer.id;

        stats.officerMatched += 1;
        matchedResponsible = true;

        if (
          matchedOfficer.sectionId !== null
        ) {
          sectionId =
            matchedOfficer.sectionId;
        }
      }
    }
  }

  if (
    responsible.original &&
    !matchedResponsible
  ) {
    stats.responsibleOnly += 1;
  }

  /* =======================================================
     5. รหัสต้นฉบับ
     ======================================================= */

  const originalGovernmentAssetNo =
    normalizeText(
      asset.governmentAssetNo
    ) || null;

  const originalOfficeAssetNo =
    normalizeText(
      asset.officeAssetNo
    ) || null;

  /* =======================================================
     6. หา Asset เดิมจาก sourceOrder ก่อน

     วิธีนี้ทำให้ Import ซ้ำได้โดยไม่สร้าง 446 รายการใหม่
     ======================================================= */

  const existingAsset =
    await findExistingAssetBySourceOrder(
      asset.sourceOrder
    );

  const existingAssetId =
    existingAsset?.id ?? null;

  /* =======================================================
     7. จัดการรหัสซ้ำจาก Excel

     ถ้ารหัสเดียวกันปรากฏมากกว่า 1 แถว:
     - แถวแรกเก็บรหัสลง column unique
     - แถวถัดไปเก็บ null
     - รหัสต้นฉบับยังอยู่ใน remark ทุกแถว

     ถ้ารหัสถูก record อื่นใน DB ใช้อยู่แล้ว:
     - ไม่ overwrite record อื่น
     - เก็บ null ใน column unique
     - เก็บค่าต้นฉบับใน remark
     ======================================================= */

  let governmentAssetNo =
    originalGovernmentAssetNo;

  let officeAssetNo =
    originalOfficeAssetNo;

  if (originalGovernmentAssetNo) {
    const sourceCount =
      governmentCounts.get(
        originalGovernmentAssetNo
      ) ?? 0;

    const alreadySeen =
      seenGovernmentCodes.has(
        originalGovernmentAssetNo
      );

    const usedByOtherAsset =
      await isGovernmentNoUsedByOtherAsset(
        originalGovernmentAssetNo,
        existingAssetId
      );

    if (
      (sourceCount > 1 && alreadySeen) ||
      usedByOtherAsset
    ) {
      governmentAssetNo = null;
    }

    seenGovernmentCodes.add(
      originalGovernmentAssetNo
    );
  }

  if (originalOfficeAssetNo) {
    const sourceCount =
      officeCounts.get(
        originalOfficeAssetNo
      ) ?? 0;

    const alreadySeen =
      seenOfficeCodes.has(
        originalOfficeAssetNo
      );

    const usedByOtherAsset =
      await isOfficeNoUsedByOtherAsset(
        originalOfficeAssetNo,
        existingAssetId
      );

    if (
      (sourceCount > 1 && alreadySeen) ||
      usedByOtherAsset
    ) {
      officeAssetNo = null;
    }

    seenOfficeCodes.add(
      originalOfficeAssetNo
    );
  }

  /* =======================================================
     8. Remark

     เก็บข้อมูลต้นฉบับที่จำเป็นสำหรับตรวจย้อนหลังครบ:
     - marker sourceOrder
     - หน้า
     - หน่วย
     - GFMIS ต้นฉบับ
     - รหัสครุภัณฑ์ต้นฉบับ
     - สภาพจากต้นฉบับ
     - หมายเหตุต้นฉบับ
     ======================================================= */

  const sourceMarker =
    `SOURCE:DEPARTMENT_1:${asset.sourceOrder}`;

  const remark = [
    sourceMarker,

    "นำเข้าจากทะเบียนกลุ่มอำนวยการ ปี 2568",

    `ลำดับต้นฉบับ ${asset.sourceOrder}`,

    asset.sourcePage !== null
      ? `หน้า ${asset.sourcePage}`
      : null,

    asset.unit
      ? `หน่วยนับ ${normalizeText(asset.unit)}`
      : null,

    originalGovernmentAssetNo
      ? `GFMIS ต้นฉบับ ${originalGovernmentAssetNo}`
      : null,

    originalOfficeAssetNo
      ? `รหัสครุภัณฑ์ต้นฉบับ ${originalOfficeAssetNo}`
      : null,

    asset.sourceCondition
      ? `สภาพต้นฉบับ ${normalizeText(asset.sourceCondition)}`
      : null,

    asset.sourceRemark
      ? `หมายเหตุต้นฉบับ ${normalizeText(asset.sourceRemark)}`
      : null,

    originalGovernmentAssetNo &&
    governmentAssetNo === null
      ? "หมายเหตุระบบ: GFMIS ซ้ำ/ถูกใช้อยู่ จึงไม่บันทึกซ้ำในช่อง unique"
      : null,

    originalOfficeAssetNo &&
    officeAssetNo === null
      ? "หมายเหตุระบบ: รหัสครุภัณฑ์ซ้ำ/ถูกใช้อยู่ จึงไม่บันทึกซ้ำในช่อง unique"
      : null,
  ]
    .filter(
      (value): value is string =>
        Boolean(value)
    )
    .join(" | ");

  /* =======================================================
     9. ข้อมูลที่จะบันทึก
     ======================================================= */

  const data = {
    name:
      normalizeText(asset.name),

    category:
      asset.category,

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
     10. UPDATE
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
     11. CREATE

     หมายเหตุ:
     ถ้าเป็นการ Import ครั้งแรกจากระบบเก่าที่ไม่มี source marker
     รายการเดิมจะไม่ถูกถือว่าเป็นรายการเดียวกันอัตโนมัติ

     เพื่อให้ข้อมูล 446 แถวตรงกับทะเบียนต้นฉบับ
     ควรใช้กับ Department 1 ที่เตรียมสำหรับชุด Import ใหม่นี้
     หรือสำรอง/ล้างข้อมูลเดิมของกลุ่มอำนวยการก่อน
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

    console.error(
      " IMPORT FAILED"
    );

    console.error(
      "======================================================"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
