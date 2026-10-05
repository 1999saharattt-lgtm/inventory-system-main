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
   THAILAND DATE ONLY

   สำคัญมาก:

   ระบบหน้ารับเข้าแสดงวันตามเวลาไทย
   ดังนั้นตอนส่งไปสร้าง PDF
   ต้องดึงวัน/เดือน/ปีด้วย timezone Asia/Bangkok เช่นกัน

   ห้ามใช้:
   date.toISOString().slice(0, 10)

   เพราะ ISO = UTC
   และข้อมูลที่เคยบันทึกเป็นเวลาไทยอาจเลื่อนไปวันก่อนหน้า

   ผลลัพธ์:
   YYYY-MM-DD (ค.ศ.)
========================================================= */

function toThailandDateOnly(
  value: Date | null
): string | null {
  if (!value) {
    return null;
  }

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return null;
  }

  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      value
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

/* =========================================================
   PRINTER CONSUMABLE CHECK
========================================================= */

function isPrinterConsumable(
  name: string,
  code: string
): boolean {
  const normalizedName =
    normalizeSearchText(
      name
    );

  const normalizedCode =
    normalizeSearchText(
      code
    );

  const searchText =
    `${normalizedCode} ${normalizedName}`;

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

  /* CANON */

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

  /* HP / CANON LASER */

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

  /* BROTHER */

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

  /* SAMSUNG */

  if (
    /\bmlt[\s-]?[a-z0-9-]+\b/i.test(
      searchText
    )
  ) {
    return true;
  }

  /* EPSON */

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

  /* RICOH / FUJI / XEROX */

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

  /* KYOCERA */

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

     ใช้ ReceiveItem.balance จริง

     เงื่อนไข:
     - ต้อง balance > 0
     - COMPUTER / PRINTING เท่านั้น
     - ไม่ใช้ Material.balance มาสร้างจำนวนป้าย
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
          receiveId:
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

     วันที่ทุกตัวส่งแบบ:
     YYYY-MM-DD

     โดยอ้างอิงวันตามประเทศไทย
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
          Math.max(
            0,
            Math.floor(
              Number(
                item.balance ?? 0
              )
            )
          ),

        manufacture:
          toThailandDateOnly(
            item.manufacture
          ),

        expiry:
          toThailandDateOnly(
            item.expiry
          ),

        receiveDate:
          toThailandDateOnly(
            item.receive
              ?.receiveDate ??
              null
          ),

        documentNo:
          item.receive
            ?.documentNo ??
          "",
      })
    );

  return (
    <ComputerLotLabelsPdf
      lots={lots}
    />
  );
}