"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// =====================================================
// รายการพัสดุที่รับจาก Form
// =====================================================

type IssueRow = {
  materialId: number;
  qty: number;
  remark: string | null;
};

export async function updateIssue(
  formData: FormData
) {
  // =====================================================
  // ตรวจสอบ Session
  // =====================================================

  const cookieStore = await cookies();
  const token =
    cookieStore.get("session")?.value;

  if (!token) {
    throw new Error(
      "กรุณาเข้าสู่ระบบ"
    );
  }

  let session;

  try {
    session =
      await verifySession(token);
  } catch {
    throw new Error(
      "Session ไม่ถูกต้องหรือหมดอายุ"
    );
  }

  // =====================================================
  // รับค่าหัวเอกสารจาก Form
  // =====================================================

  const issueId = Number(
    formData.get("issueId")
  );

  const issueDateValue =
    String(
      formData.get("issueDate") ?? ""
    ).trim();

  const issueDate =
    new Date(issueDateValue);

  const documentNo =
    String(
      formData.get("documentNo") ?? ""
    ).trim();

  const departmentId =
    Number(
      formData.get("departmentId")
    );

  // =====================================================
  // officerId
  //
  // รองรับไว้เหมือนระบบเดิม
  // หากหน้า Edit ไม่ได้ส่ง officerId มา
  // จะรักษา officerId เดิมของใบเบิกไว้
  // =====================================================

  const officerIdFormValue =
    formData.get("officerId");

  const hasOfficerIdField =
    officerIdFormValue !== null;

  const officerIdValue =
    String(
      officerIdFormValue ?? ""
    ).trim();

  const submittedOfficerId =
    officerIdValue
      ? Number(officerIdValue)
      : null;

  // =====================================================
  // หมายเหตุระดับหัวใบเบิก
  //
  // รองรับไว้เหมือนระบบเดิม
  // หากหน้า Edit ไม่ได้ส่ง remark ระดับหัวเอกสาร
  // จะรักษาค่าเดิมไว้
  //
  // หมายเหตุ:
  // ตัวนี้ไม่ใช่ IssueItem.remark
  // =====================================================

  const issueRemarkFormValue =
    formData.get("remark");

  const hasIssueRemarkField =
    issueRemarkFormValue !== null;

  const submittedIssueRemark =
    String(
      issueRemarkFormValue ?? ""
    ).trim();

  // =====================================================
  // อ่านรายการพัสดุจาก Form
  //
  // โครงสร้างใหม่:
  //
  // items[i].materialId
  // items[i].qty
  // items[i].remark
  //
  // ไม่ใช้:
  // - category
  // - manufacture
  // - expiry
  // - receiveItemId
  //
  // เพราะใบ PENDING ยังไม่ตัด Stock
  // =====================================================

  const newItems: IssueRow[] = [];

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

    const itemRemarkValue =
      formData.get(
        `items[${i}].remark`
      );

    const materialId =
      Number(materialValue);

    const qty =
      Number(qtyValue);

    const itemRemark =
      String(
        itemRemarkValue ?? ""
      ).trim();

    // =================================================
    // เพิ่มเฉพาะแถวที่มี Material + Qty ถูกต้อง
    // =================================================

    if (
      Number.isInteger(
        materialId
      ) &&
      materialId > 0 &&
      Number.isFinite(qty) &&
      Number.isInteger(qty) &&
      qty > 0
    ) {
      newItems.push({
        materialId,
        qty,
        remark:
          itemRemark || null,
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
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0
  ) {
    throw new Error(
      "กรุณาเลือกหน่วยงาน"
    );
  }

  if (
    hasOfficerIdField &&
    submittedOfficerId !== null &&
    (
      !Number.isInteger(
        submittedOfficerId
      ) ||
      submittedOfficerId <= 0
    )
  ) {
    throw new Error(
      "ผู้ขอเบิกไม่ถูกต้อง"
    );
  }

  if (
    !issueDateValue ||
    Number.isNaN(
      issueDate.getTime()
    )
  ) {
    throw new Error(
      "วันที่เบิกจ่ายไม่ถูกต้อง"
    );
  }

  if (
    newItems.length === 0
  ) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ"
    );
  }

  // =====================================================
  // ตรวจสอบรายการพัสดุซ้ำ
  // =====================================================

  const materialIds =
    newItems.map(
      (item) =>
        item.materialId
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
        // ตรวจสถานะ
        //
        // แก้ไขได้เฉพาะ PENDING
        // =================================================

        if (
          oldIssue.status !==
          "PENDING"
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
        // ตรวจสิทธิ์
        //
        // ADMIN
        // แก้ไขได้ทุกหน่วยงาน
        //
        // USER
        // แก้ได้เฉพาะ Department ของตัวเอง
        // =================================================

        if (
          session.role !==
            "ADMIN" &&
          session.departmentId !==
            oldIssue.departmentId
        ) {
          throw new Error(
            "คุณไม่มีสิทธิ์แก้ไขรายการเบิกของหน่วยงานนี้"
          );
        }

        if (
          session.role !==
            "ADMIN" &&
          session.departmentId !==
            departmentId
        ) {
          throw new Error(
            "คุณไม่มีสิทธิ์เปลี่ยนหน่วยงานของรายการเบิกนี้"
          );
        }

        // =================================================
        // ตรวจสอบ Department
        // =================================================

        const department =
          await tx.department.findUnique({
            where: {
              id: departmentId,
            },

            select: {
              id: true,
            },
          });

        if (!department) {
          throw new Error(
            "ไม่พบหน่วยงานที่เลือก"
          );
        }

        // =================================================
        // ตรวจ Officer
        //
        // ตรวจเฉพาะกรณี Form ส่ง officerId มา
        // =================================================

        if (
          hasOfficerIdField &&
          submittedOfficerId !==
            null
        ) {
          const officer =
            await tx.officer.findUnique({
              where: {
                id:
                  submittedOfficerId,
              },

              select: {
                id: true,
              },
            });

          if (!officer) {
            throw new Error(
              "ไม่พบข้อมูลผู้ขอเบิก"
            );
          }
        }

        // =================================================
        // ตรวจ Material
        //
        // ตรวจเฉพาะว่ามี Material อยู่จริง
        //
        // ไม่ตรวจ Stock
        // ไม่ตรวจ ReceiveItem
        // ไม่ทำ FEFO
        // =================================================

        const requestedMaterialIds =
          newItems.map(
            (item) =>
              item.materialId
          );

        const existingMaterials =
          await tx.material.findMany({
            where: {
              id: {
                in:
                  requestedMaterialIds,
              },
            },

            select: {
              id: true,
            },
          });

        const existingMaterialIds =
          new Set(
            existingMaterials.map(
              (
                material: {
                  id: number;
                }
              ) =>
                material.id
            )
          );

        for (
          const item of newItems
        ) {
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
        // ใบ PENDING เป็นเพียงคำขอเบิก
        //
        // ขั้นตอน Edit:
        //
        // - ไม่คืน Stock
        // - ไม่เพิ่ม Stock
        // - ไม่ลด Stock
        // - ไม่แก้ Material.balance
        // - ไม่แก้ ReceiveItem.balance
        // - ไม่เลือก Lot
        // - ไม่ทำ FEFO
        // - ไม่สร้าง Transaction
        //
        // Stock จะเปลี่ยนเมื่อ Admin ยืนยัน
        // "จำนวนที่เบิกจ่ายจริง"
        // =================================================

        // =================================================
        // ลบ IssueItem เดิม
        // =================================================

        await tx.issueItem.deleteMany({
          where: {
            issueId,
          },
        });

        // =================================================
        // กำหนด Officer
        //
        // ถ้า Form มี officerId
        // ใช้ค่าที่ Form ส่งมา
        //
        // ถ้าไม่มี field
        // รักษาค่าเดิม
        // =================================================

        const officerId =
          hasOfficerIdField
            ? submittedOfficerId
            : oldIssue.officerId;

        // =================================================
        // กำหนดหมายเหตุหัวใบเบิก
        //
        // ถ้า Form มี remark ระดับ Issue
        // ใช้ค่าที่ส่งมา
        //
        // ถ้าไม่มี
        // รักษาค่าเดิม
        // =================================================

        const issueRemark =
          hasIssueRemarkField
            ? submittedIssueRemark ||
              null
            : oldIssue.remark;

        // =================================================
        // Update หัวเอกสาร
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
              issueRemark,

            // =============================================
            // ยังคงเป็น PENDING
            // =============================================

            status: "PENDING",

            approvedAt: null,

            approvedById: null,
          },
        });

        // =================================================
        // สร้าง IssueItem ใหม่
        //
        // โครงสร้าง:
        //
        // materialId
        // qty
        // remark  <-- เพิ่มใหม่
        //
        // issuedQty = 0
        //
        // ยังไม่ผูก ReceiveItem / Lot
        // =================================================

        for (
          const item of newItems
        ) {
          await tx.issueItem.create({
            data: {
              issueId,

              materialId:
                item.materialId,

              qty:
                item.qty,

              // ===========================================
              // หมายเหตุรายรายการ
              // ===========================================

              remark:
                item.remark,

              // ===========================================
              // ยังไม่ได้เบิกจ่ายจริง
              // ===========================================

              issuedQty: 0,

              // ===========================================
              // PENDING ยังไม่เลือกล็อต
              // ===========================================

              receiveItemId:
                null,

              manufacture:
                null,

              expiry:
                null,
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
  // Refresh หน้าที่เกี่ยวข้อง
  // =====================================================

  revalidatePath(
    "/issue"
  );

  revalidatePath(
    `/issue/${issueId}`
  );

  revalidatePath(
    `/issue/${issueId}/edit`
  );

  // =====================================================
  // ไม่มีการเปลี่ยน Stock ในขั้นตอน Edit
  //
  // แต่ refresh ไว้เพื่อป้องกันข้อมูล cache
  // =====================================================

  revalidatePath(
    "/stock-card"
  );

  // =====================================================
  // กลับหน้ารายละเอียดใบเบิก
  //
  // เดิม redirect("/issue")
  // เปลี่ยนเป็นหน้ารายละเอียดใบที่เพิ่งแก้
  // จะตรวจผลได้ทันที
  // =====================================================

  redirect(
    `/issue/${issueId}`
  );
}