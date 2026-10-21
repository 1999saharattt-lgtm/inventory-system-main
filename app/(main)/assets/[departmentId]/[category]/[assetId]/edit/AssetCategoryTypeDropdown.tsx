"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  name: string;
  initialValue: string;
  options: string[];
};

export default function AssetCategoryTypeDropdown({ name, initialValue, options }: Props) {
  const [value, setValue] = useState(initialValue);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({top:0,left:0,width:0});
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const update = () => { const r = containerRef.current?.getBoundingClientRect(); if(r) setPosition({top:r.bottom+8,left:r.left,width:r.width}); };
    update(); window.addEventListener("resize",update); window.addEventListener("scroll",update,true);
    return () => {window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);};
  },[open]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const choices = useMemo(() => Array.from(new Set([...options, ...(value ? [value] : [])])), [options, value]);
  const filtered = useMemo(() => choices.filter((item) => item.toLocaleLowerCase("th").includes(search.trim().toLocaleLowerCase("th"))), [choices, search]);
  const canAdd = !!search.trim() && !choices.some((item) => item.toLocaleLowerCase("th") === search.trim().toLocaleLowerCase("th"));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && !(event.target as Element).closest("[data-category-popover]")) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (item: string) => {
    setValue(item);
    setSearch("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((previous) => !previous);
          setSearch("");
          setTimeout(() => searchRef.current?.focus(), 0);
        }}
        className="flex min-h-[50px] w-full items-center justify-between gap-2 rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-left text-base font-bold text-slate-900 shadow-sm outline-none transition-all hover:border-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
      >
        <span className={`min-w-0 flex-1 break-words ${value ? "text-slate-900" : "text-slate-400"}`}>
          {value || "เลือกหมวด/ชนิด หรือเพิ่มรายการใหม่"}
        </span>
        <span aria-hidden="true" className="shrink-0 text-slate-500">⌄</span>
      </button>
      {open && mounted && createPortal(
        <div data-category-popover="true" style={{position:"fixed",top:position.top,left:position.left,width:position.width,maxHeight:"min(350px, 55vh)"}} className="z-[99999] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (canAdd) choose(search.trim());
                  else if (filtered.length === 1) choose(filtered[0]);
                }
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder="พิมพ์ค้นหาหรือเพิ่มหมวด/ชนิดใหม่..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.map((item) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={value === item}
                onClick={() => choose(item)}
                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-blue-50 ${value === item ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}
              >
                <span className="w-4 shrink-0">{value === item ? "✓" : ""}</span>
                <span className="break-words">{item}</span>
              </button>
            ))}
            {!filtered.length && !canAdd && <p className="px-3 py-3 text-sm text-slate-500">ไม่พบข้อมูล</p>}
            {canAdd && (
              <button type="button" onClick={() => choose(search.trim())} className="w-full rounded-lg border-t border-slate-100 px-3 py-3 text-left text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                ＋ เพิ่มหมวด/ชนิดใหม่: {search.trim()}
              </button>
            )}
          </div>
        </div>, document.body
      )}
      <p className="mt-2 text-xs font-medium text-slate-500">เลือกทั้งกลุ่มจากรายการ หรือพิมพ์ชื่อใหม่แล้วกดเพิ่ม</p>
    </div>
  );
}
