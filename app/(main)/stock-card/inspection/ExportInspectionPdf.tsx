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

  inspectionDate: string;

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

const CATEGORY_NAMES:
  Record<
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

/*
 * หัวกระดาษบรรทัดเดียว
 */
const HEADER_Y =
  14;

/*
 * เว้นหัวกระดาษกับตารางเล็กน้อย
 */
const TABLE_START_Y =
  20;

/*
 * เว้นพื้นที่ลงชื่อมากขึ้น
 */
const SIGNATURE_GAP =
  22;

/*
 * 15 รายการต่อหน้า
 */
const ROWS_PER_PAGE =
  15;

/* =========================================================
   COLUMN WIDTHS

   รวมทั้งหมด = 285 mm

   ขยาย "รายการพัสดุ"
   ลดช่องที่กว้างเกินความจำเป็น
========================================================= */

const COLUMN_WIDTHS = {
  order:
    7,

  /*
   * เดิม 48
   * เพิ่มเป็น 62 เพื่อให้ชื่อพัสดุอยู่บรรทัดเดียวได้มากขึ้น
   */
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
   CURRENT THAI MONTH / YEAR
========================================================= */

function getCurrentThaiMonthYear() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "numeric",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    Number(
      parts.find(
        (
          part
        ) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (
          part
        ) =>
          part.type ===
          "month"
      )?.value
    );

  return {
    monthName:
      THAI_MONTHS[
        month -
          1
      ] ||
      "",

    buddhistYear:
      year +
      543,
  };
}

/* =========================================================
   STOCK NUMBER

   0 / ไม่มีค่า = "-"
========================================================= */

function formatStockNumber(
  value:
    number |
    string
) {
  const numberValue =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue ===
      0
  ) {
    return "-";
  }

  return numberValue.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   OTHER INPUT

   ไม่มีค่า / 0 = ช่องว่าง
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

  if (
    !clean
  ) {
    return "";
  }

  const numberValue =
    Number(
      clean
    );

  if (
    Number.isFinite(
      numberValue
    ) &&
    numberValue ===
      0
  ) {
    return "";
  }

  return clean;
}

/* =========================================================
   SINGLE LINE FONT SIZE

   ลด font อัตโนมัติ
   เพื่อให้ข้อความอยู่บรรทัดเดียว
   และไม่ถูกตัด
========================================================= */

function getSingleLineFontSize(
  doc:
    jsPDF,

  text:
    string,

  width:
    number,

  maxSize =
    8,

  minSize =
    4.5,

  padding =
    2
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

  const availableWidth =
    Math.max(
      width -
        padding,
      1
    );

  let fontSize =
    maxSize;

  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
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

    fontSize -=
      0.25;
  }

  return minSize;
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
   PDF ROW
========================================================= */

type PdfCategoryRow = {
  type:
    "category";

  category:
    string;

  label:
    string;
};

type PdfMaterialRow = {
  type:
    "material";

  category:
    string;

  categoryIndex:
    number;

  material:
    MaterialRow;
};

type PdfDisplayRow =
  | PdfCategoryRow
  | PdfMaterialRow;

type PdfPage = {
  category:
    string;

  rows:
    PdfDisplayRow[];
};

/* =========================================================
   BUILD PDF PAGES

   - แต่ละหมวดขึ้นหน้าใหม่
   - ชื่อหมวดขึ้นเฉพาะหน้าแรกของหมวด
   - หมวดเดิมหน้าที่ 2 ไม่ขึ้นชื่อหมวดซ้ำ
   - ลำดับเริ่มใหม่ทุกหมวด
   - 15 รายการต่อหน้า
========================================================= */

