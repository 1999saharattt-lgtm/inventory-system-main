"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

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

      // =====================
      // คืนจำนวนพัสดุกลับเข้าสต็อก
      // =====================

      for (
        const item of issue.items
      ) {

        // ---------------------
        // คืน Material.balance
        // ---------------------

        await tx.material.update({
          where: {
            id: item.materialId,
          },

          data: {
            balance: {
              increment: item.qty,
            },
          },
        });

        // ---------------------
        // ถ้าเป็นรายการที่ผูกล็อต
        // ให้คืน ReceiveItem.balance
        // กลับไปยังล็อตเดิม
        // ---------------------

        if (
          item.receiveItemId
        ) {

          await tx.receiveItem.update({
            where: {
              id: item.receiveItemId,
            },

            data: {
              balance: {
                increment: item.qty,
              },
            },
          });

        }

      }

      // =====================
      // ลบรายการพัสดุในใบเบิก
      // =====================

      await tx.issueItem.deleteMany({
        where: {
          issueId: id,
        },
      });

      // =====================
      // ลบใบเบิก
      // =====================

      await tx.issue.delete({
        where: {
          id,
        },
      });

    }
  );

  revalidatePath("/issue");
}

// =====================
// ลบเฉพาะไฟล์ PDF ใบเบิก
// =====================

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