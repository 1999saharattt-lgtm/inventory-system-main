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
const INSPECTION_FISCAL_YEAR = "2569";

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

const PAGE_WIDTH = 297;
const TABLE_WIDTH = 270;
const MARGIN_X = (PAGE_WIDTH - TABLE_WIDTH) / 2;
const TABLE_START_Y = 35;
const SIGNATURE_START_Y = 172;

function parseDateOnly(value: string) {
  if (!value) {
    return new Date(NaN);
  }

  const parts = value.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some(Number.isNaN)
  ) {
    return new Date(NaN);
  }

  const [year, month, day] = parts;

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatThaiDate(value: string) {
  if (!value) {
    return "........";
  }

  const date = parseDateOnly(value);

  if (Number.isNaN(date.getTime())) {
    return "........";
  }

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

/* =========================================================
   ลำดับเดิมจากทะเบียนต้นฉบับ / Excel
   รูปแบบ remark: SOURCE:DEPARTMENT_1:n
   ========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_1:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder = Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

function getCategoryUnit(
  category: string
) {
  const categoryUnit: Record<
    string,
    string
  > = {
    COMPUTER: "เครื่อง",
    DESKTOP: "เครื่อง",
    LAPTOP: "เครื่อง",
    PRINTER: "เครื่อง",
    TELEPHONE: "เครื่อง",
    AIR_CONDITIONER: "เครื่อง",
    FAN: "เครื่อง",
    CHAIR: "ตัว",
    DESK: "ตัว",
    CABINET: "ตู้",
    TABLE: "ตัว",
    OTHER: "รายการ",
  };

  return (
    categoryUnit[category] ||
    "รายการ"
  );
}

function getOfficer(
  officerId: string,
  officers: Officer[]
) {
  if (!officerId) {
    return undefined;
  }

  return officers.find(
    (officer) =>
      String(officer.id) === officerId
  );
}

/* =========================================================
   ผู้รับผิดชอบใน PDF

   กลุ่มอำนวยการ
   แสดง: ชื่อ นามสกุล / ชื่องาน

   กลุ่มอื่น
   แสดง: ชื่อ นามสกุล
   ========================================================= */

function getResponsibleName(
  asset: Asset,
  department: Department
) {
  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "-";

  if (
    department.name ===
    "กลุ่มอำนวยการ"
  ) {
    const sectionName =
      asset.section?.name?.trim();

    if (sectionName) {
      return `${officerName} / ${sectionName}`;
    }
  }

  return officerName;
}

function getStatusChecked(
  row: InspectionRow,
  status: string
) {
  return row.status === status
    ? "✓"
    : "";
}

function getAccuracyChecked(
  row: InspectionRow,
  accuracy: string
) {
  return row.accuracy === accuracy
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

  function drawDocumentHeader(
    doc: jsPDF
  ) {
    const center = PAGE_WIDTH / 2;

    doc.setFont(
      "2.3.2 THSarabunNew",
      "normal"
    );

    doc.setTextColor(0, 0, 0);

    doc.setFontSize(18);
    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${INSPECTION_FISCAL_YEAR}`,
      center,
      12,
      {
        align: "center",
      }
    );

    doc.setFontSize(18);
    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      center,
      20,
      {
        align: "center",
      }
    );

    doc.setFontSize(15);
    doc.text(
      `เริ่มดำเนินการตรวจสอบวันที่ ${formatThaiDate(
        inspectionStartDate
      )}     ตรวจสอบแล้วเสร็จวันที่ ${formatThaiDate(
        inspectionEndDate
      )}`,
      center,
      28,
      {
        align: "center",
      }
    );
  }

  function drawInspectors(
    doc: jsPDF
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
        inspectorIds[index] || "";

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
        columnWidth * index +
        columnWidth / 2;

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setTextColor(0, 0, 0);

      doc.setFontSize(11);
      doc.text(
        `ลงชื่อ ${dotLine}`,
        centerX,
        SIGNATURE_START_Y,
        {
          align: "center",
        }
      );

      doc.setFontSize(11);

      const nameLines =
        doc.splitTextToSize(
          `(${inspectorName})`,
          columnWidth - 5
        );

      doc.text(
        nameLines,
        centerX,
        SIGNATURE_START_Y + 5,
        {
          align: "center",
        }
      );

      const positionLines =
        doc.splitTextToSize(
          inspectorPosition,
          columnWidth - 5
        );

      doc.text(
        positionLines,
        centerX,
        SIGNATURE_START_Y + 10,
        {
          align: "center",
        }
      );
    }
  }

  async function handleExportPdf() {
    if (assets.length === 0) {
      alert(
        "ไม่พบรายการครุภัณฑ์สำหรับสร้าง PDF"
      );
      return;
    }

    /* =====================================================
       เปิดแท็บ Preview ทันทีจากการคลิก
       ป้องกัน Browser Block Popup
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

    try {
      previewWindow.document.open();
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="th">
          <head>
            <meta charset="UTF-8" />
            <title>กำลังสร้าง PDF...</title>
            <style>
              html, body {
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
                font-family: Arial, sans-serif;
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
         สร้าง PDF แบบ Vector โดยตรง

         ไม่ใช้ html2canvas
         → เปิดไวขึ้น
         → เส้นตารางคมชัด
         → ไฟล์เล็กลง
         =================================================== */

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      const totalPages = Math.max(
        1,
        Math.ceil(
          assets.length /
            ROWS_PER_PAGE
        )
      );

      for (
        let pageIndex = 0;
        pageIndex < totalPages;
        pageIndex++
      ) {
        if (pageIndex > 0) {
          doc.addPage(
            "a4",
            "landscape"
          );
        }

        drawDocumentHeader(doc);

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
           เติมแถวว่างให้ครบ 15 แถว
           เหมือนรูปแบบเดิม
           ================================================= */

        while (
          body.length <
          ROWS_PER_PAGE
        ) {
          body.push(
            Array(18).fill("")
          );
        }

        autoTable(doc, {
          startY: TABLE_START_Y,

          margin: {
            left: MARGIN_X,
            right: MARGIN_X,
          },

          tableWidth: TABLE_WIDTH,

          theme: "grid",

          head: [
            [
              {
                content: "ลำดับ",
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
                content: "รายการ",
                rowSpan: 2,
              },
              {
                content:
                  "หน่วยนับ",
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
                content: "หมายเหตุ",
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
            lineWidth: 0.25,
            cellPadding: 0.7,
            minCellHeight: 7.1,
            halign: "center",
            valign: "middle",
            overflow:
              "linebreak",
          },

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
            lineWidth: 0.25,
            cellPadding: 0.65,
            halign: "center",
            valign: "middle",
            overflow:
              "linebreak",
          },

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
            lineWidth: 0.25,
            cellPadding: 0.7,
            minCellHeight: 7.1,
            halign: "center",
            valign: "middle",
          },

          columnStyles: {
            0: {
              cellWidth: 6.75,
            },
            1: {
              cellWidth: 17.55,
            },
            2: {
              cellWidth: 21.6,
            },
            3: {
              cellWidth: 24.3,
              halign: "left",
            },
            4: {
              cellWidth: 32.4,
              halign: "left",
            },
            5: {
              cellWidth: 9.45,
            },
            6: {
              cellWidth: 17.55,
            },
            7: {
              cellWidth: 10.8,
            },
            8: {
              cellWidth: 10.8,
            },
            9: {
              cellWidth: 20.25,
            },
            10: {
              cellWidth: 13.5,
            },
            11: {
              cellWidth: 12.825,
            },
            12: {
              cellWidth: 12.825,
            },
            13: {
              cellWidth: 10.125,
            },
            14: {
              cellWidth: 9.45,
            },
            15: {
              cellWidth: 10.8,
            },
            16: {
              cellWidth: 13.5,
            },
            17: {
              cellWidth: 15.525,
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
                  3 ||
                data.column.index ===
                  4
              )
            ) {
              const text =
                String(
                  data.cell.raw ??
                    ""
                );

              if (
                text.length > 45
              ) {
                data.cell.styles.fontSize =
                  7;
              } else if (
                text.length > 30
              ) {
                data.cell.styles.fontSize =
                  7.5;
              } else {
                data.cell.styles.fontSize =
                  8.5;
              }
            }

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

          tableLineColor: [
            0,
            0,
            0,
          ],

          tableLineWidth: 0.25,

          rowPageBreak:
            "avoid",

          showHead:
            "everyPage",
        });

        drawInspectors(doc);
      }

      /* ===================================================
         เปิด PDF ใน Browser PDF Viewer
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
        doc.output("blob");

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
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExportPdf}
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
