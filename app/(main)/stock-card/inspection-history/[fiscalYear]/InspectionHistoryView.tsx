"use client";

import { Fragment, useMemo, useState } from "react";
import AppCard from "@/components/AppCard";
import AppSearchInput from "@/components/AppSearchInput";
import AppSearchableSelect from "@/components/AppSearchableSelect";
import AppTableCard from "@/components/AppTableCard";
import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

type Material = {
  materialId: number; code: string; name: string; unit: string; category: string;
  openingBalance: number; receiveQty: number; issueQty: number; closingBalance: number;
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
const widths = [42,372,72,132,84,84,90,60,78,66,66,60,60,84,90,108,162];
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
  const officerMap = new Map(officers.map(officer => [String(officer.id), officer]));
  const categories = [{ value: "ALL", label: "ทุกหมวด" }, ...CATEGORY_ORDER.map(category => ({
    value: category, label: CATEGORY_NAME[category],
  }))];
  return (
    <div className="w-full min-w-0 space-y-4">
      <AppCard padding={false} className="!overflow-visible !rounded-[22px]">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="shrink-0 lg:w-[210px]">
              <h2 className="text-lg font-black tracking-tight !text-slate-900">ข้อมูลการตรวจสอบ</h2>
              <p className="mt-0.5 text-xs font-semibold !text-slate-500">ข้อมูลที่บันทึกไว้ (ดูอย่างเดียว)</p>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
              {[{label:"วันที่เริ่มตรวจสอบ", value:inspectionStartDate},
                {label:"วันที่ตรวจสอบแล้วเสร็จ", value:inspectionEndDate}].map(item => (
                <div key={item.label} className="min-w-0">
                  <div className="mb-1.5 text-sm font-extrabold !text-slate-700">{item.label}</div>
                  <div className="flex h-[46px] items-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold !text-slate-900 shadow-sm">
                    {dateText(item.value)}
                  </div>
                </div>
              ))}
            </div>
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
        badge={`${filtered.length.toLocaleString("th-TH")} รายการ`} className="relative z-0 w-full min-w-0">
        <div className="border-b border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="relative z-30 w-full sm:max-w-[420px]">
              <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">เลือกหมวด</label>
              <AppSearchableSelect value={selectedCategory} options={categories} placeholder="เลือกหมวด"
                searchPlaceholder="พิมพ์ค้นหาหมวด..." emptyText="ไม่พบหมวด" onChange={setSelectedCategory} />
            </div>
            <ExportInspectionPdf fiscalYear={fiscalYear} startShortYear={startShortYear}
              endShortYear={endShortYear} materials={filtered} rows={rows}
              inspectionStartDate={inspectionStartDate} inspectionEndDate={inspectionEndDate}
              inspectorIds={inspectorIds} officers={officers} />
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-1 text-xs font-bold !text-slate-600">เลื่อนตารางซ้าย–ขวา</div>
          <div className="w-full overflow-x-auto rounded-md border border-slate-300 bg-white" aria-label="แถบเลื่อนตารางด้านบน">
            <div style={{ width: 1710, height: 8 }} />
          </div>
        </div>
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1710px] table-fixed border-collapse bg-white text-[15px]">
            <colgroup>{widths.map((width,index) => <col key={index} style={{width:`${width}px`}} />)}</colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className={headerClass}>ลำดับ</th>
                <th rowSpan={2} className={headerClass}>ชื่อหรือชนิดวัสดุหรือครุภัณฑ์</th>
                <th rowSpan={2} className={headerClass}>หน่วยนับ</th>
                <th rowSpan={2} className={headerClass}>คงเหลือยอดยกมาเมื่อ<br />30 ก.ย. {startShortYear}</th>
                <th colSpan={2} className={headerClass}>01 ต.ค. {startShortYear} - 30 ก.ย. {endShortYear}</th>
                <th rowSpan={2} className={headerClass}>คงเหลือปัจจุบัน</th>
                <th rowSpan={2} className={headerClass}>ถูกต้อง</th>
                <th rowSpan={2} className={headerClass}>ไม่ถูกต้อง</th>
                <th colSpan={4} className={headerClass}>รายละเอียดกรณีไม่ถูกต้อง</th>
                <th rowSpan={2} className={headerClass}>ชำรุด</th>
                <th rowSpan={2} className={headerClass}>เสื่อมสภาพ</th>
                <th rowSpan={2} className={headerClass}>ไม่จำเป็นต้องใช้</th>
                <th rowSpan={2} className={headerClass}>หมายเหตุ</th>
              </tr>
              <tr>{["รับ","จ่าย","ขาด","เกิน","บาท","สต."].map(label =>
                <th key={label} className={`${headerClass} !py-1`}>{label}</th>)}</tr>
            </thead>
            <tbody>
              {groups.length === 0 && <tr><td colSpan={17} className={`${cellClass} py-6`}>ไม่พบรายการพัสดุ</td></tr>}
              {groups.map(group => <Fragment key={group.category}>
                <tr key={`${group.category}-heading`}><td colSpan={17} className="h-[23.25px] border border-black bg-white px-2 py-0 text-left text-[15px] font-bold leading-none !text-black">{group.name}</td></tr>
                {group.materials.map((material,index) => {
                  const row = rowMap.get(material.materialId);
                  const cells = [formatStock(material.openingBalance), formatStock(material.receiveQty),
                    formatStock(material.issueQty), formatCurrent(material.closingBalance)];
                  return <tr key={material.materialId} className={index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/35 hover:bg-blue-50/50"}>
                    <td className={cellClass}>{index+1}</td>
                    <td className={`${cellClass} px-2 text-left leading-tight`}>{material.name}</td>
                    <td className={cellClass}>{material.unit || "-"}</td>
                    {cells.map((value,i) => <td key={i} className={cellClass}>{value}</td>)}
                    <td className={cellClass}>{row?.accuracy === "CORRECT" ? "✓" : ""}</td>
                    <td className={cellClass}>{row?.accuracy === "INCORRECT" ? "✓" : ""}</td>
                    {(["shortageQty","excessQty","baht","satang","damagedQty","deterioratedQty","unnecessaryQty"] as const).map(key =>
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
