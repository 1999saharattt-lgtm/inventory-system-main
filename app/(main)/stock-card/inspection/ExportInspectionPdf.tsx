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

type Material = {
  materialId: number;

  code: string;
  name: string;
  unit: string;
  category: string;

  /*
   * ยอดยกเข้าระบบ ณ 01 ต.ค.
   * ใช้เป็นยอดคงเหลือยกมา ณ 30 ก.ย. ปีก่อน
   */
  openingBalance: number;

  /*
   * movement ระหว่างปีงบประมาณ
   *
   * receiveQty:
   * รับจริงเท่านั้น
   * ห้ามรวมรายการ "ยอดยกเข้าระบบ"
   */
  receiveQty: number;

  issueQty: number;

  /*
   * ยอดคงเหลือปัจจุบัน
   */
  closingBalance: number;
};

type InspectionRow = {
  materialId: number;

  accuracy: string;

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
  position: string;

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

  materials: Material[];

  rows: InspectionRow[];

  inspectionStartDate: string;
  inspectionEndDate: string;

  inspectorIds: string[];

  officers: Officer[];
};

/* =========================================================
   PAGE
========================================================= */

const PAGE_WIDTH =
  297;

const PAGE_HEIGHT =
  210;

/*
 * A4 landscape
 *
 * 297 mm
 *
 * margin ซ้าย/ขวา 4 mm
 * เหลือ 289 mm สำหรับตาราง
 */

const TABLE_LEFT =
  4;

const TABLE_RIGHT =
  4;

const TABLE_WIDTH =
  PAGE_WIDTH -
  TABLE_LEFT -
  TABLE_RIGHT;

/* =========================================================
   ROWS

   สูงสุด 20 รายการต่อหน้า

   แถวชื่อหมวด
   ไม่ถือเป็น 1 รายการ
========================================================= */

const ROWS_PER_PAGE =
  20;

/* =========================================================
   ROW HEIGHT
========================================================= */

const BODY_ROW_HEIGHT =
  6.1515625;

/* =========================================================
   FONT

   ใช้ขนาดเดียวกันทั้งตาราง
   เพื่อไม่ให้หัวตารางบางช่องใหญ่/เล็กไม่เท่ากัน
========================================================= */

const TABLE_FONT_SIZE =
  9;

const CATEGORY_FONT =
  TABLE_FONT_SIZE;

const DOCUMENT_FONT =
  15;

const SIGNATURE_FONT =
  12;

/* =========================================================
   COLUMN WIDTH

   รวม = 289 mm
========================================================= */

const COLUMN_WIDTHS = [
  7, // ลำดับ
  58, // ชื่อรายการ
  11, // หน่วย
  30, // ยอดยก
  15, // รับ
  15, // จ่าย
  18, // คงเหลือ
  11, // ถูกต้อง
  13, // ไม่ถูกต้อง
  10, // ขาด
  10, // เกิน
  9, // บาท
  9, // สต.
  13, // ชำรุด
  15, // เสื่อมสภาพ
  18, // ไม่จำเป็นต้องใช้
  27, // หมายเหตุ
];

/* =========================================================
   CATEGORY
========================================================= */

const CATEGORY_ORDER = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const CATEGORY_NAME: Record<
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
   THAI MONTH
========================================================= */

