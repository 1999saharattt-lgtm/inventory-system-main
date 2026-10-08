"use client";

import { useMemo, useState } from "react";
import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";
import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

type Material = {
  materialId: number; code: string; name: string; unit: string;
  category: string; openingBalance: number; receiveQty: number;
  issueQty: number; closingBalance: number;
};
type InspectionRow = {
  materialId: number; accuracy: string; shortageQty: string;
  excessQty: string; baht: string; satang: string;
  damagedQty: string; deterioratedQty: string;
  unnecessaryQty: string; remark: string;
};
type Officer = {
  id: number; firstName: string; lastName: string; position: string;
  type: string; departmentId: number | null; sectionId: number | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};
type Props = {
  fiscalYear: number; startShortYear: string; endShortYear: string;
  materials: Material[]; rows: InspectionRow[]; officers: Officer[];
  inspectorIds: string[]; inspectionStartDate: string;
  inspectionEndDate: string;
};
const categoryNames: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน", COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ", HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ", PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const thaiMonths = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
function thaiDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "-";
  const [y,m,d] = value.split("-").map(Number);
  return `${d} ${thaiMonths[m-1] ?? ""} ${y+543}`;
}
function shouldShow(material: Material) {
  const name = material.name.trim();
  if (/\(สสส\.\)\s*$/u.test(name)) return false;
  if (material.category === "ELECTRIC" &&
      /ถ่านกระดุม\s*ขนาด\s*CR2032/iu.test(name)) return false;
  return true;
}
function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}
const th = "border border-slate-300 bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center text-xs font-bold !text-white whitespace-nowrap";
const td = "border border-slate-200 px-3 py-2 text-center text-xs !text-slate-800";
const headings = ["ลำดับ", "รหัสวัสดุ", "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์", "หน่วยนับ",
  "ยอดยกมา", "รับ", "จ่าย", "คงเหลือ", "ถูกต้อง", "ไม่ถูกต้อง",
  "ขาด", "เกิน", "บาท", "สตางค์", "ชำรุด", "เสื่อมสภาพ", "ไม่จำเป็นต้องใช้", "หมายเหตุ"];
export default function InspectionHistoryView({ fiscalYear, startShortYear, endShortYear,
  materials, rows, officers, inspectorIds, inspectionStartDate, inspectionEndDate }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const saved = useMemo(() => new Map(rows.map(row => [row.materialId, row])), [rows]);
  const visible = useMemo(() => materials.filter(shouldShow).filter(m =>
    (category === "ALL" || m.category === category) &&
    `${m.code} ${m.name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [materials, search, category]);
  const categories = [...new Set(materials.filter(shouldShow).map(m => m.category))];
  const officerMap = new Map(officers.map(o => [String(o.id), o]));
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AppCard>
        <div className="grid gap-4 p-2 md:grid-cols-2">
          <div><div className="text-sm font-bold text-slate-600">วันที่เริ่มตรวจสอบ</div>
            <div className="mt-1 rounded-xl bg-slate-50 p-3 font-semibold text-slate-900">{thaiDate(inspectionStartDate)}</div></div>
          <div><div className="text-sm font-bold text-slate-600">วันที่ตรวจสอบแล้วเสร็จ</div>
            <div className="mt-1 rounded-xl bg-slate-50 p-3 font-semibold text-slate-900">{thaiDate(inspectionEndDate)}</div></div>
        </div>
      </AppCard>
      <AppCard>
        <div className="p-2">
          <h3 className="mb-3 font-extrabold text-slate-900">คณะกรรมการตรวจสอบ</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {inspectorIds.map((id, index) => {
              const officer = officerMap.get(id);
              return <div key={`${index}-${id}`} className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-500">{index === 0 ? "ประธานกรรมการ" : `กรรมการคนที่ ${index}`}</div>
                <div className="mt-1 font-semibold text-slate-900">{officer ? `${officer.firstName} ${officer.lastName}` : "-"}</div>
                <div className="mt-1 text-xs text-slate-600">{officer?.position || "-"}</div>
              </div>;
            })}
          </div>
        </div>
      </AppCard>
      <AppTableCard title="รายการตรวจสอบบัญชีพัสดุ" subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        badge={`${visible.length.toLocaleString("th-TH")} รายการ`} className="w-full min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-3">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm font-semibold text-slate-700">ค้นหา
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหารหัส / ชื่อวัสดุ"
                className="mt-1 block h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" />
            </label>
            <label className="text-sm font-semibold text-slate-700">หมวดวัสดุ
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="mt-1 block h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="ALL">ทุกหมวด</option>
                {categories.map(c => <option key={c} value={c}>{categoryNames[c] ?? c}</option>)}
              </select>
            </label>
          </div>
          <ExportInspectionPdf fiscalYear={fiscalYear} startShortYear={startShortYear}
            endShortYear={endShortYear} materials={visible} rows={rows}
            inspectionStartDate={inspectionStartDate} inspectionEndDate={inspectionEndDate}
            inspectorIds={inspectorIds} officers={officers} />
        </div>
        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">เลื่อนตารางซ้าย–ขวา เพื่อดูข้อมูลทั้งหมด</div>
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-max min-w-full border-collapse text-sm">
            <thead><tr>{headings.map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={headings.length} className="p-8 text-center text-slate-500">ไม่พบรายการ</td></tr>}
              {visible.map((m,index) => {
                const r = saved.get(m.materialId);
                const values = [index+1,m.code,m.name,m.unit,m.openingBalance,m.receiveQty,m.issueQty,m.closingBalance,
                  r?.accuracy === "CORRECT" ? "◉" : "○", r?.accuracy === "INCORRECT" ? "◉" : "○",
                  r?.shortageQty,r?.excessQty,r?.baht,r?.satang,r?.damagedQty,r?.deterioratedQty,r?.unnecessaryQty,r?.remark];
                return <tr key={m.materialId} className={index % 2 ? "bg-slate-50/70" : "bg-white"}>
                  {values.map((value,i) => <td key={i} className={`${td} ${i===2 ? "min-w-[250px] text-left" : "whitespace-nowrap"}`}>
                    {i===8 || i===9 ? value : display(value)}
                  </td>)}
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </div>
  );
}
