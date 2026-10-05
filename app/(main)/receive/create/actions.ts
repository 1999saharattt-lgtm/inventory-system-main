"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/* =========================================================
   FORM ROW COUNT

   ต้องตรงกับจำนวนแถวใน ReceiveForm
========================================================= */

const RECEIVE_ROW_COUNT =
  20;

/* =========================================================
   TYPES
========================================================= */

type ReceiveRow = {
  materialId: number;
  qty: number;
  unitPrice: number;

  manufacture:
    Date | null;

  expiry:
    Date | null;
};

type FiscalYearInfo = {
  fiscalYearGregorian:
    number;

  fiscalYearThai:
    number;

  fiscalYearThaiShort:
    string;

  startDate:
    Date;

  endDate:
    Date;
};

/* =========================================================
   DATE ONLY

   รับจาก input type="date"

   YYYY-MM-DD

   ไม่ใช้:
   new Date("YYYY-MM-DD")

   โดยตรงในส่วน logic

   เพื่อให้เราตรวจสอบวันที่ได้ชัดเจน
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
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

  if (
    !Number.isInteger(
      year
    ) ||
    !Number.isInteger(
      month
    ) ||
    !Number.isInteger(
      day
    )
  ) {
    return null;
  }

  if (
    year < 1900 ||
    year > 3000
  ) {
    return null;
  }

  if (
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  if (
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  /*
   * เก็บ date-only เป็น UTC 00:00
   *
   * ตัวอย่าง:
   * 2026-10-01
   * =>
   * 2026-10-01T00:00:00.000Z
   */

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
   * ตรวจวันที่จริง
   *
   * ป้องกัน:
   * 31 ก.พ.
   * 31 เม.ย.
   * เป็นต้น
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
   FISCAL YEAR FROM DATE ONLY

   ใช้วันที่ที่ผู้ใช้เลือกจริง

   30 ก.ย. 2569
   =>
   FY 2569

   1 ต.ค. 2569
   =>
   FY 2570
========================================================= */

function getFiscalYearInfoFromDate(
  date: Date
): FiscalYearInfo {
  /*
   * date มาจาก parseDateOnly()
   * จึงอ่านด้วย UTC ได้ตรงกับ YYYY-MM-DD
   */

  const year =
    date.getUTCFullYear();

  const month =
    date.getUTCMonth() +
    1;

  const fiscalYearGregorian =
    month >= 10
      ? year + 1
      : year;

  const fiscalYearThai =
    fiscalYearGregorian +
    543;

  const fiscalYearThaiShort =
    String(
      fiscalYearThai
    ).slice(
      -2
    );

  /*
   * ช่วงปีงบประมาณตามเวลาไทย
   *
   * FY 2570
   *
   * เริ่ม:
   * 1 ต.ค. 2569 00:00 ไทย
   *
   * สิ้นสุดแบบ exclusive:
   * 1 ต.ค. 2570 00:00 ไทย
   *
   * Bangkok UTC+7
   *
   * 00:00 ไทย
   * =
   * 17:00 UTC วันก่อนหน้า
   */

  const startDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian -
          1,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  return {
    fiscalYearGregorian,

    fiscalYearThai,

    fiscalYearThaiShort,

    startDate,

    endDate,
  };
}

/* =========================================================
   GENERATE RECEIVE DOCUMENT NUMBER

   รูปแบบ:
   ร.01/70
   ร.02/70
   ...

   ทุก 1 ตุลาคม
   เริ่ม ร.01/ปีงบใหม่

   สำคัญ:
   - สร้างภายใน transaction
   - ใช้ receiveDate จริง
   - ไม่เชื่อ documentNo จาก browser
========================================================= */

async function generateReceiveNo(
  tx: any,
  receiveDate: Date
) {
  const fiscal =
    getFiscalYearInfoFromDate(
      receiveDate
    );

  /* =======================================================
     LOAD DOCUMENTS IN SAME FISCAL YEAR
  ======================================================= */

  const receives =
    await tx.receive.findMany({
      where: {
        receiveDate: {
          gte:
            fiscal.startDate,

          lt:
            fiscal.endDate,
        },

        documentNo: {
          startsWith:
            "ร.",
        },
      },

      select: {
        documentNo:
          true,
      },
    });

  /* =======================================================
     FIND MAX RUNNING

     รองรับข้อมูลเก่า:

     ร.1/69
     ร.01/69
     ร.001/69
     ร.01/2569
  ======================================================= */

  let maxRunning =
    0;

  for (
    const receive of
      receives
  ) {
    const documentNo =
      String(
        receive.documentNo ??
          ""
      ).trim();

    const match =
      documentNo.match(
        /^ร\.(\d+)\/(\d{2}|\d{4})$/
      );

    if (!match) {
      continue;
    }

    const running =
      Number(
        match[1]
      );

    if (
      !Number.isInteger(
        running
      ) ||
      running <= 0
    ) {
      continue;
    }

    if (
      running >
      maxRunning
    ) {
      maxRunning =
        running;
    }
  }

  const nextRunning =
    maxRunning +
    1;

  const documentNo =
    `ร.${String(
      nextRunning
    ).padStart(
      2,
      "0"
    )}/${fiscal.fiscalYearThaiShort}`;

  return {
    documentNo,

    fiscalYearThai:
      fiscal.fiscalYearThai,
  };
}

/* =========================================================
   CREATE RECEIVE
========================================================= */

