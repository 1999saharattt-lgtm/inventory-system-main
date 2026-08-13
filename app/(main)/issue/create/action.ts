"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";

export async function createIssue(formData: FormData) {
  const issueDate = new Date(
    formData.get("issueDate") as string
  );

  const documentNo =
    formData.get("documentNo") as string;

  const departmentId = Number(
    formData.get("departmentId")
  );

  const officerId = Number(
    formData.get("officerId")
  );

  const remark =
    (formData.get("remark") as string) || "";

  // =====================
  // Upload PDF
  // =====================

  let pdfPath: string | null = null;

  const file =
    formData.get("pdf") as File;

  if (file && file.size > 0) {
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
  // =====================

  const items: {
    materialId: number;
    qty: number;
  }[] = [];

  for (let i = 0; i < 15; i++) {
    const materialId =
      formData.get(
        `items[${i}].materialId`
      );

    const qty =
      formData.get(
        `items[${i}].qty`
      );

    if (
      materialId &&
      qty &&
      Number(qty) > 0
    ) {
      items.push({
        materialId: Number(materialId),
        qty: Number(qty),
      });
    }
  }

  if (items.length === 0) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );
  }

  // =====================
  // Transaction
  // =====================

  await prisma.$transaction(
    async (tx: any) => {

      const issue =
        await tx.issue.create({
          data: {
            issueDate,
            documentNo,
            departmentId,

            officerId:
              officerId > 0
                ? officerId
                : null,

            remark,
            pdf: pdfPath,
          },
        });

      // =====================
      // ตัด Stock ตาม FEFO
      // =====================

      for (const item of items) {

        let remainingQty =
          item.qty;

        // =====================
        // ตรวจสอบ Material
        // =====================

        const material =
          await tx.material.findUnique({
            where: {
              id: item.materialId,
            },
          });

        if (!material) {
          throw new Error(
            `ไม่พบพัสดุ ID ${item.materialId}`
          );
        }

        // =====================
        // ตรวจ Material.balance
        // =====================

        if (
          material.balance <
          item.qty
        ) {
          throw new Error(
            `พัสดุ "${material.name}" มีจำนวนคงเหลือไม่เพียงพอ`
          );
        }

        // =====================
        // หา ReceiveItem
        // FEFO
        // =====================

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

        // =====================
        // กรณีไม่มีล็อต
        // =====================

        if (
          receiveItems.length === 0
        ) {

          /*
           * กรณีนี้คือ Stock เดิม
           * มีอยู่ใน Material.balance
           * แต่ไม่มี ReceiveItem
           *
           * จึงสร้าง ReceiveItem
           * สำหรับยอดยกเข้าระบบ
           */

          const openingReceive =
            await tx.receive.findFirst({
              where: {
                documentNo:
                  "ยอดยกเข้าระบบ",
              },

              orderBy: {
                id: "asc",
              },
            });

          if (!openingReceive) {
            throw new Error(
              "ไม่พบรายการรับ 'ยอดยกเข้าระบบ' สำหรับสร้างล็อตเริ่มต้น"
            );
          }

          const openingLot =
            await tx.receiveItem.create({
              data: {
                receiveId:
                  openingReceive.id,

                materialId:
                  item.materialId,

                qty:
                  material.balance,

                balance:
                  material.balance,

                unitPrice:
                  material.latestPrice,

                manufacture:
                  null,

                expiry:
                  null,
              },
            });

          receiveItems.push(
            openingLot
          );
        }

        // =====================
        // ตรวจยอดล็อต
        // =====================

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
            `พัสดุ "${material.name}" มีจำนวนในล็อตไม่เพียงพอ (ล็อตเหลือ ${totalReceiveBalance} แต่ต้องการเบิก ${item.qty})`
          );
        }

        // =====================
        // ตัดแต่ละล็อต
        // =====================

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

          // =====================
          // ลดล็อต
          // =====================

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

          // =====================
          // สร้าง IssueItem
          // =====================

          await tx.issueItem.create({
            data: {
              issueId:
                issue.id,

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

        // =====================
        // คำนวณ Material.balance
        // จาก ReceiveItem จริง
        // =====================

        const remainingLots =
          await tx.receiveItem.aggregate({
            where: {
              materialId:
                item.materialId,
            },

            _sum: {
              balance: true,
            },
          });

        const newMaterialBalance =
          Number(
            remainingLots._sum.balance || 0
          );

        await tx.material.update({
          where: {
            id:
              item.materialId,
          },

          data: {
            balance:
              newMaterialBalance,
          },
        });
      }
    }
  );

  redirect("/issue");
}