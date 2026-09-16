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

   ใช้สำหรับจับคู่ Officer

   ตัวอย่าง

   นาย สมชาย ใจดี
   =>
   สมชาย ใจดี
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

   รูปแบบที่รองรับ

   นาย ก / งานการเงิน
   =>
   officerName = นาย ก
   sectionName = งานการเงิน

   งานการเงิน
   =>
   singleValue = งานการเงิน

   ห้องประชุมชั้น 3
   =>
   singleValue = ห้องประชุมชั้น 3

   หมายเหตุ

   ไม่ว่าจะจับคู่ Officer / Section ได้หรือไม่
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

  /*
   * รูปแบบ:
   *
   * ชื่อบุคคล / ชื่องาน
   */

  if (parts.length >= 2) {
    return {
      original,
      officerName: parts[0],
      sectionName: parts.slice(1).join(" / "),
      singleValue: "",
    };
  }

  /*
   * รูปแบบข้อความเดียว
   *
   * เช่น
   *
   * งานการเงิน
   * ห้องประชุมชั้น 3
   * นาย ก
   */

  return {
    original,
    officerName: "",
    sectionName: "",
    singleValue: original,
  };
}

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log(
    "======================================================"
  );
  console.log(" นำเข้าครุภัณฑ์กลุ่มอำนวยการ");
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

  /*
   * ป้องกันกรณี Department ID ถูกต้อง
   * แต่ชื่อ Department ไม่ตรงกับไฟล์ต้นฉบับ
   */

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

  console.log(
    `✓ พบ Department: ${department.name}`
  );

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

  console.log(
    `✓ พบ Section: ${sections.length} รายการ`
  );

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

  console.log(
    `✓ พบ Officer: ${officers.length} คน`
  );

  console.log("");

  /* =======================================================
     4. สร้าง Section Map

     key   = ชื่อ Section
     value = Section ID
     ======================================================= */

  const sectionMap =
    new Map<string, number>();

  for (const section of sections) {
    const key = normalizeText(
      section.name
    );

    if (key) {
      sectionMap.set(
        key,
        section.id
      );
    }
  }

  /* =======================================================
     5. สร้าง Officer Map

     key = ชื่อ + นามสกุล
     โดยตัดคำนำหน้าออก
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
     6. สถิติ
     ======================================================= */

  const stats: ImportStats = {
    total: department1Assets.length,

    created: 0,
    updated: 0,
    failed: 0,

    sectionMatched: 0,
    officerMatched: 0,

    responsibleOnly: 0,
  };

  /* =======================================================
     7. Import ทีละรายการ
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
     8. สรุปผล
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

  /* =======================================================
     ตรวจสอบจำนวน
     ======================================================= */

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
     1. อ่านผู้รับผิดชอบจากต้นฉบับ
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
     2. กรณี

     ชื่อบุคคล / ชื่องาน

     เช่น

     นาย ก / งานการเงิน
     ======================================================= */

  if (responsible.sectionName) {
    const matchedSectionId =
      sectionMap.get(
        normalizeText(
          responsible.sectionName
        )
      );

    if (
      matchedSectionId !==
      undefined
    ) {
      sectionId =
        matchedSectionId;

      stats.sectionMatched += 1;

      matchedResponsible = true;
    }
  }

  /* =======================================================
     จับ Officer
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

      /*
       * ถ้าจากข้อความยังจับ Section ไม่ได้
       * แต่ Officer มี Section
       * ใช้ Section ของ Officer
       */

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
     3. กรณีมีข้อความเดียว

     ตัวอย่าง

     งานการเงิน
     งานสารบรรณ
     ห้องประชุมชั้น 3
     ห้องพิพิธภัณฑ์
     ห้องผู้อำนวยการ
     นาย ก

     ลำดับการตรวจ:

     1. Section
     2. Officer
     3. ถ้าไม่ตรงทั้งสอง
        เก็บ responsibleName อย่างเดียว
     ======================================================= */

  if (responsible.singleValue) {
    const singleValue =
      normalizeText(
        responsible.singleValue
      );

    /* =====================================================
       ลองจับ Section ก่อน
       ===================================================== */

    const matchedSectionId =
      sectionMap.get(singleValue);

    if (
      matchedSectionId !==
      undefined
    ) {
      sectionId =
        matchedSectionId;

      stats.sectionMatched += 1;

      matchedResponsible = true;
    } else {
      /* ===================================================
         ถ้าไม่ใช่ Section
         ลองจับ Officer
         =================================================== */

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
          matchedOfficer.sectionId !==
          null
        ) {
          sectionId =
            matchedOfficer.sectionId;
        }
      }
    }
  }

  /* =======================================================
     4. ไม่พบ Section / Officer

     ไม่ถือว่า Error

     เพราะข้อความต้นฉบับจะถูกเก็บไว้ใน
     responsibleName

     เช่น

     ห้องประชุมชั้น 3
     ห้องประชุม RH
     ห้องพิพิธภัณฑ์
     ห้องผู้อำนวยการ
     ======================================================= */

  if (
    responsible.original &&
    !matchedResponsible
  ) {
    stats.responsibleOnly += 1;
  }

  /* =======================================================
     5. Normalize เลขทะเบียน
     ======================================================= */

  const governmentAssetNo =
    normalizeText(
      asset.governmentAssetNo
    ) || null;

  const officeAssetNo =
    normalizeText(
      asset.officeAssetNo
    ) || null;

  /* =======================================================
     6. ตรวจหา Asset เดิม

     สำคัญ:

     governmentAssetNo และ officeAssetNo
     เป็น @unique

     ตรวจแยกกันเพื่อป้องกันกรณี
     GFMIS ไปตรง Asset A
     แต่ officeAssetNo ไปตรง Asset B
     ======================================================= */

  let assetByGovernmentNo: {
    id: number;
  } | null = null;

  let assetByOfficeNo: {
    id: number;
  } | null = null;

  if (governmentAssetNo) {
    assetByGovernmentNo =
      await prisma.asset.findUnique({
        where: {
          governmentAssetNo,
        },

        select: {
          id: true,
        },
      });
  }

  if (officeAssetNo) {
    assetByOfficeNo =
      await prisma.asset.findUnique({
        where: {
          officeAssetNo,
        },

        select: {
          id: true,
        },
      });
  }

  /* =======================================================
     ถ้าเลขทั้งสองไปตรงกับ Asset คนละตัว
     ให้หยุดรายการนั้นทันที

     ป้องกันการ Update ผิด record
     ======================================================= */

  if (
    assetByGovernmentNo &&
    assetByOfficeNo &&
    assetByGovernmentNo.id !==
      assetByOfficeNo.id
  ) {
    throw new Error(
      [
        "พบเลขทะเบียนซ้ำข้าม Asset",
        `ลำดับต้นฉบับ: ${asset.sourceOrder}`,
        `รายการ: ${asset.name}`,
        `GFMIS: ${governmentAssetNo}`,
        `รหัสครุภัณฑ์: ${officeAssetNo}`,
        `GFMIS ตรงกับ Asset ID ${assetByGovernmentNo.id}`,
        `รหัสครุภัณฑ์ตรงกับ Asset ID ${assetByOfficeNo.id}`,
      ].join("\n")
    );
  }

  const existingAsset =
    assetByGovernmentNo ??
    assetByOfficeNo;

  /* =======================================================
     7. เตรียม Remark

     responsibleName ไม่ต้องเก็บซ้ำใน remark
     เพราะมี column responsibleName แล้ว
     ======================================================= */

  const remark = [
    "นำเข้าจากทะเบียนกลุ่มอำนวยการ",

    `ลำดับต้นฉบับ ${asset.sourceOrder}`,

    asset.sourcePage
      ? `หน้า ${asset.sourcePage}`
      : null,

    asset.unit
      ? `หน่วยนับ ${normalizeText(
          asset.unit
        )}`
      : null,
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(value)
    )
    .join(" | ");

  /* =======================================================
     8. เตรียมข้อมูล Asset

     responsibleName คือข้อมูลต้นฉบับ
     ที่ใช้แสดงในช่อง "ผู้รับผิดชอบ"
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

    /*
     * สำคัญมาก
     *
     * เก็บข้อความต้นฉบับโดยตรง
     */

    responsibleName:
      responsible.original ||
      null,

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