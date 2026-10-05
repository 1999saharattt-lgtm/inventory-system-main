"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { verifySession } from "@/lib/session";

/* =========================================================
   TYPES
========================================================= */

type LotForFefo = {
  id: number;

  balance: number;

  manufacture:
    Date | null;

  expiry:
    Date | null;
};

/* =========================================================
   FEFO SORT

   ลำดับ:
   1. มีวันหมดอายุ -> หมดอายุก่อน
   2. expiry เท่ากัน -> วันผลิตเก่าก่อน
   3. ไม่มี expiry -> อยู่ท้าย
   4. id เก่าก่อน

   ทำใน JS เพื่อไม่ต้องพึ่ง NULL sorting
   ของ database
========================================================= */

function sortLotsByFefo<
  T extends LotForFefo
>(
  lots: T[]
) {
  return [...lots].sort(
    (
      a,
      b
    ) => {
      /* ===================================================
         EXPIRY

         มี expiry มาก่อน
         ไม่มี expiry อยู่ท้าย
      =================================================== */

      const aHasExpiry =
        Boolean(
          a.expiry
        );

      const bHasExpiry =
        Boolean(
          b.expiry
        );

      if (
        aHasExpiry &&
        !bHasExpiry
      ) {
        return -1;
      }

      if (
        !aHasExpiry &&
        bHasExpiry
      ) {
        return 1;
      }

      if (
        aHasExpiry &&
        bHasExpiry
      ) {
        const aExpiry =
          new Date(
            a.expiry as Date
          ).getTime();

        const bExpiry =
          new Date(
            b.expiry as Date
          ).getTime();

        if (
          aExpiry !==
          bExpiry
        ) {
          return (
            aExpiry -
            bExpiry
          );
        }
      }

      /* ===================================================
         MANUFACTURE

         วันผลิตเก่าก่อน

         ถ้าไม่มีวันผลิต
         ให้อยู่หลังล็อตที่มีวันผลิต
      =================================================== */

      const aHasManufacture =
        Boolean(
          a.manufacture
        );

      const bHasManufacture =
        Boolean(
          b.manufacture
        );

      if (
        aHasManufacture &&
        !bHasManufacture
      ) {
        return -1;
      }

      if (
        !aHasManufacture &&
        bHasManufacture
      ) {
        return 1;
      }

      if (
        aHasManufacture &&
        bHasManufacture
      ) {
        const aManufacture =
          new Date(
            a.manufacture as Date
          ).getTime();

        const bManufacture =
          new Date(
            b.manufacture as Date
          ).getTime();

        if (
          aManufacture !==
          bManufacture
        ) {
          return (
            aManufacture -
            bManufacture
          );
        }
      }

      /* ===================================================
         FALLBACK
      =================================================== */

      return (
        a.id -
        b.id
      );
    }
  );
}

/* =========================================================
   APPROVE ISSUE
========================================================= */