export async function createReceive(
  formData: FormData
) {
  /* =======================================================
     HEADER
  ======================================================= */

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

  /*
   * ใช้เพื่อตรวจกรณี
   * ยอดยกเข้าระบบเท่านั้น
   *
   * ใบรับปกติจะไม่ใช้เลข
   * ที่ browser ส่งมา
   */

  const submittedDocumentNo =
    String(
      formData.get(
        "documentNo"
      ) ?? ""
    ).trim();

  const isOpeningBalance =
    submittedDocumentNo ===
    "ยอดยกเข้าระบบ";

  /* =======================================================
     VALIDATE HEADER
  ======================================================= */

  if (
    !receiveDateValue ||
    !receiveDate
  ) {
    throw new Error(
      "วันที่รับเข้าไม่ถูกต้อง"
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
     READ ITEMS
  ======================================================= */

  const items:
    ReceiveRow[] =
    [];

  for (
    let i = 0;
    i <
    RECEIVE_ROW_COUNT;
    i++
  ) {
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
      throw new Error(
        `รายการที่ ${
          i + 1
        } ยังไม่ได้เลือกพัสดุ`
      );
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
        `จำนวนรับเข้าของรายการที่ ${
          i + 1
        } ต้องเป็นจำนวนเต็มมากกว่า 0`
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
        `ราคาต่อหน่วยของรายการที่ ${
          i + 1
        } ไม่ถูกต้อง`
      );
    }

    /* =====================================================
       MANUFACTURE
    ===================================================== */

    const manufacture =
      manufactureValue
        ? parseDateOnly(
            manufactureValue
          )
        : null;

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

    const expiry =
      expiryValue
        ? parseDateOnly(
            expiryValue
          )
        : null;

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

    /* =====================================================
       DATE RELATION
    ===================================================== */

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
      materialId,

      qty,

      unitPrice,

      manufacture,

      expiry,
    });
  }

  /* =======================================================
     REQUIRE ITEM
  ======================================================= */

  if (
    items.length ===
    0
  ) {
    throw new Error(
      "กรุณาเลือกรายการรับเข้าอย่างน้อย 1 รายการ"
    );
  }

  /* =======================================================
     PREPARE REDIRECT FY

     ใช้แม้เป็นยอดยกเข้าระบบ
  ======================================================= */

  const fiscal =
    getFiscalYearInfoFromDate(
      receiveDate
    );

  /* =======================================================
     TRANSACTION
  ======================================================= */

  await prisma.$transaction(
    async (
      tx: any
    ) => {
      /* =================================================
         VENDOR

         ตรวจให้แน่ใจว่ามีจริง
      ================================================= */

      const vendor =
        await tx.vendor.findUnique({
          where: {
            id:
              vendorId,
          },

          select: {
            id:
              true,

            name:
              true,
          },
        });

      if (!vendor) {
        throw new Error(
          "ไม่พบข้อมูลผู้จำหน่าย"
        );
      }

      /* =================================================
         DOCUMENT NUMBER

         ยอดยกเข้าระบบ:
         คงข้อความเดิม

         ใบรับปกติ:
         สร้างใหม่จาก receiveDate จริง
      ================================================= */

      let documentNo:
        string;

      if (
        isOpeningBalance
      ) {
        documentNo =
          "ยอดยกเข้าระบบ";
      } else {
        const generated =
          await generateReceiveNo(
            tx,
            receiveDate
          );

        documentNo =
          generated.documentNo;
      }

      /* =================================================
         CREATE RECEIVE HEADER
      ================================================= */

      const receive =
        await tx.receive.create({
          data: {
            receiveDate,

            documentNo,

            vendorId,

            remark,
          },
        });

      /* =================================================
         CREATE RECEIVE ITEMS
      ================================================= */

      for (
        const item of
          items
      ) {
        /* ===============================================
           CREATE RECEIVE ITEM
        =============================================== */

        await tx.receiveItem.create({
          data: {
            receiveId:
              receive.id,

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

        /* ===============================================
           MATERIAL BALANCE + LATEST PRICE
        =============================================== */

        const updatedMaterial =
          await tx.material.update({
            where: {
              id:
                item.materialId,
            },

            data: {
              balance: {
                increment:
                  item.qty,
              },

              latestPrice:
                item.unitPrice,
            },

            select: {
              id:
                true,

              balance:
                true,
            },
          });

        /* ===============================================
           STOCK CARD

           ใช้เลขเอกสารเดียวกับ Receive Header
           ที่สร้างใน transaction นี้
        =============================================== */

        await tx.transaction.create({
          data: {
            materialId:
              item.materialId,

            date:
              receiveDate,

            type:
              "RECEIVE",

            documentNo,

            receiveQty:
              item.qty,

            issueQty:
              0,

            balance:
              updatedMaterial.balance,

            unitPrice:
              item.unitPrice,

            vendor:
              vendor.name,

            remark,
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

  /* =======================================================
     REDIRECT

     กลับไปปีงบประมาณของเอกสารที่เพิ่งสร้าง

     เช่นเลือกวันที่:
     30 ก.ย. 2569
     =>
     /receive?fiscalYear=2569

     เลือก:
     1 ต.ค. 2569
     =>
     /receive?fiscalYear=2570
  ======================================================= */

  redirect(
    `/receive?fiscalYear=${fiscal.fiscalYearThai}`
  );
}