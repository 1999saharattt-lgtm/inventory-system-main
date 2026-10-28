"use client";

import { useState } from "react";
import AppButton from "@/components/AppButton";

type Department = { id: number; name: string };
type Asset = {
  id: number; name: string; category: string; categoryDetail?: string | null;
  quantity?: number; unit?: string | null; brand: string | null; model: string | null;
  governmentAssetNo: string | null; officeAssetNo: string | null;
  responsibleName?: string | null; departmentId: number; remark: string | null;
  officer: { firstName: string; lastName: string } | null;
};
type InspectionRow = { assetId: number; countedQty: string; accuracy: string; status: string; remark: string };
type Officer = {
  id: number; firstName: string; lastName: string; position: string | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};
type Props = {
  department: Department; assets: Asset[]; rows: InspectionRow[];
  inspectionStartDate: string; inspectionEndDate: string; inspectorIds: string[];
  accountStartDate: string; accountEndDate: string; movementFiscalYear: string;
  officers?: Officer[];
};

const FONT = "TH SarabunPSK";
const FULL_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const SHORT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function thaiDate(value: string, short = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!m) return "........";
  const year = Number(m[1]); const month = Number(m[2]); const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "........";
  return short
    ? `${String(day).padStart(2, "0")} ${SHORT_MONTHS[month - 1]} ${String((year + 543) % 100).padStart(2, "0")}`
    : `${day} ${FULL_MONTHS[month - 1]} ${year + 543}`;
}
function categoryName(a: Asset) {
  const saved = a.categoryDetail?.trim(); if (saved && saved !== "-") return saved;
  const old = a.remark?.match(/(?:^|\n)หมวด\/ชนิด:\s*([^\n]+)/)?.[1]?.trim();
  if (old && old !== "-") return old;
  if (a.category === "OTHER") {
    if (/เครื่องสำรองไฟ|\bUPS\b/i.test(`${a.name} ${a.brand ?? ""} ${a.model ?? ""}`))
      return "เครื่องสำรองไฟฟ้า, เครื่องสำรองไฟฟ้า ชนิด True Online UPS";
    return "ทั่วไป";
  }
  const defaults: Record<string, string> = {
    CHAIR: "เก้าอี้, เก้าอี้สำนักงานพนักพิงสูง, เก้าอี้สำหรับห้องประชุม",
    AIR_CONDITIONER: "เครื่องปรับอากาศแบบติดผนัง, เครื่องปรับอากาศแบบแขวนฝ้าเพดาน",
    TELEPHONE: "เครื่องโทรศัพท์ ชนิด IP PHONE ไร้สาย", SHELF: "ชั้น",
    CABINET: "ตู้, ตู้ใส่เอกสาร 2 บานเปิด, ตู้เก็บเอกสารบานสไลด์, ตู้เอกสาร",
    DESK: "โต๊ะ, โต๊ะทำงาน, โต๊ะสำหรับวางคอมพิวเตอร์, โต๊ะวางของอเนกประสงค์",
    COMPUTER: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
    MONITOR: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
    PRINTER: "เครื่องพิมพ์คอมพิวเตอร์, เครื่องพิมพ์เลเซอร์ขาวดำ ชนิด Network แบบที่ 1, เครื่องพิมพ์เลเซอร์ LED สี ชนิด Network แบบที่ 2",
  };
  return defaults[a.category] ?? a.category;
}
function unitName(a: Asset) {
  if (a.unit?.trim()) return a.unit.trim();
  const map: Record<string, string> = {
    COMPUTER: "เครื่อง", DESKTOP: "เครื่อง", LAPTOP: "เครื่อง", MONITOR: "เครื่อง",
    PRINTER: "เครื่อง", TELEPHONE: "เครื่อง", AIR_CONDITIONER: "เครื่อง", FAN: "เครื่อง",
    CHAIR: "ตัว", DESK: "ตัว", TABLE: "ตัว", SHELF: "ตัว", CABINET: "ตู้",
  };
  return map[a.category] ?? "รายการ";
}
function sourceOrder(a: Asset, index: number) {
  const match = a.remark?.match(/SOURCE:DEPARTMENT_1:(\d+)/);
  return match ? Number(match[1]) : index + 1;
}
// ความกว้างคอลัมน์สำหรับ A4 แนวนอน: คงหมวด/ชนิด และรายการเคลื่อนไหวเดิม
const COLS = [6, 17, 19, 24, 21, 18, 34, 16, 9, 15, 8, 8, 15, 12, 9, 11, 10, 9, 11, 13];
const MAX_COLUMN_WIDTHS = [7, 20, 25, 26, 24, 18, 34, 19, 9, 15, 8, 8, 15, 12, 9, 11, 10, 9, 11, 13];
const WIDTH_EXCEPTIONS = new Set([5, 10, 11]);
function fitColumnWidths(assets: Asset[], department: Department, officers: Officer[]) {
  const widths = COLS.map((base, index) => {
    if (WIDTH_EXCEPTIONS.has(index)) return base;
    const samples: string[] = [];
    if (index === 1) samples.push("รหัส GFMIS");
    if (index === 2) samples.push("รหัสครุภัณฑ์");
    if (index === 3) samples.push("สถานที่ใช้งาน", department.name);
    if (index === 4) samples.push("ผู้รับผิดชอบ");
    if (index === 6) samples.push("ชื่อเรียก/คุณลักษณะครุภัณฑ์");
    if (index === 7) samples.push("ยี่ห้อ/รุ่น");
    if (index === 8) samples.push("หน่วยนับ");
    for (const a of assets) {
      const owner = a.responsibleName?.trim() || (a.officer ? `${a.officer.firstName} ${a.officer.lastName}`.trim() : "");
      const fields = ["", a.governmentAssetNo ?? "", a.officeAssetNo ?? "", department.name,
        owner, "", a.name ?? "", [a.brand, a.model].filter(Boolean).join(" / "), unitName(a)];
      if (index < fields.length && fields[index]) samples.push(fields[index]);
    }
    // ข้อความยาวมากให้ตัดบรรทัดแทนการขยายคอลัมน์จนกระดาษล้น
    const longest = samples.reduce((max, v) => Math.max(max, Array.from(v).length), 0);
    return Math.max(index === 0 ? 6 : 9, Math.min(MAX_COLUMN_WIDTHS[index], Math.max(base * 0.72, longest * 0.8 + 2)));
  });
  // ความกว้างคอลัมน์ที่พิมพ์ได้จริงถูกย่อรวมให้พอดี A4 แนวนอน
  return widths;
}

