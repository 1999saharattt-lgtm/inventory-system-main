
"use client";

import "@/lib/fonts/THSarabunNew-normal";
import { useState } from "react";
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
  departmentId: number | null;
  sectionId: number | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
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
   PAGE AND FONT
========================================================= */

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const TABLE_LEFT = 4;
const TABLE_RIGHT = 4;
const TABLE_WIDTH = PAGE_WIDTH - TABLE_LEFT - TABLE_RIGHT;

const FONT_NAME = "2.3.2 THSarabunNew";
const FONT_STYLE = "normal";

const TABLE_FONT_SIZE = 9;
const HEADER_FONT_SIZE = 9;
const DOCUMENT_FONT_SIZE = 15;
const SIGNATURE_FONT_SIZE = 12;

const BODY_ROW_HEIGHT = 6.1515625;
const ROWS_PER_PAGE = 17;

/*
 * ความกว้างรวม 289 มม.
 * ตรงกับตาราง 17 คอลัมน์ในหน้า InspectionForm
 */
const COLUMN_WIDTHS = [
  7, 58, 11, 30, 15, 15, 18, 11, 13,
  10, 10, 9, 9, 13, 15, 18, 27,
];

const CATEGORY_ORDER = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const CATEGORY_NAME: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

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
   HELPERS
========================================================= */

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getThaiMonthYear(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return { month: "", year: "" };
  }

  return {
    month: THAI_MONTHS[date.getMonth()],
    year: String(date.getFullYear() + 543),
  };
}

function getThaiDay(value: string) {
  return parseDateOnly(value)?.getDate().toString() ?? "";
}

function displayStockValue(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "-";
  }

  return value.toLocaleString("th-TH");
}

function displayCurrentBalance(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("th-TH");
}

function displayOptionalValue(
  value: string | null | undefined
): string {
  const text = String(value ?? "").trim();

  if (!text || Number(text) === 0) {
    return "";
  }

  return text;
}

/*
 * สำคัญ:
 * ใช้เฉพาะฟอนต์ normal ที่มีการลงทะเบียนจริง
 * ห้ามสั่ง bold โดยไม่มีไฟล์ bold ลงทะเบียนไว้
 */
function setThaiFont(doc: jsPDF, size: number) {
  doc.setFont(FONT_NAME, FONT_STYLE);
  doc.setFontSize(size);
  doc.setTextColor(0, 0, 0);
}

/*
 * ปรับขนาดตัวอักษรให้พอดีกับความกว้าง
 * ไม่ปล่อยให้ข้อความล้นออกนอกเซลล์
 */
