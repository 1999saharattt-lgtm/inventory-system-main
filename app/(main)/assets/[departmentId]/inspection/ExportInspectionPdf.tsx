"use client";

import "@/lib/fonts/THSarabunNew-normal";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Department = {
  id: number;
  name: string;
};

type Asset = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;

  /*
   * ผู้รับผิดชอบจากทะเบียนต้นฉบับ
   * เช่น งานสารบรรณ / หน้าห้องผู้อำนวยการ
   */
  responsibleName?: string | null;

  departmentId: number;
  sectionId: number | null;
  officerId: number | null;

  status: string;

  purchaseDate: Date | string | null;
  price: number | null;
  location: string | null;
  remark: string | null;

  section: {
    id: number;
    name: string;
  } | null;

  officer: {
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
  } | null;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string | null;

  department: {
    id: number;
    name: string;
  } | null;

  section: {
    id: number;
    name: string;
  } | null;
};

type InspectionRow = {
  assetId: number;
  countedQty: string;
  accuracy: string;
  status: string;
  remark: string;
};

type Props = {
  department: Department;
  assets: Asset[];
  rows: InspectionRow[];

  inspectionStartDate: string;
  inspectionEndDate: string;

  inspectorIds: string[];

  accountStartDate: string;
  accountEndDate: string;

  movementFiscalYear: string;

  officers?: Officer[];
};

const ROWS_PER_PAGE = 15;

const INSPECTION_FISCAL_YEAR =
  "2569";

