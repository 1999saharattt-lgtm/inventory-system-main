"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  const items: {
    materialId: number;
    qty: number;
    unitPrice: number;
    manufacture: Date | null;
    expiry: Date | null;
  }[] = [];

  // =====================================================
  // อ่านรายการรับเข้า
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
      // ดึงรายการเดิม
      // =================================================

      const oldItems =
        await tx.receiveItem.findMany({
          where: {
            receiveId,
          },
        });

      // =================================================
      // คืนยอด stock เดิม
      // =================================================

      for (
        const item of oldItems
      ) {
        await tx.material.update({
          where: {
            id:
              item.materialId,
          },

          data: {
            balance: {
              decrement:
                item.qty,
            },
          },
        });
      }

      // =================================================
      // ลบรายการ ReceiveItem เดิม
      // =================================================

      await tx.receiveItem.deleteMany({
        where: {
          receiveId,
        },
      });

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
      // สร้าง ReceiveItem ใหม่
      // และตั้ง balance = qty
      // =================================================

      for (
        const item of items
      ) {
        await tx.receiveItem.create({
          data: {
            receiveId,

            materialId:
              item.materialId,

            qty:
              item.qty,

            // สำคัญ:
            // จำนวนคงเหลือของล็อตใหม่
            // ต้องเท่ากับจำนวนรับเข้า
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

        // =================================================
        // เพิ่มยอด Material
        // =================================================

        await tx.material.update({
          where: {
            id:
              item.materialId,
          },

          data: {
            balance: {
              increment:
                item.qty,
            },

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