"use client";

import "@/lib/fonts/THSarabunNew-normal";
import { useState } from "react";
import AppButton from "@/components/AppButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Material = {
  materialId: number; code: string; name: string; unit: string; category: string;
  latestPrice: number | null; openingBalance: number; receiveQty: number;
  issueQty: number; closingBalance: number;
};
type Accuracy = "CORRECT" | "INCORRECT";
type Status = "IN_USE" | "DAMAGED" | "DETERIORATED" | "UNNECESSARY";
type Props = {
  fiscalYear: number; startShortYear: string; endShortYear: string;
  materials: Material[];
  accuracy: Record<number, Accuracy>;
  statuses: Record<number, Status>;
};
const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน", COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ", HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ", PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const columns = [
  "ลำดับ", "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์", "หน่วยนับ", "ราคาต่อหน่วย",
  "คงเหลือยอดยกมา", "รับ", "จ่าย", "คงเหลือปัจจุบัน",
  "ถูกต้อง", "ไม่ถูกต้อง", "ขาด", "เกิน", "จำนวนที่ขาดเกินคิดเป็นเงิน (บาท)",
  "ใช้การได้", "ชำรุด", "เสื่อมสภาพ", "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงาน", "หมายเหตุ",
];
export default function ExportStockInventoryReport({ fiscalYear, startShortYear, endShortYear, materials, accuracy, statuses }: Props) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  // ไม่แสดงรายการนี้ทั้งในไฟล์ Excel และ PDF
  const exportMaterials = materials.filter(
    material => material.name.trim() !== "หมึกพิมพ์อิงค์เจ็ท Canon รุ่น PGI-810 BK สีดำ"
  );
  const exportExcel = async () => {
    if (busy !== null) return;
    setBusy("excel");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const book = new ExcelJS.Workbook();
      book.creator = "สำนักอนามัยการเจริญพันธุ์";
      const order = ["OFFICE", "COMPUTER", "ELECTRIC", "HOUSEHOLD", "VEHICLE", "PRINTING"];
      const widths = [7, 43, 11, 14, 16, 10, 10, 16, 10, 12, 9, 9, 16, 11, 10, 12, 27, 17];
      const line = { style: "thin" as const, color: { argb: "FF000000" } };
      const fontName = "TH SarabunPSK";
      const black = { argb: "FF000000" };
      let pageNumber = 0;
      let sheetNumber = 0;
      for (const category of order) {
        const items = exportMaterials.filter(material => material.category === category);
        if (!items.length) continue;
        sheetNumber++;
        const sheet = book.addWorksheet(categoryName[category], {
          pageSetup: {
            paperSize: 9, orientation: "landscape", fitToPage: true,
            fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
            margins: { left: 0.15, right: 0.15, top: 0.2, bottom: 0.2, header: 0, footer: 0 },
          },
          views: [{ state: "normal", showGridLines: false }],
        });
        sheet.properties.defaultRowHeight = 23.25;
        widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
        let nextRow = 1;
        const merged = (row: number, startCol: number, endCol: number, text: string, align: "center" | "right" = "center") => {
          if (startCol !== endCol) sheet.mergeCells(row, startCol, row, endCol);
          const cell = sheet.getCell(row, startCol);
          cell.value = text;
          cell.font = { name: fontName, size: 18, color: black };
          cell.alignment = { horizontal: align, vertical: "middle", wrapText: true };
        };
        for (let offset = 0; offset < items.length; offset += 20) {
          if (nextRow > 1) sheet.getRow(nextRow - 1).addPageBreak();
          pageNumber++;
          const top = nextRow;
          merged(top, 16, 18, `แผ่นที่ ${pageNumber}`, "right");
          sheet.getRow(top).height = 25;
          merged(top + 1, 1, 18, `บัญชีตรวจสอบพัสดุประจำปีงบประมาณ พ.ศ. ${fiscalYear}`);
          merged(top + 2, 1, 18, "หน่วยงาน สำนักอนามัยการเจริญพันธุ์");
          merged(top + 3, 1, 18, `ประเภท ${categoryName[category]}`);
          merged(top + 4, 1, 18, `เป็นยอดคงเหลือตามบัญชีหรือทะเบียนเมื่อวันที่ 30 ก.ย. ${String(fiscalYear).slice(-2)}`);
          for (let r = top + 1; r <= top + 4; r++) sheet.getRow(r).height = 25;
          sheet.getRow(top + 5).height = 9;
          const h = top + 6;
          const topHeaders: Array<[number, number, string, boolean]> = [
            [1, 1, "ลำดับ", true],
            [2, 2, "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์", true],
            [3, 3, "หน่วยนับ", true],
            [4, 4, "ราคาต่อหน่วย", true],
            [5, 5, `คงเหลือยอดยกมา\nเมื่อ 01 ต.ค. ${startShortYear}`, true],
            [6, 7, `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`, false],
            [8, 8, "คงเหลือปัจจุบัน", true],
            [9, 10, "ผลการตรวจสอบ", false],
            [11, 12, "ถ้าไม่ถูกต้องระบุจำนวนที่ขาด/เกิน", false],
            [13, 13, "จำนวนที่ขาดเกิน\nคิดเป็นเงิน", false],
            [14, 17, "สถานะการใช้งานของวัสดุ (จำนวน)", false],
            [18, 18, "หมายเหตุ", true],
          ];
          for (const [c1, c2, label, spanRows] of topHeaders) {
            if (spanRows) sheet.mergeCells(h, c1, h + 1, c2);
            else if (c1 !== c2) sheet.mergeCells(h, c1, h, c2);
            const cell = sheet.getCell(h, c1);
            cell.value = label;
          }
          const lower = new Map<number, string>([
            [6, "รับ"], [7, "จ่าย"], [9, "ถูกต้อง"], [10, "ไม่ถูกต้อง"],
            [11, "ขาด"], [12, "เกิน"], [13, "(บาท)"], [14, "ใช้การได้"],
            [15, "ชำรุด"], [16, "เสื่อมสภาพ"],
            [17, "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงาน"],
          ]);
          for (const [col, label] of lower) sheet.getCell(h + 1, col).value = label;
          sheet.getRow(h).height = 50;
          sheet.getRow(h + 1).height = 46;
          for (let r = h; r <= h + 1; r++) {
            for (let c = 1; c <= 18; c++) {
              const cell = sheet.getCell(r, c);
              cell.font = { name: fontName, size: 16, color: black };
              cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
              cell.border = { top: line, bottom: line, left: line, right: line };
            }
          }
          const currentItems = items.slice(offset, offset + 20);
          currentItems.forEach((material, index) => {
            const row = sheet.getRow(h + 2 + index);
            const correct = accuracy[material.materialId];
            const status = statuses[material.materialId];
            row.values = [
              offset + index + 1, material.name, material.unit || "-",
              material.latestPrice ?? "", material.openingBalance,
              material.receiveQty, material.issueQty, material.closingBalance,
              correct === "CORRECT" ? "✓" : "", correct === "INCORRECT" ? "✓" : "",
              "", "", "", status === "IN_USE" ? "✓" : "",
              status === "DAMAGED" ? "✓" : "", status === "DETERIORATED" ? "✓" : "",
              status === "UNNECESSARY" ? "✓" : "", "",
            ];
            row.height = 23.25;
            for (let c = 1; c <= 18; c++) {
              const cell = row.getCell(c);
              cell.font = { name: fontName, size: 16, color: black };
              cell.alignment = {
                horizontal: c === 2 || c === 18 ? "left" : "center",
                vertical: "middle", wrapText: true,
              };
              cell.border = { top: line, bottom: line, left: line, right: line };
              if (c === 4 && typeof cell.value === "number") cell.numFmt = "#,##0.00";
              if ([5, 6, 7, 8].includes(c) && typeof cell.value === "number") cell.numFmt = "#,##0";
            }
          });
          nextRow = h + 2 + currentItems.length;
          sheet.getRow(nextRow).height = 9;
          nextRow++;
        }
        sheet.pageSetup.printArea = `A1:R${nextRow - 1}`;
      }
      if (!sheetNumber) {
        alert("ไม่มีรายการสำหรับส่งออก Excel");
        return;
      }
      const bytes = await book.xlsx.writeBuffer();
      const blob = new Blob([bytes as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stock-inventory-report-${fiscalYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Excel export error", error);
      alert("ไม่สามารถส่งออก Excel ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(null);
    }
  };
  const exportPdf = () => {
    if (busy !== null) return;
    if (exportMaterials.length === 0) {
      alert("ไม่มีรายการสำหรับแสดงตัวอย่าง PDF");
      return;
    }
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      alert("เบราว์เซอร์บล็อกหน้าต่างพรีวิว กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้");
      return;
    }
    previewWindow.document.title = "กำลังเปิดตัวอย่าง PDF...";
    previewWindow.document.body.textContent = "กำลังเปิดตัวอย่าง PDF...";
    setBusy("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: false });
      const font = "2.3.2 THSarabunNew";
      const pageWidth = 297;
      const left = 4;
      const tableWidth = 289;
      const columnWidths = [7, 59, 11, 16, 19, 11, 11, 17, 11, 13, 10, 10, 17, 11, 11, 14, 24, 17];
      // 18 คอลัมน์ รวม 289 มม. เพื่อให้พอดีกระดาษ A4 แนวนอน
      const totalWidth = columnWidths.reduce((sum, value) => sum + value, 0);
      if (totalWidth !== tableWidth) throw new Error(`ความกว้างตารางไม่ถูกต้อง: ${totalWidth}`);
      const order = ["OFFICE", "COMPUTER", "ELECTRIC", "HOUSEHOLD", "VEHICLE", "PRINTING"];
      const groups = order.map(category => ({
        category,
        name: categoryName[category],
        items: exportMaterials.filter(material => material.category === category),
      })).filter(group => group.items.length > 0);
      const setFont = (size: number) => {
        doc.setFont(font, "normal");
        doc.setFontSize(size);
        doc.setTextColor(0, 0, 0);
      };
      const headerFontSize = 15;
      const drawHeader = (category: string) => {
        // ทุกบรรทัดของหัวกระดาษ รวมทั้งเลขแผ่นที่ ใช้ฟอนต์ขนาดเดียวกัน
        setFont(headerFontSize);
        doc.text(`บัญชีตรวจสอบพัสดุประจำปีงบประมาณ พ.ศ. ${fiscalYear}`, pageWidth / 2, 8, { align: "center" });
        doc.text("หน่วยงาน สำนักอนามัยการเจริญพันธุ์", pageWidth / 2, 14, { align: "center" });
        doc.text(`ประเภท ${category}`, pageWidth / 2, 20, { align: "center" });
        // ปีงบประมาณ 2569 สิ้นสุดวันที่ 30 กันยายน 2569 (แสดงปีแบบย่อ 69)
        doc.text(`เป็นยอดคงเหลือตามบัญชีหรือทะเบียนเมื่อวันที่ 30 ก.ย. ${String(fiscalYear).slice(-2)}`, pageWidth / 2, 26, { align: "center" });
      };
      const head = [[
        { content: "ลำดับ", rowSpan: 2 },
        { content: "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์", rowSpan: 2 },
        { content: "หน่วยนับ", rowSpan: 2 },
        { content: "ราคาต่อหน่วย", rowSpan: 2 },
        { content: `คงเหลือยอดยกมา\nเมื่อ 01 ต.ค. ${startShortYear}`, rowSpan: 2 },
        { content: `01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`, colSpan: 2 },
        { content: "คงเหลือปัจจุบัน", rowSpan: 2 },
        { content: "ผลการตรวจสอบ", colSpan: 2 },
        { content: "ถ้าไม่ถูกต้องระบุจำนวนที่ขาด/เกิน", colSpan: 2 },
        { content: "จำนวนที่ขาดเกิน\nคิดเป็นเงิน", colSpan: 1 },
        { content: "สถานะการใช้งานของวัสดุ (จำนวน)", colSpan: 4 },
        { content: "หมายเหตุ", rowSpan: 2 },
      ], ["รับ", "จ่าย", "ถูกต้อง", "ไม่ถูกต้อง", "ขาด", "เกิน", "(บาท)", "ใช้การได้", "ชำรุด", "เสื่อมสภาพ", "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงาน"]];
      let firstPage = true;
      for (const group of groups) {
        let itemNo = 0;
        // จำกัดจำนวนแถวต่อหน้าให้มีพื้นที่หัวเอกสารเหมือนเอกสารตรวจสอบต้นแบบ
        for (let offset = 0; offset < group.items.length; offset += 20) {
          if (!firstPage) doc.addPage("a4", "landscape");
          firstPage = false;
          drawHeader(group.name);
          const body: unknown[][] = [];
          for (const material of group.items.slice(offset, offset + 20)) {
            const check = accuracy[material.materialId];
            const status = statuses[material.materialId];
            const numberText = (value: number) => Number.isFinite(value) && value !== 0 ? value.toLocaleString("th-TH") : "-";
            body.push([
              String(++itemNo), material.name, material.unit || "-",
              material.latestPrice === null ? "-" : material.latestPrice.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              numberText(material.openingBalance), numberText(material.receiveQty), numberText(material.issueQty),
              Number.isFinite(material.closingBalance) ? material.closingBalance.toLocaleString("th-TH") : "0",
              check === "CORRECT" ? "__CHECK__" : "", check === "INCORRECT" ? "__CHECK__" : "",
              "", "", "", status === "IN_USE" ? "__CHECK__" : "", status === "DAMAGED" ? "__CHECK__" : "",
              status === "DETERIORATED" ? "__CHECK__" : "", status === "UNNECESSARY" ? "__CHECK__" : "", "",
            ]);
          }
          const columnStyles: Record<number, { cellWidth: number; halign?: "left"; cellPadding?: number | { top: number; right: number; bottom: number; left: number } }> = {};
          columnWidths.forEach((width, index) => { columnStyles[index] = { cellWidth: width }; });
          columnStyles[1] = { cellWidth: columnWidths[1], halign: "left", cellPadding: { top: 0.3, right: 1, bottom: 0.3, left: 1.5 } };
          columnStyles[17] = { cellWidth: columnWidths[17], halign: "left" };
          autoTable(doc, {
            startY: 32,
            tableWidth,
            margin: { left, right: 4, top: 32, bottom: 12 },
            head,
            body: body as any[],
            theme: "grid",
            pageBreak: "avoid",
            rowPageBreak: "avoid",
            styles: {
              font, fontStyle: "normal", fontSize: 9, textColor: [0, 0, 0],
              fillColor: [255, 255, 255], lineColor: [0, 0, 0], lineWidth: 0.25,
              cellPadding: 0.3, minCellHeight: 6.15, halign: "center", valign: "middle", overflow: "linebreak",
            },
            headStyles: {
              font, fontStyle: "normal", fontSize: 8.5, fillColor: [255, 255, 255],
              textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25,
              cellPadding: 0.5, halign: "center", valign: "middle", overflow: "linebreak",
            },
            columnStyles,
            didParseCell: data => {
              if (data.section === "body" && data.cell.raw === "__CHECK__") data.cell.text = [""];
              if (data.section === "body" && data.column.index === 1 && typeof data.cell.raw === "string") {
                const fullName = data.cell.raw;
                setFont(9);
                const segmenter = new Intl.Segmenter("th", { granularity: "word" });
                const tokens = Array.from(segmenter.segment(fullName), part => part.segment);
                const lines: string[] = [];
                let current = "";
                for (const token of tokens) {
                  if (current && doc.getTextWidth(current + token) > columnWidths[1] - 3) {
                    lines.push(current.trimEnd());
                    current = token.trimStart();
                  } else current += token;
                }
                if (current) lines.push(current.trimEnd());
                data.cell.text = lines.length ? lines : [fullName];
                data.cell.styles.overflow = "linebreak";
              }
            },
            didDrawCell: data => {
              if (data.section !== "body" || data.cell.raw !== "__CHECK__") return;
              doc.setFont("zapfdingbats", "normal");
              doc.setFontSize(12);
              doc.setTextColor(0, 0, 0);
              doc.text("3", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: "center", baseline: "middle" });
              setFont(9);
            },
          });
        }
      }
      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        setFont(headerFontSize);
        doc.text(`แผ่นที่ ${page}`, pageWidth - 4, 8, { align: "right" });
      }
      const pdfUrl = URL.createObjectURL(doc.output("blob"));
      previewWindow.location.replace(pdfUrl);
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 5 * 60 * 1000);
    } catch (error) {
      console.error("Preview stock inventory report PDF error:", error);
      if (!previewWindow.closed) previewWindow.close();
      alert("ไม่สามารถเปิดตัวอย่าง PDF ได้");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AppButton type="button" variant="danger" size="md" icon={<span aria-hidden="true">📄</span>} onClick={exportPdf} disabled={busy !== null}>{busy === "pdf" ? "กำลังส่งออก PDF..." : "ส่งออก PDF"}</AppButton>
      <AppButton type="button" variant="success" size="md" icon={<span aria-hidden="true">📊</span>} onClick={exportExcel} disabled={busy !== null}>{busy === "excel" ? "กำลังส่งออก Excel..." : "ส่งออก Excel"}</AppButton>
    </div>
  );
}
