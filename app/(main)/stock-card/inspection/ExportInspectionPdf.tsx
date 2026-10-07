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
   * ยอดยกเข้าระบบ ณ วันที่ 1 ต.ค.
   *
   * ตัวอย่าง FY2569:
   * ยอดยกเข้าระบบ 1 ต.ค. 68
   *
   * แสดงในช่อง:
   * คงเหลือยอดยกมาเมื่อ 30 ก.ย. 68
   */
  openingBalance: number;

  /*
   * รับจริงภายในปีงบประมาณเท่านั้น
   *
   * ไม่รวม OPENING_BALANCE
   */
  receiveQty: number;

  /*
   * จ่ายจริง APPROVED ภายในปีงบประมาณ
   */
  issueQty: number;

  /*
   * คงเหลือจริงตาม Stock Card ปัจจุบัน
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
   PDF
========================================================= */

const PAGE_WIDTH_MM =
  297;

const PAGE_HEIGHT_MM =
  210;

const TABLE_WIDTH_MM =
  285;

const MARGIN_X_MM =
  (
    PAGE_WIDTH_MM -
    TABLE_WIDTH_MM
  ) / 2;

/*
 * สูงสุด 15 "รายการ" ต่อหน้า
 *
 * แถวชื่อหมวดไม่ถือเป็นรายการ
 */
const ROWS_PER_PAGE =
  15;

/*
 * ความสูงแถวประมาณมาตรฐานเดิม
 * 23.25 px
 *
 * 23.25 × 25.4 / 96
 */
const BODY_ROW_HEIGHT_MM =
  6.1515625;

/* =========================================================
   FONT SIZE

   PDF ใช้ point
========================================================= */

const DOCUMENT_HEADER_FONT_SIZE =
  15;

const TABLE_HEADER_MAX_FONT_SIZE =
  14;

const TABLE_HEADER_MIN_FONT_SIZE =
  6.5;

const TABLE_BODY_MAX_FONT_SIZE =
  12;

const TABLE_BODY_MIN_FONT_SIZE =
  6.5;

const CATEGORY_MAX_FONT_SIZE =
  14;

const SIGNATURE_MAX_FONT_SIZE =
  12;

/* =========================================================
   SPACING
========================================================= */

const SIGNATURE_GAP_MM =
  7;

const DAY_WRITE_SPACE_MM =
  9;

/* =========================================================
   COLUMN WIDTH

   รวม = 285 mm
========================================================= */

