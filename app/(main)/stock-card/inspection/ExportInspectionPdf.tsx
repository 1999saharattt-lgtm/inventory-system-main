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
   PDF
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
 * หัวกระดาษ 3 บรรทัด
 */
const TABLE_START_Y =
  30;

/*
 * ให้กรรมการอยู่ใกล้ตาราง
 * แต่เว้นช่องไฟ 6 มม.
 */
const SIGNATURE_GAP =
  6;

/*
 * จำนวนรายการจริงต่อหน้า
 * แถวชื่อหมวดไม่ถูกนับ
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
   Asia/Bangkok
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
   OTHER VALUE

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
   PDF DISPLAY ROW
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

/* =========================================================
   BUILD PAGES

   กติกา:
   - 15 รายการพัสดุต่อหน้า
   - ชื่อหมวดขึ้นเฉพาะครั้งแรก
   - ถ้าหมวดเดิมล้นไปหน้าถัดไป
     ไม่เขียนชื่อหมวดซ้ำ
   - ลำดับเริ่มใหม่เมื่อขึ้นหมวดใหม่
========================================================= */

function buildPdfPages(
  materials:
    MaterialRow[]
) {
  const pages:
    PdfDisplayRow[][] =
    [];

  let currentPage:
    PdfDisplayRow[] =
    [];

  let materialCountOnPage =
    0;

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

      /*
       * ชื่อหมวดแสดงเพียงครั้งเดียว
       * ไม่แสดงซ้ำเมื่อขึ้นหน้าใหม่
       */
      let categoryHeaderPrinted =
        false;

      let categoryIndex =
        0;

      for (
        const material of
        categoryMaterials
      ) {
        if (
          materialCountOnPage >=
          ROWS_PER_PAGE
        ) {
          pages.push(
            currentPage
          );

          currentPage =
            [];

          materialCountOnPage =
            0;
        }

        if (
          !categoryHeaderPrinted
        ) {
          currentPage.push(
            {
              type:
                "category",

              category,

              label:
                CATEGORY_NAMES[
                  category
                ] ??
                category,
            }
          );

          categoryHeaderPrinted =
            true;
        }

        categoryIndex +=
          1;

        currentPage.push(
          {
            type:
              "material",

            category,

            categoryIndex,

            material,
          }
        );

        materialCountOnPage +=
          1;
      }
    }
  );

  if (
    currentPage.length >
    0
  ) {
    pages.push(
      currentPage
    );
  }

  return pages;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportInspectionPdf({
  fiscalYear,
  startShortYear,
  endShortYear,
  inspectionDate: _inspectionDate,
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

     วัน = เว้นช่องว่าง
     เดือน/ปี = เดือนและปีปัจจุบัน

     ปี 30 กันยายน
     ใช้ fiscalYear ตามปีงบประมาณที่เลือก
     ไม่ hardcode
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
      14
    );

    doc.text(
      `ตรวจสอบเมื่อวันที่ .................... เดือน ${monthName} พ.ศ. ${buddhistYear}`,
      center,
      8,
      {
        align:
          "center",
      }
    );

    doc.text(
      `เสร็จเมื่อวันที่ .................... เดือน ${monthName} พ.ศ. ${buddhistYear}`,
      center,
      14,
      {
        align:
          "center",
      }
    );

    doc.text(
      `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`,
      center,
      20,
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

      const officer =
        getOfficer(
          selectedInspectorId,
          officers
        );

      const inspectorName =
        officer
          ? `${officer.firstName} ${officer.lastName}`.trim()
          : "................................";

      const inspectorPosition =
        officer
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

      doc.text(
        `(${inspectorName})`,
        centerX,
        startY +
          5,
        {
          align:
            "center",
        }
      );

      doc.text(
        inspectorPosition,
        centerX,
        startY +
          10,
        {
          align:
            "center",
        }
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
          ];

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

               ใช้ TH Sarabun normal เท่านั้น
               ป้องกันภาษาไทยเพี้ยนจาก fontStyle bold
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

            /*
             * PDF ไม่แสดงเครื่องหมายถูก
             * ช่องถูกต้อง / ไม่ถูกต้องเป็นช่องว่าง
             */
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
           HEADER TEXT
        ================================================= */

        const openingHeaderLines =
          [
            "คงเหลือยอดยกมา",
            `เมื่อ 30 ก.ย. ${startShortYear}`,
          ];

        /*
         * วันรับ / จ่าย อยู่บรรทัดเดียว
         */
        const movementHeaderLines =
          [
            `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`,
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
                    movementHeaderLines[
                      0
                    ],

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
                0.45,

              minCellHeight:
                6.5,

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

              fontSize:
                7.5,

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

              halign:
                "center",

              valign:
                "middle",
            },

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
              },
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

           ต่อจากตาราง + 6 มม.
           ไม่บังคับลงไปที่ตำแหน่ง 170 แล้ว
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