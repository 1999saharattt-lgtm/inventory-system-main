"use client";

import "@/lib/fonts/THSarabunNew-normal";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AppButton from "@/components/AppButton";

type Asset = {
  id: number;
  name: string;
  category: string;
  categoryDetail?: string | null;
  brand: string | null;
  model: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
  departmentName?: string | null;
  sectionName?: string | null;
  officerName?: string | null;
  responsibleName?: string | null;
  department?: { name: string } | null;
  section?: { name: string } | null;
  officer?: { firstName: string; lastName: string } | null;
  status: string;
  remark?: string | null;
  quantity?: number | null;
  unit?: string | null;
};

type Props = {
  departmentName: string;
  assets: Asset[];
  fiscalYear?: number;
  departmentId?: number;
  department?: { id: number; name: string };
};

const FONT = "2.3.2 THSarabunNew";
const HEAD = [
  "ลำดับ", "รหัส GFMIS", "รหัสครุภัณฑ์", "สถานที่ใช้งาน", "ผู้รับผิดชอบ",
  "หมวด/ชนิด", "ชื่อเรียก/คุณลักษณะครุภัณฑ์", "ยี่ห้อ/รุ่น",
  "ยอดคงเหลือ", "หน่วยนับ", "สถานะ",
];
const HEADER_WRAP: Record<number, string> = { 1: "รหัส\nGFMIS", 2: "รหัส\nครุภัณฑ์", 3: "สถานที่\nใช้งาน", 4: "ชื่อผู้\nครอบครอง", 6: "ชื่อเรียก/คุณลักษณะ\nครุภัณฑ์", 8: "ยอด\nคงเหลือ", 9: "หน่วย\nนับ" };
const WIDTHS = [9, 29, 31, 28, 29, 34, 48, 30, 13, 12, 16]; // 279 mm; ขอบซ้าย-ขวา 9 mm
const CATEGORY_ORDER = ["DESK", "CHAIR", "CABINET", "SHELF", "COMPUTER", "PRINTER", "AIR_CONDITIONER", "TELEPHONE", "UPS", "OTHER", "NO_SYSTEM"];
const CATEGORY_NAME: Record<string, string> = {
  DESK: "โต๊ะ", CHAIR: "เก้าอี้", CABINET: "ตู้", SHELF: "ชั้น",
  COMPUTER: "คอมพิวเตอร์", PRINTER: "เครื่องพิมพ์คอมพิวเตอร์",
  AIR_CONDITIONER: "เครื่องปรับอากาศ", TELEPHONE: "เครื่องโทรศัพท์",
  UPS: "เครื่องสำรองไฟฟ้า (UPS)", OTHER: "ทั่วไป", NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};
const CATEGORY_DEFAULT: Record<string, string> = {
  DESK: "โต๊ะ, โต๊ะทำงาน, โต๊ะสำหรับวางคอมพิวเตอร์, โต๊ะวางของอเนกประสงค์",
  CHAIR: "เก้าอี้, เก้าอี้สำนักงานพนักพิงสูง, เก้าอี้สำหรับห้องประชุม",
  CABINET: "ตู้, ตู้ใส่เอกสาร 2 บานเปิด, ตู้เก็บเอกสารบานสไลด์, ตู้เอกสาร",
  SHELF: "ชั้น",
  COMPUTER: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
  PRINTER: "เครื่องพิมพ์คอมพิวเตอร์, เครื่องพิมพ์เลเซอร์ขาวดำ ชนิด Network แบบที่ 1, เครื่องพิมพ์เลเซอร์ LED สี ชนิด Network แบบที่ 2",
  AIR_CONDITIONER: "เครื่องปรับอากาศแบบติดผนัง, เครื่องปรับอากาศแบบแขวนฝ้าเพดาน",
  TELEPHONE: "เครื่องโทรศัพท์ ชนิด IP PHONE ไร้สาย",
  UPS: "เครื่องสำรองไฟฟ้า, เครื่องสำรองไฟฟ้า ชนิด True Online UPS",
};
const UNIT: Record<string, string> = {
  DESK: "ตัว", CHAIR: "ตัว", CABINET: "ตู้", SHELF: "ตัว",
  COMPUTER: "เครื่อง", MONITOR: "เครื่อง", PRINTER: "เครื่อง",
  AIR_CONDITIONER: "เครื่อง", TELEPHONE: "เครื่อง", UPS: "เครื่อง",
  OTHER: "รายการ", NO_SYSTEM: "รายการ",
};
const STATUS: Record<string, string> = {
  IN_USE: "ยังใช้งาน", ACTIVE: "ยังใช้งาน", INACTIVE: "ไม่ใช้งาน",
  DAMAGED: "ชำรุด", WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว", LOST: "สูญหาย",
};

