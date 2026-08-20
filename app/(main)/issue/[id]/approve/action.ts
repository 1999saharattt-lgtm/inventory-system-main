"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function approveIssue(
  issueId: number,
  issuedQty: Record<number, number>
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
    throw new Error("Session ไม่ถูกต้องหรือหมดอายุ");
  }

  // =====================================================
  // ADMIN เท่านั้นที่สามารถดำเนินการเบิกจ่าย
  // =====================================================

  if (session.role !== "ADMIN") {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการใบเบิก");
  }

  // =====================================================
  // ตรวจสอบ Issue ID
  // =====================================================

  if (!Number.isInteger(issueId) || issueId <= 0) {
    throw new Error("เลขที่ใบเบิกไม่ถูกต้อง");
  }

  const issue = await prisma.issue.findUnique({
    where: {
      id: issueId,
    },
    include: {
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  if (!issue) {
    throw new Error("ไม่พบรายการเบิก");
  }

  if (issue.status !== "PENDING") {
    throw new Error("ใบเบิกนี้ดำเนินการไปแล้ว");
  }

  // =====================================================
  // ตรวจสอบจำนวนเบิกจ่ายจริง
  // =====================================================

  for (const item of issue.items) {
    const value = issuedQty[item.id];

    if (value === undefined) {
      throw new Error(
        `กรุณาระบุจำนวนเบิกจ่ายจริงสำหรับ "${item.material.name}"`
      );
    }

    if (
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new Error(
        `จำนวนเบิกจ่ายของ "${item.material.name}" ไม่ถูกต้อง`
      );
    }

    if (value > Number(item.qty)) {
      throw new Error(
        `จำนวนเบิกจ่ายของ "${item.material.name}" มากกว่าจำนวนที่ขอเบิก`
      );
    }
  }

  // =====================================================
  // Transaction
  //
  // ทุกการตัดล็อต + Material.balance
  // + IssueItem + เปลี่ยนสถานะ
  // ต้องสำเร็จทั้งหมดพร้อมกัน
  // =====================================================

  await prisma.$transaction(async (tx) => {
    for (const item of issue.items) {
      const quantityToIssue = Number(
        issuedQty[item.id] ?? 0
      );

      // ---------------------------------------------------
      // ไม่มีการเบิกจ่ายรายการนี้
      // ---------------------------------------------------

      if (quantityToIssue === 0) {
        await tx.issueItem.update({
          where: {
            id: item.id,
          },
          data: {
            issuedQty: 0,
            receiveItemId: null,
            manufacture: null,
            expiry: null,
          },
        });

        continue;
      }

      // ---------------------------------------------------
      // ดึงล็อตที่ยังมีของ
      //
      // FEFO:
      // 1. มีวันหมดอายุ -> หมดอายุก่อนใช้ก่อน
      // 2. วันหมดอายุเท่ากัน -> วันผลิตเก่าก่อน
      // 3. ไม่มีวันหมดอายุ -> อยู่ท้าย
      // 4. id เก่าก่อน
      //
      // Prisma schema:
      // manufacture DateTime?
      // expiry      DateTime?
      // ---------------------------------------------------

      const receiveItems =
        await tx.receiveItem.findMany({
          where: {
            materialId: item.materialId,
            balance: {
              gt: 0,
            },
          },
          orderBy: [
            {
              expiry: "asc",
            },
            {
              manufacture: "asc",
            },
            {
              id: "asc",
            },
          ],
        });

      // ---------------------------------------------------
      // ตรวจสอบสต็อกรวมก่อนตัดจริง
      // ---------------------------------------------------

      const totalAvailable =
        receiveItems.reduce(
          (sum, receiveItem) =>
            sum +
            Number(receiveItem.balance),
          0
        );

      if (
        totalAvailable <
        quantityToIssue
      ) {
        throw new Error(
          `พัสดุ "${item.material.name}" มีจำนวนในล็อตไม่เพียงพอ ` +
            `(มี ${totalAvailable} แต่ต้องการ ${quantityToIssue})`
        );
      }

      // ---------------------------------------------------
      // ตัดล็อตตาม FEFO
      // ---------------------------------------------------

      let remaining =
        quantityToIssue;

      let firstReceiveItemId:
        number | null = null;

      let firstManufacture:
        Date | null = null;

      let firstExpiry:
        Date | null = null;

      for (
        const receiveItem of receiveItems
      ) {
        if (remaining <= 0) {
          break;
        }

        const available =
          Number(
            receiveItem.balance
          );

        if (available <= 0) {
          continue;
        }

        const deduct =
          Math.min(
            available,
            remaining
          );

        const newBalance =
          available - deduct;

        // -------------------------------------------------
        // บันทึกยอดคงเหลือของล็อต
        // -------------------------------------------------

        await tx.receiveItem.update({
          where: {
            id: receiveItem.id,
          },
          data: {
            balance: newBalance,
          },
        });

        // -------------------------------------------------
        // เก็บข้อมูลล็อตแรกที่ถูกใช้
        //
        // IssueItem มี receiveItemId เพียงช่องเดียว
        // จึงเก็บล็อตหลัก/ล็อตแรกที่ถูกตัด
        // -------------------------------------------------

        if (
          firstReceiveItemId === null
        ) {
          firstReceiveItemId =
            receiveItem.id;

          firstManufacture =
            receiveItem.manufacture;

          firstExpiry =
            receiveItem.expiry;
        }

        remaining -= deduct;
      }

      // ---------------------------------------------------
      // ป้องกันกรณีตัดล็อตไม่ครบ
      // ---------------------------------------------------

      if (remaining > 0) {
        throw new Error(
          `ไม่สามารถตัดสต็อก "${item.material.name}" ได้ครบ ` +
            `(เหลือ ${remaining} หน่วย)`
        );
      }

      // ---------------------------------------------------
      // ตัด Material.balance
      //
      // Material.balance ต้องสะท้อนยอดคงเหลือรวม
      // ---------------------------------------------------

      await tx.material.update({
        where: {
          id: item.materialId,
        },
        data: {
          balance: {
            decrement:
              quantityToIssue,
          },
        },
      });

      // ---------------------------------------------------
      // บันทึก IssueItem
      // ---------------------------------------------------

      await tx.issueItem.update({
        where: {
          id: item.id,
        },
        data: {
          issuedQty:
            quantityToIssue,

          receiveItemId:
            firstReceiveItemId,

          manufacture:
            firstManufacture,

          expiry:
            firstExpiry,
        },
      });
    }

    // =====================================================
    // เปลี่ยนสถานะใบเบิก
    //
    // บันทึก Admin ผู้ดำเนินการด้วย
    // =====================================================

    await tx.issue.update({
      where: {
        id: issue.id,
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: session.id,
      },
    });
  });

  // =====================================================
  // Refresh หน้าเกี่ยวข้อง
  // =====================================================

  revalidatePath("/issue");
  revalidatePath(`/issue/${issueId}`);
  revalidatePath(
    `/issue/${issueId}/approve`
  );
  revalidatePath("/stock-card");
  revalidatePath("/materials");
  revalidatePath("/notifications");

  return {
    success: true,
    issueId,
  };
}