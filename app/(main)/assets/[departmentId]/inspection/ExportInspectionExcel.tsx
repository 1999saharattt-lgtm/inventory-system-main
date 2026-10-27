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
const COLS = [6, 17, 19, 24, 21, 18, 34, 16, 9, 15, 8, 8, 15, 12, 9, 11, 10, 9, 11, 13];

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
      // ความกว้างเทียบสัดส่วน PDF: ปรับขนาดให้พอดีหน้ากระดาษแนวนอน
      COLS.forEach((width, i) => { ws.getColumn(i + 1).width = width * 0.85 + 1.6; });
      const border = { style: "thin" as const, color: { argb: "FF000000" } };
      const rowMap = new Map(rows.map(r => [r.assetId, r]));
      const fy = Number(movementFiscalYear);
      const start = Number.isInteger(fy) ? `${fy - 544}-10-01` : accountStartDate;
      const end = Number.isInteger(fy) ? `${fy - 543}-09-30` : accountEndDate;
      const pages = Math.max(1, Math.ceil(assets.length / 4));
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
      for (let page = 0; page < pages; page++) {
        if (page > 0) ws.getRow(rowNo - 1).addPageBreak();
        const first = rowNo;
        writeMerged(first, 1, first, 18, `กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ. ${movementFiscalYear}`, 15);
        writeMerged(first, 19, first, 20, `แผ่นที่ ${page + 1}`, 15);
        ws.getRow(first).height = 24;
        writeMerged(first + 1, 1, first + 1, 20, "สำนักอนามัยการเจริญพันธุ์", 15);
        ws.getRow(first + 1).height = 24;
        writeMerged(first + 2, 1, first + 2, 20, `เริ่มดำเนินการตรวจสอบวันที่ ${thaiDate(inspectionStartDate)} และตรวจสอบ แล้วเสร็จวันที่ ${thaiDate(inspectionEndDate)}`, 15);
        ws.getRow(first + 2).height = 24;
        ws.getRow(first + 3).height = 8;
        const h = first + 4;
        outline(h, h + 1);
        const h1: Array<[number, number, string, boolean]> = [
          [1, 1, "ลำดับ", true], [2, 2, "รหัส GFMIS", true], [3, 3, "รหัสครุภัณฑ์", true],
          [4, 4, "สถานที่ใช้งาน", true], [5, 5, "ผู้รับผิดชอบ", true], [6, 6, "หมวด/ชนิด", true],
          [7, 7, "ชื่อเรียก/คุณลักษณะ\nครุภัณฑ์", true], [8, 8, "ยี่ห้อ/รุ่น", true],
          [9, 9, "หน่วย\nนับ", true], [10, 10, `ยอดคงเหลือตามบัญชี\nณ วันที่ ${thaiDate(start, true)}`, true],
          [11, 12, `รายการเคลื่อนไหวระหว่าง\nปีงบประมาณ พ.ศ. ${movementFiscalYear}`, false],
          [13, 13, `ยอดคงเหลือตามบัญชี\nณ วันที่ ${thaiDate(end, true)}`, true],
          [14, 14, "จำนวนที่\nตรวจนับได้", true],
          [15, 16, "ผลการตรวจนับถูกต้อง\nตรงกับยอดคงเหลือตามบัญชี", false],
          [17, 20, "สภาพครุภัณฑ์ที่ตรวจนับ", false],
        ];
        for (const [a, b, label, full] of h1) writeMerged(h, a, full ? h + 1 : h, b, label, 9.5);
        ["รับ", "จ่าย", "ถูกต้อง", "ไม่ถูกต้อง", "ใช้งานปกติ", "ชำรุด", "เสื่อมสภาพ", "ไม่จำเป็นต้องใช้"].forEach((label, i) => {
          const col = [11, 12, 15, 16, 17, 18, 19, 20][i];
          writeMerged(h + 1, col, h + 1, col, label, 9.5);
        });
        ws.getRow(h).height = 38;
        ws.getRow(h + 1).height = 24;
        let lastData = h + 1;
        for (let i = page * 4; i < Math.min(assets.length, (page + 1) * 4); i++) {
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
          const rr = ++lastData;
          // ประมาณจำนวนบรรทัดเพื่อให้ Excel ขยายแถวตามข้อความ ไม่เหลือช่องว่างมากเกินไป
          const lines = values.reduce((max, v, col) => {
            const text = String(v);
            const usable = Math.max(3, COLS[col] * 0.85);
            return Math.max(max, Math.ceil(Array.from(text).length / usable));
          }, 1);
          ws.getRow(rr).height = Math.max(24, Math.min(96, lines * 14 + 8));
          values.forEach((v, col) => {
            const cell = ws.getCell(rr, col + 1);
            cell.value = v;
            cell.font = { name: FONT, size: col <= 2 ? 11.5 : 9.5, color: { argb: "FF000000" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = { top: border, bottom: border, left: border, right: border };
          });
        }
        const signRow = lastData + 2;
        ws.getRow(lastData + 1).height = 14;
        // กรรมการ 5 คน ระยะห่างเท่ากัน ใช้พื้นที่คอลัมน์ 1–20 แบ่งกลุ่มละ 4
        for (let i = 0; i < 5; i++) {
          const c1 = i * 4 + 1; const c2 = c1 + 3;
          const officer = officers.find(o => String(o.id) === (inspectorIds[i] ?? ""));
          writeMerged(signRow, c1, signRow, c2, "ลงชื่อ ........................................", 11);
          writeMerged(signRow + 1, c1, signRow + 1, c2, `(${officer ? `${officer.firstName} ${officer.lastName}` : "................................"})`, 11);
          writeMerged(signRow + 2, c1, signRow + 2, c2, officer?.position || "................................", 11);
        }
        ws.getRow(signRow).height = 20;
        ws.getRow(signRow + 1).height = 20;
        ws.getRow(signRow + 2).height = 20;
        rowNo = signRow + 4;
      }
      ws.pageSetup.printArea = `A1:T${rowNo - 2}`;
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
