import { prisma } from "@/lib/prisma";

import ComputerLotLabelsPdf from "./ComputerLotLabelsPdf";

/* =========================================================
   FORCE FRESH DATA
========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES
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
   NORMALIZE
========================================================= */

function normalizeSearchText(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/* =========================================================
   PRINTER CONSUMABLE CHECK

   ตรวจทั้ง:
   - ชื่อรายการ
   - รหัสวัสดุ
========================================================= */

function isPrinterConsumable(
  name: string,
  code: string
): boolean {
  const normalizedName =
    normalizeSearchText(name);

  const normalizedCode =
    normalizeSearchText(code);

  const searchText =
    `${normalizedCode} ${normalizedName}`;

  /* -------------------------------------------------------
     DIRECT KEYWORDS
  ------------------------------------------------------- */

  const keywords = [
    "หมึก",
    "น้ำหมึก",
    "ตลับหมึก",
    "หมึกพิมพ์",
    "หมึกเครื่องพิมพ์",

    "โทนเนอร์",
    "ตลับโทนเนอร์",

    "ดรัม",
    "ชุดดรัม",
    "ตลับดรัม",

    "ink",
    "inkjet",
    "ink cartridge",

    "toner",
    "toner cartridge",

    "cartridge",

    "drum",
    "drum unit",
  ];

  if (
    keywords.some(
      (keyword) =>
        searchText.includes(
          keyword
        )
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     CANON
  ------------------------------------------------------- */

  if (
    /\bcli[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bpgi[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bpg[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bcl[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     HP / CANON LASER
  ------------------------------------------------------- */

  if (
    /\b(?:cf|ce|cc|q)[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bw[\s-]?\d{4,}[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     BROTHER
  ------------------------------------------------------- */

  if (
    /\btn[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bdr[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\blc[\s-]?\d+[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     SAMSUNG
  ------------------------------------------------------- */

  if (
    /\bmlt[\s-]?[a-z0-9-]+\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     EPSON
  ------------------------------------------------------- */

  if (
    /\bt[a-z0-9]{3,}\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bc13[a-z0-9-]+\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     RICOH / FUJI / XEROX
  ------------------------------------------------------- */

  if (
    /\bsp[\s-]?\d{3,}[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  if (
    /\bct[\s-]?\d{3,}[a-z]*\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     KYOCERA
  ------------------------------------------------------- */

  if (
    /\btk[\s-]?\d+[a-z]*\b/i.test(
      searchText
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
     LOAD RECEIVE ITEMS

     สำคัญมาก:

     ใช้ ReceiveItem.balance โดยตรง

     ไม่คำนวณ qty - issuedQty ใหม่
     เพราะ balance คือยอดคงเหลือจริงของล็อต
     ที่ระบบจัดเก็บไว้
  ======================================================= */

  const receiveItems =
    await prisma.receiveItem.findMany({
      where: {
        balance: {
          gt: 0,
        },

        material: {
          category: {
            in: [
              "COMPUTER",
              "PRINTING",
            ],
          },
        },
      },

      select: {
        id: true,

        receiveId: true,
        materialId: true,

        qty: true,
        balance: true,

        manufacture: true,
        expiry: true,

        material: {
          select: {
            code: true,
            name: true,
            unit: true,
            category: true,
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
     FILTER PRINTER CONSUMABLES

     ตรวจทั้งชื่อและรหัส
  ======================================================= */

  const printerConsumables =
    receiveItems.filter(
      (item) =>
        isPrinterConsumable(
          item.material.name,
          item.material.code
        )
    );

  /* =======================================================
     SERIALIZE

     1 object = 1 ReceiveItem = 1 ล็อตจริง

     balance
     manufacture
     expiry

     มาจาก ReceiveItem เดียวกันทั้งหมด
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
          Number(
            item.balance ?? 0
          ),

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

  return (
    <ComputerLotLabelsPdf
      lots={lots}
    />
  );
}