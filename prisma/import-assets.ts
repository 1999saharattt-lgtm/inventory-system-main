import {
  PrismaClient,
  AssetCategory,
  AssetStatus,
} from "@prisma/client";

import {
  department1,
  AssetImportItem,
} from "./asset-data/department-1";

const prisma = new PrismaClient();

/* =========================================================
   รายชื่อกลุ่มงานที่จะ Import

   ตอนนี้เริ่มจากกลุ่มอำนวยการก่อน
   ภายหลังเพิ่ม department2, department3 ... ได้ตรงนี้
   ========================================================= */

const departments = [
  department1,
];

/* =========================================================
   จำแนกประเภทครุภัณฑ์อัตโนมัติ

   ต้องตรงกับ AssetCategory ใน schema.prisma

   DESK
   CHAIR
   AIR_CONDITIONER
   TELEPHONE
   CABINET
   COMPUTER
   PRINTER
   OTHER
   NO_SYSTEM
   ========================================================= */

function getAssetCategory(
  name: string
): AssetCategory {
  const text = name
    .trim()
    .toLowerCase();

  /* =======================================================
     เก้าอี้
     ======================================================= */

  if (
    text.includes("เก้าอี้")
  ) {
    return AssetCategory.CHAIR;
  }

  /* =======================================================
     โต๊ะ
     ======================================================= */

  if (
    text.includes("โต๊ะ")
  ) {
    return AssetCategory.DESK;
  }

  /* =======================================================
     เครื่องปรับอากาศ
     ======================================================= */

  if (
    text.includes("เครื่องปรับอากาศ") ||
    text.includes("แอร์")
  ) {
    return AssetCategory.AIR_CONDITIONER;
  }

  /* =======================================================
     โทรศัพท์
     ======================================================= */

  if (
    text.includes("เครื่องโทรศัพท์") ||
    text.includes("โทรศัพท์")
  ) {
    return AssetCategory.TELEPHONE;
  }

  /* =======================================================
     ตู้ / ชั้น
     ======================================================= */

  if (
    text.includes("ตู้") ||
    text.includes("ชั้นวาง") ||
    text.includes("ชั้นเหล็ก") ||
    text.includes("ชั้นเก็บ")
  ) {
    return AssetCategory.CABINET;
  }

  /* =======================================================
     Printer

     ต้องตรวจ Printer ก่อน Computer
     เพราะบางรายการอาจมีคำว่า "คอมพิวเตอร์"
     อยู่ในชื่อเครื่องพิมพ์
     ======================================================= */

  if (
    text.includes("เครื่องพิมพ์") ||
    text.includes("printer") ||
    text.includes("ปริ้นเตอร์") ||
    text.includes("พรินเตอร์")
  ) {
    return AssetCategory.PRINTER;
  }

  /* =======================================================
     Computer
     ======================================================= */

  if (
    text.includes("เครื่องคอมพิวเตอร์") ||
    text.includes("คอมพิวเตอร์") ||
    text.includes("โน้ตบุ๊ก") ||
    text.includes("notebook") ||
    text.includes("laptop")
  ) {
    return AssetCategory.COMPUTER;
  }

  /* =======================================================
     ไม่มีอยู่ในระบบ

     ใช้เฉพาะกรณีข้อมูลระบุชัดว่าไม่มีในระบบ
     ======================================================= */

  if (
    text.includes("ไม่มีอยู่ในระบบ")
  ) {
    return AssetCategory.NO_SYSTEM;
  }

  /* =======================================================
     รายการอื่นทั้งหมด
     ======================================================= */

  return AssetCategory.OTHER;
}

/* =========================================================
   Normalize ข้อความ

   ใช้เฉพาะตัดช่องว่างหัวท้าย
   ไม่แก้รหัสจากเอกสารต้นฉบับ
   ========================================================= */

function normalizeText(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const result = value.trim();

  return result || null;
}

/* =========================================================
   ตรวจสอบข้อมูลเบื้องต้น
   ========================================================= */