const THAI_MONTHS = [
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
   DATE
========================================================= */

function parseDateOnly(
  value: string
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   MONTH / YEAR
========================================================= */

function getThaiMonthYear(
  value: string
) {
  const date =
    parseDateOnly(
      value
    );

  if (!date) {
    return {
      month: "",
      year: "",
    };
  }

  return {
    month:
      THAI_MONTHS[
        date.getMonth()
      ],

    year:
      String(
        date.getFullYear() +
          543
      ),
  };
}

/* =========================================================
   DISPLAY STOCK

   ไม่มีข้อมูล / 0 = -
========================================================= */

function displayStockValue(
  value: number
) {
  if (
    !Number.isFinite(
      value
    ) ||
    value === 0
  ) {
    return "-";
  }

  return value.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   OPTIONAL VALUE
========================================================= */

function displayOptionalValue(
  value:
    | string
    | null
    | undefined
) {
  const text =
    String(
      value ?? ""
    ).trim();

  if (
    !text ||
    Number(text) === 0
  ) {
    return "";
  }

  return text;
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

  inspectionStartDate,
  inspectionEndDate,

  inspectorIds,
  officers,
}: Props) {
  const [
    isExporting,
    setIsExporting,
  ] =
    useState(false);

  /* =======================================================
     ROW MAP
  ======================================================= */

  const rowMap =
    new Map(
      rows.map(
        (row) => [
          row.materialId,
          row,
        ]
      )
    );

  /* =======================================================
     FORM DATE INFO
  ======================================================= */

  const startDateInfo =
    getThaiMonthYear(
      inspectionStartDate
    );

  const endDateInfo =
    getThaiMonthYear(
      inspectionEndDate
    );

  /* =======================================================
     DOCUMENT HEADER
  ======================================================= */

  function drawPageHeader(
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

    doc.setFontSize(
      DOCUMENT_FONT
    );

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      center,
      8,
      {
        align: "center",
      }
    );

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      14,
      {
        align: "center",
      }
    );

    const parts = [
      {
        text:
          "วันที่เริ่มตรวจสอบ",
        blankAfter:
          true,
      },

      {
        text:
          `เดือน ${startDateInfo.month} พ.ศ. ${startDateInfo.year}`,
        blankAfter:
          false,
      },

      {
        text:
          "ตรวจสอบแล้วเสร็จวันที่",
        blankAfter:
          true,
      },

      {
        text:
          `เดือน ${endDateInfo.month} พ.ศ. ${endDateInfo.year}`,
        blankAfter:
          false,
      },

      {
        text:
          `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`,
        blankAfter:
          false,
      },
    ];

    const dayBlankWidth =
      7;

    let fontSize =
      DOCUMENT_FONT;

    let totalWidth =
      Number.MAX_SAFE_INTEGER;

    while (
      fontSize >= 10 &&
      totalWidth >
        TABLE_WIDTH
    ) {
      doc.setFontSize(
        fontSize
      );

      totalWidth =
        parts.reduce(
          (
            sum,
            part
          ) =>
            sum +
            doc.getTextWidth(
              part.text
            ) +
            (
              part.blankAfter
                ? dayBlankWidth
                : 0
            ),
          0
        ) +
        doc.getTextWidth(
          " "
        ) *
          (
            parts.length -
            1
          );

      if (
        totalWidth >
        TABLE_WIDTH
      ) {
        fontSize -=
          0.25;
      }
    }

    doc.setFontSize(
      fontSize
    );

    let x =
      (
        PAGE_WIDTH -
        totalWidth
      ) /
      2;

    parts.forEach(
      (
        part,
        index
      ) => {
        doc.text(
          part.text,
          x,
          21
        );

        x +=
          doc.getTextWidth(
            part.text
          );

        if (
          part.blankAfter
        ) {
          x +=
            dayBlankWidth;
        }

        if (
          index <
          parts.length - 1
        ) {
          x +=
            doc.getTextWidth(
              " "
            );
        }
      }
    );

    return 26;
  }

  /* =======================================================
     INSPECTORS
  ======================================================= */

  function drawInspectors(
    doc: jsPDF,
    startY: number
  ) {
    const selectedOfficers =
      inspectorIds.map(
        (
          officerId
        ) =>
          officers.find(
            (
              officer
            ) =>
              String(
                officer.id
              ) ===
              officerId
          )
      );

    const columnWidth =
      TABLE_WIDTH / 3;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setTextColor(
      0,
      0,
      0
    );

    selectedOfficers.forEach(
      (
        officer,
        index
      ) => {
        const centerX =
          TABLE_LEFT +
          columnWidth *
            index +
          columnWidth / 2;

        doc.setFontSize(
          SIGNATURE_FONT
        );

        doc.text(
          "ลงชื่อ ........................................................",
          centerX,
          startY,
          {
            align:
              "center",
          }
        );

        const name =
          officer
            ? `(${officer.firstName} ${officer.lastName})`
            : "(                                       )";

        doc.text(
          name,
          centerX,
          startY + 6,
          {
            align:
              "center",
          }
        );

        const position =
          officer?.position ??
          "";

        doc.text(
          position,
          centerX,
          startY + 12,
          {
            align:
              "center",
          }
        );
      }
    );
  }

  /* =======================================================
     PREVIEW WINDOW
  ======================================================= */

  function createPreviewWindow() {
    const previewWindow =
      window.open(
        "",
        "_blank"
      );

    if (
      !previewWindow
    ) {
      return null;
    }

    try {
      previewWindow.document.open();

      previewWindow.document.write(`
        <!doctype html>

        <html lang="th">
          <head>
            <meta charset="utf-8" />

            <title>
              ตัวอย่าง PDF
            </title>

            <style>
              html,
              body {
                width: 100%;
                height: 100%;
                margin: 0;
                background: #f8fafc;
              }

              body {
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, Tahoma, sans-serif;
              }

              .loading {
                padding: 18px 26px;
                background: white;
                border-radius: 16px;
                font-size: 16px;
                font-weight: 700;
                color: #334155;
                box-shadow:
                  0 16px 40px
                  rgba(15, 23, 42, 0.12);
              }
            </style>
          </head>

          <body>
            <div class="loading">
              กำลังเปิดตัวอย่าง PDF...
            </div>
          </body>
        </html>
      `);

      previewWindow.document.close();
    } catch {
      // ไม่ต้องทำอะไร
    }

    return previewWindow;
  }

  /* =======================================================
     PREVIEW PDF
  ======================================================= */

  function previewPdf() {
    if (
      isExporting
    ) {
      return;
    }

    if (
      materials.length ===
      0
    ) {
      alert(
        "ไม่มีรายการสำหรับแสดงตัวอย่าง PDF"
      );

      return;
    }

    const previewWindow =
      createPreviewWindow();

    if (
      !previewWindow
    ) {
      alert(
        "เบราว์เซอร์บล็อกหน้าต่างพรีวิว กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"
      );

      return;
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
            false,
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      const groups =
        CATEGORY_ORDER
          .map(
            (
              category
            ) => ({
              category,

              name:
                CATEGORY_NAME[
                  category
                ] ??
                category,

              materials:
                materials.filter(
                  (
                    material
                  ) =>
                    material.category ===
                    category
                ),
            })
          )
          .filter(
            (
              group
            ) =>
              group.materials
                .length > 0
          );

      let firstPage =
        true;

      for (
        const group of
          groups
      ) {
        for (
          let startIndex =
            0;
          startIndex <
          group.materials.length;
          startIndex +=
            ROWS_PER_PAGE
        ) {
          if (
            !firstPage
          ) {
            doc.addPage(
              "a4",
              "landscape"
            );
          }

          firstPage =
            false;

          const tableStartY =
            drawPageHeader(
              doc
            );

          const pageMaterials =
            group.materials.slice(
              startIndex,
              startIndex +
                ROWS_PER_PAGE
            );

          const showCategory =
            startIndex === 0;

          const body: any[] =
            [];

          if (
            showCategory
          ) {
            body.push([
              {
                content:
                  group.name,

                colSpan:
                  17,

                styles: {
                  font:
                    "2.3.2 THSarabunNew",

                  fontStyle:
                    "bold",

                  fontSize:
                    TABLE_FONT_SIZE,

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

                  halign:
                    "left",

                  valign:
                    "middle",

                  cellPadding:
                    0.5,

                  minCellHeight:
                    BODY_ROW_HEIGHT,

                  overflow:
                    "hidden",
                },
              },
            ]);
          }

          pageMaterials.forEach(
            (
              material,
              localIndex
            ) => {
              const inspectionRow =
                rowMap.get(
                  material.materialId
                );

              const order =
                startIndex +
                localIndex +
                1;

              body.push([
                String(
                  order
                ),

                material.name,

                material.unit ||
                  "-",

                /*
                 * ยอดยกมา 30 ก.ย.
                 *
                 * ใช้ openingBalance
                 * ซึ่งต้องมาจากรายการ
                 * "ยอดยกเข้าระบบ"
                 * วันที่ 01 ต.ค.
                 */
                displayStockValue(
                  material.openingBalance
                ),

                /*
                 * รับจริงจาก movement
                 * ไม่รวมยอดยกเข้าระบบ
                 */
                displayStockValue(
                  material.receiveQty
                ),

                /*
                 * จ่ายรวมจาก movement
                 */
                displayStockValue(
                  material.issueQty
                ),

                /*
                 * คงเหลือปัจจุบัน
                 */
                displayStockValue(
                  material.closingBalance
                ),

                "",

                "",

                displayOptionalValue(
                  inspectionRow
                    ?.shortageQty
                ),

                displayOptionalValue(
                  inspectionRow
                    ?.excessQty
                ),

                displayOptionalValue(
                  inspectionRow
                    ?.baht
                ),

                displayOptionalValue(
                  inspectionRow
                    ?.satang
                ),

                displayOptionalValue(
                  inspectionRow
                    ?.damagedQty
                ),

                displayOptionalValue(
                  inspectionRow
                    ?.deterioratedQty
                ),

                displayOptionalValue(
                  inspectionRow
                    ?.unnecessaryQty
                ),

                inspectionRow
                  ?.remark ??
                  "",
              ]);
            }
          );

          const headerOpening =
            `คงเหลือยอดยกมาเมื่อ 30 ก.ย. ${startShortYear}`;

          const headerMovement =
            `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`;

          autoTable(
            doc,
            {
              startY:
                tableStartY,

              tableWidth:
                TABLE_WIDTH,

              margin: {
                left:
                  TABLE_LEFT,

                right:
                  TABLE_RIGHT,

                top:
                  tableStartY,

                bottom:
                  4,
              },

              theme:
                "grid",

              pageBreak:
                "avoid",

              rowPageBreak:
                "avoid",

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
                      "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์",
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
                      headerOpening,
                    rowSpan:
                      2,
                  },

                  {
                    content:
                      headerMovement,
                    colSpan:
                      2,
                  },

                  {
                    content:
                      "คงเหลือปัจจุบัน",
                    rowSpan:
                      2,
                  },

                  {
                    content:
                      "ถูกต้อง",
                    rowSpan:
                      2,
                  },

                  {
                    content:
                      "ไม่ถูกต้อง",
                    rowSpan:
                      2,
                  },

                  {
                    content:
                      "รายละเอียดกรณีไม่ถูกต้อง",
                    colSpan:
                      4,
                  },

                  {
                    content:
                      "ชำรุด",
                    rowSpan:
                      2,
                  },

                  {
                    content:
                      "เสื่อมสภาพ",
                    rowSpan:
                      2,
                  },

                  {
                    content:
                      "ไม่จำเป็นต้องใช้",
                    rowSpan:
                      2,
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
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                ],
              ],

              body,

              styles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                /*
                 * ทุก cell ใช้ขนาดเดียวกัน
                 */
                fontSize:
                  TABLE_FONT_SIZE,

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
                  0.2,

                minCellHeight:
                  BODY_ROW_HEIGHT,

                halign:
                  "center",

                valign:
                  "middle",

                overflow:
                  "hidden",
              },

              headStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "bold",

                /*
                 * หัวตารางขนาดเดียวกับข้อมูล
                 */
                fontSize:
                  TABLE_FONT_SIZE,

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
                  0.15,

                halign:
                  "center",

                valign:
                  "middle",

                /*
                 * ไม่ wrap
                 * ไม่ตกบรรทัด
                 */
                overflow:
                  "hidden",
              },

              bodyStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_FONT_SIZE,

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
                  0.2,

                minCellHeight:
                  BODY_ROW_HEIGHT,

                valign:
                  "middle",

                overflow:
                  "hidden",
              },

              columnStyles: {
                0: {
                  cellWidth:
                    COLUMN_WIDTHS[0],
                },

                1: {
                  cellWidth:
                    COLUMN_WIDTHS[1],
                  halign:
                    "left",
                },

                2: {
                  cellWidth:
                    COLUMN_WIDTHS[2],
                },

                3: {
                  cellWidth:
                    COLUMN_WIDTHS[3],
                },

                4: {
                  cellWidth:
                    COLUMN_WIDTHS[4],
                },

                5: {
                  cellWidth:
                    COLUMN_WIDTHS[5],
                },

                6: {
                  cellWidth:
                    COLUMN_WIDTHS[6],
                },

                7: {
                  cellWidth:
                    COLUMN_WIDTHS[7],
                },

                8: {
                  cellWidth:
                    COLUMN_WIDTHS[8],
                },

                9: {
                  cellWidth:
                    COLUMN_WIDTHS[9],
                },

                10: {
                  cellWidth:
                    COLUMN_WIDTHS[10],
                },

                11: {
                  cellWidth:
                    COLUMN_WIDTHS[11],
                },

                12: {
                  cellWidth:
                    COLUMN_WIDTHS[12],
                },

                13: {
                  cellWidth:
                    COLUMN_WIDTHS[13],
                },

                14: {
                  cellWidth:
                    COLUMN_WIDTHS[14],
                },

                15: {
                  cellWidth:
                    COLUMN_WIDTHS[15],
                },

                16: {
                  cellWidth:
                    COLUMN_WIDTHS[16],
                  halign:
                    "left",
                },
              },

              didParseCell: (
                data: any
              ) => {
                /*
                 * บังคับทุก cell
                 * ให้ใช้ font ขนาดเดียวกัน
                 */
                data.cell.styles.font =
                  "2.3.2 THSarabunNew";

                data.cell.styles.fontSize =
                  TABLE_FONT_SIZE;

                data.cell.styles.overflow =
                  "hidden";

                data.cell.styles.valign =
                  "middle";

                if (
                  data.section ===
                  "head"
                ) {
                  data.cell.styles.fontStyle =
                    "bold";

                  /*
                   * เพิ่มความสูงหัวตาราง
                   * ป้องกันข้อความชน/ซ้อนเส้น
                   */
                  data.cell.styles.minCellHeight =
                    data.row.index ===
                    0
                      ? 7.2
                      : 5.8;

                  data.cell.styles.cellPadding =
                    0.15;

                  return;
                }

                if (
                  data.section ===
                  "body"
                ) {
                  data.cell.styles.minCellHeight =
                    BODY_ROW_HEIGHT;

                  data.cell.styles.cellPadding =
                    0.2;
                }
              },
            }
          );

          const pdfWithTable =
            doc as jsPDF & {
              lastAutoTable?: {
                finalY: number;
              };
            };

          const finalY =
            pdfWithTable
              .lastAutoTable
              ?.finalY ??
            tableStartY;

          /*
           * ============================================
           * กรรมการ
           *
           * ไม่วางต่อจากตารางทันที
           * ให้วางลงไปบริเวณขอบล่างของ A4
           * ============================================
           */

          const signatureBottomMargin =
            3;

          const signatureBlockHeight =
            12;

          let signatureY =
            PAGE_HEIGHT -
            signatureBottomMargin -
            signatureBlockHeight;

          /*
           * ป้องกันกรณีตารางยาวมาก
           * ไม่ให้ลายเซ็นทับตาราง
           */
          const minimumSignatureY =
            finalY + 7;

          if (
            signatureY <
            minimumSignatureY
          ) {
            signatureY =
              minimumSignatureY;
          }

          drawInspectors(
            doc,
            signatureY
          );
        }
      }

      /* =================================================
         PREVIEW
      ================================================= */

      const pdfBlob =
        doc.output(
          "blob"
        );

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

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
        "Preview stock card inspection PDF error:",
        error
      );

      if (
        !previewWindow.closed
      ) {
        previewWindow.close();
      }

      alert(
        "ไม่สามารถเปิดตัวอย่าง PDF ได้"
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
      icon={
        <span
          aria-hidden="true"
        >
          📄
        </span>
      }
      onClick={
        previewPdf
      }
      disabled={
        isExporting ||
        materials.length ===
          0
      }
    >
      {isExporting
        ? "กำลังเปิด PDF..."
        : "ส่งออก PDF"}
    </AppButton>
  );
}