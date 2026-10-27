"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import AppButton from "@/components/AppButton";

type Department = {
  id: number;
  name: string;
};

type Asset = {
  id: number;
  name: string;
  category: string;
  categoryDetail?: string | null;
  quantity?: number;
  unit?: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;

  /*
   * ผู้รับผิดชอบจากทะเบียนต้นฉบับ
   * เช่น งานสารบรรณ / หน้าห้องผู้อำนวยการ
   */
  responsibleName?: string | null;

  departmentId: number;
  sectionId: number | null;
  officerId: number | null;

  status: string;

  purchaseDate: Date | string | null;
  price: number | null;
  location: string | null;
  remark: string | null;

  section: {
    id: number;
    name: string;
  } | null;

  officer: {
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
  } | null;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string | null;

  department: {
    id: number;
    name: string;
  } | null;

  section: {
    id: number;
    name: string;
  } | null;
};

type InspectionRow = {
  assetId: number;
  countedQty: string;
  accuracy: string;
  status: string;
  remark: string;
};

type Props = {
  department: Department;
  assets: Asset[];
  rows: InspectionRow[];

  inspectionStartDate: string;
  inspectionEndDate: string;

  inspectorIds: string[];

  accountStartDate: string;
  accountEndDate: string;

  movementFiscalYear: string;

  officers?: Officer[];
};

const MAX_ROWS_PER_PAGE = 3;
const FIXED_FONT_SIZE = 8.5;
const MAX_BODY_HEIGHT = 125;


const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/* =========================================================
   PAGE
   ========================================================= */

const PAGE_WIDTH = 297;

/*
 * ใช้พื้นที่ A4 แนวนอนเกือบเต็มหน้า
 */
const TABLE_WIDTH = 285;

const MARGIN_X =
  (PAGE_WIDTH - TABLE_WIDTH) / 2;

const TABLE_START_Y = 35;

/*
 * เว้นช่องไฟระหว่างตารางกับส่วนลงชื่อ
 * ให้มีลักษณะเหมือนเอกสารราชการ
 */
const SIGNATURE_GAP = 10;

/*
 * อย่างน้อยให้ส่วนลงชื่อเริ่มประมาณช่วงล่างของหน้า
 */
const SIGNATURE_MIN_START_Y = 170;

/* =========================================================
   COLUMN WIDTH — A4 landscape, fixed font size in every cell
   ========================================================= */
const COLUMN_WIDTHS = {
  order: 6, gfmis: 17, assetNo: 19, location: 24,
  responsible: 21, category: 18, item: 34, brandModel: 16,
  unit: 9, accountStart: 15, receive: 8, issue: 8,
  accountEnd: 15, counted: 12, correct: 9, incorrect: 11,
  inUse: 10, damaged: 9, deteriorated: 11, unusable: 13,
} as const;

/* =========================================================
   DATE
   ========================================================= */

