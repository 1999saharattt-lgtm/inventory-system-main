"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function updateReceive(formData: FormData) {

  const receiveId = Number(formData.get("receiveId"));

  const receiveDate = new Date(
    formData.get("receiveDate") as string
  );

  const documentNo =
    formData.get("documentNo") as string;

  const vendorId =
    Number(formData.get("vendorId"));

  const remark =
    formData.get("remark") as string;


  const items = [];

  for (let i = 0; i < 15; i++) {

    const materialId =
      Number(formData.get(`items[${i}].materialId`));

    const qty =
      Number(formData.get(`items[${i}].qty`));

    const unitPrice =
      Number(formData.get(`items[${i}].unitPrice`));


    const manufacture =
      formData.get(`items[${i}].manufacture`) as string;

    const expiry =
      formData.get(`items[${i}].expiry`) as string;


    if (
      materialId &&
      qty > 0
    ) {

      items.push({
        materialId,
        qty,
        unitPrice,
        manufacture: manufacture
          ? new Date(manufacture)
          : null,
        expiry: expiry
          ? new Date(expiry)
          : null,
      });

    }

  }


  const oldItems =
    await prisma.receiveItem.findMany({
      where:{
        receiveId
      }
    });


  // คืน stock เดิม
  for (const item of oldItems) {

    await prisma.material.update({
      where:{
        id:item.materialId
      },
      data:{
        balance:{
          decrement:item.qty
        }
      }
    });

  }


  // ลบรายการเก่า
  await prisma.receiveItem.deleteMany({
    where:{
      receiveId
    }
  });



  // แก้หัวเอกสาร
  await prisma.receive.update({
    where:{
      id:receiveId
    },
    data:{
      receiveDate,
      documentNo,
      vendorId,
      remark,
    }
  });



  // สร้างรายการใหม่ + เพิ่ม stock
  for(const item of items){

    await prisma.receiveItem.create({

      data:{
        receiveId,
        materialId:item.materialId,
        qty:item.qty,
        unitPrice:item.unitPrice,
        manufacture:item.manufacture,
        expiry:item.expiry,
      }

    });


    await prisma.material.update({

      where:{
        id:item.materialId
      },

      data:{
        balance:{
          increment:item.qty
        },

        latestPrice:item.unitPrice
      }

    });

  }


  redirect("/receive");
}