function validateItem(
  item: AssetImportItem,
  departmentName: string
) {
  const errors: string[] = [];

  if (
    !Number.isInteger(item.no) ||
    item.no <= 0
  ) {
    errors.push(
      "ลำดับไม่ถูกต้อง"
    );
  }

  if (!item.name?.trim()) {
    errors.push(
      "ไม่มีชื่อรายการ"
    );
  }

  if (!item.unit?.trim()) {
    errors.push(
      "ไม่มีหน่วยนับ"
    );
  }

  if (!item.responsible?.trim()) {
    errors.push(
      "ไม่มีผู้รับผิดชอบ/งาน"
    );
  }

  /*
   * อนุญาตให้รหัส GFMIS ว่างได้
   * และอนุญาตให้รหัสครุภัณฑ์ว่างได้
   *
   * เพราะเอกสารต้นฉบับบางรายการ
   * อาจไม่มีรหัสอย่างใดอย่างหนึ่ง
   */

  if (errors.length > 0) {
    throw new Error(
      [
        `ข้อมูลไม่สมบูรณ์`,
        `กลุ่ม: ${departmentName}`,
        `ลำดับ: ${item.no}`,
        ...errors,
      ].join("\n")
    );
  }
}

/* =========================================================
   ตรวจรหัสซ้ำภายในชุดข้อมูลที่จะ Import

   เนื่องจาก schema.prisma กำหนด

   governmentAssetNo @unique
   officeAssetNo     @unique

   ดังนั้นต้องตรวจสอบก่อนเขียนฐานข้อมูล
   ========================================================= */

function checkDuplicateCodes() {
  const gfmisMap =
    new Map<string, string[]>();

  const officeMap =
    new Map<string, string[]>();

  for (
    const department of departments
  ) {
    for (
      const asset of department.assets
    ) {
      const gfmis =
        normalizeText(
          asset.governmentAssetNo
        );

      const office =
        normalizeText(
          asset.officeAssetNo
        );

      const label =
        `${department.departmentName} ` +
        `ลำดับ ${asset.no}`;

      /* =====================================================
         GFMIS
         ===================================================== */

      if (gfmis) {
        const existing =
          gfmisMap.get(gfmis) ?? [];

        existing.push(label);

        gfmisMap.set(
          gfmis,
          existing
        );
      }

      /* =====================================================
         รหัสครุภัณฑ์
         ===================================================== */

      if (office) {
        const existing =
          officeMap.get(office) ?? [];

        existing.push(label);

        officeMap.set(
          office,
          existing
        );
      }
    }
  }

  const duplicateGfmis =
    [...gfmisMap.entries()].filter(
      ([, locations]) =>
        locations.length > 1
    );

  const duplicateOffice =
    [...officeMap.entries()].filter(
      ([, locations]) =>
        locations.length > 1
    );

  if (
    duplicateGfmis.length === 0 &&
    duplicateOffice.length === 0
  ) {
    return;
  }

  console.error(
    "\n❌ พบข้อมูลรหัสซ้ำในชุดข้อมูลต้นฉบับ\n"
  );

  if (
    duplicateGfmis.length > 0
  ) {
    console.error(
      "===== GFMIS ซ้ำ ====="
    );

    for (
      const [
        code,
        locations,
      ] of duplicateGfmis
    ) {
      console.error(
        `\n${code}`
      );

      for (
        const location of locations
      ) {
        console.error(
          `  - ${location}`
        );
      }
    }
  }

  if (
    duplicateOffice.length > 0
  ) {
    console.error(
      "\n===== รหัสครุภัณฑ์ซ้ำ ====="
    );

    for (
      const [
        code,
        locations,
      ] of duplicateOffice
    ) {
      console.error(
        `\n${code}`
      );

      for (
        const location of locations
      ) {
        console.error(
          `  - ${location}`
        );
      }
    }
  }

  throw new Error(
    "พบรหัสซ้ำในข้อมูลที่จะ Import จึงหยุดการทำงานเพื่อป้องกันข้อมูลผิด"
  );
}

/* =========================================================
   หา/สร้าง Section

   เช่น

   งานสารบรรณ
   งานการเงินและบัญชี

   จะถูกสร้างเป็น Section ของกลุ่มอำนวยการ

   แต่ข้อมูลที่ไม่ขึ้นต้นด้วย "งาน"
   จะไม่สร้าง Section อัตโนมัติ
   ========================================================= */

