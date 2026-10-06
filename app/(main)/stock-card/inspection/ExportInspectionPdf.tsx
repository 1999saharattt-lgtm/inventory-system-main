"use client";

import "@/lib/fonts/THSarabunNew-normal";

import {
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type MaterialRow = {
  materialId: number;

  code: string;

  name: string;

  unit: string;

  category: string;

  openingBalance: number;

  receiveQty: number;

  issueQty: number;

  closingBalance: number;
};

type InspectionRow = {
  materialId: number;

  accuracy:
    | ""
    | "CORRECT"
    | "INCORRECT";

  shortageQty: string;

  excessQty: string;

  baht: string;

  satang: string;

  damagedQty: string;

  deterioratedQty: string;

  unnecessaryQty: string;

  remark: string;
};

type Officer = {
  id: number;

  firstName: string;

  lastName: string;

  position:
    | string
    | null;

  type: string;

  departmentId:
    | number
    | null;

  sectionId:
    | number
    | null;

  department: {
    id: number;
    name: string;
  } | null;

  section: {
    id: number;
    name: string;
  } | null;
};

type Props = {
  fiscalYear: number;

  startShortYear: string;

  endShortYear: string;

  materials:
    MaterialRow[];

  rows:
    InspectionRow[];

  inspectorIds:
    string[];

  officers:
    Officer[];
};

/* =========================================================
   PDF PAGE
========================================================= */

const PAGE_WIDTH =
  297;

const TABLE_WIDTH =
  285;

const MARGIN_X =
  (
    PAGE_WIDTH -
    TABLE_WIDTH
  ) /
  2;

const TABLE_START_Y =
  35;

const SIGNATURE_GAP =
  10;

const SIGNATURE_MIN_START_Y =
  166;

/*
 * แสดงข้อมูล 15 รายการต่อหน้า
 */
const ROWS_PER_PAGE =
  15;

/* =========================================================
   COLUMN WIDTHS
========================================================= */

const COLUMN_WIDTHS = {
  order:
    7,

  item:
    48,

  unit:
    12,

  opening:
    25,

  receive:
    14,

  issue:
    14,

  closing:
    18,

  correct:
    12,

  incorrect:
    15,

  shortage:
    12,

  excess:
    12,

  baht:
    12,

  satang:
    10,

  damaged:
    14,

  deteriorated:
    15,

  unnecessary:
    20,

  remark:
    25,
} as const;

/* =========================================================
   NUMBER
========================================================= */

function formatNumber(
  value:
    number | string
) {
  const numberValue =
    Number(
      value
    );

  if (
    Number.isNaN(
      numberValue
    )
  ) {
    return "0";
  }

  return numberValue.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   INPUT VALUE
========================================================= */

function displayInputValue(
  value:
    string
) {
  const clean =
    String(
      value ??
        ""
    ).trim();

  return clean ||
    "-";
}

/* =========================================================
   OFFICER
========================================================= */

function getOfficer(
  officerId:
    string,

  officers:
    Officer[]
) {
  if (
    !officerId
  ) {
    return undefined;
  }

  return officers.find(
    (
      officer
    ) =>
      String(
        officer.id
      ) ===
      officerId
  );
}

/* =========================================================
   FONT SIZE
========================================================= */

function getSingleLineFontSize(
  doc:
    jsPDF,

  text:
    string,

  cellWidth:
    number,

  maxSize =
    8,

  minSize =
    4.5,

  horizontalPadding =
    1
) {
  const cleanText =
    String(
      text ??
        ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    !cleanText
  ) {
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

    if (
      doc.getTextWidth(
        cleanText
      ) <=
      availableWidth
    ) {
      return fontSize;
    }

    fontSize -=
      0.25;
  }

  return minSize;
}

/* =========================================================
   MULTI LINE HEADER FONT
========================================================= */

function getMultiLineFontSize(
  doc:
    jsPDF,

  lines:
    string[],

  cellWidth:
    number,

  maxSize =
    8,

  minSize =
    5,

  horizontalPadding =
    1
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
        (
          line
        ) =>
          doc.getTextWidth(
            line
          ) <=
          availableWidth
      );

    if (
      fits
    ) {
      return fontSize;
    }

    fontSize -=
      0.25;
  }

  return minSize;
}

