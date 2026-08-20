"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";

// =====================================================
// สร้างใบเบิกพัสดุ
//
// สำคัญ:
// - สร้างใบเบิกเป็น PENDING
// - ยังไม่ตัด Material.balance
// - ยังไม่ตัด ReceiveItem.balance
// - ยังไม่ตัด Stock Card
// - issuedQty เริ่มต้นเป็น 0
//
// การตัด Stock จะเกิดตอน ADMIN กดยืนยันเบิกจ่าย
// =====================================================

export async function createIssue(
  formData: FormData
) {
  const documentNo = String(
    formData.get("documentNo") ?? ""
  ).trim();

  const issueDateValue = String(
    formData.get("issueDate") ?? ""
  ).trim();

  const departmentIdValue = String(
    formData.get("departmentId") ?? ""
  ).trim();

  const officerIdValue = String(
    formData.get("officerId") ?? ""
  ).trim();

  const remark = String(
    formData.get("remark") ?? ""
  ).trim();

  // =====================================================
  // ตรวจสอบข้อมูลพื้นฐาน
  // =====================================================

  if (!documentNo) {
    throw new Error(
      "กรุณาระบุเลขที่เอกสาร"
    );
  }

  if (!issueDateValue) {
    throw new Error(
      "กรุณาระบุวันที่เบิก"
    );
  }

  if (!departmentIdValue) {
    throw new Error(
      "กรุณาเลือกหน่วยงาน"
    );
  }

  const departmentId =
    Number(departmentIdValue);

  if (!Number.isInteger(departmentId)) {
    throw new Error(
      "หน่วยงานไม่ถูกต้อง"
    );
  }

  const officerId = officerIdValue
    ? Number(officerIdValue)
    : null;

  if (
    officerId !== null &&
    !Number.isInteger(officerId)
  ) {
    throw new Error(
      "ผู้ขอเบิกไม่ถูกต้อง"
    );
  }

  const issueDate =
    new Date(issueDateValue);

  if (
    Number.isNaN(
      issueDate.getTime()
    )
  ) {
    throw new Error(
      "วันที่เบิกไม่ถูกต้อง"
    );
  }

  // =====================================================
  // อ่านรายการทั้ง 18 แถว
  // =====================================================

  const rawItems = Array.from(
    { length: 18 },
    (_, index) => {
      const materialId =
        String(
          formData.get(
            `items[${index}].materialId`
          ) ?? ""
        ).trim();

      const qtyValue =
        String(
          formData.get(
            `items[${index}].qty`
          ) ?? ""
        ).trim();

      const qty =
        Number(qtyValue);

      return {
        index,
        materialId,
        qty,
      };
    }
  );

  const items = rawItems.filter(
    (item) =>
      item.materialId &&
      Number.isFinite(item.qty) &&
      Number.isInteger(item.qty) &&
      item.qty > 0
  );

  if (items.length === 0) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ"
    );
  }

  // =====================================================
  // ตรวจรายการพัสดุซ้ำ
  // =====================================================

  const materialIds =
    items.map((item) =>
      Number(item.materialId)
    );

  const uniqueMaterialIds =
    new Set(materialIds);

  if (
    uniqueMaterialIds.size !==
    materialIds.length
  ) {
    throw new Error(
      "ไม่สามารถเลือกรายการพัสดุซ้ำกันได้ในใบเบิกเดียวกัน"
    );
  }

  // =====================================================
  // ตรวจว่าพัสดุมีอยู่จริง
  //
  // ไม่ตรวจ balance เพราะตอนนี้ยังไม่ใช่ขั้นตอนตัด Stock
  // =====================================================

  const materials =
    await prisma.material.findMany({
      where: {
        id: {
          in: materialIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

  const materialMap =
    new Map(
      materials.map(
        (material) => [
          material.id,
          material,
        ]
      )
    );

  for (const item of items) {
    const materialId =
      Number(item.materialId);

    if (!materialMap.has(materialId)) {
      throw new Error(
        `ไม่พบพัสดุ ID ${materialId}`
      );
    }
  }

  // =====================================================
  // Transaction
  //
  // ขั้นตอนนี้สร้าง "คำขอเบิก" เท่านั้น
  // ยังไม่ตัด Stock
  // =====================================================

  const issueId =
    await prisma.$transaction(
      async (tx: any) => {
        // =================================================
        // สร้างใบเบิก
        // =================================================

        const issue =
          await tx.issue.create({
            data: {
              documentNo,
              issueDate,
              departmentId,
              officerId,
              remark:
                remark || null,

              // -------------------------------------------
              // ใบเบิกใหม่ = รอ Admin ตรวจสอบ
              // -------------------------------------------

              status: "PENDING",

              approvedAt: null,
              approvedById: null,
            },
          });

        // =================================================
        // สร้าง IssueItem
        //
        // qty       = จำนวนที่กลุ่มงานขอ
        // issuedQty = จำนวนที่ Admin เบิกจ่ายจริง
        //
        // ตอนนี้ยังไม่มีล็อต
        // เพราะยังไม่มีการตัด Stock
        // =================================================

        for (const item of items) {
          const materialId =
            Number(item.materialId);

          const qty =
            Number(item.qty);

          await tx.issueItem.create({
            data: {
              issueId:
                issue.id,

              materialId,

              // จำนวนที่ขอ
              qty,

              // ยังไม่ได้เบิกจ่ายจริง
              issuedQty: 0,

              // ยังไม่มีล็อตที่ถูกตัด
              receiveItemId: null,

              manufacture: null,
              expiry: null,
            },
          });
        }

        return issue.id;
      }
    );

  // =====================================================
  // Refresh หน้าเกี่ยวข้อง
  // =====================================================

  revalidatePath("/issue");

  revalidatePath(
    `/issue/${issueId}`
  );

  // =====================================================
  // เปิดหน้าใบเบิกที่สร้างใหม่
  // =====================================================

  redirect(
    `/issue/${issueId}`
  );
}

// =====================================================
// ลบใบเบิก
//
// PENDING:
//   ยังไม่เคยตัด Stock
//   → ลบได้เลย
//
// APPROVED:
//   เคยตัด Stock แล้ว
//   → คืนจำนวนที่เบิกจ่ายจริงกลับล็อตเดิม
// =====================================================

export async function deleteIssue(
  id: number
) {
  await prisma.$transaction(
    async (tx: any) => {
      const issue =
        await tx.issue.findUnique({
          where: {
            id,
          },

          include: {
            items: true,
          },
        });

      if (!issue) {
        throw new Error(
          "ไม่พบใบเบิก"
        );
      }

      // =================================================
      // ถ้า APPROVED
      //
      // ต้องคืน Stock เฉพาะจำนวนที่เบิกจ่ายจริง
      // =================================================

      if (
        issue.status ===
        "APPROVED"
      ) {
        for (
          const item of issue.items
        ) {
          const issuedQty =
            Number(
              item.issuedQty
            );

          // ไม่มีการเบิกจ่ายจริง
          if (
            issuedQty <= 0
          ) {
            continue;
          }

          // ---------------------------------------------
          // คืน Material.balance
          // ---------------------------------------------

          await tx.material.update({
            where: {
              id:
                item.materialId,
            },

            data: {
              balance: {
                increment:
                  issuedQty,
              },
            },
          });

          // ---------------------------------------------
          // คืน ReceiveItem
          //
          // ใช้ล็อตเดิมที่ถูกตัดตอน Admin อนุมัติ
          // ---------------------------------------------

          if (
            item.receiveItemId
          ) {
            await tx.receiveItem.update({
              where: {
                id:
                  item.receiveItemId,
              },

              data: {
                balance: {
                  increment:
                    issuedQty,
                },
              },
            });
          }
        }
      }

      // =================================================
      // PENDING
      //
      // ไม่ต้องคืน Stock เพราะยังไม่เคยตัด
      // =================================================

      // =================================================
      // ลบรายการใบเบิก
      // =================================================

      await tx.issueItem.deleteMany({
        where: {
          issueId: id,
        },
      });

      // =================================================
      // ลบใบเบิก
      // =================================================

      await tx.issue.delete({
        where: {
          id,
        },
      });
    }
  );

  // =====================================================
  // Refresh
  // =====================================================

  revalidatePath(
    "/issue"
  );

  revalidatePath(
    "/stock-card"
  );
}

// =====================================================
// ลบเฉพาะไฟล์ PDF ใบเบิก
// =====================================================

export async function deleteIssuePdf(
  issueId: number
) {
  const issue =
    await prisma.issue.findUnique({
      where: {
        id: issueId,
      },
    });

  if (!issue) {
    throw new Error(
      "ไม่พบใบเบิก"
    );
  }

  // =====================================================
  // ลบไฟล์จริงจาก public
  // =====================================================

  if (issue.pdf) {
    const filePath =
      path.join(
        process.cwd(),
        "public",
        issue.pdf
      );

    try {
      await fs.unlink(
        filePath
      );
    } catch {
      console.log(
        "ไม่พบไฟล์ PDF"
      );
    }
  }

  // =====================================================
  // ล้างค่า PDF ในฐานข้อมูล
  // =====================================================

  await prisma.issue.update({
    where: {
      id: issueId,
    },

    data: {
      pdf: null,
    },
  });

  revalidatePath(
    `/issue/${issueId}`
  );
}