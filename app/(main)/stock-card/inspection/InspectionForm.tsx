
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppSearchInput from "@/components/AppSearchInput";
import AppSearchableSelect from "@/components/AppSearchableSelect";
import AppTableCard from "@/components/AppTableCard";

import ExportInspectionPdf from "./ExportInspectionPdf";

/* =========================================================
   TYPES
========================================================= */

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

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  type: string;
  departmentId: number | null;
  sectionId: number | null;
  department: {
    id: number;
    name: string;
  } | null;
  section: {
    id: number;
    name: string;
  } | null;
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

type Props = {
  fiscalYear: number;
  startShortYear: string;
  endShortYear: string;
  materials: Material[];
  officers: Officer[];
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

/* =========================================================
   CONSTANTS
========================================================= */

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

const TABLE_MIN_WIDTH = 1710;

/* =========================================================
   DATE HELPERS
========================================================= */

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
========================================================= */

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
          border-2 !border-black
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

/* =========================================================
   INITIAL ROWS
========================================================= */

function createInitialRows(
  materials: Material[]
): InspectionRow[] {
  return materials.map((material) => ({
    materialId: material.materialId,
    accuracy: "",
    shortageQty: "",
    excessQty: "",
    baht: "",
    satang: "",
    damagedQty: "",
    deterioratedQty: "",
    unnecessaryQty: "",
    remark: "",
  }));
}

/* =========================================================
   STOCK DISPLAY

   Opening / Receive / Issue:
   0 => "-"

   Closing balance:
   0 => "0"
========================================================= */

function displayStockValue(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return "-";
  }

  return value.toLocaleString("th-TH");
}

function displayClosingBalance(value: number | null | undefined) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("th-TH");
}

/* =========================================================
   OPTIONAL INTEGER
========================================================= */

function isValidOptionalInteger(value: string) {
  if (value.trim() === "") return true;

  const number = Number(value);

  return Number.isInteger(number) && number >= 0;
}

/* =========================================================
   SYNCHRONIZED HORIZONTAL SCROLL

   Top scrollbar and table scrollbar
   share the same scrollLeft.
========================================================= */

