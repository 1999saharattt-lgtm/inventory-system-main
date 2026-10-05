"use client";

import * as XLSX from "xlsx";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Material = {
  code?: string | null;
  name?: string | null;
  category?: string | null;
  unit?: string | null;

  vendor?: {
    name?: string | null;
  } | null;

  latestPrice?: number;
};

type StockRow = {
  date: Date | string;

  documentNo?: string | null;

  owner?: string | null;

  unitPrice: number;

  receiveQty: number;

  issueQty: number;

  balance: number;

  manufacture?: Date | string | null;

  expiry?: Date | string | null;

  type?: string;
};

type Props = {
  material: Material;

  rows: StockRow[];

  fiscalYear: number;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  OFFICE:
    "วัสดุสำนักงาน",

  COMPUTER:
    "วัสดุคอมพิวเตอร์",

  ELECTRIC:
    "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",

  VEHICLE:
    "วัสดุยานพาหนะ",

  PRINTING:
    "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   THAILAND DATE PARTS
========================================================= */

function getThailandDateParts(
  value: Date
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
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
    Number(
      parts.find(
        (part) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "month"
      )?.value
    );

  const day =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "day"
      )?.value
    );

  return {
    year,
    month,
    day,
  };
}

/* =========================================================
   DATE

   Excel แสดงเป็น ค.ศ.

   ตัวอย่าง:
   01/10/2026

   แต่ยึดวันตาม Asia/Bangkok
========================================================= */

function formatDateAD(
  date:
    | Date
    | string
    | null
    | undefined
) {
  if (!date) {
    return "-";
  }

  const d =
    date instanceof Date
      ? date
      : new Date(
          date
        );

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "-";
  }

  const parts =
    getThailandDateParts(
      d
    );

  return `${String(
    parts.day
  ).padStart(
    2,
    "0"
  )}/${String(
    parts.month
  ).padStart(
    2,
    "0"
  )}/${parts.year}`;
}

/* =========================================================
   SAFE FILE NAME
========================================================= */

