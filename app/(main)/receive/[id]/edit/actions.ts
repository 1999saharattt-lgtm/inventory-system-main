"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type ReceiveRow = {
  materialId: number;
  qty: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
};

function sameDate(
  a: Date | null,
  b: Date | null
) {
  if (!a && !b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const aTime = new Date(a).getTime();
  const bTime = new Date(b).getTime();

  return aTime === bTime;
}

export async function updateReceive(
  formData: FormData
) {
  const receiveId = Number(
    formData.get("receiveId")
  );

  const receiveDateValue =
    formData.get("receiveDate") as string;

  const receiveDate = new Date(
    receiveDateValue
  );

  const documentNo =
    (formData.get("documentNo") as string) || "";

  const vendorId = Number(
    formData.get("vendorId")
  );

  const remark =
    (formData.get("remark") as string) || "";

  const items: ReceiveRow[] = [];

  // =====================================================
  // อ่านรายการรับเข้าจาก FormData
  // =====================================================

  for (let i = 0; i < 15; i++) {
    const materialId = Number(
      formData.get(
        `items[${i}].materialId`
      )
    );

    const qty = Number(
      formData.get(
        `items[${i}].qty`
      )
    );

    const unitPrice = Number(
      formData.get(
        `items[${i}].unitPrice`
      )
    );

    const manufactureValue =
      (formData.get(
        `items[${i}].manufacture`
      ) as string) || "";

    const expiryValue =
      (formData.get(
        `items[${i}].expiry`
      ) as string) || "";

    const manufacture =
      manufactureValue
        ? new Date(manufactureValue)
        : null;

    const expiry =
      expiryValue
        ? new Date(expiryValue)
        : null;

    if (
      materialId > 0 &&
      qty > 0
    ) {
      items.push({
        materialId,
        qty,
        unitPrice,
        manufacture,
        expiry,
      });
    }
  }

  if (items.length === 0) {
    throw new Error(
      "กรุณาเลือกรายการรับเข้า"
    );
  }

  // =====================================================
  // Transaction
  // =====================================================

  await prisma.$transaction(
    async (tx: any) => {
      // =================================================
      // ตรวจสอบใบรับเดิม
      // =================================================

      const receive =
        await tx.receive.findUnique({
          where: {
            id: receiveId,
          },
        });

      if (!receive) {
        throw new Error(
          "ไม่พบใบรับเข้า"
        );
      }

      // =================================================
      // ดึง ReceiveItem เดิม
      // =================================================

      const oldItems =
        await tx.receiveItem.findMany({
          where: {
            receiveId,
          },

          orderBy: {
            id: "asc",
          },
        });

      // =================================================
      // หา Material ที่ได้รับผลกระทบ
      // =================================================

      const affectedMaterialIds = [
        ...new Set([
          ...oldItems.map(
            (item: any) =>
              item.materialId
          ),

          ...items.map(
            (item) =>
              item.materialId
          ),
        ]),
      ];

      // =================================================
      // ตรวจว่า ReceiveItem เดิมตัวไหนถูกเบิกไปแล้ว
      //
      // ใช้ issuedQty เป็นจำนวนที่ถูกเบิกจริง
      // ถ้าไม่มี issuedQty ให้ใช้ qty
      // =================================================

      const oldItemUsage =
        new Map<
          number,
          {
            issueQty: number;
            issueItemIds: number[];
          }
        >();

      for (
        const oldItem of oldItems
      ) {
        const issueItems =
          await tx.issueItem.findMany({
            where: {
              receiveItemId:
                oldItem.id,
            },

            select: {
              id: true,
              qty: true,
              issuedQty: true,
            },
          });

        const issueQty =
          issueItems.reduce(
            (
              sum: number,
              issueItem: any
            ) => {
              const actualIssuedQty =
                issueItem.issuedQty ??
                issueItem.qty ??
                0;

              return (
                sum +
                Number(
                  actualIssuedQty
                )
              );
            },
            0
          );

        oldItemUsage.set(
          oldItem.id,
          {
            issueQty,

            issueItemIds:
              issueItems.map(
                (
                  issueItem: any
                ) =>
                  issueItem.id
              ),
          }
        );
      }

      // =================================================
      // แบ่ง ReceiveItem เดิม
      //
      // protectedOldItems
      // = มีการเบิกแล้ว ห้ามลบ
      //
      // editableOldItems
      // = ยังไม่เคยเบิก สามารถลบและสร้างใหม่ได้
      // =================================================

      const protectedOldItems =
        oldItems.filter(
          (item: any) =>
            (
              oldItemUsage.get(
                item.id
              )?.issueQty ?? 0
            ) > 0
        );

      const editableOldItems =
        oldItems.filter(
          (item: any) =>
            (
              oldItemUsage.get(
                item.id
              )?.issueQty ?? 0
            ) === 0
        );

      // =================================================
      // ลบเฉพาะ ReceiveItem เดิม
      // ที่ยังไม่เคยถูกเบิก
      // =================================================

      if (
        editableOldItems.length >
        0
      ) {
        await tx.receiveItem.deleteMany({
          where: {
            id: {
              in:
                editableOldItems.map(
                  (item: any) =>
                    item.id
                ),
            },
          },
        });
      }

      // =================================================
      // แก้หัวเอกสาร
      // =================================================

      await tx.receive.update({
        where: {
          id: receiveId,
        },

        data: {
          receiveDate,
          documentNo,
          vendorId,
          remark,
        },
      });

      // =================================================
      // รายการจากฟอร์มที่ยังไม่ได้จับคู่
      // =================================================

      const remainingFormItems =
        [...items];

      // =================================================
      // อัปเดตล็อตเดิมที่ถูกเบิกแล้ว
      //
      // ลำดับการจับคู่:
      //
      // 1. materialId + manufacture + expiry
      // 2. ถ้าไม่เจอ ให้จับคู่ด้วย materialId
      //
      // วิธีนี้ทำให้แก้วันผลิต / วันหมดอายุ
      // ของล็อตที่เคยถูกเบิกแล้วได้
      // โดยยังรักษา ReceiveItem.id เดิม
      // =================================================

      for (
        const oldItem of
        protectedOldItems
      ) {
        const usage =
          oldItemUsage.get(
            oldItem.id
          );

        const oldIssueQty =
          usage?.issueQty ?? 0;

        // -------------------------------------------------
        // พยายามจับคู่แบบละเอียดก่อน
        // -------------------------------------------------

        let formIndex =
          remainingFormItems.findIndex(
            (item) =>
              item.materialId ===
                oldItem.materialId &&
              sameDate(
                item.manufacture,
                oldItem.manufacture
              ) &&
              sameDate(
                item.expiry,
                oldItem.expiry
              )
          );

        // -------------------------------------------------
        // ถ้าหาไม่เจอ
        // ให้จับคู่จาก materialId
        //
        // รองรับกรณีผู้ใช้แก้วันผลิต / วันหมดอายุ
        // -------------------------------------------------

        if (formIndex === -1) {
          formIndex =
            remainingFormItems.findIndex(
              (item) =>
                item.materialId ===
                oldItem.materialId
            );
        }

        // -------------------------------------------------
        // ถ้าไม่พบรายการในฟอร์ม
        //
        // ห้ามลบ ReceiveItem ที่มีประวัติการเบิก
        // -------------------------------------------------

        if (formIndex === -1) {
          continue;
        }

        const formItem =
          remainingFormItems[
            formIndex
          ];

        // -------------------------------------------------
        // จำนวนใหม่ต้องไม่น้อยกว่าจำนวน
        // ที่ถูกเบิกจริงไปแล้ว
        // -------------------------------------------------

        if (
          formItem.qty <
          oldIssueQty
        ) {
          throw new Error(
            `ไม่สามารถลดจำนวน "${oldItem.materialId}" ต่ำกว่า ${oldIssueQty} ได้ เพราะมีการเบิกไปแล้ว`
          );
        }

        // -------------------------------------------------
        // คำนวณยอดคงเหลือใหม่
        //
        // qty ใหม่ - จำนวนที่เบิกจริง
        // -------------------------------------------------

        const newBalance =
          formItem.qty -
          oldIssueQty;

        // -------------------------------------------------
        // อัปเดต ReceiveItem เดิม
        //
        // สำคัญ:
        // ไม่สร้าง ReceiveItem ใหม่
        // เพื่อรักษา receiveItemId
        // ที่ IssueItem อ้างอิงอยู่
        // -------------------------------------------------

        await tx.receiveItem.update({
          where: {
            id: oldItem.id,
          },

          data: {
            qty:
              formItem.qty,

            balance:
              newBalance,

            unitPrice:
              formItem.unitPrice,

            manufacture:
              formItem.manufacture,

            expiry:
              formItem.expiry,
          },
        });

        // เอารายการนี้ออกจากรายการที่ยังเหลือ
        remainingFormItems.splice(
          formIndex,
          1
        );
      }

      // =================================================
      // สร้าง ReceiveItem ใหม่
      //
      // เหลือเฉพาะรายการที่ไม่มี ReceiveItem เดิม
      // ที่ต้องรักษาไว้
      // =================================================

      for (
        const item of
        remainingFormItems
      ) {
        await tx.receiveItem.create({
          data: {
            receiveId,

            materialId:
              item.materialId,

            qty:
              item.qty,

            balance:
              item.qty,

            unitPrice:
              item.unitPrice,

            manufacture:
              item.manufacture,

            expiry:
              item.expiry,
          },
        });
      }

      // =================================================
      // คำนวณ Material.balance ใหม่
      // จาก ReceiveItem จริงทั้งหมด
      // =================================================

      for (
        const materialId of
        affectedMaterialIds
      ) {
        const totalBalance =
          await tx.receiveItem.aggregate({
            where: {
              materialId,
            },

            _sum: {
              balance: true,
            },
          });

        const newMaterialBalance =
          Number(
            totalBalance._sum
              .balance ?? 0
          );

        await tx.material.update({
          where: {
            id: materialId,
          },

          data: {
            balance:
              newMaterialBalance,
          },
        });
      }

      // =================================================
      // อัปเดต latestPrice
      //
      // ใช้ราคาจากรายการล่าสุดในฟอร์ม
      // =================================================

      for (
        const item of items
      ) {
        await tx.material.update({
          where: {
            id:
              item.materialId,
          },

          data: {
            latestPrice:
              item.unitPrice,
          },
        });
      }
    },
    {
      maxWait: 30000,
      timeout: 60000,
    }
  );

  // =====================================================
  // กลับหน้ารายการรับเข้า
  // =====================================================

  redirect("/receive");
}