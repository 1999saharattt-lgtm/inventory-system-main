"use client";

import ExcelJS from "exceljs";
import AppButton from "@/components/AppButton";

type Material = {
  code?: string | null;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
  vendor?: { name?: string | null } | null;
  latestPrice?: number | null;
};

type StockRow = {
  date: Date | string;
  documentNo?: string | null;
  owner?: string | null;
  unitPrice: number;
  receiveQty: number;
  issueQty: number;
  balance: number;
  manufacture?: Date | string | null;
  expiry?: Date | string | null;
  type?: string;
};

type Props = { material: Material; rows: StockRow[]; fiscalYear: number };

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const FONT = "TH Sarabun PSK";
const HEADERS = ["วันที่", "เลขที่เอกสาร", "ผู้จำหน่าย / หน่วยงาน", "ราคาล่าสุด", "รับเข้า", "เบิกจ่าย", "คงเหลือ", "วันผลิต", "วันหมดอายุ"];
const PAGE_SIZE = 13;
const WIDTHS = [13, 19, 30, 15, 11, 11, 11, 14, 14];
const BLACK: ExcelJS.Border = { style: "thin", color: { argb: "FF000000" } };
const TABLE_BORDER: Partial<ExcelJS.Borders> = { top: BLACK, bottom: BLACK, left: BLACK, right: BLACK };

function formatThaiDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return `${String(get("day")).padStart(2, "0")} ${thaiShortMonths[get("month") - 1]} ${String(get("year") + 543).slice(-2)}`;
}

function safeNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function setText(cell: ExcelJS.Cell, value: string | number, options?: { size?: number; bold?: boolean; align?: ExcelJS.Alignment["horizontal"]; wrap?: boolean }) {
  cell.value = value;
  cell.font = { name: FONT, size: options?.size ?? 16, bold: options?.bold ?? false, color: { argb: "FF000000" } };
  cell.alignment = { horizontal: options?.align ?? "left", vertical: "middle", wrapText: options?.wrap ?? false, indent: 0 };
}

function infoLine(sheet: ExcelJS.Worksheet, row: number, from: number, to: number, text: string) {
  sheet.mergeCells(row, from, row, to);
  setText(sheet.getCell(row, from), text, { size: 16 });
}

export default function ExportExcel({ material, rows, fiscalYear }: Props) {
  async function handleExport() {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Stock Card";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet(`บัญชีพัสดุ ${fiscalYear}`, {
        views: [{ state: "normal", showGridLines: false }],
        pageSetup: {
          paperSize: 9, orientation: "landscape", fitToPage: true,
          fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
          margins: { left: 0.35, right: 0.35, top: 0.35, bottom: 0.35, header: 0.1, footer: 0.1 },
        },
      });
      WIDTHS.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
      sheet.properties.defaultRowHeight = 23;
      const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      for (let page = 0; page < pages; page++) {
        const base = page * 23;
        if (page > 0) sheet.getRow(base + 1).addPageBreak();
        sheet.mergeCells(base + 1, 1, base + 1, 9);
        setText(sheet.getCell(base + 1, 1), "บัญชีพัสดุ", { size: 26, bold: true, align: "center" });
        sheet.getRow(base + 1).height = 35;
        sheet.mergeCells(base + 2, 1, base + 2, 9);
        setText(sheet.getCell(base + 2, 1), `ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`, { size: 17, align: "center" });
        sheet.getRow(base + 2).height = 25;
        infoLine(sheet, base + 3, 5, 9, "ส่วนราชการ  กระทรวงสาธารณสุข  กรมอนามัย");
        infoLine(sheet, base + 4, 5, 9, "หน่วยงาน  สำนักอนามัยการเจริญพันธุ์");
        sheet.getRow(base + 3).height = 23;
        sheet.getRow(base + 4).height = 23;
        infoLine(sheet, base + 5, 1, 4, `รหัสพัสดุ : ${material.code || "-"}`);
        infoLine(sheet, base + 5, 5, 9, `รายการพัสดุ : ${material.name || "-"}`);
        infoLine(sheet, base + 6, 1, 4, `หมวดหมู่ : ${categoryName[material.category ?? ""] ?? material.category ?? "-"}`);
        infoLine(sheet, base + 6, 5, 9, `หน่วย : ${material.unit || "-"}`);
        infoLine(sheet, base + 7, 1, 4, `ผู้จำหน่าย : ${material.vendor?.name ?? "-"}`);
        infoLine(sheet, base + 7, 5, 9, `ราคาล่าสุด : ${material.latestPrice == null ? "-" : safeNumber(material.latestPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`);
        for (let r = base + 5; r <= base + 7; r++) sheet.getRow(r).height = 27;
        sheet.getRow(base + 8).height = 12;
        const headerRow = base + 9;
        HEADERS.forEach((header, col) => {
          const cell = sheet.getCell(headerRow, col + 1);
          setText(cell, header, { size: 16, bold: true, align: "center", wrap: true });
          cell.border = TABLE_BORDER;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        });
        sheet.getRow(headerRow).height = 30;
        const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        for (let i = 0; i < PAGE_SIZE; i++) {
          const source = pageRows[i];
          const rowNo = base + 10 + i;
          const values: (string | number)[] = source ? [
            formatThaiDate(source.date), source.documentNo || "-", source.owner || "-",
            safeNumber(source.unitPrice),
            safeNumber(source.receiveQty) > 0 ? safeNumber(source.receiveQty) : "-",
            safeNumber(source.issueQty) > 0 ? safeNumber(source.issueQty) : "-",
            source.balance == null ? "-" : safeNumber(source.balance),
            formatThaiDate(source.manufacture), formatThaiDate(source.expiry),
          ] : ["", "", "", "", "", "", "", "", ""];
          values.forEach((value, index) => {
            const cell = sheet.getCell(rowNo, index + 1);
            setText(cell, value, { size: 16, align: index === 2 ? "left" : index === 3 ? "right" : "center", wrap: index === 2 });
            cell.border = TABLE_BORDER;
            if (typeof value === "number") cell.numFmt = index === 3 ? "#,##0.00" : "#,##0";
          });
          sheet.getRow(rowNo).height = 29;
        }
      }
      sheet.pageSetup.printArea = `A1:I${pages * 23}`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeFileName(`บัญชีพัสดุ_${material.code || "material"}_${material.name || "stock-card"}_ปีงบประมาณ_${fiscalYear}`)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("ไม่สามารถสร้าง Excel ได้:", error);
      alert("ไม่สามารถสร้างไฟล์ Excel ได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <AppButton type="button" variant="success" size="md" onClick={handleExport}
      icon={<span aria-hidden="true">📊</span>}>
      ส่งออก Excel
    </AppButton>
  );
}
