"use client";

import { useRouter } from "next/navigation";

type Props = {
  selectedFiscalYear: number;
  availableFiscalYears: number[];
};

export default function AssetsFiscalYearSelect({
  selectedFiscalYear,
  availableFiscalYears,
}: Props) {
  const router = useRouter();

  return (
    <select
      id="fiscalYear"
      name="fiscalYear"
      value={String(selectedFiscalYear)}
      onChange={(event) => {
        const fiscalYear = Number(event.target.value);
        if (!Number.isInteger(fiscalYear)) return;
        router.push(`/assets?fiscalYear=${fiscalYear}`);
      }}
      className="
        h-[50px]
        w-full
        cursor-pointer
        appearance-none
        rounded-[14px]
        border
        border-slate-300
        bg-white
        px-4
        pr-11
        text-base
        font-extrabold
        !text-slate-900
        shadow-sm
        outline-none
        transition-all
        duration-200
        hover:border-slate-400
        focus:border-emerald-500
        focus:ring-4
        focus:ring-emerald-100/70
      "
    >
      {availableFiscalYears.map((fiscalYear) => (
        <option key={fiscalYear} value={fiscalYear}>
          ปีงบประมาณ {fiscalYear}
        </option>
      ))}
    </select>
  );
}
