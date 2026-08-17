"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";

// =====================================================
// สร้างใบเบิกพัสดุ
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
  // Transaction
  // =====================================================

  const issueId =
    await prisma.$transaction(
      async (tx: any) => {
        // =================================================
        // ดึงข้อมูล Material
        // =================================================

        const materials: any[] =
          await tx.material.findMany({
            where: {
              id: {
                in: materialIds,
              },
            },
          });

        const materialMap =
          new Map<number, any>(
            materials.map(
              (material: any) => [
                material.id,
                material,
              ]
            )
          );

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
            },
          });

        // =================================================
        // ตัดสต็อกแต่ละรายการด้วย FEFO
        // =================================================

        for (const item of items) {
          const materialId =
            Number(
              item.materialId
            );

          const qty =
            Number(item.qty);

          const material =
            materialMap.get(
              materialId
            );

          if (!material) {
            throw new Error(
              `ไม่พบพัสดุ ID ${materialId}`
            );
          }

          // -----------------------------------------------
          // ตรวจยอด Material.balance
          // -----------------------------------------------

          if (
            Number(material.balance) <
            qty
          ) {
            throw new Error(
              `พัสดุ "${material.name}" มีจำนวนไม่เพียงพอ (คงเหลือ ${material.balance} แต่ต้องการเบิก ${qty})`
            );
          }

          // -----------------------------------------------
          // ดึงล็อตที่มีของเหลือ
          // เรียงตาม FEFO
          // -----------------------------------------------

          const lots =
            await tx.receiveItem.findMany({
              where: {
                materialId,
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

          let remainingQty =
            qty;

          // -----------------------------------------------
          // ตัดจากล็อตตาม FEFO
          // -----------------------------------------------

          for (const lot of lots) {
            if (
              remainingQty <= 0
            ) {
              break;
            }

            const lotBalance =
              Number(
                lot.balance
              );

            if (
              lotBalance <= 0
            ) {
              continue;
            }

            const deductQty =
              Math.min(
                lotBalance,
                remainingQty
              );

            // ---------------------------------------------
            // ลดจำนวนในล็อต
            // ---------------------------------------------

            await tx.receiveItem.update({
              where: {
                id: lot.id,
              },
              data: {
                balance: {
                  decrement:
                    deductQty,
                },
              },
            });

            // ---------------------------------------------
            // บันทึก IssueItem
            // พร้อมผูกล็อตจริง
            // ---------------------------------------------

            await tx.issueItem.create({
              data: {
                issueId:
                  issue.id,
                materialId,
                qty: deductQty,
                receiveItemId:
                  lot.id,
              },
            });

            remainingQty -=
              deductQty;
          }

          // -----------------------------------------------
          // ตรวจว่าล็อตมีของพอหรือไม่
          // -----------------------------------------------

          if (
            remainingQty > 0
          ) {
            throw new Error(
              `พัสดุ "${material.name}" มีจำนวนในล็อตไม่เพียงพอ (ขาดอีก ${remainingQty})`
            );
          }

          // -----------------------------------------------
          // ลด Material.balance
          // -----------------------------------------------

          await tx.material.update({
            where: {
              id: materialId,
            },
            data: {
              balance: {
                decrement: qty,
              },
            },
          });
        }

        // =================================================
        // คืน ID ใบเบิกที่สร้างสำเร็จ
        // =================================================

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

  revalidatePath(
    "/stock-card"
  );

  // =====================================================
  // เปิดหน้าใบเบิกที่สร้างใหม่
  //
  // หน้า /issue/[id] จะมี IssuePdf
  // สำหรับสร้างและพิมพ์แบบ พอ.101
  // =====================================================

  redirect(
    `/issue/${issueId}`
  );
}

// =====================================================
// ลบใบเบิก
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
      // คืนจำนวนกลับ Material
      // =================================================

      for (
        const item of issue.items
      ) {
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

        // =================================================
        // คืนจำนวนกลับ ReceiveItem
        // ล็อตเดิมที่เคยถูกตัด
        // =================================================

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

  revalidatePath("/issue");
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