function fitFontSize(
  doc: jsPDF,
  text: string,
  availableWidth: number,
  preferredSize: number,
  minimumSize = 6
) {
  let size = preferredSize;

  setThaiFont(doc, size);

  while (
    size > minimumSize &&
    doc.getTextWidth(text) > availableWidth
  ) {
    size -= 0.25;
    setThaiFont(doc, size);
  }

  return size;
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
  const [isExporting, setIsExporting] = useState(false);

  const startDateInfo = getThaiMonthYear(inspectionStartDate);
  const endDateInfo = getThaiMonthYear(inspectionEndDate);

  const rowMap = new Map(
    rows.map((row) => [row.materialId, row])
  );

  /* =======================================================
     DOCUMENT HEADER
  ======================================================= */

  function drawPageHeader(doc: jsPDF): number {
    const centerX = PAGE_WIDTH / 2;

    setThaiFont(doc, DOCUMENT_FONT_SIZE);

    doc.text(
      `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`,
      centerX,
      8,
      { align: "center" }
    );

    doc.text(
      "สำนักอนามัยการเจริญพันธุ์",
      centerX,
      14,
      { align: "center" }
    );

    // เว้นเฉพาะช่อง "วันที่" ส่วนเดือนและปีใช้ค่าที่บันทึกไว้
    const dateText =
      `วันที่เริ่มตรวจสอบ             เดือน ${startDateInfo.month} พ.ศ. ${startDateInfo.year}  ` +
      `ตรวจสอบแล้วเสร็จวันที่             เดือน ${endDateInfo.month} พ.ศ. ${endDateInfo.year}  ` +
      `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`;

    const dateFontSize = fitFontSize(
      doc,
      dateText,
      TABLE_WIDTH - 2,
      DOCUMENT_FONT_SIZE,
      9
    );

    setThaiFont(doc, dateFontSize);

    doc.text(dateText, centerX, 21, {
      align: "center",
      maxWidth: TABLE_WIDTH - 2,
    });

    return 27;
  }

  /* =======================================================
     SIGNATURE
  ======================================================= */

  function drawInspectors(doc: jsPDF, startY: number) {
    const selectedOfficers = inspectorIds.map((id) =>
      officers.find((officer) => String(officer.id) === id)
    );

    const columnWidth = TABLE_WIDTH / 3;

    selectedOfficers.forEach((officer, index) => {
      const centerX =
        TABLE_LEFT +
        columnWidth * index +
        columnWidth / 2;

      setThaiFont(doc, SIGNATURE_FONT_SIZE);

      doc.text(
        "ลงชื่อ ........................................................",
        centerX,
        startY + 6,
        { align: "center" }
      );

      const name = officer
        ? `(${officer.firstName} ${officer.lastName})`
        : "(................................................)";

      const nameSize = fitFontSize(
        doc,
        name,
        columnWidth - 6,
        SIGNATURE_FONT_SIZE,
        9
      );

      setThaiFont(doc, nameSize);

      doc.text(name, centerX, startY + 12, {
        align: "center",
      });

      const position = officer?.position ?? "";

      const positionSize = fitFontSize(
        doc,
        position,
        columnWidth - 6,
        SIGNATURE_FONT_SIZE,
        9
      );

      setThaiFont(doc, positionSize);

      doc.text(position, centerX, startY + 18, {
        align: "center",
      });
    });
  }

  /* =======================================================
     PREVIEW WINDOW
  ======================================================= */

  function createPreviewWindow(): Window | null {
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) return null;

    previewWindow.document.open();

    previewWindow.document.write(`
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <title>ตัวอย่าง PDF</title>
          <style>
            html, body {
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
              box-shadow: 0 16px 40px rgba(15,23,42,.12);
            }
          </style>
        </head>
        <body>
          <div class="loading">กำลังเปิดตัวอย่าง PDF...</div>
        </body>
      </html>
    `);

    previewWindow.document.close();

    return previewWindow;
  }

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  function previewPdf() {
    if (isExporting) return;

    if (materials.length === 0) {
      alert("ไม่มีรายการสำหรับแสดงตัวอย่าง PDF");
      return;
    }

    const exportMaterials = materials.filter((material) => {
      const name = material.name.trim();
      const isSSS = /\(สสส\.\)\s*$/.test(name);
      const isCR2032 =
        material.category === "ELECTRIC" &&
        /^ถ่านกระดุม\s*ขนาด\s*CR2032$/i.test(name);

      return !isSSS && !isCR2032;
    });

    if (exportMaterials.length === 0) {
      alert("ไม่มีรายการพัสดุสำหรับส่งออก PDF หลังตัดรายการ (สสส.)");
      return;
    }

    const previewWindow = createPreviewWindow();

    if (!previewWindow) {
      alert(
        "เบราว์เซอร์บล็อกหน้าต่างพรีวิว กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"
      );
      return;
    }

    try {
      setIsExporting(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: false,
      });

      setThaiFont(doc, TABLE_FONT_SIZE);

      const groups = CATEGORY_ORDER.map((category) => ({
        category,
        name: CATEGORY_NAME[category] ?? category,
        materials: exportMaterials.filter(
          (material) => material.category === category
        ),
      })).filter((group) => group.materials.length > 0);

      let firstPage = true;
      let runningItemNumber = 0;

      for (const group of groups) {
        for (
          let startIndex = 0;
          startIndex < group.materials.length;
          startIndex += ROWS_PER_PAGE
        ) {
          if (!firstPage) {
            doc.addPage("a4", "landscape");
          }

          firstPage = false;

          const tableStartY = drawPageHeader(doc);

          const pageMaterials = group.materials.slice(
            startIndex,
            startIndex + ROWS_PER_PAGE
          );

          const body: any[] = [];

          if (startIndex === 0) {
            body.push([
              {
                content: group.name,
                colSpan: 17,
                styles: {
                  font: FONT_NAME,
                  fontStyle: FONT_STYLE,
                  fontSize: TABLE_FONT_SIZE,
                  halign: "left",
                  valign: "middle",
                  cellPadding: {
                    top: 0.5,
                    right: 1,
                    bottom: 0.5,
                    left: 2,
                  },
                  minCellHeight: BODY_ROW_HEIGHT,
                  fillColor: [255, 255, 255],
                  textColor: [0, 0, 0],
                  lineColor: [0, 0, 0],
                  lineWidth: 0.25,
                },
              },
            ]);
          }

          pageMaterials.forEach((material) => {
            const inspectionRow = rowMap.get(
              material.materialId
            );

            body.push([
              String(++runningItemNumber),
              material.name,
              material.unit || "-",
              displayStockValue(material.openingBalance),
              displayStockValue(material.receiveQty),
              displayStockValue(material.issueQty),
              displayCurrentBalance(material.closingBalance),
              "",
              "",
              displayOptionalValue(inspectionRow?.shortageQty),
              displayOptionalValue(inspectionRow?.excessQty),
              displayOptionalValue(inspectionRow?.baht),
              displayOptionalValue(inspectionRow?.satang),
              displayOptionalValue(inspectionRow?.damagedQty),
              displayOptionalValue(inspectionRow?.deterioratedQty),
              displayOptionalValue(inspectionRow?.unnecessaryQty),
              inspectionRow?.remark ?? "",
            ]);
          });

          const headerOpening =
            `คงเหลือยอดยกมาเมื่อ 30 ก.ย. ${startShortYear}`;

          const headerMovement =
            `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`;

          /*
           * ปรับเฉพาะหัวตาราง
           *
           * ผลการตรวจสอบ:
           *   ถูกต้อง / ไม่ถูกต้อง
           *
           * ถ้าไม่ถูกต้องจำนวนที่ขาด
           * จำนวนที่เกินคิดเป็นเงินร้อยละ:
           *   ขาด / เกิน / บาท / สต.
           *
           * จำนวนที่:
           *   ชำรุด / เสื่อมสภาพ / ไม่จำเป็นต้องใช้
           *
           * คง 17 คอลัมน์เดิม
           */
          const head = [
            [
              { content: "ลำดับ", rowSpan: 2 },
              {
                content: "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์",
                rowSpan: 2,
              },
              { content: "หน่วยนับ", rowSpan: 2 },
              { content: headerOpening, rowSpan: 2 },
              { content: headerMovement, colSpan: 2 },
              { content: "คงเหลือปัจจุบัน", rowSpan: 2 },

              {
                content: "ผลการตรวจสอบ",
                colSpan: 2,
              },
              {
                content:
                  "ถ้าไม่ถูกต้องจำนวนที่ขาด\nจำนวนที่เกินคิดเป็นเงินร้อยละ",
                colSpan: 4,
              },
              {
                content: "จำนวนที่",
                colSpan: 3,
              },

              { content: "หมายเหตุ", rowSpan: 2 },
            ],
            [
              "รับ",
              "จ่าย",
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
          ];

          const columnStyles: Record<number, any> = {};

          COLUMN_WIDTHS.forEach((width, index) => {
            columnStyles[index] = {
              cellWidth: width,
            };
          });

          columnStyles[1] = {
            cellWidth: COLUMN_WIDTHS[1],
            halign: "left",
            cellPadding: {
              top: 0.3,
              right: 1,
              bottom: 0.3,
              left: 3,
            },
          };

          columnStyles[16] = {
            cellWidth: COLUMN_WIDTHS[16],
            halign: "left",
            cellPadding: {
              top: 0.3,
              right: 1,
              bottom: 0.3,
              left: 2,
            },
          };

          autoTable(doc, {
            startY: tableStartY,
            tableWidth: TABLE_WIDTH,
            margin: {
              left: TABLE_LEFT,
              right: TABLE_RIGHT,
              top: tableStartY,
              bottom: 24,
            },
            theme: "grid",
            pageBreak: "avoid",
            rowPageBreak: "avoid",
            head,
            body,
            styles: {
              font: FONT_NAME,
              fontStyle: FONT_STYLE,
              fontSize: TABLE_FONT_SIZE,
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              lineColor: [0, 0, 0],
              lineWidth: 0.25,
              cellPadding: 0.3,
              minCellHeight: BODY_ROW_HEIGHT,
              halign: "center",
              valign: "middle",
              overflow: "hidden",
            },
            headStyles: {
              font: FONT_NAME,
              fontStyle: FONT_STYLE,
              fontSize: HEADER_FONT_SIZE,
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              lineColor: [0, 0, 0],
              lineWidth: 0.25,
              cellPadding: 0.5,
              halign: "center",
              valign: "middle",
              overflow: "hidden",
              minCellHeight: 7,
            },
            bodyStyles: {
              font: FONT_NAME,
              fontStyle: FONT_STYLE,
              fontSize: TABLE_FONT_SIZE,
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              lineColor: [0, 0, 0],
              lineWidth: 0.25,
              minCellHeight: BODY_ROW_HEIGHT,
              valign: "middle",
              overflow: "hidden",
            },
            columnStyles,
            didParseCell: (data: any) => {
              const cell = data.cell;

              cell.styles.font = FONT_NAME;
              cell.styles.fontStyle = FONT_STYLE;
              cell.styles.valign = "middle";
              cell.styles.overflow = "hidden";

              if (data.section === "head") {
                /*
                 * คำนวณพื้นที่ตามคอลัมน์จริง
                 * รองรับหัวตารางที่ใช้ colSpan
                 */
                const startColumn = data.column.index;
                const span = Math.max(1, cell.colSpan || 1);

                const cellWidth = COLUMN_WIDTHS.slice(
                  startColumn,
                  startColumn + span
                ).reduce((sum, width) => sum + width, 0);

                const content = String(
                  cell.raw?.content ?? cell.text?.join(" ") ?? ""
                );

                const availableWidth = Math.max(
                  1,
                  cellWidth - 2
                );

                cell.styles.fontSize = fitFontSize(
                  doc,
                  content,
                  availableWidth,
                  HEADER_FONT_SIZE,
                  6
                );

                cell.styles.minCellHeight =
                  data.row.index === 0 ? 9 : 6;

                cell.styles.cellPadding = {
                  top: 1,
                  right: 0.5,
                  bottom: 1,
                  left: 0.5,
                };

                return;
              }

              if (data.section === "body") {
                cell.styles.fontSize = TABLE_FONT_SIZE;
                cell.styles.minCellHeight = BODY_ROW_HEIGHT;

                if (data.column.index === 1) {
                  cell.styles.halign = "left";

                  /*
                   * ระยะห่างจากขอบซ้าย 3 มม.
                   * รูปแบบใกล้เคียง Excel
                   */
                  cell.styles.cellPadding = {
                    top: 0.3,
                    right: 1,
                    bottom: 0.3,
                    left: 3,
                  };
                } else if (data.column.index === 16) {
                  cell.styles.halign = "left";
                  cell.styles.cellPadding = {
                    top: 0.3,
                    right: 1,
                    bottom: 0.3,
                    left: 2,
                  };
                } else {
                  cell.styles.cellPadding = 0.3;
                }
              }
            },
          });

          const pdfWithTable = doc as jsPDF & {
            lastAutoTable?: { finalY: number };
          };

          const finalY =
            pdfWithTable.lastAutoTable?.finalY ?? tableStartY;

          // ต่อบล็อกลายเซ็นจากท้ายตารางจริง โดยเว้นระยะ 14 มม. จากตาราง
          // ไม่บังคับลงไปท้ายหน้ากระดาษ
          const signatureY = finalY + 14;
          const signatureBottomY = signatureY + 18;
          const safeBottomY = PAGE_HEIGHT - 12;

          if (signatureBottomY <= safeBottomY) {
            drawInspectors(doc, signatureY);
          } else {
            // หน้าปัจจุบันมีพื้นที่ไม่พอสำหรับบล็อกลายเซ็นทั้งชุด
            doc.addPage("a4", "landscape");
            drawInspectors(doc, 45);
          }
        }
      }

      // เลขแผ่นที่เรียงต่อเนื่องทุกหน้า รวมหน้าลายเซ็นที่เพิ่มอัตโนมัติ
      const totalPages = doc.getNumberOfPages();

      for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
        doc.setPage(pageNo);
        setThaiFont(doc, DOCUMENT_FONT_SIZE);

        doc.text(
          `แผ่นที่ ${pageNo}`,
          PAGE_WIDTH - TABLE_RIGHT,
          8,
          { align: "right" }
        );
      }

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      previewWindow.location.replace(pdfUrl);

      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error(
        "Preview stock card inspection PDF error:",
        error
      );

      if (!previewWindow.closed) {
        previewWindow.close();
      }

      alert("ไม่สามารถเปิดตัวอย่าง PDF ได้");
    } finally {
      setIsExporting(false);
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
      icon={<span aria-hidden="true">📄</span>}
      onClick={previewPdf}
      disabled={isExporting || materials.length === 0}
    >
      {isExporting ? "กำลังเปิด PDF..." : "ส่งออก PDF"}
    </AppButton>
  );
}
