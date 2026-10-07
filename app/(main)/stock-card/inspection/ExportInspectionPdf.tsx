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

  /*
   * รับ props ไว้เพื่อไม่กระทบ
   * InspectionForm เดิม
   *
   * แต่ PDF จะเว้นวันที่
   * สำหรับเขียนมือ
   */
  inspectionStartDate: string;
  inspectionEndDate: string;

  inspectorIds: string[];

  officers: Officer[];
};

/* =========================================================
   PDF PAGE
========================================================= */

const PAGE_WIDTH_MM =
  297;

const TABLE_WIDTH_MM =
  285;

const MARGIN_X_MM =
  (
    PAGE_WIDTH_MM -
    TABLE_WIDTH_MM
  ) / 2;

/*
 * Excel row height
 *
 * 23.25 px
 * ที่ 96 DPI
 * =
 * 6.1515625 mm
 */
const EXCEL_ROW_HEIGHT_PX =
  23.25;

const BODY_ROW_HEIGHT_MM =
  (
    EXCEL_ROW_HEIGHT_PX *
    25.4
  ) / 96;

/*
 * ตามที่กำหนด:
 * Font ตาราง = 15
 */
const TABLE_FONT_SIZE =
  15;

/*
 * หัวกระดาษทุกบรรทัด
 * ขนาดเดียวกัน
 */
const HEADER_FONT_SIZE =
  15;

/*
 * เว้นตารางกับลายเซ็น
 */
const SIGNATURE_GAP_MM =
  22;

/* =========================================================
   TABLE WIDTH

   รวม = 285 mm

   ใช้สัดส่วนเดิมที่จัดให้คำ
   อยู่ในตารางได้เหมาะสม
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
   STOCK DISPLAY

   ช่องข้อมูล Stock Card:
   0 / ไม่มีค่า
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
   OPTIONAL INSPECTION VALUE

   ช่องตรวจสอบ:
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
   COMPONENT
========================================================= */

