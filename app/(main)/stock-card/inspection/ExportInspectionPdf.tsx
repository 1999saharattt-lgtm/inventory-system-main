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
   CONSTANT
========================================================= */

const ROWS_PER_PAGE = 15;

const PAGE_WIDTH = 297;
const TABLE_WIDTH = 285;

const MARGIN_X =
  (
    PAGE_WIDTH -
    TABLE_WIDTH
  ) / 2;

const TABLE_START_Y = 38;

const SIGNATURE_GAP = 22;

/* =========================================================
   COLUMN WIDTH

   รวม = 285 mm
========================================================= */

const COLUMN_WIDTHS = {
  order: 7,

  item: 62,

  unit: 12,

  opening: 22,

  receive: 14,

  issue: 14,

  closing: 15,

  correct: 10,

  incorrect: 13,

  shortage: 11,

  excess: 11,

  baht: 10,

  satang: 10,

  damaged: 14,

  deteriorated: 15,

  unnecessary: 18,

  remark: 27,
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
  if (!value) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const date =
    new Date(
      Number(
        match[1]
      ),
      Number(
        match[2]
      ) - 1,
      Number(
        match[3]
      )
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   THAI DATE
========================================================= */

function formatThaiDate(
  value: string
) {
  const date =
    parseDateOnly(
      value
    );

  if (!date) {
    return "........";
  }

  return `${date.getDate()} ${
    THAI_MONTHS[
      date.getMonth()
    ]
  } ${
    date.getFullYear() +
    543
  }`;
}

/* =========================================================
   STOCK VALUE

   0 = -
========================================================= */

function displayStockValue(
  value: number
) {
  if (
    value === 0 ||
    !Number.isFinite(
      value
    )
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
   = ช่องว่าง
========================================================= */

function displayOptional(
  value: string
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
        (row) => [
          row.materialId,
          row,
        ]
      )
    );

  /* =======================================================
     HEADER
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

    doc.setFontSize(
      16
    );

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      center,
      10,
      {
        align:
          "center",
      }
    );

    doc.setFontSize(
      15
    );

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      17,
      {
        align:
          "center",
      }
    );

    doc.setFontSize(
      12.5
    );

    const dateText =
      `วันที่เริ่มตรวจสอบ ${formatThaiDate(
        inspectionStartDate
      )}  วันที่ตรวจสอบแล้วเสร็จ ${formatThaiDate(
        inspectionEndDate
      )}`;

    doc.text(
      dateText,
      center,
      24,
      {
        align:
          "center",
      }
    );
  }

  /* =======================================================
     CATEGORY TITLE
  ======================================================= */

  function drawCategoryTitle(
    doc: jsPDF,
    category: string
  ) {
    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setFontSize(
      13
    );

    doc.text(
      CATEGORY_NAME[
        category
      ] ??
        category,
      MARGIN_X,
      32
    );
  }

  /* =======================================================
     SIGNATURE
  ======================================================= */

  function drawSignatures(
    doc: jsPDF,
    startY: number
  ) {
    const inspectorData =
      inspectorIds.map(
        (
          id
        ) =>
          officers.find(
            (officer) =>
              String(
                officer.id
              ) === id
          )
      );

    const usableWidth =
      TABLE_WIDTH;

    const columnWidth =
      usableWidth / 3;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setFontSize(
      12
    );

    for (
      let index = 0;
      index < 3;
      index++
    ) {
      const officer =
        inspectorData[
          index
        ];

      const centerX =
        MARGIN_X +
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
          : "(................................................)",
        centerX,
        startY +
          7,
        {
          align:
            "center",
        }
      );

      doc.text(
        officer?.position ??
          "................................................",
        centerX,
        startY +
          14,
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

  function exportPdf() {
    if (
      materials.length ===
      0
    ) {
      alert(
        "ไม่มีรายการสำหรับส่งออก PDF"
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

      /* =================================================
         GROUP MATERIAL
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

      let firstPage =
        true;

      let lastTableFinalY =
        TABLE_START_Y;

      /* =================================================
         CATEGORY
      ================================================= */

      for (
        const group of groups
      ) {
        const totalPages =
          Math.ceil(
            group.materials
              .length /
              ROWS_PER_PAGE
          );

        for (
          let pageIndex = 0;
          pageIndex <
          totalPages;
          pageIndex++
        ) {
          if (
            !firstPage
          ) {
            doc.addPage();
          }

          firstPage =
            false;

          drawDocumentHeader(
            doc
          );

          /*
           * ชื่อหมวดแสดงเฉพาะ
           * หน้าแรกของหมวด
           */
          if (
            pageIndex === 0
          ) {
            drawCategoryTitle(
              doc,
              group.category
            );
          }

          const pageMaterials =
            group.materials.slice(
              pageIndex *
                ROWS_PER_PAGE,

              (
                pageIndex +
                1
              ) *
                ROWS_PER_PAGE
            );

          const body =
            pageMaterials.map(
              (
                material,
                index
              ) => {
                const row =
                  rowMap.get(
                    material.materialId
                  );

                const order =
                  pageIndex *
                    ROWS_PER_PAGE +
                  index +
                  1;

                return [
                  String(
                    order
                  ),

                  material.name,

                  material.unit ||
                    "-",

                  displayStockValue(
                    material.openingBalance
                  ),

                  displayStockValue(
                    material.receiveQty
                  ),

                  displayStockValue(
                    material.issueQty
                  ),

                  displayStockValue(
                    material.closingBalance
                  ),

                  /*
                   * ถูกต้อง / ไม่ถูกต้อง
                   * เว้นว่างตามแบบกระดาษตรวจ
                   */
                  "",

                  "",

                  displayOptional(
                    row?.shortageQty ??
                      ""
                  ),

                  displayOptional(
                    row?.excessQty ??
                      ""
                  ),

                  displayOptional(
                    row?.baht ??
                      ""
                  ),

                  displayOptional(
                    row?.satang ??
                      ""
                  ),

                  displayOptional(
                    row?.damagedQty ??
                      ""
                  ),

                  displayOptional(
                    row?.deterioratedQty ??
                      ""
                  ),

                  displayOptional(
                    row?.unnecessaryQty ??
                      ""
                  ),

                  row?.remark ??
                    "",
                ];
              }
            );

          /*
           * 15 รายการต่อหน้า
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

              styles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  8.5,

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
                  0.55,

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

                halign:
                  "center",

                valign:
                  "middle",
              },

              bodyStyles: {
                font:
                  "2.3.2 THSarabunNew",

                fontStyle:
                  "normal",

                fontSize:
                  8.5,
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

                  halign:
                    "left",
                },
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
            TABLE_START_Y;
        }
      }

      /* =================================================
         SIGNATURE
      ================================================= */

      let signatureY =
        lastTableFinalY +
        SIGNATURE_GAP;

      /*
       * ถ้าลงชื่อแล้วล้นหน้า
       * เพิ่มหน้าใหม่
       */
      if (
        signatureY >
        178
      ) {
        doc.addPage();

        drawDocumentHeader(
          doc
        );

        signatureY =
          60;
      }

      drawSignatures(
        doc,
        signatureY
      );

      /* =================================================
         SAVE
      ================================================= */

      doc.save(
        `stock-card-inspection-${fiscalYear}.pdf`
      );
    } catch (
      error
    ) {
      console.error(
        "Export inspection PDF error:",
        error
      );

      alert(
        "ไม่สามารถส่งออก PDF ได้"
      );
    } finally {
      setIsExporting(
        false
      );
    }
  }

  /* =========================================================
     BUTTON

     ใช้ AppButton ตัวกลางเสมอ
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
        exportPdf
      }
      disabled={
        isExporting ||
        materials.length ===
          0
      }
    >
      {isExporting
        ? "กำลังส่งออก..."
        : "ส่งออก PDF"}
    </AppButton>
  );
}