function createSafeFileName(
  value: string
) {
  return value
    .replace(
      /[\\/:*?"<>|]/g,
      "-"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportExcel({
  material,
  rows,
  fiscalYear,
}: Props) {
  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  function handleExport() {
    /* =====================================================
       MATERIAL INFORMATION

       เพิ่มปีงบประมาณ
    ===================================================== */

    const materialInformation = [
      [
        "บัญชีพัสดุ",
      ],

      [
        `ปีงบประมาณ ${fiscalYear}`,
      ],

      [],

      [
        "รหัสพัสดุ",
        material.code ||
          "-",
      ],

      [
        "รายการพัสดุ",
        material.name ||
          "-",
      ],

      [
        "หมวดหมู่",

        material.category
          ? categoryName[
              material.category
            ] ??
            material.category
          : "-",
      ],

      [
        "หน่วย",
        material.unit ||
          "-",
      ],

      [
        "ผู้จำหน่ายล่าสุด",

        material.vendor
          ?.name ||
          "-",
      ],

      [
        "ราคาล่าสุด",

        Number(
          material.latestPrice ??
            0
        ),
      ],

      [],
    ];

    /* =====================================================
       TABLE HEADER
    ===================================================== */

    const tableHeader = [
      [
        "วันที่",
        "เลขที่เอกสาร",
        "ผู้จำหน่าย / หน่วยงาน",
        "ราคาล่าสุด",
        "รับเข้า",
        "เบิกจ่าย",
        "คงเหลือ",
        "วันผลิต",
        "วันหมดอายุ",
      ],
    ];

    /* =====================================================
       TABLE DATA

       stockRows จาก page.tsx:
       - มีเฉพาะ FY ที่เลือก
       - แถวแรกอาจเป็น OPENING_BALANCE
       - receiveQty ของยอดยก = ยอดต้นปี
       - balance = ยอดต้นปี
    ===================================================== */

    const tableRows =
      rows.map(
        (
          row
        ) => [
          formatDateAD(
            row.date
          ),

          row.documentNo ||
            "-",

          row.owner ||
            "-",

          Number(
            row.unitPrice ??
              0
          ),

          Number(
            row.receiveQty ??
              0
          ),

          Number(
            row.issueQty ??
              0
          ),

          Number(
            row.balance ??
              0
          ),

          formatDateAD(
            row.manufacture
          ),

          formatDateAD(
            row.expiry
          ),
        ]
      );

    /* =====================================================
       WORKSHEET
    ===================================================== */

    const worksheet =
      XLSX.utils.aoa_to_sheet([
        ...materialInformation,

        ...tableHeader,

        ...tableRows,
      ]);

    /* =====================================================
       MERGE TITLE

       Row 0:
       บัญชีพัสดุ

       Row 1:
       ปีงบประมาณ
    ===================================================== */

    worksheet[
      "!merges"
    ] = [
      {
        s: {
          r: 0,
          c: 0,
        },

        e: {
          r: 0,
          c: 8,
        },
      },

      {
        s: {
          r: 1,
          c: 0,
        },

        e: {
          r: 1,
          c: 8,
        },
      },
    ];

    /* =====================================================
       COLUMN WIDTH
    ===================================================== */

    worksheet[
      "!cols"
    ] = [
      {
        wch:
          16,
      },

      {
        wch:
          22,
      },

      {
        wch:
          36,
      },

      {
        wch:
          16,
      },

      {
        wch:
          12,
      },

      {
        wch:
          12,
      },

      {
        wch:
          12,
      },

      {
        wch:
          16,
      },

      {
        wch:
          16,
      },
    ];

    /* =====================================================
       ROW HEIGHTS
    ===================================================== */

    worksheet[
      "!rows"
    ] = [
      {
        hpt:
          28,
      },

      {
        hpt:
          24,
      },

      {
        hpt:
          8,
      },
    ];

    /* =====================================================
       NUMBER FORMAT

       โครงใหม่:

       row 0 = title
       row 1 = fiscal year
       row 2 = blank

       row 3 = code
       row 4 = name
       row 5 = category
       row 6 = unit
       row 7 = vendor
       row 8 = latest price
       row 9 = blank

       row 10 = table header
       row 11 = first data row
    ===================================================== */

    const firstDataRow =
      11;

    rows.forEach(
      (
        row,
        index
      ) => {
        const excelRow =
          firstDataRow +
          index;

        /* ===============================================
           PRICE
        =============================================== */

        const priceCell =
          worksheet[
            XLSX.utils.encode_cell({
              r:
                excelRow,

              c:
                3,
            })
          ];

        if (
          priceCell
        ) {
          priceCell.z =
            "#,##0.00";
        }

        /* ===============================================
           RECEIVE / ISSUE / BALANCE
        =============================================== */

        for (
          let column =
            4;

          column <=
          6;

          column++
        ) {
          const cell =
            worksheet[
              XLSX.utils.encode_cell({
                r:
                  excelRow,

                c:
                  column,
              })
            ];

          if (
            cell
          ) {
            cell.z =
              "#,##0";
          }
        }

        /* ===============================================
           OPENING BALANCE

           Excel CE/SheetJS community edition
           ไม่รับประกัน style ฟอนต์/สีเหมือน xlsx-style

           ดังนั้นยังรักษาค่าข้อมูลจริงไว้เป็นหลัก

           documentNo จะเป็น:
           "ยอดยกเข้าระบบ"
        =============================================== */

        if (
          row.type ===
            "OPENING_BALANCE" ||
          row.documentNo ===
            "ยอดยกเข้าระบบ"
        ) {
          const documentCell =
            worksheet[
              XLSX.utils.encode_cell({
                r:
                  excelRow,

                c:
                  1,
              })
            ];

          if (
            documentCell
          ) {
            documentCell.v =
              "ยอดยกเข้าระบบ";
          }
        }
      }
    );

    /* =====================================================
       LATEST PRICE FORMAT

       ราคาล่าสุดอยู่ B9
       เพราะเพิ่มแถว FY เข้ามา
    ===================================================== */

    const latestPriceCell =
      worksheet[
        "B9"
      ];

    if (
      latestPriceCell
    ) {
      latestPriceCell.z =
        "#,##0.00";
    }

    /* =====================================================
       AUTO FILTER

       ตารางเริ่ม row 10
       Excel row = 11
    ===================================================== */

    const lastTableRow =
      firstDataRow +
      Math.max(
        rows.length -
          1,
        0
      );

    worksheet[
      "!autofilter"
    ] = {
      ref:
        rows.length >
        0
          ? `A11:I${
              lastTableRow +
              1
            }`
          : "A11:I11",
    };

    /* =====================================================
       WORKBOOK
    ===================================================== */

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `บัญชีพัสดุ ${fiscalYear}`
    );

    /* =====================================================
       FILE NAME
    ===================================================== */

    const materialCode =
      material.code ||
      "material";

    const materialName =
      material.name ||
      "stock-card";

    const fileName =
      createSafeFileName(
        `บัญชีพัสดุ_${materialCode}_${materialName}_ปีงบประมาณ_${fiscalYear}`
      );

    /* =====================================================
       DOWNLOAD
    ===================================================== */

    XLSX.writeFile(
      workbook,
      `${fileName}.xlsx`
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppButton
      type="button"
      variant="success"
      size="md"
      onClick={
        handleExport
      }
      icon={
        <span
          aria-hidden="true"
        >
          📊
        </span>
      }
    >
      ส่งออก Excel
    </AppButton>
  );
}