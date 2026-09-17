import { prisma } from "../lib/prisma";

/* =========================================================
   CONFIG
   ========================================================= */

const DEPARTMENT_ID = 1;

const EXPECTED_SOURCE_COUNT = 446;

const IMPORT_MARKER_PREFIX =
  "SOURCE:DEPARTMENT_1:";

/* =========================================================
   TYPE
   ========================================================= */

type CleanupAsset = {
  id: number;
  name: string;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
  quantity: number;
  unit: string | null;
  responsibleName: string | null;
  remark: string | null;
};

/* =========================================================
   อ่าน sourceOrder จาก remark

   ตัวอย่าง:
   SOURCE:DEPARTMENT_1:123
   ========================================================= */

function extractSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_1:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder = Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   ให้คะแนน record

   กรณี sourceOrder เดียวมีหลาย record
   จะเก็บ record ที่มีข้อมูลสมบูรณ์กว่า

   สำคัญ:
   ID ใหม่กว่าใช้เป็น tie-breaker เพราะ Import ล่าสุด
   มีแนวโน้มเป็น record ที่เพิ่งถูกเขียนข้อมูลใหม่
   ========================================================= */

function getAssetScore(
  asset: CleanupAsset
): number {
  let score = 0;

  if (asset.governmentAssetNo?.trim()) {
    score += 10;
  }

  if (asset.officeAssetNo?.trim()) {
    score += 10;
  }

  if (asset.unit?.trim()) {
    score += 10;
  }

  if (
    asset.quantity &&
    asset.quantity > 0
  ) {
    score += 5;
  }

  if (asset.responsibleName?.trim()) {
    score += 10;
  }

  if (asset.name?.trim()) {
    score += 5;
  }

  return score;
}

/* =========================================================
   เลือก record ที่จะเก็บ

   1. คะแนนข้อมูลสูงกว่า
   2. ถ้าคะแนนเท่ากัน เก็บ ID ใหม่กว่า
   ========================================================= */

