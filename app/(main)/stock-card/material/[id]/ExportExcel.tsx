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
};

type Props = {
  material: Material;
  rows: StockRow[];
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   DATE
========================================================= */

function formatDateAD(
  date: Date | string | null | undefined
) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return `${String(d.getDate()).padStart(
    2,
    "0"
  )}/${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}/${d.getFullYear()}`;
}

/* =========================================================
   SAFE FILE NAME
========================================================= */

function createSafeFileName(
  value: string
) {
  return value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportExcel({
  material,
  rows,
}: Props) {
  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  function handleExport() {
    /* =====================================================
       MATERIAL INFORMATION
    ===================================================== */

    const materialInformation = [
      ["บัญชีพัสดุ"],
      [],
      [
        "รหัสพัสดุ",
        material.code || "-",
      ],
      [
        "รายการพัสดุ",
        material.name || "-",
      ],
      [
        "หมวดหมู่",
        material.category
          ? categoryName[
              material.category
            ] ?? material.category
          : "-",
      ],
      [
        "หน่วย",
        material.unit || "-",
      ],
      [
        "ผู้จำหน่ายล่าสุด",
        material.vendor?.name || "-",
      ],
      [
        "ราคาล่าสุด",
        Number(
          material.latestPrice ?? 0
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
    ===================================================== */

    const tableRows = rows.map(
      (row) => [
        formatDateAD(row.date),

        row.documentNo || "-",

        row.owner || "-",

        Number(row.unitPrice),

        Number(row.receiveQty),

        Number(row.issueQty),

        Number(row.balance),

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
    ===================================================== */

    worksheet["!merges"] = [
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
    ];

    /* =====================================================
       COLUMN WIDTH
    ===================================================== */

    worksheet["!cols"] = [
      {
        wch: 16,
      },
      {
        wch: 22,
      },
      {
        wch: 36,
      },
      {
        wch: 16,
      },
      {
        wch: 12,
      },
      {
        wch: 12,
      },
      {
        wch: 12,
      },
      {
        wch: 16,
      },
      {
        wch: 16,
      },
    ];

    /* =====================================================
       NUMBER FORMAT

       แถวข้อมูลเริ่มหลัง:
       0 title
       1 blank
       2-7 information
       8 blank
       9 header
       10 data...
    ===================================================== */

    const firstDataRow = 10;

    rows.forEach(
      (_, index) => {
        const excelRow =
          firstDataRow + index;

        const priceCell =
          worksheet[
            XLSX.utils.encode_cell({
              r: excelRow,
              c: 3,
            })
          ];

        if (priceCell) {
          priceCell.z =
            "#,##0.00";
        }

        for (
          let column = 4;
          column <= 6;
          column++
        ) {
          const cell =
            worksheet[
              XLSX.utils.encode_cell({
                r: excelRow,
                c: column,
              })
            ];

          if (cell) {
            cell.z = "#,##0";
          }
        }
      }
    );

    /* =====================================================
       LATEST PRICE FORMAT
    ===================================================== */

    const latestPriceCell =
      worksheet["B8"];

    if (latestPriceCell) {
      latestPriceCell.z =
        "#,##0.00";
    }

    /* =====================================================
       WORKBOOK
    ===================================================== */

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "บัญชีพัสดุ"
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
        `บัญชีพัสดุ_${materialCode}_${materialName}`
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
     ใช้ AppButton ตัวกำหนดกลางเท่านั้น
  ========================================================= */

  return (
    <AppButton
      type="button"
      variant="success"
      size="md"
      onClick={handleExport}
      icon={
        <span aria-hidden="true">
          📊
        </span>
      }
    >
      ส่งออก Excel
    </AppButton>
  );
}