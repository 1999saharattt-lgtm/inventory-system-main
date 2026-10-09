"use client";

import { useState } from "react";
import "@/lib/fonts/THSarabunNew-normal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AppButton from "@/components/AppButton";

type StockRow = {
  date: string;
  documentNo: string;
  owner: string;
  unitPrice: number;
  receiveQty: number;
  issueQty: number;
  balance: number;
  manufacture: string | null;
  expiry: string | null;
  type: string;
};
type Material = {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  vendor: string;
  latestPrice: number;
  rows: StockRow[];
};
type Payload = { fiscalYear: number; materials: Material[] };

const font = "2.3.2 THSarabunNew";
const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
};
const categoryOrder = ["OFFICE", "COMPUTER", "ELECTRIC", "PRINTING", "HOUSEHOLD", "VEHICLE"];
const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatThaiDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (part: string) => Number(parts.find((p) => p.type === part)?.value);
  return `${String(get("day")).padStart(2, "0")} ${months[get("month") - 1]} ${String(get("year") + 543).slice(-2)}`;
}
function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("th-TH");
}
function createTableRow(row: StockRow) {
  return [
    formatThaiDate(row.date), row.documentNo || "-", row.owner || "-",
    formatMoney(row.unitPrice), Number(row.receiveQty ?? 0) > 0 ? formatNumber(row.receiveQty) : "-",
    Number(row.issueQty ?? 0) > 0 ? formatNumber(row.issueQty) : "-",
    formatNumber(row.balance), formatThaiDate(row.manufacture), formatThaiDate(row.expiry),
  ];
}