function buildPdfPages(
  materials:
    MaterialRow[]
): PdfPage[] {
  const pages:
    PdfPage[] =
    [];

  CATEGORY_ORDER.forEach(
    (
      category
    ) => {
      const categoryMaterials =
        materials.filter(
          (
            material
          ) =>
            material.category ===
            category
        );

      if (
        categoryMaterials.length ===
        0
      ) {
        return;
      }

      const categoryLabel =
        CATEGORY_NAMES[
          category
        ] ??
        category;

      let categoryIndex =
        0;

      for (
        let start =
          0;

        start <
        categoryMaterials.length;

        start +=
          ROWS_PER_PAGE
      ) {
        const chunk =
          categoryMaterials.slice(
            start,
            start +
              ROWS_PER_PAGE
          );

        const pageRows:
          PdfDisplayRow[] =
          [];

        /*
         * ชื่อหมวดขึ้นเฉพาะหน้าแรก
         */
        if (
          start ===
          0
        ) {
          pageRows.push(
            {
              type:
                "category",

              category,

              label:
                categoryLabel,
            }
          );
        }

        chunk.forEach(
          (
            material
          ) => {
            categoryIndex +=
              1;

            pageRows.push(
              {
                type:
                  "material",

                category,

                categoryIndex,

                material,
              }
            );
          }
        );

        pages.push(
          {
            category,

            rows:
              pageRows,
          }
        );
      }
    }
  );

  return pages;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportInspectionPdf({
  fiscalYear,
  startShortYear,
  endShortYear,
  inspectionDate:
    _inspectionDate,
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
     HEADER
  ======================================================= */

  function drawDocumentHeader(
    doc:
      jsPDF
  ) {
    const center =
      PAGE_WIDTH /
      2;

    const {
      monthName,
      buddhistYear,
    } =
      getCurrentThaiMonthYear();

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
      13.5
    );

    const headerText =
      `ตรวจสอบเมื่อวันที่    เดือน ${monthName} พ.ศ. ${buddhistYear} ` +
      `เสร็จเมื่อวันที่    เดือน ${monthName} พ.ศ. ${buddhistYear}` +
      `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`;

    doc.text(
      headerText,
      center,
      HEADER_Y,
      {
        align:
          "center",
      }
    );
  }

  /* =======================================================
     INSPECTORS

     ไม่แสดง:
     - ประธานกรรมการ
     - กรรมการคนที่ 1
     - กรรมการคนที่ 2

     เหลือ:
     - ลงชื่อ
     - ชื่อ-นามสกุล
     - ตำแหน่ง
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
      const officer =
        getOfficer(
          inspectorIds[
            index
          ] ||
            "",
          officers
        );

      const name =
        officer
          ? `${officer.firstName} ${officer.lastName}`.trim()
          : "................................";

      const position =
        officer
          ?.position ||
        "................................";

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

      /*
       * ช่องสำหรับลงลายมือชื่อ
       */
      doc.text(
        `ลงชื่อ ${dotLine}`,
        centerX,
        startY,
        {
          align:
            "center",
        }
      );

      /*
       * ชื่อ
       */
      doc.text(
        `(${name})`,
        centerX,
        startY +
          6,
        {
          align:
            "center",
        }
      );

      /*
       * ตำแหน่ง
       */
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
     EXPORT
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
        "ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up"
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
            true,
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      const pages =
        buildPdfPages(
          materials
        );

      for (
        let pageIndex =
          0;

        pageIndex <
        pages.length;

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

        const pageRows =
          pages[
            pageIndex
          ].rows;

        const body:
          (
            | string
            | {
                content:
                  string;

                colSpan?:
                  number;

                styles?:
                  Record<
                    string,
                    unknown
                  >;
              }
          )[][] =
          [];

        pageRows.forEach(
          (
            displayRow
          ) => {
            /* =============================================
               CATEGORY
            ============================================= */

            if (
              displayRow.type ===
              "category"
            ) {
              body.push(
                [
                  {
                    content:
                      displayRow.label,

                    colSpan:
                      17,

                    styles: {
                      font:
                        "2.3.2 THSarabunNew",

                      /*
                       * ใช้ normal
                       * ป้องกันฟอนต์ภาษาไทยเพี้ยน
                       */
                      fontStyle:
                        "normal",

                      fontSize:
                        11,

                      halign:
                        "left",

                      valign:
                        "middle",

                      fillColor: [
                        226,
                        232,
                        240,
                      ],

                      textColor: [
                        15,
                        23,
                        42,
                      ],

                      cellPadding: {
                        top:
                          1,

                        right:
                          1,

                        bottom:
                          1,

                        left:
                          2,
                      },
                    },
                  },
                ]
              );

              return;
            }

            const material =
              displayRow.material;

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

            body.push(
              [
                String(
                  displayRow.categoryIndex
                ),

                material.name ||
                  "",

                material.unit ||
                  "",

                formatStockNumber(
                  material.openingBalance
                ),

                formatStockNumber(
                  material.receiveQty
                ),

                formatStockNumber(
                  material.issueQty
                ),

                formatStockNumber(
                  material.closingBalance
                ),

                /*
                 * PDF ไม่แสดงติ๊กถูก
                 */
                "",

                "",

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

                row.remark?.trim() ||
                  "",
              ]
            );
          }
        );

        /* =================================================
           TABLE HEADER
        ================================================= */

        const openingHeaderLines =
          [
            "คงเหลือยอดยกมา",
            `เมื่อ 30 ก.ย. ${startShortYear}`,
          ];

        const movementHeaderText =
          `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`;

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
                    movementHeaderText,

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
                    "ถ้าไม่ถูกต้องจำนวนที่ขาด\nจำนวนที่เกินคิดเป็นร้อยละ",

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
                0.4,

              minCellHeight:
                6.5,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "linebreak",
            },

            /* =============================================
               TABLE HEADER

               เดิม 7.5
               เพิ่มขึ้น 1 size = 8.5
            ============================================= */

            headStyles: {
              font:
                "2.3.2 THSarabunNew",

              fontStyle:
                "normal",

              fontSize:
                8.5,

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
                0.4,

              minCellHeight:
                6.5,

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
              },

              1: {
                cellWidth:
                  COLUMN_WIDTHS.item,

                halign:
                  "left",

                cellPadding: {
                  top:
                    0.35,

                  right:
                    0.6,

                  bottom:
                    0.35,

                  left:
                    1.2,
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
              /*
               * รายการพัสดุ:
               * อยู่บรรทัดเดียวเสมอ
               * ลด font อัตโนมัติเมื่อชื่อยาว
               */
              if (
                data.section ===
                  "body" &&
                data.column.index ===
                  1 &&
                typeof data.cell.raw ===
                  "string"
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

                data.cell.styles.font =
                  "2.3.2 THSarabunNew";

                data.cell.styles.fontStyle =
                  "normal";

                data.cell.styles.fontSize =
                  getSingleLineFontSize(
                    doc,
                    text,
                    COLUMN_WIDTHS.item,
                    8,
                    4.5,
                    2.2
                  );

                data.cell.styles.halign =
                  "left";

                data.cell.styles.valign =
                  "middle";

                data.cell.styles.overflow =
                  "hidden";
              }

              /*
               * หน่วยนับ:
               * อยู่บรรทัดเดียว
               */
              if (
                data.section ===
                  "body" &&
                data.column.index ===
                  2 &&
                typeof data.cell.raw ===
                  "string"
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
                    5,
                    1
                  );

                data.cell.styles.overflow =
                  "hidden";
              }

              /*
               * หมายเหตุ:
               * พยายามให้อยู่บรรทัดเดียว
               */
              if (
                data.section ===
                  "body" &&
                data.column.index ===
                  16 &&
                typeof data.cell.raw ===
                  "string"
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
                    1.5
                  );

                data.cell.styles.overflow =
                  "hidden";
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
          }
        );

        /* =================================================
           SIGNATURE

           เว้นลงมาจากตารางมากขึ้น
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
          tableFinalY +
          SIGNATURE_GAP;

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