function chooseAssetToKeep(
  assets: CleanupAsset[]
): CleanupAsset {
  const sorted = [...assets].sort(
    (a, b) => {
      const scoreA = getAssetScore(a);
      const scoreB = getAssetScore(b);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return b.id - a.id;
    }
  );

  return sorted[0];
}

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log("");

  console.log(
    "======================================================"
  );
  console.log(
    " Cleanup Duplicate Import กลุ่มอำนวยการ"
  );
  console.log(
    "======================================================"
  );

  console.log(
    `Department ID        : ${DEPARTMENT_ID}`
  );

  console.log(
    `ต้นฉบับที่ต้องเหลือ : ${EXPECTED_SOURCE_COUNT} รายการ`
  );

  console.log("");

  /* =======================================================
     1. โหลด Department
     ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: DEPARTMENT_ID,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!department) {
    throw new Error(
      `ไม่พบ Department ID ${DEPARTMENT_ID}`
    );
  }

  console.log(
    `Department           : ${department.name}`
  );

  /* =======================================================
     2. โหลด Asset ทั้งหมด
     ======================================================= */

  const allAssets =
    await prisma.asset.findMany({
      where: {
        departmentId: DEPARTMENT_ID,
      },

      select: {
        id: true,
        name: true,
        governmentAssetNo: true,
        officeAssetNo: true,
        quantity: true,
        unit: true,
        responsibleName: true,
        remark: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  console.log(
    `ข้อมูลปัจจุบัน       : ${allAssets.length} รายการ`
  );

  /* =======================================================
     3. แยก record ตาม sourceOrder
     ======================================================= */

  const sourceMap =
    new Map<number, CleanupAsset[]>();

  const invalidMarkerAssets:
    CleanupAsset[] = [];

  for (const asset of allAssets) {
    const sourceOrder =
      extractSourceOrder(asset.remark);

    if (sourceOrder === null) {
      invalidMarkerAssets.push(asset);
      continue;
    }

    /*
     * Marker ต้องอยู่ในช่วง 1–446 เท่านั้น
     */

    if (
      sourceOrder < 1 ||
      sourceOrder > EXPECTED_SOURCE_COUNT
    ) {
      invalidMarkerAssets.push(asset);
      continue;
    }

    const current =
      sourceMap.get(sourceOrder) ?? [];

    current.push(asset);

    sourceMap.set(
      sourceOrder,
      current
    );
  }

  /* =======================================================
     4. ตรวจ sourceOrder ที่หาย
     ======================================================= */

  const missingSourceOrders: number[] =
    [];

  for (
    let sourceOrder = 1;
    sourceOrder <= EXPECTED_SOURCE_COUNT;
    sourceOrder += 1
  ) {
    if (!sourceMap.has(sourceOrder)) {
      missingSourceOrders.push(
        sourceOrder
      );
    }
  }

  /* =======================================================
     5. หา sourceOrder ซ้ำ
     ======================================================= */

  const duplicateGroups = [
    ...sourceMap.entries(),
  ].filter(
    ([, assets]) =>
      assets.length > 1
  );

  const duplicateRecordCount =
    duplicateGroups.reduce(
      (total, [, assets]) =>
        total +
        (assets.length - 1),
      0
    );

  /* =======================================================
     6. สรุปก่อน Cleanup
     ======================================================= */

  console.log("");

  console.log(
    "======================================================"
  );
  console.log(
    " ตรวจสอบ Source Marker"
  );
  console.log(
    "======================================================"
  );

  console.log(
    `SourceOrder ที่พบไม่ซ้ำ : ${sourceMap.size}`
  );

  console.log(
    `SourceOrder ที่หาย      : ${missingSourceOrders.length}`
  );

  console.log(
    `SourceOrder ที่ซ้ำ      : ${duplicateGroups.length}`
  );

  console.log(
    `Record ซ้ำส่วนเกิน      : ${duplicateRecordCount}`
  );

  console.log(
    `Marker ผิด/ไม่มี marker : ${invalidMarkerAssets.length}`
  );

  console.log("");

  /* =======================================================
     7. SAFETY CHECK สำคัญที่สุด

     ต้องมี sourceOrder ครบ 1–446 ก่อน
     ถึงจะอนุญาตให้ลบ duplicate
     ======================================================= */

  if (
    missingSourceOrders.length > 0
  ) {
    console.error(
      "SourceOrder ที่หาย:"
    );

    console.error(
      missingSourceOrders.join(", ")
    );

    throw new Error(
      [
        "หยุด Cleanup เพื่อความปลอดภัย",
        "",
        `พบ SourceOrder ไม่ครบ ${EXPECTED_SOURCE_COUNT} รายการ`,
        `หาย ${missingSourceOrders.length} sourceOrder`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  if (
    sourceMap.size !==
    EXPECTED_SOURCE_COUNT
  ) {
    throw new Error(
      [
        "หยุด Cleanup เพื่อความปลอดภัย",
        "",
        `ควรมี SourceOrder ไม่ซ้ำ ${EXPECTED_SOURCE_COUNT}`,
        `แต่พบ ${sourceMap.size}`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  /* =======================================================
     8. เตรียมรายการที่จะเก็บ / ลบ
     ======================================================= */

  const keepAssets:
    CleanupAsset[] = [];

  const duplicateAssetsToDelete:
    CleanupAsset[] = [];

  for (
    let sourceOrder = 1;
    sourceOrder <= EXPECTED_SOURCE_COUNT;
    sourceOrder += 1
  ) {
    const assets =
      sourceMap.get(sourceOrder);

    if (!assets || assets.length === 0) {
      throw new Error(
        `SourceOrder ${sourceOrder} ไม่มีข้อมูล`
      );
    }

    const keep =
      chooseAssetToKeep(assets);

    keepAssets.push(keep);

    for (const asset of assets) {
      if (asset.id !== keep.id) {
        duplicateAssetsToDelete.push(
          asset
        );
      }
    }
  }

  /*
   * Marker ผิดหรือไม่มี marker
   * ถือว่าไม่ใช่หนึ่งใน 446 source rows
   */

  const assetsToDelete = [
    ...duplicateAssetsToDelete,
    ...invalidMarkerAssets,
  ];

  /*
   * กัน ID ซ้ำใน delete list
   */

  const deleteIdSet =
    new Set<number>();

  for (const asset of assetsToDelete) {
    deleteIdSet.add(asset.id);
  }

  const deleteIds =
    [...deleteIdSet];

  /* =======================================================
     9. ตรวจสมการ

     จำนวนปัจจุบัน - จำนวนที่จะลบ
     ต้องเหลือ 446 พอดี
     ======================================================= */

  const expectedRemaining =
    allAssets.length -
    deleteIds.length;

  console.log(
    "======================================================"
  );

  console.log(
    " แผน Cleanup"
  );

  console.log(
    "======================================================"
  );

  console.log(
    `ข้อมูลปัจจุบัน     : ${allAssets.length}`
  );

  console.log(
    `ข้อมูลที่จะเก็บ    : ${keepAssets.length}`
  );

  console.log(
    `Duplicate ที่จะลบ : ${duplicateAssetsToDelete.length}`
  );

  console.log(
    `Marker ผิดที่จะลบ : ${invalidMarkerAssets.length}`
  );

  console.log(
    `รวมที่จะลบ        : ${deleteIds.length}`
  );

  console.log(
    `หลัง Cleanup       : ${expectedRemaining}`
  );

  console.log("");

  if (
    keepAssets.length !==
    EXPECTED_SOURCE_COUNT
  ) {
    throw new Error(
      [
        "หยุด Cleanup เพื่อความปลอดภัย",
        "",
        `รายการที่จะเก็บควรมี ${EXPECTED_SOURCE_COUNT}`,
        `แต่พบ ${keepAssets.length}`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  if (
    expectedRemaining !==
    EXPECTED_SOURCE_COUNT
  ) {
    throw new Error(
      [
        "หยุด Cleanup เพื่อความปลอดภัย",
        "",
        `หลัง Cleanup ต้องเหลือ ${EXPECTED_SOURCE_COUNT}`,
        `แต่จากการคำนวณจะเหลือ ${expectedRemaining}`,
        "",
        "ยังไม่มีข้อมูลใดถูกลบ",
      ].join("\n")
    );
  }

  /* =======================================================
     10. แสดง Duplicate
     ======================================================= */

  if (
    duplicateGroups.length > 0
  ) {
    console.log(
      "======================================================"
    );

    console.log(
      " SourceOrder ที่มีข้อมูลซ้ำ"
    );

    console.log(
      "======================================================"
    );

    for (
      const [
        sourceOrder,
        assets,
      ] of duplicateGroups
    ) {
      const keep =
        chooseAssetToKeep(assets);

      console.log("");

      console.log(
        `SourceOrder ${sourceOrder}`
      );

      for (const asset of assets) {
        const action =
          asset.id === keep.id
            ? "KEEP"
            : "DELETE";

        console.log(
          `  ${action} | ID ${asset.id} | ${asset.name} | GFMIS: ${
            asset.governmentAssetNo ??
            "-"
          } | รหัส: ${
            asset.officeAssetNo ??
            "-"
          } | หน่วย: ${
            asset.unit ?? "-"
          }`
        );
      }
    }

    console.log("");
  }

  /* =======================================================
     11. แสดง Marker ผิด
     ======================================================= */

  if (
    invalidMarkerAssets.length > 0
  ) {
    console.log(
      "======================================================"
    );

    console.log(
      " รายการ Marker ผิด/ไม่มี Marker"
    );

    console.log(
      "======================================================"
    );

    for (
      const asset of
      invalidMarkerAssets
    ) {
      console.log(
        `DELETE | ID ${asset.id} | ${asset.name}`
      );
    }

    console.log("");
  }

  /* =======================================================
     12. ถ้าไม่มีอะไรต้องลบ
     ======================================================= */

  if (deleteIds.length === 0) {
    console.log(
      `✅ ไม่พบข้อมูลซ้ำ Department ${DEPARTMENT_ID} มี ${allAssets.length} รายการ`
    );

    return;
  }

  /* =======================================================
     13. Transaction ลบจริง
     ======================================================= */

  console.log(
    "======================================================"
  );

  console.log(
    " เริ่ม Cleanup"
  );

  console.log(
    "======================================================"
  );

  const result =
    await prisma.$transaction(
      async (tx) => {
        /*
         * ลบเฉพาะ ID ที่ผ่าน Safety Check
         */

        const deleted =
          await tx.asset.deleteMany({
            where: {
              departmentId:
                DEPARTMENT_ID,

              id: {
                in: deleteIds,
              },
            },
          });

        if (
          deleted.count !==
          deleteIds.length
        ) {
          throw new Error(
            [
              "จำนวนที่ลบไม่ตรง",
              "",
              `ควรลบ ${deleteIds.length}`,
              `ลบจริง ${deleted.count}`,
              "",
              "Transaction จะ Rollback",
            ].join("\n")
          );
        }

        /* -----------------------------------------------
           ตรวจจำนวนหลังลบ
           ----------------------------------------------- */

        const remaining =
          await tx.asset.findMany({
            where: {
              departmentId:
                DEPARTMENT_ID,
            },

            select: {
              id: true,
              remark: true,
            },
          });

        if (
          remaining.length !==
          EXPECTED_SOURCE_COUNT
        ) {
          throw new Error(
            [
              "จำนวนหลัง Cleanup ไม่ถูกต้อง",
              "",
              `ควรเหลือ ${EXPECTED_SOURCE_COUNT}`,
              `แต่เหลือ ${remaining.length}`,
              "",
              "Transaction จะ Rollback",
            ].join("\n")
          );
        }

        /* -----------------------------------------------
           ตรวจ sourceOrder หลังลบ
           ----------------------------------------------- */

        const finalSourceOrders =
          new Set<number>();

        for (const asset of remaining) {
          const sourceOrder =
            extractSourceOrder(
              asset.remark
            );

          if (
            sourceOrder === null ||
            sourceOrder < 1 ||
            sourceOrder >
              EXPECTED_SOURCE_COUNT
          ) {
            throw new Error(
              [
                "พบ Marker ผิดหลัง Cleanup",
                `Asset ID ${asset.id}`,
                "",
                "Transaction จะ Rollback",
              ].join("\n")
            );
          }

          if (
            finalSourceOrders.has(
              sourceOrder
            )
          ) {
            throw new Error(
              [
                "ยังพบ SourceOrder ซ้ำหลัง Cleanup",
                `SourceOrder ${sourceOrder}`,
                "",
                "Transaction จะ Rollback",
              ].join("\n")
            );
          }

          finalSourceOrders.add(
            sourceOrder
          );
        }

        if (
          finalSourceOrders.size !==
          EXPECTED_SOURCE_COUNT
        ) {
          throw new Error(
            [
              "จำนวน SourceOrder หลัง Cleanup ไม่ถูกต้อง",
              "",
              `ควรมี ${EXPECTED_SOURCE_COUNT}`,
              `แต่พบ ${finalSourceOrders.size}`,
              "",
              "Transaction จะ Rollback",
            ].join("\n")
          );
        }

        return {
          deleted:
            deleted.count,

          remaining:
            remaining.length,

          sourceOrders:
            finalSourceOrders.size,
        };
      }
    );

  /* =======================================================
     14. ตรวจฐานข้อมูลหลัง Transaction
     ======================================================= */

  const finalAssets =
    await prisma.asset.findMany({
      where: {
        departmentId:
          DEPARTMENT_ID,
      },

      select: {
        id: true,
        remark: true,
        governmentAssetNo: true,
        officeAssetNo: true,
        quantity: true,
        unit: true,
        responsibleName: true,
      },
    });

  const finalSourceMap =
    new Map<number, number>();

  let invalidFinalMarker = 0;

  for (const asset of finalAssets) {
    const sourceOrder =
      extractSourceOrder(
        asset.remark
      );

    if (
      sourceOrder === null ||
      sourceOrder < 1 ||
      sourceOrder >
        EXPECTED_SOURCE_COUNT
    ) {
      invalidFinalMarker += 1;
      continue;
    }

    finalSourceMap.set(
      sourceOrder,
      (finalSourceMap.get(
        sourceOrder
      ) ?? 0) + 1
    );
  }

  const finalDuplicates =
    [...finalSourceMap.values()].filter(
      (count) => count > 1
    ).length;

  const governmentCount =
    finalAssets.filter(
      (asset) =>
        Boolean(
          asset.governmentAssetNo?.trim()
        )
    ).length;

  const officeCount =
    finalAssets.filter(
      (asset) =>
        Boolean(
          asset.officeAssetNo?.trim()
        )
    ).length;

  const unitCount =
    finalAssets.filter(
      (asset) =>
        Boolean(asset.unit?.trim())
    ).length;

  const responsibleCount =
    finalAssets.filter(
      (asset) =>
        Boolean(
          asset.responsibleName?.trim()
        )
    ).length;

  /* =======================================================
     15. FINAL RESULT
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
    `ข้อมูลก่อน Cleanup     : ${allAssets.length}`
  );

  console.log(
    `ลบข้อมูลซ้ำ/ส่วนเกิน   : ${result.deleted}`
  );

  console.log(
    `ข้อมูลคงเหลือ          : ${result.remaining}`
  );

  console.log(
    `SourceOrder ไม่ซ้ำ     : ${result.sourceOrders}`
  );

  console.log("");

  console.log(
    "======================================================"
  );

  console.log(
    " ตรวจฐานข้อมูลล่าสุด"
  );

  console.log(
    "======================================================"
  );

  console.log(
    `Department 1 ทั้งหมด   : ${finalAssets.length}`
  );

  console.log(
    `SourceOrder            : ${finalSourceMap.size}`
  );

  console.log(
    `SourceOrder ซ้ำ        : ${finalDuplicates}`
  );

  console.log(
    `Marker ผิด             : ${invalidFinalMarker}`
  );

  console.log("");

  console.log(
    `มี GFMIS              : ${governmentCount}`
  );

  console.log(
    `มีรหัสครุภัณฑ์        : ${officeCount}`
  );

  console.log(
    `มีหน่วย               : ${unitCount}`
  );

  console.log(
    `มีผู้รับผิดชอบ        : ${responsibleCount}`
  );

  console.log("");

  if (
    finalAssets.length ===
      EXPECTED_SOURCE_COUNT &&
    finalSourceMap.size ===
      EXPECTED_SOURCE_COUNT &&
    finalDuplicates === 0 &&
    invalidFinalMarker === 0
  ) {
    console.log(
      `✅ Cleanup สมบูรณ์ กลุ่มอำนวยการเหลือ ${EXPECTED_SOURCE_COUNT} รายการ`
    );
  } else {
    throw new Error(
      "ผลตรวจหลัง Cleanup ไม่ผ่าน"
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