"use client";

import { useRouter } from "next/navigation";

export default function InspectionHistoryTypeSelect({ fiscalYear, value }: { fiscalYear: number; value: "annual" | "inventory" }) {
  const router = useRouter();
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4">
      <label htmlFor="inspection-history-type" className="mb-1.5 block text-sm font-extrabold !text-slate-700">
        เลือกประเภทประวัติการตรวจสอบ
      </label>
      <select
        id="inspection-history-type"
        value={value}
        onChange={(event) => router.push(`/stock-card/inspection-history/materials?fiscalYear=${fiscalYear}&type=${event.target.value}`)}
        className="h-[46px] w-fit min-w-[250px] max-w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      >
        <option value="annual">ตรวจสอบบัญชีพัสดุประจำปี</option>
        <option value="inventory">รายงานบัญชีพัสดุคงคลัง</option>
      </select>
    </div>
  );
}
