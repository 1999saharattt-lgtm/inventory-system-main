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

const MAX_ROWS_PER_PAGE = 9;
const FIXED_FONT_SIZE = 8.5;
const MAX_BODY_HEIGHT = 115;


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
  responsible: 18, category: 14, item: 26, brandModel: 16,
  unit: 9, accountStart: 15, receive: 8, issue: 8,
  accountEnd: 15, counted: 12, correct: 9, incorrect: 11,
  inUse: 10, damaged: 9, deteriorated: 11, unusable: 13,
  remark: 15,
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
  department: Department
) {
  const departmentName =
    department.name?.trim() ||
    "";

  const originalResponsibleName =
    asset.responsibleName?.trim();

  /* =======================================================
     responsibleName จากทะเบียนเดิมเป็นหลัก
     ======================================================= */

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    if (
      departmentName &&
      (
        originalResponsibleName ===
          departmentName ||
        originalResponsibleName.startsWith(
          `${departmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    if (
      departmentName
    ) {
      return `${departmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  /* =======================================================
     fallback เป็น section
     ======================================================= */

  const sectionName =
    asset.section?.name?.trim() ||
    "";

  if (sectionName) {
    if (
      departmentName &&
      (
        sectionName ===
          departmentName ||
        sectionName.startsWith(
          `${departmentName} /`
        )
      )
    ) {
      return sectionName;
    }

    if (
      departmentName
    ) {
      return `${departmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  /* =======================================================
     fallback เป็น officer
     ======================================================= */

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    if (
      departmentName
    ) {
      return `${departmentName} / ${officerName}`;
    }

    return officerName;
  }

  /* =======================================================
     fallback สุดท้าย
     ======================================================= */

  if (departmentName) {
    return departmentName;
  }

  return "-";
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
  if (explicit) return explicit;
  const fromRemark = asset.remark?.match(/(?:^|\n)หมวด\/ชนิด:\s*([^\n]+)/)?.[1]?.trim();
  if (fromRemark) return fromRemark;
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
function wrapCellText(doc: jsPDF, value: string, width: number): string[] {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [""];
  const phrases = text.replace(/,\s*/g, ",\n").replace(/\s+\/\s+/g, " /\n");
  return phrases.split("\n").flatMap(part =>
    doc.splitTextToSize(part, Math.max(1, width - 1.2)) as string[]
  );
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

    doc.setFontSize(12);
    doc.text(`แผ่นที่ ${pageNumber}`, PAGE_WIDTH - MARGIN_X, 9, { align: "right" });

    doc.setFontSize(18);

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${movementFiscalYear}`,
      center,
      12,
      {
        align: "center",
      }
    );

    doc.setFontSize(18);

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

      // ใช้ความสูงแถวเดียวกันทั้งเอกสาร คำนวณจากข้อความที่ยาวที่สุด
      // เพื่อให้ทุกหน้ามีขนาดตารางเท่ากันโดยไม่ลดขนาดตัวอักษร
      doc.setFont("2.3.2 THSarabunNew", "normal");
      doc.setFontSize(FIXED_FONT_SIZE);
      const measuredWidths = [
        COLUMN_WIDTHS.order, COLUMN_WIDTHS.gfmis, COLUMN_WIDTHS.assetNo,
        COLUMN_WIDTHS.location, COLUMN_WIDTHS.responsible, COLUMN_WIDTHS.category,
        COLUMN_WIDTHS.item, COLUMN_WIDTHS.brandModel, COLUMN_WIDTHS.unit,
        COLUMN_WIDTHS.accountStart, COLUMN_WIDTHS.receive, COLUMN_WIDTHS.issue,
        COLUMN_WIDTHS.accountEnd, COLUMN_WIDTHS.counted, COLUMN_WIDTHS.correct,
        COLUMN_WIDTHS.incorrect, COLUMN_WIDTHS.inUse, COLUMN_WIDTHS.damaged,
        COLUMN_WIDTHS.deteriorated, COLUMN_WIDTHS.unusable, COLUMN_WIDTHS.remark,
      ];
      const rowMap = new Map(rows.map(row => [row.assetId, row]));
      const maxLineCount = Math.max(1, ...assets.map(asset => {
        const responsible = getResponsibleName(asset, department);
        const officer = asset.officer
          ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim() : "-";
        const texts = [
          String(getSourceOrder(asset.remark) ?? ""),
          asset.governmentAssetNo ?? "-", asset.officeAssetNo ?? "-",
          responsible, officer, getDisplayCategory(asset), asset.name,
          [asset.brand, asset.model].filter(Boolean).join(" / ") || "-",
          asset.unit?.trim() || getCategoryUnit(asset.category),
          String(asset.quantity ?? 1), "-", "-", String(asset.quantity ?? 1),
          rowMap.get(asset.id)?.countedQty ?? "1", "", "", "", "", "", "",
          rowMap.get(asset.id)?.remark ?? "",
        ];
        return Math.max(...texts.map((t, i) => wrapCellText(doc, t, measuredWidths[i]).length));
      }));
      const rowHeight = Math.max(9, maxLineCount * 3.65 + 1.2);
      const rowsPerPage = Math.max(1, Math.min(MAX_ROWS_PER_PAGE,
        Math.floor(MAX_BODY_HEIGHT / rowHeight)));

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
                    "1",

                  accuracy: "",

                  status: "",

                  remark: "",
                };

              const responsibleName =
                getResponsibleName(
                  asset,
                  department
                );

              const assetName = asset.name || "-";
              const officerName = asset.officer
                ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
                : "-";
              const brandModel = [asset.brand, asset.model].filter(Boolean).join(" / ") || "-";

              return [
                String(
                  displayOrder
                ),

                asset.governmentAssetNo?.trim()
                  ? asset.governmentAssetNo
                  : "-",

                asset.officeAssetNo?.trim()
                  ? asset.officeAssetNo
                  : "-",

                responsibleName,
                officerName,
                getDisplayCategory(asset),
                assetName,
                brandModel,

                asset.unit?.trim() || getCategoryUnit(
                  asset.category
                ),

                String(asset.quantity ?? 1),

                "-",

                "-",

                String(asset.quantity ?? 1),

                row.countedQty,

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

                row.remark || "",
              ];
            }
          );

        while (
          body.length <
          rowsPerPage
        ) {
          body.push(
            Array(21).fill(
              ""
            )
          );
        }

        const accountStartHeaderLines = [
          "ยอดคงเหลือตามบัญชี",
          `ณ วันที่ ${formatThaiDate(
            accountStartDate
          )}`,
        ];

        const movementHeaderLines = [
          "รายการเคลื่อนไหวระหว่าง",
          `ปีงบประมาณ พ.ศ. ${movementFiscalYear}`,
        ];

        const accountEndHeaderLines = [
          "ยอดคงเหลือตามบัญชี",
          `ณ วันที่ ${formatThaiDate(
            accountEndDate
          )}`,
        ];

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
              { content: "หมายเหตุ", rowSpan: 2 },
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

            fontSize: 8.5,

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
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: 8.5,

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
              0.45,

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

            fontSize: 8.5,

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
            if (data.section === "body") {
              data.cell.styles.minCellHeight = rowHeight;
              if (data.column.index >= 14 && data.column.index <= 19) {
                data.cell.text = [""];
              } else {
                const raw = String(data.cell.raw ?? "");
                data.cell.text = wrapCellText(doc, raw, measuredWidths[data.column.index]);
              }
            }
          },
          // Uniform 8.5pt font throughout: wrap long text rather than shrinking it.
          columnStyles: {
            0: { cellWidth: COLUMN_WIDTHS.order },
            1: { cellWidth: COLUMN_WIDTHS.gfmis },
            2: { cellWidth: COLUMN_WIDTHS.assetNo },
            3: { cellWidth: COLUMN_WIDTHS.location },
            4: { cellWidth: COLUMN_WIDTHS.responsible },
            5: { cellWidth: COLUMN_WIDTHS.category },
            6: { cellWidth: COLUMN_WIDTHS.item, halign: "left" },
            7: { cellWidth: COLUMN_WIDTHS.brandModel },
            8: { cellWidth: COLUMN_WIDTHS.unit },
            9: { cellWidth: COLUMN_WIDTHS.accountStart },
            10: { cellWidth: COLUMN_WIDTHS.receive },
            11: { cellWidth: COLUMN_WIDTHS.issue },
            12: { cellWidth: COLUMN_WIDTHS.accountEnd },
            13: { cellWidth: COLUMN_WIDTHS.counted },
            14: { cellWidth: COLUMN_WIDTHS.correct },
            15: { cellWidth: COLUMN_WIDTHS.incorrect },
            16: { cellWidth: COLUMN_WIDTHS.inUse },
            17: { cellWidth: COLUMN_WIDTHS.damaged },
            18: { cellWidth: COLUMN_WIDTHS.deteriorated },
            19: { cellWidth: COLUMN_WIDTHS.unusable },
            20: { cellWidth: COLUMN_WIDTHS.remark },
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
