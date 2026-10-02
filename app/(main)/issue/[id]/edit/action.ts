"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

/* =========================================================
   TYPES
========================================================= */

type IssueRow = {
  materialId: number;
  qty: number;
  issuedQty: number;
  remark: string | null;
};

/* =========================================================
   UPDATE ISSUE
========================================================= */

export async function updateIssue(
  formData: FormData
) {
  /* =======================================================
     SESSION
  ======================================================= */

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

  /* =======================================================
     HEADER
  ======================================================= */

  const issueId = Number(
    formData.get("issueId")
  );

  const issueDateValue =
    String(
      formData.get("issueDate") ?? ""
    ).trim();

  const issueDate =
    new Date(
      issueDateValue
    );

  const documentNo =
    String(
      formData.get("documentNo") ?? ""
    ).trim();

  const departmentId =
    Number(
      formData.get("departmentId")
    );

  /* =======================================================
     OFFICER
  ======================================================= */

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
      ? Number(
          officerIdValue
        )
      : null;

  /* =======================================================
     ISSUE REMARK
  ======================================================= */

  const issueRemarkFormValue =
    formData.get("remark");

  const hasIssueRemarkField =
    issueRemarkFormValue !== null;

  const submittedIssueRemark =
    String(
      issueRemarkFormValue ?? ""
    ).trim();

  /* =======================================================
     ITEMS

     EditIssueForm = 18 แถว
  ======================================================= */

  const newItems: IssueRow[] = [];

  for (
    let i = 0;
    i < 18;
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

    const issuedQtyValue =
      formData.get(
        `items[${i}].issuedQty`
      );

    const itemRemarkValue =
      formData.get(
        `items[${i}].remark`
      );

    const materialId =
      Number(
        materialValue
      );

    const qty =
      Number(
        qtyValue
      );

    const issuedQty =
      issuedQtyValue === null ||
      String(
        issuedQtyValue
      ).trim() === ""
        ? 0
        : Number(
            issuedQtyValue
          );

    const itemRemark =
      String(
        itemRemarkValue ?? ""
      ).trim();

    /* =====================================================
       เพิ่มเฉพาะแถวที่กรอก Material + Qty
    ===================================================== */

    if (
      Number.isInteger(
        materialId
      ) &&
      materialId > 0 &&
      Number.isFinite(
        qty
      ) &&
      Number.isInteger(
        qty
      ) &&
      qty > 0
    ) {
      if (
        !Number.isFinite(
          issuedQty
        ) ||
        !Number.isInteger(
          issuedQty
        ) ||
        issuedQty < 0
      ) {
        throw new Error(
          `จำนวนเบิกจ่ายจริงของรายการที่ ${
            i + 1
          } ไม่ถูกต้อง`
        );
      }

      if (
        issuedQty > qty
      ) {
        throw new Error(
          `จำนวนเบิกจ่ายจริงของรายการที่ ${
            i + 1
          } มากกว่าจำนวนที่ขอเบิก`
        );
      }

      newItems.push({
        materialId,
        qty,
        issuedQty,
        remark:
          itemRemark || null,
      });
    }
  }

  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

  if (
    !Number.isInteger(
      issueId
    ) ||
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
    submittedOfficerId !==
      null &&
    (
      !Number.isInteger(
        submittedOfficerId
      ) ||
      submittedOfficerId <=
        0
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

  /* =======================================================
     MATERIAL IDS

     ไม่ห้ามรายการพัสดุซ้ำแล้ว
     เพราะใบเบิกเดิมอาจมี Material เดียวกันหลายแถว
  ======================================================= */

  const materialIds =
    newItems.map(
      (item) =>
        item.materialId
    );

  /* =======================================================
     TRANSACTION
  ======================================================= */

  try {
    await prisma.$transaction(
      async (tx: any) => {
        /* =================================================
           LOAD OLD ISSUE
        ================================================= */

        const oldIssue =
          await tx.issue.findUnique({
            where: {
              id:
                issueId,
            },

            include: {
              items: {
                include: {
                  receiveItem:
                    true,

                  material:
                    true,
                },
              },
            },
          });

        if (!oldIssue) {
          throw new Error(
            "ไม่พบใบเบิก"
          );
        }

        /* =================================================
           STATUS
        ================================================= */

        if (
          oldIssue.status ===
          "REJECTED"
        ) {
          throw new Error(
            "ใบเบิกนี้ถูกไม่อนุมัติแล้ว ไม่สามารถแก้ไขได้"
          );
        }

        if (
          oldIssue.status !==
            "PENDING" &&
          oldIssue.status !==
            "APPROVED"
        ) {
          throw new Error(
            "สถานะใบเบิกนี้ไม่รองรับการแก้ไข"
          );
        }

        const isApproved =
          oldIssue.status ===
          "APPROVED";

        /* =================================================
           APPROVED
           ADMIN ONLY
        ================================================= */

        if (
          isApproved &&
          session.role !==
            "ADMIN"
        ) {
          throw new Error(
            "ใบเบิกที่บันทึกเบิกจ่ายแล้ว แก้ไขได้เฉพาะผู้ดูแลระบบ"
          );
        }

        /* =================================================
           USER PERMISSION
        ================================================= */

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

        /* =================================================
           DEPARTMENT
        ================================================= */

        const department =
          await tx.department.findUnique({
            where: {
              id:
                departmentId,
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

        /* =================================================
           OFFICER
        ================================================= */

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

        /* =================================================
           MATERIAL

           ใช้ Set เฉพาะตอน query
           เพื่อไม่ query ID ซ้ำโดยไม่จำเป็น
           แต่ไม่ได้ห้ามรายการซ้ำในใบเบิก
        ================================================= */

        const uniqueMaterialIds =
          [
            ...new Set(
              materialIds
            ),
          ];

        const existingMaterials =
          await tx.material.findMany({
            where: {
              id: {
                in:
                  uniqueMaterialIds,
              },
            },

            select: {
              id: true,
              name: true,
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
          const item of
            newItems
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

        /* =================================================
           OFFICER + REMARK
        ================================================= */

        const officerId =
          hasOfficerIdField
            ? submittedOfficerId
            : oldIssue.officerId;

        const issueRemark =
          hasIssueRemarkField
            ? submittedIssueRemark ||
              null
            : oldIssue.remark;

        /* =================================================
           APPROVED

           คืน Stock ที่เคยตัดจากใบเดิมก่อน
        ================================================= */

        if (isApproved) {
          for (
            const oldItem of
              oldIssue.items
          ) {
            const oldIssuedQty =
              Number(
                oldItem.issuedQty ??
                  0
              );

            if (
              oldIssuedQty <= 0
            ) {
              continue;
            }

            if (
              !oldItem.receiveItemId ||
              !oldItem.receiveItem
            ) {
              throw new Error(
                `ไม่สามารถย้อนสต็อกของ "${
                  oldItem.material
                    ?.name ??
                  oldItem.materialId
                }" ได้ เพราะไม่พบข้อมูลล็อตเดิม`
              );
            }

            /* =============================================
               หมายเหตุ

               IssueItem.receiveItemId เก็บล็อตแรก
               ของรายการเบิกไว้เพียง 1 ค่า

               ดังนั้นกรณีข้อมูลเก่าที่เคยตัดข้ามหลายล็อต
               ยังต้องระวังเป็นพิเศษ
            ============================================= */

            const receiveItemQty =
              Number(
                oldItem
                  .receiveItem
                  .qty ?? 0
              );

            if (
              oldIssuedQty >
              receiveItemQty
            ) {
              throw new Error(
                `ใบเบิกเดิมของ "${
                  oldItem.material
                    ?.name ??
                  oldItem.materialId
                }" มีการเบิกข้ามหลายล็อต แต่ข้อมูลเดิมเก็บเลขล็อตไว้เพียงล็อตแรก จึงไม่สามารถแก้ย้อนหลังอย่างปลอดภัยได้`
              );
            }

            /* =============================================
               คืน ReceiveItem.balance
            ============================================= */

            await tx.receiveItem.update({
              where: {
                id:
                  oldItem
                    .receiveItemId,
              },

              data: {
                balance: {
                  increment:
                    oldIssuedQty,
                },
              },
            });

            /* =============================================
               คืน Material.balance
            ============================================= */

            await tx.material.update({
              where: {
                id:
                  oldItem
                    .materialId,
              },

              data: {
                balance: {
                  increment:
                    oldIssuedQty,
                },
              },
            });
          }
        }

        /* =================================================
           DELETE OLD ISSUE ITEMS
        ================================================= */

        await tx.issueItem.deleteMany({
          where: {
            issueId,
          },
        });

        /* =================================================
           UPDATE ISSUE HEADER
        ================================================= */

        await tx.issue.update({
          where: {
            id:
              issueId,
          },

          data: {
            issueDate,

            documentNo,

            departmentId,

            officerId,

            remark:
              issueRemark,

            status:
              isApproved
                ? "APPROVED"
                : "PENDING",

            approvedAt:
              isApproved
                ? oldIssue
                    .approvedAt
                : null,

            approvedById:
              isApproved
                ? oldIssue
                    .approvedById
                : null,
          },
        });

        /* =================================================
           PENDING

           แก้คำขออย่างเดียว
           ไม่แตะ Stock
        ================================================= */

        if (
          !isApproved
        ) {
          for (
            const item of
              newItems
          ) {
            await tx.issueItem.create({
              data: {
                issueId,

                materialId:
                  item.materialId,

                qty:
                  item.qty,

                remark:
                  item.remark,

                issuedQty:
                  0,

                receiveItemId:
                  null,

                manufacture:
                  null,

                expiry:
                  null,
              },
            });
          }

          return;
        }

        /* =================================================
           APPROVED

           ตัด Stock ใหม่ตาม FEFO
        ================================================= */

        for (
          const item of
            newItems
        ) {
          const quantityToIssue =
            Number(
              item.issuedQty
            );

          /* =============================================
             ไม่ได้จ่ายจริง
          ============================================= */

          if (
            quantityToIssue ===
            0
          ) {
            await tx.issueItem.create({
              data: {
                issueId,

                materialId:
                  item.materialId,

                qty:
                  item.qty,

                remark:
                  item.remark,

                issuedQty:
                  0,

                receiveItemId:
                  null,

                manufacture:
                  null,

                expiry:
                  null,
              },
            });

            continue;
          }

          /* =============================================
             FEFO

             1. expiry
             2. manufacture
             3. ReceiveItem.id
          ============================================= */

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
                  expiry:
                    "asc",
                },
                {
                  manufacture:
                    "asc",
                },
                {
                  id:
                    "asc",
                },
              ],
            });

          /* =============================================
             STOCK AVAILABLE
          ============================================= */

          const totalAvailable =
            receiveItems.reduce(
              (
                sum: number,
                receiveItem: any
              ) =>
                sum +
                Number(
                  receiveItem
                    .balance
                ),
              0
            );

          if (
            totalAvailable <
            quantityToIssue
          ) {
            const material =
              existingMaterials.find(
                (
                  currentMaterial: {
                    id: number;
                    name: string;
                  }
                ) =>
                  currentMaterial.id ===
                  item.materialId
              );

            throw new Error(
              `พัสดุ "${
                material?.name ??
                item.materialId
              }" มีจำนวนในล็อตไม่เพียงพอ (มี ${totalAvailable} แต่ต้องการ ${quantityToIssue})`
            );
          }

          let remaining =
            quantityToIssue;

          let firstReceiveItemId:
            number | null =
            null;

          let firstManufacture:
            Date | null =
            null;

          let firstExpiry:
            Date | null =
            null;

          /* =============================================
             CUT RECEIVE ITEMS
          ============================================= */

          for (
            const receiveItem of
              receiveItems
          ) {
            if (
              remaining <= 0
            ) {
              break;
            }

            const available =
              Number(
                receiveItem
                  .balance
              );

            if (
              available <= 0
            ) {
              continue;
            }

            const deduct =
              Math.min(
                available,
                remaining
              );

            await tx.receiveItem.update({
              where: {
                id:
                  receiveItem.id,
              },

              data: {
                balance:
                  available -
                  deduct,
              },
            });

            /* ===========================================
               เก็บล็อตแรกที่ถูกใช้
            =========================================== */

            if (
              firstReceiveItemId ===
              null
            ) {
              firstReceiveItemId =
                receiveItem.id;

              firstManufacture =
                receiveItem
                  .manufacture;

              firstExpiry =
                receiveItem
                  .expiry;
            }

            remaining -=
              deduct;
          }

          if (
            remaining > 0
          ) {
            throw new Error(
              `ไม่สามารถตัดสต็อกพัสดุ ID ${item.materialId} ได้ครบ เหลือ ${remaining} หน่วย`
            );
          }

          /* =============================================
             MATERIAL BALANCE
          ============================================= */

          await tx.material.update({
            where: {
              id:
                item.materialId,
            },

            data: {
              balance: {
                decrement:
                  quantityToIssue,
              },
            },
          });

          /* =============================================
             CREATE NEW ISSUE ITEM

             รองรับ Material เดียวกันหลายแถว
          ============================================= */

          await tx.issueItem.create({
            data: {
              issueId,

              materialId:
                item.materialId,

              qty:
                item.qty,

              remark:
                item.remark,

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
      },
      {
        maxWait:
          10000,

        timeout:
          120000,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE ISSUE ERROR:",
      error
    );

    throw error;
  }

  /* =======================================================
     REFRESH
  ======================================================= */

  revalidatePath(
    "/issue"
  );

  revalidatePath(
    `/issue/${issueId}`
  );

  revalidatePath(
    `/issue/${issueId}/edit`
  );

  revalidatePath(
    "/stock-card"
  );

  revalidatePath(
    "/materials"
  );

  revalidatePath(
    "/notifications"
  );

  /* =======================================================
     REDIRECT
  ======================================================= */

  redirect(
    `/issue/${issueId}`
  );
}