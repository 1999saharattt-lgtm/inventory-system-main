"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";

export async function createIssue(formData: FormData) {
  const issueDateValue =
    formData.get("issueDate") as string;

  const issueDate = new Date(issueDateValue);

  const documentNo =
    (formData.get("documentNo") as string) || "";

  const departmentId = Number(
    formData.get("departmentId")
  );

  const officerId = Number(
    formData.get("officerId")
  );

  const remark =
    (formData.get("remark") as string) || "";

  // =====================
  // ตรวจข้อมูลหลัก
  // =====================

  if (
    !issueDateValue ||
    Number.isNaN(issueDate.getTime())
  ) {
    throw new Error(
      "กรุณาระบุวันที่เบิกให้ถูกต้อง"
    );
  }

  if (
    !documentNo.trim()
  ) {
    throw new Error(
      "กรุณาระบุเลขที่เอกสาร"
    );
  }

  if (
    !departmentId ||
    departmentId <= 0
  ) {
    throw new Error(
      "กรุณาเลือกหน่วยงาน / กลุ่มงาน"
    );
  }

  // =====================
  // Upload PDF
  // =====================

  let pdfPath: string | null = null;

  const file =
    formData.get("pdf") as File | null;

  if (
    file &&
    file.size > 0
  ) {
    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const uploadDir =
      path.join(
        process.cwd(),
        "public/uploads/issue"
      );

    await fs.mkdir(
      uploadDir,
      {
        recursive: true,
      }
    );

    const filename =
      `${Date.now()}-${file.name}`;

    const filepath =
      path.join(
        uploadDir,
        filename
      );

    await fs.writeFile(
      filepath,
      buffer
    );

    pdfPath =
      `/uploads/issue/${filename}`;
  }

  // =====================
  // รายการพัสดุ
  //
  // ตอนสร้างใบเบิก:
  // - เก็บจำนวนที่ขอเบิก
  // - ยังไม่ตัด Stock
  // - ยังไม่เลือก ReceiveItem
  // - ยังไม่ทำ FEFO
  // =====================

  const items: {
    materialId: number;
    qty: number;
    remark: string;
  }[] = [];

  // พอ.101 มี 18 รายการ
  for (let i = 0; i < 18; i++) {
    const materialIdValue =
      formData.get(
        `items[${i}].materialId`
      );

    const qtyValue =
      formData.get(
        `items[${i}].qty`
      );

    const itemRemark =
      (formData.get(
        `items[${i}].remark`
      ) as string) || "";

    const materialId =
      Number(materialIdValue);

    const qty =
      Number(qtyValue);

    if (
      materialIdValue &&
      materialId > 0 &&
      qtyValue &&
      qty > 0
    ) {
      items.push({
        materialId,
        qty,
        remark: itemRemark,
      });
    }
  }

  if (
    items.length === 0
  ) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );
  }

  // =====================
  // ตรวจสอบพัสดุ
  //
  // ตรวจว่ามีพัสดุจริง
  // แต่ยังไม่ตรวจล็อตและยังไม่ตัด Stock
  // เพราะ Admin จะเป็นผู้ยืนยันจำนวนเบิกจ่ายจริง
  // =====================

  for (const item of items) {
    const material =
      await prisma.material.findUnique({
        where: {
          id: item.materialId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!material) {
      throw new Error(
        `ไม่พบพัสดุ ID ${item.materialId}`
      );
    }
  }

  // =====================
  // สร้างใบเบิก
  //
  // สถานะเริ่มต้น:
  // PENDING
  //
  // ยังไม่ตัด Stock
  // =====================

  await prisma.$transaction(
    async (tx) => {
      const issue =
        await tx.issue.create({
          data: {
            issueDate,
            documentNo:
              documentNo.trim(),

            departmentId,

            officerId:
              officerId > 0
                ? officerId
                : null,

            remark,
            pdf: pdfPath,

            status: "PENDING",

            approvedAt: null,
            approvedById: null,
          },
        });

      // =====================
      // สร้าง IssueItem
      //
      // สำคัญ:
      //
      // qty       = จำนวนที่กลุ่มงานขอ
      // issuedQty = 0
      //
      // ยังไม่กำหนด receiveItemId
      // เพราะยังไม่ตัด FEFO
      // =====================

      for (const item of items) {
        await tx.issueItem.create({
          data: {
            issueId:
              issue.id,

            materialId:
              item.materialId,

            qty:
              item.qty,

            issuedQty: 0,

            receiveItemId: null,

            manufacture: null,
            expiry: null,
          },
        });
      }
    }
  );

  // =====================
  // กลับหน้ารายการใบเบิก
  // =====================

  redirect("/issue");
}