function groupOf(a: Asset) {
  if (a.category === "OTHER") {
    const type = a.categoryDetail?.trim() || a.name;
    if (/เครื่องสำรองไฟฟ้า|\bUPS\b/i.test(type)) return "UPS";
    if (a.categoryDetail?.trim() === "ชั้น") return "SHELF";
  }
  if (a.category === "MONITOR") return "COMPUTER";
  return a.category;
}
function typeOf(a: Asset, group: string) {
  if (a.categoryDetail?.trim()) return a.categoryDetail.trim();
  const first = (a.remark || "").split("\n")[0].trim();
  if (first.startsWith("หมวด/ชนิด:") && first.slice("หมวด/ชนิด:".length).trim()) {
    return first.slice("หมวด/ชนิด:".length).trim();
  }
  if (group === "OTHER") {
    if (/เครื่องเล่นเทปคาสเซ็ท/i.test(a.name)) return "เครื่องเล่นเทปคาสเซ็ท";
    if (/รถเข็น/i.test(a.name)) return "รถเข็น";
    return "ทั่วไป";
  }
  return CATEGORY_DEFAULT[group] || CATEGORY_NAME[group] || group;
}
function unitOf(a: Asset) {
  if (a.unit?.trim() && a.unit.trim() !== "-") return a.unit.trim();
  return UNIT[a.category] || "รายการ";
}
function getFiscalYearBangkok() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return year + 543 + (month >= 10 ? 1 : 0);
}

// ตัดคำไทยตามขอบเขตคำ ไม่ตัดกลางสระหรือวรรณยุกต์ และไม่ละทิ้งข้อความ
function wrapThai(doc: jsPDF, value: string, width: number): string[] {
  const text = String(value || "-").replace(/\s+/g, " ").trim();
  const parts = typeof Intl.Segmenter !== "undefined"
    ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text), (item) => item.segment)
    : text.split(/(?<=\s|[,/])/u);
  const lines: string[] = [];
  let line = "";
  for (const part of parts) {
    if (doc.getTextWidth(line + part) <= width) { line += part; continue; }
    if (line.trim()) { lines.push(line.trim()); line = ""; }
    // คำยาวกว่าความกว้างคอลัมน์: เก็บทั้งคำไว้ แล้วลดขนาดฟอนต์ภายหลัง
    line = part.trimStart();
  }
  if (line.trim()) lines.push(line.trim());
  return lines.length ? lines : ["-"];
}

// ใช้ฟอนต์เล็กลงเฉพาะช่องที่ข้อความยาว เพื่อรักษาข้อความครบทุกตัวอักษร
function fitText(doc: jsPDF, value: string, width: number, maxLines: number): { text: string; size: number } {
  for (let size = 12; size >= 5; size -= 0.5) {
    doc.setFontSize(size);
    const lines = wrapThai(doc, value, width);
    if (lines.length <= maxLines && lines.every((line) => doc.getTextWidth(line) <= width)) {
      return { text: lines.join("\n"), size };
    }
  }
  // กรณีข้อความยาวผิดปกติ ไม่ตัดข้อมูลทิ้ง: เพิ่มบรรทัดในช่องนั้น
  doc.setFontSize(5);
  return { text: wrapThai(doc, value, width).join("\n"), size: 5 };
}

