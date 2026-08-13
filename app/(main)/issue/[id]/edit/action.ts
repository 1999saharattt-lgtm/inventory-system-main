"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function updateIssue(
  formData: FormData
) {
  const issueId =
    Number(formData.get("issueId"));

  const issueDate =
    new Date(
      formData.get("issueDate") as string
    );

  const documentNo =
    formData.get("documentNo") as string;

  const departmentId =
    Number(formData.get("departmentId"));

  const remark =
    (formData.get("remark") as string) || "";

  const newItems: {
    materialId: number;
    qty: number;
  }[] = [];

  for (let i = 0; i < 15; i++) {
    const materialId =
      Number(
        formData.get(
          `items[${i}].materialId`
        )
      );

    const qty =
      Number(
        formData.get(
          `items[${i}].qty`
        )
      );

    if (
      materialId &&
      qty > 0
    ) {
      newItems.push({
        materialId,
        qty,
      });
    }
  }

  await prisma.$transaction(
    async (tx: any) => {

      // =========================
      // ดึงข้อมูลใบเบิกเดิม
      // =========================

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

      // =========================
      // คืน Stock เดิม
      // =========================

      for (
        const oldItem of oldIssue.items
      ) {

        // -------------------------
        // คืน Material.balance
        // -------------------------

        await tx.material.update({
          where: {
            id: oldItem.materialId,
          },

          data: {
            balance: {
              increment: oldItem.qty,
            },
          },
        });

        // -------------------------
        // คืน ReceiveItem.balance
        // กลับล็อตเดิม
        // -------------------------

        if (
          oldItem.receiveItemId
        ) {

          await tx.receiveItem.update({
            where: {
              id:
                oldItem.receiveItemId,
            },

            data: {
              balance: {
                increment:
                  oldItem.qty,
              },
            },
          });

        }
      }

      // =========================
      // ลบ IssueItem เดิม
      // =========================

      await tx.issueItem.deleteMany({
        where: {
          issueId,
        },
      });

      // =========================
      // แก้ข้อมูลใบเบิก
      // =========================

      await tx.issue.update({
        where: {
          id: issueId,
        },

        data: {
          issueDate,
          documentNo,
          departmentId,
          remark,
        },
      });

      // =========================
      // สร้างรายการใหม่แบบ FEFO
      // =========================

      for (
        const item of newItems
      ) {

        let remainingQty =
          item.qty;

        // -------------------------
        // ตรวจสอบ Material
        // -------------------------

        const material =
          await tx.material.findUnique({
            where: {
              id:
                item.materialId,
            },
          });

        if (!material) {
          throw new Error(
            `ไม่พบพัสดุ ID ${item.materialId}`
          );
        }

        // -------------------------
        // ตรวจสอบ Material.balance
        // -------------------------

        if (
          material.balance <
          item.qty
        ) {
          throw new Error(
            `พัสดุ "${material.name}" มีจำนวนคงเหลือไม่เพียงพอ`
          );
        }

        // -------------------------
        // หา ReceiveItem
        // เรียง FEFO
        // -------------------------

        const receiveItems =
          await tx.receiveItem.findMany({
            where: {
              materialId:
                item.materialId,

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

        // -------------------------
        // ตรวจจำนวนล็อต
        // -------------------------

        const totalReceiveBalance =
          receiveItems.reduce(
            (
              total: number,
              receiveItem: any
            ) =>
              total +
              Number(
                receiveItem.balance
              ),
            0
          );

        if (
          totalReceiveBalance <
          item.qty
        ) {
          throw new Error(
            `พัสดุ "${material.name}" มีจำนวนในล็อตไม่เพียงพอ`
          );
        }

        // -------------------------
        // ตัดแต่ละล็อต
        // -------------------------

        for (
          const receiveItem
          of receiveItems
        ) {

          if (
            remainingQty <= 0
          ) {
            break;
          }

          const available =
            Number(
              receiveItem.balance
            );

          const issueQty =
            Math.min(
              remainingQty,
              available
            );

          // -------------------------
          // ลด ReceiveItem.balance
          // -------------------------

          await tx.receiveItem.update({
            where: {
              id:
                receiveItem.id,
            },

            data: {
              balance: {
                decrement:
                  issueQty,
              },
            },
          });

          // -------------------------
          // สร้าง IssueItem
          // ผูกกับล็อตจริง
          // -------------------------

          await tx.issueItem.create({
            data: {
              issueId,

              materialId:
                item.materialId,

              receiveItemId:
                receiveItem.id,

              qty:
                issueQty,

              manufacture:
                receiveItem.manufacture,

              expiry:
                receiveItem.expiry,
            },
          });

          remainingQty -=
            issueQty;
        }

        // -------------------------
        // ลด Material.balance
        // -------------------------

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

        // -------------------------
        // Transaction
        // -------------------------

        await tx.transaction.create({
          data: {
            materialId:
              item.materialId,

            type:
              "ISSUE_EDIT",

            documentNo,

            issueQty:
              item.qty,

            balance:
              material.balance -
              item.qty,

            department:
              String(departmentId),

            remark,
          },
        });
      }
    }
  );

  redirect("/issue");
}