async function getSectionId(
  departmentId: number,
  responsible: string
): Promise<number | null> {
  const name =
    responsible.trim();

  if (
    !name ||
    !name.startsWith("งาน")
  ) {
    return null;
  }

  const existing =
    await prisma.section.findFirst({
      where: {
        departmentId,
        name,
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return existing.id;
  }

  const created =
    await prisma.section.create({
      data: {
        departmentId,
        name,
      },
      select: {
        id: true,
      },
    });

  console.log(
    `   + สร้างงาน: ${name}`
  );

  return created.id;
}

/* =========================================================
   ตรวจสอบว่ามี Asset อยู่ในฐานข้อมูลแล้วหรือไม่

   ตรวจจาก

   1. GFMIS
   2. รหัสครุภัณฑ์

   เพื่อป้องกันการ Import ซ้ำเมื่อรัน Script หลายครั้ง
   ========================================================= */

async function findExistingAsset(
  governmentAssetNo: string | null,
  officeAssetNo: string | null
) {
  const conditions: Array<
    | {
        governmentAssetNo: string;
      }
    | {
        officeAssetNo: string;
      }
  > = [];

  if (governmentAssetNo) {
    conditions.push({
      governmentAssetNo,
    });
  }

  if (officeAssetNo) {
    conditions.push({
      officeAssetNo,
    });
  }

  /*
   * ถ้าทั้งสองรหัสเป็น null
   * ไม่สามารถใช้รหัสค้นหาได้
   */

  if (
    conditions.length === 0
  ) {
    return null;
  }

  return prisma.asset.findFirst({
    where: {
      OR: conditions,
    },
    select: {
      id: true,
      governmentAssetNo: true,
      officeAssetNo: true,
      name: true,
    },
  });
}

/* =========================================================
   Import กลุ่มงานหนึ่งกลุ่ม
   ========================================================= */

async function importDepartment(
  departmentData: typeof department1
) {
  const {
    departmentId,
    departmentName,
    assets,
  } = departmentData;

  console.log(
    "\n=============================================="
  );

  console.log(
    `กลุ่ม: ${departmentName}`
  );

  console.log(
    `Department ID: ${departmentId}`
  );

  console.log(
    `จำนวนข้อมูลต้นฉบับ: ${assets.length}`
  );

  console.log(
    "==============================================\n"
  );

  /* =======================================================
     ตรวจ Department
     ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!department) {
    throw new Error(
      `ไม่พบ Department ID ${departmentId}`
    );
  }

  /*
   * ป้องกันการใส่ข้อมูลผิดกลุ่ม
   */

  if (
    department.name.trim() !==
    departmentName.trim()
  ) {
    throw new Error(
      [
        `Department ไม่ตรงกัน`,
        `ID ${departmentId}`,
        `ในฐานข้อมูล: ${department.name}`,
        `ในไฟล์ Import: ${departmentName}`,
      ].join("\n")
    );
  }

  /* =======================================================
     สถิติ
     ======================================================= */

  let createdCount = 0;
  let skippedCount = 0;

  /* =======================================================
     Import ทีละรายการ
     ======================================================= */

  for (
    let index = 0;
    index < assets.length;
    index++
  ) {
    const source =
      assets[index];

    validateItem(
      source,
      departmentName
    );

    const governmentAssetNo =
      normalizeText(
        source.governmentAssetNo
      );

    const officeAssetNo =
      normalizeText(
        source.officeAssetNo
      );

    const responsible =
      source.responsible.trim();

    const name =
      source.name.trim();

    /* =====================================================
       ตรวจว่ามีข้อมูลอยู่แล้วหรือไม่
       ===================================================== */

    const existing =
      await findExistingAsset(
        governmentAssetNo,
        officeAssetNo
      );

    if (existing) {
      skippedCount++;

      console.log(
        `⏭ [${source.no}] ข้าม: ${name}`
      );

      console.log(
        `   มีอยู่แล้ว Asset ID ${existing.id}`
      );

      continue;
    }

    /* =====================================================
       หา Section
       ===================================================== */

    const sectionId =
      await getSectionId(
        departmentId,
        responsible
      );

    /* =====================================================
       Location

       ถ้า responsible เป็น "งาน..."
       ให้เก็บใน sectionId

       ถ้าไม่ใช่ เช่น
       ห้องประชุม
       ห้องเก็บของ

       ให้เก็บเป็น location
       ===================================================== */

    const location =
      responsible.startsWith("งาน")
        ? null
        : responsible;

    /* =====================================================
       จำแนก Category
       ===================================================== */

    const category =
      getAssetCategory(name);

    /* =====================================================
       สร้าง Asset
       ===================================================== */

    const created =
      await prisma.asset.create({
        data: {
          name,

          category,

          brand: null,

          model: null,

          serialNumber: null,

          governmentAssetNo,

          officeAssetNo,

          departmentId,

          sectionId,

          /*
           * ตอนนี้ยังไม่จับ Officer
           *
           * เพราะ responsible จาก PDF
           * เป็น "งาน..."
           *
           * เราจะจัดการ Officer แยกภายหลัง
           * ถ้า PDF มีชื่อบุคคล
           */
          officerId: null,

          status:
            AssetStatus.IN_USE,

          purchaseDate: null,

          price: null,

          location,

          /*
           * เก็บข้อมูลหน่วยนับจากต้นฉบับไว้
           * เนื่องจาก Asset model ไม่มี field unit
           *
           * หน้าเว็บปัจจุบันคำนวณหน่วยจาก category อยู่แล้ว
           */
          remark:
            source.unit
              ? `หน่วยนับตามทะเบียนเดิม: ${source.unit}`
              : null,
        },
        select: {
          id: true,
        },
      });

    createdCount++;

    console.log(
      `✅ [${source.no}] ${name}`
    );

    console.log(
      `   Asset ID: ${created.id}`
    );

    console.log(
      `   Category: ${category}`
    );

    if (governmentAssetNo) {
      console.log(
        `   GFMIS: ${governmentAssetNo}`
      );
    }

    if (officeAssetNo) {
      console.log(
        `   รหัสครุภัณฑ์: ${officeAssetNo}`
      );
    }

    console.log(
      `   ผู้รับผิดชอบ: ${responsible}`
    );
  }

  /* =======================================================
     สรุปกลุ่ม
     ======================================================= */

  console.log(
    "\n----------------------------------------------"
  );

  console.log(
    `สรุป ${departmentName}`
  );

  console.log(
    `เพิ่มใหม่ : ${createdCount}`
  );

  console.log(
    `ข้าม     : ${skippedCount}`
  );

  console.log(
    `ทั้งหมด   : ${assets.length}`
  );

  console.log(
    "----------------------------------------------"
  );

  return {
    createdCount,
    skippedCount,
    totalCount:
      assets.length,
  };
}

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log(
    "\n=============================================="
  );

  console.log(
    "เริ่มระบบนำเข้าครุภัณฑ์"
  );

  console.log(
    "=============================================="
  );

  /* =======================================================
     จำนวนข้อมูลทั้งหมด
     ======================================================= */

  const totalSourceAssets =
    departments.reduce(
      (
        total,
        department
      ) =>
        total +
        department.assets.length,
      0
    );

  console.log(
    `จำนวนกลุ่ม: ${departments.length}`
  );

  console.log(
    `จำนวนครุภัณฑ์ต้นฉบับ: ${totalSourceAssets}`
  );

  /*
   * ถ้ายังไม่มีข้อมูล
   * ให้หยุดโดยไม่ถือว่าเป็น Error
   */

  if (
    totalSourceAssets === 0
  ) {
    console.log(
      "\n⚠️ ยังไม่มีข้อมูลครุภัณฑ์สำหรับ Import"
    );

    console.log(
      "กรุณาใส่ข้อมูลใน prisma/asset-data/department-1.ts ก่อน"
    );

    return;
  }

  /* =======================================================
     ตรวจรหัสซ้ำก่อนแตะฐานข้อมูล
     ======================================================= */

  console.log(
    "\nกำลังตรวจสอบรหัสซ้ำ..."
  );

  checkDuplicateCodes();

  console.log(
    "✅ ไม่พบรหัสซ้ำในชุดข้อมูล Import"
  );

  /* =======================================================
     Import
     ======================================================= */

  let totalCreated = 0;
  let totalSkipped = 0;

  for (
    const department of departments
  ) {
    const result =
      await importDepartment(
        department
      );

    totalCreated +=
      result.createdCount;

    totalSkipped +=
      result.skippedCount;
  }

  /* =======================================================
     สรุปรวม
     ======================================================= */

  console.log(
    "\n=============================================="
  );

  console.log(
    "🎉 นำเข้าครุภัณฑ์เสร็จสิ้น"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `ข้อมูลต้นฉบับ : ${totalSourceAssets}`
  );

  console.log(
    `เพิ่มใหม่      : ${totalCreated}`
  );

  console.log(
    `ข้าม           : ${totalSkipped}`
  );

  console.log(
    "==============================================\n"
  );
}

/* =========================================================
   RUN
   ========================================================= */

main()
  .catch((error) => {
    console.error(
      "\n❌ Import ไม่สำเร็จ\n"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });