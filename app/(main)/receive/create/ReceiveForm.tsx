"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { createReceive } from "./actions";

import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";
import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Vendor = {
  id: number;
  name: string;
};

type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
};

type ReceiveRow = {
  category: string;
  materialId: string;
  qty: string;
  unitPrice: string;
  manufacture: string;
  expiry: string;
};

type Props = {
  vendors: Vendor[];
  materials: Material[];
  documentNo: string;
};

type SearchableOption = {
  value: string;
  label: string;
};

type SearchableDropdownProps = {
  id: string;
  name?: string;
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
};

type IOSDatePickerProps = {
  id: string;
  name: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  compact?: boolean;
  align?: "left" | "right";
  onChange: (value: string) => void;
};

/* =========================================================
   CATEGORY
========================================================= */

const categories = [
  {
    value: "OFFICE",
    label: "วัสดุสำนักงาน",
  },
  {
    value: "COMPUTER",
    label: "วัสดุคอมพิวเตอร์",
  },
  {
    value: "ELECTRIC",
    label: "วัสดุไฟฟ้าและวิทยุ",
  },
  {
    value: "HOUSEHOLD",
    label: "วัสดุงานบ้านและงานครัว",
  },
  {
    value: "VEHICLE",
    label: "วัสดุยานพาหนะ",
  },
  {
    value: "PRINTING",
    label: "วัสดุสื่อสิ่งพิมพ์",
  },
];

/* =========================================================
   DATE
========================================================= */

const thaiMonths = [
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

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const weekDays = [
  "อา",
  "จ",
  "อ",
  "พ",
  "พฤ",
  "ศ",
  "ส",
];

function formatThaiDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  return `${day} ${
    thaiMonths[month - 1]
  } ${year + 543}`;
}

function formatThaiShortDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  return `${String(day).padStart(
    2,
    "0"
  )} ${
    thaiShortMonths[month - 1]
  } ${String(year + 543).slice(-2)}`;
}

function getTodayInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(
      today.getMonth() + 1
    ).padStart(2, "0"),
    String(
      today.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function dateToInputValue(
  date: Date
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function inputValueToDate(
  value: string
) {
  if (!value) {
    return null;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function isSameDate(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

/* =========================================================
   NUMBER
========================================================= */

function sanitizeDecimalInput(
  value: string
) {
  const cleaned = value
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");

  const firstDot =
    cleaned.indexOf(".");

  if (firstDot === -1) {
    return cleaned;
  }

  const integerPart =
    cleaned.slice(0, firstDot);

  const decimalPart = cleaned
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, 2);

  return `${integerPart}.${decimalPart}`;
}

function formatNumberWithCommas(
  value: string
) {
  if (!value) {
    return "";
  }

  const normalized =
    value.replace(/,/g, "");

  const [integerPart, decimalPart] =
    normalized.split(".");

  const formattedInteger = (
    integerPart || "0"
  ).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );

  if (normalized.includes(".")) {
    return `${formattedInteger}.${
      decimalPart ?? ""
    }`;
  }

  return formattedInteger;
}

/* =========================================================
   IOS DATE PICKER
========================================================= */

type CalendarPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

function IOSDatePicker({
  id,
  name,
  value,
  placeholder = "เลือกวันที่",
  required = false,
  compact = false,
  align = "left",
  onChange,
}: IOSDatePickerProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const triggerRef =
    useRef<HTMLButtonElement>(null);

  const calendarRef =
    useRef<HTMLDivElement>(null);

  const selectedDate =
    inputValueToDate(value);

  const [open, setOpen] =
    useState(false);

  const [viewDate, setViewDate] =
    useState<Date>(
      selectedDate ?? new Date()
    );

  const [calendarPosition, setCalendarPosition] =
    useState<CalendarPosition | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    }
  }, [value]);

  /* =======================================================
     POSITION

     วางปฏิทินด้วย fixed + Portal ที่ document.body
     เพื่อไม่ให้ AppCard / AppTableCard / overflow ของตาราง
     ตัดหรือซ้อนปฏิทินไว้ด้านหลัง
  ======================================================= */

  function updateCalendarPosition() {
    const trigger =
      triggerRef.current;

    if (
      !trigger ||
      typeof window === "undefined"
    ) {
      return;
    }

    const rect =
      trigger.getBoundingClientRect();

    const edgeGap = 12;
    const calendarGap = 10;

    const desiredWidth =
      compact ? 320 : 360;

    const width = Math.min(
      desiredWidth,
      Math.max(
        260,
        window.innerWidth -
          edgeGap * 2
      )
    );

    const desiredHeight =
      compact ? 430 : 450;

    const availableBelow =
      window.innerHeight -
      rect.bottom -
      calendarGap -
      edgeGap;

    const availableAbove =
      rect.top -
      calendarGap -
      edgeGap;

    const shouldOpenAbove =
      availableBelow <
        Math.min(
          desiredHeight,
          320
        ) &&
      availableAbove >
        availableBelow;

    const availableHeight =
      Math.max(
        shouldOpenAbove
          ? availableAbove
          : availableBelow,
        220
      );

    const maxHeight = Math.min(
      desiredHeight,
      availableHeight
    );

    const preferredLeft =
      align === "right"
        ? rect.right - width
        : rect.left;

    const maxLeft =
      window.innerWidth -
      width -
      edgeGap;

    const left = Math.min(
      Math.max(
        preferredLeft,
        edgeGap
      ),
      Math.max(
        edgeGap,
        maxLeft
      )
    );

    const top = shouldOpenAbove
      ? Math.max(
          edgeGap,
          rect.top -
            calendarGap -
            maxHeight
        )
      : Math.min(
          rect.bottom +
            calendarGap,
          window.innerHeight -
            edgeGap -
            maxHeight
        );

    setCalendarPosition({
      left,
      top,
      width,
      maxHeight,
    });
  }

  /* =======================================================
     OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      const clickedInsideTrigger =
        containerRef.current?.contains(
          target
        ) ?? false;

      const clickedInsideCalendar =
        calendarRef.current?.contains(
          target
        ) ?? false;

      if (
        !clickedInsideTrigger &&
        !clickedInsideCalendar
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown
      );
    };
  }, []);

  /* =======================================================
     OPEN / RESIZE / SCROLL
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setCalendarPosition(
        null
      );
      return;
    }

    updateCalendarPosition();

    const handleViewportChange =
      () => {
        updateCalendarPosition();
      };

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleViewportChange
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
    };
  }, [open, compact, align]);

  const calendarDays =
    useMemo(() => {
      const year =
        viewDate.getFullYear();

      const month =
        viewDate.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const lastDay =
        new Date(
          year,
          month + 1,
          0
        );

      const days: Array<
        Date | null
      > = [];

      for (
        let i = 0;
        i < firstDay.getDay();
        i++
      ) {
        days.push(null);
      }

      for (
        let day = 1;
        day <= lastDay.getDate();
        day++
      ) {
        days.push(
          new Date(
            year,
            month,
            day
          )
        );
      }

      while (
        days.length % 7 !== 0
      ) {
        days.push(null);
      }

      return days;
    }, [viewDate]);

  function previousMonth() {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  }

  function nextMonth() {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  }

  function selectToday() {
    const today = new Date();

    onChange(
      dateToInputValue(today)
    );

    setViewDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setOpen(false);
  }

  const calendarPopup =
    open &&
    calendarPosition &&
    typeof document !==
      "undefined"
      ? createPortal(
          <div
            ref={calendarRef}
            role="dialog"
            aria-label="เลือกวันที่"
            style={{
              position: "fixed",
              left:
                calendarPosition.left,
              top:
                calendarPosition.top,
              width:
                calendarPosition.width,
              maxHeight:
                calendarPosition.maxHeight,
              zIndex: 2147483100,
            }}
            className="
              overflow-y-auto
              overscroll-contain

              rounded-[24px]

              border
              border-slate-200

              bg-white

              p-3

              shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)]

              ring-1
              ring-black/5
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
                px-1
                pb-3
              "
            >
              <button
                type="button"
                onClick={previousMonth}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center

                  rounded-full

                  bg-slate-100

                  text-xl
                  font-black
                  !text-slate-800

                  transition-all

                  hover:bg-slate-200
                  active:scale-90
                "
              >
                ‹
              </button>

              <div className="text-center">
                <div
                  className="
                    text-base
                    font-black
                    !text-slate-900
                  "
                >
                  {
                    thaiMonths[
                      viewDate.getMonth()
                    ]
                  }
                </div>

                <div
                  className="
                    text-xs
                    font-bold
                    !text-slate-500
                  "
                >
                  พ.ศ.{" "}
                  {viewDate.getFullYear() +
                    543}
                </div>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center

                  rounded-full

                  bg-slate-100

                  text-xl
                  font-black
                  !text-slate-800

                  transition-all

                  hover:bg-slate-200
                  active:scale-90
                "
              >
                ›
              </button>
            </div>

            <div
              className="
                grid
                grid-cols-7
                gap-1
              "
            >
              {weekDays.map(
                (day) => (
                  <div
                    key={day}
                    className="
                      flex
                      h-8
                      items-center
                      justify-center

                      text-xs
                      font-extrabold
                      !text-slate-400
                    "
                  >
                    {day}
                  </div>
                )
              )}

              {calendarDays.map(
                (date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-10"
                      />
                    );
                  }

                  const selected =
                    selectedDate
                      ? isSameDate(
                          date,
                          selectedDate
                        )
                      : false;

                  const today =
                    isSameDate(
                      date,
                      new Date()
                    );

                  return (
                    <button
                      key={dateToInputValue(
                        date
                      )}
                      type="button"
                      onClick={() => {
                        onChange(
                          dateToInputValue(
                            date
                          )
                        );

                        setOpen(false);
                      }}
                      className={`
                        flex
                        h-10
                        items-center
                        justify-center

                        rounded-full

                        text-sm
                        font-extrabold

                        transition-all

                        active:scale-90

                        ${
                          selected
                            ? "bg-slate-900 !text-white shadow-md"
                            : today
                            ? "bg-blue-50 !text-blue-700 ring-1 ring-blue-200"
                            : "bg-transparent !text-slate-800 hover:bg-slate-100"
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                }
              )}
            </div>

            <div
              className="
                mt-3

                flex
                items-center
                justify-between
                gap-3

                border-t
                border-slate-200

                pt-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="
                  rounded-full

                  px-4
                  py-2

                  text-sm
                  font-extrabold
                  !text-slate-500

                  transition-colors

                  hover:bg-slate-100
                "
              >
                ล้างวันที่
              </button>

              <button
                type="button"
                onClick={selectToday}
                className="
                  rounded-full

                  bg-slate-900

                  px-4
                  py-2

                  text-sm
                  font-extrabold
                  !text-white

                  shadow-sm

                  transition-all

                  hover:bg-slate-800
                  active:scale-95
                "
              >
                วันนี้
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={containerRef}
        className={`
          relative
          w-full
          min-w-0

          ${
            open
              ? "z-[99999]"
              : "z-10"
          }
        `}
      >
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />

        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            if (!open) {
              const base =
                selectedDate ??
                new Date();

              setViewDate(
                new Date(
                  base.getFullYear(),
                  base.getMonth(),
                  1
                )
              );

              updateCalendarPosition();
            }

            setOpen(
              (current) =>
                !current
            );
          }}
          className={`
            flex
            w-full
            min-w-0
            items-center
            justify-between
            gap-3

            ${
              compact
                ? "h-[46px] rounded-[12px] px-3"
                : "h-[52px] rounded-[16px] px-4"
            }

            border
            border-slate-200

            bg-white

            text-left
            font-bold
            !text-slate-900

            shadow-sm
            outline-none

            transition-all
            duration-200

            hover:border-slate-300
            hover:bg-slate-50

            focus:border-blue-300
            focus:ring-4
            focus:ring-blue-100/70
          `}
        >
          <span
            className={`
              min-w-0
              flex-1
              truncate

              ${
                value
                  ? "!text-slate-900"
                  : "!text-slate-400"
              }

              ${
                compact
                  ? "text-sm"
                  : "text-base"
              }
            `}
          >
            {value
              ? compact
                ? formatThaiShortDate(
                    value
                  )
                : formatThaiDate(
                    value
                  )
              : placeholder}
          </span>

          <span
            className={`
              flex
              shrink-0
              items-center
              justify-center

              ${
                compact
                  ? "h-8 w-8 rounded-[10px] text-base"
                  : "h-9 w-9 rounded-[11px] text-lg"
              }

              ${
                open
                  ? "bg-slate-900 !text-white"
                  : "bg-slate-100"
              }

              shadow-inner

              transition-all
              duration-200
            `}
          >
            📅
          </span>
        </button>
      </div>

      {calendarPopup}
    </>
  );
}

/* =========================================================
   SEARCHABLE DROPDOWN

   ใช้ Portal ไปที่ document.body เพื่อให้เมนู Dropdown
   แสดงอยู่ด้านหน้าสุดเสมอ และไม่ถูกตัดโดย
   overflow ของ AppCard / AppTableCard / ตาราง
========================================================= */

type DropdownPosition = {
  left: number;
  top: number;
  width: number;
  maxListHeight: number;
};

function SearchableDropdown({
  id,
  name,
  value,
  options,
  placeholder,
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  required = false,
  onChange,
}: SearchableDropdownProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const triggerRef =
    useRef<HTMLButtonElement>(null);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    dropdownPosition,
    setDropdownPosition,
  ] = useState<DropdownPosition | null>(
    null
  );

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  const filteredOptions =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLocaleLowerCase("th");

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) =>
          option.label
            .toLocaleLowerCase("th")
            .includes(keyword) ||
          option.value
            .toLocaleLowerCase("th")
            .includes(keyword)
      );
    }, [options, search]);

  /* =======================================================
     POSITION

     คำนวณตำแหน่งจากปุ่มจริง แล้ววาง Dropdown แบบ fixed
     ทำให้ไม่ถูก parent ที่มี overflow ตัด
  ======================================================= */

  function updateDropdownPosition() {
    const trigger =
      triggerRef.current;

    if (
      !trigger ||
      typeof window ===
        "undefined"
    ) {
      return;
    }

    const rect =
      trigger.getBoundingClientRect();

    const edgeGap = 12;
    const dropdownGap = 8;

    const desiredListHeight =
      280;

    const searchAreaHeight =
      72;

    const desiredMenuHeight =
      desiredListHeight +
      searchAreaHeight;

    const availableBelow =
      window.innerHeight -
      rect.bottom -
      dropdownGap -
      edgeGap;

    const availableAbove =
      rect.top -
      dropdownGap -
      edgeGap;

    const shouldOpenAbove =
      availableBelow <
        220 &&
      availableAbove >
        availableBelow;

    const availableHeight =
      Math.max(
        shouldOpenAbove
          ? availableAbove
          : availableBelow,
        150
      );

    const menuHeight =
      Math.min(
        desiredMenuHeight,
        availableHeight
      );

    const maxListHeight =
      Math.max(
        90,
        menuHeight -
          searchAreaHeight
      );

    const width =
      Math.min(
        Math.max(
          rect.width,
          180
        ),
        window.innerWidth -
          edgeGap * 2
      );

    const maxLeft =
      window.innerWidth -
      width -
      edgeGap;

    const left =
      Math.min(
        Math.max(
          rect.left,
          edgeGap
        ),
        Math.max(
          edgeGap,
          maxLeft
        )
      );

    const top =
      shouldOpenAbove
        ? Math.max(
            edgeGap,
            rect.top -
              dropdownGap -
              menuHeight
          )
        : Math.min(
            rect.bottom +
              dropdownGap,
            window.innerHeight -
              edgeGap -
              menuHeight
          );

    setDropdownPosition({
      left,
      top,
      width,
      maxListHeight,
    });
  }

  /* =======================================================
     OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      const clickedInsideTrigger =
        containerRef.current?.contains(
          target
        ) ?? false;

      const clickedInsideMenu =
        menuRef.current?.contains(
          target
        ) ?? false;

      if (
        !clickedInsideTrigger &&
        !clickedInsideMenu
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown
      );
    };
  }, []);

  /* =======================================================
     OPEN / POSITION / SCROLL / RESIZE
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDropdownPosition(
        null
      );
      return;
    }

    updateDropdownPosition();

    const focusTimer =
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

    const handleViewportChange =
      () => {
        updateDropdownPosition();
      };

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    /*
      true = ฟัง scroll จากทุก scroll container
      รวมถึงตารางที่เลื่อนแนวนอน
    */
    window.addEventListener(
      "scroll",
      handleViewportChange,
      true
    );

    return () => {
      window.clearTimeout(
        focusTimer
      );

      window.removeEventListener(
        "resize",
        handleViewportChange
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
    };
  }, [open]);

  /* =======================================================
     MENU
  ======================================================= */

  const dropdownMenu =
    open &&
    !disabled &&
    dropdownPosition &&
    typeof document !==
      "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="presentation"
            style={{
              position: "fixed",
              left:
                dropdownPosition.left,
              top:
                dropdownPosition.top,
              width:
                dropdownPosition.width,
              zIndex: 2147483000,
            }}
            className="
              overflow-hidden

              rounded-[20px]

              border
              border-slate-200

              bg-white/95

              shadow-[0_28px_70px_-22px_rgba(15,23,42,0.55)]

              backdrop-blur-2xl
            "
          >
            <div
              className="
                border-b
                border-slate-200
                bg-slate-50/90
                p-3
              "
            >
              <input
                ref={inputRef}
                type="text"
                value={search}
                autoComplete="off"
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Escape"
                  ) {
                    setOpen(
                      false
                    );
                    setSearch("");
                  }

                  if (
                    event.key ===
                      "Enter" &&
                    filteredOptions.length ===
                      1
                  ) {
                    event.preventDefault();

                    onChange(
                      filteredOptions[0]
                        .value
                    );

                    setOpen(
                      false
                    );
                    setSearch("");
                  }
                }}
                placeholder={
                  searchPlaceholder
                }
                className="
                  h-[46px]
                  w-full

                  rounded-[14px]

                  border
                  border-slate-200

                  bg-white

                  px-4

                  text-base
                  font-bold
                  !text-slate-900

                  shadow-sm
                  outline-none

                  placeholder:!text-slate-400

                  focus:ring-4
                  focus:ring-slate-900/10
                "
              />
            </div>

            <div
              role="listbox"
              style={{
                maxHeight:
                  dropdownPosition.maxListHeight,
              }}
              className="
                overflow-y-auto
                overscroll-contain

                bg-white

                p-2
              "
            >
              {filteredOptions.length >
              0 ? (
                filteredOptions.map(
                  (option) => {
                    const selected =
                      option.value ===
                      value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        role="option"
                        aria-selected={
                          selected
                        }
                        onClick={() => {
                          onChange(
                            option.value
                          );

                          setOpen(
                            false
                          );
                          setSearch("");
                        }}
                        className={`
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3

                          rounded-[12px]

                          px-3
                          py-2.5

                          text-left
                          text-base
                          font-bold

                          transition-colors

                          ${
                            selected
                              ? "bg-slate-900 !text-white"
                              : "bg-white !text-slate-900 hover:bg-slate-100"
                          }
                        `}
                      >
                        <span
                          className="
                            min-w-0
                            flex-1
                            break-words
                          "
                        >
                          {option.label}
                        </span>

                        {selected && (
                          <span className="!text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )
              ) : (
                <div
                  className="
                    px-4
                    py-8

                    text-center
                    text-sm
                    font-bold
                    !text-slate-500
                  "
                >
                  {emptyText}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={containerRef}
        className={`
          relative
          w-full
          min-w-0

          ${
            open
              ? "z-[1000]"
              : "z-10"
          }
        `}
      >
        {name && (
          <input
            type="hidden"
            name={name}
            value={value}
            required={required}
          />
        )}

        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) {
              return;
            }

            if (!open) {
              updateDropdownPosition();
            }

            setOpen(
              (current) =>
                !current
            );
          }}
          className="
            flex
            h-[52px]
            w-full
            min-w-0
            items-center
            justify-between
            gap-3

            rounded-[16px]

            border
            border-slate-200

            bg-white

            px-4

            text-left
            text-base
            font-bold
            !text-slate-900

            shadow-sm
            outline-none

            transition-all

            hover:bg-slate-50

            focus:ring-4
            focus:ring-slate-900/10

            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:!text-slate-400
          "
        >
          <span
            className={`
              min-w-0
              flex-1
              truncate

              ${
                selectedOption
                  ? "!text-slate-900"
                  : "!text-slate-400"
              }
            `}
          >
            {selectedOption?.label ??
              placeholder}
          </span>

          <span
            className={`
              shrink-0
              text-xs
              !text-slate-700
              transition-transform

              ${
                open
                  ? "rotate-180"
                  : ""
              }
            `}
          >
            ▼
          </span>
        </button>
      </div>

      {dropdownMenu}
    </>
  );
}

/* =========================================================
   RECEIVE FORM
========================================================= */

export default function ReceiveForm({
  vendors,
  materials,
  documentNo,
}: Props) {
  const emptyRow =
    (): ReceiveRow => ({
      category: "",
      materialId: "",
      qty: "",
      unitPrice: "",
      manufacture: "",
      expiry: "",
    });

  const [items, setItems] =
    useState<ReceiveRow[]>(
      Array.from(
        {
          length: 15,
        },
        emptyRow
      )
    );

  const [
    isOpeningBalance,
    setIsOpeningBalance,
  ] = useState(false);

  const [
    documentValue,
    setDocumentValue,
  ] = useState(documentNo);

  const [
    receiveDate,
    setReceiveDate,
  ] = useState(
    getTodayInputValue()
  );

  const [
    vendorId,
    setVendorId,
  ] = useState("");

  function updateRow(
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) {
    setItems(
      (currentItems) => {
        const copy =
          currentItems.map(
            (item) => ({
              ...item,
            })
          );

        copy[index] = {
          ...copy[index],
          [key]: value,
        };

        if (
          key === "category"
        ) {
          copy[index].materialId =
            "";
        }

        return copy;
      }
    );
  }

  const vendorOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        vendors.map(
          (vendor) => ({
            value:
              vendor.id.toString(),
            label: vendor.name,
          })
        ),
      [vendors]
    );

  const categoryOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        categories.map(
          (category) => ({
            value:
              category.value,
            label:
              category.label,
          })
        ),
      []
    );

  const labelClass = `
    mb-2
    block
    text-base
    font-extrabold
    !text-slate-800
  `;

  const controlClass = `
    h-[52px]
    w-full
    min-w-0

    rounded-[16px]

    border
    border-slate-200

    bg-white

    px-4

    text-base
    font-bold
    !text-slate-900

    shadow-sm
    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-300
    hover:bg-slate-50

    focus:border-blue-300
    focus:ring-4
    focus:ring-blue-100/70
  `;

  return (
    <form
      action={createReceive}
      className="
        relative
        w-full
        min-w-0

        space-y-6

        overflow-visible
      "
    >
      {/* =====================================================
          DOCUMENT INFORMATION
      ===================================================== */}

      <AppCard
        className="
          relative
          z-[5000]

          overflow-visible

          p-4

          sm:p-5
        "
      >
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center

              rounded-[15px]

              bg-blue-50/90

              text-xl

              shadow-sm

              ring-1
              ring-blue-100/80
            "
          >
            🧾
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900

                sm:text-xl
              "
            >
              ข้อมูลการรับเข้า
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุวันที่ เอกสาร และผู้จำหน่าย
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-4

            md:grid-cols-2
          "
        >
          {/* วันที่รับเข้า */}

          <AppInfoCard
            className="
              relative
              z-[7000]
              overflow-visible
            "
          >
            <label
              htmlFor="receiveDate"
              className={labelClass}
            >
              วันที่รับเข้า
            </label>

            <IOSDatePicker
              id="receiveDate"
              name="receiveDate"
              value={receiveDate}
              required
              align="left"
              onChange={
                setReceiveDate
              }
            />
          </AppInfoCard>

          {/* เลขที่เอกสาร */}

          <AppInfoCard
            className="
              relative
              z-20
              overflow-visible
            "
          >
            <label
              htmlFor="documentNo"
              className={labelClass}
            >
              เลขที่เอกสาร
            </label>

            <input
              id="documentNo"
              type="text"
              name="documentNo"
              value={documentValue}
              readOnly={
                !isOpeningBalance
              }
              onChange={(event) =>
                setDocumentValue(
                  event.target.value
                )
              }
              className={
                controlClass
              }
            />

            {/* ยอดยกเข้าระบบ */}

            <label
              className="
                mt-4

                flex
                w-fit
                max-w-full

                cursor-pointer
                select-none

                items-center

                text-sm
                font-extrabold
                !text-slate-700
              "
            >
              <input
                type="checkbox"
                checked={
                  isOpeningBalance
                }
                onChange={(event) => {
                  const checked =
                    event.target.checked;

                  setIsOpeningBalance(
                    checked
                  );

                  setDocumentValue(
                    checked
                      ? "ยอดยกเข้าระบบ"
                      : documentNo
                  );
                }}
                className="
                  sr-only
                "
              />

              <span
                aria-hidden="true"
                className={`
                  flex
                  h-[22px]
                  w-[22px]
                  min-h-[22px]
                  min-w-[22px]
                  shrink-0

                  items-center
                  justify-center

                  rounded-[6px]

                  border-2

                  text-[13px]
                  font-black
                  leading-none

                  shadow-sm

                  transition-all
                  duration-200

                  ${
                    isOpeningBalance
                      ? "border-emerald-600 bg-emerald-600 !text-white shadow-emerald-200"
                      : "border-slate-300 bg-white !text-transparent hover:border-emerald-400"
                  }
                `}
              >
                ✓
              </span>

              <span
                className="
                  ml-3
                  block
                  whitespace-nowrap
                  leading-[22px]
                "
              >
                ยอดยกเข้าระบบ
              </span>
            </label>
          </AppInfoCard>

          {/* ผู้จำหน่าย */}

          <AppInfoCard
            className="
              relative
              z-[4000]

              overflow-visible

              md:col-span-2
            "
          >
            <label
              htmlFor="vendorId"
              className={labelClass}
            >
              ผู้จำหน่าย
            </label>

            <SearchableDropdown
              id="vendorId"
              name="vendorId"
              value={vendorId}
              options={
                vendorOptions
              }
              placeholder="-- เลือกผู้จำหน่าย --"
              searchPlaceholder="พิมพ์ค้นหาผู้จำหน่าย..."
              emptyText="ไม่พบผู้จำหน่าย"
              required
              onChange={
                setVendorId
              }
            />
          </AppInfoCard>
        </div>
      </AppCard>

      {/* =====================================================
          MATERIAL TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุรับเข้า"
        subtitle={`ระบุรายการ ราคา จำนวน และข้อมูลวันผลิต/หมดอายุ • ทั้งหมด ${items.length} รายการ`}
        className="
          relative
          z-10

          overflow-visible
        "
      >
        <div
          className="
            relative
            w-full

            overflow-x-auto
            overflow-y-visible
          "
        >
          <table
            className="
              relative
              w-full
              min-w-[1200px]

              border-collapse

              bg-white

              text-sm
            "
          >
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "หน่วย",
                  "ราคา",
                  "จำนวน",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap

                      border
                      border-black

                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700

                      px-3
                      py-4

                      text-center
                      text-lg
                      font-extrabold
                      !text-white
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map(
                (row, index) => {
                  const list =
                    materials.filter(
                      (material) =>
                        material.category ===
                        row.category
                    );

                  const selected =
                    materials.find(
                      (material) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  const materialOptions:
                    SearchableOption[] =
                    list.map(
                      (material) => ({
                        value:
                          String(
                            material.id
                          ),

                        label: `${material.code} - ${material.name}`,
                      })
                    );

                  const rowZIndex =
                    items.length -
                    index +
                    100;

                  return (
                    <tr
                      key={index}
                      style={{
                        position:
                          "relative",
                        zIndex:
                          rowZIndex,
                      }}
                      className={`
                        ${
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/50"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-3
                          py-3

                          text-center
                          font-extrabold
                          !text-slate-800
                        "
                      >
                        {index + 1}
                      </td>

                      {/* หมวดหมู่ */}

                      <td
                        className="
                          relative
                          min-w-[210px]

                          overflow-visible

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <SearchableDropdown
                          id={`category-${index}`}
                          name={`items[${index}].category`}
                          value={
                            row.category
                          }
                          options={
                            categoryOptions
                          }
                          placeholder="เลือกหมวดหมู่"
                          searchPlaceholder="พิมพ์ค้นหาหมวดหมู่..."
                          emptyText="ไม่พบหมวดหมู่"
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              index,
                              "category",
                              value
                            )
                          }
                        />
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          relative
                          min-w-[320px]

                          overflow-visible

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <SearchableDropdown
                          id={`material-${index}`}
                          name={`items[${index}].materialId`}
                          value={
                            row.materialId
                          }
                          options={
                            materialOptions
                          }
                          placeholder="เลือกรายการพัสดุ"
                          searchPlaceholder="พิมพ์ค้นหารายการพัสดุ..."
                          emptyText="ไม่พบรายการพัสดุ"
                          disabled={
                            !row.category
                          }
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              index,
                              "materialId",
                              value
                            )
                          }
                        />
                      </td>

                      {/* หน่วย */}

                      <td
                        className="
                          min-w-[120px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="text"
                          readOnly
                          value={
                            selected?.unit ??
                            "-"
                          }
                          className="
                            h-[46px]
                            w-full

                            rounded-[12px]

                            border
                            border-slate-200

                            bg-slate-100

                            px-2

                            text-center
                            font-extrabold
                            !text-slate-700

                            outline-none
                          "
                        />
                      </td>

                      {/* ราคา */}

                      <td
                        className="
                          min-w-[150px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="hidden"
                          name={`items[${index}].unitPrice`}
                          value={
                            row.unitPrice
                          }
                        />

                        <input
                          type="text"
                          inputMode="decimal"
                          value={formatNumberWithCommas(
                            row.unitPrice
                          )}
                          placeholder="0.00"
                          onChange={(event) => {
                            const value =
                              sanitizeDecimalInput(
                                event.target
                                  .value
                              );

                            updateRow(
                              index,
                              "unitPrice",
                              value
                            );
                          }}
                          className="
                            h-[46px]
                            w-full

                            rounded-[12px]

                            border
                            border-slate-200

                            bg-white

                            px-3

                            text-right
                            font-bold
                            tabular-nums
                            !text-slate-900

                            outline-none

                            transition-all

                            focus:border-blue-300
                            focus:ring-4
                            focus:ring-blue-100/70
                          "
                        />
                      </td>

                      {/* จำนวน */}

                      <td
                        className="
                          min-w-[120px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          name={`items[${index}].qty`}
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(event) =>
                            updateRow(
                              index,
                              "qty",
                              event.target
                                .value
                            )
                          }
                          className="
                            h-[46px]
                            w-full

                            rounded-[12px]

                            border
                            border-slate-200

                            bg-white

                            px-2

                            text-center
                            font-bold
                            tabular-nums
                            !text-slate-900

                            outline-none

                            transition-all

                            focus:border-blue-300
                            focus:ring-4
                            focus:ring-blue-100/70
                          "
                        />
                      </td>

                      {/* วันผลิต */}

                      <td
                        className="
                          relative
                          min-w-[200px]

                          overflow-visible

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <div
                          className="
                            relative
                            w-[190px]
                            overflow-visible
                          "
                        >
                          <IOSDatePicker
                            id={`manufacture-${index}`}
                            name={`items[${index}].manufacture`}
                            value={
                              row.manufacture
                            }
                            compact
                            align="right"
                            placeholder="เลือกวันที่"
                            onChange={(
                              value
                            ) =>
                              updateRow(
                                index,
                                "manufacture",
                                value
                              )
                            }
                          />
                        </div>
                      </td>

                      {/* วันหมดอายุ */}

                      <td
                        className="
                          relative
                          min-w-[200px]

                          overflow-visible

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <div
                          className="
                            relative
                            w-[190px]
                            overflow-visible
                          "
                        >
                          <IOSDatePicker
                            id={`expiry-${index}`}
                            name={`items[${index}].expiry`}
                            value={
                              row.expiry
                            }
                            compact
                            align="right"
                            placeholder="เลือกวันที่"
                            onChange={(
                              value
                            ) =>
                              updateRow(
                                index,
                                "expiry",
                                value
                              )
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>

      {/* =====================================================
          REMARK
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0

          overflow-visible

          p-4

          sm:p-5
        "
      >
        <AppInfoCard>
          <label
            htmlFor="remark"
            className={labelClass}
          >
            หมายเหตุ
          </label>

          <textarea
            id="remark"
            name="remark"
            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
            className="
              min-h-[120px]
              w-full

              resize-y

              rounded-[16px]

              border
              border-slate-200

              bg-white

              p-4

              text-base
              font-bold
              !text-slate-900

              shadow-sm
              outline-none

              transition-all
              duration-200

              placeholder:!text-slate-400

              hover:bg-slate-50

              focus:border-blue-300
              focus:ring-4
              focus:ring-blue-100/70
            "
          />
        </AppInfoCard>
      </AppCard>

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div
        className="
          flex
          justify-end
          pt-1
        "
      >
        <AppButton
          type="submit"
          variant="success"
          size="md"
          icon={<span>💾</span>}
        >
          บันทึก
        </AppButton>
      </div>
    </form>
  );
}