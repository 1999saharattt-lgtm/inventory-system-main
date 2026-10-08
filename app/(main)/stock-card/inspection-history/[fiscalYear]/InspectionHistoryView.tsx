

"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AppButton from "@/components/AppButton";

import { useRouter } from "next/navigation";

import AppCard from "@/components/AppCard";

import AppSearchInput from "@/components/AppSearchInput";

import AppSearchableSelect from "@/components/AppSearchableSelect";

import AppTableCard from "@/components/AppTableCard";

import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

type Material = {

  materialId: number;

  code: string;

  name: string;

  unit: string;

  category: string;

  openingBalance: number;

  receiveQty: number;

  issueQty: number;

  closingBalance: number;

};

type InspectionRow = {

  materialId: number;

  accuracy: string;

  shortageQty: string;

  excessQty: string;

  baht: string;

  satang: string;

  damagedQty: string;

  deterioratedQty: string;

  unnecessaryQty: string;

  remark: string;

};

type Officer = {

  id: number;

  firstName: string;

  lastName: string;

  position: string;

  type: string;

  departmentId: number | null;

  sectionId: number | null;

  department: { id: number; name: string } | null;

  section: { id: number; name: string } | null;

};

type Props = {

  fiscalYear: number;

  startShortYear: string;

  endShortYear: string;

  materials: Material[];

  rows: InspectionRow[];

  officers: Officer[];

  inspectorIds: string[];

  inspectionStartDate: string;

  inspectionEndDate: string;

  initialEditMode?: boolean;

};

type IOSDatePickerProps = {

  id: string;

  value: string;

  onChange: (value: string) => void;

};

type CalendarPosition = {

  top: number;

  left: number;

  width: number;

};


const THAI_MONTHS = [

  "มกราคม",

  "กุมภาพันธ์",

  "มีนาคม",

  "เมษายน",

  "พฤษภาคม",

  "มิถุนายน",

  "กรกฎาคม",

  "สิงหาคม",

  "กันยายน",

  "ตุลาคม",

  "พฤศจิกายน",

  "ธันวาคม",

];

const THAI_WEEK_DAYS = [

  "อา",

  "จ",

  "อ",

  "พ",

  "พฤ",

  "ศ",

  "ส",

];


