"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import AppCard from "@/components/AppCard";
import AppSearchInput from "@/components/AppSearchInput";
import AppSearchableSelect from "@/components/AppSearchableSelect";
import AppTableCard from "@/components/AppTableCard";
import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";
import ExportInspectionExcel from "../../inspection/ExportInspectionExcel";

type Material = {
  materialId: number; code: string; name: string; unit: string; category: string;
  latestPrice?: number | null; openingBalance: number; receiveQty: number; issueQty: number; closingBalance: number;
};
type InspectionRow = {
  materialId: number; accuracy: string; shortageQty: string; excessQty: string;
  baht: string; satang: string; damagedQty: string; deterioratedQty: string;
  unnecessaryQty: string; remark: string;
};
type Officer = {
  id: number; firstName: string; lastName: string; position: string; type: string;
  departmentId: number | null; sectionId: number | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};
type Props = {
  fiscalYear: number; startShortYear: string; endShortYear: string;
  materials: Material[]; rows: InspectionRow[]; officers: Officer[];
  inspectorIds: string[]; inspectionStartDate: string; inspectionEndDate: string;
};
const CATEGORY_ORDER = ["OFFICE", "COMPUTER", "ELECTRIC", "HOUSEHOLD", "VEHICLE", "PRINTING"];
const CATEGORY_NAME: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน", COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ", HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ", PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const widths = [46,360,74,105,140,90,90,105,75,82,75,75,125,90,90,90,195,160];
const tableWidth = widths.reduce((total, width) => total + width, 0);
const headerClass = "border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-1 py-2 text-center align-middle text-[15px] font-extrabold leading-tight !text-white";
const cellClass = "h-[23.25px] border border-black px-1 py-0 text-center text-[15px] font-normal leading-none tabular-nums !text-black";
const formatStock = (value: number) => Number.isFinite(value) && value !== 0 ? value.toLocaleString("th-TH") : "-";
const formatCurrent = (value: number) => Number.isFinite(value) ? value.toLocaleString("th-TH") : "0";
const dateText = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "-";
  const [y,m,d] = value.split("-").map(Number);
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  return `${d} ${months[m-1] ?? ""} ${y+543}`;
};