const thaiMonths = [
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
   PAGE
   ========================================================= */

const PAGE_WIDTH = 297;

/*
 * เดิม 270 mm
 *
 * ขยายซ้าย / ขวาออกอีกเล็กน้อย
 * เพื่อเพิ่มพื้นที่ข้อความในตาราง
 */
const TABLE_WIDTH = 285;

const MARGIN_X =
  (PAGE_WIDTH - TABLE_WIDTH) / 2;

const TABLE_START_Y = 35;

/*
 * เว้นช่องไฟระหว่างตารางกับส่วนลงชื่อ
 * ให้มีลักษณะเหมือนเอกสารราชการ
 */
const SIGNATURE_GAP = 10;

/*
 * อย่างน้อยให้ส่วนลงชื่อเริ่มประมาณช่วงล่างของหน้า
 */
const SIGNATURE_MIN_START_Y = 170;

/* =========================================================
   DATE
   ========================================================= */

function parseDateOnly(
  value: string
) {
  if (!value) {
    return new Date(NaN);
  }

  const parts =
    value
      .split("-")
      .map(Number);

  if (
    parts.length !== 3 ||
    parts.some(Number.isNaN)
  ) {
    return new Date(NaN);
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatThaiDate(
  value: string
) {
  if (!value) {
    return "........";
  }

  const date =
    parseDateOnly(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "........";
  }

  const day =
    date.getDate();

  const month =
    thaiMonths[
      date.getMonth()
    ];

  const year =
    date.getFullYear() +
    543;

  return `${day} ${month} ${year}`;
}

/* =========================================================
   SOURCE ORDER

   ลำดับเดิมจากทะเบียนต้นฉบับ / Excel

   SOURCE:DEPARTMENT_1:n
   ========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match =
    remark.match(
      /SOURCE:DEPARTMENT_1:(\d+)/
    );

  if (!match) {
    return null;
  }

  const sourceOrder =
    Number(match[1]);

  if (
    !Number.isInteger(
      sourceOrder
    ) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   UNIT
   ========================================================= */

function getCategoryUnit(
  category: string
) {
  const categoryUnit:
    Record<string, string> = {
      COMPUTER: "เครื่อง",
      DESKTOP: "เครื่อง",
      LAPTOP: "เครื่อง",
      MONITOR: "เครื่อง",
      PRINTER: "เครื่อง",
      TELEPHONE: "เครื่อง",
      AIR_CONDITIONER:
        "เครื่อง",
      FAN: "เครื่อง",

      CHAIR: "ตัว",
      DESK: "ตัว",
      TABLE: "ตัว",
      SHELF: "ตัว",

      CABINET: "ตู้",

      OTHER: "รายการ",
      NO_SYSTEM: "รายการ",
    };

  return (
    categoryUnit[
      category
    ] || "รายการ"
  );
}

/* =========================================================
   OFFICER
   ========================================================= */

function getOfficer(
  officerId: string,
  officers: Officer[]
) {
  if (!officerId) {
    return undefined;
  }

  return officers.find(
    (officer) =>
      String(
        officer.id
      ) === officerId
  );
}

/* =========================================================
   RESPONSIBLE NAME

   รูปแบบเดียวกับหน้า /assets/[departmentId]/all

   ตัวอย่าง

   กลุ่มอำนวยการ / งานสารบรรณ
   กลุ่มอำนวยการ / หน้าห้องผู้อำนวยการ

   ลำดับการเลือกข้อมูล

   1. responsibleName จากทะเบียนเดิม
   2. section
   3. officer
   4. ชื่อกลุ่ม
   ========================================================= */

function getResponsibleName(
  asset: Asset,
  department: Department
) {
  const departmentName =
    department.name?.trim() ||
    "";

  const originalResponsibleName =
    asset.responsibleName?.trim();

  /* =======================================================
     responsibleName จากทะเบียนเดิมเป็นหลัก
     ======================================================= */

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    if (
      departmentName &&
      (
        originalResponsibleName ===
          departmentName ||
        originalResponsibleName.startsWith(
          `${departmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    if (
      departmentName
    ) {
      return `${departmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  /* =======================================================
     fallback เป็น section
     ======================================================= */

  const sectionName =
    asset.section?.name?.trim() ||
    "";

  if (sectionName) {
    if (
      departmentName &&
      (
        sectionName ===
          departmentName ||
        sectionName.startsWith(
          `${departmentName} /`
        )
      )
    ) {
      return sectionName;
    }

    if (
      departmentName
    ) {
      return `${departmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  /* =======================================================
     fallback เป็น officer
     ======================================================= */

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    if (
      departmentName
    ) {
      return `${departmentName} / ${officerName}`;
    }

    return officerName;
  }

  /* =======================================================
     fallback สุดท้าย
     ======================================================= */

  if (departmentName) {
    return departmentName;
  }

  return "-";
}

/* =========================================================
   SINGLE LINE FONT SIZE

   ปรับขนาดตัวอักษรตามความกว้างจริง

   ใช้เพื่อป้องกัน:
   - ข้อความซ้อน
   - ข้อความถูกตัด
   - ข้อความตกบรรทัด
   ========================================================= */

function getSingleLineFontSize(
  doc: jsPDF,
  text: string,
  cellWidth: number,
  maxSize = 8.5,
  minSize = 4.5,
  horizontalPadding = 1
) {
  const cleanText =
    text
      .replace(/\s+/g, " ")
      .trim();

  if (!cleanText) {
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

    fontSize -= 0.25;
  }

  return minSize;
}

/* =========================================================
   CHECK
   ========================================================= */

function getStatusChecked(
  row: InspectionRow,
  status: string
) {
  return row.status ===
    status
    ? "✓"
    : "";
}

function getAccuracyChecked(
  row: InspectionRow,
  accuracy: string
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
  department,
  assets,
  rows,

  inspectionStartDate,
  inspectionEndDate,

  inspectorIds,

  accountStartDate,
  accountEndDate,

  movementFiscalYear,

  officers = [],
}: Props) {
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  /* =======================================================
     DOCUMENT HEADER
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

    /* =====================================================
       หัวบรรทัด 1
       ===================================================== */

    doc.setFontSize(18);

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${INSPECTION_FISCAL_YEAR}`,
      center,
      12,
      {
        align: "center",
      }
    );

    /* =====================================================
       หัวบรรทัด 2
       ===================================================== */

    doc.setFontSize(18);

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      20,
      {
        align: "center",
      }
    );

    /* =====================================================
       หัวบรรทัด 3

       เว้นระหว่างวันที่เริ่มตรวจ
       กับ "ตรวจสอบแล้วเสร็จวันที่"
       เพียง 1 เว้นวรรค
       ===================================================== */

    doc.setFontSize(15);

    doc.text(
      `เริ่มดำเนินการตรวจสอบวันที่ ${formatThaiDate(
        inspectionStartDate
      )} และตรวจสอบ แล้วเสร็จวันที่ ${formatThaiDate(
        inspectionEndDate
      )}`,
      center,
      28,
      {
        align: "center",
      }
    );
  }

  /* =======================================================
     INSPECTORS

     startY รับตำแหน่งหลังตารางจริง
     จึงไม่ซ้อนกับตาราง
     ======================================================= */

  function drawInspectors(
    doc: jsPDF,
    startY: number
  ) {
    const columnWidth =
      TABLE_WIDTH / 5;

    const dotLine =
      "....................................................";

    for (
      let index = 0;
      index < 5;
      index++
    ) {
      const selectedInspectorId =
        inspectorIds[
          index
        ] || "";

      const selectedOfficer =
        getOfficer(
          selectedInspectorId,
          officers
        );

      const inspectorName =
        selectedOfficer
          ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`
          : "................................";

      const inspectorPosition =
        selectedOfficer?.position ||
        "................................";

      const centerX =
        MARGIN_X +
        columnWidth *
          index +
        columnWidth / 2;

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      /* ===================================================
         ลงชื่อ
         =================================================== */

      doc.setFontSize(11);

      doc.text(
        `ลงชื่อ ${dotLine}`,
        centerX,
        startY,
        {
          align: "center",
        }
      );

      /* ===================================================
         ชื่อ
         =================================================== */

      doc.setFontSize(11);

      const nameLines =
        doc.splitTextToSize(
          `(${inspectorName})`,
          columnWidth - 5
        );

      doc.text(
        nameLines,
        centerX,
        startY + 5,
        {
          align: "center",
        }
      );

      /* ===================================================
         ตำแหน่ง
         =================================================== */

      const positionLines =
        doc.splitTextToSize(
          inspectorPosition,
          columnWidth - 5
        );

      doc.text(
        positionLines,
        centerX,
        startY + 10,
        {
          align: "center",
        }
      );
    }
  }

  /* =======================================================
     EXPORT PDF
     ======================================================= */

  async function handleExportPdf() {
    if (
      assets.length === 0
    ) {
      alert(
        "ไม่พบรายการครุภัณฑ์สำหรับสร้าง PDF"
      );

      return;
    }

    /* =====================================================
       เปิดแท็บก่อนสร้าง PDF
       ===================================================== */

    const previewWindow =
      window.open(
        "",
        "_blank"
      );

    if (!previewWindow) {
      alert(
        "ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"
      );

      return;
    }

    /* =====================================================
       หน้า Loading
       ===================================================== */

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
      setIsExporting(true);

      /* ===================================================
         PDF VECTOR
         =================================================== */

      const doc =
        new jsPDF({
          orientation:
            "landscape",

          unit: "mm",

          format: "a4",

          compress: true,
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      /* ===================================================
         จำนวนหน้า
         =================================================== */

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            assets.length /
              ROWS_PER_PAGE
          )
        );

      /* ===================================================
         สร้างแต่ละหน้า
         =================================================== */

      for (
        let pageIndex = 0;
        pageIndex <
        totalPages;
        pageIndex++
      ) {
        if (
          pageIndex > 0
        ) {
          doc.addPage(
            "a4",
            "landscape"
          );
        }

        drawDocumentHeader(
          doc
        );

        /* =================================================
           DATA
           ================================================= */

        const startIndex =
          pageIndex *
          ROWS_PER_PAGE;

        const pageAssets =
          assets.slice(
            startIndex,
            startIndex +
              ROWS_PER_PAGE
          );

        const body =
          pageAssets.map(
            (
              asset,
              localIndex
            ) => {
              const actualIndex =
                startIndex +
                localIndex;

              const sourceOrder =
                getSourceOrder(
                  asset.remark
                );

              const displayOrder =
                sourceOrder ??
                actualIndex + 1;

              const row =
                rows.find(
                  (item) =>
                    item.assetId ===
                    asset.id
                ) || {
                  assetId:
                    asset.id,

                  countedQty:
                    "1",

                  accuracy: "",

                  status: "",

                  remark: "",
                };

              const responsibleName =
                getResponsibleName(
                  asset,
                  department
                );

              const assetName =
                [
                  asset.name,
                  asset.brand,
                  asset.model,
                ]
                  .filter(Boolean)
                  .join(" ");

              return [
                String(
                  displayOrder
                ),

                asset.governmentAssetNo ||
                  "",

                asset.officeAssetNo ||
                  "",

                responsibleName,

                assetName,

                getCategoryUnit(
                  asset.category
                ),

                "1",

                "-",

                "-",

                "1",

                row.countedQty,

                getAccuracyChecked(
                  row,
                  "CORRECT"
                ),

                getAccuracyChecked(
                  row,
                  "INCORRECT"
                ),

                getStatusChecked(
                  row,
                  "IN_USE"
                ),

                getStatusChecked(
                  row,
                  "DAMAGED"
                ),

                getStatusChecked(
                  row,
                  "DETERIORATED"
                ),

                getStatusChecked(
                  row,
                  "UNUSABLE"
                ),

                row.remark || "",
              ];
            }
          );

        /* =================================================
           เติมแถวว่าง
           ================================================= */

        while (
          body.length <
          ROWS_PER_PAGE
        ) {
          body.push(
            Array(18).fill(
              ""
            )
          );
        }

        /* =================================================
           TABLE
           ================================================= */

        autoTable(doc, {
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

          theme: "grid",

          /* =================================================
             HEADER
             ================================================= */

          head: [
            [
              {
                content:
                  "ลำดับ",
                rowSpan: 2,
              },

              {
                content:
                  "รหัส GFMIS",
                rowSpan: 2,
              },

              {
                content:
                  "รหัสครุภัณฑ์",
                rowSpan: 2,
              },

              {
                content:
                  "ผู้รับผิดชอบ",
                rowSpan: 2,
              },

              {
                content:
                  "รายการ",
                rowSpan: 2,
              },

              {
                content:
                  "หน่วย",
                rowSpan: 2,
              },

              {
                content:
                  `ยอดคงเหลือตามบัญชี\nณ วันที่ ${formatThaiDate(
                    accountStartDate
                  )}`,

                rowSpan: 2,
              },

              {
                content:
                  `รายการเคลื่อนไหวระหว่าง\nปีงบประมาณ พ.ศ. ${movementFiscalYear}`,

                colSpan: 2,
              },

              {
                content:
                  `ยอดคงเหลือตามบัญชี\nณ วันที่ ${formatThaiDate(
                    accountEndDate
                  )}`,

                rowSpan: 2,
              },

              {
                content:
                  "จำนวนที่ตรวจนับได้",

                rowSpan: 2,
              },

              {
                content:
                  "ผลการตรวจนับถูกต้อง\nตรงกับยอดคงเหลือตามบัญชี",

                colSpan: 2,
              },

              {
                content:
                  "สภาพครุภัณฑ์ที่ตรวจนับ",

                colSpan: 4,
              },

              {
                content:
                  "หมายเหตุ",

                rowSpan: 2,
              },
            ],

            [
              "รับ",
              "จ่าย",

              "ถูกต้อง",
              "ไม่ถูกต้อง",

              "ใช้งานปกติ",
              "ชำรุด",
              "เสื่อมสภาพ",
              "ไม่จำเป็นต้องใช้",
            ],
          ],

          body,

          /* =================================================
             DEFAULT STYLE
             ================================================= */

          styles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: 8.5,

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
              0.6,

            minCellHeight:
              7.1,

            halign:
              "center",

            valign:
              "middle",

            overflow:
              "linebreak",
          },

          /* =================================================
             HEADER STYLE
             ================================================= */

          headStyles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: 8,

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
              0.55,

            halign:
              "center",

            valign:
              "middle",

            overflow:
              "linebreak",
          },

          /* =================================================
             BODY STYLE
             ================================================= */

          bodyStyles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize: 8.5,

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
              0.6,

            minCellHeight:
              7.1,

            halign:
              "center",

            valign:
              "middle",
          },

          /* =================================================
             COLUMN WIDTH

             รวม = 285 mm
             ================================================= */

          columnStyles: {
            /* 0 ลำดับ */

            0: {
              cellWidth:
                6.5,

              halign:
                "center",

              valign:
                "middle",
            },

            /* 1 GFMIS */

            1: {
              cellWidth:
                18,

              halign:
                "center",

              valign:
                "middle",
            },

            /* 2 รหัสครุภัณฑ์ */

            2: {
              cellWidth:
                22.5,

              halign:
                "center",

              valign:
                "middle",
            },

            /* 3 ผู้รับผิดชอบ */

            3: {
              cellWidth:
                34,

              halign:
                "center",

              valign:
                "middle",

              overflow:
                "hidden",

              cellPadding:
                0.25,
            },

            /* 4 รายการ */

            4: {
              cellWidth:
                38,

              halign:
                "left",

              valign:
                "middle",

              overflow:
                "hidden",

              cellPadding:
                0.4,
            },

            /* 5 หน่วย */

            5: {
              cellWidth:
                9.5,

              halign:
                "center",

              valign:
                "middle",
            },

            /* 6 ยอดต้น */

            6: {
              cellWidth:
                18.5,
            },

            /* 7 รับ */

            7: {
              cellWidth:
                10,
            },

            /* 8 จ่าย */

            8: {
              cellWidth:
                10,
            },

            /* 9 ยอดปลาย */

            9: {
              cellWidth:
                20.5,
            },

            /* 10 ตรวจนับ */

            10: {
              cellWidth:
                13.5,
            },

            /* 11 ถูกต้อง */

            11: {
              cellWidth:
                12.5,
            },

            /* 12 ไม่ถูกต้อง */

            12: {
              cellWidth:
                12.5,
            },

            /* 13 ใช้งาน */

            13: {
              cellWidth:
                10,
            },

            /* 14 ชำรุด */

            14: {
              cellWidth:
                9.5,
            },

            /* 15 เสื่อมสภาพ */

            15: {
              cellWidth:
                10.5,
            },

            /* 16 ไม่จำเป็นต้องใช้ */

            16: {
              cellWidth:
                13,
            },

            /* 17 หมายเหตุ */

            17: {
              cellWidth:
                16,
            },
          },

          /* =================================================
             CELL STYLE
             ================================================= */

          didParseCell: (
            data
          ) => {
            /* =============================================
               GFMIS

               บังคับบรรทัดเดียว
               ============================================= */

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
                [text];

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  18,
                  8.5,
                  5,
                  0.8
                );
            }

            /* =============================================
               รหัสครุภัณฑ์

               บังคับบรรทัดเดียว
               ============================================= */

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
                [text];

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  22.5,
                  8.5,
                  5,
                  0.8
                );
            }

            /* =============================================
               ผู้รับผิดชอบ

               - กึ่งกลาง
               - กึ่งกลางแนวตั้ง
               - บรรทัดเดียว
               - ลดขนาดอักษรตามความกว้างจริง
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                3
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
                [text];

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.cellPadding =
                0.25;

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  34,
                  8.5,
                  4.5,
                  0.8
                );
            }

            /* =============================================
               รายการครุภัณฑ์

               ขยายช่องและบังคับเป็นบรรทัดเดียว
               ลดขนาดอักษรอัตโนมัติ
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                4
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
                [text];

              data.cell.styles.halign =
                "left";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.cellPadding =
                0.4;

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  38,
                  8.5,
                  4.5,
                  1
                );
            }

            /* =============================================
               หมายเหตุ

               พยายามให้อยู่บรรทัดเดียว
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index ===
                17
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
                [text];

              data.cell.styles.overflow =
                "hidden";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";

              data.cell.styles.fontSize =
                getSingleLineFontSize(
                  doc,
                  text,
                  16,
                  8.5,
                  4.5,
                  0.8
                );
            }

            /* =============================================
               เครื่องหมาย ✓
               ============================================= */

            if (
              data.section ===
                "body" &&
              data.column.index >=
                11 &&
              data.column.index <=
                16
            ) {
              data.cell.styles.fontSize =
                11;

              data.cell.styles.fontStyle =
                "normal";

              data.cell.styles.halign =
                "center";

              data.cell.styles.valign =
                "middle";
            }
          },

          /* =================================================
             TABLE LINE
             ================================================= */

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
        });

        /* =================================================
           ตำแหน่งจริงที่ตารางสิ้นสุด
           ================================================= */

        const lastAutoTable =
          (
            doc as jsPDF & {
              lastAutoTable?: {
                finalY: number;
              };
            }
          ).lastAutoTable;

        const tableFinalY =
          lastAutoTable
            ?.finalY ??
          TABLE_START_Y;

        /* =================================================
           ช่องลงชื่อ
           ================================================= */

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
         เปิด PDF
         =================================================== */

      const safeDepartmentName =
        department.name
          .replace(
            /[\/:*?"<>|]/g,
            "_"
          )
          .trim();

      const fileName =
        `กระดาษทำการตรวจสอบพัสดุ_${safeDepartmentName}_พ.ศ.${INSPECTION_FISCAL_YEAR}.pdf`;

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
        5 * 60 * 1000
      );
    } catch (error) {
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
    <button
      type="button"
      onClick={
        handleExportPdf
      }
      disabled={
        isExporting ||
        assets.length === 0
      }
      className="
        rounded-xl
        bg-gradient-to-r
        from-red-700
        to-red-500
        px-5
        py-2.5
        text-base
        font-extrabold
        !text-white
        shadow-lg
        transition
        hover:scale-105
        hover:from-red-800
        hover:to-red-600
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:hover:scale-100
      "
    >
      {isExporting
        ? "กำลังสร้าง PDF..."
        : "📄 ส่งออก PDF"}
    </button>
  );
}