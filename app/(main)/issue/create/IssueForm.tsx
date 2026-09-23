"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";
import AppButton from "@/components/AppButton";

import { createIssue } from "./action";

/* =========================================================
   TYPES
========================================================= */

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  latestPrice: number;
};

type ReceiveLot = {
  id: number;
  materialId: number;
  balance: number;
  manufacture: Date | string | null;
  expiry: Date | string | null;
};

type Department = {
  id: number;
  name: string;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number | null;

  department?: {
    id: number;
  } | null;

  section?: {
    departmentId: number | null;
  } | null;
};

type Props = {
  materials: Material[];
  receiveLots: ReceiveLot[];
  departments: Department[];
  officers: Officer[];
  documentNo: string;
  initialDepartmentId?: string;

  /*
   * true  = ADMIN สามารถเปลี่ยนกลุ่มงานได้
   * false = ผู้ใช้งานทั่วไป ล็อกกลุ่มงาน
   */
  canChangeDepartment: boolean;
};

type ItemRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
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
  align?: "left" | "right";
  onChange: (value: string) => void;
};

/* =========================================================
   CATEGORIES
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

function getCurrentDate() {
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
   IOS DATE PICKER
========================================================= */

function IOSDatePicker({
  id,
  name,
  value,
  placeholder = "เลือกวันที่",
  required = false,
  align = "left",
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
      selectedDate ?? new Date()
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

  return (
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
            (current) => !current
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
          duration-200

          hover:border-slate-300
          hover:bg-slate-50

          focus:border-blue-300
          focus:ring-4
          focus:ring-blue-100/70
        "
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
          `}
        >
          {value
            ? formatThaiDate(value)
            : placeholder}
        </span>

        <span
          aria-hidden="true"
          className={`
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center

            rounded-[11px]

            text-lg

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

      {open && (
        <div
          role="dialog"
          aria-label="เลือกวันที่"
          className={`
            absolute
            top-[calc(100%+10px)]

            ${
              align === "right"
                ? "right-0"
                : "left-0"
            }

            z-[999999]

            w-[360px]
            max-w-[calc(100vw-32px)]

            overflow-hidden

            rounded-[24px]

            border
            border-slate-200

            bg-white

            p-3

            shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)]

            ring-1
            ring-black/5
          `}
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
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) {
            setOpen(
              (current) => !current
            );
          }
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

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]

            z-[99999]

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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
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
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ISSUE FORM
========================================================= */

export default function IssueForm({
  materials,
  receiveLots,
  departments,
  officers,
  documentNo,
  initialDepartmentId,
  canChangeDepartment,
}: Props) {
  /* =======================================================
     DEFAULT DEPARTMENT
  ======================================================= */

  const defaultDepartmentId =
    initialDepartmentId ||
    (departments.length === 1
      ? String(
          departments[0].id
        )
      : "");

  const [
    departmentId,
    setDepartmentId,
  ] = useState(
    defaultDepartmentId
  );

  /* =======================================================
     OFFICER
  ======================================================= */

  const [
    officerId,
    setOfficerId,
  ] = useState("");

  /* =======================================================
     DOCUMENT NUMBER
  ======================================================= */

  const [
    editDocumentNo,
    setEditDocumentNo,
  ] = useState(false);

  const [
    documentValue,
    setDocumentValue,
  ] = useState(documentNo);

  /* =======================================================
     ISSUE DATE
  ======================================================= */

  const [
    issueDate,
    setIssueDate,
  ] = useState(
    getCurrentDate()
  );

  /* =======================================================
     ROWS
  ======================================================= */

  const emptyRow =
    (): ItemRow => ({
      category: "",
      materialId: "",
      qty: "",
      remark: "",
    });

  const [rows, setRows] =
    useState<ItemRow[]>(
      Array.from(
        {
          length: 18,
        },
        emptyRow
      )
    );

  /* =======================================================
     FILTER OFFICERS
  ======================================================= */

  const filteredOfficers =
    useMemo(
      () =>
        officers.filter(
          (officer) =>
            String(
              officer.departmentId
            ) === departmentId ||
            String(
              officer.section
                ?.departmentId
            ) === departmentId
        ),
      [
        officers,
        departmentId,
      ]
    );

  /* =======================================================
     OPTIONS
  ======================================================= */

  const departmentOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        departments.map(
          (department) => ({
            value: String(
              department.id
            ),
            label:
              department.name,
          })
        ),
      [departments]
    );

  const officerOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        filteredOfficers.map(
          (officer) => ({
            value: String(
              officer.id
            ),
            label: `${officer.firstName} ${officer.lastName}`,
          })
        ),
      [filteredOfficers]
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

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  function updateRow(
    index: number,
    key: keyof ItemRow,
    value: string
  ) {
    setRows(
      (currentRows) => {
        const copy =
          currentRows.map(
            (row) => ({
              ...row,
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

          copy[index].qty =
            "";
        }

        if (
          key === "materialId"
        ) {
          copy[index].qty =
            "";
        }

        return copy;
      }
    );
  }

  /* =======================================================
     STYLE
  ======================================================= */

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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      action={createIssue}
      className="
        relative
        w-full
        min-w-0

        space-y-6

        overflow-visible
      "
    >
      {/* =====================================================
          TOP DOCUMENT NUMBER
      ===================================================== */}

      <div
        className="
          flex
          w-full
          justify-end
        "
      >
        <div
          className="
            w-full
            max-w-[220px]
          "
        >
          <label
            htmlFor="documentNo"
            className="
              mb-1.5
              block
              text-xs
              font-extrabold
              !text-slate-600
            "
          >
            เลขที่เอกสาร
          </label>

          <input
            id="documentNo"
            type="text"
            name="documentNo"
            value={
              documentValue
            }
            readOnly={
              !editDocumentNo
            }
            onChange={(event) =>
              setDocumentValue(
                event.target.value
              )
            }
            className="
              h-9
              w-full

              rounded-[11px]

              border
              border-slate-200

              bg-white

              px-3

              text-sm
              font-extrabold
              !text-slate-900

              shadow-sm
              outline-none

              transition-all

              focus:border-blue-300
              focus:ring-4
              focus:ring-blue-100/70

              read-only:bg-slate-50
            "
          />

          {/* =================================================
              EDIT DOCUMENT CHECKBOX
          ================================================= */}

          <label
            className="
              mt-2

              flex
              w-fit
              max-w-full

              cursor-pointer
              select-none

              items-center

              text-xs
              font-extrabold
              !text-slate-600
            "
          >
            <input
              type="checkbox"
              checked={
                editDocumentNo
              }
              onChange={(event) => {
                const checked =
                  event.target.checked;

                setEditDocumentNo(
                  checked
                );

                if (!checked) {
                  setDocumentValue(
                    documentNo
                  );
                }
              }}
              className="sr-only"
            />

            <span
              aria-hidden="true"
              className={`
                flex
                h-[20px]
                w-[20px]
                min-h-[20px]
                min-w-[20px]
                shrink-0

                items-center
                justify-center

                rounded-[6px]

                border-2

                text-[12px]
                font-black
                leading-none

                shadow-sm

                transition-all
                duration-200

                ${
                  editDocumentNo
                    ? "border-emerald-600 bg-emerald-600 !text-white shadow-emerald-200"
                    : "border-slate-300 bg-white !text-transparent hover:border-emerald-400"
                }
              `}
            >
              ✓
            </span>

            <span
              className="
                ml-2
                block
                whitespace-nowrap
                leading-[20px]
              "
            >
              แก้ไขเลขที่เอกสาร
            </span>
          </label>
        </div>
      </div>

      {/* =====================================================
          FORM TITLE
      ===================================================== */}

      <div
        className="
          border-b
          border-slate-200
          pb-5
          text-center
        "
      >
        <div
          className="
            text-2xl
            font-black
            tracking-tight
            !text-slate-900
          "
        >
          พอ.101
        </div>

        <h2
          className="
            mt-1
            text-2xl
            font-black
            tracking-tight
            !text-slate-900
          "
        >
          ใบเบิกพัสดุ
        </h2>
      </div>

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
              ข้อมูลการเบิก
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุวันที่ กลุ่มงาน และผู้ขอเบิก
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-4

            md:grid-cols-3
          "
        >
          {/* =================================================
              ISSUE DATE
          ================================================= */}

          <AppInfoCard
            className="
              relative
              z-[7000]
              overflow-visible
            "
          >
            <label
              htmlFor="issueDate"
              className={labelClass}
            >
              วันที่เบิก
            </label>

            <IOSDatePicker
              id="issueDate"
              name="issueDate"
              value={issueDate}
              required
              align="left"
              onChange={
                setIssueDate
              }
            />
          </AppInfoCard>

          {/* =================================================
              DEPARTMENT
          ================================================= */}

          <AppInfoCard
            className="
              relative
              z-[6000]
              overflow-visible
            "
          >
            <label
              htmlFor="departmentId"
              className={labelClass}
            >
              หน่วยงาน / กลุ่มงาน
            </label>

            {!canChangeDepartment && (
              <input
                type="hidden"
                name="departmentId"
                value={
                  departmentId
                }
              />
            )}

            <SearchableDropdown
              id="departmentId"
              name={
                canChangeDepartment
                  ? "departmentId"
                  : undefined
              }
              value={
                departmentId
              }
              options={
                departmentOptions
              }
              placeholder="-- เลือกหน่วยงาน --"
              searchPlaceholder="พิมพ์ค้นหาหน่วยงาน / กลุ่มงาน..."
              emptyText="ไม่พบหน่วยงาน"
              disabled={
                !canChangeDepartment
              }
              required={
                canChangeDepartment
              }
              onChange={(
                value
              ) => {
                if (
                  !canChangeDepartment
                ) {
                  return;
                }

                setDepartmentId(
                  value
                );

                setOfficerId("");
              }}
            />
          </AppInfoCard>

          {/* =================================================
              OFFICER
          ================================================= */}

          <AppInfoCard
            className="
              relative
              z-[5000]
              overflow-visible
            "
          >
            <label
              htmlFor="officerId"
              className={labelClass}
            >
              ผู้ขอเบิก
            </label>

            <SearchableDropdown
              id="officerId"
              name="officerId"
              value={officerId}
              options={
                officerOptions
              }
              placeholder={
                departmentId
                  ? "-- เลือกผู้ขอเบิก --"
                  : "เลือกกลุ่มงานก่อน"
              }
              searchPlaceholder="พิมพ์ค้นหาผู้ขอเบิก..."
              emptyText="ไม่พบผู้ขอเบิกในกลุ่มงานนี้"
              disabled={
                !departmentId
              }
              required
              onChange={
                setOfficerId
              }
            />
          </AppInfoCard>
        </div>
      </AppCard>

      {/* =====================================================
          MATERIAL TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุที่ขอเบิก"
        subtitle={`ระบุหมวดหมู่ รายการ จำนวน และหมายเหตุ • ทั้งหมด ${rows.length} รายการ`}
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
              min-w-[1400px]

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
                  "จำนวนที่ขอเบิก",
                  "จำนวนที่เบิกจ่าย",
                  "หน่วย",
                  "หมายเหตุ",
                ].map(
                  (tableTitle) => (
                    <th
                      key={
                        tableTitle
                      }
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
                      {tableTitle}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (
                  row,
                  index
                ) => {
                  const list =
                    materials.filter(
                      (
                        material
                      ) =>
                        material.category ===
                        row.category
                    );

                  const selectedMaterial =
                    materials.find(
                      (
                        material
                      ) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  const unit =
                    selectedMaterial
                      ?.unit ?? "";

                  const materialOptions:
                    SearchableOption[] =
                    list.map(
                      (
                        material
                      ) => ({
                        value: String(
                          material.id
                        ),
                        label:
                          material.name,
                      })
                    );

                  const rowZIndex =
                    rows.length -
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
                      {/* =====================================
                          NUMBER
                      ===================================== */}

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

                      {/* =====================================
                          CATEGORY
                      ===================================== */}

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

                      {/* =====================================
                          MATERIAL
                      ===================================== */}

                      <td
                        className="
                          relative
                          min-w-[330px]

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
                          placeholder={
                            row.category
                              ? "เลือกรายการพัสดุ"
                              : "เลือกหมวดหมู่ก่อน"
                          }
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

                      {/* =====================================
                          REQUEST QTY
                      ===================================== */}

                      <td
                        className="
                          min-w-[160px]

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
                          value={
                            row.qty
                          }
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
                            w-full

                            rounded-[12px]

                            border
                            border-slate-200

                            bg-white

                            px-3

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

                      {/* =====================================
                          APPROVED QTY
                      ===================================== */}

                      <td
                        className="
                          min-w-[160px]

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
                          value=""
                          aria-label={`จำนวนที่เบิกจ่ายรายการที่ ${
                            index + 1
                          }`}
                          className="
                            h-[46px]
                            w-full

                            rounded-[12px]

                            border
                            border-slate-200

                            bg-slate-100

                            px-3

                            text-center
                            font-extrabold
                            !text-slate-500

                            outline-none
                          "
                        />
                      </td>

                      {/* =====================================
                          UNIT
                      ===================================== */}

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
                            unit || "-"
                          }
                          aria-label={`หน่วยของรายการที่ ${
                            index + 1
                          }`}
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

                        <input
                          type="hidden"
                          name={`items[${index}].unit`}
                          value={unit}
                        />
                      </td>

                      {/* =====================================
                          REMARK
                      ===================================== */}

                      <td
                        className="
                          min-w-[240px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="text"
                          name={`items[${index}].remark`}
                          value={
                            row.remark
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "remark",
                              event.target
                                .value
                            )
                          }
                          placeholder="ระบุหมายเหตุ"
                          className="
                            h-[46px]
                            w-full

                            rounded-[12px]

                            border
                            border-slate-200

                            bg-white

                            px-3

                            font-bold
                            !text-slate-900

                            outline-none

                            transition-all

                            placeholder:!text-slate-400

                            focus:border-blue-300
                            focus:ring-4
                            focus:ring-blue-100/70
                          "
                        />
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
          icon={
            <span>💾</span>
          }
        >
          บันทึก
        </AppButton>
      </div>
    </form>
  );
}