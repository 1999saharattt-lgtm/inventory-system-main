"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type ReceiveRow = {
  materialId: number;
  qty: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
};

function sameDate(
  a: Date | null,
  b: Date | null
) {
  if (!a && !b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return (
    new Date(a).getTime() ===
    new Date(b).getTime()
  );
}

export async function updateReceive(
  formData: FormData
) {
  const receiveId = Number(
    formData.get("receiveId")
  );

  const receiveDate = new Date(
    formData.get("receiveDate") as string
  );

  const documentNo =
    (formData.get("documentNo") as string) || "";

  const vendorId = Number(
    formData.get("vendorId")
  );

  const remark =
    (formData.get("remark") as string) || "";

  const items: ReceiveRow[] = [];

  // =====================================================
  // อ่านรายการรับเข้าจาก FormData
  // =====================================================

  for (let i = 0; i < 15; i++) {
    const materialId = Number(
      formData.get(
        `items[${i}].materialId`
      )
    );

    const qty = Number(
      formData.get(
        `items[${i}].qty`
      )
    );

    const unitPrice = Number(
      formData.get(
        `items[${i}].unitPrice`
      )
    );

    const manufactureValue =
      formData.get(
        `items[${i}].manufacture`
      ) as string;

    const expiryValue =
      formData.get(
        `items[${i}].expiry`
      ) as string;

    const manufacture =
      manufactureValue
        ? new Date(
            manufactureValue
          )
        : null;

    const expiry =
      expiryValue
        ? new Date(expiryValue)
        : null;

    if (
      materialId > 0 &&
      qty > 0
    ) {
      items.push({
        materialId,
        qty,
        unitPrice,
        manufacture,
        expiry,
      });
    }
  }

  if (items.length === 0) {
    throw new Error(
      "กรุณาเลือกรายการรับเข้า"
    );
  }

  // =====================================================
  // Transaction
  // =====================================================

  await prisma.$transaction(
    async (tx: any) => {
      // =================================================
      // ตรวจสอบใบรับเดิม
      // =================================================

      const receive =
        await tx.receive.findUnique({
          where: {
            id: receiveId,
          },
        });

      if (!receive) {
        throw new Error(
          "ไม่พบใบรับเข้า"
        );
      }

      // =================================================
      // ดึง ReceiveItem เดิม
      // =================================================

      const oldItems =
        await tx.receiveItem.findMany({
          where: {
            receiveId,
          },

          orderBy: {
            id: "asc",
          },
        });

      // =================================================
      // หา Material ที่ได้รับผลกระทบ
      // =================================================

      const affectedMaterialIds = [
        ...new Set([
          ...oldItems.map(
            (item: any) =>
              item.materialId
          ),

          ...items.map(
            (item) =>
              item.materialId
          ),
        ]),
      ];

      // =================================================
      // ตรวจว่า ReceiveItem เดิมตัวไหนถูกเบิกไปแล้ว
      // =================================================

      const oldItemUsage =
        new Map<
          number,
          {
            issueQty: number;
            issueItemIds: number[];
          }
        >();

      for (
        const oldItem of oldItems
      ) {
        const issueItems =
          await tx.issueItem.findMany({
            where: {
              receiveItemId:
                oldItem.id,
            },

            select: {
              id: true,
              qty: true,
            },
          });

        oldItemUsage.set(
          oldItem.id,
          {
            issueQty:
              issueItems.reduce(
                (
                  sum: number,
                  issueItem: any
                ) =>
                  sum +
                  Number(
                    issueItem.qty
                  ),
                0
              ),

            issueItemIds:
              issueItems.map(
                (
                  issueItem: any
                ) =>
                  issueItem.id
              ),
          }
        );
      }

      // =================================================
      // แบ่งล็อตเดิมออกเป็น:
      //
      // 1. ล็อตที่ถูกเบิกแล้ว
      //    ห้ามลบ / ห้ามสร้างทับ
      //
      // 2. ล็อตที่ยังไม่เคยเบิก
      //    สามารถลบและสร้างใหม่ตามฟอร์มได้
      // =================================================

      const protectedOldItems =
        oldItems.filter(
          (item: any) =>
            (
              oldItemUsage.get(
                item.id
              )?.issueQty ?? 0
            ) > 0
        );

      const editableOldItems =
        oldItems.filter(
          (item: any) =>
            (
              oldItemUsage.get(
                item.id
              )?.issueQty ?? 0
            ) === 0
        );

      // =================================================
      // ลบเฉพาะ ReceiveItem เดิม
      // ที่ยังไม่เคยถูกเบิก
      // =================================================

      if (
        editableOldItems.length >
        0
      ) {
        await tx.receiveItem.deleteMany(
          {
            where: {
              id: {
                in:
                  editableOldItems.map(
                    (item: any) =>
                      item.id
                  ),
              },
            },
          }
        );
      }

      // =================================================
      // แก้หัวเอกสาร
      // =================================================

      await tx.receive.update({
        where: {
          id: receiveId,
        },

        data: {
          receiveDate,
          documentNo,
          vendorId,
          remark,
        },
      });

      // =================================================
      // จัดรายการจากฟอร์มกับล็อตเดิมที่มีการเบิกแล้ว
      // =================================================

      const remainingFormItems =
        [...items];

      for (
        const oldItem of
        protectedOldItems
      ) {
        const usage =
          oldItemUsage.get(
            oldItem.id
          );

        const oldIssueQty =
          usage?.issueQty ?? 0;

        // หาแถวในฟอร์มที่ตรงกับล็อตเดิม
        const formIndex =
          remainingFormItems.findIndex(
            (item) =>
              item.materialId ===
                oldItem.materialId &&
              sameDate(
                item.manufacture,
                oldItem.manufacture
              ) &&
              sameDate(
                item.expiry,
                oldItem.expiry
              )
          );

        // -------------------------------------------------
        // ถ้าไม่พบในฟอร์ม
        // แปลว่าผู้ใช้พยายามลบล็อตที่เคยถูกเบิก
        // ห้ามลบเพื่อรักษาประวัติ
        // -------------------------------------------------

        if (
          formIndex === -1
        ) {
          continue;
        }

        const formItem =
          remainingFormItems[
            formIndex
          ];

        // -------------------------------------------------
        // ถ้าจำนวนใหม่ต่ำกว่าจำนวนที่ถูกเบิกไปแล้ว
        // ไม่สามารถทำให้ล็อตต่ำกว่ายอดที่ถูกใช้ไปแล้วได้
        // -------------------------------------------------

        if (
          formItem.qty <
          oldIssueQty
        ) {
          throw new Error(
            `ไม่สามารถลดจำนวน "${oldItem.materialId}" ต่ำกว่า ${oldIssueQty} ได้ เพราะมีการเบิกไปแล้ว`
          );
        }

        // -------------------------------------------------
        // รักษา ReceiveItem เดิม
        // ไม่เปลี่ยน ID และไม่เปลี่ยนยอดที่ถูกเบิก
        //
        // balance ที่ถูกต้อง =
        // qty ใหม่ - qty ที่เบิกไป
        // -------------------------------------------------

        const newBalance =
          formItem.qty -
          oldIssueQty;

        await tx.receiveItem.update({
          where: {
            id: oldItem.id,
          },

          data: {
            qty:
              formItem.qty,

            balance:
              newBalance,

            unitPrice:
              formItem.unitPrice,

            manufacture:
              formItem.manufacture,

            expiry:
              formItem.expiry,
          },
        });

        remainingFormItems.splice(
          formIndex,
          1
        );
      }

      // =================================================
      // สร้าง ReceiveItem ใหม่
      //
      // ล็อตที่ยังไม่มี IssueItem
      // หรือรายการใหม่จากฟอร์ม
      // =================================================

      for (
        const item of
        remainingFormItems
      ) {
        await tx.receiveItem.create({
          data: {
            receiveId,

            materialId:
              item.materialId,

            qty:
              item.qty,

            // ล็อตใหม่ต้องเริ่มต้นเต็มจำนวน
            balance:
              item.qty,

            unitPrice:
              item.unitPrice,

            manufacture:
              item.manufacture,

            expiry:
              item.expiry,
          },
        });
      }

      // =================================================
      // คำนวณ Material.balance ใหม่จาก ReceiveItem จริง
      // =================================================

      for (
        const materialId of
        affectedMaterialIds
      ) {
        const totalBalance =
          await tx.receiveItem.aggregate(
            {
              where: {
                materialId,
              },

              _sum: {
                balance: true,
              },
            }
          );

        const newMaterialBalance =
          Number(
            totalBalance._sum
              .balance ?? 0
          );

        await tx.material.update({
          where: {
            id: materialId,
          },

          data: {
            balance:
              newMaterialBalance,
          },
        });
      }

      // =================================================
      // อัปเดต latestPrice ตามรายการล่าสุดในฟอร์ม
      // =================================================

      for (
        const item of items
      ) {
        await tx.material.update({
          where: {
            id:
              item.materialId,
          },

          data: {
            latestPrice:
              item.unitPrice,
          },
        });
      }
    },
    {
      maxWait: 30000,
      timeout: 60000,
    }
  );

  redirect("/receive");
}