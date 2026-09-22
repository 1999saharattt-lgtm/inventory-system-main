"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createReceive } from "./actions";

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
    dateString
      .split("-")
      .map(Number);

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
    dateString
      .split("-")
      .map(Number);

  if (!year || !month || !day) {
    return "";
  }

  return `${String(day).padStart(
    2,
    "0"
  )} ${
    thaiShortMonths[month - 1]
  } ${String(year + 543).slice(
    -2
  )}`;
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
    value
      .split("-")
      .map(Number);

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
   IOS DATE PICKER
========================================================= */

function IOSDatePicker({
  id,
  name,
  value,
  placeholder = "เลือกวันที่",
  required = false,
  compact = false,
  onChange,
}: IOSDatePickerProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const selectedDate =
    inputValueToDate(value);

  const [open, setOpen] =
    useState(false);

  const [viewDate, setViewDate] =
    useState<Date>(
      selectedDate ??
        new Date()
    );

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

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
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
        day <=
        lastDay.getDate();
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
    const today =
      new Date();

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

  return (
    <div
      ref={containerRef}
      className={`
        relative
        w-full
        min-w-0

        ${
          open
            ? "z-[500]"
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

      {/* =====================================================
          DATE BUTTON
      ===================================================== */}

      <button
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
          !border-black

          bg-white

          text-left
          font-bold
          !text-slate-900

          shadow-sm

          outline-none

          transition-all
          duration-200

          hover:bg-slate-50

          focus:!border-black
          focus:ring-4
          focus:ring-slate-900/10
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

            bg-slate-100

            shadow-inner

            transition-all
            duration-200

            ${
              open
                ? "bg-slate-900 !text-white"
                : ""
            }
          `}
        >
          📅
        </span>
      </button>

      {/* =====================================================
          IOS CALENDAR POPOVER
      ===================================================== */}

      {open && (
        <div
          role="dialog"
          aria-label="เลือกวันที่"
          className={`
            absolute

            left-0
            top-[calc(100%+10px)]

            z-[9999]

            ${
              compact
                ? "w-[320px]"
                : "w-[360px]"
            }

            max-w-[calc(100vw-32px)]

            overflow-hidden

            rounded-[24px]

            border
            border-slate-200/90

            bg-white/95

            p-3

            shadow-[0_28px_80px_-24px_rgba(15,23,42,0.55)]

            ring-1
            ring-black/5

            backdrop-blur-2xl
          `}
        >
          {/* ===============================================
              CALENDAR TOP
          =============================================== */}

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
              onClick={
                previousMonth
              }
              className="
                flex
                h-10
                w-10
                shrink-0
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

            <div
              className="
                min-w-0
                text-center
              "
            >
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
                shrink-0
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

          {/* ===============================================
              WEEK
          =============================================== */}

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
                      relative
                      flex
                      h-10
                      items-center
                      justify-center

                      rounded-full

                      text-sm
                      font-extrabold

                      transition-all
                      duration-150

                      active:scale-90

                      ${
                        selected
                          ? `
                            bg-slate-900
                            !text-white
                            shadow-md
                          `
                          : today
                          ? `
                            bg-blue-50
                            !text-blue-700
                            ring-1
                            ring-blue-200
                          `
                          : `
                            bg-transparent
                            !text-slate-800
                            hover:bg-slate-100
                          `
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              }
            )}
          </div>

          {/* ===============================================
              CALENDAR FOOTER
          =============================================== */}

          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              gap-2

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
              onClick={
                selectToday
              }
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
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SEARCHABLE DROPDOWN
========================================================= */

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

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  const filteredOptions =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLocaleLowerCase("th");

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) =>
          option.label
            .toLocaleLowerCase(
              "th"
            )
            .includes(keyword) ||
          option.value
            .toLocaleLowerCase(
              "th"
            )
            .includes(keyword)
      );
    }, [options, search]);

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
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

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const timer =
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`
        relative
        w-full
        min-w-0

        ${
          open
            ? "z-[400]"
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
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) {
            return;
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
          !border-black

          bg-white

          px-4

          text-left
          text-base
          font-bold
          !text-slate-900

          shadow-sm
          outline-none

          transition-all
          duration-200

          hover:bg-slate-50

          focus:!border-black
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

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]

            z-[9999]

            overflow-hidden

            rounded-[20px]

            border
            !border-black

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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Escape"
                ) {
                  setOpen(false);
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

                  setOpen(false);
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
                !border-black

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
            className="
              max-h-[280px]
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

                        setOpen(false);
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
                            ? `
                              bg-slate-900
                              !text-white
                            `
                            : `
                              bg-white
                              !text-slate-900
                              hover:bg-slate-100
                            `
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
        </div>
      )}
    </div>
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
    const copy = [...items];

    copy[index] = {
      ...copy[index],
      [key]: value,
    };

    if (key === "category") {
      copy[index].materialId =
        "";
    }

    setItems(copy);
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
    >(() => categories, []);

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
    !border-black

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

    hover:bg-slate-50

    focus:!border-black
    focus:ring-4
    focus:ring-slate-900/10
  `;

  return (
    <form
      action={createReceive}
      className="
        w-full
        min-w-0
        space-y-6
      "
    >
      {/* =====================================================
          DOCUMENT INFORMATION
      ===================================================== */}

      <section
        className="
          relative
          z-[200]

          overflow-visible

          rounded-[24px]

          border
          border-slate-300

          bg-white/75

          p-4

          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]

          backdrop-blur-xl

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

              bg-blue-50

              text-xl

              shadow-sm
              ring-1
              ring-blue-100
            "
          >
            🧾
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
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
              ระบุวันที่ เอกสาร
              และผู้จำหน่าย
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-5

            md:grid-cols-2
          "
        >
          {/* วันที่รับเข้า */}

          <div className="min-w-0">
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
              onChange={
                setReceiveDate
              }
            />
          </div>

          {/* เลขที่เอกสาร */}

          <div className="min-w-0">
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
                mt-2.5

                inline-flex
                w-fit
                max-w-full

                cursor-pointer
                items-center
                gap-2

                whitespace-nowrap

                text-sm
                font-extrabold
                !text-slate-700
              "
            >
              <span
                className="
                  relative

                  flex
                  h-[20px]
                  w-[20px]
                  shrink-0
                  items-center
                  justify-center
                "
              >
                <input
                  type="checkbox"
                  checked={
                    isOpeningBalance
                  }
                  onChange={(
                    event
                  ) => {
                    const checked =
                      event.target
                        .checked;

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
                    peer

                    absolute
                    inset-0

                    h-5
                    w-5

                    cursor-pointer

                    appearance-none

                    rounded-[6px]

                    border
                    border-slate-400

                    bg-white

                    shadow-sm

                    transition-all

                    checked:border-slate-900
                    checked:bg-slate-900

                    focus:outline-none
                    focus:ring-4
                    focus:ring-slate-900/10
                  "
                />

                <span
                  className="
                    pointer-events-none

                    relative
                    z-10

                    hidden

                    text-[12px]
                    font-black
                    leading-none
                    !text-white

                    peer-checked:block
                  "
                >
                  ✓
                </span>
              </span>

              <span className="whitespace-nowrap">
                ยอดยกเข้าระบบ
              </span>
            </label>
          </div>

          {/* ผู้จำหน่าย */}

          <div
            className="
              relative
              z-[300]
              min-w-0

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
          </div>
        </div>
      </section>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <section
        className="
          relative
          z-0

          overflow-hidden

          rounded-[24px]

          border
          border-slate-300

          bg-white/80

          shadow-[0_16px_40px_-26px_rgba(15,23,42,0.35)]

          backdrop-blur-xl
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2

            bg-white/80

            px-4
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-5
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-black
                !text-slate-900

                sm:text-xl
              "
            >
              รายการพัสดุรับเข้า
            </h2>

            <p
              className="
                mt-1

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุรายการ ราคา จำนวน
              และข้อมูลวันผลิต/หมดอายุ
            </p>
          </div>

          <span
            className="
              inline-flex
              w-fit
              items-center

              rounded-full

              border
              border-slate-300

              bg-slate-50

              px-3
              py-1.5

              text-xs
              font-extrabold
              !text-slate-500
            "
          >
            15 รายการ
          </span>
        </div>

        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
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
                        value: String(
                          material.id
                        ),
                        label: `${material.code} - ${material.name}`,
                      })
                    );

                  return (
                    <tr
                      key={index}
                      className="
                        transition-colors
                        duration-200

                        hover:bg-blue-50/60
                      "
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
                          border
                          border-black

                          px-3
                          py-3
                        "
                      >
                        <div className="min-w-[190px]">
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
                        </div>
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3
                        "
                      >
                        <div className="min-w-[290px]">
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
                        </div>
                      </td>

                      {/* หน่วย */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          text-center
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
                            min-w-[90px]

                            rounded-[12px]

                            border
                            !border-black

                            bg-slate-100

                            px-2

                            text-center
                            font-extrabold
                            !text-slate-700

                            shadow-sm
                            outline-none
                          "
                        />
                      </td>

                      {/* ราคา */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          text-center
                        "
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`items[${index}].unitPrice`}
                          value={
                            row.unitPrice
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "unitPrice",
                              event.target
                                .value
                            )
                          }
                          className="
                            h-[46px]
                            w-28

                            rounded-[12px]

                            border
                            !border-black

                            bg-white

                            px-2

                            text-center
                            font-bold
                            !text-slate-800

                            shadow-sm
                            outline-none

                            focus:ring-4
                            focus:ring-slate-900/10
                          "
                        />
                      </td>

                      {/* จำนวน */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3
                        "
                      >
                        <input
                          name={`items[${index}].qty`}
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "qty",
                              event.target
                                .value
                            )
                          }
                          className="
                            h-[46px]
                            w-24

                            rounded-[12px]

                            border
                            !border-black

                            bg-white

                            px-2

                            text-center
                            font-bold
                            !text-slate-800

                            shadow-sm
                            outline-none

                            focus:ring-4
                            focus:ring-slate-900/10
                          "
                        />
                      </td>

                      {/* วันผลิต */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3
                        "
                      >
                        <div className="w-[190px]">
                          <IOSDatePicker
                            id={`manufacture-${index}`}
                            name={`items[${index}].manufacture`}
                            value={
                              row.manufacture
                            }
                            compact
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
                          border
                          border-black

                          px-3
                          py-3
                        "
                      >
                        <div className="w-[190px]">
                          <IOSDatePicker
                            id={`expiry-${index}`}
                            name={`items[${index}].expiry`}
                            value={
                              row.expiry
                            }
                            compact
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
      </section>

      {/* =====================================================
          REMARK
      ===================================================== */}

      <section
        className="
          rounded-[24px]

          border
          border-slate-300

          bg-white/75

          p-4

          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]

          backdrop-blur-xl

          sm:p-5
        "
      >
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
            !border-black

            bg-white

            p-4

            font-bold
            !text-slate-800

            shadow-sm
            outline-none

            transition-all
            duration-200

            placeholder:!text-slate-400

            focus:ring-4
            focus:ring-slate-900/10
          "
        />
      </section>

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div
        className="
          flex
          justify-end

          border-t
          border-slate-300

          pt-5
        "
      >
        <button
          type="submit"
          className="
            inline-flex
            h-11
            w-full
            items-center
            justify-center
            gap-2

            rounded-[16px]

            border
            border-slate-900

            bg-slate-900

            px-6

            text-sm
            font-extrabold
            !text-white

            shadow-[0_12px_28px_-16px_rgba(15,23,42,0.55)]

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:bg-slate-800

            active:translate-y-0
            active:scale-[0.97]

            focus:outline-none
            focus:ring-4
            focus:ring-slate-400/20

            sm:w-auto
            sm:min-w-[150px]
          "
        >
          <span>💾</span>
          <span>บันทึก</span>
        </button>
      </div>
    </form>
  );
}