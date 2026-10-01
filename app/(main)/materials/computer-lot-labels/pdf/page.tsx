import { prisma } from "@/lib/prisma";

import ComputerLotLabelsPdf from "./ComputerLotLabelsPdf";

/* =========================================================
   FORCE FRESH DATA

   ดึงข้อมูลใหม่ทุกครั้ง
========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES

   1 ReceiveItem = 1 ล็อตจริง
========================================================= */

type LotLabel = {
  receiveItemId: number;
  receiveId: number;
  materialId: number;

  code: string;
  name: string;
  unit: string;

  balance: number;

  manufacture: string | null;
  expiry: string | null;

  receiveDate: string | null;
  documentNo: string;
};

/* =========================================================
   PRINTER CONSUMABLE CHECK

   รองรับทั้งชื่อภาษาไทย/อังกฤษ
   และชื่อที่มีเพียงรหัสรุ่น

   เช่น
   CLI-751
   PGI-750
   PG-740
   CL-741
   CF283A
   CE285A
   TN-2380
   DR-2355
========================================================= */

function isPrinterConsumable(
  name: string
): boolean {
  const normalized =
    name
      .trim()
      .toLowerCase();

  /* -------------------------------------------------------
     คำเรียกโดยตรง
  ------------------------------------------------------- */

  const keywords = [
    "หมึก",
    "หมึกพิมพ์",
    "หมึกเครื่องพิมพ์",
    "ตลับหมึก",

    "โทนเนอร์",
    "ตลับโทนเนอร์",

    "ดรัม",
    "ชุดดรัม",
    "ตลับดรัม",

    "ink",
    "inkjet",

    "toner",
    "toner cartridge",

    "cartridge",

    "drum",
    "drum unit",
  ];

  if (
    keywords.some(
      (keyword) =>
        normalized.includes(
          keyword
        )
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     Canon

     CLI-751
     CLI751
     PGI-750
     PG-740
     CL-741
  ------------------------------------------------------- */

  if (
    /\bcli[\s-]?\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\bpgi[\s-]?\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\bpg[\s-]?\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\bcl[\s-]?\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     HP

     CF283A
     CF230A
     CE285A
     CC388A
     Q2612A
  ------------------------------------------------------- */

  if (
    /\b(?:cf|ce|cc|q)\s*-?\s*\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     Brother

     TN-2380
     TN2380
     DR-2355
  ------------------------------------------------------- */

  if (
    /\btn[\s-]?\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\bdr[\s-]?\d+[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     Samsung / HP newer toner

     MLT-D...
     W1106A
     W1360A
  ------------------------------------------------------- */

  if (
    /\bmlt[\s-]?[a-z0-9-]+\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\bw\d{4,}[a-z]*\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     Epson

     T664
     T673
     T00V
     C13...
  ------------------------------------------------------- */

  if (
    /\bt[a-z0-9]{3,}\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\bc13[a-z0-9-]+\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   PAGE
========================================================= */

export default async function ComputerLotLabelsPdfPage() {
  /* =======================================================
     1) ดึง ReceiveItem ทุกตัวของวัสดุ COMPUTER

     สำคัญ:
     ไม่ filter balance > 0 ตรงฐานข้อมูลแล้ว

     เพราะ balance เดิมอาจคลาดเคลื่อน
     เราจะคำนวณยอดเหลือใหม่จาก qty - IssueItem
  ======================================================= */

  const receiveItems =
    await prisma.receiveItem.findMany({
      where: {
        material: {
          category: "COMPUTER",
        },
      },

      select: {
        id: true,

        receiveId: true,
        materialId: true,

        qty: true,

        manufacture: true,
        expiry: true,

        material: {
          select: {
            code: true,
            name: true,
            unit: true,
          },
        },

        receive: {
          select: {
            receiveDate: true,
            documentNo: true,
          },
        },
      },

      orderBy: [
        {
          materialId:
            "asc",
        },

        {
          id:
            "asc",
        },
      ],
    });

  /* =======================================================
     2) เก็บ ReceiveItem ID ทั้งหมด
  ======================================================= */

  const receiveItemIds =
    receiveItems.map(
      (item) =>
        item.id
    );

  /* =======================================================
     3) ดึงประวัติเบิกจริงของแต่ละ ReceiveItem

     issuedQty = จำนวนเบิกจริง

     ถ้า issuedQty ไม่มี
     fallback ใช้ qty
  ======================================================= */

  const issueItems =
    receiveItemIds.length >
    0
      ? await prisma.issueItem.findMany({
          where: {
            receiveItemId: {
              in:
                receiveItemIds,
            },
          },

          select: {
            receiveItemId:
              true,

            qty:
              true,

            issuedQty:
              true,
          },
        })
      : [];

  /* =======================================================
     4) รวมยอดเบิกตาม ReceiveItem

     Map:
     receiveItemId -> ยอดที่เบิกจริงแล้ว
  ======================================================= */

  const issuedQtyMap =
    new Map<
      number,
      number
    >();

  for (
    const issueItem of
    issueItems
  ) {
    if (
      !issueItem.receiveItemId
    ) {
      continue;
    }

    const actualIssuedQty =
      Number(
        issueItem.issuedQty ??
          issueItem.qty ??
          0
      );

    const currentIssued =
      issuedQtyMap.get(
        issueItem.receiveItemId
      ) ?? 0;

    issuedQtyMap.set(
      issueItem.receiveItemId,
      currentIssued +
        actualIssuedQty
    );
  }

  /* =======================================================
     5) คำนวณยอดคงเหลือใหม่ทีละ ReceiveItem

     remaining =
     จำนวนรับของล็อตนี้
     -
     จำนวนเบิกจากล็อตนี้จริง

     ตรงนี้คือจุดสำคัญที่สุด
  ======================================================= */

  const calculatedItems =
    receiveItems.map(
      (item) => {
        const receivedQty =
          Number(
            item.qty ?? 0
          );

        const issuedQty =
          issuedQtyMap.get(
            item.id
          ) ?? 0;

        const remainingQty =
          Math.max(
            0,
            receivedQty -
              issuedQty
          );

        return {
          ...item,

          calculatedBalance:
            remainingQty,
        };
      }
    );

  /* =======================================================
     6) เอาเฉพาะล็อตที่ยังเหลือจริง
  ======================================================= */

  const remainingItems =
    calculatedItems.filter(
      (item) =>
        item.calculatedBalance >
        0
    );

  /* =======================================================
     7) เอาเฉพาะหมึก / toner / drum

     ตรวจทั้งคำเรียกและรหัสรุ่น
  ======================================================= */

  const printerConsumables =
    remainingItems.filter(
      (item) =>
        isPrinterConsumable(
          item.material.name
        )
    );

  /* =======================================================
     8) SERIALIZE

     สำคัญ:

     1 element
     =
     1 ReceiveItem จริง
     =
     1 ล็อตจริง

     manufacture / expiry
     มาจาก ReceiveItem ตัวนั้นเท่านั้น
  ======================================================= */

  const lots: LotLabel[] =
    printerConsumables.map(
      (item) => ({
        receiveItemId:
          item.id,

        receiveId:
          item.receiveId,

        materialId:
          item.materialId,

        code:
          item.material.code,

        name:
          item.material.name,

        unit:
          item.material.unit,

        balance:
          item.calculatedBalance,

        manufacture:
          item.manufacture
            ? item.manufacture.toISOString()
            : null,

        expiry:
          item.expiry
            ? item.expiry.toISOString()
            : null,

        receiveDate:
          item.receive?.receiveDate
            ? item.receive.receiveDate.toISOString()
            : null,

        documentNo:
          item.receive?.documentNo ??
          "",
      })
    );

  /* =======================================================
     PDF
  ======================================================= */

  return (
    <ComputerLotLabelsPdf
      lots={lots}
    />
  );
}