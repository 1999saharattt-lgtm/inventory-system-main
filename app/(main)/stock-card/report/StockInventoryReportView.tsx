"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import AppCard from "@/components/AppCard";
import AppSearchInput from "@/components/AppSearchInput";
import AppSearchableSelect from "@/components/AppSearchableSelect";
import AppTableCard from "@/components/AppTableCard";

type Material = {
  materialId: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  latestPrice: number;
  openingBalance: number;
  receiveQty: number;
  issueQty: number;
  closingBalance: number;
};

type Props = {
  fiscalYear: number;
  startShortYear: string;
  endShortYear: string;
  materials: Material[];
};

const CATEGORY_ORDER = ["OFFICE", "COMPUTER", "ELECTRIC", "HOUSEHOLD", "VEHICLE", "PRINTING"];
const CATEGORY_NAME: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const widths = [46, 360, 74, 105, 140, 90, 90, 105, 75, 82, 75, 75, 125, 90, 90, 90, 195, 160];
const tableWidth = widths.reduce((sum, value) => sum + value, 0);
const headerClass = "border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-1 py-2 text-center align-middle text-[15px] font-extrabold leading-tight !text-white";
const cellClass = "h-[23.25px] border border-black px-1 py-0 text-center align-middle text-[15px] font-normal leading-tight tabular-nums !text-black";
const formatStock = (value: number) => Number.isFinite(value) && value !== 0 ? value.toLocaleString("th-TH") : "-";
const formatCurrent = (value: number) => Number.isFinite(value) ? value.toLocaleString("th-TH") : "0";
const formatPrice = (value: number) => Number.isFinite(value) ? value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

export default function StockInventoryReportView({ fiscalYear, startShortYear, endShortYear, materials }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const tableScrollbarRef = useRef<HTMLDivElement>(null);
  const syncScroll = (source: "top" | "table") => {
    const from = source === "top" ? topScrollbarRef.current : tableScrollbarRef.current;
    const to = source === "top" ? tableScrollbarRef.current : topScrollbarRef.current;
    if (from && to && Math.abs(to.scrollLeft - from.scrollLeft) > 1) to.scrollLeft = from.scrollLeft;
  };
  const filtered = useMemo(() => materials.filter(material => {
    if (selectedCategory !== "ALL" && material.category !== selectedCategory) return false;
    const q = searchTerm.trim().toLocaleLowerCase("th");
    return !q || [material.code, material.name, material.unit, CATEGORY_NAME[material.category]]
      .filter(Boolean).join(" ").toLocaleLowerCase("th").includes(q);
  }), [materials, searchTerm, selectedCategory]);
  const groups = CATEGORY_ORDER.map(category => ({
    category, name: CATEGORY_NAME[category], materials: filtered.filter(material => material.category === category),
  })).filter(group => group.materials.length > 0);
  const categories = [{ value: "ALL", label: "ทุกหมวด" }, ...CATEGORY_ORDER.map(category => ({ value: category, label: CATEGORY_NAME[category] }))];

  return (
    <div className="w-full min-w-0 space-y-4">
      <AppCard padding={false} className="!overflow-visible !rounded-[22px]">
        <div className="p-3 sm:p-4">
          <h2 className="text-lg font-black tracking-tight !text-slate-900">รายงานบัญชีพัสดุคงคลัง</h2>
          <p className="mt-1 text-xs font-semibold !text-slate-500">แสดงยอดคงเหลือและราคาต่อหน่วยปัจจุบัน โดยแยกจากข้อมูลผลการตรวจสอบประจำปี</p>
        </div>
      </AppCard>
      <div className="relative z-10">
        <AppSearchInput value={searchTerm} onChange={event => setSearchTerm(event.target.value)}
          onSubmit={() => setSearchTerm(searchTerm.trim())} onClear={() => setSearchTerm("")}
          placeholder="ค้นหารหัส / ชื่อหรือชนิดวัสดุหรือครุภัณฑ์" resultCount={filtered.length}
          resultLabel="รายการ" showSearchButton showClearButton searchButtonText="ค้นหา" clearButtonText="ล้าง" />
      </div>
      <AppTableCard title="รายการบัญชีพัสดุคงคลัง" subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        badge={`${filtered.length.toLocaleString("th-TH")} รายการ`} className="relative z-0 w-full min-w-0 !max-w-full">
        <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-0">
          <div className="relative z-30 w-full sm:max-w-[360px]">
            <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">เลือกหมวด</label>
            <AppSearchableSelect value={selectedCategory} options={categories} placeholder="เลือกหมวด"
              searchPlaceholder="พิมพ์ค้นหาหมวด..." emptyText="ไม่พบหมวด" onChange={setSelectedCategory} />
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-1 text-xs font-bold !text-slate-600">เลื่อนตารางซ้าย–ขวา</div>
          <div ref={topScrollbarRef} onScroll={() => syncScroll("top")}
            className="w-full max-w-full overflow-x-auto rounded-md border border-slate-300 bg-white" aria-label="แถบเลื่อนตารางด้านบน">
            <div style={{ width: tableWidth, height: 8 }} />
          </div>
        </div>
        <div ref={tableScrollbarRef} onScroll={() => syncScroll("table")}
          className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain" style={{ touchAction: "pan-x pan-y" }}>
          <table className="w-full table-fixed border-collapse bg-white text-[15px]" style={{ minWidth: tableWidth }}>
            <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
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
                <th className={headerClass}>จำนวนที่ขาดเกินคิดเป็นเงิน</th>
                <th colSpan={4} className={headerClass}>สถานะการใช้งานของวัสดุ (จำนวน)</th>
                <th rowSpan={2} className={headerClass}>หมายเหตุ</th>
              </tr>
              <tr>
                {["รับ", "จ่าย", "ถูกต้อง", "ไม่ถูกต้อง", "ขาด", "เกิน", "(บาท)", "ใช้การได้", "ชำรุด", "เสื่อมสภาพ", "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงาน"].map(label =>
                  <th key={label} className={`${headerClass} !py-1`}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 && <tr><td colSpan={18} className={`${cellClass} py-6`}>ไม่พบรายการพัสดุ</td></tr>}
              {groups.map(group => <Fragment key={group.category}>
                <tr><td colSpan={18} className="h-[23.25px] border border-black bg-white px-2 py-0 text-left text-[15px] font-bold leading-none !text-black">{group.name}</td></tr>
                {group.materials.map((material, index) => (
                  <tr key={material.materialId} className={index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/35 hover:bg-blue-50/50"}>
                    <td className={cellClass}>{index + 1}</td>
                    <td className={`${cellClass} px-2 text-left`}>{material.name}</td>
                    <td className={cellClass}>{material.unit || "-"}</td>
                    <td className={cellClass}>{formatPrice(material.latestPrice)}</td>
                    <td className={cellClass}>{formatStock(material.openingBalance)}</td>
                    <td className={cellClass}>{formatStock(material.receiveQty)}</td>
                    <td className={cellClass}>{formatStock(material.issueQty)}</td>
                    <td className={cellClass}>{formatCurrent(material.closingBalance)}</td>
                    {Array.from({ length: 10 }, (_, i) => <td key={i} className={cellClass} />)}
                  </tr>
                ))}
              </Fragment>)}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </div>
  );
}
