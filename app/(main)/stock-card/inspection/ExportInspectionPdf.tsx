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
   * ยอดยกเข้าระบบวันที่ 01 ต.ค.
   */
  openingBalance: number;

  /*
   * รับจริงเฉพาะ FY
   * ไม่รวมยอดยก
   */
  receiveQty: number;

  /*
   * จ่ายจริง APPROVED
   * เฉพาะ FY
   */
  issueQty: number;

  /*
   * คงเหลือปัจจุบัน
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

/* =========================================================
   TABLE

   A4 Landscape

   297 mm
   Table 289 mm
   เหลือขอบซ้าย/ขวา 4 mm
========================================================= */

const TABLE_LEFT =
  4;

const TABLE_RIGHT =
  4;

const TABLE_WIDTH =
  289;

/* =========================================================
   ROWS PER PAGE

   สูงสุด 20 รายการจริงต่อหน้า

   แถวชื่อหมวด
   ไม่นับรวมใน 20 รายการ
========================================================= */

const ROWS_PER_PAGE =
  20;

/* =========================================================
   ROW HEIGHT

   Excel 23.25 px
   =
   6.1515625 mm
========================================================= */

const BODY_ROW_HEIGHT =
  6.1515625;

/* =========================================================
   FONT

   สำคัญ:
   ใช้ขนาดเดียวกันทั้งตาราง

   ไม่ลด Font รายช่อง
   ไม่ขยาย Font รายช่อง

   และใช้ normal เท่านั้น
   เพื่อไม่ให้ภาษาไทยเพี้ยน
========================================================= */

const TABLE_FONT_SIZE =
  13;

/* =========================================================
   DOCUMENT FONT
========================================================= */

const DOCUMENT_FONT_SIZE =
  15;

const SIGNATURE_FONT_SIZE =
  12;

/* =========================================================
   COLUMN WIDTH

   รวม = 289 mm

   ปรับให้พอดีคำโดยไม่ลด Font รายช่อง
========================================================= */