export default function ExportInspectionExcel({ department, assets, rows, inspectionStartDate, inspectionEndDate, inspectorIds, accountStartDate, accountEndDate, movementFiscalYear, officers = [] }: Props) {
  const [busy, setBusy] = useState(false);
  async function handleExport() {
    if (busy || !assets.length) return;
    setBusy(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "ระบบตรวจสอบครุภัณฑ์";
      const ws = wb.addWorksheet("กระดาษทำการตรวจสอบ", {
        pageSetup: {
          paperSize: 9, orientation: "landscape", fitToPage: true,
          fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
          margins: { left: 0.15, right: 0.15, top: 0.2, bottom: 0.2, header: 0, footer: 0 },
        },
        views: [{ state: "normal", showGridLines: false }],
      });
      ws.properties.defaultRowHeight = 15;
      ws.pageSetup.fitToPage = true;
      ws.pageSetup.fitToWidth = 1;
      ws.pageSetup.fitToHeight = 0;
      ws.pageSetup.horizontalCentered = true;
      ws.pageSetup.verticalCentered = false;
      // ความกว้างเทียบสัดส่วน PDF: ปรับขนาดให้พอดีหน้ากระดาษแนวนอน
      fitColumnWidths(assets, department, officers).forEach((width, i) => { ws.getColumn(i + 1).width = width * 0.85 + 1.6; });
      const border = { style: "thin" as const, color: { argb: "FF000000" } };
      const rowMap = new Map(rows.map(r => [r.assetId, r]));
      const fy = Number(movementFiscalYear);
      const start = Number.isInteger(fy) ? `${fy - 544}-10-01` : accountStartDate;
      const end = Number.isInteger(fy) ? `${fy - 543}-09-30` : accountEndDate;
      // จัดหน้าแบบไหลตามความสูงจริง: สูงสุด 15 รายการต่อหน้า หากแถวสูงเกินพื้นที่กรรมการให้ขึ้นหน้าใหม่
      // ความกว้าง 20 คอลัมน์ถูกย่อให้พอดีกับ A4 แนวนอนเมื่อพิมพ์
      // ดังนั้นความสูงแถวใน worksheet (ก่อนย่อ) ไม่ควรเทียบตรงกับ 595 pt ของกระดาษ
      // พื้นที่เดิม 334 pt ตัดหน้าตั้งแต่ ~9 รายการ ทั้งที่ Print Preview เหลือพื้นที่มาก
      // เพิ่มพื้นที่ข้อมูลก่อนย่อเป็น 510 pt เพื่อรองรับสูงสุด 15 รายการ
      // และยังตรวจความสูงแต่ละแถวก่อนนำลงหน้า โดยกันส่วนกรรมการไว้ต่างหาก
      const MAX_ROWS_PER_PAGE = 15;
      const BODY_BUDGET_PT = 510;
      let assetIndex = 0;
      let page = 0;
      let rowNo = 1;
      const writeMerged = (r1: number, c1: number, r2: number, c2: number, value: string, size = 12) => {
        if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
        const cell = ws.getCell(r1, c1);
        cell.value = value;
        cell.font = { name: FONT, size, color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      };
      const outline = (r1: number, r2: number) => {
        for (let r = r1; r <= r2; r++) for (let c = 1; c <= 20; c++) {
          const cell = ws.getCell(r, c);
          cell.border = { top: border, bottom: border, left: border, right: border };
        }
      };
      while (assetIndex < assets.length || page === 0) {
        if (page > 0) ws.getRow(rowNo - 1).addPageBreak();
        const first = rowNo;
        // แผ่นที่แยกเหนือหัวกระดาษตามภาพอ้างอิง; หัวเรื่องผสานเต็ม A:T
        writeMerged(first, 18, first, 20, `แผ่นที่ ${page + 1}`, 14);
        ws.getRow(first).height = 19;
        writeMerged(first + 1, 1, first + 1, 20, `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${movementFiscalYear}`, 15);
        ws.getRow(first + 1).height = 23;
        writeMerged(first + 2, 1, first + 2, 20, "สำนักอนามัยการเจริญพันธุ์", 15);
        ws.getRow(first + 2).height = 23;
        writeMerged(first + 3, 1, first + 3, 20, `เริ่มดำเนินการตรวจสอบวันที่ ${thaiDate(inspectionStartDate)} และตรวจสอบ แล้วเสร็จวันที่ ${thaiDate(inspectionEndDate)}`, 15);
        ws.getRow(first + 3).height = 23;
        ws.getRow(first + 4).height = 7;
        const h = first + 5;
        outline(h, h + 1);
        const h1: Array<[number, number, string, boolean]> = [
          [1, 1, "ลำดับ", true], [2, 2, "รหัส GFMIS", true], [3, 3, "รหัสครุภัณฑ์", true],
          [4, 4, "สถานที่ใช้งาน", true], [5, 5, "ผู้รับผิดชอบ", true], [6, 6, "หมวด/ชนิด", true],
          [7, 7, "ชื่อเรียก/คุณลักษณะ\nครุภัณฑ์", true], [8, 8, "ยี่ห้อ/รุ่น", true],
          [9, 9, "หน่วย\nนับ", true], [10, 10, `ยอดคงเหลือ\nตามบัญชี\nณ วันที่ ${thaiDate(start, true)}`, true],
          [11, 12, `รายการเคลื่อนไหว\nระหว่างปีงบประมาณ\nพ.ศ. ${movementFiscalYear}`, false],
          [13, 13, `ยอดคงเหลือ\nตามบัญชี\nณ วันที่ ${thaiDate(end, true)}`, true],
          [14, 14, "จำนวนที่\nตรวจนับได้", true],
          [15, 16, "ผลการตรวจนับถูกต้อง\nตรงกับยอดคงเหลือ\nตามบัญชี", false],
          [17, 20, "สภาพครุภัณฑ์ที่ตรวจนับ", false],
        ];
        for (const [a, b, label, full] of h1) writeMerged(h, a, full ? h + 1 : h, b, label, 8.5);
        ["รับ", "จ่าย", "ถูกต้อง", "ไม่ถูกต้อง", "ใช้งานปกติ", "ชำรุด", "เสื่อมสภาพ", "ไม่จำเป็นต้องใช้"].forEach((label, i) => {
          const col = [11, 12, 15, 16, 17, 18, 19, 20][i];
          writeMerged(h + 1, col, h + 1, col, label, 8.5);
        });
        ws.getRow(h).height = 35;
        ws.getRow(h + 1).height = 21;
        let lastData = h + 1;
        let bodyHeight = 0;
        let pageDataCount = 0;
        while (assetIndex < assets.length && pageDataCount < MAX_ROWS_PER_PAGE) {
          const i = assetIndex;
          const a = assets[i];
          const r = rowMap.get(a.id) ?? { countedQty: "", accuracy: "", status: "", remark: "" };
          const owner = a.responsibleName?.trim() || (a.officer ? `${a.officer.firstName} ${a.officer.lastName}`.trim() : "");
          const values: Array<string | number> = [
            sourceOrder(a, i), a.governmentAssetNo?.trim() ?? "", a.officeAssetNo?.trim() ?? "",
            department.name, owner, categoryName(a), a.name ?? "", [a.brand, a.model].filter(Boolean).join(" / "),
            unitName(a), a.quantity ?? 1, "", "", a.quantity ?? 1,
            !r.countedQty.trim() || Number(r.countedQty) === 0 ? "" : Number(r.countedQty),
            r.accuracy === "CORRECT" ? "✓" : "", r.accuracy === "INCORRECT" ? "✓" : "",
            r.status === "IN_USE" ? "✓" : "", r.status === "DAMAGED" ? "✓" : "",
            r.status === "DETERIORATED" ? "✓" : "", r.status === "UNUSABLE" ? "✓" : "",
          ];
          // ความสูงแถวแยกตามข้อความจริง ไม่บังคับให้ทุกแถวสูงเท่ากัน
          // คิดความกว้างเป็นอักขระโดยประมาณตามความกว้างคอลัมน์ Excel
          const lines = values.reduce<number>((max, v, col) => {
            const text = String(v ?? "");
            const width = ws.getColumn(col + 1).width ?? 12;
            // คำนวณจำนวนบรรทัดให้สอดคล้องกับฟอนต์ TH SarabunPSK ขนาดเล็กที่ใช้ในตาราง
            // ลดการประเมินความสูงเกินจริงซึ่งทำให้พิมพ์ได้เพียง 4 แถวต่อหน้า
            const charsPerLine = Math.max(5, Math.floor(width * (col <= 2 ? 1.35 : 2.35)));
            const count = text.split("\n").reduce((sum, part) =>
              sum + Math.max(1, Math.ceil(Array.from(part).length / charsPerLine)), 0);
            return Math.max(max, count);
          }, 1);
          // กำหนดความสูงตามจำนวนบรรทัดจริง พร้อมช่องไฟเหนือ-ใต้ ไม่บีบข้อความให้ชนเส้น
          // สูงสุด 15 แถวต่อหน้า และขึ้นหน้าใหม่ก่อนพื้นที่ลงชื่อกรรมการ
          const rowHeight = Math.max(24, lines * 12 + 12);
          if (bodyHeight + rowHeight > BODY_BUDGET_PT && bodyHeight > 0) break;
          const rr = ++lastData;
          ws.getRow(rr).height = rowHeight;
          bodyHeight += rowHeight;
          assetIndex++;
          pageDataCount++;
          values.forEach((v, col) => {
            const cell = ws.getCell(rr, col + 1);
            cell.value = v;
            cell.font = { name: FONT, size: col <= 2 ? 11.5 : 9.5, color: { argb: "FF000000" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = { top: border, bottom: border, left: border, right: border };
          });
        }
        // ส่วนลงชื่อกรรมการ: พื้นที่ไร้เส้นตารางแยกจากข้อมูล 5 ส่วนเท่ากัน
        // ExcelJS ไม่รองรับ floating Text Box; ใช้เซลล์ผสานเพื่อให้พิมพ์ไม่เลื่อน
        // พื้นที่ว่างยืดตามจำนวนแถว เพื่อให้กรรมการอยู่ตำแหน่งคงที่ทุกหน้า
        const signRow = lastData + 2;
        ws.getRow(lastData + 1).height = Math.max(13, BODY_BUDGET_PT - bodyHeight + 13);
        const signLines = [signRow, signRow + 1, signRow + 2];
        signLines.forEach((r) => { ws.getRow(r).height = 17; });
        for (let i = 0; i < 5; i++) {
          const c1 = i * 4 + 1;
          const c2 = c1 + 3;
          const officer = officers.find(o => String(o.id) === (inspectorIds[i] ?? ""));
          const name = officer ? `${officer.firstName} ${officer.lastName}`.trim() : "................................";
          const position = officer?.position?.trim() || "................................";
          const texts = ["ลงชื่อ ................................", `(${name})`, position];
          for (let line = 0; line < 3; line++) {
            const r = signRow + line;
            writeMerged(r, c1, r, c2, texts[line], 11);
            const cell = ws.getCell(r, c1);
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true, shrinkToFit: true };
            cell.border = {}; // กล่องข้อความไม่มีกรอบตาราง
          }
        }
        ws.getRow(signRow + 3).height = 9;
        rowNo = signRow + 4;
        page++;
      }
      ws.pageSetup.printArea = `A1:T${rowNo - 2}`;
      // กำหนดการพิมพ์ให้ย่อพอดีความกว้าง A4 แนวนอน
      ws.pageSetup.paperSize = 9;
      ws.pageSetup.orientation = "landscape";
      const bytes = await wb.xlsx.writeBuffer();
      const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safe = department.name.replace(/[\\/:*?"<>|]/g, "_").trim();
      link.href = url;
      link.download = `กระดาษทำการตรวจสอบพัสดุ_${safe}_พ.ศ.${movementFiscalYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Excel export error", error);
      alert("ไม่สามารถส่งออก Excel ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppButton type="button" variant="success" size="md" onClick={handleExport} disabled={busy || assets.length === 0} icon={<span aria-hidden="true">📊</span>}>
      {busy ? "กำลังสร้าง Excel..." : "ส่งออก Excel"}
    </AppButton>
  );
}
