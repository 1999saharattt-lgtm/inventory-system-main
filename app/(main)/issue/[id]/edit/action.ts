"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
    const materialValue =
      formData.get(
        `items[${i}].materialId`
      );

    const qtyValue =
      formData.get(
        `items[${i}].qty`
      );

    const materialId =
      Number(
        materialValue
      );

    const qty =
      Number(
        qtyValue
      );

    if (
      Number.isInteger(
        materialId
      ) &&
      materialId > 0 &&
      Number.isFinite(qty) &&
      qty > 0
    ) {
      newItems.push({
        materialId,
        qty,
      });
    }
  }

  console.log(
    "UPDATE ISSUE FORM",
    {
      issueId,
      documentNo,
      newItems,
    }
  );

  if (
    newItems.length === 0
  ) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );
  }

  try {
    await prisma.$transaction(
      async (tx: any) => {
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

        console.log(
          "OLD ISSUE ITEMS",
          oldIssue.items.map(
            (item: any) => ({
              issueItemId:
                item.id,
              materialId:
                item.materialId,
              qty:
                item.qty,
              receiveItemId:
                item.receiveItemId,
            })
          )
        );

        const affectedMaterialIds =
          [
            ...new Set([
              ...oldIssue.items.map(
                (item: any) =>
                  item.materialId
              ),
              ...newItems.map(
                (item) =>
                  item.materialId
              ),
            ]),
          ];

        for (
          const oldItem
          of oldIssue.items
        ) {
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

        await tx.issueItem.deleteMany({
          where: {
            issueId,
          },
        });

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

          console.log(
            "EDIT ISSUE LOT CHECK",
            {
              issueId,
              materialId:
                item.materialId,
              materialName:
                material.name,
              requested:
                item.qty,
              lotBalance:
                totalReceiveBalance,
              lots:
                receiveItems.map(
                  (
                    receiveItem: any
                  ) => ({
                    id:
                      receiveItem.id,
                    qty:
                      receiveItem.qty,
                    balance:
                      receiveItem.balance,
                    manufacture:
                      receiveItem.manufacture,
                    expiry:
                      receiveItem.expiry,
                  })
                ),
            }
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

        for (
          const materialId
          of affectedMaterialIds
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
              id:
                materialId,
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
        timeout: 120000,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE ISSUE ERROR:",
      error
    );

    throw error;
  }

  // บังคับให้หน้า Issue และหน้ารายละเอียด
  // ดึงข้อมูลใหม่จากฐานข้อมูล
  revalidatePath("/issue");
  revalidatePath(
    `/issue/${issueId}`
  );

  redirect("/issue");
}