function parseDateOnly(
  value: string
) {
  if (!value) {
    return new Date(NaN);
  }

  const parts =
    value
      .split("-")
      .map(Number);

  if (
    parts.length !== 3 ||
    parts.some(Number.isNaN)
  ) {
    return new Date(NaN);
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatThaiDate(
  value: string
) {
  if (!value) {
    return "........";
  }

  const date =
    parseDateOnly(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "........";
  }

  const day =
    date.getDate();

  const month =
    thaiMonths[
      date.getMonth()
    ];

  const year =
    date.getFullYear() +
    543;

  return `${day} ${month} ${year}`;
}

/** ใช้เฉพาะวันที่ในหัวคอลัมน์ตาราง (ไม่เปลี่ยนวันที่บนหัวกระดาษ) */
function formatThaiShortDate(value: string): string {
  if (!value) return "........";
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return "........";
  const shortMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const year = String((date.getFullYear() + 543) % 100).padStart(2, "0");
  return `${day} ${shortMonths[date.getMonth()]} ${year}`;
}

/* =========================================================
   SOURCE ORDER

   ลำดับเดิมจากทะเบียนต้นฉบับ / Excel

   SOURCE:DEPARTMENT_1:n
   ========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match =
    remark.match(
      /SOURCE:DEPARTMENT_1:(\d+)/
    );

  if (!match) {
    return null;
  }

  const sourceOrder =
    Number(match[1]);

  if (
    !Number.isInteger(
      sourceOrder
    ) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   UNIT
   ========================================================= */

function getCategoryUnit(
  category: string
) {
  const categoryUnit:
    Record<string, string> = {
      COMPUTER: "เครื่อง",
      DESKTOP: "เครื่อง",
      LAPTOP: "เครื่อง",
      MONITOR: "เครื่อง",
      PRINTER: "เครื่อง",
      TELEPHONE: "เครื่อง",
      AIR_CONDITIONER:
        "เครื่อง",
      FAN: "เครื่อง",

      CHAIR: "ตัว",
      DESK: "ตัว",
      TABLE: "ตัว",
      SHELF: "ตัว",

      CABINET: "ตู้",

      OTHER: "รายการ",
      NO_SYSTEM: "รายการ",
    };

  return (
    categoryUnit[
      category
    ] || "รายการ"
  );
}

/* =========================================================
   OFFICER
   ========================================================= */

function getOfficer(
  officerId: string,
  officers: Officer[]
) {
  if (!officerId) {
    return undefined;
  }

  return officers.find(
    (officer) =>
      String(
        officer.id
      ) === officerId
  );
}

/* =========================================================
   RESPONSIBLE NAME

   รูปแบบเดียวกับหน้า /assets/[departmentId]/all

   ตัวอย่าง

   กลุ่มอำนวยการ / งานสารบรรณ
   กลุ่มอำนวยการ / หน้าห้องผู้อำนวยการ

   ลำดับการเลือกข้อมูล

   1. responsibleName จากทะเบียนเดิม
   2. section
   3. officer
   4. ชื่อกลุ่ม
   ========================================================= */

function getResponsibleName(
  asset: Asset,
  _department: Department
) {
  // ใช้ชื่อผู้รับผิดชอบที่บันทึกไว้ในทะเบียนครุภัณฑ์โดยตรง
  const recordedName = asset.responsibleName?.trim();
  if (recordedName && recordedName !== "-") {
    return recordedName;
  }

  // กรณีไม่มีชื่อในทะเบียน จึงใช้ชื่อบุคลากรที่ผูกกับครุภัณฑ์
  const officerName = asset.officer
    ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
    : "";
  return officerName || "";
}

/* =========================================================
   SINGLE LINE FONT SIZE

   ปรับขนาดตัวอักษรตามความกว้างจริง
   ========================================================= */

function getSingleLineFontSize(
  doc: jsPDF,
  text: string,
  cellWidth: number,
  maxSize = 8.5,
  minSize = 4.5,
  horizontalPadding = 1
) {
  const cleanText =
    text
      .replace(/\s+/g, " ")
      .trim();

  if (!cleanText) {
    return maxSize;
  }

  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  let fontSize =
    maxSize;

  const availableWidth =
    Math.max(
      cellWidth -
        horizontalPadding,
      1
    );

  while (
    fontSize >
    minSize
  ) {
    doc.setFontSize(
      fontSize
    );

    const textWidth =
      doc.getTextWidth(
        cleanText
      );

    if (
      textWidth <=
      availableWidth
    ) {
      return fontSize;
    }

    fontSize -= 0.25;
  }

  return minSize;
}

/* =========================================================
   MULTI LINE HEADER FONT SIZE

   รักษาหัวตารางให้มีเพียง 2 บรรทัดตามที่กำหนด
   โดยลดขนาดตัวอักษรให้แต่ละบรรทัดพอดีกับความกว้าง
   ไม่ให้ autoTable ตัดเป็นบรรทัดที่ 3
   ========================================================= */

function getMultiLineFontSize(
  doc: jsPDF,
  lines: string[],
  cellWidth: number,
  maxSize = 8,
  minSize = 5.5,
  horizontalPadding = 1
) {
  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  const availableWidth =
    Math.max(
      cellWidth -
        horizontalPadding,
      1
    );

  let fontSize =
    maxSize;

  while (
    fontSize >
    minSize
  ) {
    doc.setFontSize(
      fontSize
    );

    const fits =
      lines.every(
        (line) =>
          doc.getTextWidth(
            line
          ) <=
          availableWidth
      );

    if (fits) {
      return fontSize;
    }

    fontSize -= 0.25;
  }

  return minSize;
}

function getDisplayCategory(asset: Asset): string {
  const explicit = asset.categoryDetail?.trim();
  if (explicit && explicit !== "-") return explicit;
  const fromRemark = asset.remark?.match(/(?:^|\n)หมวด\/ชนิด:\s*([^\n]+)/)?.[1]?.trim();
  if (fromRemark && fromRemark !== "-") return fromRemark;
  if (asset.category === "OTHER") {
    const description = `${asset.name} ${asset.brand ?? ""} ${asset.model ?? ""}`;
    if (/เครื่องสำรองไฟ|\bUPS\b/i.test(description)) {
      return "เครื่องสำรองไฟฟ้า, เครื่องสำรองไฟฟ้า ชนิด True Online UPS";
    }
    return "ทั่วไป";
  }
  const labels: Record<string, string> = {
    CHAIR: "เก้าอี้, เก้าอี้สำนักงานพนักพิงสูง, เก้าอี้สำหรับห้องประชุม",
    AIR_CONDITIONER: "เครื่องปรับอากาศแบบติดผนัง, เครื่องปรับอากาศแบบแขวนฝ้าเพดาน",
    TELEPHONE: "เครื่องโทรศัพท์ ชนิด IP PHONE ไร้สาย",
    SHELF: "ชั้น",
    CABINET: "ตู้, ตู้ใส่เอกสาร 2 บานเปิด, ตู้เก็บเอกสารบานสไลด์, ตู้เอกสาร",
    DESK: "โต๊ะ, โต๊ะทำงาน, โต๊ะสำหรับวางคอมพิวเตอร์, โต๊ะวางของอเนกประสงค์",
    COMPUTER: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
    MONITOR: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
    PRINTER: "เครื่องพิมพ์คอมพิวเตอร์, เครื่องพิมพ์เลเซอร์ขาวดำ ชนิด Network แบบที่ 1, เครื่องพิมพ์เลเซอร์ LED สี ชนิด Network แบบที่ 2",
  };
  return labels[asset.category] ?? asset.category;
}

// แบ่งบรรทัดตามวลีที่คั่นด้วยจุลภาคหรือเครื่องหมายทับก่อน
// แล้วจึงให้ jsPDF ตัดตามความกว้างจริง โดยไม่ย่อฟอนต์และไม่ตัดข้อความทิ้ง
// ตัดข้อความตามขอบเขตคำภาษาไทย ไม่แยกสระหรือวรรณยุกต์จากพยัญชนะ
// รหัส GFMIS / รหัสครุภัณฑ์สามารถขึ้นบรรทัดใหม่ได้เมื่อจำเป็น
function wrapCellText(doc: jsPDF, value: string, width: number): string[] {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text || text === "-") return [""];
  const available = Math.max(1, width - 1.6);
  const segmenter = new Intl.Segmenter("th", { granularity: "word" });
  const words = Array.from(segmenter.segment(text), part => part.segment);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    // ข้อความติดกันยาวมาก เช่น รหัสครุภัณฑ์: แบ่งตามกราฟีมเพื่อไม่ให้ล้นช่อง
    if (doc.getTextWidth(word) > available) {
      if (current.trim()) { lines.push(current.trim()); current = ""; }
      const graphemes = Array.from(new Intl.Segmenter("th", { granularity: "grapheme" }).segment(word), x => x.segment);
      let part = "";
      for (const grapheme of graphemes) {
        if (part && doc.getTextWidth(part + grapheme) > available) {
          lines.push(part);
          part = grapheme;
        } else {
          part += grapheme;
        }
      }
      current = part;
      continue;
    }
    const candidate = current + word;
    if (current && doc.getTextWidth(candidate) > available) {
      lines.push(current.trim());
      current = word.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.length ? lines : [""];
}

// แบ่งพื้นที่คอลัมน์ให้รหัสและข้อความสำคัญมีความกว้างเหมาะสม
// โดยรักษาความกว้างรวมของตาราง A4 แนวนอน 285 มม. ไว้เท่าเดิม
function getAdjustedColumnWidths(doc: jsPDF, assets: Asset[], department: Department): number[] {
  const widths = [
    COLUMN_WIDTHS.order, COLUMN_WIDTHS.gfmis, COLUMN_WIDTHS.assetNo,
    COLUMN_WIDTHS.location, COLUMN_WIDTHS.responsible, COLUMN_WIDTHS.category,
    COLUMN_WIDTHS.item, COLUMN_WIDTHS.brandModel, COLUMN_WIDTHS.unit,
    COLUMN_WIDTHS.accountStart, COLUMN_WIDTHS.receive, COLUMN_WIDTHS.issue,
    COLUMN_WIDTHS.accountEnd, COLUMN_WIDTHS.counted, COLUMN_WIDTHS.correct,
    COLUMN_WIDTHS.incorrect, COLUMN_WIDTHS.inUse, COLUMN_WIDTHS.damaged,
    COLUMN_WIDTHS.deteriorated, COLUMN_WIDTHS.unusable,
  ].map(Number);
  doc.setFont("2.3.2 THSarabunNew", "normal");
  doc.setFontSize(FIXED_FONT_SIZE);
  const maxTextWidth = (values: string[]) => Math.max(0, ...values.map(v => doc.getTextWidth(v || ""))) + 2;
  const requests: [number, number][] = [
    [1, maxTextWidth(assets.map(a => a.governmentAssetNo?.trim() || ""))],
    [2, maxTextWidth(assets.map(a => a.officeAssetNo?.trim() || ""))],
    [3, maxTextWidth([department.name])],
    [4, maxTextWidth(assets.map(a => getResponsibleName(a, department)))],
    [7, maxTextWidth(assets.map(a => [a.brand, a.model].filter(Boolean).join(" / ")))],
  ];
  // จำกัดการขยายของข้อความที่ยาวมาก เพื่อไม่ให้คอลัมน์อื่นถูกบีบจนอ่านไม่ได้
  const caps: Record<number, number> = { 1: 30, 2: 33, 3: 33, 4: 35, 7: 30 };
  for (const [index, requested] of requests) widths[index] = Math.max(widths[index], Math.min(requested, caps[index]));
  const total = widths.reduce((a, b) => a + b, 0);
  if (total > TABLE_WIDTH) {
    const flexible = [5, 6, 9, 12, 13, 14, 15, 16, 17, 18, 19, 0, 8, 10, 11];
    const minimums: Record<number, number> = {
      0: 6, 5: 12, 6: 25, 8: 8, 9: 13, 10: 7, 11: 7,
      12: 13, 13: 11, 14: 8, 15: 9, 16: 9, 17: 8, 18: 9, 19: 11,
    };
    let excess = total - TABLE_WIDTH;
    for (const index of flexible) {
      const removable = Math.max(0, widths[index] - minimums[index]);
      const take = Math.min(excess, removable);
      widths[index] -= take;
      excess -= take;
      if (excess <= 0.001) break;
    }
    // เมื่อข้อมูลยาวเกินพื้นที่ A4 จริง ให้ลดเฉพาะคอลัมน์ข้อความ
    // ไม่ลดขนาดฟอนต์ และไม่บังคับตัดรหัสครุภัณฑ์
    if (excess > 0) {
      for (const index of [3, 4, 7, 5, 6]) {
        const take = Math.min(excess, Math.max(0, widths[index] - 12));
        widths[index] -= take;
        excess -= take;
        if (excess <= 0.001) break;
      }
    }
  }
  const remaining = TABLE_WIDTH - widths.reduce((sum, width) => sum + width, 0);
  widths[6] += remaining;
  return widths;
}

/* =========================================================
   CHECK
   ========================================================= */

function getStatusChecked(
  row: InspectionRow,
  status: string
) {
  return row.status ===
    status
    ? "✓"
    : "";
}

function getAccuracyChecked(
  row: InspectionRow,
  accuracy: string
) {
  return row.accuracy ===
    accuracy
    ? "✓"
    : "";
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ExportInspectionPdf({
  department,
  assets,
  rows,

  inspectionStartDate,
  inspectionEndDate,

  inspectorIds,

  accountStartDate,
  accountEndDate,

  movementFiscalYear,

  officers = [],
}: Props) {
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  /* =======================================================
     DOCUMENT HEADER
     ======================================================= */

  function drawDocumentHeader(
    doc: jsPDF,
    pageNumber: number,
    totalPages: number
  ) {
    const center =
      PAGE_WIDTH / 2;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setTextColor(
      0,
      0,
      0
    );

    // เลขแผ่นที่ใช้ฟอนต์เท่าหัวตาราง
    doc.setFontSize(FIXED_FONT_SIZE);
    doc.text(`แผ่นที่ ${pageNumber}`, PAGE_WIDTH - MARGIN_X, 9, { align: "right" });

    doc.setFontSize(15);

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${movementFiscalYear}`,
      center,
      12,
      {
        align: "center",
      }
    );

    doc.setFontSize(15);

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      20,
      {
        align: "center",
      }
    );

    /*
     * คงข้อความตามเดิม:
     * "... และตรวจสอบ แล้วเสร็จวันที่ ..."
     *
     * เว้นจากวันที่เริ่มตรวจเพียง 1 ช่องว่าง
     */
    doc.setFontSize(15);

    doc.text(
      `เริ่มดำเนินการตรวจสอบวันที่ ${formatThaiDate(
        inspectionStartDate
      )} และตรวจสอบ แล้วเสร็จวันที่ ${formatThaiDate(
        inspectionEndDate
      )}`,
      center,
      28,
      {
        align: "center",
      }
    );
  }

  /* =======================================================
     INSPECTORS
     ======================================================= */

  function drawInspectors(
    doc: jsPDF,
    startY: number
  ) {
    const columnWidth =
      TABLE_WIDTH / 5;

    const dotLine =
      "....................................................";

    for (
      let index = 0;
      index < 5;
      index++
    ) {
      const selectedInspectorId =
        inspectorIds[
          index
        ] || "";

      const selectedOfficer =
        getOfficer(
          selectedInspectorId,
          officers
        );

      const inspectorName =
        selectedOfficer
          ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`
          : "................................";

      const inspectorPosition =
        selectedOfficer?.position ||
        "................................";

      const centerX =
        MARGIN_X +
        columnWidth *
          index +
        columnWidth / 2;

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      doc.setFontSize(11);

      doc.text(
        `ลงชื่อ ${dotLine}`,
        centerX,
        startY,
        {
          align: "center",
        }
      );

      doc.setFontSize(11);

      const nameLines =
        doc.splitTextToSize(
          `(${inspectorName})`,
          columnWidth - 5
        );

      doc.text(
        nameLines,
        centerX,
        startY + 5,
        {
          align: "center",
        }
      );

      const positionLines =
        doc.splitTextToSize(
          inspectorPosition,
          columnWidth - 5
        );

      doc.text(
        positionLines,
        centerX,
        startY + 10,
        {
          align: "center",
        }
      );
    }
  }

  /* =======================================================
     EXPORT PDF
     ======================================================= */

  async function handleExportPdf() {
    if (
      assets.length === 0
    ) {
      alert(
        "ไม่พบรายการครุภัณฑ์สำหรับสร้าง PDF"
      );

      return;
    }

    const previewWindow =
      window.open(
        "",
        "_blank"
      );

    if (!previewWindow) {
      alert(
        "ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"
      );

      return;
    }

    try {
      previewWindow.document.open();

      previewWindow.document.write(`
        <!DOCTYPE html>

        <html lang="th">
          <head>
            <meta charset="UTF-8" />

            <title>
              กำลังสร้าง PDF...
            </title>

            <style>
              html,
              body {
                width: 100%;
                height: 100%;
                margin: 0;
              }

              body {
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                color: #0f172a;
                font-family:
                  Arial,
                  sans-serif;
              }

              .loading {
                font-size: 18px;
                font-weight: 700;
              }
            </style>
          </head>

          <body>
            <div class="loading">
              กำลังสร้าง PDF...
            </div>
          </body>
        </html>
      `);

      previewWindow.document.close();
    } catch {
      // ไม่กระทบการสร้าง PDF
    }

    try {
      setIsExporting(true);

      const doc =
        new jsPDF({
          orientation:
            "landscape",

          unit: "mm",

          format: "a4",

          compress: true,
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      // คงขนาดฟอนต์เดิม และวัดความสูงข้อความแยกเป็นรายหน้า
      // เพื่อไม่ให้หน้าที่มีข้อความสั้นถูกขยายตามหน้าที่มีข้อความยาว
      doc.setFont("2.3.2 THSarabunNew", "normal");
      doc.setFontSize(FIXED_FONT_SIZE);
      const measuredWidths = getAdjustedColumnWidths(doc, assets, department);
      const rowMap = new Map(rows.map(row => [row.assetId, row]));
      const rowsPerPage = MAX_ROWS_PER_PAGE; // ไม่เกิน 3 รายการต่อแผ่น

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            assets.length /
              rowsPerPage
          )
        );

      for (
        let pageIndex = 0;
        pageIndex <
        totalPages;
        pageIndex++
      ) {
        if (
          pageIndex > 0
        ) {
          doc.addPage(
            "a4",
            "landscape"
          );
        }

        drawDocumentHeader(
          doc, pageIndex + 1, totalPages
        );

        const startIndex =
          pageIndex *
          rowsPerPage;

        const pageAssets =
          assets.slice(
            startIndex,
            startIndex +
              rowsPerPage
          );

        // คำนวณความสูงแถวจากข้อความของ 3 รายการในแผ่นนี้จริง ๆ
        // ไม่ลดขนาดตัวอักษรและไม่ตัดข้อความทิ้ง
        const maxLineCount = Math.max(1, ...pageAssets.map(asset => {
          const row = rowMap.get(asset.id);
          const texts = [
            String(getSourceOrder(asset.remark) ?? ""),
            asset.governmentAssetNo ?? "", asset.officeAssetNo ?? "",
            department.name, getResponsibleName(asset, department),
            getDisplayCategory(asset), asset.name,
            [asset.brand, asset.model].filter(Boolean).join(" / "),
            asset.unit?.trim() || getCategoryUnit(asset.category),
            String(asset.quantity ?? 1), "", "", String(asset.quantity ?? 1),
            row?.countedQty ?? "", "", "", "", "", "", "",
          ];
          return Math.max(...texts.map((text, index) =>
            wrapCellText(doc, String(text ?? ""), measuredWidths[index]).length
          ));
        }));
        const rowHeight = Math.max(9, maxLineCount * 3.65 + 2);

        const body =
          pageAssets.map(
            (
              asset,
              localIndex
            ) => {
              const actualIndex =
                startIndex +
                localIndex;

              const sourceOrder =
                getSourceOrder(
                  asset.remark
                );

              const displayOrder =
                sourceOrder ??
                actualIndex + 1;

              const row =
                rows.find(
                  (item) =>
                    item.assetId ===
                    asset.id
                ) || {
                  assetId:
                    asset.id,

                  countedQty:
                    "",

                  accuracy: "",

                  status: "",

                  remark: "",
                };

              const responsibleName =
                getResponsibleName(
                  asset,
                  department
                );

              const assetName = asset.name || "";
              const officerName = asset.officer
                ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
                : "";
              const brandModel = [asset.brand, asset.model].filter(Boolean).join(" / ");

              return [
                String(
                  displayOrder
                ),

                asset.governmentAssetNo?.trim()
                  ? asset.governmentAssetNo
                  : "",

                asset.officeAssetNo?.trim()
                  ? asset.officeAssetNo
                  : "",

                department.name,
                responsibleName,
                getDisplayCategory(asset),
                assetName,
                brandModel,

                asset.unit?.trim() || getCategoryUnit(
                  asset.category
                ),

                String(asset.quantity ?? 1),

                "",

                "",

                String(asset.quantity ?? 1),

                (row.countedQty.trim() === "" || Number(row.countedQty) === 0) ? "" : row.countedQty,

                getAccuracyChecked(
                  row,
                  "CORRECT"
                ),

                getAccuracyChecked(
                  row,
                  "INCORRECT"
                ),

                getStatusChecked(
                  row,
                  "IN_USE"
                ),

                getStatusChecked(
                  row,
                  "DAMAGED"
                ),

                getStatusChecked(
                  row,
                  "DETERIORATED"
                ),

                getStatusChecked(
                  row,
                  "UNUSABLE"
                ),
              ];
            }
          );

        while (
          body.length <
          rowsPerPage
        ) {
          body.push(
            Array(20).fill(
              ""
            )
          );
        }

        const fiscalYear = Number(movementFiscalYear);
        const headerStartDate = Number.isInteger(fiscalYear)
          ? `${fiscalYear - 544}-10-01`
          : accountStartDate;
        const headerEndDate = Number.isInteger(fiscalYear)
          ? `${fiscalYear - 543}-09-30`
          : accountEndDate;

        const accountStartHeaderLines = [
          "ยอดคงเหลือตามบัญชี",
          `ณ วันที่ ${formatThaiShortDate(
            headerStartDate
          )}`,
        ];

        const movementHeaderLines = [
          "รายการเคลื่อนไหวระหว่าง",
          `ปีงบประมาณ พ.ศ. ${movementFiscalYear}`,
        ];

        const accountEndHeaderLines = [
          "ยอดคงเหลือตามบัญชี",
          `ณ วันที่ ${formatThaiShortDate(
            headerEndDate
          )}`,
        ];

        // หัวตารางจัดบรรทัดเป็นวลีแบบ Excel ไม่แยกคำกลางคำ
        // และปรับขนาดตัวอักษรตามความกว้างคอลัมน์เฉพาะหัวตาราง
        const headerCellLines: Record<number, string[]> = {
          0: ["ลำดับ"],
          1: ["รหัส GFMIS"],
          2: ["รหัสครุภัณฑ์"],
          3: ["สถานที่ใช้งาน"],
          4: ["ผู้รับผิดชอบ"],
          5: ["หมวด/ชนิด"],
          6: ["ชื่อเรียก/คุณลักษณะ", "ครุภัณฑ์"],
          7: ["ยี่ห้อ/รุ่น"],
          8: ["หน่วยนับ"],
          9: accountStartHeaderLines,
          10: movementHeaderLines,
          12: accountEndHeaderLines,
          13: ["จำนวนที่", "ตรวจนับได้"],
          14: ["ผลการตรวจนับถูกต้อง", "ตรงกับยอดคงเหลือตามบัญชี"],
          16: ["สภาพครุภัณฑ์ที่ตรวจนับ"],
        };

        autoTable(doc, {
          startY:
            TABLE_START_Y,

          margin: {
            left:
              MARGIN_X,

            right:
              MARGIN_X,
          },

          tableWidth:
            TABLE_WIDTH,

          theme: "grid",

          head: [
            [
              { content: "ลำดับ", rowSpan: 2 },
              { content: "รหัส GFMIS", rowSpan: 2 },
              { content: "รหัสครุภัณฑ์", rowSpan: 2 },
              { content: "สถานที่ใช้งาน", rowSpan: 2 },
              { content: "ผู้รับผิดชอบ", rowSpan: 2 },
              { content: "หมวด/ชนิด", rowSpan: 2 },
              { content: "ชื่อเรียก/คุณลักษณะครุภัณฑ์", rowSpan: 2 },
              { content: "ยี่ห้อ/รุ่น", rowSpan: 2 },
              { content: "หน่วยนับ", rowSpan: 2 },
              { content: accountStartHeaderLines.join("\n"), rowSpan: 2 },
              { content: movementHeaderLines.join("\n"), colSpan: 2 },
              { content: accountEndHeaderLines.join("\n"), rowSpan: 2 },
              { content: "จำนวนที่ตรวจนับได้", rowSpan: 2 },
              { content: "ผลการตรวจนับถูกต้อง\nตรงกับยอดคงเหลือตามบัญชี", colSpan: 2 },
              { content: "สภาพครุภัณฑ์ที่ตรวจนับ", colSpan: 4 },
            ],
            ["รับ", "จ่าย", "ถูกต้อง", "ไม่ถูกต้อง", "ใช้งานปกติ", "ชำรุด", "เสื่อมสภาพ", "ไม่จำเป็นต้องใช้"],
          ],

          body,
          pageBreak: "avoid",
          styles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: FIXED_FONT_SIZE,

            textColor: [
              0,
              0,
              0,
            ],

            lineColor: [
              0,
              0,
              0,
            ],

            lineWidth:
              0.25,

            cellPadding:
              0.6,

            minCellHeight:
              rowHeight,

            halign:
              "center",

            valign:
              "middle",

            overflow:
              "linebreak",
          },

          headStyles: {
            minCellHeight: 0,
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: FIXED_FONT_SIZE,

            fillColor: [
              255,
              255,
              255,
            ],

            textColor: [
              0,
              0,
              0,
            ],

            lineColor: [
              0,
              0,
              0,
            ],

            lineWidth:
              0.25,

            cellPadding:
              0.35,

            halign:
              "center",

            valign:
              "middle",

            overflow:
              "linebreak",
          },

          bodyStyles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: FIXED_FONT_SIZE,

            textColor: [
              0,
              0,
              0,
            ],

            lineColor: [
              0,
              0,
              0,
            ],

            lineWidth:
              0.25,

            cellPadding:
              0.6,

            minCellHeight:
              rowHeight,

            halign:
              "center",

            valign:
              "middle",
          },

          didParseCell: (data) => {
            if (data.section === "head") {
              const index = data.column.index;
              const lines = data.row.index === 0
                ? headerCellLines[index]
                : undefined;
              if (lines) {
                data.cell.text = lines;
              } else if (data.row.index === 1) {
                // คำหัวตารางชั้นล่างอยู่ในบรรทัดเดียว
                data.cell.text = [String(data.cell.raw ?? "")];
              }

                             data.cell.styles.fontSize = FIXED_FONT_SIZE;
               data.cell.styles.cellPadding = 0.35;
               data.cell.styles.minCellHeight = data.row.index === 0 ? 10 : 7;
               data.cell.styles.overflow = "linebreak";
            }
            if (data.section === "body") {
              data.cell.styles.minCellHeight = rowHeight;
              if (data.column.index === 6) {
                data.cell.styles.halign = "center";
                data.cell.styles.valign = "middle";
              }
              if (data.column.index >= 14 && data.column.index <= 19) {
                data.cell.text = [""];
              } else {
                const raw = String(data.cell.raw ?? "");
                data.cell.text = wrapCellText(doc, raw, measuredWidths[data.column.index]);
                data.cell.styles.overflow = "linebreak";
              }
            }
          },
          // Uniform 8.5pt font throughout: wrap long text rather than shrinking it.
          columnStyles: {
            0: { cellWidth: measuredWidths[0] },
            1: { cellWidth: measuredWidths[1] },
            2: { cellWidth: measuredWidths[2] },
            3: { cellWidth: measuredWidths[3] },
            4: { cellWidth: measuredWidths[4] },
            5: { cellWidth: measuredWidths[5] },
            6: { cellWidth: measuredWidths[6], halign: "center", valign: "middle" },
            7: { cellWidth: measuredWidths[7] },
            8: { cellWidth: measuredWidths[8] },
            9: { cellWidth: measuredWidths[9] },
            10: { cellWidth: measuredWidths[10] },
            11: { cellWidth: measuredWidths[11] },
            12: { cellWidth: measuredWidths[12] },
            13: { cellWidth: measuredWidths[13] },
            14: { cellWidth: measuredWidths[14] },
            15: { cellWidth: measuredWidths[15] },
            16: { cellWidth: measuredWidths[16] },
            17: { cellWidth: measuredWidths[17] },
            18: { cellWidth: measuredWidths[18] },
            19: { cellWidth: measuredWidths[19] },
          },


          /* =================================================
             วาดเครื่องหมายถูกตามค่าที่เลือกและบันทึกไว้

             accuracy:
             - CORRECT      -> คอลัมน์ 11
             - INCORRECT    -> คอลัมน์ 12

             status:
             - IN_USE       -> คอลัมน์ 13
             - DAMAGED      -> คอลัมน์ 14
             - DETERIORATED -> คอลัมน์ 15
             - UNUSABLE     -> คอลัมน์ 16

             body ถูกสร้างจาก rows ที่ส่งเข้ามา
             จึงแสดงค่าที่เลือกไว้ทั้งก่อนบันทึก
             และเมื่อเปิดข้อมูลที่บันทึกไว้กลับมา
             ================================================= */

          didDrawCell: (
            data
          ) => {
            if (
              data.section !==
                "body" ||
              data.column.index <
                14 ||
              data.column.index >
                19
            ) {
              return;
            }

            const isChecked =
              String(
                data.cell.raw ??
                  ""
              ).trim() ===
              "✓";

            if (!isChecked) {
              return;
            }

            const centerX =
              data.cell.x +
              data.cell.width / 2;

            const centerY =
              data.cell.y +
              data.cell.height / 2;

            doc.setDrawColor(
              0,
              0,
              0
            );

            doc.setLineWidth(
              0.65
            );

            doc.line(
              centerX - 1.8,
              centerY,
              centerX - 0.4,
              centerY + 1.4
            );

            doc.line(
              centerX - 0.4,
              centerY + 1.4,
              centerX + 2.2,
              centerY - 1.6
            );
          },

          tableLineColor: [
            0,
            0,
            0,
          ],

          tableLineWidth:
            0.25,

          rowPageBreak:
            "avoid",

          showHead:
            "everyPage",
        });

        const lastAutoTable =
          (
            doc as jsPDF & {
              lastAutoTable?: {
                finalY: number;
              };
            }
          ).lastAutoTable;

        const tableFinalY =
          lastAutoTable
            ?.finalY ??
          TABLE_START_Y;

        const signatureStartY =
          Math.max(
            tableFinalY +
              SIGNATURE_GAP,

            SIGNATURE_MIN_START_Y
          );

        drawInspectors(
          doc,
          signatureStartY
        );
      }

      /* ===================================================
         เปิด PDF
         =================================================== */

      const safeDepartmentName =
        department.name
          .replace(
            /[\/:*?"<>|]/g,
            "_"
          )
          .trim();

      const fileName =
        `กระดาษทำการตรวจสอบพัสดุ_${safeDepartmentName}_พ.ศ.${movementFiscalYear}.pdf`;

      const pdfBlob =
        doc.output(
          "blob"
        );

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

      try {
        previewWindow.document.title =
          fileName;
      } catch {
        // ไม่ต้องทำอะไร
      }

      previewWindow.location.replace(
        pdfUrl
      );

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            pdfUrl
          );
        },
        5 * 60 * 1000
      );
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      if (
        previewWindow &&
        !previewWindow.closed
      ) {
        previewWindow.close();
      }

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsExporting(
        false
      );
    }
  }

  /* =========================================================
     BUTTON
     ========================================================= */

  return (
    <AppButton
      type="button"
      variant="danger"
      size="md"
      onClick={
        handleExportPdf
      }
      disabled={
        isExporting ||
        assets.length === 0
      }
      icon={
        <span
          aria-hidden="true"
        >
          📄
        </span>
      }
    >
      {isExporting
        ? "กำลังสร้าง PDF..."
        : "ส่งออก PDF"}
    </AppButton>
  );
}
