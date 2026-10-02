"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type ReceiveRow = {
  receiveItemId: number | null;
  materialId: number;
  qty: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
};

/* =========================================================
   FORM ROW COUNT
   ต้องตรงกับจำนวนแถวใน EditReceiveForm
========================================================= */

const RECEIVE_ROW_COUNT = 20;

export async function updateReceive(
  formData: FormData
) {
  const receiveId = Number(
    formData.get("receiveId")
  );

  const receiveDateValue =
    (formData.get("receiveDate") as string) || "";

  const receiveDate = new Date(
    receiveDateValue
  );

  const documentNo =
    (formData.get("documentNo") as string) || "";

  const vendorId = Number(
    formData.get("vendorId")
  );

  const remark =
    (formData.get("remark") as string) || "";

  if (
    !Number.isInteger(receiveId) ||
    receiveId <= 0
  ) {
    throw new Error(
      "ข้อมูลเอกสารรับเข้าไม่ถูกต้อง"
    );
  }

  if (
    Number.isNaN(
      receiveDate.getTime()
    )
  ) {
    throw new Error(
      "วันที่รับเข้าไม่ถูกต้อง"
    );
  }

  if (
    !Number.isInteger(vendorId) ||
    vendorId <= 0
  ) {
    throw new Error(
      "กรุณาเลือกผู้จำหน่าย"
    );
  }

  const items: ReceiveRow[] = [];

  /* =====================================================
     อ่านรายการรับเข้าจาก FormData จำนวน 20 แถว

     receiveItemId มีค่า  = แถวเดิม / ล็อตเดิม
     receiveItemId ว่าง   = แถวใหม่ / ล็อตใหม่
  ===================================================== */

  for (
    let i = 0;
    i < RECEIVE_ROW_COUNT;
    i++
  ) {
    const receiveItemIdValue =
      (formData.get(
        `items[${i}].receiveItemId`
      ) as string) || "";

    const parsedReceiveItemId =
      receiveItemIdValue
        ? Number(receiveItemIdValue)
        : null;

    const receiveItemId =
      parsedReceiveItemId !== null &&
      Number.isInteger(
        parsedReceiveItemId
      ) &&
      parsedReceiveItemId > 0
        ? parsedReceiveItemId
        : null;

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
      (formData.get(
        `items[${i}].manufacture`
      ) as string) || "";

    const expiryValue =
      (formData.get(
        `items[${i}].expiry`
      ) as string) || "";

    const manufacture =
      manufactureValue
        ? new Date(manufactureValue)
        : null;

    const expiry =
      expiryValue
        ? new Date(expiryValue)
        : null;

    /* แถวว่าง */
    if (
      !materialId ||
      !qty
    ) {
      continue;
    }

    if (
      !Number.isInteger(materialId) ||
      materialId <= 0
    ) {
      continue;
    }

    if (
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      throw new Error(
        "จำนวนรับเข้าต้องเป็นจำนวนเต็มมากกว่า 0"
      );
    }

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      throw new Error(
        "ราคาพัสดุไม่ถูกต้อง"
      );
    }

    if (
      manufacture &&
      Number.isNaN(
        manufacture.getTime()
      )
    ) {
      throw new Error(
        "วันผลิตไม่ถูกต้อง"
      );
    }

    if (
      expiry &&
      Number.isNaN(
        expiry.getTime()
      )
    ) {
      throw new Error(
        "วันหมดอายุไม่ถูกต้อง"
      );
    }

    items.push({
      receiveItemId,
      materialId,
      qty,
      unitPrice,
      manufacture,
      expiry,
    });
  }

  if (items.length === 0) {
    throw new Error(
      "กรุณาเลือกรายการรับเข้า"
    );
  }

  /* =====================================================
     ReceiveItem เดิม 1 ID ต้องปรากฏเพียง 1 แถว
  ===================================================== */

  const submittedExistingIds =
    items
      .map(
        (item) =>
          item.receiveItemId
      )
      .filter(
        (
          id
        ): id is number =>
          id !== null
      );

  if (
    new Set(
      submittedExistingIds
    ).size !==
    submittedExistingIds.length
  ) {
    throw new Error(
      "พบข้อมูลล็อตเดิมซ้ำในแบบฟอร์ม กรุณาเปิดหน้าแก้ไขใหม่แล้วลองอีกครั้ง"
    );
  }

  await prisma.$transaction(
    async (tx: any) => {
      /* =================================================
         ตรวจสอบใบรับเดิม
      ================================================= */

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

      /* =================================================
         ดึง ReceiveItem เดิมของใบรับนี้ทั้งหมด
      ================================================= */

      const oldItems =
        await tx.receiveItem.findMany({
          where: {
            receiveId,
          },
          orderBy: {
            id: "asc",
          },
        });

      const oldItemMap =
        new Map<number, any>(
          oldItems.map(
            (oldItem: any) => [
              oldItem.id,
              oldItem,
            ]
          )
        );

      const affectedMaterialIds =
        new Set<number>();

      for (
        const oldItem of oldItems
      ) {
        affectedMaterialIds.add(
          oldItem.materialId
        );
      }

      for (
        const item of items
      ) {
        affectedMaterialIds.add(
          item.materialId
        );
      }

      /* =================================================
         ตรวจจำนวนที่เบิกจ่ายจริงของแต่ละ ReceiveItem

         ใช้ issuedQty เท่านั้น เพราะ:
         - qty       = จำนวนที่ขอเบิก
         - issuedQty = จำนวนที่ Admin เบิกจ่ายจริง

         ห้าม fallback ไปใช้ qty เพราะจะทำให้ระบบนับ
         จำนวนที่ขอเบิกเป็นจำนวนที่จ่ายจริง
      ================================================= */

      const oldItemUsage =
        new Map<number, number>();

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
              qty: true,
              issuedQty: true,
            },
          });

        const issueQty =
          issueItems.reduce(
            (
              sum: number,
              issueItem: any
            ) => {
              const actualIssuedQty =
                Number(
                  issueItem.issuedQty ??
                    0
                );

              return (
                sum +
                actualIssuedQty
              );
            },
            0
          );

        oldItemUsage.set(
          oldItem.id,
          issueQty
        );
      }

      /* =================================================
         แก้หัวเอกสาร
      ================================================= */

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

      const submittedIdSet =
        new Set(
          submittedExistingIds
        );

      /* =================================================
         อัปเดตล็อตเดิมด้วย ReceiveItem.id โดยตรง

         ไม่มีการจับคู่จาก materialId
         ไม่มีการจับคู่จาก manufacture / expiry
         จึงไม่สลับล็อต
      ================================================= */

      for (
        const item of items
      ) {
        if (
          item.receiveItemId === null
        ) {
          continue;
        }

        const oldItem =
          oldItemMap.get(
            item.receiveItemId
          );

        if (!oldItem) {
          throw new Error(
            `ไม่พบล็อตเดิมรหัส ${item.receiveItemId} ในใบรับเข้านี้ กรุณาเปิดหน้าแก้ไขใหม่แล้วลองอีกครั้ง`
          );
        }

        const oldIssueQty =
          oldItemUsage.get(
            oldItem.id
          ) ?? 0;

        /*
         * ล็อตที่ถูกเบิกแล้วห้ามเปลี่ยนชนิดวัสดุ
         * เพราะ IssueItem เดิมอ้างถึง ReceiveItem นี้อยู่
         */
        if (
          oldIssueQty > 0 &&
          item.materialId !==
            oldItem.materialId
        ) {
          throw new Error(
            `ไม่สามารถเปลี่ยนรายการพัสดุ "${oldItem.materialId}" ได้ เพราะมีการเบิกจากล็อตนี้ไปแล้ว`
          );
        }

        /*
         * ตัวอย่างเคสที่ต้องผ่าน:
         * เดิม qty = 6
         * เบิกแล้ว = 5
         * แก้ qty = 5
         * => 5 < 5 เป็น false จึงผ่าน
         */
        if (
          item.qty <
          oldIssueQty
        ) {
          throw new Error(
            `ไม่สามารถแก้ล็อต ReceiveItem #${oldItem.id} (วัสดุ ${oldItem.materialId}) ได้: จำนวนใหม่ ${item.qty} แต่ล็อตนี้มีการเบิกไปแล้ว ${oldIssueQty}`
          );
        }

        const newBalance =
          item.qty -
          oldIssueQty;

        await tx.receiveItem.update({
          where: {
            id: oldItem.id,
          },
          data: {
            materialId:
              item.materialId,
            qty:
              item.qty,
            balance:
              newBalance,
            unitPrice:
              item.unitPrice,
            manufacture:
              item.manufacture,
            expiry:
              item.expiry,
          },
        });
      }

      /* =================================================
         ล็อตเดิมที่ถูกเอาออกจากฟอร์ม

         - ยังไม่เคยเบิก: ลบได้
         - เคยเบิกแล้ว: ห้ามลบ
      ================================================= */

      for (
        const oldItem of oldItems
      ) {
        if (
          submittedIdSet.has(
            oldItem.id
          )
        ) {
          continue;
        }

        const oldIssueQty =
          oldItemUsage.get(
            oldItem.id
          ) ?? 0;

        if (
          oldIssueQty > 0
        ) {
          throw new Error(
            `ไม่สามารถลบรายการ "${oldItem.materialId}" ได้ เพราะมีการเบิกไปแล้ว ${oldIssueQty}`
          );
        }

        await tx.receiveItem.delete({
          where: {
            id: oldItem.id,
          },
        });
      }

      /* =================================================
         สร้างล็อตใหม่

         receiveItemId ว่าง = แถวใหม่ในใบรับเดิม
      ================================================= */

      for (
        const item of items
      ) {
        if (
          item.receiveItemId !== null
        ) {
          continue;
        }

        await tx.receiveItem.create({
          data: {
            receiveId,
            materialId:
              item.materialId,
            qty:
              item.qty,
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

      /* =================================================
         คำนวณ Material.balance ใหม่จาก ReceiveItem จริง
      ================================================= */

      for (
        const materialId of
        affectedMaterialIds
      ) {
        const totalBalance =
          await tx.receiveItem.aggregate({
            where: {
              materialId,
            },
            _sum: {
              balance: true,
            },
          });

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

      /* =================================================
         อัปเดต latestPrice
      ================================================= */

      const latestPriceByMaterial =
        new Map<number, number>();

      for (
        const item of items
      ) {
        latestPriceByMaterial.set(
          item.materialId,
          item.unitPrice
        );
      }

      for (
        const [
          materialId,
          latestPrice,
        ] of
        latestPriceByMaterial
      ) {
        await tx.material.update({
          where: {
            id: materialId,
          },
          data: {
            latestPrice,
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
