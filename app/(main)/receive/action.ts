"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";


export async function deleteReceive(formData: FormData) {

  const id = Number(formData.get("id"));


  // ลบรายการย่อยก่อน
  await prisma.receiveItem.deleteMany({
    where: {
      receiveId: id,
    },
  });


  // ลบหัวเอกสาร
  await prisma.receive.delete({
    where: {
      id,
    },
  });


  redirect("/receive");
}