/* =========================================================
   ACCURACY
========================================================= */

function getAccuracyChecked(
  row:
    InspectionRow,

  accuracy:
    "CORRECT" |
    "INCORRECT"
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
  fiscalYear,
  startShortYear,
  endShortYear,
  materials,
  rows,
  inspectorIds,
  officers,
}: Props) {
  const [
    isExporting,
    setIsExporting,
  ] =
    useState(
      false
    );

  /* =======================================================
     DOCUMENT HEADER
  ======================================================= */

  function drawDocumentHeader(
    doc:
      jsPDF
  ) {
    const center =
      PAGE_WIDTH /
      2;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setTextColor(
      0,
      0,
      0
    );

    doc.setFontSize(
      18
    );

    doc.text(
      `กระดาษทำการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      center,
      11,
      {
        align:
          "center",
      }
    );

    doc.setFontSize(
      18
    );

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      19,
      {
        align:
          "center",
      }
    );

    doc.setFontSize(
      14
    );

    doc.text(
      `1 ตุลาคม พ.ศ. ${fiscalYear - 1} เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear - 1}`,
      center,
      27,
      {
        align:
          "center",
      }
    );
  }

  /* =======================================================
     INSPECTORS
  ======================================================= */

  function drawInspectors(
    doc:
      jsPDF,

    startY:
      number
  ) {
    const columnWidth =
      TABLE_WIDTH /
      3;

    const dotLine =
      "....................................................";

    for (
      let index =
        0;

      index <
      3;

      index++
    ) {
      const selectedInspectorId =
        inspectorIds[
          index
        ] ||
        "";

      const selectedOfficer =
        getOfficer(
          selectedInspectorId,
          officers
        );

      const inspectorName =
        selectedOfficer
          ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`.trim()
          : "................................";

      const inspectorPosition =
        selectedOfficer
          ?.position ||
        "................................";

      const role =
        index ===
        0
          ? "ประธานกรรมการ"
          : `กรรมการคนที่ ${index}`;

      const centerX =
        MARGIN_X +
        columnWidth *
          index +
        columnWidth /
          2;

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      doc.setFontSize(
        11
      );

      doc.text(
        `ลงชื่อ ${dotLine}`,
        centerX,
        startY,
        {
          align:
            "center",
        }
      );

      doc.setFontSize(
        11
      );

      const nameLines =
        doc.splitTextToSize(
          `(${inspectorName})`,
          columnWidth -
            8
        );

      doc.text(
        nameLines,
        centerX,
        startY +
          5,
        {
          align:
            "center",
        }
      );

      const positionLines =
        doc.splitTextToSize(
          inspectorPosition,
          columnWidth -
            8
        );

      doc.text(
        positionLines,
        centerX,
        startY +
          10,
        {
          align:
            "center",
        }
      );

      doc.setFontSize(
        10.5
      );

      doc.text(
        role,
        centerX,
        startY +
          15,
        {
          align:
            "center",
        }
      );
    }
  }

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  async function handleExportPdf() {
    if (
      materials.length ===
      0
    ) {
      alert(
        "ไม่พบรายการพัสดุสำหรับสร้าง PDF"
      );

      return;
    }

    const previewWindow =
      window.open(
        "",
        "_blank"
      );

    if (
      !previewWindow
    ) {
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
      setIsExporting(
        true
      );

      const doc =
        new jsPDF({
          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",

          compress:
            true,
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      const totalPages =
        Math.max(
          1,

          Math.ceil(
            materials.length /
              ROWS_PER_PAGE
          )
        );

      for (
        let pageIndex =
          0;

        pageIndex <
        totalPages;

        pageIndex++
      ) {
        if (
          pageIndex >
          0
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

        const pageMaterials =
          materials.slice(
            startIndex,
            startIndex +
              ROWS_PER_PAGE
          );

        const body =
          pageMaterials.map(
            (
              material,
              localIndex
            ) => {
              const actualIndex =
                startIndex +
                localIndex;

              const row =
                rows.find(
                  (
                    item
                  ) =>
                    item.materialId ===
                    material.materialId
                ) || {
                  materialId:
                    material.materialId,

                  accuracy:
                    "",

                  shortageQty:
                    "",

                  excessQty:
                    "",

                  baht:
                    "",

                  satang:
                    "",

                  damagedQty:
                    "",

                  deterioratedQty:
                    "",

                  unnecessaryQty:
                    "",

                  remark:
                    "",
                };

              return [
                String(
                  actualIndex +
                    1
                ),

                material.name ||
                  "-",

                material.unit ||
                  "-",

                formatNumber(
                  material.openingBalance
                ),

                formatNumber(
                  material.receiveQty
                ),

                formatNumber(
                  material.issueQty
                ),

                formatNumber(
                  material.closingBalance
                ),

                getAccuracyChecked(
                  row,
                  "CORRECT"
                ),

                getAccuracyChecked(
                  row,
                  "INCORRECT"
                ),

                displayInputValue(
                  row.shortageQty
                ),

                displayInputValue(
                  row.excessQty
                ),

                displayInputValue(
                  row.baht
                ),

                displayInputValue(
                  row.satang
                ),

                displayInputValue(
                  row.damagedQty
                ),

                displayInputValue(
                  row.deterioratedQty
                ),

                displayInputValue(
                  row.unnecessaryQty
                ),

                row.remark ||
                  "",
              ];
            }
          );

        /*
         * เติมแถวว่างให้ครบ 15 รายการต่อหน้า
         */
        while (
          body.length <
          ROWS_PER_PAGE
        ) {
          body.push(
            Array(
              17
            ).fill(
              ""
            )
          );
        }

        /* =================================================
           HEADER TEXT

           คงหัวตารางเดิม
        ================================================= */

        const openingHeaderLines =
          [
            "คงเหลือยอดยกมา",
            `เมื่อ 30 ก.ย. ${startShortYear}`,
          ];

        const movementHeaderLines =
          [
            `01 ต.ค. ${startShortYear}`,
            `- 30 ก.ย. ${endShortYear}`,
          ];

        const incorrectHeaderLines =
          [
            "ถ้าไม่ถูกต้องจำนวนที่ขาด",
            "จำนวนที่เกินคิดเป็นร้อยละ",
          ];

        /* =================================================
           TABLE
        ================================================= */

        autoTable(
          doc,
          {
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

            theme:
              "grid",

            head: [
              [
                {
                  content:
                    "ลำดับ",

                  rowSpan:
                    2,
                },

                {
                  content:
                    "รายการพัสดุ",

                  rowSpan:
                    2,
                },

                {
                  content:
                    "หน่วยนับ",

                  rowSpan:
                    2,
                },

                {
                  content:
                    openingHeaderLines.join(
                      "\n"
                    ),

                  rowSpan:
                    2,
                },

                {
                  content:
                    movementHeaderLines.join(
                      "\n"
                    ),

                  colSpan:
                    2,
                },

                {
                  content:
                    "คงเหลือ",

                  colSpan:
                    1,
                },

                {
                  content:
                    "ผลการตรวจสอบ",

                  colSpan:
                    2,
                },

                {
                  content:
                    incorrectHeaderLines.join(
                      "\n"
                    ),

                  colSpan:
                    4,
                },

                {
                  content:
                    "จำนวนที่",

                  colSpan:
                    3,
                },

                {
                  content:
                    "หมายเหตุ",

                  rowSpan:
                    2,
                },
              ],

              [
                "รับ",
                "จ่าย",

                "ยกไป",

                "ถูกต้อง",
                "ไม่ถูกต้อง",

                "ขาด",
                "เกิน",
                "บาท",
                "สต.",

                "ชำรุด",
                "เสื่อมสภาพ",
                "ไม่จำเป็นต้องใช้",
              ],
            ],

            body,

            /* =============================================
               GENERAL
            ============================================= */

            styles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize:
                8,

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
                0.55,

              minCellHeight:
                7.4,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "linebreak",
            },

            /* =============================================
               HEADER
            ============================================= */

            headStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize:
                7.7,

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
                0.4,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "linebreak",
            },

            /* =============================================
               BODY
            ============================================= */

            bodyStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize:
                8,

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
                0.55,

              minCellHeight:
                7.4,

              halign:
                "center",

              valign:
                "middle",
            },

            /* =============================================
               COLUMN WIDTH
            ============================================= */

            columnStyles: {
              0: {
                cellWidth:
                  COLUMN_WIDTHS.order,

                halign:
                  "center",
              },

              1: {
                cellWidth:
                  COLUMN_WIDTHS.item,

                halign:
                  "left",

                cellPadding: {
                  top:
                    0.4,

                  right:
                    0.5,

                  bottom:
                    0.4,

                  left:
                    1.1,
                },
              },

              2: {
                cellWidth:
                  COLUMN_WIDTHS.unit,
              },

              3: {
                cellWidth:
                  COLUMN_WIDTHS.opening,
              },

              4: {
                cellWidth:
                  COLUMN_WIDTHS.receive,
              },

              5: {
                cellWidth:
                  COLUMN_WIDTHS.issue,
              },

              6: {
                cellWidth:
                  COLUMN_WIDTHS.closing,
              },

              7: {
                cellWidth:
                  COLUMN_WIDTHS.correct,
              },

              8: {
                cellWidth:
                  COLUMN_WIDTHS.incorrect,
              },

              9: {
                cellWidth:
                  COLUMN_WIDTHS.shortage,
              },

              10: {
                cellWidth:
                  COLUMN_WIDTHS.excess,
              },

              11: {
                cellWidth:
                  COLUMN_WIDTHS.baht,
              },

              12: {
                cellWidth:
                  COLUMN_WIDTHS.satang,
              },

              13: {
                cellWidth:
                  COLUMN_WIDTHS.damaged,
              },

              14: {
                cellWidth:
                  COLUMN_WIDTHS.deteriorated,
              },

              15: {
                cellWidth:
                  COLUMN_WIDTHS.unnecessary,
              },

              16: {
                cellWidth:
                  COLUMN_WIDTHS.remark,
              },
            },

            /* =============================================
               PARSE CELL
            ============================================= */

            didParseCell: (
              data
            ) => {
              /* ===========================================
                 OPENING HEADER
              =========================================== */

              if (
                data.section ===
                  "head" &&
                data.row.index ===
                  0 &&
                data.column.index ===
                  3
              ) {
                data.cell.text =
                  openingHeaderLines;

                data.cell.styles.fontSize =
                  getMultiLineFontSize(
                    doc,
                    openingHeaderLines,
                    COLUMN_WIDTHS.opening,
                    7.7,
                    5,
                    0.8
                  );

                data.cell.styles.cellPadding =
                  0.25;

                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }

              /* ===========================================
                 MOVEMENT HEADER
              =========================================== */

              if (
                data.section ===
                  "head" &&
                data.row.index ===
                  0 &&
                data.column.index ===
                  4
              ) {
                const width =
                  COLUMN_WIDTHS.receive +
                  COLUMN_WIDTHS.issue;

                data.cell.text =
                  movementHeaderLines;

                data.cell.styles.fontSize =
                  getMultiLineFontSize(
                    doc,
                    movementHeaderLines,
                    width,
                    7.7,
                    5,
                    0.8
                  );

                data.cell.styles.cellPadding =
                  0.25;

                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }

              /* ===========================================
                 INCORRECT GROUP HEADER
              =========================================== */

              if (
                data.section ===
                  "head" &&
                data.row.index ===
                  0 &&
                data.column.index ===
                  9
              ) {
                const width =
                  COLUMN_WIDTHS.shortage +
                  COLUMN_WIDTHS.excess +
                  COLUMN_WIDTHS.baht +
                  COLUMN_WIDTHS.satang;

                data.cell.text =
                  incorrectHeaderLines;

                data.cell.styles.fontSize =
                  getMultiLineFontSize(
                    doc,
                    incorrectHeaderLines,
                    width,
                    7.7,
                    5,
                    0.8
                  );

                data.cell.styles.cellPadding =
                  0.25;

                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }

              /* ===========================================
                 MATERIAL NAME
              =========================================== */

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
                  [
                    text,
                  ];

                data.cell.styles.fontSize =
                  getSingleLineFontSize(
                    doc,
                    text,
                    COLUMN_WIDTHS.item,
                    8,
                    4.2,
                    1.5
                  );

                data.cell.styles.halign =
                  "left";

                data.cell.styles.valign =
                  "middle";

                data.cell.styles.overflow =
                  "hidden";
              }

              /* ===========================================
                 UNIT
              =========================================== */

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
                  [
                    text,
                  ];

                data.cell.styles.fontSize =
                  getSingleLineFontSize(
                    doc,
                    text,
                    COLUMN_WIDTHS.unit,
                    8,
                    4.5,
                    0.8
                  );

                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";

                data.cell.styles.overflow =
                  "hidden";
              }

              /* ===========================================
                 REMARK
              =========================================== */

              if (
                data.section ===
                  "body" &&
                data.column.index ===
                  16
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
                  [
                    text,
                  ];

                data.cell.styles.fontSize =
                  getSingleLineFontSize(
                    doc,
                    text,
                    COLUMN_WIDTHS.remark,
                    8,
                    4.5,
                    0.8
                  );

                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";

                data.cell.styles.overflow =
                  "hidden";
              }

              /* ===========================================
                 CHECKBOX

                 7 = ถูกต้อง
                 8 = ไม่ถูกต้อง
              =========================================== */

              if (
                data.section ===
                  "body" &&
                (
                  data.column.index ===
                    7 ||
                  data.column.index ===
                    8
                )
              ) {
                data.cell.text =
                  [
                    "",
                  ];

                data.cell.styles.halign =
                  "center";

                data.cell.styles.valign =
                  "middle";
              }
            },

            /* =============================================
               DRAW CHECK
            ============================================= */

            didDrawCell: (
              data
            ) => {
              if (
                data.section !==
                  "body" ||
                (
                  data.column.index !==
                    7 &&
                  data.column.index !==
                    8
                )
              ) {
                return;
              }

              const rawValue =
                String(
                  data.cell.raw ??
                    ""
                ).trim();

              if (
                rawValue !==
                "✓"
              ) {
                return;
              }

              const centerX =
                data.cell.x +
                data.cell.width /
                  2;

              const centerY =
                data.cell.y +
                data.cell.height /
                  2;

              doc.setDrawColor(
                0,
                0,
                0
              );

              doc.setLineWidth(
                0.45
              );

              doc.line(
                centerX -
                  1.8,

                centerY,

                centerX -
                  0.4,

                centerY +
                  1.4
              );

              doc.line(
                centerX -
                  0.4,

                centerY +
                  1.4,

                centerX +
                  2.2,

                centerY -
                  1.6
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
          }
        );

        /* =================================================
           SIGNATURE
        ================================================= */

        const lastAutoTable =
          (
            doc as jsPDF & {
              lastAutoTable?: {
                finalY:
                  number;
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
         OPEN PDF
      =================================================== */

      const fileName =
        `กระดาษทำการตรวจสอบบัญชีพัสดุ_พ.ศ.${fiscalYear}.pdf`;

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

        5 *
          60 *
          1000
      );
    } catch (
      error
    ) {
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
        materials.length ===
          0
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