export async function approveIssue(
  issueId: number,
  issuedQty: Record<
    number,
    number
  >
) {
  /* =======================================================
     SESSION
  ======================================================= */

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "session"
    )?.value;

  if (!token) {
    throw new Error(
      "กรุณาเข้าสู่ระบบ"
    );
  }

  let session;

  try {
    session =
      await verifySession(
        token
      );
  } catch {
    throw new Error(
      "Session ไม่ถูกต้องหรือหมดอายุ"
    );
  }

  /* =======================================================
     ADMIN ONLY
  ======================================================= */

  if (
    session.role !==
    "ADMIN"
  ) {
    throw new Error(
      "คุณไม่มีสิทธิ์ดำเนินการใบเบิก"
    );
  }

  /* =======================================================
     VALIDATE ISSUE ID
  ======================================================= */

  if (
    !Number.isInteger(
      issueId
    ) ||
    issueId <=
      0
  ) {
    throw new Error(
      "เลขที่ใบเบิกไม่ถูกต้อง"
    );
  }

  /* =======================================================
     LOAD ISSUE

     ต้องใช้:
     - department.name สำหรับ Stock Card
     - issueDate
     - documentNo
     - remark
     - material
  ======================================================= */

  const issue =
    await prisma.issue.findUnique({
      where: {
        id:
          issueId,
      },

      include: {
        department:
          true,

        items: {
          include: {
            material:
              true,
          },
        },
      },
    });

  if (!issue) {
    throw new Error(
      "ไม่พบรายการเบิก"
    );
  }

  if (
    issue.status !==
    "PENDING"
  ) {
    throw new Error(
      "ใบเบิกนี้ดำเนินการไปแล้ว"
    );
  }

  /* =======================================================
     VALIDATE ACTUAL ISSUED QTY
  ======================================================= */

  for (
    const item of
      issue.items
  ) {
    const value =
      issuedQty[
        item.id
      ];

    if (
      value ===
      undefined
    ) {
      throw new Error(
        `กรุณาระบุจำนวนเบิกจ่ายจริงสำหรับ "${item.material.name}"`
      );
    }

    if (
      !Number.isFinite(
        value
      ) ||
      !Number.isInteger(
        value
      ) ||
      value <
        0
    ) {
      throw new Error(
        `จำนวนเบิกจ่ายของ "${item.material.name}" ไม่ถูกต้อง`
      );
    }

    if (
      value >
      Number(
        item.qty
      )
    ) {
      throw new Error(
        `จำนวนเบิกจ่ายของ "${item.material.name}" มากกว่าจำนวนที่ขอเบิก`
      );
    }
  }

  /* =======================================================
     TRANSACTION

     ทุกอย่างต้องสำเร็จพร้อมกัน:

     1. ตรวจ Issue
     2. ตัด ReceiveItem.balance
     3. ลด Material.balance
     4. update IssueItem
     5. create Transaction Stock Card
     6. APPROVED
  ======================================================= */

  await prisma.$transaction(
    async (
      tx
    ) => {
      /* =================================================
         RE-CHECK STATUS INSIDE TRANSACTION

         ป้องกันการกดอนุมัติซ้ำพร้อมกัน
      ================================================= */

      const currentIssue =
        await tx.issue.findUnique({
          where: {
            id:
              issue.id,
          },

          select: {
            id:
              true,

            status:
              true,
          },
        });

      if (
        !currentIssue
      ) {
        throw new Error(
          "ไม่พบรายการเบิก"
        );
      }

      if (
        currentIssue.status !==
        "PENDING"
      ) {
        throw new Error(
          "ใบเบิกนี้ดำเนินการไปแล้ว"
        );
      }

      /* =================================================
         PROCESS EACH ISSUE ITEM
      ================================================= */

      for (
        const item of
          issue.items
      ) {
        const quantityToIssue =
          Number(
            issuedQty[
              item.id
            ] ??
              0
          );

        /* ===============================================
           ZERO ISSUE

           จ่ายจริง 0:
           - update IssueItem
           - ไม่ตัด stock
           - ไม่สร้าง Stock Card movement
        =============================================== */

        if (
          quantityToIssue ===
          0
        ) {
          await tx.issueItem.update({
            where: {
              id:
                item.id,
            },

            data: {
              issuedQty:
                0,

              receiveItemId:
                null,

              manufacture:
                null,

              expiry:
                null,
            },
          });

          continue;
        }

        /* ===============================================
           LOAD AVAILABLE LOTS

           ดึงทุกล็อตที่ยังเหลือ

           แล้ว sort FEFO ใน JS
           เพื่อให้ NULL expiry อยู่ท้ายแน่นอน
        =============================================== */

        const rawReceiveItems =
          await tx.receiveItem.findMany({
            where: {
              materialId:
                item.materialId,

              balance: {
                gt:
                  0,
              },
            },

            select: {
              id:
                true,

              balance:
                true,

              manufacture:
                true,

              expiry:
                true,
            },
          });

        const receiveItems =
          sortLotsByFefo(
            rawReceiveItems
          );

        /* ===============================================
           AVAILABLE STOCK
        =============================================== */

        const totalAvailable =
          receiveItems.reduce(
            (
              sum,
              receiveItem
            ) =>
              sum +
              Number(
                receiveItem.balance
              ),
            0
          );

        if (
          totalAvailable <
          quantityToIssue
        ) {
          throw new Error(
            `พัสดุ "${item.material.name}" มีจำนวนในล็อตไม่เพียงพอ ` +
              `(มี ${totalAvailable} แต่ต้องการ ${quantityToIssue})`
          );
        }

        /* ===============================================
           MATERIAL BALANCE CHECK

           ReceiveItem.balance และ Material.balance
           ควรสอดคล้องกัน

           อย่างน้อย Material.balance ต้องพอตัด
        =============================================== */

        const currentMaterial =
          await tx.material.findUnique({
            where: {
              id:
                item.materialId,
            },

            select: {
              id:
                true,

              name:
                true,

              balance:
                true,

              latestPrice:
                true,
            },
          });

        if (
          !currentMaterial
        ) {
          throw new Error(
            `ไม่พบพัสดุ "${item.material.name}"`
          );
        }

        const currentMaterialBalance =
          Number(
            currentMaterial.balance ??
              0
          );

        if (
          currentMaterialBalance <
          quantityToIssue
        ) {
          throw new Error(
            `ยอดคงเหลือรวมของ "${item.material.name}" ไม่เพียงพอ ` +
              `(คงเหลือ ${currentMaterialBalance} แต่ต้องการจ่าย ${quantityToIssue})`
          );
        }

        /* ===============================================
           FEFO DEDUCTION
        =============================================== */

        let remaining =
          quantityToIssue;

        let firstReceiveItemId:
          number | null =
          null;

        let firstManufacture:
          Date | null =
          null;

        let firstExpiry:
          Date | null =
          null;

        for (
          const receiveItem of
            receiveItems
        ) {
          if (
            remaining <=
            0
          ) {
            break;
          }

          const available =
            Number(
              receiveItem.balance
            );

          if (
            available <=
            0
          ) {
            continue;
          }

          const deduct =
            Math.min(
              available,
              remaining
            );

          const newLotBalance =
            available -
            deduct;

          /* =============================================
             UPDATE LOT BALANCE
          ============================================= */

          await tx.receiveItem.update({
            where: {
              id:
                receiveItem.id,
            },

            data: {
              balance:
                newLotBalance,
            },
          });

          /* =============================================
             FIRST LOT INFORMATION

             Schema IssueItem มี receiveItemId เดียว

             จึงเก็บ lot แรกที่ถูก FEFO
             ตามโครงสร้างระบบเดิม
          ============================================= */

          if (
            firstReceiveItemId ===
            null
          ) {
            firstReceiveItemId =
              receiveItem.id;

            firstManufacture =
              receiveItem.manufacture;

            firstExpiry =
              receiveItem.expiry;
          }

          remaining -=
            deduct;
        }

        /* ===============================================
           SAFETY CHECK
        =============================================== */

        if (
          remaining >
          0
        ) {
          throw new Error(
            `ไม่สามารถตัดสต็อก "${item.material.name}" ได้ครบ ` +
              `(เหลือ ${remaining} หน่วย)`
          );
        }

        /* ===============================================
           UPDATE MATERIAL

           สำคัญ:
           return balance หลัง decrement

           ค่านี้จะถูกบันทึกลง Transaction.balance
        =============================================== */

        const updatedMaterial =
          await tx.material.update({
            where: {
              id:
                item.materialId,
            },

            data: {
              balance: {
                decrement:
                  quantityToIssue,
              },
            },

            select: {
              id:
                true,

              balance:
                true,

              latestPrice:
                true,
            },
          });

        /* ===============================================
           SAFETY: NEGATIVE BALANCE
        =============================================== */

        if (
          Number(
            updatedMaterial.balance
          ) <
          0
        ) {
          throw new Error(
            `ยอดคงเหลือของ "${item.material.name}" ติดลบ ระบบยกเลิกรายการแล้ว`
          );
        }

        /* ===============================================
           UPDATE ISSUE ITEM
        =============================================== */

        await tx.issueItem.update({
          where: {
            id:
              item.id,
          },

          data: {
            issuedQty:
              quantityToIssue,

            receiveItemId:
              firstReceiveItemId,

            manufacture:
              firstManufacture,

            expiry:
              firstExpiry,
          },
        });

        /* ===============================================
           STOCK CARD TRANSACTION

           สำคัญสำหรับระบบยอดยกต้นปี

           เช่น:

           ก่อนจ่าย = 25
           จ่าย      = 4

           Transaction:
           receiveQty = 0
           issueQty   = 4
           balance    = 21

           วันที่ใช้ issue.issueDate
           ไม่ใช่ approvedAt
        =============================================== */

        await tx.transaction.create({
          data: {
            materialId:
              item.materialId,

            date:
              issue.issueDate,

            type:
              "ISSUE",

            documentNo:
              issue.documentNo,

            receiveQty:
              0,

            issueQty:
              quantityToIssue,

            balance:
              Number(
                updatedMaterial.balance
              ),

            unitPrice:
              Number(
                updatedMaterial.latestPrice ??
                  currentMaterial.latestPrice ??
                  0
              ),

            vendor:
              null,

            department:
              issue.department
                ?.name ??
              null,

            remark:
              issue.remark ??
              "",
          },
        });
      }

      /* =================================================
         APPROVE ISSUE
      ================================================= */

      await tx.issue.update({
        where: {
          id:
            issue.id,
        },

        data: {
          status:
            "APPROVED",

          approvedAt:
            new Date(),

          approvedById:
            session.id,
        },
      });
    },
    {
      maxWait:
        30000,

      timeout:
        60000,
    }
  );

  /* =======================================================
     REVALIDATE
  ======================================================= */

  revalidatePath(
    "/issue"
  );

  revalidatePath(
    `/issue/${issueId}`
  );

  revalidatePath(
    `/issue/${issueId}/approve`
  );

  revalidatePath(
    "/stock-card"
  );

  /*
   * Stock Card หมวดและรายวัสดุ
   * เป็น dynamic page อยู่แล้ว
   * แต่ revalidate ระดับ root เพิ่มไว้
  */

  revalidatePath(
    "/stock-card",
    "layout"
  );

  revalidatePath(
    "/materials"
  );

  revalidatePath(
    "/notifications"
  );

  return {
    success:
      true,

    issueId,
  };
}