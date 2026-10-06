"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppSearchInput from "@/components/AppSearchInput";
import AppTableCard from "@/components/AppTableCard";

import ExportInspectionPdf from "./ExportInspectionPdf";

/* =========================================================
   TYPES
========================================================= */

type MaterialRow = {
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

  position: string | null;
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

  accuracy:
    | ""
    | "CORRECT"
    | "INCORRECT";

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

  materials: MaterialRow[];
  officers: Officer[];

  initialInspectionDate?: string;
};

/* =========================================================
   FIELD TYPES
========================================================= */

type SearchableOption = {
  value: string;
  label: string;
};

type SearchableDropdownProps = {
  id: string;

  value: string;

  options: SearchableOption[];

  placeholder: string;

  searchPlaceholder?: string;
  emptyText?: string;

  disabled?: boolean;
  required?: boolean;

  onChange: (
    value: string
  ) => void;
};

type IOSDatePickerProps = {
  id: string;

  value: string;

  placeholder?: string;

  required?: boolean;
  disabled?: boolean;

  onChange: (
    value: string
  ) => void;
};

type EditableInspectionField =
  | "accuracy"
  | "shortageQty"
  | "excessQty"
  | "baht"
  | "satang"
  | "damagedQty"
  | "deterioratedQty"
  | "unnecessaryQty"
  | "remark";

/* =========================================================
   CATEGORY
========================================================= */

const CATEGORY_ORDER = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const CATEGORY_NAMES:
  Record<
    string,
    string
  > = {
  OFFICE:
    "วัสดุสำนักงาน",

  COMPUTER:
    "วัสดุคอมพิวเตอร์",

  ELECTRIC:
    "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",

  VEHICLE:
    "วัสดุยานพาหนะ",

  PRINTING:
    "วัสดุสื่อสิ่งพิมพ์",
};

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

/* =========================================================
   CURRENT DATE
========================================================= */