export default function InspectionHistoryView(props: Props) {
  const { fiscalYear, startShortYear, endShortYear, materials, rows, officers,
    inspectorIds, inspectionStartDate, inspectionEndDate } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const tableScrollbarRef = useRef<HTMLDivElement>(null);
  const syncScroll = (source: "top" | "table") => {
    const from = source === "top" ? topScrollbarRef.current : tableScrollbarRef.current;
    const to = source === "top" ? tableScrollbarRef.current : topScrollbarRef.current;
    if (from && to && Math.abs(to.scrollLeft - from.scrollLeft) > 1) {
      to.scrollLeft = from.scrollLeft;
    }
  };
  const rowMap = useMemo(() => new Map(rows.map(row => [row.materialId, row])), [rows]);
  const filtered = useMemo(() => materials.filter(material => {
    if (selectedCategory !== "ALL" && material.category !== selectedCategory) return false;
    const q = searchTerm.trim().toLocaleLowerCase("th");
    return !q || [material.code, material.name, material.unit, CATEGORY_NAME[material.category]]
      .filter(Boolean).join(" ").toLocaleLowerCase("th").includes(q);
  }), [materials, searchTerm, selectedCategory]);
  const groups = CATEGORY_ORDER.map(category => ({
    category, name: CATEGORY_NAME[category], materials: filtered.filter(m => m.category === category),
  })).filter(group => group.materials.length);
  // Read-only historical rows do not store an independent in-use checkbox.
  // Derive the usable quantity from the saved row and closing balance.
  const inUseChecks = useMemo(() => Object.fromEntries(materials.map(material => {
    const row = rowMap.get(material.materialId);
    const usable = material.closingBalance - Number(row?.damagedQty || 0)
      - Number(row?.deterioratedQty || 0) - Number(row?.unnecessaryQty || 0);
    return [material.materialId, Boolean(row && usable > 0)];
  })), [materials, rowMap]);
  const officerMap = new Map(officers.map(officer => [String(officer.id), officer]));
  const categories = [{ value: "ALL", label: "ทุกหมวด" }, ...CATEGORY_ORDER.map(category => ({
    value: category, label: CATEGORY_NAME[category],
  }))];
  return (
    <div className="w-full min-w-0 space-y-4">
      <AppCard padding={false} className="!overflow-visible !rounded-[22px]">
        <div className="p-3 sm:p-4">
          <div className="mb-3">
            <h2 className="text-lg font-black tracking-tight !text-slate-900">ข้อมูลการตรวจสอบ</h2>
            <p className="mt-0.5 text-xs font-semibold !text-slate-500">ข้อมูลที่บันทึกไว้ (ดูอย่างเดียว)</p>
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {[{label:"วันที่เริ่มตรวจสอบ", value:inspectionStartDate},
              {label:"วันที่ตรวจสอบแล้วเสร็จ", value:inspectionEndDate}].map(item => (
              <div key={item.label} className="min-w-0">
                <div className="mb-1.5 text-sm font-extrabold !text-slate-700">{item.label}</div>
                <div className="flex h-[46px] min-w-0 items-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold !text-slate-900 shadow-sm">
                  {dateText(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppCard>
      <div className="relative z-10">
        <AppSearchInput value={searchTerm} onChange={event => setSearchTerm(event.target.value)}
          onSubmit={() => setSearchTerm(searchTerm.trim())} onClear={() => setSearchTerm("")}
          placeholder="ค้นหารหัส / ชื่อหรือชนิดวัสดุหรือครุภัณฑ์" resultCount={filtered.length}
          resultLabel="รายการ" showSearchButton showClearButton searchButtonText="ค้นหา" clearButtonText="ล้าง" />
      </div>
      <AppTableCard title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        headerAction={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ExportInspectionPdf fiscalYear={fiscalYear} startShortYear={startShortYear}
              endShortYear={endShortYear} materials={filtered} rows={rows}
              inspectionStartDate={inspectionStartDate} inspectionEndDate={inspectionEndDate}
              inspectorIds={inspectorIds} officers={officers} inUseChecks={inUseChecks} />
            <ExportInspectionExcel fiscalYear={fiscalYear} startShortYear={startShortYear}
              endShortYear={endShortYear} materials={filtered} rows={rows}
              inspectionStartDate={inspectionStartDate} inspectionEndDate={inspectionEndDate}
              inspectorIds={inspectorIds} officers={officers} inUseChecks={inUseChecks} />
          </div>
        }
        className="relative z-0 w-full min-w-0 !max-w-full">
        <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-0">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div className="relative z-30 w-full sm:max-w-[360px]">
              <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">เลือกหมวด</label>
              <AppSearchableSelect value={selectedCategory} options={categories} placeholder="เลือกหมวด"
                searchPlaceholder="พิมพ์ค้นหาหมวด..." emptyText="ไม่พบหมวด" onChange={setSelectedCategory} />
            </div>

          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-1 text-xs font-bold !text-slate-600">เลื่อนตารางซ้าย–ขวา</div>
          <div ref={topScrollbarRef} onScroll={() => syncScroll("top")} className="w-full max-w-full overflow-x-auto rounded-md border border-slate-300 bg-white" aria-label="แถบเลื่อนตารางด้านบน">
            <div style={{ width: tableWidth, height: 8 }} />
          </div>
        </div>
        <div ref={tableScrollbarRef} onScroll={() => syncScroll("table")} className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain" style={{ touchAction: "pan-x pan-y" }}>
          <table className="w-full table-fixed border-collapse bg-white text-[15px]" style={{ minWidth: tableWidth }}>
            <colgroup>{widths.map((width,index) => <col key={index} style={{width:`${width}px`}} />)}</colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className={headerClass}>ลำดับ</th>
                <th rowSpan={2} className={headerClass}>ชื่อหรือชนิดวัสดุหรือครุภัณฑ์</th>
                <th rowSpan={2} className={headerClass}>หน่วยนับ</th>
                <th rowSpan={2} className={headerClass}>ราคาต่อหน่วย</th>
                <th rowSpan={2} className={headerClass}>คงเหลือยอดยกมาเมื่อ<br />01 ต.ค. {startShortYear}</th>
                <th colSpan={2} className={headerClass}>01 ต.ค. {startShortYear} - 30 ก.ย. {endShortYear}</th>
                <th rowSpan={2} className={headerClass}>คงเหลือปัจจุบัน</th>
                <th colSpan={2} className={headerClass}>ผลการตรวจสอบ</th>
                <th colSpan={2} className={headerClass}>ถ้าไม่ถูกต้องระบุจำนวนที่ขาด/เกิน</th>
                <th className={headerClass}>จำนวนที่ขาดเกิน<br />คิดเป็นเงิน</th>
                <th colSpan={4} className={headerClass}>สถานะการใช้งานของวัสดุ (จำนวน)</th>
                <th rowSpan={2} className={headerClass}>หมายเหตุ</th>
              </tr>
              <tr>{["รับ","จ่าย","ถูกต้อง","ไม่ถูกต้อง","ขาด","เกิน","(บาท)","ใช้การได้","ชำรุด","เสื่อมสภาพ","สูญไปหรือไม่จำเป็นต้องใช้\nในหน่วยงาน"].map(label =>
                <th key={label} className={`${headerClass} !py-1 whitespace-pre-line`}>{label}</th>)}</tr>
            </thead>
            <tbody>
              {groups.length === 0 && <tr><td colSpan={18} className={`${cellClass} py-6`}>ไม่พบรายการพัสดุ</td></tr>}
              {groups.map(group => <Fragment key={group.category}>
                <tr key={`${group.category}-heading`}><td colSpan={18} className="h-[23.25px] border border-black bg-white px-2 py-0 text-left text-[15px] font-bold leading-none !text-black">{group.name}</td></tr>
                {group.materials.map((material,index) => {
                  const row = rowMap.get(material.materialId);
                  const cells = [formatStock(material.openingBalance), formatStock(material.receiveQty),
                    formatStock(material.issueQty), formatCurrent(material.closingBalance)];
                  return <tr key={material.materialId} className={index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/35 hover:bg-blue-50/50"}>
                    <td className={cellClass}>{index+1}</td>
                    <td className={`${cellClass} px-2 text-left leading-tight`}>{material.name}</td>
                    <td className={cellClass}>{material.unit || "-"}</td>
                    <td className={cellClass}>{material.latestPrice == null ? "-" : material.latestPrice.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    {cells.map((value,i) => <td key={i} className={cellClass}>{value}</td>)}
                    <td className={cellClass}>{row?.accuracy === "CORRECT" ? <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-600 text-[13px] font-bold text-white">✓</span> : ""}</td>
                    <td className={cellClass}>{row?.accuracy === "INCORRECT" ? <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-600 text-[13px] font-bold text-white">✓</span> : ""}</td>
                    {(["shortageQty","excessQty"] as const).map(key =>
                      <td key={key} className={cellClass}>{row?.[key] ?? ""}</td>)}
                    <td className={cellClass}>{row?.baht || row?.satang ? `${row?.baht || "0"}.${String(row?.satang || "0").padStart(2, "0")}` : ""}</td>
                    <td className={cellClass}>{row ? Math.max(0, material.closingBalance - Number(row.damagedQty || 0) - Number(row.deterioratedQty || 0) - Number(row.unnecessaryQty || 0)).toLocaleString("th-TH") : ""}</td>
                    {(["damagedQty","deterioratedQty","unnecessaryQty"] as const).map(key =>
                      <td key={key} className={cellClass}>{row?.[key] ?? ""}</td>)}
                    <td className={`${cellClass} px-2 text-left`}>{row?.remark ?? ""}</td>
                  </tr>;
                })}
              </Fragment>)}
            </tbody>
          </table>
        </div>
      </AppTableCard>
      <AppCard className="relative z-20 w-full min-w-0 !overflow-visible !p-4">
        <h2 className="text-xl font-black tracking-tight !text-slate-900">คณะกรรมการตรวจสอบครุภัณฑ์</h2>
        <p className="mt-1 text-sm font-semibold !text-slate-500">รายชื่อคณะกรรมการตรวจสอบจำนวน 3 คน</p>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[0,1,2].map(index => {
            const officer = officerMap.get(inspectorIds[index] ?? "");
            return <div key={index} className="relative min-w-0 rounded-[16px] border border-slate-200/80 bg-slate-50/60 p-3">
              <div className="mb-2 text-sm font-extrabold !text-slate-700">{index === 0 ? "ประธานกรรมการ" : `กรรมการคนที่ ${index}`}</div>
              <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold !text-slate-900">{officer ? `${officer.firstName} ${officer.lastName}`.trim() : "-"}</div>
              <p className="mt-2 text-xs font-semibold !text-slate-500">ตำแหน่ง: {officer?.position || "-"}</p>
            </div>;
          })}
        </div>
      </AppCard>
    </div>
  );
}
