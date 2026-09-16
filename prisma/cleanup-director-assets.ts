import { prisma } from "../lib/prisma";

/* =========================================================
   CONFIG
   ========================================================= */

const DEPARTMENT_ID = 1;

const EXPECTED_TOTAL_COUNT = 887;
const EXPECTED_NEW_COUNT = 446;
const EXPECTED_OLD_COUNT = 441;

const IMPORT_MARKER = "SOURCE:DEPARTMENT_1:";

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log("");
  console.log(
    "======================================================"
  );
  console.log(
    " Cleanup ข้อมูลเก่ากลุ่มอำนวยการ"
  );
  console.log(
    "======================================================"
  );

  console.log(`Department ID : ${DEPARTMENT_ID}`);
  console.log(
    `ข้อมูลชุดใหม่ที่ต้องเก็บ : ${EXPECTED_NEW_COUNT}`
  );
  console.log(
    `ข้อมูลชุดเก่าที่ต้องลบ   : ${EXPECTED_OLD_COUNT}`
  );

  console.log("");

  /* =======================================================
     1. นับรายการทั้งหมด Department 1
     ======================================================= */

  const total = await prisma.asset.count({
    where: {
      departmentId: DEPARTMENT_ID,
    },
  });

  /* =======================================================
     2. ค้นหาข้อมูล Import ชุดใหม่

     ใช้ marker:
     SOURCE:DEPARTMENT_1:

     รายการเหล่านี้จะถูกเก็บไว้ทั้งหมด
     ======================================================= */

  const newAssets =
    await prisma.asset.findMany({
      where: {
        departmentId: DEPARTMENT_ID,

        remark: {
          contains: IMPORT_MARKER,
        },
      },

      select: {
        id: true,
        name: true,
        governmentAssetNo: true,
        officeAssetNo: true,
        remark: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     3. เก็บ ID ของข้อมูลชุดใหม่
     ======================================================= */

  const newAssetIds = newAssets.map(
    (asset) => asset.id
  );

  /* =======================================================
     4. หา Asset เก่า

     Department 1
     แต่ ID ไม่อยู่ในชุด Import ใหม่

     หมายเหตุ:
     ไม่ใช้เงื่อนไข ID <= 441
     เพราะ ID ของข้อมูลเก่าไม่ได้เรียงต่อเนื่อง
     ======================================================= */

  const oldAssets =
    await prisma.asset.findMany({
      where: {
        departmentId: DEPARTMENT_ID,

        id: {
          notIn: newAssetIds,
        },
      },

      select: {
        id: true,
        name: true,
        governmentAssetNo: true,
        officeAssetNo: true,
        remark: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     5. แสดงผลการตรวจสอบ
     ======================================================= */

  console.log(
    "======================================================"
  );
  console.log(
    " ตรวจสอบข้อมูลก่อน Cleanup"
  );
  console.log(
    "======================================================"
  );

  console.log(
    `รายการทั้งหมด       : ${total}`
  );

  console.log(
    `ข้อมูล Import ใหม่   : ${newAssets.length}`
  );

  console.log(
    `ข้อมูลเดิม           : ${oldAssets.length}`
  );

  console.log("");

  /* =======================================================
     6. SAFETY CHECK

     ต้องตรงครบทุกเงื่อนไขก่อนจึงจะอนุญาตให้ลบ
     ======================================================= */

  if (
    total !== EXPECTED_TOTAL_COUNT
  ) {
    throw new Error(
      [
        "หยุดทำงานเพื่อความปลอดภัย",
        "",
        `คาดว่าต้องมีทั้งหมด ${EXPECTED_TOTAL_COUNT} รายการ`,
        `แต่พบจริง ${total} รายการ`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  if (
    newAssets.length !==
    EXPECTED_NEW_COUNT
  ) {
    throw new Error(
      [
        "หยุดทำงานเพื่อความปลอดภัย",
        "",
        `ข้อมูล Import ใหม่ควรมี ${EXPECTED_NEW_COUNT} รายการ`,
        `แต่พบจริง ${newAssets.length} รายการ`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  if (
    oldAssets.length !==
    EXPECTED_OLD_COUNT
  ) {
    throw new Error(
      [
        "หยุดทำงานเพื่อความปลอดภัย",
        "",
        `ข้อมูลเก่าควรมี ${EXPECTED_OLD_COUNT} รายการ`,
        `แต่พบจริง ${oldAssets.length} รายการ`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  /*
   * ตรวจสอบสมการจำนวนอีกครั้ง
   */

  if (
    newAssets.length +
      oldAssets.length !==
    total
  ) {
    throw new Error(
      [
        "หยุดทำงานเพื่อความปลอดภัย",
        "",
        "จำนวนข้อมูลใหม่ + ข้อมูลเก่า ไม่เท่ากับจำนวนทั้งหมด",
        "",
        `ใหม่    : ${newAssets.length}`,
        `เก่า    : ${oldAssets.length}`,
        `รวม     : ${
          newAssets.length +
          oldAssets.length
        }`,
        `ทั้งหมด : ${total}`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  /*
   * ต้องมี ID ชุดใหม่จริง
   *
   * ป้องกันกรณี marker ผิดแล้ว notIn
   * ทำงานกับ array ว่าง
   */

  if (
    newAssetIds.length !==
    EXPECTED_NEW_COUNT
  ) {
    throw new Error(
      [
        "หยุดทำงานเพื่อความปลอดภัย",
        "",
        "จำนวน ID ของข้อมูลชุดใหม่ไม่ถูกต้อง",
        `ควรมี ${EXPECTED_NEW_COUNT}`,
        `พบ ${newAssetIds.length}`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  /* =======================================================
     7. แสดงรายการเก่าที่กำลังจะลบ
     ======================================================= */

  console.log(
    "======================================================"
  );
  console.log(
    " รายการเก่าที่จะถูกลบ"
  );
  console.log(
    "======================================================"
  );

  for (const asset of oldAssets) {
    console.log(
      `[ID ${asset.id}] ${asset.name} | GFMIS: ${
        asset.governmentAssetNo ??
        "-"
      } | รหัสครุภัณฑ์: ${
        asset.officeAssetNo ??
        "-"
      }`
    );
  }

  console.log("");

  console.log(
    "======================================================"
  );
  console.log(
    " SAFETY CHECK ผ่าน"
  );
  console.log(
    "======================================================"
  );

  console.log(
    `ข้อมูลที่จะเก็บไว้ : ${newAssets.length}`
  );

  console.log(
    `ข้อมูลที่จะลบ      : ${oldAssets.length}`
  );

  console.log("");

  /* =======================================================
     8. เตรียม ID ที่จะลบ

     ใช้ ID ที่ตรวจสอบจาก oldAssets โดยตรง

     ไม่ใช้:
     id <= 441

     เพราะ ID เก่าไม่ได้เรียงต่อเนื่อง
     ======================================================= */

  const oldAssetIds = oldAssets.map(
    (asset) => asset.id
  );

  if (
    oldAssetIds.length !==
    EXPECTED_OLD_COUNT
  ) {
    throw new Error(
      [
        "หยุดทำงานเพื่อความปลอดภัย",
        "",
        `ควรมี ID ที่จะลบ ${EXPECTED_OLD_COUNT} รายการ`,
        `แต่พบ ${oldAssetIds.length} รายการ`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  /* =======================================================
     9. ลบข้อมูลจริง

     ใช้ Transaction เพื่อให้การลบและการตรวจสอบ
     จำนวนหลังลบเป็นชุดการทำงานเดียวกัน

     หากจำนวนที่ลบหรือจำนวนคงเหลือผิด
     Transaction จะ rollback
     ======================================================= */

  console.log(
    "======================================================"
  );
  console.log(
    " เริ่มลบข้อมูลเก่า"
  );
  console.log(
    "======================================================"
  );

  const cleanupResult =
    await prisma.$transaction(
      async (tx) => {
        /* -------------------------------------------------
           ลบเฉพาะ ID ที่ตรวจสอบแล้วว่าเป็นข้อมูลเก่า
           และต้องอยู่ Department 1 เท่านั้น
           ------------------------------------------------- */

        const deleted =
          await tx.asset.deleteMany({
            where: {
              departmentId:
                DEPARTMENT_ID,

              id: {
                in: oldAssetIds,
              },
            },
          });

        /* -------------------------------------------------
           ตรวจจำนวนที่ลบ
           ------------------------------------------------- */

        if (
          deleted.count !==
          EXPECTED_OLD_COUNT
        ) {
          throw new Error(
            [
              "จำนวนที่ลบไม่ตรงตามที่กำหนด",
              "",
              `ควรลบ ${EXPECTED_OLD_COUNT} รายการ`,
              `ลบจริง ${deleted.count} รายการ`,
              "",
              "Transaction จะถูก Rollback",
            ].join("\n")
          );
        }

        /* -------------------------------------------------
           นับจำนวน Department 1 หลังลบ
           ------------------------------------------------- */

        const remaining =
          await tx.asset.count({
            where: {
              departmentId:
                DEPARTMENT_ID,
            },
          });

        if (
          remaining !==
          EXPECTED_NEW_COUNT
        ) {
          throw new Error(
            [
              "จำนวนข้อมูลคงเหลือไม่ถูกต้อง",
              "",
              `ควรเหลือ ${EXPECTED_NEW_COUNT} รายการ`,
              `แต่เหลือจริง ${remaining} รายการ`,
              "",
              "Transaction จะถูก Rollback",
            ].join("\n")
          );
        }

        /* -------------------------------------------------
           ตรวจ marker ของข้อมูลที่เหลือ
           ------------------------------------------------- */

        const remainingNewAssets =
          await tx.asset.count({
            where: {
              departmentId:
                DEPARTMENT_ID,

              remark: {
                contains:
                  IMPORT_MARKER,
              },
            },
          });

        if (
          remainingNewAssets !==
          EXPECTED_NEW_COUNT
        ) {
          throw new Error(
            [
              "ข้อมูลชุดใหม่หลัง Cleanup ไม่ครบ",
              "",
              `ควรพบ ${EXPECTED_NEW_COUNT} รายการ`,
              `แต่พบ ${remainingNewAssets} รายการ`,
              "",
              "Transaction จะถูก Rollback",
            ].join("\n")
          );
        }

        return {
          deletedCount:
            deleted.count,

          remainingCount:
            remaining,

          remainingNewCount:
            remainingNewAssets,
        };
      }
    );

  /* =======================================================
     10. ตรวจสอบอีกครั้งหลัง Transaction สำเร็จ
     ======================================================= */

  const finalTotal =
    await prisma.asset.count({
      where: {
        departmentId: DEPARTMENT_ID,
      },
    });

  const finalNewAssets =
    await prisma.asset.count({
      where: {
        departmentId: DEPARTMENT_ID,

        remark: {
          contains: IMPORT_MARKER,
        },
      },
    });

  /* =======================================================
     11. แสดงผล
     ======================================================= */

  console.log("");

  console.log(
    "======================================================"
  );
  console.log(
    " CLEANUP สำเร็จ"
  );
  console.log(
    "======================================================"
  );

  console.log(
    `ข้อมูลก่อน Cleanup     : ${total} รายการ`
  );

  console.log(
    `ลบข้อมูลเดิม           : ${cleanupResult.deletedCount} รายการ`
  );

  console.log(
    `ข้อมูลคงเหลือ          : ${cleanupResult.remainingCount} รายการ`
  );

  console.log(
    `ข้อมูล Import ใหม่      : ${cleanupResult.remainingNewCount} รายการ`
  );

  console.log("");

  console.log(
    `ตรวจสอบฐานข้อมูลล่าสุด : ${finalTotal} รายการ`
  );

  console.log(
    `ตรวจ marker ชุดใหม่    : ${finalNewAssets} รายการ`
  );

  console.log("");

  if (
    finalTotal ===
      EXPECTED_NEW_COUNT &&
    finalNewAssets ===
      EXPECTED_NEW_COUNT
  ) {
    console.log(
      `✅ Cleanup สำเร็จ กลุ่มอำนวยการเหลือ ${EXPECTED_NEW_COUNT} รายการ`
    );
  } else {
    console.warn(
      "⚠️ กรุณาตรวจสอบข้อมูลอีกครั้ง"
    );
  }

  console.log("");

  console.log(
    "======================================================"
  );
  console.log(
    " เสร็จสิ้น"
  );
  console.log(
    "======================================================"
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
      " CLEANUP FAILED"
    );

    console.error(
      "======================================================"
    );

    console.error(error);

    console.error("");

    console.error(
      "❌ Cleanup ไม่สำเร็จ"
    );

    console.error(
      "หาก Error เกิดภายใน Transaction การลบจะถูก Rollback"
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });