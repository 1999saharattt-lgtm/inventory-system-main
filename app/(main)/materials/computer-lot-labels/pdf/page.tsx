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
   DATE ONLY

   สำคัญ:
   ไม่ใช้ toISOString()
   เพราะ toISOString จะแปลง timezone เป็น UTC
   และอาจทำให้วันที่บน PDF เลื่อนได้

   ผลลัพธ์:
   YYYY-MM-DD
========================================================= */

function toDateOnly(
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

  const year =
    value.getUTCFullYear();

  const month =
    String(
      value.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      value.getUTCDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
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
    normalizeSearchText(
      name
    );

  const normalizedCode =
    normalizeSearchText(
      code
    );

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

     ใช้ ReceiveItem.balance โดยตรง

     หลัก:
     - balance > 0 เท่านั้น
     - 1 ReceiveItem = 1 ล็อตจริง
     - จำนวนป้าย = balance ปัจจุบันของล็อตนั้น
     - วันผลิต/หมดอายุอ่านจาก ReceiveItem เดียวกัน
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

     สำคัญ:
     ห้ามใช้ toISOString()

     ส่งวันแบบ YYYY-MM-DD เท่านั้น
     เพื่อไม่ให้ Browser/Vercel timezone
     เปลี่ยนวัน เดือน หรือปี
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
          toDateOnly(
            item.manufacture
          ),

        expiry:
          toDateOnly(
            item.expiry
          ),

        receiveDate:
          toDateOnly(
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