function getCurrentDate() {

  const parts = new Intl.DateTimeFormat("en-US", {

    timeZone: "Asia/Bangkok",

    year: "numeric",

    month: "2-digit",

    day: "2-digit",

  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;

  const month = parts.find((p) => p.type === "month")?.value;

  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;

}

function parseDateOnly(value: string) {

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);

  const month = Number(match[2]);

  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (

    date.getFullYear() !== year ||

    date.getMonth() !== month - 1 ||

    date.getDate() !== day

  ) {

    return null;

  }

  return date;

}

function toDateValue(

  year: number,

  month: number,

  day: number

) {

  return [

    year,

    String(month + 1).padStart(2, "0"),

    String(day).padStart(2, "0"),

  ].join("-");

}

function formatThaiDate(value: string) {

  const date = parseDateOnly(value);

  if (!date) return "";

  return `${date.getDate()} ${

    THAI_MONTHS[date.getMonth()]

  } ${date.getFullYear() + 543}`;

}

/* =========================================================

   IOS DATE PICKER

   FIX:

   - Render calendar through Portal

   - Fixed positioning

   - High z-index

   - Auto flip above when insufficient space

   - Close on outside click / Escape

   - Reposition on scroll and resize

\\========================================================= */

function IOSDatePicker({

  id,

  value,

  onChange,

}: IOSDatePickerProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const popupRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState<CalendarPosition>({

    top: 0,

    left: 0,

    width: 330,

  });

  const selectedDate = parseDateOnly(value);

  const [displayYear, setDisplayYear] = useState(() => {

    const date = parseDateOnly(value) ?? parseDateOnly(getCurrentDate())!;

    return date.getFullYear();

  });

  const [displayMonth, setDisplayMonth] = useState(() => {

    const date = parseDateOnly(value) ?? parseDateOnly(getCurrentDate())!;

    return date.getMonth();

  });

  useEffect(() => {

    setMounted(true);

  }, []);

  useEffect(() => {

    const date = parseDateOnly(value);

    if (!date) return;

    setDisplayYear(date.getFullYear());

    setDisplayMonth(date.getMonth());

  }, [value]);

  const updatePosition = useCallback(() => {

    const button = buttonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    const viewportHeight = window.innerHeight;

    const margin = 12;

    const gap = 8;

    const popupWidth = Math.min(

      330,

      Math.max(240, viewportWidth - margin * 2)

    );

    const popupHeight =

      popupRef.current?.getBoundingClientRect().height ?? 370;

    const spaceBelow = viewportHeight - rect.bottom;

    const spaceAbove = rect.top;

    const shouldOpenAbove =

      spaceBelow < popupHeight + gap + margin &&

      spaceAbove > spaceBelow;

    let top = shouldOpenAbove

      ? rect.top - popupHeight - gap

      : rect.bottom + gap;

    top = Math.max(

      margin,

      Math.min(top, viewportHeight - popupHeight - margin)

    );

    let left = rect.left;

    left = Math.max(

      margin,

      Math.min(left, viewportWidth - popupWidth - margin)

    );

    setPosition({

      top,

      left,

      width: popupWidth,

    });

  }, []);

  useEffect(() => {

    if (!open) return;

    updatePosition();

    const frame = window.requestAnimationFrame(updatePosition);

    function handleOutside(event: PointerEvent) {

      const target = event.target as Node;

      if (

        !containerRef.current?.contains(target) &&

        !popupRef.current?.contains(target)

      ) {

        setOpen(false);

      }

    }

    function handleKeyDown(event: KeyboardEvent) {

      if (event.key === "Escape") {

        setOpen(false);

        buttonRef.current?.focus();

      }

    }

    document.addEventListener("pointerdown", handleOutside);

    document.addEventListener("keydown", handleKeyDown);

    window.addEventListener("resize", updatePosition);

    window.addEventListener("scroll", updatePosition, true);

    return () => {

      window.cancelAnimationFrame(frame);

      document.removeEventListener("pointerdown", handleOutside);

      document.removeEventListener("keydown", handleKeyDown);

      window.removeEventListener("resize", updatePosition);

      window.removeEventListener("scroll", updatePosition, true);

    };

  }, [open, updatePosition]);

  const firstDay = new Date(

    displayYear,

    displayMonth,

    1

  ).getDay();

  const daysInMonth = new Date(

    displayYear,

    displayMonth + 1,

    0

  ).getDate();

  const calendarCells: Array<number | null> = [];

  for (let i = 0; i < firstDay; i++) {

    calendarCells.push(null);

  }

  for (let day = 1; day <= daysInMonth; day++) {

    calendarCells.push(day);

  }

  while (calendarCells.length % 7 !== 0) {

    calendarCells.push(null);

  }

  function previousMonth() {

    if (displayMonth === 0) {

      setDisplayMonth(11);

      setDisplayYear((current) => current - 1);

    } else {

      setDisplayMonth((current) => current - 1);

    }

  }

  function nextMonth() {

    if (displayMonth === 11) {

      setDisplayMonth(0);

      setDisplayYear((current) => current + 1);

    } else {

      setDisplayMonth((current) => current + 1);

    }

  }

  function selectDay(day: number) {

    onChange(toDateValue(displayYear, displayMonth, day));

    setOpen(false);

  }

  function selectToday() {

    const today = parseDateOnly(getCurrentDate());

    if (!today) return;

    onChange(

      toDateValue(

        today.getFullYear(),

        today.getMonth(),

        today.getDate()

      )

    );

    setDisplayYear(today.getFullYear());

    setDisplayMonth(today.getMonth());

    setOpen(false);

  }

  const calendar = (

    <div

      ref={popupRef}

      role="dialog"

      aria-label="เลือกวันที่"

      style={{

        position: "fixed",

        top: position.top,

        left: position.left,

        width: position.width,

        zIndex: 2147483647,

      }}

      className="

        rounded-[22px]

        border-2

        border-slate-200

        bg-white

        p-3

        shadow-2xl

      "

    >

      <div className="flex items-center justify-between px-1 pb-3">

        <button

          type="button"

          onClick={previousMonth}

          aria-label="เดือนก่อนหน้า"

          className="

            flex h-9 w-9 items-center justify-center

            rounded-full bg-slate-100

            text-lg font-black !text-slate-700

            hover:bg-slate-200

          "

        >

          ‹

        </button>

        <div className="text-center">

          <div className="text-base font-black !text-slate-900">

            {THAI_MONTHS[displayMonth]}

          </div>

          <div className="text-sm font-bold !text-slate-500">

            พ.ศ. {displayYear + 543}

          </div>

        </div>

        <button

          type="button"

          onClick={nextMonth}

          aria-label="เดือนถัดไป"

          className="

            flex h-9 w-9 items-center justify-center

            rounded-full bg-slate-100

            text-lg font-black !text-slate-700

            hover:bg-slate-200

          "

        >

          ›

        </button>

      </div>

      <div className="grid grid-cols-7 gap-1">

        {THAI_WEEK_DAYS.map((day) => (

          <div

            key={day}

            className="

              py-1.5 text-center text-xs font-black

              !text-slate-500

            "

          >

            {day}

          </div>

        ))}

      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">

        {calendarCells.map((day, index) => {

          if (day === null) {

            return <div key={`empty-${index}`} className="h-9" />;

          }

          const selected =

            selectedDate !== null &&

            selectedDate.getFullYear() === displayYear &&

            selectedDate.getMonth() === displayMonth &&

            selectedDate.getDate() === day;

          return (

            <button

              key={day}

              type="button"

              onClick={() => selectDay(day)}

              aria-pressed={selected}

              className={`

                flex h-9 items-center justify-center

                rounded-full text-sm font-extrabold transition

                ${

                  selected

                    ? "bg-blue-600 !text-white shadow-md"

                    : "bg-transparent !text-slate-700 hover:bg-blue-50"

                }

              `}

            >

              {day}

            </button>

          );

        })}

      </div>

      <div

        className="

          mt-3 flex items-center justify-between

          border-t border-slate-200 pt-3

        "

      >

        <button

          type="button"

          onClick={() => {

            onChange("");

            setOpen(false);

          }}

          className="

            rounded-[10px] px-3 py-2

            text-xs font-extrabold !text-red-600

            hover:bg-red-50

          "

        >

          ล้างวันที่

        </button>

        <button

          type="button"

          onClick={selectToday}

          className="

            rounded-[10px] px-3 py-2

            text-xs font-extrabold !text-blue-600

            hover:bg-blue-50

          "

        >

          วันนี้

        </button>

      </div>

    </div>

  );

  return (

    <div

      ref={containerRef}

      className="relative w-full min-w-0"

    >

      <button

        ref={buttonRef}

        id={id}

        type="button"

        aria-haspopup="dialog"

        aria-expanded={open}

        onClick={() => setOpen((current) => !current)}

        className="

          flex h-[46px] w-full min-w-0

          items-center justify-between gap-3

          rounded-[14px]

          border border-slate-200

          bg-white px-4

          text-left text-sm font-bold

          !text-slate-900

          shadow-sm outline-none

          transition-all duration-200

          hover:bg-slate-50

          focus:ring-4 focus:ring-blue-100

        "

      >

        <span

          className={

            value ? "!text-slate-900" : "!text-slate-400"

          }

        >

          {value ? formatThaiDate(value) : "เลือกวันที่"}

        </span>

        <span aria-hidden="true" className="shrink-0 text-base">

          📅

        </span>

      </button>

      {mounted && open && createPortal(calendar, document.body)}

    </div>

  );

}


const CATEGORY_ORDER = [

  "OFFICE",

  "COMPUTER",

  "ELECTRIC",

  "HOUSEHOLD",

  "VEHICLE",

  "PRINTING",

];

const CATEGORY_NAME: Record<string, string> = {

  OFFICE: "วัสดุสำนักงาน",

  COMPUTER: "วัสดุคอมพิวเตอร์",

  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",

  VEHICLE: "วัสดุยานพาหนะ",

  PRINTING: "วัสดุสื่อสิ่งพิมพ์",

};

const widths = [

  42, 372, 72, 132, 84, 84, 90, 60, 78,

  66, 66, 60, 60, 84, 90, 108, 162,

];

const headerClass =

  "border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-1 py-2 text-center align-middle text-[15px] font-extrabold leading-tight !text-white";

const cellClass =

  "h-[23.25px] border border-black px-1 py-0 text-center text-[15px] font-normal leading-none tabular-nums !text-black";

const inputClass =

  "h-7 w-full min-w-0 rounded-md border-2 !border-black bg-white px-1 text-center text-[14px] font-medium !text-black outline-none focus:ring-2 focus:ring-blue-200";

const numberFields = [

  "shortageQty",

  "excessQty",

  "baht",

  "satang",

  "damagedQty",

  "deterioratedQty",

  "unnecessaryQty",

] as const;

function formatStock(value: number) {

  return Number.isFinite(value) && value !== 0

    ? value.toLocaleString("th-TH")

    : "-";

}

function formatCurrent(value: number) {

  return Number.isFinite(value)

    ? value.toLocaleString("th-TH")

    : "0";

}

export default function InspectionHistoryView({

  fiscalYear,

  startShortYear,

  endShortYear,

  materials,

  rows,

  officers,

  inspectorIds,

  inspectionStartDate,

  inspectionEndDate,

}: Props) {

  const router = useRouter();
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(1710);
  const [canScroll, setCanScroll] = useState(false);

  const syncFromTop = useCallback(() => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  }, []);
  const syncFromTable = useCallback(() => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const container = tableScrollRef.current;
    const table = tableRef.current;
    if (!container || !table) return;
    const measure = () => {
      const width = Math.max(1710, table.scrollWidth);
      setTableWidth(width);
      setCanScroll(width > container.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(table);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);


  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategory, setSelectedCategory] =

    useState("ALL");

  // เปิดโหมดแก้ไขทันทีเมื่อเข้าหน้านี้

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  const [editedRows, setEditedRows] = useState<

    InspectionRow[]

  >(rows.map((row) => ({ ...row })));

  const [editedInspectorIds, setEditedInspectorIds] =

    useState<string[]>([

      inspectorIds[0] ?? "",

      inspectorIds[1] ?? "",

      inspectorIds[2] ?? "",

    ]);

  const [editedStartDate, setEditedStartDate] =

    useState(inspectionStartDate);

  const [editedEndDate, setEditedEndDate] =

    useState(inspectionEndDate);

  const rowMap = useMemo(

    () =>

      new Map(

        editedRows.map((row) => [row.materialId, row])

      ),

    [editedRows]

  );

  const filtered = useMemo(

    () =>

      materials.filter((material) => {

        if (

          selectedCategory !== "ALL" &&

          material.category !== selectedCategory

        ) {

          return false;

        }

        const query = searchTerm

          .trim()

          .toLocaleLowerCase("th");

        return (

          !query ||

          [

            material.code,

            material.name,

            material.unit,

            CATEGORY_NAME[material.category],

          ]

            .filter(Boolean)

            .join(" ")

            .toLocaleLowerCase("th")

            .includes(query)

        );

      }),

    [materials, searchTerm, selectedCategory]

  );

  const groups = CATEGORY_ORDER.map((category) => ({

    category,

    name: CATEGORY_NAME[category],

    materials: filtered.filter(

      (material) => material.category === category

    ),

  })).filter((group) => group.materials.length > 0);

  const officerMap = useMemo(

    () =>

      new Map(

        officers.map((officer) => [

          String(officer.id),

          officer,

        ])

      ),

    [officers]

  );

  const officerOptions = officers.map((officer) => ({

    value: String(officer.id),

    label: `${officer.firstName} ${officer.lastName}`.trim(),

  }));

  const categories = [

    { value: "ALL", label: "ทุกหมวด" },

    ...CATEGORY_ORDER.map((category) => ({

      value: category,

      label: CATEGORY_NAME[category],

    })),

  ];

  function updateRow(

    materialId: number,

    field: keyof InspectionRow,

    value: string

  ) {

    if (field === "materialId") return;

    setEditedRows((current) =>

      current.map((row) =>

        row.materialId === materialId

          ? { ...row, [field]: value }

          : row

      )

    );

  }

  function updateInspector(index: number, value: string) {

    setEditedInspectorIds((current) => {

      const next = [...current];

      next[index] = value;

      return next;

    });

  }

  async function saveChanges() {

    if (isSaving) return;

    setError("");

    if (!editedStartDate) {

      setError("กรุณาเลือกวันที่เริ่มตรวจสอบ");

      return;

    }

    if (

      editedEndDate &&

      editedEndDate < editedStartDate

    ) {

      setError(

        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ"

      );

      return;

    }

    if (

      editedInspectorIds.length !== 3 ||

      editedInspectorIds.some((id) => !id)

    ) {

      setError("กรุณาเลือกคณะกรรมการให้ครบ 3 คน");

      return;

    }

    if (new Set(editedInspectorIds).size !== 3) {

      setError("ไม่สามารถเลือกคณะกรรมการซ้ำกันได้");

      return;

    }

    for (const row of editedRows) {

      for (const field of numberFields) {

        const value = row[field].trim();

        if (

          value &&

          (!/^\d+$/.test(value) ||

            !Number.isSafeInteger(Number(value)))

        ) {

          setError(

            `ข้อมูลจำนวนของพัสดุรหัส ${row.materialId} ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`

          );

          return;

        }

      }

    }

    setIsSaving(true);

    try {

      const payload = {

        fiscalYear,

        inspectionDate: editedStartDate,

        inspectionEndDate: editedEndDate || null,

        inspectorIds: editedInspectorIds.map(Number),

        rows: editedRows.map((row) => ({

          materialId: row.materialId,

          accuracy: row.accuracy || null,

          shortageQty:

            row.shortageQty === ""

              ? null

              : Number(row.shortageQty),

          excessQty:

            row.excessQty === ""

              ? null

              : Number(row.excessQty),

          baht:

            row.baht === ""

              ? null

              : Number(row.baht),

          satang:

            row.satang === ""

              ? null

              : Number(row.satang),

          damagedQty:

            row.damagedQty === ""

              ? null

              : Number(row.damagedQty),

          deterioratedQty:

            row.deterioratedQty === ""

              ? null

              : Number(row.deterioratedQty),

          unnecessaryQty:

            row.unnecessaryQty === ""

              ? null

              : Number(row.unnecessaryQty),

          remark: row.remark.trim() || null,

        })),

      };

      const response = await fetch(

        "/api/stock-card/inspection",

        {

          method: "PUT",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify(payload),

        }

      );

      const result = await response.json();

      if (!response.ok || result.ok === false) {

        throw new Error(

          result.message || result.error ||

            "ไม่สามารถบันทึกข้อมูลได้"

        );

      }

      window.location.assign(`/stock-card/inspection-history/${fiscalYear}`);

    } catch (cause) {

      setError(

        cause instanceof Error

          ? cause.message

          : "เกิดข้อผิดพลาดในการบันทึก"

      );

    } finally {

      setIsSaving(false);

    }

  }

  return (

    <div className="w-full min-w-0 space-y-4">

      <AppCard

        padding={false}

        className="!overflow-visible !rounded-[22px]"

      >

        <div className="p-3 sm:p-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">

            <div className="shrink-0 lg:w-[210px]">

              <h2 className="text-lg font-black tracking-tight !text-slate-900">

                ข้อมูลการตรวจสอบ

              </h2>

              <p className="mt-0.5 text-xs font-semibold !text-slate-500">

                แก้ไขข้อมูลการตรวจสอบ

              </p>

            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">

              <div className="min-w-0">

                <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">

                  วันที่เริ่มตรวจสอบ

                </label>

                <IOSDatePicker id="inspectionStartDate" value={editedStartDate} onChange={setEditedStartDate} />

              </div>

              <div className="min-w-0">

                <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">

                  วันที่ตรวจสอบแล้วเสร็จ

                </label>

                <IOSDatePicker id="inspectionEndDate" value={editedEndDate} onChange={setEditedEndDate} />

              </div>

            </div>

          </div>

        </div>

      </AppCard>

      <div className="relative z-10">

        <AppSearchInput

          value={searchTerm}

          onChange={(event) =>

            setSearchTerm(event.target.value)

          }

          onSubmit={() =>

            setSearchTerm(searchTerm.trim())

          }

          onClear={() => setSearchTerm("")}

          placeholder="ค้นหารหัส / ชื่อหรือชนิดวัสดุหรือครุภัณฑ์"

          resultCount={filtered.length}

          resultLabel="รายการ"

          showSearchButton

          showClearButton

          searchButtonText="ค้นหา"

          clearButtonText="ล้าง"

        />

      </div>

      <AppTableCard

        title="รายการตรวจสอบบัญชีพัสดุ"

        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}

        badge={`${filtered.length.toLocaleString("th-TH")} รายการ`}

        className="relative z-0 w-full min-w-0"

      >

        <div className="border-b border-slate-200 bg-white p-3">

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">

            <div className="relative z-30 w-full sm:max-w-[420px]">

              <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">

                เลือกหมวด

              </label>

              <AppSearchableSelect

                value={selectedCategory}

                options={categories}

                placeholder="เลือกหมวด"

                searchPlaceholder="พิมพ์ค้นหาหมวด..."

                emptyText="ไม่พบหมวด"

                onChange={setSelectedCategory}

              />

            </div>

            <ExportInspectionPdf

              fiscalYear={fiscalYear}

              startShortYear={startShortYear}

              endShortYear={endShortYear}

              materials={filtered}

              rows={editedRows}

              inspectionStartDate={editedStartDate}

              inspectionEndDate={editedEndDate}

              inspectorIds={editedInspectorIds}

              officers={officers}

            />

          </div>

        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-bold !text-slate-600">เลื่อนตารางซ้าย–ขวา</span>
            <span className="text-xs font-semibold !text-slate-500">
              {canScroll ? "ลากแถบเลื่อนเพื่อดูคอลัมน์เพิ่มเติม" : "แสดงคอลัมน์ครบแล้ว"}
            </span>
          </div>
          <div
            ref={topScrollRef}
            onScroll={syncFromTop}
            aria-label="แถบเลื่อนตารางด้านบน"
            className="w-full overflow-x-scroll overflow-y-hidden rounded-md border border-slate-300 bg-white"
            style={{ height: 18, scrollbarWidth: "auto" }}
          >
            <div style={{ width: tableWidth, height: 1 }} />
          </div>
        </div>

        <div
          ref={tableScrollRef}
          onScroll={syncFromTable}
          className="w-full min-w-0 overflow-x-auto overscroll-x-contain"
        >
          <table
            ref={tableRef}
            className="w-full min-w-[1710px] table-fixed border-collapse bg-white text-[15px]"
          >
            <colgroup>

              {widths.map((width, index) => (

                <col

                  key={index}

                  style={{ width: `${width}px` }}

                />

              ))}

            </colgroup>

            <thead>

              <tr>

                <th rowSpan={2} className={headerClass}>

                  ลำดับ

                </th>

                <th rowSpan={2} className={headerClass}>

                  ชื่อหรือชนิดวัสดุหรือครุภัณฑ์

                </th>

                <th rowSpan={2} className={headerClass}>

                  หน่วยนับ

                </th>

                <th rowSpan={2} className={headerClass}>

                  คงเหลือยอดยกมาเมื่อ

                  <br />

                  30 ก.ย. {startShortYear}

                </th>

                <th colSpan={2} className={headerClass}>

                  01 ต.ค. {startShortYear} - 30 ก.ย.{" "}

                  {endShortYear}

                </th>

                <th rowSpan={2} className={headerClass}>

                  คงเหลือปัจจุบัน

                </th>

                <th colSpan={2} className={headerClass}>
                  ผลการตรวจสอบ
                </th>
                <th colSpan={4} className={headerClass}>
                  ถ้าไม่ถูกต้องจำนวนที่ขาด
                  <div>จำนวนที่เกินคิดเป็นเงินร้อยละ</div>
                </th>
                <th colSpan={3} className={headerClass}>
                  จำนวนที่
                </th>
                <th rowSpan={2} className={headerClass}>

                  หมายเหตุ

                </th>

              </tr>

              <tr>

                {[

                  "รับ",

                  "จ่าย",

                  "ถูกต้อง",

                  "ไม่ถูกต้อง",

                  "ขาด",

                  "เกิน",

                  "บาท",

                  "สต.",

                  "ชำรุด",

                  "เสื่อมสภาพ",

                  "ไม่จำเป็นต้องใช้",

                ].map((label) => (

                  <th

                    key={label}

                    className={`${headerClass} !py-1`}

                  >

                    {label}

                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {groups.length === 0 && (

                <tr>

                  <td

                    colSpan={17}

                    className={`${cellClass} py-6`}

                  >

                    ไม่พบรายการพัสดุ

                  </td>

                </tr>

              )}

              {groups.map((group) => (

                <Fragment key={group.category}>

                  <tr>

                    <td

                      colSpan={17}

                      className="h-[23.25px] border border-slate-200 bg-white px-2 py-0 text-left text-[15px] font-bold leading-none !text-black"

                    >

                      {group.name}

                    </td>

                  </tr>

                  {group.materials.map(

                    (material, index) => {

                      const row = rowMap.get(

                        material.materialId

                      );

                      const cells = [

                        formatStock(

                          material.openingBalance

                        ),

                        formatStock(material.receiveQty),

                        formatStock(material.issueQty),

                        formatCurrent(

                          material.closingBalance

                        ),

                      ];

                      return (

                        <tr

                          key={material.materialId}

                          className={

                            index % 2 === 0

                              ? "bg-white hover:bg-blue-50/50"

                              : "bg-slate-50/35 hover:bg-blue-50/50"

                          }

                        >

                          <td className={cellClass}>

                            {index + 1}

                          </td>

                          <td

                            className={`${cellClass} px-2 text-left leading-tight`}

                          >

                            {material.name}

                          </td>

                          <td className={cellClass}>

                            {material.unit || "-"}

                          </td>

                          {cells.map((value, i) => (

                            <td

                              key={i}

                              className={cellClass}

                            >

                              {value}

                            </td>

                          ))}

                          <td className={cellClass}>

                            <input

                              type="radio"

                              name={`accuracy-${material.materialId}`}
                              aria-label={`ถูกต้อง ${material.name}`}

                              checked={

                                row?.accuracy === "CORRECT"

                              }

                              onChange={(event) =>

                                updateRow(

                                  material.materialId,

                                  "accuracy",

                                  event.target.checked

                                    ? "CORRECT"

                                    : ""

                                )

                              }

                              className="h-4 w-4 accent-emerald-600"

                            />

                          </td>

                          <td className={cellClass}>

                            <input

                              type="radio"

                              name={`accuracy-${material.materialId}`}
                              aria-label={`ไม่ถูกต้อง ${material.name}`}

                              checked={

                                row?.accuracy === "INCORRECT"

                              }

                              onChange={(event) =>

                                updateRow(

                                  material.materialId,

                                  "accuracy",

                                  event.target.checked

                                    ? "INCORRECT"

                                    : ""

                                )

                              }

                              className="h-4 w-4 accent-red-600"

                            />

                          </td>

                          {numberFields.map((field) => (

                            <td

                              key={field}

                              className={cellClass}

                            >

                              <input

                                type="number"

                                min={0}

                                step={1}

                                value={row?.[field] ?? ""}

                                onChange={(event) =>

                                  updateRow(

                                    material.materialId,

                                    field,

                                    event.target.value

                                  )

                                }

                                aria-label={`${field} ${material.name}`}

                                className={inputClass}

                              />

                            </td>

                          ))}

                          <td

                            className={`${cellClass} px-2 text-left`}

                          >

                            <input

                              type="text"

                              value={row?.remark ?? ""}

                              onChange={(event) =>

                                updateRow(

                                  material.materialId,

                                  "remark",

                                  event.target.value

                                )

                              }

                              aria-label={`หมายเหตุ ${material.name}`}

                              className={`${inputClass} text-left`}

                            />

                          </td>

                        </tr>

                      );

                    }

                  )}

                </Fragment>

              ))}

            </tbody>

          </table>

        </div>

      </AppTableCard>

      <AppCard className="relative z-20 w-full min-w-0 !overflow-visible !p-4">

        <h2 className="text-xl font-black tracking-tight !text-slate-900">

          คณะกรรมการตรวจสอบครุภัณฑ์

        </h2>

        <p className="mt-1 text-sm font-semibold !text-slate-500">

          รายชื่อคณะกรรมการตรวจสอบจำนวน 3 คน

        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">

          {[0, 1, 2].map((index) => {

            const officer = officerMap.get(

              editedInspectorIds[index] ?? ""

            );

            return (

              <div

                key={index}

                className="relative min-w-0 rounded-[16px] border border-slate-200/80 bg-slate-50/60 p-3"

              >

                <div className="mb-2 text-sm font-extrabold !text-slate-700">

                  {index === 0

                    ? "ประธานกรรมการ"

                    : `กรรมการคนที่ ${index}`}

                </div>

                <AppSearchableSelect

                  value={editedInspectorIds[index] ?? ""}

                  options={officerOptions}

                  placeholder="เลือกคณะกรรมการ"

                  searchPlaceholder="พิมพ์ค้นหาชื่อกรรมการ..."

                  emptyText="ไม่พบรายชื่อ"

                  onChange={(value) =>

                    updateInspector(index, value)

                  }

                />

                <p className="mt-2 text-xs font-semibold !text-slate-500">

                  ตำแหน่ง: {officer?.position || "-"}

                </p>

              </div>

            );

          })}

        </div>

      </AppCard>

      {error && (

        <div

          role="alert"

          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"

        >

          {error}

        </div>

      )}

      {/* ปุ่มดำเนินการอยู่ล่างสุดของหน้า */}

      <div className="flex w-full flex-wrap items-center justify-end gap-3 border-t border-slate-200 pb-6 pt-5">

        <AppButton type="button" variant="secondary" size="md" disabled={isSaving}
          onClick={() => router.push(`/stock-card/inspection-history?fiscalYear=${fiscalYear}`)}>
          ยกเลิก
        </AppButton>

        <AppButton type="button" variant="success" size="md" disabled={isSaving} onClick={saveChanges}>

          {isSaving

            ? "กำลังบันทึก..."

            : "💾 บันทึกการแก้ไข"}

        </AppButton>

      </div>

    </div>

  );

}
