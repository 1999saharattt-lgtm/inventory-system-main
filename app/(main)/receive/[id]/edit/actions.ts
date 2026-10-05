"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type ReceiveRow = {
  receiveItemId: number | null;
  materialId: number;
  qty: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
};

/* =========================================================
   FORM ROW COUNT

   ต้องตรงกับจำนวนแถวใน EditReceiveForm
========================================================= */

const RECEIVE_ROW_COUNT = 20;

/* =========================================================
   DATE ONLY

   รับค่าจาก input type="date"
   ในรูป YYYY-MM-DD

   ไม่ใช้:
   new Date("YYYY-MM-DD")

   เพื่อป้องกัน timezone ทำวันเลื่อน

   เก็บเป็น UTC 00:00
   แล้วตอนแสดงผลให้แปลงด้วย Asia/Bangkok
========================================================= */

function parseDateOnly(
  value: string
): Date | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const match =
    trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
      )
    );

  /*
   * ป้องกันวันที่ที่ไม่มีจริง เช่น
   * 31 ก.พ.
   */

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   UPDATE RECEIVE
========================================================= */

export async function updateReceive(
  formData: FormData
) {
  /* =======================================================
     HEADER
  ======================================================= */

  const receiveId =
    Number(
      formData.get(
        "receiveId"
      )
    );

  const receiveDateValue =
    String(
      formData.get(
        "receiveDate"
      ) ?? ""
    ).trim();

  const receiveDate =
    parseDateOnly(
      receiveDateValue
    );

  const documentNo =
    String(
      formData.get(
        "documentNo"
      ) ?? ""
    ).trim();

  const vendorId =
    Number(
      formData.get(
        "vendorId"
      )
    );

  const remark =
    String(
      formData.get(
        "remark"
      ) ?? ""
    ).trim();

  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

  if (
    !Number.isInteger(
      receiveId
    ) ||
    receiveId <= 0
  ) {
    throw new Error(
      "ข้อมูลเอกสารรับเข้าไม่ถูกต้อง"
    );
  }

  if (
    !receiveDateValue ||
    !receiveDate
  ) {
    throw new Error(
      "วันที่รับเข้าไม่ถูกต้อง"
    );
  }

  if (
    !documentNo
  ) {
    throw new Error(
      "กรุณาระบุเลขที่เอกสาร"
    );
  }

  if (
    !Number.isInteger(
      vendorId
    ) ||
    vendorId <= 0
  ) {
    throw new Error(
      "กรุณาเลือกผู้จำหน่าย"
    );
  }

  /* =======================================================
     ITEMS
  ======================================================= */

  const items:
    ReceiveRow[] = [];

  /* =======================================================
     อ่านรายการรับเข้าจาก FormData จำนวน 20 แถว

     receiveItemId มีค่า
     = แถวเดิม / ReceiveItem เดิม

     receiveItemId ว่าง
     = แถวใหม่ / ReceiveItem ใหม่

     สำคัญ:
     ไม่ merge ReceiveItem ในฐานข้อมูล
     เพราะ ReceiveItem.id อาจมีประวัติการเบิกอ้างถึงอยู่
  ======================================================= */

  for (
    let i = 0;
    i < RECEIVE_ROW_COUNT;
    i++
  ) {
    const receiveItemIdValue =
      String(
        formData.get(
          `items[${i}].receiveItemId`
        ) ?? ""
      ).trim();

    const parsedReceiveItemId =
      receiveItemIdValue
        ? Number(
            receiveItemIdValue
          )
        : null;

    const receiveItemId =
      parsedReceiveItemId !==
        null &&
      Number.isInteger(
        parsedReceiveItemId
      ) &&
      parsedReceiveItemId >
        0
        ? parsedReceiveItemId
        : null;

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

    const unitPrice =
      Number(
        formData.get(
          `items[${i}].unitPrice`
        )
      );

    const manufactureValue =
      String(
        formData.get(
          `items[${i}].manufacture`
        ) ?? ""
      ).trim();

    const expiryValue =
      String(
        formData.get(
          `items[${i}].expiry`
        ) ?? ""
      ).trim();

    const manufacture =
      manufactureValue
        ? parseDateOnly(
            manufactureValue
          )
        : null;

    const expiry =
      expiryValue
        ? parseDateOnly(
            expiryValue
          )
        : null;

    /* =====================================================
       EMPTY ROW
    ===================================================== */

    if (
      !materialId &&
      !qty
    ) {
      continue;
    }

    /* =====================================================
       MATERIAL
    ===================================================== */

    if (
      !Number.isInteger(
        materialId
      ) ||
      materialId <= 0
    ) {
      continue;
    }

    /* =====================================================
       QTY
    ===================================================== */

    if (
      !Number.isInteger(
        qty
      ) ||
      qty <= 0
    ) {
      throw new Error(
        "จำนวนรับเข้าต้องเป็นจำนวนเต็มมากกว่า 0"
      );
    }

    /* =====================================================
       UNIT PRICE
    ===================================================== */

    if (
      !Number.isFinite(
        unitPrice
      ) ||
      unitPrice < 0
    ) {
      throw new Error(
        "ราคาพัสดุไม่ถูกต้อง"
      );
    }

    /* =====================================================
       MANUFACTURE
    ===================================================== */

    if (
      manufactureValue &&
      !manufacture
    ) {
      throw new Error(
        `วันผลิตของรายการที่ ${
          i + 1
        } ไม่ถูกต้อง`
      );
    }

    /* =====================================================
       EXPIRY
    ===================================================== */

    if (
      expiryValue &&
      !expiry
    ) {
      throw new Error(
        `วันหมดอายุของรายการที่ ${
          i + 1
        } ไม่ถูกต้อง`
      );
    }

    /*
     * ถ้ามีทั้งวันผลิตและวันหมดอายุ
     * วันหมดอายุต้องไม่ก่อนวันผลิต
     */

    if (
      manufacture &&
      expiry &&
      expiry.getTime() <
        manufacture.getTime()
    ) {
      throw new Error(
        `วันหมดอายุของรายการที่ ${
          i + 1
        } ต้องไม่ก่อนวันผลิต`
      );
    }

    items.push({
      receiveItemId,
      materialId,
      qty,
      unitPrice,
      manufacture,
      expiry,
    });
  }

  if (
    items.length === 0
  ) {
    throw new Error(
      "กรุณาเลือกรายการรับเข้า"
    );
  }

  /* =======================================================
     EXISTING ID DUPLICATE

     ReceiveItem เดิม 1 ID
     ต้องปรากฏเพียง 1 แถว
  ======================================================= */

  const submittedExistingIds =
    items
      .map(
        (item) =>
          item.receiveItemId
      )
      .filter(
        (
          id
        ): id is number =>
          id !== null
      );

  if (
    new Set(
      submittedExistingIds
    ).size !==
    submittedExistingIds.length
  ) {
    throw new Error(
      "พบข้อมูลล็อตเดิมซ้ำในแบบฟอร์ม กรุณาเปิดหน้าแก้ไขใหม่แล้วลองอีกครั้ง"
    );
  }

  /* =======================================================
     TRANSACTION
  ======================================================= */

  await prisma.$transaction(
    async (tx: any) => {
      /* =================================================
         RECEIVE
      ================================================= */

      const receive =
        await tx.receive.findUnique({
          where: {
            id:
              receiveId,
          },
        });

      if (!receive) {
        throw new Error(
          "ไม่พบใบรับเข้า"
        );
      }

      /* =================================================
         OLD RECEIVE ITEMS
      ================================================= */

      const oldItems =
        await tx.receiveItem.findMany({
          where: {
            receiveId,
          },

          orderBy: {
            id:
              "asc",
          },
        });

      const oldItemMap =
        new Map<
          number,
          any
        >(
          oldItems.map(
            (
              oldItem: any
            ) => [
              oldItem.id,
              oldItem,
            ]
          )
        );

      /* =================================================
         AFFECTED MATERIAL
      ================================================= */

      const affectedMaterialIds =
        new Set<number>();

      for (
        const oldItem of
          oldItems
      ) {
        affectedMaterialIds.add(
          oldItem.materialId
        );
      }

      for (
        const item of
          items
      ) {
        affectedMaterialIds.add(
          item.materialId
        );
      }

      /* =================================================
         ACTUAL USED QTY

         ใช้ยอดที่ถูกตัดออกจาก ReceiveItem จริง

         issuedQty =
         qty เดิม - balance ปัจจุบัน

         ไม่ใช้ IssueItem.receiveItemId
         เพราะการเบิกหนึ่งรายการอาจกินหลายล็อต
      ================================================= */

      const oldItemUsage =
        new Map<
          number,
          number
        >();

      for (
        const oldItem of
          oldItems
      ) {
        const oldQty =
          Number(
            oldItem.qty ??
              0
          );

        const oldBalance =
          Number(
            oldItem.balance ??
              0
          );

        const issuedQty =
          Math.max(
            0,
            oldQty -
              oldBalance
          );

        oldItemUsage.set(
          oldItem.id,
          issuedQty
        );
      }

      /* =================================================
         UPDATE HEADER
      ================================================= */

      await tx.receive.update({
        where: {
          id:
            receiveId,
        },

        data: {
          receiveDate,
          documentNo,
          vendorId,
          remark,
        },
      });

      const submittedIdSet =
        new Set(
          submittedExistingIds
        );

      /* =================================================
         UPDATE OLD RECEIVE ITEMS

         ใช้ ReceiveItem.id โดยตรง

         ไม่จับคู่ด้วย:
         - materialId
         - manufacture
         - expiry

         จึงไม่ทำให้ล็อตสลับ ID
      ================================================= */

      for (
        const item of
          items
      ) {
        if (
          item.receiveItemId ===
          null
        ) {
          continue;
        }

        const oldItem =
          oldItemMap.get(
            item.receiveItemId
          );

        if (!oldItem) {
          throw new Error(
            `ไม่พบล็อตเดิมรหัส ${item.receiveItemId} ในใบรับเข้านี้ กรุณาเปิดหน้าแก้ไขใหม่แล้วลองอีกครั้ง`
          );
        }

        const oldIssueQty =
          oldItemUsage.get(
            oldItem.id
          ) ?? 0;

        /*
         * ReceiveItem ที่ถูกเบิกแล้ว
         * ห้ามเปลี่ยนเป็น Material อื่น
         *
         * เพราะมีประวัติการตัด stock
         * ของ ReceiveItem นี้อยู่
         */

        if (
          oldIssueQty > 0 &&
          item.materialId !==
            oldItem.materialId
        ) {
          throw new Error(
            `ไม่สามารถเปลี่ยนรายการพัสดุ "${oldItem.materialId}" ได้ เพราะมีการเบิกจากล็อตนี้ไปแล้ว`
          );
        }

        /*
         * จำนวนใหม่ต้องไม่ต่ำกว่า
         * จำนวนที่เคยถูกเบิกจริง
         */

        if (
          item.qty <
          oldIssueQty
        ) {
          throw new Error(
            `ไม่สามารถแก้ล็อต ReceiveItem #${oldItem.id} (วัสดุ ${oldItem.materialId}) ได้: จำนวนใหม่ ${item.qty} แต่ล็อตนี้มีการเบิกไปแล้ว ${oldIssueQty}`
          );
        }

        const newBalance =
          item.qty -
          oldIssueQty;

        await tx.receiveItem.update({
          where: {
            id:
              oldItem.id,
          },

          data: {
            materialId:
              item.materialId,

            qty:
              item.qty,

            balance:
              newBalance,

            unitPrice:
              item.unitPrice,

            manufacture:
              item.manufacture,

            expiry:
              item.expiry,
          },
        });
      }

      /* =================================================
         REMOVED OLD ITEMS

         - ไม่เคยถูกเบิก -> ลบได้
         - เคยถูกเบิก -> ห้ามลบ
      ================================================= */

      for (
        const oldItem of
          oldItems
      ) {
        if (
          submittedIdSet.has(
            oldItem.id
          )
        ) {
          continue;
        }

        const oldIssueQty =
          oldItemUsage.get(
            oldItem.id
          ) ?? 0;

        if (
          oldIssueQty > 0
        ) {
          throw new Error(
            `ไม่สามารถลบรายการ "${oldItem.materialId}" ได้ เพราะมีการเบิกไปแล้ว ${oldIssueQty}`
          );
        }

        await tx.receiveItem.delete({
          where: {
            id:
              oldItem.id,
          },
        });
      }

      /* =================================================
         CREATE NEW RECEIVE ITEMS

         receiveItemId ว่าง
         = รายการใหม่ในใบรับเดิม

         ไม่รวมกับ ReceiveItem เดิมในฐานข้อมูล

         การรวม "ล็อตสำหรับป้าย"
         จะทำเฉพาะตอนสร้าง PDF
      ================================================= */

      for (
        const item of
          items
      ) {
        if (
          item.receiveItemId !==
          null
        ) {
          continue;
        }

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

      /* =================================================
         RECALCULATE MATERIAL BALANCE

         Material.balance
         =
         sum ReceiveItem.balance
      ================================================= */

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
              balance:
                true,
            },
          });

        const newMaterialBalance =
          Number(
            totalBalance
              ._sum
              .balance ??
              0
          );

        await tx.material.update({
          where: {
            id:
              materialId,
          },

          data: {
            balance:
              newMaterialBalance,
          },
        });
      }

      /* =================================================
         LATEST PRICE
      ================================================= */

      const latestPriceByMaterial =
        new Map<
          number,
          number
        >();

      for (
        const item of
          items
      ) {
        latestPriceByMaterial.set(
          item.materialId,
          item.unitPrice
        );
      }

      for (
        const [
          materialId,
          latestPrice,
        ] of
          latestPriceByMaterial
      ) {
        await tx.material.update({
          where: {
            id:
              materialId,
          },

          data: {
            latestPrice,
          },
        });
      }
    },
    {
      maxWait:
        30000,

      timeout:
        60000,
    }
  );

  redirect(
    "/receive"
  );
}