const COLUMN_WIDTHS = {
  order:
    7,

  item:
    70,

  unit:
    10,

  opening:
    29,

  receive:
    14,

  issue:
    14,

  closing:
    21,

  correct:
    10,

  incorrect:
    12,

  shortage:
    9,

  excess:
    9,

  baht:
    8,

  satang:
    8,

  damaged:
    12,

  deteriorated:
    14,

  unnecessary:
    16,

  remark:
    26,
} as const;

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
   THAI MONTHS
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
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   MONTH / YEAR FROM FORM

   วันที่:
   เว้นว่างให้เขียนมือ

   เดือน / ปี:
   ดึงจาก Form
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
   OPTIONAL INSPECTION VALUE

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
      value ?? ""
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
     DATE FROM FORM
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

     วันที่:
     เว้นว่างไว้เขียนมือ

     เดือน / ปี:
     ดึงจาก Form
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
      DOCUMENT_FONT_SIZE
    );

    /* ===============================================
       TITLE
    =============================================== */

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
       DETAIL LINE
    =============================================== */

    const startText =
      "วันที่เริ่มตรวจสอบ";

    const startMonthYear =
      `เดือน ${startDateInfo.month} พ.ศ. ${startDateInfo.year}`;

    const endText =
      "ตรวจสอบแล้วเสร็จวันที่";

    const endMonthYear =
      `เดือน ${endDateInfo.month} พ.ศ. ${endDateInfo.year}`;

    const balanceText =
      `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`;

    /*
     * เว้นพื้นที่เฉพาะช่อง "วันที่"
     */
    const dayBlank =
      7;

    /*
     * เว้นวรรคปกติ 1 ช่องระหว่างข้อความ
     */
    const normalGap =
      doc.getTextWidth(
        " "
      );

    let fontSize =
      DOCUMENT_FONT_SIZE;

    let totalWidth =
      0;

    /*
     * ปรับทั้งบรรทัดพร้อมกัน
     * ไม่ปรับแยกคำ
     */
    do {
      doc.setFontSize(
        fontSize
      );

      totalWidth =
        doc.getTextWidth(
          startText
        ) +
        dayBlank +
        doc.getTextWidth(
          startMonthYear
        ) +
        normalGap +
        doc.getTextWidth(
          endText
        ) +
        dayBlank +
        doc.getTextWidth(
          endMonthYear
        ) +
        normalGap +
        doc.getTextWidth(
          balanceText
        );

      if (
        totalWidth >
        TABLE_WIDTH
      ) {
        fontSize -=
          0.25;
      }
    } while (
      totalWidth >
        TABLE_WIDTH &&
      fontSize >
        11
    );

    doc.setFontSize(
      fontSize
    );

    let x =
      (
        PAGE_WIDTH -
        totalWidth
      ) / 2;

    doc.text(
      startText,
      x,
      21
    );

    x +=
      doc.getTextWidth(
        startText
      );

    /*
     * ช่องเขียนวัน
     */
    x +=
      dayBlank;

    doc.text(
      startMonthYear,
      x,
      21
    );

    x +=
      doc.getTextWidth(
        startMonthYear
      ) +
      normalGap;

    doc.text(
      endText,
      x,
      21
    );

    x +=
      doc.getTextWidth(
        endText
      );

    /*
     * ช่องเขียนวัน
     */
    x +=
      dayBlank;

    doc.text(
      endMonthYear,
      x,
      21
    );

    x +=
      doc.getTextWidth(
        endMonthYear
      ) +
      normalGap;

    doc.text(
      balanceText,
      x,
      21
    );

    return 26;
  }

  /* =======================================================
     INSPECTORS

     ดึงรายชื่อจาก Form โดยตรง

     แสดง:
     ลงชื่อ
     (ชื่อ นามสกุล)
     ตำแหน่งจริง

     ไม่เขียนคำว่า "ตำแหน่ง"
  ======================================================= */

  function drawInspectors(
    doc: jsPDF,
    startY: number
  ) {
    const selectedOfficers =
      inspectorIds.map(
        (
          inspectorId
        ) =>
          officers.find(
            (
              officer
            ) =>
              String(
                officer.id
              ) ===
              inspectorId
          )
      );

    const inspectorAreaWidth =
      TABLE_WIDTH;

    const columnWidth =
      inspectorAreaWidth / 3;

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
      SIGNATURE_FONT_SIZE
    );

    for (
      let index = 0;
      index < 3;
      index++
    ) {
      const officer =
        selectedOfficers[
          index
        ];

      const centerX =
        TABLE_LEFT +
        columnWidth *
          index +
        columnWidth / 2;

      /* =============================================
         SIGN
      ============================================= */

      doc.text(
        "ลงชื่อ ........................................................",
        centerX,
        startY,
        {
          align:
            "center",
        }
      );

      /* =============================================
         NAME
      ============================================= */

      doc.text(
        officer
          ? `(${officer.firstName} ${officer.lastName})`
          : "(                                        )",
        centerX,
        startY + 6,
        {
          align:
            "center",
        }
      );

      /* =============================================
         POSITION

         ไม่มีคำว่า "ตำแหน่ง"
      ============================================= */

      doc.text(
        officer?.position ??
          "",
        centerX,
        startY + 12,
        {
          align:
            "center",
        }
      );
    }
  }

  /* =======================================================
     PREVIEW
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
            <title>ตัวอย่าง PDF</title>

            <style>
              html,
              body {
                margin: 0;
                width: 100%;
                height: 100%;
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
                border-radius: 16px;
                background: #ffffff;
                color: #334155;
                font-size: 16px;
                font-weight: 700;
                box-shadow:
                  0 16px 40px rgba(15, 23, 42, 0.12);
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
      // preview ยังเปิดต่อได้
    }

    return previewWindow;
  }

  /* =======================================================
     EXPORT / PREVIEW PDF
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

         ตารางเป็น Vector จริง
         ไม่แปลงเป็นภาพ
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
         GROUP MATERIALS
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
                .length > 0
          );

      let firstPage =
        true;

      /* =================================================
         CATEGORY LOOP
      ================================================= */

      for (
        const group of groups
      ) {
        /* ===============================================
           สูงสุด 20 รายการต่อหน้า
        =============================================== */

        for (
          let startIndex = 0;
          startIndex <
          group.materials.length;
          startIndex +=
            ROWS_PER_PAGE
        ) {
          /* =============================================
             NEW PAGE
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
           * หมวดแสดงเฉพาะ
           * หน้าแรกของหมวด
           */
          const showCategory =
            startIndex === 0;

          /* =============================================
             TABLE BODY
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
                  /*
                   * ใช้ normal เท่านั้น
                   * ป้องกันภาษาไทยเพี้ยน
                   */
                  font:
                    "2.3.2 THSarabunNew",

                  fontStyle:
                    "normal",

                  fontSize:
                    TABLE_FONT_SIZE,

                  textColor: [
                    0,
                    0,
                    0,
                  ],

                  fillColor: [
                    255,
                    255,
                    255,
                  ],

                  lineColor: [
                    0,
                    0,
                    0,
                  ],

                  lineWidth:
                    0.2,

                  cellPadding:
                    0.4,

                  minCellHeight:
                    BODY_ROW_HEIGHT,

                  halign:
                    "left",

                  valign:
                    "middle",

                  overflow:
                    "hidden",
                },
              },
            ]);
          }

          /* =============================================
             MATERIAL ROWS

             ไม่มีแถวว่างเติมท้าย
          ============================================= */

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
                /* 1 */
                String(
                  order
                ),

                /* 2 */
                material.name,

                /* 3 */
                material.unit ||
                  "-",

                /* =====================================
                   4. OPENING BALANCE

                   กระดาษ A4
                   ต้องเป็น 150
                ===================================== */

                displayStockValue(
                  material.openingBalance
                ),

                /* =====================================
                   5. RECEIVE

                   รับจริงของ FY เท่านั้น

                   กระดาษ A4
                   ต้องเป็น 185

                   ห้ามบวก opening 150
                ===================================== */

                displayStockValue(
                  material.receiveQty
                ),

                /* =====================================
                   6. ISSUE

                   กระดาษ A4
                   ต้องเป็น 310
                ===================================== */

                displayStockValue(
                  material.issueQty
                ),

                /* =====================================
                   7. CURRENT BALANCE

                   กระดาษ A4
                   ต้องเป็น 275
                ===================================== */

                displayStockValue(
                  material.closingBalance
                ),

                /* 8 ถูกต้อง */
                "",

                /* 9 ไม่ถูกต้อง */
                "",

                /* 10 ขาด */
                displayOptionalValue(
                  inspectionRow
                    ?.shortageQty
                ),

                /* 11 เกิน */
                displayOptionalValue(
                  inspectionRow
                    ?.excessQty
                ),

                /* 12 บาท */
                displayOptionalValue(
                  inspectionRow
                    ?.baht
                ),

                /* 13 สต. */
                displayOptionalValue(
                  inspectionRow
                    ?.satang
                ),

                /* 14 ชำรุด */
                displayOptionalValue(
                  inspectionRow
                    ?.damagedQty
                ),

                /* 15 เสื่อมสภาพ */
                displayOptionalValue(
                  inspectionRow
                    ?.deterioratedQty
                ),

                /* 16 ไม่จำเป็นต้องใช้ */
                displayOptionalValue(
                  inspectionRow
                    ?.unnecessaryQty
                ),

                /* 17 หมายเหตุ */
                inspectionRow
                  ?.remark ??
                  "",
              ]);
            }
          );

          /* =============================================
             TABLE

             เส้น Excel-style จริง

             AutoTable theme = grid

             ไม่มี:
             - Canvas
             - Screenshot
             - Image
             - วาดข้อความทับ
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
                 HEAD
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
                    /*
                     * อนุญาต 2 บรรทัดนี้
                     * ตามรูปแบบหัวข้อที่กำหนด
                     *
                     * Font ยังเท่ากัน
                     */
                    content:
                      `คงเหลือยอดยกมาเมื่อ\n30 ก.ย. ${startShortYear}`,

                    rowSpan:
                      2,
                  },

                  {
                    content:
                      `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`,

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
                 ALL CELLS

                 Font ขนาดเดียวกันทั้งหมด
              ========================================= */

              styles: {
                font:
                  "2.3.2 THSarabunNew",

                /*
                 * ห้ามใช้ bold
                 * เพราะ Font bold ไม่ได้ register
                 * และเป็นสาเหตุข้อความไทยเพี้ยน
                 */
                fontStyle:
                  "normal",

                fontSize:
                  TABLE_FONT_SIZE,

                textColor: [
                  0,
                  0,
                  0,
                ],

                fillColor: [
                  255,
                  255,
                  255,
                ],

                /* =====================================
                   เส้นตารางแบบ Grid จริง
                ===================================== */

                lineColor: [
                  0,
                  0,
                  0,
                ],

                lineWidth:
                  0.2,

                cellPadding:
                  0.3,

                minCellHeight:
                  BODY_ROW_HEIGHT,

                halign:
                  "center",

                valign:
                  "middle",

                /*
                 * ไม่ให้ AutoTable เปลี่ยนขนาด Font
                 * และไม่ให้ข้อความวิ่งทับช่องอื่น
                 */
                overflow:
                  "hidden",
              },

              /* =========================================
                 HEADER

                 ใช้ Font size เท่ากับ Body
              ========================================= */

              headStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_FONT_SIZE,

                textColor: [
                  0,
                  0,
                  0,
                ],

                fillColor: [
                  255,
                  255,
                  255,
                ],

                lineColor: [
                  0,
                  0,
                  0,
                ],

                lineWidth:
                  0.2,

                cellPadding:
                  0.3,

                halign:
                  "center",

                valign:
                  "middle",

                overflow:
                  "hidden",
              },

              /* =========================================
                 BODY

                 ใช้ Font size เดียวกัน
              ========================================= */

              bodyStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_FONT_SIZE,

                textColor: [
                  0,
                  0,
                  0,
                ],

                fillColor: [
                  255,
                  255,
                  255,
                ],

                lineColor: [
                  0,
                  0,
                  0,
                ],

                lineWidth:
                  0.2,

                cellPadding:
                  0.3,

                minCellHeight:
                  BODY_ROW_HEIGHT,

                halign:
                  "center",

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
                    COLUMN_WIDTHS.order,
                },

                1: {
                  cellWidth:
                    COLUMN_WIDTHS.item,

                  halign:
                    "left",
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

                  halign:
                    "left",
                },
              },
            }
          );

          /* =============================================
             TABLE FINAL Y
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

             ถ้ามีข้อมูลไม่ครบ 20 แถว
             ลายเซ็นเลื่อนขึ้นตามท้ายตารางทันที
          ============================================= */

          let inspectorStartY =
            finalY + 5;

          /*
           * safety เท่านั้น
           *
           * 20 แถวตาม layout นี้
           * ยังอยู่ใน A4 landscape
           */
          if (
            inspectorStartY +
              15 >
            PAGE_HEIGHT - 3
          ) {
            inspectorStartY =
              PAGE_HEIGHT - 18;
          }

          drawInspectors(
            doc,
            inspectorStartY
          );
        }
      }

      /* =================================================
         PREVIEW

         ไม่ดาวน์โหลดไฟล์
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
        materials.length === 0
      }
    >
      {isExporting
        ? "กำลังเปิด PDF..."
        : "ส่งออก PDF"}
    </AppButton>
  );
}