function getCurrentDate() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  return formatter.format(
    new Date()
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function parseDateOnly(
  value: string
) {
  if (!value) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatThaiDate(
  value: string
) {
  const date =
    parseDateOnly(
      value
    );

  if (!date) {
    return "";
  }

  const day =
    date.getDate();

  const month =
    thaiMonths[
      date.getMonth()
    ];

  const year =
    date.getFullYear() +
    543;

  return `${day} ${month} ${year}`;
}

function dateToInputValue(
  date: Date
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}

function inputValueToDate(
  value: string
) {
  if (!value) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
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
  value,
  placeholder =
    "เลือกวันที่",
  required =
    false,
  disabled =
    false,
  onChange,
}: IOSDatePickerProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const selectedDate =
    inputValueToDate(
      value
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    viewDate,
    setViewDate,
  ] =
    useState<Date>(
      selectedDate ??
        new Date()
    );

  useEffect(
    () => {
      if (
        selectedDate
      ) {
        setViewDate(
          new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
          )
        );
      }
    },
    [
      value,
    ]
  );

  useEffect(
    () => {
      function handleMouseDown(
        event:
          MouseEvent
      ) {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(
            false
          );
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
    },
    []
  );

  const calendarDays =
    useMemo(
      () => {
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
            month +
              1,
            0
          );

        const days:
          Array<
            Date |
            null
          > = [];

        for (
          let i =
            0;
          i <
          firstDay.getDay();
          i++
        ) {
          days.push(
            null
          );
        }

        for (
          let day =
            1;
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
          days.length %
            7 !==
          0
        ) {
          days.push(
            null
          );
        }

        return days;
      },
      [
        viewDate,
      ]
    );

  function previousMonth() {
    setViewDate(
      (
        current
      ) =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1
        )
    );
  }

  function nextMonth() {
    setViewDate(
      (
        current
      ) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            1,
          1
        )
    );
  }

  function selectToday() {
    const today =
      new Date();

    onChange(
      dateToInputValue(
        today
      )
    );

    setViewDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setOpen(
      false
    );
  }

  return (
    <div
      ref={
        containerRef
      }
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
      {required && (
        <input
          tabIndex={
            -1
          }
          aria-hidden="true"
          value={
            value
          }
          onChange={() => {}}
          required
          className="
            pointer-events-none
            absolute
            h-px
            w-px
            opacity-0
          "
        />
      )}

      <button
        id={
          id
        }
        type="button"
        disabled={
          disabled
        }
        aria-haspopup="dialog"
        aria-expanded={
          open
        }
        onClick={() => {
          if (
            disabled
          ) {
            return;
          }

          if (
            !open
          ) {
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
            (
              current
            ) =>
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
          border-slate-300

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

          hover:border-slate-400
          hover:bg-slate-50

          focus:border-blue-400
          focus:bg-white
          focus:ring-4
          focus:ring-blue-500/10

          disabled:cursor-default
          disabled:border-slate-200
          disabled:bg-slate-100
          disabled:opacity-70
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
            ? formatThaiDate(
                value
              )
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

            bg-slate-100

            text-lg

            shadow-inner

            transition-all

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

      {open &&
        !disabled && (
          <div
            role="dialog"
            aria-label="เลือกวันที่"
            className="
              absolute
              left-0
              top-[calc(100%+10px)]

              z-[9999]

              w-[360px]
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
                onClick={
                  previousMonth
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center

                  rounded-[12px]

                  bg-slate-100

                  text-xl
                  font-black

                  !text-slate-800

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
                onClick={
                  nextMonth
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center

                  rounded-[12px]

                  bg-slate-100

                  text-xl
                  font-black

                  !text-slate-800

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
                (
                  day
                ) => (
                  <div
                    key={
                      day
                    }
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
                    {
                      day
                    }
                  </div>
                )
              )}

              {calendarDays.map(
                (
                  date,
                  index
                ) => {
                  if (
                    !date
                  ) {
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
                      key={
                        dateToInputValue(
                          date
                        )
                      }
                      type="button"
                      onClick={() => {
                        onChange(
                          dateToInputValue(
                            date
                          )
                        );

                        setOpen(
                          false
                        );
                      }}
                      className={`
                        flex
                        h-10
                        items-center
                        justify-center

                        rounded-[12px]

                        text-sm
                        font-extrabold

                        transition-all

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
                      {
                        date.getDate()
                      }
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
                gap-2

                border-t
                border-slate-200

                pt-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  onChange(
                    ""
                  );

                  setOpen(
                    false
                  );
                }}
                className="
                  rounded-full

                  px-4
                  py-2

                  text-sm
                  font-extrabold

                  !text-slate-500

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
                  rounded-[12px]

                  bg-slate-900

                  px-4
                  py-2

                  text-sm
                  font-extrabold

                  !text-white

                  shadow-sm

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
  value,
  options,
  placeholder,
  searchPlaceholder =
    "พิมพ์เพื่อค้นหา...",
  emptyText =
    "ไม่พบข้อมูล",
  disabled =
    false,
  required =
    false,
  onChange,
}: SearchableDropdownProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const selectedOption =
    options.find(
      (
        option
      ) =>
        option.value ===
        value
    );

  const filteredOptions =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLocaleLowerCase(
              "th"
            );

        if (
          !keyword
        ) {
          return options;
        }

        return options.filter(
          (
            option
          ) =>
            option.label
              .toLocaleLowerCase(
                "th"
              )
              .includes(
                keyword
              ) ||
            option.value
              .toLocaleLowerCase(
                "th"
              )
              .includes(
                keyword
              )
        );
      },
      [
        options,
        search,
      ]
    );

  useEffect(
    () => {
      function handleMouseDown(
        event:
          MouseEvent
      ) {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(
            false
          );

          setSearch(
            ""
          );
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
    },
    []
  );

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const timer =
        window.setTimeout(
          () => {
            inputRef.current?.focus();
          },
          0
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      open,
    ]
  );

  return (
    <div
      ref={
        containerRef
      }
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
      {required && (
        <input
          tabIndex={
            -1
          }
          aria-hidden="true"
          value={
            value
          }
          onChange={() => {}}
          required
          className="
            pointer-events-none
            absolute
            h-px
            w-px
            opacity-0
          "
        />
      )}

      <button
        id={
          id
        }
        type="button"
        disabled={
          disabled
        }
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        onClick={() => {
          if (
            disabled
          ) {
            return;
          }

          setOpen(
            (
              current
            ) =>
              !current
          );
        }}
        className="
          flex
          min-h-[50px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3

          rounded-[14px]

          border
          border-slate-300

          bg-white

          px-4
          py-3

          text-left
          text-base
          font-bold

          !text-slate-900

          shadow-sm
          outline-none

          hover:border-slate-400
          hover:bg-slate-50

          focus:border-blue-400
          focus:ring-4
          focus:ring-blue-500/10
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
          {selectedOption
            ?.label ??
            placeholder}
        </span>

        <span
          aria-hidden="true"
          className={`
            text-xs
            !text-slate-500

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

      {open &&
        !disabled && (
          <div
            className="
              absolute
              left-0
              right-0
              top-[calc(100%+8px)]

              z-[9999]

              overflow-hidden

              rounded-[16px]

              border
              border-slate-200

              bg-white

              shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)]
            "
          >
            <div
              className="
                border-b
                border-slate-200

                bg-slate-50

                p-3
              "
            >
              <input
                ref={
                  inputRef
                }
                type="text"
                value={
                  search
                }
                placeholder={
                  searchPlaceholder
                }
                autoComplete="off"
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="
                  min-h-[46px]
                  w-full

                  rounded-[12px]

                  border
                  border-slate-300

                  bg-white

                  px-4

                  font-bold

                  !text-slate-900

                  outline-none

                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />
            </div>

            <div
              role="listbox"
              className="
                max-h-[280px]

                overflow-y-auto

                p-2
              "
            >
              {filteredOptions.length >
              0 ? (
                filteredOptions.map(
                  (
                    option
                  ) => {
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

                          setSearch(
                            ""
                          );
                        }}
                        className={`
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3

                          rounded-[10px]

                          px-3
                          py-2.5

                          text-left
                          font-bold

                          ${
                            selected
                              ? "bg-slate-900 !text-white"
                              : "bg-white !text-slate-900 hover:bg-slate-100"
                          }
                        `}
                      >
                        <span>
                          {
                            option.label
                          }
                        </span>

                        {selected && (
                          <span>
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
                    font-bold

                    !text-slate-500
                  "
                >
                  {
                    emptyText
                  }
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

/* =========================================================
   DISPLAY NUMBER
========================================================= */

function displayQuantity(
  value:
    number |
    null |
    undefined
) {
  const numberValue =
    Number(
      value ??
        0
    );

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue ===
      0
  ) {
    return "-";
  }

  return numberValue.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   INITIAL ROW
========================================================= */

function createInitialRows(
  materials:
    MaterialRow[]
): InspectionRow[] {
  return materials.map(
    (
      material
    ) => ({
      materialId:
        material.materialId,

      accuracy:
        "",

      shortageQty:
        "",

      excessQty:
        "",

      baht:
        "",

      satang:
        "",

      damagedQty:
        "",

      deterioratedQty:
        "",

      unnecessaryQty:
        "",

      remark:
        "",
    })
  );
}

/* =========================================================
   SAVE ICON
========================================================= */

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />

      <path d="M17 21v-8H7v8" />

      <path d="M7 3v5h8" />
    </svg>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function InspectionForm({
  fiscalYear,
  startShortYear,
  endShortYear,
  materials,
  officers,
  initialInspectionDate,
}: Props) {
  const [
    rows,
    setRows,
  ] =
    useState<
      InspectionRow[]
    >(
      () =>
        createInitialRows(
          materials
        )
    );

  const [
    inspectorIds,
    setInspectorIds,
  ] =
    useState<
      string[]
    >([
      "",
      "",
      "",
    ]);

  const [
    inspectionDate,
    setInspectionDate,
  ] =
    useState(
      initialInspectionDate ||
        getCurrentDate()
    );

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState(
      ""
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMaterials =
    useMemo(
      () => {
        const keyword =
          searchTerm
            .trim()
            .toLocaleLowerCase(
              "th"
            );

        if (
          !keyword
        ) {
          return materials;
        }

        return materials.filter(
          (
            material
          ) =>
            [
              material.code,
              material.name,
              material.unit,
              material.category,

              CATEGORY_NAMES[
                material.category
              ],
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLocaleLowerCase(
                "th"
              )
              .includes(
                keyword
              )
        );
      },
      [
        materials,
        searchTerm,
      ]
    );

  /* =======================================================
     GROUP
  ======================================================= */

  const groupedMaterials =
    useMemo(
      () =>
        CATEGORY_ORDER
          .map(
            (
              category
            ) => ({
              category,

              label:
                CATEGORY_NAMES[
                  category
                ] ??
                category,

              materials:
                filteredMaterials.filter(
                  (
                    material
                  ) =>
                    material.category ===
                    category
                ),
            })
          )
          .filter(
            (
              group
            ) =>
              group.materials.length >
              0
          ),
      [
        filteredMaterials,
      ]
    );

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  function updateRow(
    materialId:
      number,

    field:
      EditableInspectionField,

    value:
      string
  ) {
    setRows(
      (
        currentRows
      ) =>
        currentRows.map(
          (
            row
          ) =>
            row.materialId ===
            materialId
              ? {
                  ...row,

                  [field]:
                    value,
                }
              : row
        )
    );
  }

  /* =======================================================
     QUICK ACCURACY
  ======================================================= */

  function updateAllAccuracy(
    value:
      | "CORRECT"
      | "INCORRECT"
  ) {
    const visibleMaterialIds =
      new Set(
        filteredMaterials.map(
          (
            material
          ) =>
            material.materialId
        )
      );

    setRows(
      (
        currentRows
      ) =>
        currentRows.map(
          (
            row
          ) =>
            visibleMaterialIds.has(
              row.materialId
            )
              ? {
                  ...row,

                  accuracy:
                    value,
                }
              : row
        )
    );
  }

  /* =======================================================
     INSPECTOR
  ======================================================= */

  function updateInspector(
    index:
      number,

    value:
      string
  ) {
    setInspectorIds(
      (
        current
      ) => {
        const next =
          [
            ...current,
          ];

        next[
          index
        ] =
          value;

        return next;
      }
    );
  }

  function isOfficerSelected(
    officerId:
      string,

    currentIndex:
      number
  ) {
    return inspectorIds.some(
      (
        id,
        index
      ) =>
        index !==
          currentIndex &&
        id ===
          officerId
    );
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    if (
      !inspectionDate
    ) {
      alert(
        "กรุณาเลือกวันที่ตรวจสอบ"
      );

      return;
    }

    if (
      inspectorIds.some(
        (
          id
        ) =>
          !id
      )
    ) {
      alert(
        "กรุณาเลือกรายชื่อผู้ตรวจสอบให้ครบทั้ง 3 คน"
      );

      return;
    }

    if (
      new Set(
        inspectorIds
      ).size !==
      3
    ) {
      alert(
        "ไม่สามารถเลือกผู้ตรวจสอบซ้ำกันได้"
      );

      return;
    }

    try {
      setIsSaving(
        true
      );

      const response =
        await fetch(
          "/api/stock-card/inspection",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  fiscalYear,

                  inspectionDate,

                  inspectorIds:
                    inspectorIds.map(
                      Number
                    ),

                  rows,
                }
              ),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      alert(
        "บันทึกข้อมูลการตรวจสอบเรียบร้อยแล้ว"
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

  const numberInputClass =
    `
      mx-auto

      h-9
      w-20

      rounded-[10px]

      border
      border-slate-300

      bg-white

      px-2

      text-center
      font-semibold

      !text-slate-900

      outline-none

      placeholder:!text-slate-400

      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500/10
    `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        w-full
        min-w-0

        space-y-6
      "
    >
      {/* =====================================================
          INFORMATION
      ===================================================== */}

      <AppCard
        className="
          relative
          z-20

          !overflow-visible
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-black

                !text-slate-900

                sm:text-2xl
              "
            >
              ข้อมูลการตรวจสอบ
            </h2>

            <p
              className="
                mt-1

                text-sm
                font-semibold

                !text-slate-500
              "
            >
              ตรวจสอบบัญชีพัสดุประจำปีงบประมาณ พ.ศ.{" "}
              {
                fiscalYear
              }
            </p>
          </div>

          <ExportInspectionPdf
            fiscalYear={
              fiscalYear
            }
            startShortYear={
              startShortYear
            }
            endShortYear={
              endShortYear
            }
            inspectionDate={
              inspectionDate
            }
            materials={
              materials
            }
            rows={
              rows
            }
            inspectorIds={
              inspectorIds
            }
            officers={
              officers
            }
          />
        </div>

        <div
          className="
            mt-5

            grid
            grid-cols-1
            gap-4

            md:grid-cols-4
          "
        >
          <div
            className="
              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/60

              p-4
            "
          >
            <p
              className="
                text-sm
                font-extrabold

                !text-slate-500
              "
            >
              ปีงบประมาณ
            </p>

            <p
              className="
                mt-1

                text-lg
                font-black

                !text-slate-900
              "
            >
              พ.ศ.{" "}
              {
                fiscalYear
              }
            </p>
          </div>

          <div
            className="
              relative
              z-40

              min-w-0

              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/60

              p-4
            "
          >
            <label
              htmlFor="inspectionDate"
              className="
                mb-2
                block

                text-sm
                font-extrabold

                !text-slate-500
              "
            >
              ตรวจสอบเมื่อวันที่
            </label>

            <IOSDatePicker
              id="inspectionDate"
              value={
                inspectionDate
              }
              placeholder="เลือกวันที่"
              required
              onChange={
                setInspectionDate
              }
            />
          </div>

          <div
            className="
              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/60

              p-4
            "
          >
            <p
              className="
                text-sm
                font-extrabold

                !text-slate-500
              "
            >
              ยอดยกมา
            </p>

            <p
              className="
                mt-1

                text-lg
                font-black

                !text-slate-900
              "
            >
              30 ก.ย.{" "}
              {
                startShortYear
              }
            </p>
          </div>

          <div
            className="
              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/60

              p-4
            "
          >
            <p
              className="
                text-sm
                font-extrabold

                !text-slate-500
              "
            >
              ช่วงรายการรับ–จ่าย
            </p>

            <p
              className="
                mt-1

                text-lg
                font-black

                !text-slate-900
              "
            >
              01 ต.ค.{" "}
              {
                startShortYear
              }{" "}
              - 30 ก.ย.{" "}
              {
                endShortYear
              }
            </p>
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <AppSearchInput
        value={
          searchTerm
        }
        onChange={(
          event
        ) =>
          setSearchTerm(
            event.target.value
          )
        }
        onSubmit={() =>
          setSearchTerm(
            searchTerm.trim()
          )
        }
        onClear={() =>
          setSearchTerm(
            ""
          )
        }
        placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / หมวดวัสดุ"
        resultCount={
          filteredMaterials.length
        }
        resultLabel="รายการ"
        showSearchButton
        showClearButton
        searchButtonText="ค้นหา"
        clearButtonText="ล้าง"
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`ประจำปีงบประมาณ ${fiscalYear}`}
        badge={`${filteredMaterials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
      >
        {/* =================================================
            QUICK ACTION
        ================================================= */}

        <div
          className="
            border-b
            border-slate-200

            bg-slate-50/70

            p-3

            sm:p-4
          "
        >
          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >
            <AppButton
              type="button"
              variant="success"
              size="sm"
              onClick={() =>
                updateAllAccuracy(
                  "CORRECT"
                )
              }
            >
              ถูกต้องทั้งหมด
            </AppButton>

            <AppButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() =>
                updateAllAccuracy(
                  "INCORRECT"
                )
              }
            >
              ไม่ถูกต้องทั้งหมด
            </AppButton>
          </div>
        </div>

        <div
          className="
            w-full
            overflow-x-auto
          "
        >
          <table
            className="
              w-full
              min-w-[2500px]

              border-collapse

              bg-white
            "
          >
            <thead>
              <tr>
                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center align-middle font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="min-w-[320px] border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center align-middle font-extrabold !text-white"
                >
                  รายการพัสดุ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center align-middle font-extrabold !text-white"
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="min-w-[180px] border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center align-middle font-extrabold !text-white"
                >
                  คงเหลือยอดยกมา
                  <br />
                  เมื่อ 30 ก.ย.{" "}
                  {
                    startShortYear
                  }
                </th>

                <th
                  colSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center font-extrabold !text-white"
                >
                  01 ต.ค.{" "}
                  {
                    startShortYear
                  }{" "}
                  - 30 ก.ย.{" "}
                  {
                    endShortYear
                  }
                </th>

                <th className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center font-extrabold !text-white">
                  คงเหลือ
                </th>

                <th
                  colSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center font-extrabold !text-white"
                >
                  ผลการตรวจสอบ
                </th>

                <th
                  colSpan={
                    4
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center font-extrabold !text-white"
                >
                  ถ้าไม่ถูกต้องจำนวนที่ขาด
                  จำนวนที่เกินคิดเป็นร้อยละ
                </th>

                <th
                  colSpan={
                    3
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center font-extrabold !text-white"
                >
                  จำนวนที่
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                {[
                  "รับ",
                  "จ่าย",
                  "ยกไป",
                  "ถูกต้อง",
                  "ไม่ถูกต้อง",
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                  "ชำรุด",
                  "เสื่อมสภาพ",
                  "ไม่จำเป็นต้องใช้",
                ].map(
                  (
                    title
                  ) => (
                    <th
                      key={
                        title
                      }
                      className="min-w-[100px] border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center font-extrabold !text-white"
                    >
                      {
                        title
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {groupedMaterials.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      17
                    }
                    className="
                      border
                      border-black

                      px-6
                      py-16

                      text-center
                      font-bold

                      !text-slate-500
                    "
                  >
                    ไม่พบรายการพัสดุ
                  </td>
                </tr>
              ) : (
                groupedMaterials.map(
                  (
                    group
                  ) => (
                    <Fragment
                      key={
                        group.category
                      }
                    >
                      <tr>
                        <td
                          colSpan={
                            17
                          }
                          className="
                            border
                            border-black

                            bg-slate-200

                            px-4
                            py-3

                            text-left
                            text-base
                            font-black

                            !text-slate-900
                          "
                        >
                          {
                            group.label
                          }
                        </td>
                      </tr>

                      {group.materials.map(
                        (
                          material,
                          index
                        ) => {
                          const row =
                            rows.find(
                              (
                                item
                              ) =>
                                item.materialId ===
                                material.materialId
                            );

                          if (
                            !row
                          ) {
                            return null;
                          }

                          return (
                            <tr
                              key={
                                material.materialId
                              }
                              className={`
                                text-sm
                                font-medium

                                !text-slate-900

                                ${
                                  index %
                                    2 ===
                                  0
                                    ? "bg-white"
                                    : "bg-slate-50/60"
                                }

                                hover:bg-emerald-50/60
                              `}
                            >
                              <td className="border border-black px-2 py-2.5 text-center">
                                {
                                  index +
                                  1
                                }
                              </td>

                              <td className="border border-black px-3 py-2.5 font-semibold">
                                {
                                  material.name
                                }
                              </td>

                              <td className="border border-black px-2 py-2.5 text-center">
                                {material.unit ||
                                  "-"}
                              </td>

                              <td className="border border-black px-2 py-2.5 text-center">
                                {displayQuantity(
                                  material.openingBalance
                                )}
                              </td>

                              <td className="border border-black px-2 py-2.5 text-center">
                                {displayQuantity(
                                  material.receiveQty
                                )}
                              </td>

                              <td className="border border-black px-2 py-2.5 text-center">
                                {displayQuantity(
                                  material.issueQty
                                )}
                              </td>

                              <td className="border border-black px-2 py-2.5 text-center">
                                {displayQuantity(
                                  material.closingBalance
                                )}
                              </td>

                              {[
                                "CORRECT",
                                "INCORRECT",
                              ].map(
                                (
                                  accuracy
                                ) => (
                                  <td
                                    key={
                                      accuracy
                                    }
                                    className="border border-black px-2 py-2 text-center"
                                  >
                                    <input
                                      type="radio"
                                      name={`accuracy-${material.materialId}`}
                                      value={
                                        accuracy
                                      }
                                      checked={
                                        row.accuracy ===
                                        accuracy
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateRow(
                                          material.materialId,
                                          "accuracy",
                                          event.target.value
                                        )
                                      }
                                      className="
                                        h-4
                                        w-4

                                        cursor-pointer

                                        accent-blue-600
                                      "
                                    />
                                  </td>
                                )
                              )}

                              {[
                                {
                                  field:
                                    "shortageQty" as const,

                                  value:
                                    row.shortageQty,
                                },

                                {
                                  field:
                                    "excessQty" as const,

                                  value:
                                    row.excessQty,
                                },

                                {
                                  field:
                                    "baht" as const,

                                  value:
                                    row.baht,
                                },

                                {
                                  field:
                                    "satang" as const,

                                  value:
                                    row.satang,
                                },

                                {
                                  field:
                                    "damagedQty" as const,

                                  value:
                                    row.damagedQty,
                                },

                                {
                                  field:
                                    "deterioratedQty" as const,

                                  value:
                                    row.deterioratedQty,
                                },

                                {
                                  field:
                                    "unnecessaryQty" as const,

                                  value:
                                    row.unnecessaryQty,
                                },
                              ].map(
                                (
                                  input
                                ) => (
                                  <td
                                    key={
                                      input.field
                                    }
                                    className="border border-black px-2 py-2 text-center"
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={
                                        input.value
                                      }
                                      placeholder="-"
                                      onChange={(
                                        event
                                      ) =>
                                        updateRow(
                                          material.materialId,
                                          input.field,
                                          event.target.value
                                        )
                                      }
                                      className={
                                        numberInputClass
                                      }
                                    />
                                  </td>
                                )
                              )}

                              <td className="border border-black px-2 py-2">
                                <input
                                  type="text"
                                  value={
                                    row.remark
                                  }
                                  placeholder="-"
                                  onChange={(
                                    event
                                  ) =>
                                    updateRow(
                                      material.materialId,
                                      "remark",
                                      event.target.value
                                    )
                                  }
                                  className="
                                    h-9
                                    w-[160px]

                                    rounded-[10px]

                                    border
                                    border-slate-300

                                    bg-white

                                    px-3

                                    font-semibold

                                    !text-slate-900

                                    outline-none

                                    placeholder:!text-slate-400

                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-500/10
                                  "
                                />
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </Fragment>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>

      {/* =====================================================
          COMMITTEE
      ===================================================== */}

      <AppCard
        className="
          relative
          z-10

          !overflow-visible
        "
      >
        <h2
          className="
            text-xl
            font-black

            !text-slate-900

            sm:text-2xl
          "
        >
          คณะกรรมการตรวจสอบครุภัณฑ์
        </h2>

        <p
          className="
            mt-1

            text-sm
            font-semibold

            !text-slate-500
          "
        >
          เลือกผู้ตรวจสอบจำนวน 3 คน
          โดยไม่สามารถเลือกรายชื่อซ้ำกันได้
        </p>

        <div
          className="
            mt-5

            grid
            grid-cols-1
            gap-4

            lg:grid-cols-3
          "
        >
          {inspectorIds.map(
            (
              inspectorId,
              index
            ) => {
              const options =
                officers
                  .filter(
                    (
                      officer
                    ) =>
                      String(
                        officer.id
                      ) ===
                        inspectorId ||
                      !isOfficerSelected(
                        String(
                          officer.id
                        ),
                        index
                      )
                  )
                  .map(
                    (
                      officer
                    ) => ({
                      value:
                        String(
                          officer.id
                        ),

                      label:
                        `${officer.firstName} ${officer.lastName}`.trim(),
                    })
                  );

              return (
                <div
                  key={
                    index
                  }
                  className="
                    relative
                    z-10
                    min-w-0
                  "
                >
                  <label
                    className="
                      mb-2
                      block

                      text-sm
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    {index ===
                    0
                      ? "ประธานกรรมการ"
                      : `กรรมการคนที่ ${index}`}
                  </label>

                  <SearchableDropdown
                    id={`inspector-${index}`}
                    value={
                      inspectorId
                    }
                    options={
                      options
                    }
                    placeholder="-- เลือกผู้ตรวจสอบ --"
                    searchPlaceholder="พิมพ์ค้นหาผู้ตรวจสอบ..."
                    emptyText="ไม่พบรายชื่อผู้ตรวจสอบ"
                    required
                    onChange={(
                      value
                    ) =>
                      updateInspector(
                        index,
                        value
                      )
                    }
                  />
                </div>
              );
            }
          )}
        </div>
      </AppCard>

      {/* =====================================================
          ACTION
          ใช้ปุ่มตัวกลางแบบเดียวกับหน้าอื่น
      ===================================================== */}

      <div
        className="
          flex
          w-full
          flex-col

          gap-2

          sm:flex-row
          sm:items-center
          sm:justify-end
        "
      >
        <AppButton
          href={`/stock-card?fiscalYear=${fiscalYear}`}
          variant="primary"
          size="md"
          className="
            w-full
            sm:w-auto
          "
        >
          ยกเลิก
        </AppButton>

        <AppButton
          type="button"
          variant="success"
          size="md"
          icon={
            <SaveIcon />
          }
          onClick={
            handleSave
          }
          disabled={
            isSaving
          }
          className="
            w-full
            sm:w-auto
          "
        >
          {isSaving
            ? "กำลังบันทึก..."
            : "บันทึก"}
        </AppButton>
      </div>
    </div>
  );
}