function useSynchronizedTableScroll() {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLTableElement>(null);

  const [scrollWidth, setScrollWidth] = useState(TABLE_MIN_WIDTH);
  const [canScroll, setCanScroll] = useState(false);

  const syncFromTop = useCallback(() => {
    if (!topRef.current || !bottomRef.current) return;

    bottomRef.current.scrollLeft = topRef.current.scrollLeft;
  }, []);

  const syncFromBottom = useCallback(() => {
    if (!topRef.current || !bottomRef.current) return;

    topRef.current.scrollLeft = bottomRef.current.scrollLeft;
  }, []);

  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    const table = contentRef.current;

    if (!top || !bottom || !table) return;

    function measure() {
      const width = Math.max(
        TABLE_MIN_WIDTH,
        table?.scrollWidth ?? TABLE_MIN_WIDTH
      );

      setScrollWidth(width);
      setCanScroll(width > bottom.clientWidth + 1);

      top.scrollLeft = bottom.scrollLeft;
    }

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(bottom);
    observer.observe(table);

    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return {
    topRef,
    bottomRef,
    contentRef,
    scrollWidth,
    canScroll,
    syncFromTop,
    syncFromBottom,
  };
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function InspectionForm({
  fiscalYear,
  startShortYear,
  endShortYear,
  materials,
  officers,
}: Props) {
  const [inspectionStartDate, setInspectionStartDate] =
    useState(getCurrentDate);

  const [inspectionEndDate, setInspectionEndDate] =
    useState(getCurrentDate);

  const [rows, setRows] = useState<InspectionRow[]>(
    () => createInitialRows(materials)
  );

  const [inspectorIds, setInspectorIds] = useState<string[]>([
    "",
    "",
    "",
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isSaving, setIsSaving] = useState(false);

  const {
    topRef,
    bottomRef,
    contentRef,
    scrollWidth,
    canScroll,
    syncFromTop,
    syncFromBottom,
  } = useSynchronizedTableScroll();

  /* =======================================================
     MATERIAL MAP
  ======================================================= */

  const materialMap = useMemo(
    () =>
      new Map(
        materials.map((material) => [
          material.materialId,
          material,
        ])
      ),
    [materials]
  );

  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categoryOptions = useMemo(
    () => [
      {
        value: "ALL",
        label: "ทุกหมวด",
      },
      ...CATEGORY_ORDER.map((category) => ({
        value: category,
        label: CATEGORY_NAME[category] ?? category,
      })),
    ],
    []
  );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredMaterials = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase("th");

    return materials.filter((material) => {
      if (
        selectedCategory !== "ALL" &&
        material.category !== selectedCategory
      ) {
        return false;
      }

      if (!keyword) return true;

      const searchable = [
        material.code,
        material.name,
        material.unit,
        CATEGORY_NAME[material.category],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("th");

      return searchable.includes(keyword);
    });
  }, [materials, searchTerm, selectedCategory]);

  /* =======================================================
     GROUP
  ======================================================= */

  const groupedMaterials = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        name: CATEGORY_NAME[category] ?? category,
        materials: filteredMaterials.filter(
          (material) => material.category === category
        ),
      })).filter((group) => group.materials.length > 0),
    [filteredMaterials]
  );

  /* =======================================================
     ROW HELPERS
  ======================================================= */

  function getRow(materialId: number) {
    return rows.find((row) => row.materialId === materialId);
  }

  function updateRow(
    materialId: number,
    field:
      | "shortageQty"
      | "excessQty"
      | "baht"
      | "satang"
      | "damagedQty"
      | "deterioratedQty"
      | "unnecessaryQty"
      | "remark",
    value: string
  ) {
    setRows((current) =>
      current.map((row) =>
        row.materialId === materialId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function updateAccuracy(materialId: number, accuracy: string) {
    setRows((current) =>
      current.map((row) =>
        row.materialId === materialId
          ? {
              ...row,
              accuracy,
            }
          : row
      )
    );
  }

  function updateVisibleAccuracy(accuracy: string) {
    const visibleIds = new Set(
      filteredMaterials.map((material) => material.materialId)
    );

    setRows((current) =>
      current.map((row) =>
        visibleIds.has(row.materialId)
          ? {
              ...row,
              accuracy,
            }
          : row
      )
    );
  }

  function updateNumberField(
    materialId: number,
    field:
      | "shortageQty"
      | "excessQty"
      | "baht"
      | "satang"
      | "damagedQty"
      | "deterioratedQty"
      | "unnecessaryQty",
    value: string
  ) {
    if (value === "") {
      updateRow(materialId, field, "");
      return;
    }

    if (!/^\d+$/.test(value)) return;

    updateRow(materialId, field, value);
  }

  /* =======================================================
     INSPECTORS
  ======================================================= */

  function updateInspector(index: number, officerId: string) {
    setInspectorIds((current) => {
      const next = [...current];
      next[index] = officerId;
      return next;
    });
  }

  function isOfficerSelected(
    officerId: string,
    currentIndex: number
  ) {
    return inspectorIds.some(
      (id, index) => index !== currentIndex && id === officerId
    );
  }

  function getOfficer(officerId: string) {
    return officers.find(
      (officer) => String(officer.id) === officerId
    );
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    if (isSaving) return;

    if (!inspectionStartDate || !inspectionEndDate) {
      alert(
        "กรุณาระบุวันที่เริ่มตรวจสอบและวันที่ตรวจสอบแล้วเสร็จ"
      );
      return;
    }

    const startDate = parseDateOnly(inspectionStartDate);
    const endDate = parseDateOnly(inspectionEndDate);

    if (!startDate || !endDate) {
      alert("รูปแบบวันที่ตรวจสอบไม่ถูกต้อง");
      return;
    }

    if (endDate.getTime() < startDate.getTime()) {
      alert(
        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ"
      );
      return;
    }

    if (
      inspectorIds.length !== 3 ||
      inspectorIds.some((id) => !id)
    ) {
      alert("กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน");
      return;
    }

    if (new Set(inspectorIds).size !== 3) {
      alert("ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้");
      return;
    }

    if (rows.length === 0) {
      alert("ไม่พบรายการพัสดุสำหรับตรวจสอบ");
      return;
    }

    for (const row of rows) {
      const material = materialMap.get(row.materialId);

      if (!row.accuracy) {
        alert(
          `กรุณาระบุผลการตรวจสอบของรายการ "${
            material?.name ?? row.materialId
          }"`
        );
        return;
      }

      const values = [
        row.shortageQty,
        row.excessQty,
        row.baht,
        row.satang,
        row.damagedQty,
        row.deterioratedQty,
        row.unnecessaryQty,
      ];

      if (values.some((value) => !isValidOptionalInteger(value))) {
        alert(
          `จำนวนของรายการ "${
            material?.name ?? row.materialId
          }" ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        "/api/stock-card/inspection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fiscalYear,
            inspectionDate: inspectionStartDate,
            inspectionEndDate,
            inspectorIds: inspectorIds.map(Number),
            rows: rows.map((row) => ({
              materialId: row.materialId,
              accuracy: row.accuracy,
              shortageQty: row.shortageQty,
              excessQty: row.excessQty,
              baht: row.baht,
              satang: row.satang,
              damagedQty: row.damagedQty,
              deterioratedQty: row.deterioratedQty,
              unnecessaryQty: row.unnecessaryQty,
              remark: row.remark,
            })),
          }),
        }
      );

      let data:
        | {
            ok?: boolean;
            message?: string;
            error?: string;
          }
        | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "ไม่สามารถบันทึกข้อมูลการตรวจสอบได้"
        );
      }

      alert(
        data?.message ||
          "บันทึกผลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว"
      );

      window.location.href =
        `/stock-card/inspection-history?fiscalYear=${fiscalYear}`;
    } catch (error) {
      console.error("Save stock card inspection error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูลการตรวจสอบ"
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* =======================================================
     TABLE INPUT STYLE
  ======================================================= */

  const compactInputClass = `
    h-[22px]
    w-full
    min-w-0
    rounded-[4px]
    border-2
    !border-black
    bg-white
    px-1
    text-center
    text-[15px]
    font-normal
    leading-none
    tabular-nums
    !text-slate-900
    outline-none
    placeholder:!text-slate-400
    focus:ring-1
    focus:ring-blue-100
  `;

  const tableHeaderClass = `
    border border-black
    bg-gradient-to-r from-slate-800 to-slate-700
    px-1 py-2
    text-center align-middle
    text-[15px] font-extrabold leading-tight
    !text-white
  `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* =====================================================
          1. INSPECTION INFO
      ===================================================== */}

      <AppCard
        padding={false}
        className="!overflow-visible !rounded-[22px]"
      >
        <div className="relative p-3 sm:p-4">
          <div
            className="
              flex flex-col gap-3
              lg:flex-row lg:items-end
            "
          >
            <div className="shrink-0 lg:w-[210px]">
              <h2
                className="
                  text-lg font-black tracking-tight
                  !text-slate-900
                "
              >
                ข้อมูลการตรวจสอบ
              </h2>

              <p
                className="
                  mt-0.5 text-xs font-semibold
                  !text-slate-500
                "
              >
                ระบุช่วงวันที่ดำเนินการตรวจสอบ
              </p>
            </div>

            <div
              className="
                grid min-w-0 flex-1
                grid-cols-1 gap-3 md:grid-cols-2
              "
            >
              <div className="relative min-w-0">
                <label
                  htmlFor="inspectionStartDate"
                  className="
                    mb-1.5 block text-sm font-extrabold
                    !text-slate-700
                  "
                >
                  วันที่เริ่มตรวจสอบ
                </label>

                <IOSDatePicker
                  id="inspectionStartDate"
                  value={inspectionStartDate}
                  onChange={setInspectionStartDate}
                />
              </div>

              <div className="relative min-w-0">
                <label
                  htmlFor="inspectionEndDate"
                  className="
                    mb-1.5 block text-sm font-extrabold
                    !text-slate-700
                  "
                >
                  วันที่ตรวจสอบแล้วเสร็จ
                </label>

                <IOSDatePicker
                  id="inspectionEndDate"
                  value={inspectionEndDate}
                  onChange={setInspectionEndDate}
                />
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          2. SEARCH
      ===================================================== */}

      <div className="relative z-10">
        <AppSearchInput
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          onSubmit={() => setSearchTerm(searchTerm.trim())}
          onClear={() => setSearchTerm("")}
          placeholder="ค้นหารหัส / ชื่อหรือชนิดวัสดุหรือครุภัณฑ์"
          resultCount={filteredMaterials.length}
          resultLabel="รายการ"
          showSearchButton
          showClearButton
          searchButtonText="ค้นหา"
          clearButtonText="ล้าง"
        />
      </div>

      {/* =====================================================
          3. TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        badge={`${filteredMaterials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="relative z-0 w-full min-w-0"
      >
        {/* CATEGORY / ACTIONS */}

        <div className="border-b border-slate-200 bg-white p-3">
          <div
            className="
              flex flex-col gap-3
              xl:flex-row xl:items-end xl:justify-between
            "
          >
            <div className="relative z-30 w-full sm:max-w-[420px]">
              <label
                className="
                  mb-1.5 block text-sm font-extrabold
                  !text-slate-700
                "
              >
                เลือกหมวด
              </label>

              <AppSearchableSelect
                value={selectedCategory}
                options={categoryOptions}
                placeholder="เลือกหมวด"
                searchPlaceholder="พิมพ์ค้นหาหมวด..."
                emptyText="ไม่พบหมวด"
                onChange={setSelectedCategory}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AppButton
                type="button"
                variant="success"
                size="sm"
                onClick={() => updateVisibleAccuracy("CORRECT")}
              >
                ถูกต้องทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="danger"
                size="sm"
                onClick={() => updateVisibleAccuracy("INCORRECT")}
              >
                ไม่ถูกต้องทั้งหมด
              </AppButton>

              <ExportInspectionPdf
                fiscalYear={fiscalYear}
                startShortYear={startShortYear}
                endShortYear={endShortYear}
                materials={filteredMaterials}
                rows={rows}
                inspectionStartDate={inspectionStartDate}
                inspectionEndDate={inspectionEndDate}
                inspectorIds={inspectorIds}
                officers={officers}
              />
            </div>
          </div>
        </div>

        {/* ===================================================
            TOP HORIZONTAL SCROLLBAR

            - Always positioned above the table
            - Synced with bottom scrollbar
            - Does not change table column widths
        =================================================== */}

        <div
          className="
            border-b border-slate-200
            bg-slate-50 px-3 py-2
          "
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-bold !text-slate-600">
              เลื่อนตารางซ้าย–ขวา
            </span>

            <span className="text-xs font-semibold !text-slate-500">
              {canScroll
                ? "ลากแถบเลื่อนเพื่อดูคอลัมน์เพิ่มเติม"
                : "แสดงคอลัมน์ครบแล้ว"}
            </span>
          </div>

          <div
            ref={topRef}
            onScroll={syncFromTop}
            aria-label="แถบเลื่อนตารางด้านบน"
            className="
              w-full overflow-x-scroll overflow-y-hidden
              rounded-md
              border border-slate-300
              bg-white
            "
            style={{
              height: 18,
              scrollbarWidth: "auto",
            }}
          >
            <div
              style={{
                width: scrollWidth,
                height: 1,
              }}
            />
          </div>
        </div>

        {/* ===================================================
            TABLE SCROLL CONTAINER
        =================================================== */}

        <div
          ref={bottomRef}
          onScroll={syncFromBottom}
          className="
            w-full min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            ref={contentRef}
            className="
              w-full min-w-[1710px]
              table-fixed border-collapse
              bg-white text-[15px]
            "
          >
            <colgroup>
              {[
                42, 372, 72, 132, 84, 84, 90, 60, 78,
                66, 66, 60, 60, 84, 90, 108, 162,
              ].map((width, index) => (
                <col key={index} style={{ width: `${width}px` }} />
              ))}
            </colgroup>

            {/* HEADER */}

            <thead>
              <tr>
                <th rowSpan={2} className={tableHeaderClass}>
                  ลำดับ
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  ชื่อหรือชนิดวัสดุหรือครุภัณฑ์
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  หน่วยนับ
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  <div>คงเหลือยอดยกมาเมื่อ</div>
                  <div>30 ก.ย. {startShortYear}</div>
                </th>

                <th colSpan={2} className={tableHeaderClass}>
                  {`01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`}
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  คงเหลือปัจจุบัน
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  ถูกต้อง
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  ไม่ถูกต้อง
                </th>

                <th colSpan={4} className={tableHeaderClass}>
                  รายละเอียดกรณีไม่ถูกต้อง
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  ชำรุด
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  เสื่อมสภาพ
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  ไม่จำเป็นต้องใช้
                </th>

                <th rowSpan={2} className={tableHeaderClass}>
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                {[
                  "รับ",
                  "จ่าย",
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                ].map((title) => (
                  <th
                    key={title}
                    className={`${tableHeaderClass} !py-1`}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY */}

            <tbody>
              {groupedMaterials.length === 0 ? (
                <tr>
                  <td
                    colSpan={17}
                    className="
                      h-[60px]
                      border border-black bg-white
                      text-center text-[15px] font-bold
                      !text-slate-500
                    "
                  >
                    ไม่พบรายการพัสดุ
                  </td>
                </tr>
              ) : (
                groupedMaterials.map((group) => (
                  <MaterialCategoryRows
                    key={group.category}
                    categoryName={group.name}
                    materials={group.materials}
                    getRow={getRow}
                    inputClass={compactInputClass}
                    updateAccuracy={updateAccuracy}
                    updateNumberField={updateNumberField}
                    updateRemark={(materialId, value) =>
                      updateRow(materialId, "remark", value)
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>

      {/* =====================================================
          4. COMMITTEE
      ===================================================== */}

      <AppCard
        className="
          relative z-20
          w-full min-w-0
          !overflow-visible !p-4
        "
      >
        <div>
          <h2
            className="
              text-xl font-black tracking-tight
              !text-slate-900
            "
          >
            คณะกรรมการตรวจสอบครุภัณฑ์
          </h2>

          <p
            className="
              mt-1 text-sm font-semibold
              !text-slate-500
            "
          >
            เลือกผู้ตรวจสอบจำนวน 3 คน โดยไม่สามารถเลือกรายชื่อซ้ำกันได้
          </p>
        </div>

        <div
          className="
            mt-4 grid grid-cols-1 gap-3
            lg:grid-cols-3
          "
        >
          {inspectorIds.map((inspectorId, index) => {
            const officerOptions = officers
              .filter((officer) => {
                const value = String(officer.id);

                return (
                  value === inspectorId ||
                  !isOfficerSelected(value, index)
                );
              })
              .map((officer) => ({
                value: String(officer.id),
                label:
                  `${officer.firstName} ${officer.lastName}`.trim(),
                description: [
                  officer.position,
                  officer.department?.name,
                  officer.section?.name,
                ]
                  .filter(Boolean)
                  .join(" / "),
              }));

            return (
              <div
                key={index}
                className="
                  relative min-w-0
                  rounded-[16px]
                  border border-slate-200/80
                  bg-slate-50/60 p-3
                "
              >
                <label
                  className="
                    mb-2 block text-sm font-extrabold
                    !text-slate-700
                  "
                >
                  {index === 0
                    ? "ประธานกรรมการ"
                    : `กรรมการคนที่ ${index}`}
                </label>

                <AppSearchableSelect
                  value={inspectorId}
                  options={officerOptions}
                  placeholder="เลือกผู้ตรวจสอบ"
                  searchPlaceholder="พิมพ์ชื่อ / นามสกุล / ตำแหน่ง / กลุ่มงาน..."
                  emptyText="ไม่พบรายชื่อผู้ตรวจสอบ"
                  required
                  onChange={(officerId) =>
                    updateInspector(index, officerId)
                  }
                />

                {inspectorId && (
                  <p
                    className="
                      mt-2 text-xs font-semibold
                      !text-slate-500
                    "
                  >
                    ตำแหน่ง:{" "}
                    {getOfficer(inspectorId)?.position || "-"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </AppCard>

      {/* =====================================================
          5. ACTION
      ===================================================== */}

      <div
        className="
          flex w-full flex-col gap-2
          sm:flex-row sm:items-center sm:justify-end
        "
      >
        <AppButton
          href={`/stock-card?fiscalYear=${fiscalYear}`}
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
        >
          ยกเลิก
        </AppButton>

        <AppButton
          type="button"
          variant="success"
          size="md"
          icon={<span aria-hidden="true">💾</span>}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึก"}
        </AppButton>
      </div>
    </div>
  );
}

/* =========================================================
   CATEGORY ROWS
========================================================= */

function MaterialCategoryRows({
  categoryName,
  materials,
  getRow,
  inputClass,
  updateAccuracy,
  updateNumberField,
  updateRemark,
}: {
  categoryName: string;
  materials: Material[];
  getRow: (materialId: number) => InspectionRow | undefined;
  inputClass: string;
  updateAccuracy: (
    materialId: number,
    accuracy: string
  ) => void;
  updateNumberField: (
    materialId: number,
    field:
      | "shortageQty"
      | "excessQty"
      | "baht"
      | "satang"
      | "damagedQty"
      | "deterioratedQty"
      | "unnecessaryQty",
    value: string
  ) => void;
  updateRemark: (
    materialId: number,
    value: string
  ) => void;
}) {
  return (
    <>
      <tr className="h-[23.25px] bg-white">
        <td
          colSpan={17}
          className="
            h-[23.25px]
            border border-black
            bg-white px-2 py-0
            text-left text-[15px]
            font-bold leading-none
            !text-black
          "
        >
          {categoryName}
        </td>
      </tr>

      {materials.map((material, index) => {
        const row = getRow(material.materialId);

        if (!row) return null;

        return (
          <tr
            key={material.materialId}
            className={`
              min-h-[23.25px] transition-colors
              hover:bg-blue-50/50
              ${
                index % 2 === 0
                  ? "bg-white"
                  : "bg-slate-50/35"
              }
            `}
          >
            {/* 1. ORDER */}

            <td className={stockCellClass}>
              {index + 1}
            </td>

            {/* 2. NAME */}

            <td
              className="
                min-h-[23.25px]
                border border-black
                px-2 py-[2px]
                text-left text-[15px]
                font-normal leading-tight
                !text-black
              "
            >
              {material.name}
            </td>

            {/* 3. UNIT */}

            <td className={stockCellClass}>
              {material.unit || "-"}
            </td>

            {/* 4. OPENING */}

            <td className={stockCellClass}>
              {displayStockValue(material.openingBalance)}
            </td>

            {/* 5. RECEIVE */}

            <td className={stockCellClass}>
              {displayStockValue(material.receiveQty)}
            </td>

            {/* 6. ISSUE */}

            <td className={stockCellClass}>
              {displayStockValue(material.issueQty)}
            </td>

            {/* 7. CURRENT BALANCE - ZERO FIX */}

            <td className={stockCellClass}>
              {displayClosingBalance(material.closingBalance)}
            </td>

            {/* 8. CORRECT */}

            <td className={radioCellClass}>
              <input
                type="radio"
                name={`accuracy-${material.materialId}`}
                checked={row.accuracy === "CORRECT"}
                onChange={() =>
                  updateAccuracy(material.materialId, "CORRECT")
                }
                className="
                  h-[15px] w-[15px] cursor-pointer
                  accent-emerald-600
                "
              />
            </td>

            {/* 9. INCORRECT */}

            <td className={radioCellClass}>
              <input
                type="radio"
                name={`accuracy-${material.materialId}`}
                checked={row.accuracy === "INCORRECT"}
                onChange={() =>
                  updateAccuracy(material.materialId, "INCORRECT")
                }
                className="
                  h-[15px] w-[15px] cursor-pointer
                  accent-red-600
                "
              />
            </td>

            {/* 10. SHORTAGE */}

            <CompactNumberCell
              value={row.shortageQty}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "shortageQty",
                  value
                )
              }
            />

            {/* 11. EXCESS */}

            <CompactNumberCell
              value={row.excessQty}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "excessQty",
                  value
                )
              }
            />

            {/* 12. BAHT */}

            <CompactNumberCell
              value={row.baht}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "baht",
                  value
                )
              }
            />

            {/* 13. SATANG */}

            <CompactNumberCell
              value={row.satang}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "satang",
                  value
                )
              }
            />

            {/* 14. DAMAGED */}

            <CompactNumberCell
              value={row.damagedQty}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "damagedQty",
                  value
                )
              }
            />

            {/* 15. DETERIORATED */}

            <CompactNumberCell
              value={row.deterioratedQty}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "deterioratedQty",
                  value
                )
              }
            />

            {/* 16. UNNECESSARY */}

            <CompactNumberCell
              value={row.unnecessaryQty}
              inputClass={inputClass}
              onChange={(value) =>
                updateNumberField(
                  material.materialId,
                  "unnecessaryQty",
                  value
                )
              }
            />

            {/* 17. REMARK */}

            <td
              className="
                h-[23.25px]
                border border-black p-0
              "
            >
              <input
                type="text"
                value={row.remark}
                placeholder=""
                onChange={(event) =>
                  updateRemark(
                    material.materialId,
                    event.target.value
                  )
                }
                className="
                  h-[22px] w-full
                  rounded-none
                  border-2 !border-black
                  bg-transparent px-1
                  text-left text-[15px]
                  font-normal leading-none
                  !text-black outline-none
                  focus:bg-blue-50
                  focus:ring-0
                "
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}

/* =========================================================
   SHARED TABLE CELL STYLES
========================================================= */

const stockCellClass = `
  h-[23.25px]
  border border-black
  px-1 py-0
  text-center text-[15px]
  font-normal leading-none
  tabular-nums
  !text-black
`;

const radioCellClass = `
  h-[23.25px]
  border border-black
  p-0 text-center
`;

/* =========================================================
   COMPACT NUMBER CELL
========================================================= */

function CompactNumberCell({
  value,
  inputClass,
  onChange,
}: {
  value: string;
  inputClass: string;
  onChange: (value: string) => void;
}) {
  return (
    <td
      className="
        h-[23.25px]
        border border-black p-0
      "
    >
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder=""
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </td>
  );
}
