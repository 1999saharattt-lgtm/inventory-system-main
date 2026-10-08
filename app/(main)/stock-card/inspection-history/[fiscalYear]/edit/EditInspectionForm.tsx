"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppSearchInput from "@/components/AppSearchInput";
import AppSearchableSelect from "@/components/AppSearchableSelect";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string | null;

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

  code: string;
  name: string;
  unit: string;
  category: string;

  openingQty: number;
  receiveQty: number;
  issueQty: number;
  closingQty: number;

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

type InitialData = {
  fiscalYear: number;

  inspectionDate: string;

  inspectorIds: string[];

  rows: InspectionRow[];
};

type Props = {
  fiscalYear: number;

  officers: Officer[];

  initialData: InitialData;

  submitUrl: string;

  cancelHref: string;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryOrder = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const categoryName: Record<
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
   THAI MONTHS
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

const thaiShortWeekDays = [
  "อา",
  "จ",
  "อ",
  "พ",
  "พฤ",
  "ศ",
  "ส",
];

/* =========================================================
   DATE HELPERS
========================================================= */

function parseDateOnly(
  value: string
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return date;
}

function toDateOnly(
  year: number,
  month: number,
  day: number
) {
  return [
    year,
    String(
      month + 1
    ).padStart(
      2,
      "0"
    ),
    String(
      day
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
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

  return `${date.getDate()} ${
    thaiMonths[
      date.getMonth()
    ]
  } ${
    date.getFullYear() +
    543
  }`;
}

function getTodayDateOnly() {
  const now =
    new Date();

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
    now
  );
}

/* =========================================================
   IOS DATE PICKER
========================================================= */

type IOSDatePickerProps = {
  id: string;
  value: string;
  onChange: (
    value: string
  ) => void;
};

function IOSDatePicker({
  id,
  value,
  onChange,
}: IOSDatePickerProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const selectedDate =
    parseDateOnly(
      value
    );

  const initialDate =
    selectedDate ??
    parseDateOnly(
      getTodayDateOnly()
    ) ??
    new Date();

  const [
    open,
    setOpen,
  ] = useState(
    false
  );

  const [
    displayYear,
    setDisplayYear,
  ] = useState(
    initialDate.getFullYear()
  );

  const [
    displayMonth,
    setDisplayMonth,
  ] = useState(
    initialDate.getMonth()
  );

  useEffect(() => {
    if (
      !selectedDate
    ) {
      return;
    }

    setDisplayYear(
      selectedDate.getFullYear()
    );

    setDisplayMonth(
      selectedDate.getMonth()
    );
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
  }, []);

  const firstDay =
    new Date(
      displayYear,
      displayMonth,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      displayYear,
      displayMonth + 1,
      0
    ).getDate();

  const calendarCells: Array<
    number | null
  > = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    calendarCells.push(
      null
    );
  }

  for (
    let day = 1;
    day <=
    daysInMonth;
    day++
  ) {
    calendarCells.push(
      day
    );
  }

  while (
    calendarCells.length %
      7 !==
    0
  ) {
    calendarCells.push(
      null
    );
  }

  function goPreviousMonth() {
    if (
      displayMonth ===
      0
    ) {
      setDisplayMonth(
        11
      );

      setDisplayYear(
        (
          current
        ) =>
          current -
          1
      );

      return;
    }

    setDisplayMonth(
      (
        current
      ) =>
        current -
        1
    );
  }

  function goNextMonth() {
    if (
      displayMonth ===
      11
    ) {
      setDisplayMonth(
        0
      );

      setDisplayYear(
        (
          current
        ) =>
          current +
          1
      );

      return;
    }

    setDisplayMonth(
      (
        current
      ) =>
        current +
        1
    );
  }

  function selectDay(
    day: number
  ) {
    onChange(
      toDateOnly(
        displayYear,
        displayMonth,
        day
      )
    );

    setOpen(
      false
    );
  }

  function selectToday() {
    const today =
      parseDateOnly(
        getTodayDateOnly()
      );

    if (!today) {
      return;
    }

    onChange(
      toDateOnly(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
    );

    setDisplayYear(
      today.getFullYear()
    );

    setDisplayMonth(
      today.getMonth()
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
      className="
        relative
        w-full
        min-w-0
      "
    >
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={
          open
        }
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className="
          flex
          h-[48px]
          w-full
          min-w-0
          items-center
          justify-between

          rounded-[14px]

          border
          border-slate-300

          bg-white

          px-4

          text-left
          text-sm
          font-bold

          !text-slate-900

          shadow-sm

          outline-none

          transition-all
          duration-200

          hover:border-slate-400

          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-100
        "
      >
        <span
          className={
            value
              ? "!text-slate-900"
              : "!text-slate-400"
          }
        >
          {value
            ? formatThaiDate(
                value
              )
            : "เลือกวันที่"}
        </span>

        <span
          aria-hidden="true"
          className="
            ml-3
            shrink-0
            text-lg
          "
        >
          📅
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          className="
            absolute
            left-0
            top-[54px]
            z-[500]

            w-[330px]
            max-w-[calc(100vw-32px)]

            overflow-hidden

            rounded-[22px]

            border
            border-slate-200

            bg-white/95

            p-3

            shadow-2xl
            backdrop-blur-xl
          "
        >
          {/* =============================================
              MONTH HEADER
          ============================================= */}

          <div
            className="
              flex
              items-center
              justify-between

              px-1
              pb-3
            "
          >
            <button
              type="button"
              onClick={
                goPreviousMonth
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-full

                bg-slate-100

                text-lg
                font-black

                !text-slate-700

                transition

                hover:bg-slate-200
              "
            >
              ‹
            </button>

            <div
              className="
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
                    displayMonth
                  ]
                }
              </div>

              <div
                className="
                  text-sm
                  font-bold

                  !text-slate-500
                "
              >
                พ.ศ.{" "}
                {displayYear +
                  543}
              </div>
            </div>

            <button
              type="button"
              onClick={
                goNextMonth
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-full

                bg-slate-100

                text-lg
                font-black

                !text-slate-700

                transition

                hover:bg-slate-200
              "
            >
              ›
            </button>
          </div>

          {/* =============================================
              WEEK DAYS
          ============================================= */}

          <div
            className="
              grid
              grid-cols-7
              gap-1
            "
          >
            {thaiShortWeekDays.map(
              (
                day
              ) => (
                <div
                  key={
                    day
                  }
                  className="
                    py-1.5

                    text-center
                    text-xs
                    font-black

                    !text-slate-500
                  "
                >
                  {
                    day
                  }
                </div>
              )
            )}
          </div>

          {/* =============================================
              DAYS
          ============================================= */}

          <div
            className="
              mt-1

              grid
              grid-cols-7
              gap-1
            "
          >
            {calendarCells.map(
              (
                day,
                index
              ) => {
                if (
                  day ===
                  null
                ) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-9"
                    />
                  );
                }

                const selected =
                  selectedDate !==
                    null &&
                  selectedDate.getFullYear() ===
                    displayYear &&
                  selectedDate.getMonth() ===
                    displayMonth &&
                  selectedDate.getDate() ===
                    day;

                return (
                  <button
                    key={
                      day
                    }
                    type="button"
                    onClick={() =>
                      selectDay(
                        day
                      )
                    }
                    className={`
                      flex
                      h-9
                      items-center
                      justify-center

                      rounded-full

                      text-sm
                      font-extrabold

                      transition-all
                      duration-150

                      ${
                        selected
                          ? "bg-blue-600 !text-white shadow-md"
                          : "bg-transparent !text-slate-700 hover:bg-blue-50"
                      }
                    `}
                  >
                    {
                      day
                    }
                  </button>
                );
              }
            )}
          </div>

          {/* =============================================
              FOOTER
          ============================================= */}

          <div
            className="
              mt-3

              flex
              items-center
              justify-between

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
                rounded-[10px]

                px-3
                py-2

                text-xs
                font-extrabold

                !text-red-600

                hover:bg-red-50
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
                rounded-[10px]

                px-3
                py-2

                text-xs
                font-extrabold

                !text-blue-600

                hover:bg-blue-50
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
   HELPERS
========================================================= */

function displayStockValue(
  value: number
) {
  if (
    !value
  ) {
    return "-";
  }

  return value.toLocaleString(
    "th-TH"
  );
}

function normalizeInspectorIds(
  value: string[]
) {
  const result =
    Array<string>(
      3
    ).fill("");

  value
    .slice(
      0,
      3
    )
    .forEach(
      (
        id,
        index
      ) => {
        result[index] =
          String(
            id ?? ""
          );
      }
    );

  return result;
}

function isValidOptionalInteger(
  value: string
) {
  if (
    value.trim() ===
    ""
  ) {
    return true;
  }

  const number =
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number >= 0
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

export default function EditInspectionForm({
  fiscalYear,
  officers,
  initialData,
  submitUrl,
  cancelHref,
}: Props) {
  /* =======================================================
     STATE
  ======================================================= */

  const [
    inspectionDate,
    setInspectionDate,
  ] = useState(
    initialData.inspectionDate
  );

  const [
    inspectorIds,
    setInspectorIds,
  ] = useState<
    string[]
  >(
    () =>
      normalizeInspectorIds(
        initialData.inspectorIds
      )
  );

  const [
    rows,
    setRows,
  ] = useState<
    InspectionRow[]
  >(
    () =>
      initialData.rows.map(
        (
          row
        ) => ({
          ...row,
        })
      )
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState(
    ""
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(
    false
  );

  /* =======================================================
     OFFICER
  ======================================================= */

  function getOfficer(
    id: string
  ) {
    return officers.find(
      (
        officer
      ) =>
        String(
          officer.id
        ) === id
    );
  }

  function isOfficerSelected(
    officerId: string,
    currentIndex: number
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

  function updateInspector(
    index: number,
    value: string
  ) {
    setInspectorIds(
      (
        current
      ) => {
        const next =
          [
            ...current,
          ];

        next[index] =
          value;

        return next;
      }
    );
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredRows =
    useMemo(
      () => {
        const keyword =
          searchTerm
            .trim()
            .toLocaleLowerCase(
              "th"
            );

        const allowedRows = rows.filter((row) => {
          const name = row.name.trim();
          if (/\(สสส\.\)\s*$/u.test(name)) return false;
          if (row.category === "ELECTRIC" && /ถ่านกระดุม/iu.test(name)) return false;
          return true;
        });

        if (!keyword) {
          return allowedRows;
        }

        return allowedRows.filter(
          (
            row
          ) => {
            const searchable =
              [
                row.code,
                row.name,
                row.unit,
                row.category,
                categoryName[
                  row.category
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
                );

            return searchable.includes(
              keyword
            );
          }
        );
      },
      [
        rows,
        searchTerm,
      ]
    );

  /* =======================================================
     GROUP ROWS
  ======================================================= */

  const groupedRows =
    useMemo(
      () => {
        return categoryOrder
          .map(
            (
              category
            ) => ({
              category,

              name:
                categoryName[
                  category
                ] ??
                category,

              rows:
                filteredRows.filter(
                  (
                    row
                  ) =>
                    row.category ===
                    category
                ),
            })
          )
          .filter(
            (
              group
            ) =>
              group.rows
                .length >
              0
          );
      },
      [
        filteredRows,
      ]
    );

  /* =======================================================
     UPDATE ROW
  ======================================================= */

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
    setRows(
      (
        current
      ) =>
        current.map(
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

  function updateAccuracy(
    materialId: number,
    accuracy: string
  ) {
    setRows(
      (
        current
      ) =>
        current.map(
          (
            row
          ) =>
            row.materialId ===
            materialId
              ? {
                  ...row,
                  accuracy,
                }
              : row
        )
    );
  }

  /* =======================================================
     UPDATE ALL VISIBLE ACCURACY

     มีผลเฉพาะรายการที่กำลังแสดงจาก Search
  ======================================================= */

  function updateAllAccuracy(
    accuracy: string
  ) {
    const visibleIds =
      new Set(
        filteredRows.map(
          (
            row
          ) =>
            row.materialId
        )
      );

    setRows(
      (
        current
      ) =>
        current.map(
          (
            row
          ) =>
            visibleIds.has(
              row.materialId
            )
              ? {
                  ...row,
                  accuracy,
                }
              : row
        )
    );
  }

  /* =======================================================
     NUMBER INPUT
  ======================================================= */

  function handleNumberChange(
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
    if (
      value ===
      ""
    ) {
      updateRow(
        materialId,
        field,
        ""
      );

      return;
    }

    if (
      !/^\d+$/.test(
        value
      )
    ) {
      return;
    }

    updateRow(
      materialId,
      field,
      value
    );
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    if (
      isSaving
    ) {
      return;
    }

    /* ===============================================
       DATE
    =============================================== */

    if (
      !inspectionDate
    ) {
      alert(
        "กรุณาระบุวันที่ตรวจสอบ"
      );

      return;
    }

    if (
      !parseDateOnly(
        inspectionDate
      )
    ) {
      alert(
        "รูปแบบวันที่ตรวจสอบไม่ถูกต้อง"
      );

      return;
    }

    /* ===============================================
       INSPECTORS
    =============================================== */

    if (
      inspectorIds.length !==
        3 ||
      inspectorIds.some(
        (
          id
        ) =>
          !id
      )
    ) {
      alert(
        "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน"
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
        "ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้"
      );

      return;
    }

    /* ===============================================
       ROWS
    =============================================== */

    if (
      rows.length ===
      0
    ) {
      alert(
        "ไม่พบรายการพัสดุสำหรับตรวจสอบ"
      );

      return;
    }

    for (
      const row of
      rows
    ) {
      if (
        !row.accuracy
      ) {
        alert(
          `กรุณาระบุผลการตรวจสอบของรายการ "${row.name}"`
        );

        return;
      }

      const numericValues =
        [
          row.shortageQty,
          row.excessQty,
          row.baht,
          row.satang,
          row.damagedQty,
          row.deterioratedQty,
          row.unnecessaryQty,
        ];

      if (
        numericValues.some(
          (
            value
          ) =>
            !isValidOptionalInteger(
              value
            )
        )
      ) {
        alert(
          `จำนวนของรายการ "${row.name}" ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`
        );

        return;
      }
    }

    /* ===============================================
       REQUEST
    =============================================== */

    try {
      setIsSaving(
        true
      );

      const response =
        await fetch(
          submitUrl,
          {
            method:
              "PUT",

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

                  rows:
                    rows.map(
                      (
                        row
                      ) => ({
                        materialId:
                          row.materialId,

                        accuracy:
                          row.accuracy,

                        shortageQty:
                          row.shortageQty,

                        excessQty:
                          row.excessQty,

                        baht:
                          row.baht,

                        satang:
                          row.satang,

                        damagedQty:
                          row.damagedQty,

                        deterioratedQty:
                          row.deterioratedQty,

                        unnecessaryQty:
                          row.unnecessaryQty,

                        remark:
                          row.remark,
                      })
                    ),
                }
              ),
          }
        );

      let data:
        | {
            ok?: boolean;
            message?: string;
            error?: string;
          }
        | null =
        null;

      try {
        data =
          await response.json();
      } catch {
        data =
          null;
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            data?.error ||
            "ไม่สามารถแก้ไขข้อมูลการตรวจสอบได้"
        );
      }

      alert(
        data?.message ||
          "แก้ไขข้อมูลการตรวจสอบเรียบร้อยแล้ว"
      );

      window.location.href =
        cancelHref;
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "เกิดข้อผิดพลาดในการแก้ไขข้อมูล"
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

  /* =======================================================
     FIELD STYLE
  ======================================================= */

  const inspectionHeaderClass = "border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle text-sm font-extrabold !text-white";

  const numberInputClass =
    `
      h-10
      w-full
      min-w-[64px]

      rounded-[10px]

      border
      border-slate-300

      bg-white

      px-2

      text-center
      text-sm
      font-bold
      tabular-nums

      !text-slate-900

      outline-none

      transition

      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-100
    `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        relative

        w-full
        min-w-0

        space-y-5

        sm:space-y-6
      "
    >
      {/* =====================================================
          INSPECTION INFORMATION
      ===================================================== */}

      <AppCard
        className="
          relative
          z-30

          w-full
          min-w-0

          !overflow-visible

          p-4

          sm:p-5
        "
      >
        <div
          className="
            mb-5
          "
        >
          <h2
            className="
              text-xl
              font-black
              tracking-tight

              !text-slate-900
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
            แก้ไขวันที่ตรวจสอบสำหรับปีงบประมาณ{" "}
            {
              fiscalYear
            }
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1

            gap-4

            md:grid-cols-2
          "
        >
          {/* ===============================================
              FISCAL YEAR
          =============================================== */}

          <div
            className="
              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/70

              p-4
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
              ปีงบประมาณ
            </label>

            <div
              className="
                flex
                h-[48px]
                items-center

                rounded-[14px]

                border
                border-slate-200

                bg-slate-100

                px-4

                text-base
                font-extrabold

                !text-slate-800
              "
            >
              พ.ศ.{" "}
              {
                fiscalYear
              }
            </div>
          </div>

          {/* ===============================================
              INSPECTION DATE
          =============================================== */}

          <div
            className="
              relative
              z-40

              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/70

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

                !text-slate-700
              "
            >
              วันที่ตรวจสอบ
            </label>

            <IOSDatePicker
              id="inspectionDate"
              value={
                inspectionDate
              }
              onChange={
                setInspectionDate
              }
            />
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div
        className="
          relative
          z-20
        "
      >
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
          placeholder="ค้นหารหัส / รายการพัสดุ / หน่วยนับ / หมวดหมู่"
          resultCount={
            filteredRows.length
          }
          resultLabel="รายการ"
          showSearchButton
          showClearButton
          searchButtonText="ค้นหา"
          clearButtonText="ล้าง"
        />
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`แก้ไขผลการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${fiscalYear}`}
        badge={`${filteredRows.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          relative
          z-10

          w-full
          min-w-0
          max-w-full
        "
      >
        {/* ===================================================
            QUICK ACTION
        =================================================== */}

        <div
          className="
            border-b
            border-slate-200

            bg-slate-50/70

            p-3

            sm:p-4
          "
        >
          <p
            className="
              mb-3

              text-sm
              font-extrabold

              !text-slate-700
            "
          >
            กำหนดผลให้รายการที่กำลังแสดงทั้งหมด
          </p>

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

        {/* ===================================================
            TABLE SCROLL
        =================================================== */}

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
              min-w-[1710px]

              table-fixed
              border-collapse

              bg-white

              text-[15px]
            "
          >
            <colgroup>
              {[42,372,72,132,84,84,90,60,78,66,66,60,60,84,90,108,162].map((width, index) => (
                <col key={index} style={{ width: `${width}px` }} />
              ))}
            </colgroup>
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr>
                <th rowSpan={2} className={inspectionHeaderClass}>ลำดับ</th>
                <th rowSpan={2} className={inspectionHeaderClass}>ชื่อหรือชนิดวัสดุหรือครุภัณฑ์</th>
                <th rowSpan={2} className={inspectionHeaderClass}>หน่วยนับ</th>
                <th rowSpan={2} className={inspectionHeaderClass}>
                  <div>คงเหลือยอดยกมาเมื่อ</div>
                  <div>30 ก.ย. {String(fiscalYear - 1).slice(-2)}</div>
                </th>
                <th colSpan={2} className={inspectionHeaderClass}>
                  {`01 ต.ค. ${String(fiscalYear - 1).slice(-2)} - 30 ก.ย. ${String(fiscalYear).slice(-2)}`}
                </th>
                <th rowSpan={2} className={inspectionHeaderClass}>คงเหลือปัจจุบัน</th>
                <th rowSpan={2} className={inspectionHeaderClass}>ถูกต้อง</th>
                <th rowSpan={2} className={inspectionHeaderClass}>ไม่ถูกต้อง</th>
                <th colSpan={4} className={inspectionHeaderClass}>รายละเอียดกรณีไม่ถูกต้อง</th>
                <th rowSpan={2} className={inspectionHeaderClass}>ชำรุด</th>
                <th rowSpan={2} className={inspectionHeaderClass}>เสื่อมสภาพ</th>
                <th rowSpan={2} className={inspectionHeaderClass}>ไม่จำเป็นต้องใช้</th>
                <th rowSpan={2} className={inspectionHeaderClass}>หมายเหตุ</th>
              </tr>
              <tr>
                {["รับ", "จ่าย", "ขาด", "เกิน", "บาท", "สต."].map((title) => (
                  <th key={title} className={`${inspectionHeaderClass} !py-1`}>{title}</th>
                ))}
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {groupedRows.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      17
                    }
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-14

                      text-center
                      text-base
                      font-bold

                      !text-slate-500
                    "
                  >
                    ไม่พบรายการพัสดุ
                  </td>
                </tr>
              ) : (
                groupedRows.map(
                  (
                    group
                  ) => (
                    <CategoryRows
                      key={
                        group.category
                      }
                      categoryName={
                        group.name
                      }
                      rows={
                        group.rows
                      }
                      numberInputClass={
                        numberInputClass
                      }
                      onAccuracyChange={
                        updateAccuracy
                      }
                      onNumberChange={
                        handleNumberChange
                      }
                      onRemarkChange={(
                        materialId,
                        value
                      ) =>
                        updateRow(
                          materialId,
                          "remark",
                          value
                        )
                      }
                    />
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
          z-20

          w-full
          min-w-0

          !overflow-visible

          p-4

          sm:p-5
        "
      >
        <div>
          <h2
            className="
              text-xl
              font-black
              tracking-tight

              !text-slate-900
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
            เลือกผู้ตรวจสอบจำนวน 3 คน โดยไม่สามารถเลือกรายชื่อซ้ำกันได้
          </p>
        </div>

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
              const officerOptions =
                officers
                  .filter(
                    (
                      officer
                    ) => {
                      const officerId =
                        String(
                          officer.id
                        );

                      return (
                        officerId ===
                          inspectorId ||
                        !isOfficerSelected(
                          officerId,
                          index
                        )
                      );
                    }
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

                      description:
                        [
                          officer.position,
                          officer.department
                            ?.name,
                          officer.section
                            ?.name,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " / "
                          ),
                    })
                  );

              return (
                <div
                  key={
                    index
                  }
                  className="
                    relative
                    min-w-0

                    rounded-[18px]

                    border
                    border-slate-200/80

                    bg-slate-50/60

                    p-4
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

                  <AppSearchableSelect
                    value={
                      inspectorId
                    }
                    options={
                      officerOptions
                    }
                    placeholder="เลือกผู้ตรวจสอบ"
                    searchPlaceholder="พิมพ์ชื่อ / นามสกุล / ตำแหน่ง / กลุ่มงาน..."
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

                  {inspectorId && (
                    <p
                      className="
                        mt-2

                        text-xs
                        font-semibold

                        !text-slate-500
                      "
                    >
                      ตำแหน่ง:{" "}
                      {getOfficer(
                        inspectorId
                      )
                        ?.position ||
                        "-"}
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>
      </AppCard>

      {/* =====================================================
          ACTION
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
          href={
            cancelHref
          }
          variant="back"
          size="md"
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
          disabled={
            isSaving
          }
          onClick={
            handleSave
          }
        >
          {isSaving
            ? "กำลังบันทึก..."
            : "บันทึกการแก้ไข"}
        </AppButton>
      </div>
    </div>
  );
}

/* =========================================================
   CATEGORY ROWS
========================================================= */

function CategoryRows({
  categoryName,
  rows,
  numberInputClass,
  onAccuracyChange,
  onNumberChange,
  onRemarkChange,
}: {
  categoryName: string;

  rows: InspectionRow[];

  numberInputClass: string;

  onAccuracyChange: (
    materialId: number,
    accuracy: string
  ) => void;

  onNumberChange: (
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

  onRemarkChange: (
    materialId: number,
    value: string
  ) => void;
}) {
  return (
    <>
      {/* =====================================================
          CATEGORY HEADER
      ===================================================== */}

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
            categoryName
          }
        </td>
      </tr>

      {/* =====================================================
          ROWS
      ===================================================== */}

      {rows.map(
        (
          row,
          index
        ) => (
          <tr
            key={
              row.materialId
            }
            className={`
              transition-colors
              duration-150

              hover:bg-blue-50/70

              ${
                index %
                  2 ===
                0
                  ? "bg-white"
                  : "bg-slate-50/70"
              }
            `}
          >
            {/* ===========================================
                ORDER
            =========================================== */}

            <td
              className="
                border
                border-black

                px-2
                py-3

                text-center
                font-extrabold

                !text-slate-800
              "
            >
              {(
                index +
                1
              ).toLocaleString(
                "th-TH"
              )}
            </td>

            {/* ===========================================
                MATERIAL
            =========================================== */}

            <td
              className="
                min-w-[280px]

                border
                border-black

                px-3
                py-3

                text-left
              "
            >
              <div
                className="
                  font-extrabold

                  !text-slate-900
                "
              >
                {
                  row.name
                }
              </div>

              <div
                className="
                  mt-1

                  text-xs
                  font-semibold

                  !text-slate-500
                "
              >
                รหัส{" "}
                {
                  row.code
                }
              </div>
            </td>

            {/* ===========================================
                UNIT
            =========================================== */}

            <td
              className="
                min-w-[90px]

                border
                border-black

                px-2
                py-3

                text-center
                font-bold

                !text-slate-700
              "
            >
              {row.unit ||
                "-"}
            </td>

            {/* ===========================================
                OPENING
            =========================================== */}

            <td
              className="
                min-w-[110px]

                border
                border-black

                px-2
                py-3

                text-center
                font-extrabold
                tabular-nums

                !text-slate-800
              "
            >
              {displayStockValue(
                row.openingQty
              )}
            </td>

            {/* ===========================================
                RECEIVE
            =========================================== */}

            <td
              className="
                min-w-[80px]

                border
                border-black

                px-2
                py-3

                text-center
                font-extrabold
                tabular-nums

                !text-slate-800
              "
            >
              {displayStockValue(
                row.receiveQty
              )}
            </td>

            {/* ===========================================
                ISSUE
            =========================================== */}

            <td
              className="
                min-w-[80px]

                border
                border-black

                px-2
                py-3

                text-center
                font-extrabold
                tabular-nums

                !text-slate-800
              "
            >
              {displayStockValue(
                row.issueQty
              )}
            </td>

            {/* ===========================================
                CLOSING
            =========================================== */}

            <td
              className="
                min-w-[80px]

                border
                border-black

                px-2
                py-3

                text-center
                font-extrabold
                tabular-nums

                !text-slate-900
              "
            >
              {displayStockValue(
                row.closingQty
              )}
            </td>

            {/* ===========================================
                CORRECT
            =========================================== */}

            <td
              className="
                min-w-[80px]

                border
                border-black

                px-2
                py-3

                text-center
              "
            >
              <input
                type="radio"
                name={`accuracy-${row.materialId}`}
                checked={
                  row.accuracy ===
                  "CORRECT"
                }
                onChange={() =>
                  onAccuracyChange(
                    row.materialId,
                    "CORRECT"
                  )
                }
                className="
                  h-5
                  w-5

                  cursor-pointer

                  accent-emerald-600
                "
                aria-label={`${row.name} ถูกต้อง`}
              />
            </td>

            {/* ===========================================
                INCORRECT
            =========================================== */}

            <td
              className="
                min-w-[90px]

                border
                border-black

                px-2
                py-3

                text-center
              "
            >
              <input
                type="radio"
                name={`accuracy-${row.materialId}`}
                checked={
                  row.accuracy ===
                  "INCORRECT"
                }
                onChange={() =>
                  onAccuracyChange(
                    row.materialId,
                    "INCORRECT"
                  )
                }
                className="
                  h-5
                  w-5

                  cursor-pointer

                  accent-red-600
                "
                aria-label={`${row.name} ไม่ถูกต้อง`}
              />
            </td>

            {/* ===========================================
                SHORTAGE
            =========================================== */}

            <td
              className="
                min-w-[90px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.shortageQty
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "shortageQty",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                EXCESS
            =========================================== */}

            <td
              className="
                min-w-[90px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.excessQty
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "excessQty",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                BAHT
            =========================================== */}

            <td
              className="
                min-w-[80px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.baht
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "baht",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                SATANG
            =========================================== */}

            <td
              className="
                min-w-[80px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.satang
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "satang",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                DAMAGED
            =========================================== */}

            <td
              className="
                min-w-[90px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.damagedQty
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "damagedQty",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                DETERIORATED
            =========================================== */}

            <td
              className="
                min-w-[100px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.deterioratedQty
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "deterioratedQty",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                UNNECESSARY
            =========================================== */}

            <td
              className="
                min-w-[130px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                inputMode="numeric"
                value={
                  row.unnecessaryQty
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onNumberChange(
                    row.materialId,
                    "unnecessaryQty",
                    event.target
                      .value
                  )
                }
                className={
                  numberInputClass
                }
              />
            </td>

            {/* ===========================================
                REMARK
            =========================================== */}

            <td
              className="
                min-w-[220px]

                border
                border-black

                px-2
                py-2
              "
            >
              <input
                type="text"
                value={
                  row.remark
                }
                placeholder="-"
                onChange={(
                  event
                ) =>
                  onRemarkChange(
                    row.materialId,
                    event.target
                      .value
                  )
                }
                className="
                  h-10
                  w-full

                  rounded-[10px]

                  border
                  border-slate-300

                  bg-white

                  px-3

                  text-sm
                  font-semibold

                  !text-slate-900

                  outline-none

                  transition

                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </td>
          </tr>
        )
      )}
    </>
  );
}