export default function ExportInspectionPdf({
  fiscalYear,

  startShortYear,
  endShortYear,

  materials,
  rows,

  inspectionStartDate:
    _inspectionStartDate,

  inspectionEndDate:
    _inspectionEndDate,

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
     INSPECTION ROW MAP
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
     DOCUMENT HEADER

     ตามที่กำหนด:
     - ไม่เอาวันที่ที่เลือกจากหน้าเว็บมาใส่
     - เว้นช่องว่างให้เขียนมือ
     - ไม่มีเส้นปะ
     - หลังวันที่แล้วเสร็จ ต่อด้วย
       "เป็นยอดคงเหลือตามบัญชีหรือทะเบียน..."
     - ทุกบรรทัด Font 15 เท่ากัน
  ======================================================= */

  function drawDocumentHeader(
    doc: jsPDF
  ) {
    const centerX =
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

    doc.setFontSize(
      HEADER_FONT_SIZE
    );

    /* ===============================================
       LINE 1
    =============================================== */

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      centerX,
      9,
      {
        align:
          "center",
      }
    );

    /* ===============================================
       LINE 2
    =============================================== */

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      centerX,
      16,
      {
        align:
          "center",
      }
    );

    /* ===============================================
       LINE 3+

       เว้นช่องไฟไว้เขียนมือ
       ไม่มี ........
    =============================================== */

    const detailText =
      `วันที่เริ่มตรวจสอบ      เดือน                    พ.ศ.       ` +
      `ตรวจสอบแล้วเสร็จวันที่      เดือน                    พ.ศ.       ` +
      `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`;

    const detailLines =
      doc.splitTextToSize(
        detailText,
        TABLE_WIDTH_MM
      ) as string[];

    doc.text(
      detailLines,
      centerX,
      23,
      {
        align:
          "center",

        lineHeightFactor:
          1.1,
      }
    );

    /*
     * คำนวณจุดเริ่มตาราง
     * ตามจำนวนบรรทัดจริง
     */
    const lineHeightMm =
      6;

    return (
      23 +
      detailLines.length *
        lineHeightMm +
      4
    );
  }

  /* =======================================================
     DRAW SIGNATURES

     เอาชื่อกรรมการกลับมาแสดง

     รูปแบบ:
     ลงชื่อ ...
     (ชื่อ นามสกุล)
     ตำแหน่ง
  ======================================================= */

  function drawSignatures(
    doc: jsPDF,
    startY: number
  ) {
    const selectedOfficers =
      inspectorIds.map(
        (id) =>
          officers.find(
            (officer) =>
              String(
                officer.id
              ) === id
          )
      );

    const columnWidth =
      TABLE_WIDTH_MM /
      3;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setFontSize(
      15
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

      doc.text(
        "ลงชื่อ ........................................................",
        centerX,
        startY,
        {
          align:
            "center",
        }
      );

      doc.text(
        officer
          ? `(${officer.firstName} ${officer.lastName})`
          : "(                                        )",
        centerX,
        startY + 8,
        {
          align:
            "center",
        }
      );

      doc.text(
        officer?.position ||
          " ",
        centerX,
        startY + 16,
        {
          align:
            "center",
        }
      );
    }
  }

  /* =======================================================
     PREVIEW LOADING SCREEN
  ======================================================= */

  function preparePreviewWindow() {
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

    previewWindow.document.open();

    previewWindow.document.write(`
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <title>กำลังเตรียม PDF</title>
          <style>
            html,
            body {
              margin: 0;
              width: 100%;
              height: 100%;
              font-family:
                Arial,
                Tahoma,
                sans-serif;
              background: #f8fafc;
            }

            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .loading {
              padding: 20px 28px;
              border-radius: 18px;
              background: white;
              box-shadow:
                0 14px 40px
                rgba(15, 23, 42, 0.12);
              font-size: 16px;
              font-weight: 700;
              color: #334155;
            }
          </style>
        </head>

        <body>
          <div class="loading">
            กำลังเตรียมตัวอย่าง PDF...
          </div>
        </body>
      </html>
    `);

    previewWindow.document.close();

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
     * เพื่อไม่ให้ browser block popup
     */
    const previewWindow =
      preparePreviewWindow();

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
         CREATE PDF
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
            true,
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      /* =================================================
         GROUP

         ถ้า Dropdown เลือกหมวดเดียว
         materials จะมีหมวดนั้นหมวดเดียว

         ถ้าเลือกทุกหมวด
         PDF จะจัดตาม CATEGORY_ORDER
      ================================================= */

      const groups =
        CATEGORY_ORDER
          .map(
            (category) => ({
              category,

              materials:
                materials.filter(
                  (material) =>
                    material.category ===
                    category
                ),
            })
          )
          .filter(
            (group) =>
              group.materials
                .length > 0
          );

      let firstCategory =
        true;

      let lastTableFinalY =
        0;

      /* =================================================
         CATEGORY LOOP

         กติกาใหม่:

         - หมวดใหม่ = หน้าใหม่
         - ไม่บังคับ 15 แถว
         - มี 4 รายการ = จบ 4 รายการ
         - ไม่เติมแถวว่าง
         - ถ้าหมวดเดียวมีหลายรายการจนล้นหน้า
           autoTable ต่อหน้าถัดไปเอง
      ================================================= */

      for (
        const group of
          groups
      ) {
        /* ===============================================
           หมวดใหม่
           ต้องเริ่มหน้าใหม่
        =============================================== */

        if (
          !firstCategory
        ) {
          doc.addPage();
        }

        firstCategory =
          false;

        /*
         * Header page แรกของ AutoTable call
         */
        const tableStartY =
          drawDocumentHeader(
            doc
          );

        /*
         * Category row
         * อยู่ "ด้านในตาราง"
         * ก่อนเลขที่ 1
         *
         * ไม่มีสีพื้นหลัง
         */
        const body: any[] = [
          [
            {
              content:
                CATEGORY_NAME[
                  group.category
                ] ??
                group.category,

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

                halign:
                  "left",

                valign:
                  "middle",

                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  TABLE_FONT_SIZE,

                minCellHeight:
                  BODY_ROW_HEIGHT_MM,

                cellPadding:
                  0.25,
              },
            },
          ],
        ];

        /* ===============================================
           REAL ROWS

           ลำดับเริ่มใหม่ทุกหมวด
        =============================================== */

        group.materials.forEach(
          (
            material,
            index
          ) => {
            const inspectionRow =
              rowMap.get(
                material.materialId
              );

            body.push([
              String(
                index + 1
              ),

              material.name,

              material.unit ||
                "-",

              /*
               * FY2569:
               *
               * ค่านี้คือ
               * ยอดยกเข้าระบบ 1 ต.ค.68
               *
               * จึงเท่ากับ
               * คงเหลือสิ้น 30 ก.ย.68
               */
              displayStockValue(
                material.openingBalance
              ),

              /*
               * รับอย่างเดียว
               * 1 ต.ค.68 - 30 ก.ย.69
               */
              displayStockValue(
                material.receiveQty
              ),

              /*
               * จ่ายจริงอย่างเดียว
               * 1 ต.ค.68 - 30 ก.ย.69
               */
              displayStockValue(
                material.issueQty
              ),

              /*
               * คงเหลือจริง
               * ตามปัจจุบัน
               */
              displayStockValue(
                material.closingBalance
              ),

              /*
               * กระดาษตรวจ:
               * ถูกต้อง / ไม่ถูกต้อง
               * เว้นว่างสำหรับตรวจ
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

        /* ===============================================
           TABLE
        =============================================== */

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
                10,
            },

            tableWidth:
              TABLE_WIDTH_MM,

            theme:
              "grid",

            /* ===========================================
               HEAD

               คงเหลือยอดยกมา
               =
               30 ก.ย. ปีก่อน

               FY2569
               =
               30 ก.ย.68

               เพราะข้อมูลคือ
               ยอดยกเข้าระบบ 1 ต.ค.68
            =========================================== */

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

            /* ===========================================
               TABLE BASE STYLE

               ฟอนต์ 15
            =========================================== */

            styles: {
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

              lineColor: [
                0,
                0,
                0,
              ],

              lineWidth:
                0.2,

              /*
               * ลด padding
               * เพื่อให้ความสูงใกล้ Excel
               * 23.25 px มากที่สุด
               */
              cellPadding:
                0.2,

              minCellHeight:
                BODY_ROW_HEIGHT_MM,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "linebreak",
            },

            /* ===========================================
               HEADER

               Font 15 เช่นเดียวกัน
            =========================================== */

            headStyles: {
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
                0.3,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "linebreak",
            },

            /* ===========================================
               BODY

               Row Height baseline
               23.25 px
               =
               6.1515625 mm
            =========================================== */

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
                0.2,

              cellPadding:
                0.2,

              minCellHeight:
                BODY_ROW_HEIGHT_MM,

              valign:
                "middle",
            },

            /* ===========================================
               COLUMN WIDTH

               รวม 285 mm
            =========================================== */

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

            /* ===========================================
               HEADER ทุกหน้า

               ถ้าหมวดหนึ่งยาวเกินหน้า
               AutoTable จะขึ้นหน้าต่อไป
               และหัวกระดาษต้องกลับมาด้วย
            =========================================== */

            didDrawPage: (
              data
            ) => {
              /*
               * หน้าแรกถูกวาดไว้ก่อน AutoTable แล้ว
               *
               * หน้า continuation
               * วาดหัวกระดาษเพิ่ม
               */
              if (
                data.pageNumber >
                1
              ) {
                drawDocumentHeader(
                  doc
                );
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

        lastTableFinalY =
          pdfWithTable
            .lastAutoTable
            ?.finalY ??
          tableStartY;
      }

      /* =================================================
         SIGNATURE

         ชื่อกรรมการกลับมาแล้ว
      ================================================= */

      let signatureY =
        lastTableFinalY +
        SIGNATURE_GAP_MM;

      /*
       * A4 landscape สูง 210 mm
       * signature ใช้ประมาณ 20 mm
       */
      if (
        signatureY >
        183
      ) {
        doc.addPage();

        const headerEndY =
          drawDocumentHeader(
            doc
          );

        signatureY =
          headerEndY +
          20;
      }

      drawSignatures(
        doc,
        signatureY
      );

      /* =================================================
         PREVIEW

         ไม่ doc.save()
         ไม่ดาวน์โหลดโดยตรง

         สร้าง Blob URL
         แล้วเปิดใน Tab ที่เปิดรอไว้
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
       * ให้ PDF Viewer โหลด Blob ก่อน
       * แล้วค่อยคืน memory ภายหลัง
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
        "Preview inspection PDF error:",
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
     ใช้ตัวกลาง
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