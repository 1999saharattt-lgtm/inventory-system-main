"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  name: string;
  initialValue?: string;
  options: string[];
};

const normalize = (value: string) => value.trim().toLocaleLowerCase("th-TH");

export default function AssetCategoryTypeDropdown({ name, initialValue = "", options }: Props) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const choices = useMemo(() => Array.from(new Set(options.map((item) => item.trim()).filter(Boolean))), [options]);
  const matches = useMemo(() => choices.filter((item) => normalize(item).includes(normalize(value))), [choices, value]);

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          autoComplete="off"
          value={value}
          placeholder="พิมพ์ค้นหา เลือก หรือเพิ่มหมวด/ชนิดใหม่..."
          onFocus={() => setOpen(true)}
          onChange={(event) => { setValue(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && open) {
              event.preventDefault();
              setValue(value.trim());
              setOpen(false);
            }
          }}
          className="min-h-[50px] w-full rounded-[14px] border border-slate-300 bg-white px-4 py-3 pr-11 text-base font-bold !text-slate-900 shadow-sm outline-none placeholder:!text-slate-400 hover:border-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
        />
        <button
          type="button"
          aria-label="เปิดรายการหมวด/ชนิด"
          aria-expanded={open}
          onClick={() => { setOpen((previous) => !previous); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          ▼
        </button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[99999] mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <button type="button" onClick={() => { setValue(""); setOpen(false); }} className="w-full rounded-xl px-4 py-3 text-left font-semibold text-slate-500 hover:bg-slate-100">-- ไม่ระบุ --</button>
          {matches.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => { setValue(item); setOpen(false); }}
              className="w-full rounded-xl px-4 py-3 text-left font-semibold text-slate-800 hover:bg-blue-50"
            >
              {item}
            </button>
          ))}
          {value.trim() && !choices.some((item) => normalize(item) === normalize(value)) && (
            <button
              type="button"
              onClick={() => { setValue(value.trim()); setOpen(false); }}
              className="w-full rounded-xl bg-emerald-50 px-4 py-3 text-left font-bold text-emerald-700 hover:bg-emerald-100"
            >
              ＋ ใช้หมวด/ชนิดใหม่: {value.trim()}
            </button>
          )}
          {matches.length === 0 && !value.trim() && <p className="px-4 py-3 text-sm text-slate-500">ยังไม่มีรายการ</p>}
        </div>
      )}
    </div>
  );
}
