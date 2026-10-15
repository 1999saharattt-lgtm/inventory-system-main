"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  selectedFiscalYear: number;
  availableFiscalYears: number[];
  date?: string;
  period?: string;
};

export default function IssueFiscalYearSelect({
  selectedFiscalYear,
  availableFiscalYears,
  date,
  period,
}: Props) {
  const router = useRouter();
  const [isChangingYear, startTransition] = useTransition();

  function handleFiscalYearChange(value: string) {
    const nextFiscalYear = Number(value);
    if (!Number.isInteger(nextFiscalYear) || nextFiscalYear === selectedFiscalYear) return;

    const params = new URLSearchParams();
    params.set("fiscalYear", String(nextFiscalYear));
    if (date) params.set("date", date);
    if (period) params.set("period", period);

    startTransition(() => router.push(`/issue?${params.toString()}`));
  }

  return (
    <div className="w-full min-w-0 sm:max-w-[300px]">
      <label htmlFor="fiscalYear" className="mb-2 block text-sm font-extrabold !text-slate-700">
        ปีงบประมาณ
      </label>
      <div className="relative w-full">
        <select
          id="fiscalYear"
          name="fiscalYear"
          value={selectedFiscalYear}
          disabled={isChangingYear}
          onChange={(event) => handleFiscalYearChange(event.target.value)}
          className="h-[50px] w-full cursor-pointer appearance-none rounded-[14px] border border-slate-300 bg-white px-4 pr-11 text-base font-extrabold !text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/70 disabled:cursor-wait disabled:bg-slate-50 disabled:opacity-70"
        >
          {availableFiscalYears.map((fiscalYear) => (
            <option key={fiscalYear} value={fiscalYear}>
              ปีงบประมาณ {fiscalYear}
            </option>
          ))}
        </select>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center !text-slate-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {isChangingYear && (
        <p className="mt-2 text-xs font-semibold !text-emerald-600">กำลังเปลี่ยนปีงบประมาณ...</p>
      )}
    </div>
  );
}
