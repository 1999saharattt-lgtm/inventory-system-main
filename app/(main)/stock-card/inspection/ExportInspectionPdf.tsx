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

  openingBalance: number;

  receiveQty: number;
  issueQty: number;

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
 * A4 landscape:
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

   23.25 px
   =
   6.1515625 mm
========================================================= */

const BODY_ROW_HEIGHT =
  6.1515625;

/* =========================================================
   FONT

   ใหญ่ขึ้นจากรอบก่อน

   - Header เริ่ม 16
   - Data เริ่ม 14
   - Category 15

   ถ้าข้อความยาวมาก
   ลดเฉพาะ cell นั้น
   ไม่ให้ขึ้นบรรทัดใหม่
========================================================= */

const HEADER_FONT_MAX =
  16;

const HEADER_FONT_MIN =
  9;

const BODY_FONT_MAX =
  14;

const BODY_FONT_MIN =
  9;

const CATEGORY_FONT =
  15;

const DOCUMENT_FONT =
  15;

const SIGNATURE_FONT =
  12;

/* =========================================================
   COLUMN WIDTH

   รวม = 289 mm

   ปรับให้:
   - ชื่อรายการกว้าง
   - ยอดยกกว้างขึ้น
   - ข้อมูลไม่ซ้อน
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
      month -
        1,
      day
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month -
        1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   MONTH / YEAR

   วันเว้นไว้ให้เขียนมือ

   เดือน + ปี
   ใช้ตาม Form
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
      month:
        "",
      year:
        "",
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

   0 = -
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

   ไม่มีค่า / 0
   =
   ว่าง
========================================================= */

function displayOptionalValue(
  value:
    | string
    | null
    | undefined
) {
  const text =
    String(
      value ??
        ""
    ).trim();

  if (
    !text ||
    Number(
      text
    ) === 0
  ) {
    return "";
  }

  return text;
}

/* =========================================================
   FIT SINGLE LINE FONT

   สำคัญ:
   - ไม่ wrap
   - ไม่ตกบรรทัด
   - ไม่ซ้อน
   - ลดเฉพาะ cell ที่ยาว
========================================================= */

function fitSingleLineFontSize(
  doc: jsPDF,
  text: string,
  availableWidth: number,
  maximum: number,
  minimum: number,
  padding = 0.7
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

  if (!cleanText) {
    return maximum;
  }

  const width =
    Math.max(
      1,
      availableWidth -
        padding *
          2
    );

  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  let size =
    maximum;

  while (
    size >
    minimum
  ) {
    doc.setFontSize(
      size
    );

    if (
      doc.getTextWidth(
        cleanText
      ) <=
      width
    ) {
      return size;
    }

    size -=
      0.25;
  }

  return minimum;
}

/* =========================================================
   HEADER SPAN WIDTH
========================================================= */

