"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Section = { id: number; name: string };
type Officer = { id: number; firstName: string; lastName: string; position: string; sectionId: number | null };
type Props = { sections: Section[]; officers: Officer[]; initialSectionId?: number | null; initialOfficerId?: number | null; initialResponsibleName?: string; departmentName: string; departmentId: number };
type Popover = "section" | "officer" | null;
const normalize = (v: string) => v.trim().toLocaleLowerCase("th-TH");
const field = "min-h-[50px] w-full rounded-[14px] border border-slate-300 bg-white px-4 py-3 pr-11 text-base font-bold !text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";
const label = "mb-2 block text-sm font-extrabold !text-slate-700 sm:text-base";

export default function AssetResponsibleFields({ sections, officers, initialSectionId = null, initialOfficerId = null, initialResponsibleName = "", departmentName, departmentId }: Props) {
  const [sectionId, setSectionId] = useState(initialSectionId ? String(initialSectionId) : "");
  const [officerId, setOfficerId] = useState(initialOfficerId ? String(initialOfficerId) : "");
  const [customName, setCustomName] = useState("");
  const [customPosition, setCustomPosition] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Popover>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const officerRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const update = () => { const r = (open === "section" ? sectionRef : officerRef).current?.getBoundingClientRect(); if (r) setPos({ top: r.bottom + 8, left: r.left, width: r.width }); };
    update(); window.addEventListener("resize", update); window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [open]);
  useEffect(() => {
    const click = (e: MouseEvent) => { if (!(e.target as Element).closest("[data-owner-popover]") && !sectionRef.current?.contains(e.target as Node) && !officerRef.current?.contains(e.target as Node)) { setOpen(null); setSearch(""); } };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(null); setSearch(""); } };
    document.addEventListener("mousedown", click); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", key); };
  }, []);
  const section = sections.find(x => String(x.id) === sectionId);
  const officer = officers.find(x => String(x.id) === officerId);
  const available = officers.filter(x => sections.length === 0 || (!!sectionId && x.sectionId === Number(sectionId)));
  const sectionMatches = sections.filter(x => normalize(x.name).includes(normalize(search)));
  const officerMatches = available.filter(x => normalize(`${x.firstName} ${x.lastName} ${x.position}`).includes(normalize(search)));
  const addAllowed = open === "officer" && !!search.trim() && !available.some(x => normalize(`${x.firstName} ${x.lastName}`) === normalize(search));
  const chooseSection = (id: string) => { setSectionId(id); setOfficerId(""); setCustomName(""); setCustomPosition(""); setSearch(""); setOpen(null); };
  const chooseOfficer = (id: string) => { setOfficerId(id); setCustomName(""); setCustomPosition(""); setSearch(""); setOpen(null); };
  const chooseCustom = () => { setCustomName(search.trim()); setOfficerId(""); setCustomPosition(""); setSearch(""); setOpen(null); };
  const popup = open && mounted ? createPortal(
    <div data-owner-popover="true" style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxHeight: "min(340px,55vh)" }} className="z-[99999] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
      {open === "section" ? <><button type="button" onClick={() => chooseSection("")} className="w-full rounded-xl px-4 py-3 text-left font-semibold hover:bg-slate-100">-- ไม่ระบุ --</button>{sectionMatches.map(x => <button type="button" key={x.id} onClick={() => chooseSection(String(x.id))} className="flex w-full justify-between rounded-xl px-4 py-3 text-left font-semibold hover:bg-blue-50">{x.name}{sectionId === String(x.id) ? " ✓" : ""}</button>)}</> : <><button type="button" onClick={() => chooseOfficer("")} className="w-full rounded-xl px-4 py-3 text-left font-semibold hover:bg-slate-100">-- ไม่ระบุผู้ครอบครอง --</button>{officerMatches.map(x => <button type="button" key={x.id} onClick={() => chooseOfficer(String(x.id))} className="flex w-full justify-between rounded-xl px-4 py-3 text-left font-semibold hover:bg-blue-50"><span>{x.firstName} {x.lastName}<span className="block text-xs text-slate-500">{x.position}</span></span>{officerId === String(x.id) ? "✓" : ""}</button>)}{addAllowed && <button type="button" onClick={chooseCustom} className="w-full rounded-xl bg-emerald-50 px-4 py-3 text-left font-bold text-emerald-700 hover:bg-emerald-100">＋ เพิ่มผู้ครอบครองใหม่: {search.trim()}</button>}</>}
    </div>, document.body) : null;
  const input = (kind: "section" | "officer", display: string, placeholder: string, disabled = false) => <div ref={kind === "section" ? sectionRef : officerRef} className="relative min-w-0"><input type="text" autoComplete="off" disabled={disabled} value={open === kind ? search : display} placeholder={placeholder} className={`${field} disabled:bg-slate-100`} onFocus={() => { setSearch(""); setOpen(kind); }} onChange={e => { setSearch(e.target.value); setOpen(kind); }} onKeyDown={e => { if (e.key === "Enter" && kind === "officer" && addAllowed) { e.preventDefault(); chooseCustom(); } }} /><button type="button" disabled={disabled} aria-label="เปิดรายการ" onClick={() => { setSearch(""); setOpen(open === kind ? null : kind); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100">▼</button></div>;
  return <div className="grid grid-cols-1 gap-5 overflow-visible lg:grid-cols-2">
    <input type="hidden" name="departmentId" value={departmentId} /><input type="hidden" name="sectionId" value={sectionId} /><input type="hidden" name="officerId" value={officerId} /><input type="hidden" name="newOfficerName" value={customName} /><input type="hidden" name="newOfficerPosition" value={customPosition} />
    <div><label className={label}>หน่วยงาน</label><div className="flex min-h-[50px] items-center rounded-[14px] border border-slate-300 bg-slate-100 px-4 py-3 font-extrabold">{departmentName}</div></div>
    {sections.length > 0 ? <div><label className={label}>กลุ่มงาน</label>{input("section", section?.name ?? "", "พิมพ์ค้นหากลุ่มงาน...")}</div> : <div />}
    <div><label className={label}>ผู้ครอบครอง</label>{input("officer", customName || (officer ? `${officer.firstName} ${officer.lastName}` : initialResponsibleName), sections.length > 0 && !sectionId ? "กรุณาเลือกกลุ่มงานก่อน" : "พิมพ์ค้นหาหรือเพิ่มชื่อผู้ครอบครอง...", sections.length > 0 && !sectionId)}{customName && <p className="mt-2 text-xs font-semibold text-emerald-700">ชื่อใหม่: {customName} (บันทึกลงทะเบียนเมื่อกดบันทึก)</p>}</div>
    <div><label className={label}>ตำแหน่ง</label>{customName ? <input type="text" value={customPosition} onChange={e => setCustomPosition(e.target.value)} placeholder="ระบุตำแหน่ง (ถ้ามี)" className={field} /> : <div className="flex min-h-[50px] items-center rounded-[14px] border border-slate-300 bg-slate-100 px-4 py-3 font-bold">{officer?.position || "-"}</div>}</div>
    {popup}
  </div>;
}