export default function ExportAllStockCardPdf({ fiscalYear }: { fiscalYear: number }) {
  const [loading, setLoading] = useState(false);

  async function exportPdf() {
    if (loading) return;
    // Open the same PDF preview as the individual Stock Card.
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      alert("ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/stock-card/export-all?fiscalYear=${encodeURIComponent(fiscalYear)}`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "ไม่สามารถดึงข้อมูลบัญชีพัสดุได้");
      }
      const data = (await response.json()) as Payload;
      const materials = [...data.materials].sort((a, b) => {
        const ai = categoryOrder.indexOf(a.category);
        const bi = categoryOrder.indexOf(b.category);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.code.localeCompare(b.code, "th") || a.id - b.id;
      });
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFont(font, "normal");
      const pageWidth = doc.internal.pageSize.getWidth();
      const center = pageWidth / 2;
      const leftX = 14;
      const rightX = 150;
      const tableLeftX = 14;
      const tableRightMargin = 14;
      const maximumTableWidth = pageWidth - tableLeftX - tableRightMargin;
      const pageSize = 13;
      const tableHeaders = ["วันที่", "เลขที่เอกสาร", "ผู้จำหน่าย / หน่วยงาน", "ราคาล่าสุด", "รับเข้า", "เบิกจ่าย", "คงเหลือ", "วันผลิต", "วันหมดอายุ"];
      const minimumColumnWidths = [20, 24, 35, 22, 14, 14, 14, 20, 20];
      const tableCellPadding = 1.1;
      let isFirstPage = true;
      let currentCategory = "";
      let sheetNumber = 0;

      for (const material of materials) {
        if (material.category !== currentCategory) {
          currentCategory = material.category;
          sheetNumber = 0;
        }
        const rows = material.rows;
        const allTableRows = rows.map(createTableRow);
        function calculateColumnWidths(fontSize: number) {
          doc.setFont(font, "normal");
          doc.setFontSize(fontSize);
          return tableHeaders.map((header, index) => {
            let longest = doc.getTextWidth(header);
            for (const row of allTableRows) longest = Math.max(longest, doc.getTextWidth(String(row[index] ?? "")));
            return Math.max(minimumColumnWidths[index], longest + tableCellPadding * 2 + 1);
          });
        }
        let tableFontSize = 16;
        let columnWidths = calculateColumnWidths(tableFontSize);
        let calculatedTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        while (calculatedTableWidth > maximumTableWidth && tableFontSize > 5) {
          tableFontSize -= 0.5;
          columnWidths = calculateColumnWidths(tableFontSize);
          calculatedTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        }
        while (calculatedTableWidth > maximumTableWidth && tableFontSize > 4) {
          tableFontSize -= 0.25;
          columnWidths = calculateColumnWidths(tableFontSize);
          calculatedTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        }
        if (calculatedTableWidth < maximumTableWidth && calculatedTableWidth > 0) {
          const scale = maximumTableWidth / calculatedTableWidth;
          columnWidths = columnWidths.map((width) => width * scale);
          calculatedTableWidth = maximumTableWidth;
        }
        if (calculatedTableWidth > maximumTableWidth) {
          const scale = maximumTableWidth / calculatedTableWidth;
          columnWidths = columnWidths.map((width) => width * scale);
        }
        const columnStyles: Record<number, { cellWidth: number; halign: "center" | "left" | "right" }> = {
          0: { cellWidth: columnWidths[0], halign: "center" },
          1: { cellWidth: columnWidths[1], halign: "center" },
          2: { cellWidth: columnWidths[2], halign: "left" },
          3: { cellWidth: columnWidths[3], halign: "right" },
          4: { cellWidth: columnWidths[4], halign: "center" },
          5: { cellWidth: columnWidths[5], halign: "center" },
          6: { cellWidth: columnWidths[6], halign: "center" },
          7: { cellWidth: columnWidths[7], halign: "center" },
          8: { cellWidth: columnWidths[8], halign: "center" },
        };
        const pages: StockRow[][] = [];
        for (let i = 0; i < rows.length; i += pageSize) pages.push(rows.slice(i, i + pageSize));
        if (pages.length === 0) pages.push([]);

        function drawPageHeader(number: number) {
          doc.setFont(font, "normal");
          doc.setFontSize(26);
          doc.text("บัญชีพัสดุ", center, 14, { align: "center" });
          doc.setFontSize(17);
          doc.text(`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`, center, 21, { align: "center" });
          doc.setFontSize(16);
          doc.text("ส่วนราชการ  กระทรวงสาธารณสุข  กรมอนามัย", 232, 18, { align: "center" });
          doc.text("หน่วยงาน  สำนักอนามัยการเจริญพันธุ์", 232, 24, { align: "center" });
          doc.text(`รหัสพัสดุ : ${material.code || "-"}`, leftX, 38);
          // Wrap long material names to two lines without clipping or overlapping.
          const materialLabel = `รายการพัสดุ : ${material.name || "-"}`;
          const nameMaxWidth = pageWidth - rightX - 14;
          let nameFontSize = 16;
          doc.setFontSize(nameFontSize);
          let nameLines = doc.splitTextToSize(materialLabel, nameMaxWidth) as string[];
          while (nameLines.length > 2 && nameFontSize > 8) {
            nameFontSize -= 0.5;
            doc.setFontSize(nameFontSize);
            nameLines = doc.splitTextToSize(materialLabel, nameMaxWidth) as string[];
          }
          // In the rare case of an extremely long name, preserve all text.
          const extraNameHeight = nameLines.length > 1 ? Math.max(8, (nameLines.length - 1) * 5) : 0;
          doc.text(nameLines, rightX, 38, { lineHeightFactor: 1.0 });
          doc.setFontSize(16);
          doc.text(`หมวดหมู่ : ${categoryName[material.category] ?? material.category ?? "-"}`, leftX, 46 + extraNameHeight);
          doc.text(`หน่วย : ${material.unit || "-"}`, rightX, 46 + extraNameHeight);
          doc.text(`ผู้จำหน่าย : ${material.vendor || "-"}`, leftX, 54 + extraNameHeight);
          doc.text(`ราคาล่าสุด : ${formatMoney(material.latestPrice)} บาท`, rightX, 54 + extraNameHeight);
          return extraNameHeight;
          doc.setFontSize(16);
          doc.text(`แผ่นที่ ${number}`, pageWidth - 14, 10, { align: "right" });
        }

        for (const pageRows of pages) {
          if (!isFirstPage) doc.addPage("a4", "landscape");
          isFirstPage = false;
          sheetNumber++;
          const headerExtraHeight = drawPageHeader(sheetNumber);
          const body = pageRows.map(createTableRow);
          while (body.length < pageSize) body.push(["", "", "", "", "", "", "", "", ""]);
          autoTable(doc, {
            startY: 60 + headerExtraHeight,
            tableWidth: maximumTableWidth,
            margin: { left: tableLeftX, right: tableRightMargin },
            head: [tableHeaders],
            body,
            theme: "grid",
            styles: {
              font, fontStyle: "normal", fontSize: tableFontSize,
              cellPadding: tableCellPadding, halign: "center", valign: "middle",
              lineColor: [0, 0, 0], lineWidth: 0.25, minCellHeight: 8, overflow: "visible",
            },
            headStyles: {
              font, fontStyle: "normal", fontSize: tableFontSize,
              fillColor: [255, 255, 255], textColor: 0, halign: "center", valign: "middle",
              lineColor: [0, 0, 0], lineWidth: 0.25,
              cellPadding: tableCellPadding, overflow: "visible",
            },
            columnStyles,
            rowPageBreak: "avoid",
            didParseCell: (cell: any) => {
              if (cell.section !== "body") return;
              const sourceRow = pageRows[cell.row.index];
              if (sourceRow && (sourceRow.type === "OPENING_BALANCE" || sourceRow.documentNo === "ยอดยกเข้าระบบ")) {
                cell.cell.styles.fontStyle = "normal";
              }
            },
          });
        }
      }
      if (materials.length === 0) {
        doc.setFont(font, "normal");
        doc.setFontSize(17);
        doc.text(`ไม่พบข้อมูลบัญชีพัสดุ ปีงบประมาณ ${fiscalYear}`, center, 21, { align: "center" });
      }
      const pdfUrl = URL.createObjectURL(doc.output("blob"));
      previewWindow.location.replace(pdfUrl);
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 5 * 60 * 1000);
    } catch (error) {
      console.error("ไม่สามารถสร้าง PDF รวมบัญชีพัสดุได้:", error);
      if (!previewWindow.closed) previewWindow.close();
      alert(error instanceof Error ? error.message : "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppButton type="button" variant="danger" size="md" onClick={exportPdf} disabled={loading}
      icon={<span aria-hidden="true">📄</span>}>
      {loading ? "กำลังจัดทำ PDF..." : "รวมบัญชีพัสดุ"}
    </AppButton>
  );
}