const COLUMN_WIDTHS = {
  order:
    7,

  item:
    62,

  unit:
    12,

  opening:
    22,

  receive:
    14,

  issue:
    14,

  closing:
    15,

  correct:
    10,

  incorrect:
    13,

  shortage:
    11,

  excess:
    11,

  baht:
    10,

  satang:
    10,

  damaged:
    14,

  deteriorated:
    15,

  unnecessary:
    18,

  remark:
    27,
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
   MONTH + YEAR

   วันไม่ใช้
   เพราะ PDF เว้นไว้เขียนมือ

   แต่:
   - เดือน
   - พ.ศ.

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
   STOCK VALUE

   ค่า 0
   =
   -
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

   ช่องตรวจสอบ
   0 / ไม่มีค่า
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
   CELL TEXT
========================================================= */

function getCellText(
  cell: any
) {
  if (
    Array.isArray(
      cell?.text
    )
  ) {
    return cell.text
      .map(
        (
          value: unknown
        ) =>
          String(
            value ?? ""
          )
      )
      .join(
        "\n"
      );
  }

  if (
    cell?.text !==
    undefined &&
    cell?.text !==
    null
  ) {
    return String(
      cell.text
    );
  }

  return "";
}

/* =========================================================
   FIT FONT SIZE

   ลดขนาดอัตโนมัติ
   เพื่อไม่ให้ข้อความ:
   - ซ้อน
   - หลุดช่อง
   - ตกหล่น

   รองรับ \n ที่เรากำหนดเอง
========================================================= */

function getFitFontSize(
  doc: jsPDF,
  text: string,
  width: number,
  maxSize: number,
  minSize: number,
  horizontalPadding = 0.8
) {
  const cleanLines =
    String(
      text ?? ""
    )
      .split(
        "\n"
      )
      .map(
        (
          line
        ) =>
          line
            .replace(
              /\s+/g,
              " "
            )
            .trim()
      )
      .filter(
        Boolean
      );

  if (
    cleanLines.length ===
    0
  ) {
    return maxSize;
  }

  const availableWidth =
    Math.max(
      1,
      width -
        horizontalPadding *
          2
    );

  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  for (
    let fontSize =
      maxSize;
    fontSize >=
    minSize;
    fontSize -=
      0.25
  ) {
    doc.setFontSize(
      fontSize
    );

    const fits =
      cleanLines.every(
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
  }

  return minSize;
}

/* =========================================================
   BOLD EFFECT

   Font ที่ระบบใช้อยู่ลงทะเบียนเป็น normal

   เพื่อให้ภาษาไทยไม่เสีย
   จึงจำลองความหนาด้วยการวาดทับเล็กน้อย
   แทนการสลับไป font ที่อาจไม่มี glyph ภาษาไทย
========================================================= */

function redrawCellAsBold(
  doc: jsPDF,
  data: any,
  align:
    | "left"
    | "center" =
    "center"
) {
  const lines =
    Array.isArray(
      data.cell.text
    )
      ? data.cell.text.map(
          (
            value: unknown
          ) =>
            String(
              value ?? ""
            )
        )
      : [
          String(
            data.cell.text ??
              ""
          ),
        ];

  if (
    lines.every(
      (
        line: string
      ) =>
        !line.trim()
    )
  ) {
    return;
  }

  const fontSize =
    Number(
      data.cell.styles
        .fontSize ??
        10
    );

  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  doc.setFontSize(
    fontSize
  );

  doc.setTextColor(
    0,
    0,
    0
  );

  const lineHeight =
    fontSize *
    0.352778 *
    0.92;

  const blockHeight =
    lines.length *
    lineHeight;

  const startY =
    data.cell.y +
    data.cell.height /
      2 -
    blockHeight /
      2 +
    lineHeight *
      0.72;

  if (
    align ===
    "left"
  ) {
    const x =
      data.cell.x +
      1.2;

    lines.forEach(
      (
        line: string,
        index: number
      ) => {
        const y =
          startY +
          index *
            lineHeight;

        doc.text(
          line,
          x + 0.055,
          y
        );
      }
    );

    return;
  }

  const centerX =
    data.cell.x +
    data.cell.width /
      2;

  lines.forEach(
    (
      line: string,
      index: number
    ) => {
      const y =
        startY +
        index *
          lineHeight;

      doc.text(
        line,
        centerX +
          0.055,
        y,
        {
          align:
            "center",
        }
      );
    }
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
     MONTH / YEAR FROM FORM
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
     HEADER DETAIL

     สำคัญ:
     เว้นเฉพาะ "วันที่" สำหรับเขียนมือ

     เดือน + ปี
     ใช้ค่าจาก Form

     ไม่ใช้การพิมพ์ space หลายตัว
     แต่ใช้ช่องว่างจริงตามตำแหน่ง X
  ======================================================= */

  function drawDateAndBalanceLine(
    doc: jsPDF,
    y: number
  ) {
    const firstText =
      "วันที่เริ่มตรวจสอบ";

    const secondText =
      `เดือน ${startDateInfo.month} พ.ศ. ${startDateInfo.year}`;

    const thirdText =
      "ตรวจสอบแล้วเสร็จวันที่";

    const fourthText =
      `เดือน ${endDateInfo.month} พ.ศ. ${endDateInfo.year}`;

    const fifthText =
      `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`;

    /*
     * มีช่องเขียนวัน 2 จุด
     * แต่ข้อความแต่ละส่วนใช้ช่องไฟปกติ
     */
    let fontSize =
      DOCUMENT_HEADER_FONT_SIZE;

    const minFontSize =
      10;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    let widths:
      | {
          first: number;
          second: number;
          third: number;
          fourth: number;
          fifth: number;
          space: number;
        }
      | undefined;

    while (
      fontSize >=
      minFontSize
    ) {
      doc.setFontSize(
        fontSize
      );

      widths = {
        first:
          doc.getTextWidth(
            firstText
          ),

        second:
          doc.getTextWidth(
            secondText
          ),

        third:
          doc.getTextWidth(
            thirdText
          ),

        fourth:
          doc.getTextWidth(
            fourthText
          ),

        fifth:
          doc.getTextWidth(
            fifthText
          ),

        space:
          doc.getTextWidth(
            " "
          ),
      };

      const totalWidth =
        widths.first +
        DAY_WRITE_SPACE_MM +
        widths.second +
        widths.space +
        widths.third +
        DAY_WRITE_SPACE_MM +
        widths.fourth +
        widths.space +
        widths.fifth;

      if (
        totalWidth <=
        TABLE_WIDTH_MM
      ) {
        break;
      }

      fontSize -=
        0.25;
    }

    doc.setFontSize(
      fontSize
    );

    if (!widths) {
      return;
    }

    const totalWidth =
      widths.first +
      DAY_WRITE_SPACE_MM +
      widths.second +
      widths.space +
      widths.third +
      DAY_WRITE_SPACE_MM +
      widths.fourth +
      widths.space +
      widths.fifth;

    let x =
      (
        PAGE_WIDTH_MM -
        totalWidth
      ) / 2;

    /* ===============================================
       วันที่เริ่มตรวจสอบ
    =============================================== */

    doc.text(
      firstText,
      x,
      y
    );

    x +=
      widths.first;

    /*
     * ช่องว่างสำหรับเขียนเลขวันที่
     */
    x +=
      DAY_WRITE_SPACE_MM;

    /* ===============================================
       เดือน + ปี เริ่มตรวจ
    =============================================== */

    doc.text(
      secondText,
      x,
      y
    );

    x +=
      widths.second +
      widths.space;

    /* ===============================================
       ตรวจสอบแล้วเสร็จวันที่
    =============================================== */

    doc.text(
      thirdText,
      x,
      y
    );

    x +=
      widths.third;

    /*
     * ช่องว่างสำหรับเขียนเลขวันที่
     */
    x +=
      DAY_WRITE_SPACE_MM;

    /* ===============================================
       เดือน + ปี ตรวจเสร็จ
    =============================================== */

    doc.text(
      fourthText,
      x,
      y
    );

    x +=
      widths.fourth +
      widths.space;

    /* ===============================================
       เป็นยอดคงเหลือ...
    =============================================== */

    doc.text(
      fifthText,
      x,
      y
    );
  }

  /* =======================================================
     DOCUMENT HEADER
  ======================================================= */

  function drawDocumentHeader(
    doc: jsPDF
  ) {
    const center =
      PAGE_WIDTH_MM / 2;

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
       LINE 1
    =============================================== */

    doc.setFontSize(
      DOCUMENT_HEADER_FONT_SIZE
    );

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      center,
      9,
      {
        align:
          "center",
      }
    );

    /* ===============================================
       LINE 2
    =============================================== */

    doc.setFontSize(
      DOCUMENT_HEADER_FONT_SIZE
    );

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      16,
      {
        align:
          "center",
      }
    );

    /* ===============================================
       LINE 3

       เว้นเฉพาะ "วัน"

       เช่น ถ้า Form เลือก
       7 ตุลาคม 2569

       PDF แสดง:
       วันที่เริ่มตรวจสอบ [ว่าง] เดือน ตุลาคม พ.ศ. 2569
    =============================================== */

    drawDateAndBalanceLine(
      doc,
      24
    );

    /*
     * จุดเริ่มตาราง
     */
    return 30;
  }

  /* =======================================================
     INSPECTORS

     แสดงทุกหน้า
     หลังตารางของหน้านั้นทันที
  ======================================================= */

  function drawInspectors(
    doc: jsPDF,
    startY: number
  ) {
    const selectedOfficers =
      inspectorIds.map(
        (
          id
        ) =>
          officers.find(
            (
              officer
            ) =>
              String(
                officer.id
              ) ===
              id
          )
      );

    const columnWidth =
      TABLE_WIDTH_MM /
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
        MARGIN_X_MM +
        columnWidth *
          index +
        columnWidth /
          2;

      /* =============================================
         SIGN
      ============================================= */

      doc.setFontSize(
        11
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

      /* =============================================
         NAME
      ============================================= */

      const name =
        officer
          ? `(${officer.firstName} ${officer.lastName})`
          : "(                                        )";

      const nameFontSize =
        getFitFontSize(
          doc,
          name,
          columnWidth -
            6,
          SIGNATURE_MAX_FONT_SIZE,
          8
        );

      doc.setFontSize(
        nameFontSize
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

      /* =============================================
         POSITION
      ============================================= */

      const position =
        officer?.position ||
        "";

      const positionFontSize =
        getFitFontSize(
          doc,
          position,
          columnWidth -
            6,
          SIGNATURE_MAX_FONT_SIZE,
          8
        );

      doc.setFontSize(
        positionFontSize
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
  }

  /* =======================================================
     PREVIEW WINDOW
  ======================================================= */

  function openPreviewWindow() {
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
              กำลังเปิดตัวอย่าง PDF
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
                font-family:
                  Arial,
                  Tahoma,
                  sans-serif;
              }

              .loading {
                padding: 18px 24px;
                border-radius: 16px;
                background: #ffffff;
                color: #334155;
                font-size: 16px;
                font-weight: 700;
                box-shadow:
                  0 14px 40px
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
      /*
       * ถ้า browser ไม่อนุญาตแก้หน้า loading
       * ยังสร้าง PDF ต่อได้
       */
    }

    return previewWindow;
  }

  /* =======================================================
     EXPORT / PREVIEW
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

    /*
     * เปิด Tab ทันทีจาก click
     * เพื่อไม่ให้ browser block
     */
    const previewWindow =
      openPreviewWindow();

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

         compress false
         =
         เปิด Preview ได้เร็วกว่า
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
         GROUP BY CATEGORY
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
         CATEGORY

         หมวดใหม่
         =
         หน้าใหม่
      ================================================= */

      for (
        const group of
          groups
      ) {
        /*
         * แบ่งสูงสุด 15 รายการต่อหน้า
         */
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
            drawDocumentHeader(
              doc
            );

          const pageMaterials =
            group.materials.slice(
              startIndex,
              startIndex +
                ROWS_PER_PAGE
            );

          /* =============================================
             BODY

             แถวแรก
             =
             ชื่อหมวด

             หลังจากนั้น
             =
             รายการจริงเท่านั้น

             ไม่มีการเติม blank row
          ============================================= */

          const body: any[] = [
            [
              {
                content:
                  group.name,

                colSpan:
                  17,

                styles: {
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

                  font:
                    "2.3.2 THSarabunNew",

                  fontStyle:
                    "normal",

                  fontSize:
                    CATEGORY_MAX_FONT_SIZE,

                  minCellHeight:
                    BODY_ROW_HEIGHT_MM,

                  halign:
                    "left",

                  valign:
                    "middle",

                  cellPadding:
                    0.5,
                },
              },
            ],
          ];

          /* =============================================
             DATA ROW

             ลำดับต่อเนื่องภายในหมวด
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
                String(
                  order
                ),

                material.name,

                material.unit ||
                  "-",

                /*
                 * IMPORTANT
                 *
                 * นี่คือยอดยกเข้าระบบ
                 * ณ 1 ต.ค. ของปีนั้น
                 *
                 * FY2569:
                 * ยอดยกเข้าระบบ 01 ต.ค.68
                 *
                 * แสดงใต้หัว:
                 * 30 ก.ย.68
                 */
                displayStockValue(
                  material.openingBalance
                ),

                /*
                 * รับจริงเท่านั้น
                 *
                 * ไม่บวก openingBalance
                 */
                displayStockValue(
                  material.receiveQty
                ),

                /*
                 * จ่ายจริง APPROVED
                 * ภายใน FY เท่านั้น
                 */
                displayStockValue(
                  material.issueQty
                ),

                /*
                 * คงเหลือจริงปัจจุบัน
                 */
                displayStockValue(
                  material.closingBalance
                ),

                /*
                 * ถูกต้อง / ไม่ถูกต้อง
                 *
                 * PDF กระดาษตรวจ
                 * ยังเว้นว่างไว้
                 */
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
             TABLE
          ============================================= */

          autoTable(
            doc,
            {
              startY:
                tableStartY,

              margin: {
                top:
                  tableStartY,

                left:
                  MARGIN_X_MM,

                right:
                  MARGIN_X_MM,

                bottom:
                  8,
              },

              tableWidth:
                TABLE_WIDTH_MM,

              theme:
                "grid",

              /*
               * เราแบ่งหน้าเอง
               * สูงสุด 15 รายการ
               */
              pageBreak:
                "avoid",

              rowPageBreak:
                "avoid",

              /* =========================================
                 TABLE HEADER
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
                 BASE
              ========================================= */

              styles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_BODY_MAX_FONT_SIZE,

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
                  0.2,

                cellPadding:
                  0.3,

                minCellHeight:
                  BODY_ROW_HEIGHT_MM,

                halign:
                  "center",

                valign:
                  "middle",

                /*
                 * ไม่ปล่อยให้ AutoTable
                 * ตัดขึ้นบรรทัดใหม่เอง
                 */
                overflow:
                  "hidden",
              },

              /* =========================================
                 HEADER

                 สูงสุด 14
                 ถ้าข้อความยาวจะลดอัตโนมัติ
              ========================================= */

              headStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_HEADER_MAX_FONT_SIZE,

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
                  "hidden",
              },

              /* =========================================
                 BODY

                 สูงสุด 12
              ========================================= */

              bodyStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_BODY_MAX_FONT_SIZE,

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
                  0.2,

                cellPadding:
                  0.3,

                minCellHeight:
                  BODY_ROW_HEIGHT_MM,

                valign:
                  "middle",

                overflow:
                  "hidden",
              },

              /* =========================================
                 WIDTH
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

              /* =========================================
                 AUTO FIT FONT
              ========================================= */

              didParseCell: (
                data: any
              ) => {
                const text =
                  getCellText(
                    data.cell
                  );

                const width =
                  Number(
                    data.cell.width ??
                      0
                  );

                /* =====================================
                   TABLE HEADER
                ===================================== */

                if (
                  data.section ===
                  "head"
                ) {
                  const fitted =
                    getFitFontSize(
                      doc,
                      text,
                      width,
                      TABLE_HEADER_MAX_FONT_SIZE,
                      TABLE_HEADER_MIN_FONT_SIZE,
                      0.5
                    );

                  data.cell.styles.fontSize =
                    fitted;

                  /*
                   * หัวแถวบนสูงพอสำหรับ
                   * ข้อความ 1-2 บรรทัดที่กำหนดเอง
                   */
                  data.cell.styles.minCellHeight =
                    data.row.index ===
                    0
                      ? 9
                      : 6.5;

                  return;
                }

                /* =====================================
                   CATEGORY ROW

                   body row 0
                   ของแต่ละหน้า
                ===================================== */

                if (
                  data.section ===
                    "body" &&
                  data.row.index ===
                    0
                ) {
                  data.cell.styles.fontSize =
                    getFitFontSize(
                      doc,
                      text,
                      width,
                      CATEGORY_MAX_FONT_SIZE,
                      9,
                      1
                    );

                  data.cell.styles.minCellHeight =
                    BODY_ROW_HEIGHT_MM;

                  data.cell.styles.fillColor = [
                    255,
                    255,
                    255,
                  ];

                  data.cell.styles.halign =
                    "left";

                  return;
                }

                /* =====================================
                   NORMAL BODY
                ===================================== */

                if (
                  data.section ===
                  "body"
                ) {
                  data.cell.styles.fontSize =
                    getFitFontSize(
                      doc,
                      text,
                      width,
                      TABLE_BODY_MAX_FONT_SIZE,
                      TABLE_BODY_MIN_FONT_SIZE,
                      0.45
                    );

                  data.cell.styles.minCellHeight =
                    BODY_ROW_HEIGHT_MM;
                }
              },

              /* =========================================
                 VISUAL BOLD

                 หัวตาราง + ชื่อหมวด
              ========================================= */

              didDrawCell: (
                data: any
              ) => {
                if (
                  data.section ===
                  "head"
                ) {
                  redrawCellAsBold(
                    doc,
                    data,
                    "center"
                  );

                  return;
                }

                if (
                  data.section ===
                    "body" &&
                  data.row.index ===
                    0
                ) {
                  redrawCellAsBold(
                    doc,
                    data,
                    "left"
                  );
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
             SIGNATURE

             ถ้ามี 4 แถว
             ก็ลงชื่อถัดจากแถวที่ 4 เลย

             ไม่ลากตารางให้ครบ 15
          ============================================= */

          const signatureY =
            finalY +
            SIGNATURE_GAP_MM;

          /*
           * ด้วยการจำกัด 15 รายการ/หน้า
           * ส่วนลงชื่อจะอยู่ใน A4 landscape
           */
          if (
            signatureY +
              18 <=
            PAGE_HEIGHT_MM -
              5
          ) {
            drawInspectors(
              doc,
              signatureY
            );
          } else {
            /*
             * Safety fallback
             *
             * ปกติไม่ควรเข้ากรณีนี้
             * เพราะจำกัด 15 รายการแล้ว
             */
            doc.addPage(
              "a4",
              "landscape"
            );

            drawDocumentHeader(
              doc
            );

            drawInspectors(
              doc,
              55
            );
          }
        }
      }

      /* =================================================
         PREVIEW

         ไม่ download

         เปิด Browser PDF Viewer ทันที
      ================================================= */

      const pdfBlob =
        doc.output(
          "blob"
        );

      const previewUrl =
        URL.createObjectURL(
          pdfBlob
        );

      previewWindow.location.replace(
        previewUrl
      );

      /*
       * คืน memory หลัง Viewer โหลดแล้ว
       */
      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            previewUrl
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

      previewWindow.close();

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