function getHeaderCellWidth(
  columnIndex: number,
  text: string
) {
  if (
    text.startsWith(
      "01 ต.ค."
    )
  ) {
    return (
      COLUMN_WIDTHS[4] +
      COLUMN_WIDTHS[5]
    );
  }

  if (
    text ===
    "รายละเอียดกรณีไม่ถูกต้อง"
  ) {
    return (
      COLUMN_WIDTHS[9] +
      COLUMN_WIDTHS[10] +
      COLUMN_WIDTHS[11] +
      COLUMN_WIDTHS[12]
    );
  }

  return (
    COLUMN_WIDTHS[
      columnIndex
    ] ??
    10
  );
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
    useState(
      false
    );

  /* =======================================================
     ROW MAP
  ======================================================= */

  const rowMap =
    new Map(
      rows.map(
        (
          row
        ) => [
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

    /* ===============================================
       TITLE
    =============================================== */

    doc.setFontSize(
      DOCUMENT_FONT
    );

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      center,
      8,
      {
        align:
          "center",
      }
    );

    /* ===============================================
       AGENCY
    =============================================== */

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      14,
      {
        align:
          "center",
      }
    );

    /* ===============================================
       DATE LINE

       เว้นเฉพาะ "วันที่"

       เดือน / ปี
       ใช้จาก Form

       ไม่ใช้ ..........
       ไม่ใช้ space ยาว ๆ
    =============================================== */

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

    /*
     * ช่องว่างไว้เขียน "วัน"
     */
    const dayBlankWidth =
      7;

    let fontSize =
      DOCUMENT_FONT;

    let totalWidth =
      Number.MAX_SAFE_INTEGER;

    while (
      fontSize >=
        10 &&
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
          parts.length -
            1
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

     แสดงจาก Form

     รูปแบบ:
     ลงชื่อ...
     (ชื่อ นามสกุล)
     ตำแหน่ง

     ไม่เขียนคำว่า "ตำแหน่ง"
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
      TABLE_WIDTH /
      3;

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
          columnWidth /
            2;

        /* ===========================================
           SIGN
        =========================================== */

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

        /* ===========================================
           NAME
        =========================================== */

        const name =
          officer
            ? `(${officer.firstName} ${officer.lastName})`
            : "(                                        )";

        const nameFont =
          fitSingleLineFontSize(
            doc,
            name,
            columnWidth -
              5,
            SIGNATURE_FONT,
            9
          );

        doc.setFontSize(
          nameFont
        );

        doc.text(
          name,
          centerX,
          startY +
            6,
          {
            align:
              "center",
          }
        );

        /* ===========================================
           POSITION
        =========================================== */

        const position =
          officer?.position ??
          "";

        const positionFont =
          fitSingleLineFontSize(
            doc,
            position,
            columnWidth -
              5,
            SIGNATURE_FONT,
            9
          );

        doc.setFontSize(
          positionFont
        );

        doc.text(
          position,
          centerX,
          startY +
            12,
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

      /* =================================================
         PDF

         ไม่สร้างรูปภาพ

         ตารางเป็น Vector
         จาก jsPDF AutoTable โดยตรง
      ================================================= */

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

      /* =================================================
         CATEGORY GROUPS
      ================================================= */

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
                .length >
              0
          );

      let firstPage =
        true;

      /* =================================================
         CATEGORY
      ================================================= */

      for (
        const group of
          groups
      ) {
        /*
         * หมวดใหม่
         * =
         * หน้าใหม่
         *
         * ภายในหมวด
         * สูงสุด 20 รายการต่อหน้า
         */
        for (
          let startIndex =
            0;
          startIndex <
          group.materials.length;
          startIndex +=
            ROWS_PER_PAGE
        ) {
          /* =============================================
             PAGE
          ============================================= */

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

          /*
           * ชื่อหมวดแสดงเฉพาะ
           * หน้าแรกของหมวด
           */
          const showCategory =
            startIndex ===
            0;

          /* =============================================
             BODY
          ============================================= */

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
                    CATEGORY_FONT,

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
                 * ยอดยกเข้าระบบ
                 * ของวันที่ 01 ต.ค.
                 *
                 * FY2569
                 * =
                 * opening transaction
                 * 01 ต.ค.2568
                 */
                displayStockValue(
                  material.openingBalance
                ),

                /*
                 * รับจริงเท่านั้น
                 *
                 * ไม่รวม openingBalance
                 */
                displayStockValue(
                  material.receiveQty
                ),

                /*
                 * จ่ายจริง APPROVED
                 * ใน FY
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

          /* =============================================
             HEADER

             ไม่มี \n
             ไม่ wrap
          ============================================= */

          const headerOpening =
            `คงเหลือยอดยกมาเมื่อ 30 ก.ย. ${startShortYear}`;

          const headerMovement =
            `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`;

          /* =============================================
             TABLE

             เส้นตาราง Vector จริง
             theme = grid
          ============================================= */

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

              /* =========================================
                 HEADER
              ========================================= */

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

              /* =========================================
                 BASE STYLE

                 ไม่มีวาดซ้ำข้อความ
                 ไม่มี didDrawCell
              ========================================= */

              styles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  BODY_FONT_MAX,

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

                /*
                 * เส้นแบบ Excel
                 * ทุก cell
                 */
                lineColor: [
                  0,
                  0,
                  0,
                ],

                lineWidth:
                  0.25,

                cellPadding:
                  0.25,

                minCellHeight:
                  BODY_ROW_HEIGHT,

                halign:
                  "center",

                valign:
                  "middle",

                /*
                 * ห้ามขึ้นบรรทัดใหม่
                 */
                overflow:
                  "hidden",
              },

              /* =========================================
                 HEADER STYLE

                 ตัวหนา
                 พื้นขาว
                 เส้นดำ
              ========================================= */

              headStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "bold",

                fontSize:
                  HEADER_FONT_MAX,

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
                  0.25,

                halign:
                  "center",

                valign:
                  "middle",

                overflow:
                  "hidden",
              },

              /* =========================================
                 BODY STYLE

                 Font เริ่ม 14
              ========================================= */

              bodyStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  BODY_FONT_MAX,

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
                  0.25,

                minCellHeight:
                  BODY_ROW_HEIGHT,

                valign:
                  "middle",

                overflow:
                  "hidden",
              },

              /* =========================================
                 COLUMN WIDTH
              ========================================= */

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

              /* =========================================
                 AUTO FONT FIT

                 ไม่มี redraw
                 จึงไม่มีข้อความสั่น/ซ้อน
              ========================================= */

              didParseCell: (
                data: any
              ) => {
                /* =====================================
                   CATEGORY ROW

                   มี colSpan 17
                   styles กำหนดไว้แล้ว
                ===================================== */

                if (
                  data.section ===
                    "body" &&
                  data.cell.colSpan ===
                    17
                ) {
                  return;
                }

                /* =====================================
                   HEADER
                ===================================== */

                if (
                  data.section ===
                  "head"
                ) {
                  const text =
                    Array.isArray(
                      data.cell.text
                    )
                      ? data.cell.text.join(
                          " "
                        )
                      : String(
                          data.cell.text ??
                            ""
                        );

                  const availableWidth =
                    getHeaderCellWidth(
                      data.column.index,
                      text
                    );

                  data.cell.styles.fontSize =
                    fitSingleLineFontSize(
                      doc,
                      text,
                      availableWidth,
                      HEADER_FONT_MAX,
                      HEADER_FONT_MIN,
                      0.45
                    );

                  /*
                   * สองชั้นหัวตาราง
                   *
                   * ไม่ให้ข้อความทับกัน
                   */
                  data.cell.styles.minCellHeight =
                    data.row.index ===
                    0
                      ? 6.6
                      : 5.6;

                  return;
                }

                /* =====================================
                   DATA
                ===================================== */

                if (
                  data.section ===
                  "body"
                ) {
                  const text =
                    Array.isArray(
                      data.cell.text
                    )
                      ? data.cell.text.join(
                          " "
                        )
                      : String(
                          data.cell.text ??
                            ""
                        );

                  const width =
                    COLUMN_WIDTHS[
                      data.column.index
                    ] ??
                    10;

                  data.cell.styles.fontSize =
                    fitSingleLineFontSize(
                      doc,
                      text,
                      width,
                      BODY_FONT_MAX,
                      BODY_FONT_MIN,
                      0.4
                    );

                  data.cell.styles.minCellHeight =
                    BODY_ROW_HEIGHT;
                }
              },
            }
          );

          /* =============================================
             TABLE END
          ============================================= */

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

          /* =============================================
             INSPECTORS

             ตารางมี 3 แถว
             -> ลงชื่อถัดจากตารางเลย

             ตารางมี 20 แถว
             -> ยังอยู่ในหน้าเดียวกัน
          ============================================= */

          let signatureY =
            finalY +
            5;

          /*
           * Safety
           *
           * แต่ด้วย layout นี้
           * 20 แถวควรอยู่หน้าเดียวกับลายเซ็น
           */
          if (
            signatureY +
              14 >
            PAGE_HEIGHT -
              3
          ) {
            signatureY =
              PAGE_HEIGHT -
              18;
          }

          drawInspectors(
            doc,
            signatureY
          );
        }
      }

      /* =================================================
         PREVIEW

         ไม่ download
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