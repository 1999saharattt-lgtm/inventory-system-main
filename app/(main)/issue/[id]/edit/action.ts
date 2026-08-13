"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type IssueRow = {
  materialId: number;
  qty: number;
};

function sortFEFO(a: any, b: any) {
  const aUnspecified =
    !a.manufacture &&
    !a.expiry;

  const bUnspecified =
    !b.manufacture &&
    !b.expiry;

  // ไม่มี manufacture + expiry มาก่อน
  if (
    aUnspecified &&
    !bUnspecified
  ) {
    return -1;
  }

  if (
    !aUnspecified &&
    bUnspecified
  ) {
    return 1;
  }

  // ทั้งคู่ไม่มีวัน
  if (
    aUnspecified &&
    bUnspecified
  ) {
    return a.id - b.id;
  }

  const aExpiry =
    a.expiry
      ? new Date(
          a.expiry
        ).getTime()
      : Number.MAX_SAFE_INTEGER;

  const bExpiry =
    b.expiry
      ? new Date(
          b.expiry
        ).getTime()
      : Number.MAX_SAFE_INTEGER;

  if (
    aExpiry !== bExpiry
  ) {
    return (
      aExpiry -
      bExpiry
    );
  }

  const aManufacture =
    a.manufacture
      ? new Date(
          a.manufacture
        ).getTime()
      : Number.MAX_SAFE_INTEGER;

  const bManufacture =
    b.manufacture
      ? new Date(
          b.manufacture
        ).getTime()
      : Number.MAX_SAFE_INTEGER;

  if (
    aManufacture !==
    bManufacture
  ) {
    return (
      aManufacture -
      bManufacture
    );
  }

  return a.id - b.id;
}

export async function updateIssue(
  formData: FormData
) {
  const issueId =
    Number(
      formData.get("issueId")
    );

  const issueDate =
    new Date(
      formData.get(
        "issueDate"
      ) as string
    );

  const documentNo =
    formData.get(
      "documentNo"
    ) as string;

  const departmentId =
    Number(
      formData.get(
        "departmentId"
      )
    );

  const remark =
    (formData.get(
      "remark"
    ) as string) || "";

  const newItems: IssueRow[] =
    [];

  for (
    let i = 0;
    i < 15;
    i++
  ) {
    const materialId =
      Number(
        formData.get(
          `items[${i}].materialId`
        )
      );

    const qty =
      Number(
        formData.get(
          `items[${i}].qty`
        )
      );

    if (
      materialId &&
      qty > 0
    ) {
      newItems.push({
        materialId,
        qty,
      });
    }
  }

  if (
    newItems.length === 0
  ) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );
  }

  await prisma.$transaction(
    async (tx: any) => {

      // =====================================================
      // ดึงใบเบิกเดิม
      // =====================================================

      const oldIssue =
        await tx.issue.findUnique({
          where: {
            id: issueId,
          },

          include: {
            items: true,
          },
        });

      if (!oldIssue) {
        throw new Error(
          "ไม่พบใบเบิก"
        );
      }

      // =====================================================
      // คืนยอดจากใบเบิกเดิม
      // =====================================================

      for (
        const oldItem
        of oldIssue.items
      ) {

        // คืน Material.balance
        await tx.material.update({
          where: {
            id:
              oldItem.materialId,
          },

          data: {
            balance: {
              increment:
                oldItem.qty,
            },
          },
        });

        // คืนยอดล็อตเดิม
        if (
          oldItem.receiveItemId
        ) {
          await tx.receiveItem.update({
            where: {
              id:
                oldItem.receiveItemId,
            },

            data: {
              balance: {
                increment:
                  oldItem.qty,
              },
            },
          });
        }
      }

      // =====================================================
      // ลบ IssueItem เดิม
      // =====================================================

      await tx.issueItem.deleteMany({
        where: {
          issueId,
        },
      });

      // =====================================================
      // แก้ข้อมูลใบเบิก
      // =====================================================

      await tx.issue.update({
        where: {
          id: issueId,
        },

        data: {
          issueDate,
          documentNo,
          departmentId,
          remark,
        },
      });

      // =====================================================
      // เก็บ Material.balance ที่คำนวณจากล็อต
      // หลังจากการคืนล็อตเดิม
      // =====================================================

      const materialIds =
        [
          ...new Set(
            newItems.map(
              (item) =>
                item.materialId
            )
          ),
        ];

      // =====================================================
      // สร้างรายการใหม่ตาม FEFO
      // =====================================================

      for (
        const item of newItems
      ) {

        const material =
          await tx.material.findUnique({
            where: {
              id:
                item.materialId,
            },
          });

        if (!material) {
          throw new Error(
            `ไม่พบพัสดุ ID ${item.materialId}`
          );
        }

        // ===================================================
        // ดึงล็อตที่ยังเหลือ
        // ===================================================

        const receiveItems =
          await tx.receiveItem.findMany({
            where: {
              materialId:
                item.materialId,

              balance: {
                gt: 0,
              },
            },
          });

        receiveItems.sort(
          sortFEFO
        );

        // ===================================================
        // ตรวจยอดล็อต
        // ===================================================

        const totalReceiveBalance =
          receiveItems.reduce(
            (
              sum: number,
              receiveItem: any
            ) =>
              sum +
              Number(
                receiveItem.balance
              ),
            0
          );

        if (
          totalReceiveBalance <
          item.qty
        ) {
          throw new Error(
            `พัสดุ "${material.name}" มีจำนวนในล็อตไม่เพียงพอ (ล็อตเหลือ ${totalReceiveBalance} แต่ต้องการเบิก ${item.qty})`
          );
        }

        let remainingQty =
          item.qty;

        // ===================================================
        // ตัดล็อตตาม FEFO
        // ===================================================

        for (
          const receiveItem
          of receiveItems
        ) {

          if (
            remainingQty <= 0
          ) {
            break;
          }

          const available =
            Number(
              receiveItem.balance
            );

          const issueQty =
            Math.min(
              remainingQty,
              available
            );

          if (
            issueQty <= 0
          ) {
            continue;
          }

          // ลด ReceiveItem.balance
          await tx.receiveItem.update({
            where: {
              id:
                receiveItem.id,
            },

            data: {
              balance: {
                decrement:
                  issueQty,
              },
            },
          });

          // สร้าง IssueItem
          await tx.issueItem.create({
            data: {
              issueId,
              materialId:
                item.materialId,

              receiveItemId:
                receiveItem.id,

              qty:
                issueQty,

              manufacture:
                receiveItem.manufacture,

              expiry:
                receiveItem.expiry,
            },
          });

          remainingQty -=
            issueQty;
        }

        if (
          remainingQty > 0
        ) {
          throw new Error(
            `พัสดุ "${material.name}" ไม่สามารถตัดล็อตได้ครบ ${remainingQty} หน่วย`
          );
        }
      }

      // =====================================================
      // คำนวณ Material.balance ใหม่จาก ReceiveItem
      // หลังจากตัดล็อตทั้งหมด
      // =====================================================

      for (
        const materialId
        of materialIds
      ) {

        const remainingLots =
          await tx.receiveItem.aggregate({
            where: {
              materialId,
            },

            _sum: {
              balance: true,
            },
          });

        const newBalance =
          Number(
            remainingLots._sum
              .balance ?? 0
          );

        await tx.material.update({
          where: {
            id: materialId,
          },

          data: {
            balance:
              newBalance,
          },
        });
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  redirect("/issue");
}