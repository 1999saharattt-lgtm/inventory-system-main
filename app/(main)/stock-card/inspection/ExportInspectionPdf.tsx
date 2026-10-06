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

const TABLE_START_Y =
  22;

const SIGNATURE_GAP =
  10;

const SIGNATURE_MIN_START_Y =
  170;

/*
 * 15 รายการข้อมูลต่อหน้า
 * แถวชื่อหมวดไม่นับเป็นรายการ
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
   DATE
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

function formatThaiDate(
  value:
    string
) {
  if (
    !value
  ) {
    return "";
  }

  const parts =
    value
      .split("-")
      .map(
        Number
      );

  if (
    parts.length !==
      3 ||
    parts.some(
      Number.isNaN
    )
  ) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    parts;

  return `${day} ${THAI_MONTHS[
    month -
      1
  ]} ${year + 543}`;
}

/* =========================================================
   NUMBER

   ใช้เฉพาะ:
   - ยอดยกมา
   - รับ
   - จ่าย
   - คงเหลือ

   ไม่มีค่า / 0 = "-"
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
   OTHER INPUT VALUE

   ช่องอื่นไม่มีค่า = ช่องว่าง
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
    !clean ||
    Number(
      clean
    ) ===
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
   ACCURACY
========================================================= */

function getAccuracyChecked(
  row:
    InspectionRow,

  value:
    "CORRECT" |
    "INCORRECT"
) {
  return row.accuracy ===
    value
    ? "✓"
    : "";
}

/* =========================================================
   BUILD PDF PAGES
========================================================= */

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

type PdfCategoryRow = {
  type:
    "category";

  category:
    string;

  label:
    string;
};

type PdfDisplayRow =
  | PdfCategoryRow
  | PdfMaterialRow;

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

  let materialCount =
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

      let categoryIndex =
        0;

      for (
        const material of
        categoryMaterials
      ) {
        if (
          materialCount ===
          ROWS_PER_PAGE
        ) {
          pages.push(
            currentPage
          );

          currentPage =
            [];

          materialCount =
            0;
        }

        const hasMaterialInCategory =
          currentPage.some(
            (
              row
            ) =>
              row.type ===
                "material" &&
              row.category ===
                category
          );

        if (
          !hasMaterialInCategory
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

        materialCount +=
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
  inspectionDate,
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

     เหลือเฉพาะ:
     ตรวจสอบเมื่อวันที่ ...
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
      16
    );

    doc.text(
      `ตรวจสอบเมื่อวันที่ ${formatThaiDate(
        inspectionDate
      )}`,
      center,
      12,
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
        `(${name})`,
        centerX,
        startY +
          5,
        {
          align:
            "center",
        }
      );

      doc.text(
        position,
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

      pages.forEach(
        (
          pageRows,
          pageIndex
        ) => {
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
                        fontStyle:
                          "bold",

                        halign:
                          "left",

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

                        fontSize:
                          10,

                        cellPadding: {
                          top:
                            1.1,

                          right:
                            1,

                          bottom:
                            1.1,

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

                  row.remark?.trim() ||
                    "",
                ]
              );
            }
          );

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

              didParseCell: (
                data
              ) => {
                if (
                  data.section ===
                    "body" &&
                  (
                    data.column.index ===
                      7 ||
                    data.column.index ===
                      8
                  ) &&
                  typeof data.cell.raw ===
                    "string"
                ) {
                  data.cell.text =
                    [
                      "",
                    ];
                }
              },

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

                if (
                  String(
                    data.cell.raw ??
                      ""
                  ).trim() !==
                  "✓"
                ) {
                  return;
                }

                const x =
                  data.cell.x +
                  data.cell.width /
                    2;

                const y =
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
                  x -
                    1.8,
                  y,
                  x -
                    0.4,
                  y +
                    1.4
                );

                doc.line(
                  x -
                    0.4,
                  y +
                    1.4,
                  x +
                    2.2,
                  y -
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
            }
          );

          const lastAutoTable =
            (
              doc as jsPDF & {
                lastAutoTable?: {
                  finalY:
                    number;
                };
              }
            ).lastAutoTable;

          const signatureStartY =
            Math.max(
              (
                lastAutoTable
                  ?.finalY ??
                TABLE_START_Y
              ) +
                SIGNATURE_GAP,

              SIGNATURE_MIN_START_Y
            );

          drawInspectors(
            doc,
            signatureStartY
          );
        }
      );

      const fileName =
        `กระดาษทำการตรวจสอบบัญชีพัสดุ_พ.ศ.${fiscalYear}.pdf`;

      const blob =
        doc.output(
          "blob"
        );

      const url =
        URL.createObjectURL(
          blob
        );

      previewWindow.location.replace(
        url
      );

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        5 *
          60 *
          1000
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      previewWindow.close();

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