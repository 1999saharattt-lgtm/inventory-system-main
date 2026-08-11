"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createReceive(formData: FormData) {
  const receiveDate = new Date(
    formData.get("receiveDate") as string
  );

  const documentNo =
  (formData.get("documentNo") as string) ||
  `REC-${Date.now()}`;
  const vendorId = Number(formData.get("vendorId"));
  const remark = (formData.get("remark") as string) ?? "";

  await prisma.$transaction(async (tx: any) => {
    const receive = await tx.receive.create({
      data: {
        receiveDate,
        documentNo,
        vendorId,
        remark,
      },
    });

    const vendor = await tx.vendor.findUnique({
      where: {
        id: vendorId,
      },
    });

    for (let i = 0; i < 15; i++) {
      const materialId = Number(
        formData.get(`items[${i}].materialId`)
      );

      if (!materialId) continue;

      const qty = Number(
        formData.get(`items[${i}].qty`)
      );

      if (!qty) continue;

      const unitPrice = Number(
        formData.get(`items[${i}].unitPrice`)
      );

      const manufactureValue = formData.get(
        `items[${i}].manufacture`
      ) as string;

      const expiryValue = formData.get(
        `items[${i}].expiry`
      ) as string;

      const manufacture = manufactureValue
        ? new Date(manufactureValue)
        : null;

      const expiry = expiryValue
        ? new Date(expiryValue)
        : null;

      // เพิ่มรายการรับพัสดุ
      await tx.receiveItem.create({
        data: {
          receiveId: receive.id,
          materialId,
          qty,
          balance: qty,
          unitPrice,
          manufacture,
          expiry,
        },
      });

      // อัปเดตยอดคงเหลือและราคาล่าสุด
      const updatedMaterial = await tx.material.update({
        where: {
          id: materialId,
        },
        data: {
          balance: {
            increment: qty,
          },
          latestPrice: unitPrice,
        },
      });

      // บันทึก Stock Card
      await tx.transaction.create({
        data: {
          materialId,
          date: receiveDate,
          type: "RECEIVE",
          documentNo,
          receiveQty: qty,
          issueQty: 0,
          balance: updatedMaterial.balance,
          unitPrice,
          vendor: vendor?.name,
          remark,
        },
      });
    }
  });

  redirect("/receive");
}