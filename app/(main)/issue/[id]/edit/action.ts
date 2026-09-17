"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

type IssueRow = {
  materialId: number;
  qty: number;
};

export async function updateIssue(
  formData: FormData
) {
  // =====================================================
  // ตรวจสอบ Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  let session;

  try {
    session = await verifySession(token);
  } catch {
    throw new Error(
      "Session ไม่ถูกต้องหรือหมดอายุ"
    );
  }

  // =====================================================
  // รับค่าจาก Form
  // =====================================================

  const issueId = Number(
    formData.get("issueId")
  );

  const issueDate = new Date(
    String(
      formData.get("issueDate") ?? ""
    )
  );

  const documentNo = String(
    formData.get("documentNo") ?? ""
  ).trim();

  const departmentId = Number(
    formData.get("departmentId")
  );

  const officerIdValue = String(
    formData.get("officerId") ?? ""
  ).trim();

  const officerId = officerIdValue
    ? Number(officerIdValue)
    : null;

  const remark = String(
    formData.get("remark") ?? ""
  ).trim();

  const newItems: IssueRow[] = [];

  // =====================================================
  // อ่านรายการทั้ง 15 แถว
  //
  // qty = จำนวนที่ "ขอเบิก"
  //
  // สำคัญ:
  // จำนวนขอเบิกไม่จำเป็นต้องน้อยกว่าหรือเท่ากับ Stock
  // การตรวจ Stock จะทำตอน Admin ลงจำนวนเบิกจ่ายจริง
  // =====================================================

  for (let i = 0; i < 15; i++) {
    const materialValue = formData.get(
      `items[${i}].materialId`
    );

    const qtyValue = formData.get(
      `items[${i}].qty`
    );

    const materialId = Number(
      materialValue
    );

    const qty = Number(qtyValue);

    if (
      Number.isInteger(materialId) &&
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

  // =====================================================
  // ตรวจสอบค่าพื้นฐาน
  // =====================================================

  if (
    !Number.isInteger(issueId) ||
    issueId <= 0
  ) {
    throw new Error(
      "เลขที่รายการเบิกไม่ถูกต้อง"
    );
  }

  if (!documentNo) {
    throw new Error(
      "กรุณาระบุเลขที่เอกสาร"
    );
  }

  if (
    !Number.isInteger(departmentId) ||
    departmentId <= 0
  ) {
    throw new Error(
      "กรุณาเลือกหน่วยงาน"
    );
  }

  if (
    officerId !== null &&
    (!Number.isInteger(officerId) ||
      officerId <= 0)
  ) {
    throw new Error(
      "ผู้ขอเบิกไม่ถูกต้อง"
    );
  }

  if (
    Number.isNaN(issueDate.getTime())
  ) {
    throw new Error(
      "วันที่เบิกจ่ายไม่ถูกต้อง"
    );
  }

  if (newItems.length === 0) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );
  }

  // =====================================================
  // ตรวจรายการพัสดุซ้ำ
  // =====================================================

  const materialIds = newItems.map(
    (item) => item.materialId
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
  // Transaction
  // =====================================================

  try {
    await prisma.$transaction(
      async (tx: any) => {
        // =================================================
        // ดึง Issue เดิม
        // =================================================

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

        // =================================================
        // ตรวจสถานะใบเบิก
        //
        // แก้ไขได้เฉพาะ PENDING
        //
        // APPROVED:
        // มีการเบิกจ่ายจริงแล้ว
        // ห้ามย้อนกลับมาแก้จำนวนขอเบิก
        //
        // REJECTED:
        // ห้ามแก้ไข
        // =================================================

        if (
          oldIssue.status !== "PENDING"
        ) {
          if (
            oldIssue.status ===
            "APPROVED"
          ) {
            throw new Error(
              "ใบเบิกนี้ได้รับการยืนยันจาก Admin แล้ว ไม่สามารถแก้ไขได้"
            );
          }

          if (
            oldIssue.status ===
            "REJECTED"
          ) {
            throw new Error(
              "ใบเบิกนี้ถูกไม่อนุมัติแล้ว ไม่สามารถแก้ไขได้"
            );
          }

          throw new Error(
            "ไม่สามารถแก้ไขใบเบิกที่ไม่อยู่ในสถานะรอ Admin ตรวจสอบได้"
          );
        }

        // =================================================
        // ตรวจสิทธิ์การแก้ไข
        //
        // ADMIN:
        //   แก้ไขได้ทุกหน่วยงาน
        //
        // USER:
        //   ต้องเป็น department เดียวกับ Issue เดิม
        //   และห้ามเปลี่ยนไป department อื่น
        // =================================================

        if (
          session.role !== "ADMIN" &&
          session.departmentId !==
            oldIssue.departmentId
        ) {
          throw new Error(
            "คุณไม่มีสิทธิ์แก้ไขรายการเบิกของหน่วยงานนี้"
          );
        }

        if (
          session.role !== "ADMIN" &&
          session.departmentId !==
            departmentId
        ) {
          throw new Error(
            "คุณไม่มีสิทธิ์เปลี่ยนหน่วยงานของรายการเบิกนี้"
          );
        }

        // =================================================
        // ตรวจสอบ Material ที่ส่งมาจาก Form
        //
        // ตรวจเฉพาะว่าพัสดุมีอยู่จริง
        //
        // ไม่ตรวจ Stock
        // ไม่ตรวจ ReceiveItem.balance
        // ไม่ตรวจว่าจำนวนขอเบิกเกิน Stock หรือไม่
        // =================================================

        const requestedMaterialIds =
          newItems.map(
            (item) => item.materialId
          );

        const existingMaterials =
          await tx.material.findMany({
            where: {
              id: {
                in: requestedMaterialIds,
              },
            },

            select: {
              id: true,
            },
          });

        const existingMaterialIds =
          new Set(
            existingMaterials.map(
              (material: {
                id: number;
              }) => material.id
            )
          );

        for (const item of newItems) {
          if (
            !existingMaterialIds.has(
              item.materialId
            )
          ) {
            throw new Error(
              `ไม่พบพัสดุ ID ${item.materialId}`
            );
          }
        }

        // =================================================
        // สำคัญ
        //
        // ใบ PENDING เป็นเพียง "คำขอเบิก"
        //
        // ดังนั้นตอนแก้ไข:
        //
        // - ไม่คืน Stock
        // - ไม่เพิ่ม ReceiveItem.balance
        // - ไม่ลด ReceiveItem.balance
        // - ไม่ตัดล็อต
        // - ไม่ทำ FEFO
        // - ไม่แก้ Material.balance
        //
        // Stock จะเปลี่ยนเมื่อ Admin ลง
        // "จำนวนเบิกจ่ายจริง" เท่านั้น
        // =================================================

        // =================================================
        // ลบ IssueItem เดิมของใบคำขอ
        // =================================================

        await tx.issueItem.deleteMany({
          where: {
            issueId,
          },
        });

        // =================================================
        // อัปเดตหัวเอกสาร
        //
        // ยังคงเป็น PENDING
        // =================================================

        await tx.issue.update({
          where: {
            id: issueId,
          },

          data: {
            issueDate,
            documentNo,
            departmentId,
            officerId,
            remark:
              remark || null,

            status: "PENDING",

            approvedAt: null,
            approvedById: null,
          },
        });

        // =================================================
        // สร้าง IssueItem ใหม่
        //
        // qty
        // = จำนวนที่ผู้ใช้ "ขอเบิก"
        //
        // issuedQty
        // = จำนวนที่ Admin "เบิกจ่ายจริง"
        //
        // ขณะ PENDING:
        // issuedQty = 0
        //
        // ไม่ผูกล็อต ณ ขั้นตอนนี้
        // เพราะยังไม่มีการเบิกจ่ายจริง
        // =================================================

        for (const item of newItems) {
          await tx.issueItem.create({
            data: {
              issueId,

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

  // =====================================================
  // Refresh หน้าเกี่ยวข้อง
  // =====================================================

  revalidatePath("/issue");

  revalidatePath(
    `/issue/${issueId}`
  );

  // ไม่มีการแก้ Stock ในขั้นตอนนี้
  // แต่คง revalidate ไว้ได้เพื่อให้หน้าที่เกี่ยวข้อง refresh
  revalidatePath("/stock-card");

  redirect("/issue");
}