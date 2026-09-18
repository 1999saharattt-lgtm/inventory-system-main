"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Department = {
  id: number;
  name: string;
};

type Asset = {
  id: number;
  name: string;
  category: string;
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

const ROWS_PER_PAGE = 15;

const INSPECTION_FISCAL_YEAR =
  "2569";

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
   COLUMN WIDTH
   ========================================================= */

/*
 * ลดคอลัมน์ "รายการ" จาก 38 mm เหลือ 28 mm
 * แล้วนำพื้นที่ไปเพิ่มให้ 3 ส่วนหัวที่มีข้อความยาว:
 *
 * - ยอดคงเหลือตามบัญชี ณ วันที่...
 * - รายการเคลื่อนไหวระหว่าง ปีงบประมาณ...
 * - ยอดคงเหลือตามบัญชี ณ วันที่...
 *
 * รวมทุกคอลัมน์ยังเท่ากับ TABLE_WIDTH = 285 mm
 */
const COLUMN_WIDTHS = {
  order: 6.5,
  gfmis: 18,
  assetNo: 22.5,
  responsible: 34,
  item: 28,
  unit: 9.5,
  accountStart: 22.5,
  receive: 12,
  issue: 12,
  accountEnd: 22.5,
  counted: 15.5,
  correct: 11.5,
  incorrect: 11.5,
  inUse: 10,
  damaged: 9.5,
  deteriorated: 10.5,
  unusable: 13,
  remark: 16,
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
    doc: jsPDF
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

    doc.setFontSize(18);

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${INSPECTION_FISCAL_YEAR}`,
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

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            assets.length /
              ROWS_PER_PAGE
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
          doc
        );

        const startIndex =
          pageIndex *
          ROWS_PER_PAGE;

        const pageAssets =
          assets.slice(
            startIndex,
            startIndex +
              ROWS_PER_PAGE
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

              const assetName =
                [
                  asset.name,
                  asset.brand,
                  asset.model,
                ]
                  .filter(Boolean)
                  .join(" ");

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

                assetName,

                getCategoryUnit(
                  asset.category
                ),

                "1",

                "-",

                "-",

                "1",

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
          ROWS_PER_PAGE
        ) {
          body.push(
            Array(18).fill(
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
              {
                content:
                  "ลำดับ",
                rowSpan: 2,
              },

              {
                content:
                  "รหัส GFMIS",
                rowSpan: 2,
              },

              {
                content:
                  "รหัสครุภัณฑ์",
                rowSpan: 2,
              },

              {
                content:
                  "ผู้รับผิดชอบ",
                rowSpan: 2,
              },

              {
                content:
                  "รายการ",
                rowSpan: 2,
              },

              {
                content:
                  "หน่วย",
                rowSpan: 2,
              },

              {
                content:
                  accountStartHeaderLines.join(
                    "\n"
                  ),

                rowSpan: 2,
              },

              {
                content:
                  movementHeaderLines.join(
                    "\n"
                  ),

                colSpan: 2,
              },

              {
                content:
                  accountEndHeaderLines.join(
                    "\n"
                  ),

                rowSpan: 2,
              },

              {
                content:
                  "จำนวนที่ตรวจนับได้",

                rowSpan: 2,
              },

              {
                content:
                  "ผลการตรวจนับถูกต้อง\nตรงกับยอดคงเหลือตามบัญชี",

                colSpan: 2,
              },

              {
                content:
                  "สภาพครุภัณฑ์ที่ตรวจนับ",

                colSpan: 4,
              },

              {
                content:
                  "หมายเหตุ",

                rowSpan: 2,
              },
            ],

            [
              "รับ",
              "จ่าย",

              "ถูกต้อง",
              "ไม่ถูกต้อง",

              "ใช้งานปกติ",
              "ชำรุด",
              "เสื่อมสภาพ",
              "ไม่จำเป็นต้องใช้",
            ],
          ],

          body,

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
              7.1,

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

            fontSize: 8,

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
              7.1,

            halign:
              "center",

            valign:
              "middle",
          },

          /* =================================================
             COLUMN WIDTH

             รวม = 285 mm

             รายการ:
             38 → 28 mm

             พื้นที่ที่ลดลงถูกเพิ่มให้:
             - ยอดคงเหลือต้นงวด
             - รับ / จ่าย
             - ยอดคงเหลือปลายงวด

             และรอบนี้:
             - เพิ่มช่อง "จำนวนที่ตรวจนับได้" จาก 13.5 → 15.5 mm
             - ลดกลุ่ม "ผลการตรวจนับถูกต้อง..." ลงรวม 2 mm
             ================================================= */

          columnStyles: {
            0: {
              cellWidth:
                COLUMN_WIDTHS.order,

              halign:
                "center",

              valign:
                "middle",
            },

            1: {
              cellWidth:
                COLUMN_WIDTHS.gfmis,

              halign:
                "center",

              valign:
                "middle",
            },

            2: {
              cellWidth:
                COLUMN_WIDTHS.assetNo,

              halign:
                "center",

              valign:
                "middle",
            },

            3: {
              cellWidth:
                COLUMN_WIDTHS.responsible,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "hidden",

              cellPadding:
                0.25,
            },

            4: {
              cellWidth:
                COLUMN_WIDTHS.item,

              halign:
                "left",

              valign:
                "middle",

              overflow:
                "hidden",

              cellPadding:
                0.3,
            },

            5: {
              cellWidth:
                COLUMN_WIDTHS.unit,

              halign:
                "center",

              valign:
                "middle",
            },

            6: {
              cellWidth:
                COLUMN_WIDTHS.accountStart,
            },

            7: {
              cellWidth:
                COLUMN_WIDTHS.receive,
            },

            8: {
              cellWidth:
                COLUMN_WIDTHS.issue,
            },

            9: {
              cellWidth:
                COLUMN_WIDTHS.accountEnd,
            },

            10: {
              cellWidth:
                COLUMN_WIDTHS.counted,
            },

            11: {
              cellWidth:
                COLUMN_WIDTHS.correct,
            },

            12: {
              cellWidth:
                COLUMN_WIDTHS.incorrect,
            },

            13: {
              cellWidth:
                COLUMN_WIDTHS.inUse,
            },

            14: {
              cellWidth:
                COLUMN_WIDTHS.damaged,
            },

            15: {
              cellWidth:
                COLUMN_WIDTHS.deteriorated,
            },

            16: {
              cellWidth:
                COLUMN_WIDTHS.unusable,
            },

            17: {
              cellWidth:
                COLUMN_WIDTHS.remark,
            },
          },

          didParseCell: (
            data
          ) => {
            /* =============================================
               หัวตาราง 3 ส่วนที่ต้องการพื้นที่มากขึ้น

               บังคับให้คงเพียง 2 บรรทัดตามที่กำหนด
               และลด font เฉพาะเมื่อจำเป็น
               ============================================= */

            if (
              data.section ===
                "head" &&
              data.row.index ===
                0 &&
              data.column.index ===
                6
            ) {
              data.cell.text =
                accountStartHeaderLines;

              data.cell.styles.fontSize =
                getMultiLineFontSize(
                  doc,
                  accountStartHeaderLines,
                  COLUMN_WIDTHS.accountStart,
                  8,
                  5.5,
                  0.9
                );

              data.cell.styles.cellPadding =
                0.25;

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }

            if (
              data.section ===
                "head" &&
              data.row.index ===
                0 &&
              data.column.index ===
                7
            ) {
              const movementWidth =
                COLUMN_WIDTHS.receive +
                COLUMN_WIDTHS.issue;

              data.cell.text =
                movementHeaderLines;

              data.cell.styles.fontSize =
                getMultiLineFontSize(
                  doc,
                  movementHeaderLines,
                  movementWidth,
                  8,
                  5.5,
                  0.9
                );

              data.cell.styles.cellPadding =
                0.25;

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }

            if (
              data.section ===
                "head" &&
              data.row.index ===
                0 &&
              data.column.index ===
                9
            ) {
              data.cell.text =
                accountEndHeaderLines;

              data.cell.styles.fontSize =
                getMultiLineFontSize(
                  doc,
                  accountEndHeaderLines,
                  COLUMN_WIDTHS.accountEnd,
                  8,
                  5.5,
                  0.9
                );

              data.cell.styles.cellPadding =
                0.25;

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }

            /* =============================================
               จำนวนที่ตรวจนับได้

               บังคับให้อยู่บรรทัดเดียว
               และลดขนาดตัวอักษรอัตโนมัติให้พอดีกับช่อง
               ============================================= */

            if (
              data.section ===
                "head" &&
              data.row.index ===
                0 &&
              data.column.index ===
                10
            ) {
              const countedHeaderText =
                "จำนวนที่ตรวจนับได้";

              data.cell.text =
                [
                  countedHeaderText,
                ];

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  countedHeaderText,
                  COLUMN_WIDTHS.counted,
                  8,
                  4.5,
                  0.6
                );

              data.cell.styles.cellPadding =
                0.2;

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.overflow =
                "hidden";
            }

            /* =============================================
               GFMIS
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                1
            ) {
              const text =
                String(
                  data.cell.raw ??
                    ""
                )
                  .replace(
                    /\s+/g,
                    " "
                  )
                  .trim();

              data.cell.text =
                [text];

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  COLUMN_WIDTHS.gfmis,
                  8.5,
                  5,
                  0.8
                );
            }

            /* =============================================
               รหัสครุภัณฑ์
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                2
            ) {
              const text =
                String(
                  data.cell.raw ??
                    ""
                )
                  .replace(
                    /\s+/g,
                    " "
                  )
                  .trim();

              data.cell.text =
                [text];

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  COLUMN_WIDTHS.assetNo,
                  8.5,
                  5,
                  0.8
                );
            }

            /* =============================================
               ผู้รับผิดชอบ
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                3
            ) {
              const text =
                String(
                  data.cell.raw ??
                    ""
                )
                  .replace(
                    /\s+/g,
                    " "
                  )
                  .trim();

              data.cell.text =
                [text];

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.cellPadding =
                0.25;

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  COLUMN_WIDTHS.responsible,
                  8.5,
                  4.5,
                  0.8
                );
            }

            /* =============================================
               รายการครุภัณฑ์

               ลดความกว้างเหลือ 28 mm
               แต่ยังคงเป็นบรรทัดเดียว
               และลด font ตามความยาวจริง
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                4
            ) {
              const text =
                String(
                  data.cell.raw ??
                    ""
                )
                  .replace(
                    /\s+/g,
                    " "
                  )
                  .trim();

              data.cell.text =
                [text];

              data.cell.styles.halign =
                "left";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.cellPadding =
                0.3;

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  COLUMN_WIDTHS.item,
                  8.5,
                  4,
                  0.8
                );
            }

            /* =============================================
               หมายเหตุ
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                17
            ) {
              const text =
                String(
                  data.cell.raw ??
                    ""
                )
                  .replace(
                    /\s+/g,
                    " "
                  )
                  .trim();

              data.cell.text =
                [text];

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  COLUMN_WIDTHS.remark,
                  8.5,
                  4.5,
                  0.8
                );
            }

            /* =============================================
               เครื่องหมาย ✓
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index >=
                11 &&
              data.column.index <=
                16
            ) {
              data.cell.styles.fontSize =
                11;

              data.cell.styles.fontStyle =
                "normal";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }
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
        `กระดาษทำการตรวจสอบพัสดุ_${safeDepartmentName}_พ.ศ.${INSPECTION_FISCAL_YEAR}.pdf`;

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
    <button
      type="button"
      onClick={
        handleExportPdf
      }
      disabled={
        isExporting ||
        assets.length === 0
      }
      className="
        rounded-xl
        bg-gradient-to-r
        from-red-700
        to-red-500
        px-5
        py-2.5
        text-base
        font-extrabold
        !text-white
        shadow-lg
        transition
        hover:scale-105
        hover:from-red-800
        hover:to-red-600
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:hover:scale-100
      "
    >
      {isExporting
        ? "กำลังสร้าง PDF..."
        : "📄 ส่งออก PDF"}
    </button>
  );
}