export default function ExportDepartmentAssetsPdf({ departmentName, assets, fiscalYear }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  async function handleExportPdf() {
    if (isExporting || assets.length === 0) return;
    setIsExporting(true);
    try {
      const year = fiscalYear && Number.isInteger(fiscalYear) ? fiscalYear : getFiscalYearBangkok();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      doc.setFont(FONT, "normal");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const tableWidth = WIDTHS.reduce((a, b) => a + b, 0);
      const left = (pageWidth - tableWidth) / 2;
      const top = 39;
      const bottom = 10;
      const headHeight = 13;
      const rowHeight = 12;
      const rowsPerPage = 12; // ทุกหน้า 12 แถว (ยกเว้นหน้าสุดท้าย)
      const ordered = [...assets].sort((a, b) => {
        const aa = CATEGORY_ORDER.indexOf(groupOf(a));
        const bb = CATEGORY_ORDER.indexOf(groupOf(b));
        return (aa < 0 ? 999 : aa) - (bb < 0 ? 999 : bb);
      });
      const totalPages = Math.ceil(ordered.length / rowsPerPage);
      const colStyles = Object.fromEntries(WIDTHS.map((w, i) => [i, { cellWidth: w }]));
      function drawHeader(page: number) {
        doc.setFont(FONT, "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(23);
        doc.text("ทะเบียนคุมบัญชีครุภัณฑ์", pageWidth / 2, 14, { align: "center" });
        doc.setFontSize(15);
        doc.text(departmentName, pageWidth / 2, 22, { align: "center" });
        doc.text(`ประจำปีงบประมาณ พ.ศ. ${year}`, pageWidth / 2, 29, { align: "center" });
        doc.setFontSize(15);
        doc.text(`แผ่นที่ ${page}`, pageWidth - left, 22, { align: "right" });
      }
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();
        const pageAssets = ordered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
        doc.setFont(FONT, "normal");
        doc.setFontSize(11);
        const fontSizes: number[][] = [];
        const body = pageAssets.map((a, i) => {
          const group = groupOf(a);
          const location = a.section?.name?.trim() || departmentName;
          const officer = a.officer
            ? `${a.officer.firstName} ${a.officer.lastName}`.trim()
            : a.responsibleName?.trim() || "-";
          const raw = [
            String(page * rowsPerPage + i + 1), a.governmentAssetNo || "-", a.officeAssetNo || "-",
            location, officer, typeOf(a, group), a.name || "-",
            [a.brand, a.model].filter(Boolean).join(" / ") || "-",
            Number(a.quantity ?? 1).toLocaleString("th-TH"), unitOf(a), STATUS[a.status] || a.status,
          ];
          const fitted = raw.map((value, col) => fitText(doc, String(value), WIDTHS[col] - 2.6, [1, 2, 3, 4].includes(col) ? 1 : 3));
          fontSizes[i] = fitted.map((cell) => cell.size);
          return fitted.map((cell) => cell.text);
        });
        autoTable(doc, {
          startY: top, margin: { left, right: left, top, bottom }, tableWidth,
          head: [HEAD.map((h, i) => HEADER_WRAP[i] || h)], body, theme: "grid", showHead: "firstPage",
          pageBreak: "avoid", rowPageBreak: "avoid",
          styles: {
            font: FONT, fontStyle: "normal", fontSize: 11, cellPadding: 0.8,
            halign: "center", valign: "middle", lineColor: [0, 0, 0],
            lineWidth: 0.18, textColor: [0, 0, 0], overflow: "hidden", minCellHeight: rowHeight,
          },
          headStyles: {
            font: FONT, fontStyle: "normal", fontSize: 10, cellPadding: 0.8,
            fillColor: [255, 255, 255], textColor: [0, 0, 0],
            halign: "center", valign: "middle", minCellHeight: headHeight,
            lineColor: [0, 0, 0], lineWidth: 0.18,
          },
          columnStyles: colStyles,
          didParseCell: (data) => {
            if (data.section === "body") {
              data.cell.styles.fontSize = fontSizes[data.row.index]?.[data.column.index] ?? 11;
              if ([5, 6, 7].includes(data.column.index)) data.cell.styles.halign = "left";
            }
          },
        });
        drawHeader(page + 1);
      }
      const url = URL.createObjectURL(doc.output("blob"));
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("ไม่สามารถสร้าง PDF ได้:", error);
      alert("ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  }
  return (
    <AppButton type="button" variant="danger" size="md" onClick={handleExportPdf}
      disabled={isExporting || assets.length === 0}
      icon={<span aria-hidden="true">{isExporting ? "⏳" : "📄"}</span>}>
      {isExporting ? "กำลังสร้าง PDF..." : "ส่งออก PDF"}
    </AppButton>
  );
}
