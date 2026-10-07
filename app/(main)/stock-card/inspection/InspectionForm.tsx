"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

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

  /*
   * ยอดยกเข้าระบบ ณ 1 ต.ค.
   *
   * ตัวอย่าง FY2569:
   * =
   * ยอดยกเข้าระบบ ณ 01 ต.ค.68
   *
   * บนแบบตรวจแสดงเป็น
   * คงเหลือยอดยกมาเมื่อ 30 ก.ย.68
   */
  openingBalance: number;

  /*
   * รับจริงภายในปีงบประมาณ
   *
   * ไม่รวมยอดยกเข้าระบบ
   */
  receiveQty: number;

  /*
   * จ่ายจริง APPROVED
   * ภายในปีงบประมาณ
   */
  issueQty: number;

  /*
   * คงเหลือจริงตาม Stock Card ปัจจุบัน
   */
  closingBalance: number;
};

type Officer = {
  id: number;

  firstName: string;
  lastName: string;
  position: string;

  type: string;

  departmentId:
    | number
    | null;

  sectionId:
    | number
    | null;

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

  onChange: (
    value: string
  ) => void;
};

type PopupPosition = {
  top: number;
  left: number;
  width: number;
};

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

const CATEGORY_NAME: Record<
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
   PARSE DATE
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
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

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

/* =========================================================
   DATE VALUE
========================================================= */

function toDateValue(
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

/* =========================================================
   THAI DATE
========================================================= */

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
    THAI_MONTHS[
      date.getMonth()
    ]
  } ${
    date.getFullYear() +
    543
  }`;
}

/* =========================================================
   IOS DATE PICKER

   ใช้ Portal
   เพื่อไม่ให้ Calendar ถูก Card/Table บัง
========================================================= */

function IOSDatePicker({
  id,
  value,
  onChange,
}: IOSDatePickerProps) {
  const buttonRef =
    useRef<HTMLButtonElement>(
      null
    );

  const popupRef =
    useRef<HTMLDivElement>(
      null
    );

  const selectedDate =
    parseDateOnly(
      value
    );

  const fallbackDate =
    parseDateOnly(
      getCurrentDate()
    ) ??
    new Date();

  const initialDate =
    selectedDate ??
    fallbackDate;

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    mounted,
    setMounted,
  ] =
    useState(
      false
    );

  const [
    popupPosition,
    setPopupPosition,
  ] =
    useState<PopupPosition>({
      top: 0,
      left: 0,
      width: 330,
    });

  const [
    displayYear,
    setDisplayYear,
  ] =
    useState(
      initialDate.getFullYear()
    );

  const [
    displayMonth,
    setDisplayMonth,
  ] =
    useState(
      initialDate.getMonth()
    );

  /* =======================================================
     MOUNT
  ======================================================= */

  useEffect(
    () => {
      setMounted(
        true
      );
    },
    []
  );

  /* =======================================================
     SYNC SELECTED DATE
  ======================================================= */

  useEffect(
    () => {
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
    },
    [value]
  );

  /* =======================================================
     POSITION POPUP
  ======================================================= */

  function updatePopupPosition() {
    const button =
      buttonRef.current;

    if (!button) {
      return;
    }

    const rect =
      button.getBoundingClientRect();

    const popupWidth =
      Math.min(
        330,
        window.innerWidth -
          24
      );

    let left =
      rect.left;

    if (
      left +
        popupWidth >
      window.innerWidth -
        12
    ) {
      left =
        window.innerWidth -
        popupWidth -
        12;
    }

    if (
      left < 12
    ) {
      left =
        12;
    }

    setPopupPosition({
      top:
        rect.bottom +
        6,

      left,

      width:
        popupWidth,
    });
  }

  /* =======================================================
     OPEN EVENTS
  ======================================================= */

  useEffect(
    () => {
      if (!open) {
        return;
      }

      updatePopupPosition();

      function handleResize() {
        updatePopupPosition();
      }

      function handleScroll() {
        updatePopupPosition();
      }

      function handleMouseDown(
        event: MouseEvent
      ) {
        const target =
          event.target as Node;

        if (
          buttonRef.current?.contains(
            target
          )
        ) {
          return;
        }

        if (
          popupRef.current?.contains(
            target
          )
        ) {
          return;
        }

        setOpen(
          false
        );
      }

      window.addEventListener(
        "resize",
        handleResize
      );

      window.addEventListener(
        "scroll",
        handleScroll,
        true
      );

      document.addEventListener(
        "mousedown",
        handleMouseDown
      );

      return () => {
        window.removeEventListener(
          "resize",
          handleResize
        );

        window.removeEventListener(
          "scroll",
          handleScroll,
          true
        );

        document.removeEventListener(
          "mousedown",
          handleMouseDown
        );
      };
    },
    [open]
  );

  /* =======================================================
     CALENDAR
  ======================================================= */

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
    let index = 0;
    index < firstDay;
    index++
  ) {
    calendarCells.push(
      null
    );
  }

  for (
    let day = 1;
    day <= daysInMonth;
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

  /* =======================================================
     MONTH
  ======================================================= */

  function previousMonth() {
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
          current - 1
      );

      return;
    }

    setDisplayMonth(
      (
        current
      ) =>
        current - 1
    );
  }

  function nextMonth() {
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
          current + 1
      );

      return;
    }

    setDisplayMonth(
      (
        current
      ) =>
        current + 1
    );
  }

  /* =======================================================
     SELECT
  ======================================================= */

  function selectDay(
    day: number
  ) {
    onChange(
      toDateValue(
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
        getCurrentDate()
      );

    if (!today) {
      return;
    }

    onChange(
      toDateValue(
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <button
        ref={
          buttonRef
        }
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={
          open
        }
        onClick={() => {
          updatePopupPosition();

          setOpen(
            (
              current
            ) =>
              !current
          );
        }}
        className="
          flex
          h-[46px]
          w-full
          min-w-0

          items-center
          justify-between

          gap-3

          rounded-[12px]

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
            shrink-0
          "
        >
          📅
        </span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={
              popupRef
            }
            role="dialog"
            style={{
              position:
                "fixed",

              top:
                popupPosition.top,

              left:
                popupPosition.left,

              width:
                popupPosition.width,
            }}
            className="
              z-[99999]

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
                  previousMonth
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
                    THAI_MONTHS[
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
                  nextMonth
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

                  hover:bg-slate-200
                "
              >
                ›
              </button>
            </div>

            {/* =============================================
                WEEK
            ============================================= */}

            <div
              className="
                grid
                grid-cols-7

                gap-1
              "
            >
              {THAI_WEEK_DAYS.map(
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
                    {day}
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

                        transition

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
          </div>,
          document.body
        )}
    </>
  );
}

/* =========================================================
   INITIAL ROW
========================================================= */

function createInitialRows(
  materials: Material[]
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
   DISPLAY STOCK

   เหมือน PDF
   0 = -
========================================================= */

function displayStockValue(
  value: number
) {
  if (
    !Number.isFinite(
      value
    ) ||
    value === 0
  ) {
    return "-";
  }

  return value.toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   INTEGER VALIDATION
========================================================= */

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
   FORM
========================================================= */

export default function InspectionForm({
  fiscalYear,
  startShortYear,
  endShortYear,
  materials,
  officers,
}: Props) {
  /* =======================================================
     DATES
  ======================================================= */

  const [
    inspectionStartDate,
    setInspectionStartDate,
  ] =
    useState(
      getCurrentDate()
    );

  const [
    inspectionEndDate,
    setInspectionEndDate,
  ] =
    useState(
      getCurrentDate()
    );

  /* =======================================================
     INSPECTION ROWS
  ======================================================= */

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

  /* =======================================================
     INSPECTORS
  ======================================================= */

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

  /* =======================================================
     SEARCH
  ======================================================= */

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState(
      ""
    );

  /* =======================================================
     CATEGORY
  ======================================================= */

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState(
      "ALL"
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  /* =======================================================
     MATERIAL MAP
  ======================================================= */

  const materialMap =
    useMemo(
      () =>
        new Map(
          materials.map(
            (
              material
            ) => [
              material.materialId,
              material,
            ]
          )
        ),
      [
        materials,
      ]
    );

  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categoryOptions =
    useMemo(
      () => [
        {
          value:
            "ALL",

          label:
            "ทุกหมวด",
        },

        ...CATEGORY_ORDER.map(
          (
            category
          ) => ({
            value:
              category,

            label:
              CATEGORY_NAME[
                category
              ] ??
              category,
          })
        ),
      ],
      []
    );

  /* =======================================================
     FILTER
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

        return materials.filter(
          (
            material
          ) => {
            if (
              selectedCategory !==
                "ALL" &&
              material.category !==
                selectedCategory
            ) {
              return false;
            }

            if (
              !keyword
            ) {
              return true;
            }

            const searchable =
              [
                material.code,
                material.name,
                material.unit,
                CATEGORY_NAME[
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
                );

            return searchable.includes(
              keyword
            );
          }
        );
      },
      [
        materials,
        searchTerm,
        selectedCategory,
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

              name:
                CATEGORY_NAME[
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
              group.materials
                .length > 0
          ),
      [
        filteredMaterials,
      ]
    );

  /* =======================================================
     ROW GET
  ======================================================= */

  function getRow(
    materialId: number
  ) {
    return rows.find(
      (
        row
      ) =>
        row.materialId ===
        materialId
    );
  }

  /* =======================================================
     UPDATE
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
     QUICK ACTION

     เฉพาะรายการที่กำลังแสดง
  ======================================================= */

  function updateVisibleAccuracy(
    accuracy: string
  ) {
    const visibleIds =
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
     NUMBER FIELD
  ======================================================= */

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
     INSPECTOR
  ======================================================= */

  function updateInspector(
    index: number,
    officerId: string
  ) {
    setInspectorIds(
      (
        current
      ) => {
        const next = [
          ...current,
        ];

        next[index] =
          officerId;

        return next;
      }
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

  function getOfficer(
    officerId: string
  ) {
    return officers.find(
      (
        officer
      ) =>
        String(
          officer.id
        ) ===
        officerId
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
      !inspectionStartDate ||
      !inspectionEndDate
    ) {
      alert(
        "กรุณาระบุวันที่เริ่มตรวจสอบและวันที่ตรวจสอบแล้วเสร็จ"
      );

      return;
    }

    const startDate =
      parseDateOnly(
        inspectionStartDate
      );

    const endDate =
      parseDateOnly(
        inspectionEndDate
      );

    if (
      !startDate ||
      !endDate
    ) {
      alert(
        "รูปแบบวันที่ตรวจสอบไม่ถูกต้อง"
      );

      return;
    }

    if (
      endDate.getTime() <
      startDate.getTime()
    ) {
      alert(
        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ"
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
      const row of rows
    ) {
      const material =
        materialMap.get(
          row.materialId
        );

      if (
        !row.accuracy
      ) {
        alert(
          `กรุณาระบุผลการตรวจสอบของรายการ "${
            material?.name ??
            row.materialId
          }"`
        );

        return;
      }

      const numericValues = [
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
          `จำนวนของรายการ "${
            material?.name ??
            row.materialId
          }" ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`
        );

        return;
      }
    }

    /* ===============================================
       API
    =============================================== */

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

                  inspectionDate:
                    inspectionStartDate,

                  inspectionEndDate,

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
            "ไม่สามารถบันทึกข้อมูลการตรวจสอบได้"
        );
      }

      alert(
        data?.message ||
          "บันทึกผลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว"
      );

      window.location.href =
        `/stock-card/inspection-history?fiscalYear=${fiscalYear}`;
    } catch (
      error
    ) {
      console.error(
        "Save stock card inspection error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูลการตรวจสอบ"
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

  /* =======================================================
     INPUT

     ตารางหน้าจอเลียนแบบ PDF
     ฟอนต์ข้อมูล 12px
  ======================================================= */

  const tableInputClass = `
    h-[22px]
    w-full
    min-w-0

    rounded-none

    border-0

    bg-transparent

    px-1

    text-center
    text-[12px]
    font-normal
    leading-none

    tabular-nums

    !text-black

    outline-none

    placeholder:!text-slate-300

    focus:bg-blue-50
    focus:ring-0
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

        space-y-4
      "
    >
      {/* =====================================================
          1. INSPECTION INFO

          เตี้ย / เรียบ
          และ Calendar ไม่โดน Card บัง
      ===================================================== */}

      <div
        className="
          relative
          z-[100]
        "
      >
        <AppCard
          padding={
            false
          }
          className="
            !overflow-visible
            !rounded-[18px]
          "
        >
          <div
            className="
              relative

              p-3

              sm:p-4
            "
          >
            <div
              className="
                flex
                flex-col

                gap-3

                lg:flex-row
                lg:items-end
              "
            >
              {/* =============================================
                  TITLE
              ============================================= */}

              <div
                className="
                  shrink-0

                  lg:w-[190px]
                "
              >
                <h2
                  className="
                    text-lg
                    font-black

                    !text-slate-900
                  "
                >
                  ข้อมูลการตรวจสอบ
                </h2>
              </div>

              {/* =============================================
                  START DATE
              ============================================= */}

              <div
                className="
                  grid
                  min-w-0
                  flex-1

                  grid-cols-1

                  gap-3

                  md:grid-cols-2
                "
              >
                <div
                  className="
                    min-w-0
                  "
                >
                  <label
                    htmlFor="inspectionStartDate"
                    className="
                      mb-1.5
                      block

                      text-sm
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    วันที่เริ่มตรวจสอบ
                  </label>

                  <IOSDatePicker
                    id="inspectionStartDate"
                    value={
                      inspectionStartDate
                    }
                    onChange={
                      setInspectionStartDate
                    }
                  />
                </div>

                {/* ===========================================
                    END DATE
                =========================================== */}

                <div
                  className="
                    min-w-0
                  "
                >
                  <label
                    htmlFor="inspectionEndDate"
                    className="
                      mb-1.5
                      block

                      text-sm
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    วันที่ตรวจสอบแล้วเสร็จ
                  </label>

                  <IOSDatePicker
                    id="inspectionEndDate"
                    value={
                      inspectionEndDate
                    }
                    onChange={
                      setInspectionEndDate
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      {/* =====================================================
          2. SEARCH
      ===================================================== */}

      <div
        className="
          relative
          z-10
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
          placeholder="ค้นหารหัส / ชื่อหรือชนิดวัสดุหรือครุภัณฑ์"
          resultCount={
            filteredMaterials.length
          }
          resultLabel="รายการ"
          showSearchButton
          showClearButton
          searchButtonText="ค้นหา"
          clearButtonText="ล้าง"
        />
      </div>

      {/* =====================================================
          3. INSPECTION TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        badge={`${filteredMaterials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          relative
          z-0

          w-full
          min-w-0
        "
      >
        {/* ===================================================
            CONTROL
        =================================================== */}

        <div
          className="
            border-b
            border-slate-300

            bg-white

            p-3
          "
        >
          <div
            className="
              flex
              flex-col

              gap-3

              xl:flex-row
              xl:items-end
              xl:justify-between
            "
          >
            {/* ===============================================
                CATEGORY
            =============================================== */}

            <div
              className="
                relative
                z-20

                w-full

                sm:max-w-[420px]
              "
            >
              <label
                className="
                  mb-1.5
                  block

                  text-sm
                  font-extrabold

                  !text-slate-700
                "
              >
                เลือกหมวด
              </label>

              <AppSearchableSelect
                value={
                  selectedCategory
                }
                options={
                  categoryOptions
                }
                placeholder="เลือกหมวด"
                searchPlaceholder="พิมพ์ค้นหาหมวด..."
                emptyText="ไม่พบหมวด"
                onChange={
                  setSelectedCategory
                }
              />
            </div>

            {/* ===============================================
                BUTTON
            =============================================== */}

            <div
              className="
                flex
                flex-wrap
                items-center

                gap-2
              "
            >
              <AppButton
                type="button"
                variant="success"
                size="sm"
                onClick={() =>
                  updateVisibleAccuracy(
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
                  updateVisibleAccuracy(
                    "INCORRECT"
                  )
                }
              >
                ไม่ถูกต้องทั้งหมด
              </AppButton>

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
                materials={
                  filteredMaterials
                }
                rows={
                  rows
                }
                inspectionStartDate={
                  inspectionStartDate
                }
                inspectionEndDate={
                  inspectionEndDate
                }
                inspectorIds={
                  inspectorIds
                }
                officers={
                  officers
                }
              />
            </div>
          </div>
        </div>

        {/* ===================================================
            DOCUMENT TABLE

            ทำหน้าตาคล้าย PDF

            - หัวขาว
            - ตัวหนังสือดำ
            - เส้นดำ
            - หัว 14px
            - ข้อมูล 12px
            - หมวดอยู่ในตาราง
            - หมวดไม่มีพื้นหลัง
        =================================================== */}

        <div
          className="
            w-full
            min-w-0

            overflow-x-auto
            overscroll-x-contain

            bg-white
          "
        >
          <table
            className="
              w-full
              min-w-[1710px]

              table-fixed
              border-collapse

              bg-white

              text-[12px]

              !text-black
            "
          >
            {/* =================================================
                SAME RATIO AS PDF
            ================================================= */}

            <colgroup>
              <col
                style={{
                  width:
                    "42px",
                }}
              />

              <col
                style={{
                  width:
                    "372px",
                }}
              />

              <col
                style={{
                  width:
                    "72px",
                }}
              />

              <col
                style={{
                  width:
                    "132px",
                }}
              />

              <col
                style={{
                  width:
                    "84px",
                }}
              />

              <col
                style={{
                  width:
                    "84px",
                }}
              />

              <col
                style={{
                  width:
                    "90px",
                }}
              />

              <col
                style={{
                  width:
                    "60px",
                }}
              />

              <col
                style={{
                  width:
                    "78px",
                }}
              />

              <col
                style={{
                  width:
                    "66px",
                }}
              />

              <col
                style={{
                  width:
                    "66px",
                }}
              />

              <col
                style={{
                  width:
                    "60px",
                }}
              />

              <col
                style={{
                  width:
                    "60px",
                }}
              />

              <col
                style={{
                  width:
                    "84px",
                }}
              />

              <col
                style={{
                  width:
                    "90px",
                }}
              />

              <col
                style={{
                  width:
                    "108px",
                }}
              />

              <col
                style={{
                  width:
                    "162px",
                }}
              />
            </colgroup>

            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr>
                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  ลำดับ
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  ชื่อหรือชนิดวัสดุหรือครุภัณฑ์
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  หน่วยนับ
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  <div
                    className="
                      leading-tight
                    "
                  >
                    <div>
                      คงเหลือยอดยกมาเมื่อ
                    </div>

                    <div>
                      30 ก.ย.{" "}
                      {
                        startShortYear
                      }
                    </div>
                  </div>
                </PdfStyleHeader>

                <PdfStyleHeader
                  colSpan={
                    2
                  }
                >
                  {`01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`}
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  คงเหลือปัจจุบัน
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  ถูกต้อง
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  ไม่ถูกต้อง
                </PdfStyleHeader>

                <PdfStyleHeader
                  colSpan={
                    4
                  }
                >
                  รายละเอียดกรณีไม่ถูกต้อง
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  ชำรุด
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  เสื่อมสภาพ
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  ไม่จำเป็นต้องใช้
                </PdfStyleHeader>

                <PdfStyleHeader
                  rowSpan={
                    2
                  }
                >
                  หมายเหตุ
                </PdfStyleHeader>
              </tr>

              <tr>
                {[
                  "รับ",
                  "จ่าย",
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                ].map(
                  (
                    title
                  ) => (
                    <PdfStyleHeader
                      key={
                        title
                      }
                    >
                      {title}
                    </PdfStyleHeader>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {groupedMaterials.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      17
                    }
                    className="
                      h-[60px]

                      border
                      border-black

                      bg-white

                      text-center
                      text-sm
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
                    <MaterialCategoryRows
                      key={
                        group.category
                      }
                      categoryName={
                        group.name
                      }
                      materials={
                        group.materials
                      }
                      getRow={
                        getRow
                      }
                      inputClass={
                        tableInputClass
                      }
                      updateAccuracy={
                        updateAccuracy
                      }
                      updateNumberField={
                        updateNumberField
                      }
                      updateRemark={(
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
          4. COMMITTEE

          ปรับเป็นขาวแบบเอกสาร
      ===================================================== */}

      <AppCard
        className="
          relative
          z-10

          w-full
          min-w-0

          !overflow-visible
          !p-4
        "
      >
        <div
          className="
            border-b
            border-slate-200

            pb-3
          "
        >
          <h2
            className="
              text-xl
              font-black

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
            mt-4

            grid
            grid-cols-1

            gap-3

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
                      const value =
                        String(
                          officer.id
                        );

                      return (
                        value ===
                          inspectorId ||
                        !isOfficerSelected(
                          value,
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

              const selectedOfficer =
                getOfficer(
                  inspectorId
                );

              return (
                <div
                  key={
                    index
                  }
                  className="
                    relative
                    min-w-0

                    rounded-[14px]

                    border
                    border-slate-300

                    bg-white

                    p-3
                  "
                >
                  <label
                    className="
                      mb-2
                      block

                      text-sm
                      font-extrabold

                      !text-slate-800
                    "
                  >
                    {index === 0
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
                      officerId
                    ) =>
                      updateInspector(
                        index,
                        officerId
                      )
                    }
                  />

                  {selectedOfficer && (
                    <div
                      className="
                        mt-3

                        border-t
                        border-slate-200

                        pt-2

                        text-center
                      "
                    >
                      <div
                        className="
                          text-sm
                          font-bold

                          !text-slate-900
                        "
                      >
                        {selectedOfficer.firstName}{" "}
                        {selectedOfficer.lastName}
                      </div>

                      <div
                        className="
                          mt-0.5

                          text-xs
                          font-semibold

                          !text-slate-500
                        "
                      >
                        {selectedOfficer.position ||
                          "-"}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </AppCard>

      {/* =====================================================
          5. ACTION
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
        {/* =================================================
            CANCEL
            ตัวกลางสีน้ำเงิน
        ================================================= */}

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

        {/* =================================================
            SAVE
        ================================================= */}

        <AppButton
          type="button"
          variant="success"
          size="md"
          icon={
            <span
              aria-hidden="true"
            >
              💾
            </span>
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

/* =========================================================
   PDF STYLE HEADER

   หน้าจอให้คล้าย PDF:
   - พื้นขาว
   - ขอบดำ
   - ตัวหนา
   - Font 14px
========================================================= */

function PdfStyleHeader({
  children,
  rowSpan,
  colSpan,
}: {
  children:
    React.ReactNode;

  rowSpan?:
    number;

  colSpan?:
    number;
}) {
  return (
    <th
      rowSpan={
        rowSpan
      }
      colSpan={
        colSpan
      }
      className="
        border
        border-black

        bg-white

        px-1
        py-1.5

        text-center
        align-middle
        text-[14px]
        font-black
        leading-tight

        !text-black
      "
    >
      {children}
    </th>
  );
}

/* =========================================================
   CATEGORY + MATERIAL ROWS

   ให้เหมือน PDF:

   - หมวดอยู่ด้านในตาราง
   - ก่อนลำดับ 1
   - ไม่มีสีพื้น
   - หมวดตัวหนา
   - เลขเริ่มใหม่ทุกหมวด
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

  getRow: (
    materialId: number
  ) =>
    | InspectionRow
    | undefined;

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
      {/* =====================================================
          CATEGORY
      ===================================================== */}

      <tr
        className="
          bg-white
        "
      >
        <td
          colSpan={
            17
          }
          className="
            h-[23.25px]

            border
            border-black

            bg-white

            px-2
            py-1

            text-left
            text-[14px]
            font-black
            leading-tight

            !text-black
          "
        >
          {categoryName}
        </td>
      </tr>

      {/* =====================================================
          MATERIAL
      ===================================================== */}

      {materials.map(
        (
          material,
          index
        ) => {
          const row =
            getRow(
              material.materialId
            );

          if (!row) {
            return null;
          }

          return (
            <tr
              key={
                material.materialId
              }
              className="
                bg-white

                transition-colors

                hover:bg-blue-50/40
              "
            >
              {/* ===========================================
                  1 ORDER
              =========================================== */}

              <PdfDataCell>
                {index +
                  1}
              </PdfDataCell>

              {/* ===========================================
                  2 NAME
              =========================================== */}

              <td
                className="
                  min-h-[23.25px]

                  border
                  border-black

                  bg-white

                  px-2
                  py-1

                  text-left
                  text-[12px]
                  font-normal
                  leading-tight

                  !text-black
                "
              >
                {material.name}
              </td>

              {/* ===========================================
                  3 UNIT
              =========================================== */}

              <PdfDataCell>
                {material.unit ||
                  "-"}
              </PdfDataCell>

              {/* ===========================================
                  4 OPENING BALANCE

                  ยอดยกเข้าระบบ ณ 1 ต.ค.
              =========================================== */}

              <PdfDataCell
                numeric
              >
                {displayStockValue(
                  material.openingBalance
                )}
              </PdfDataCell>

              {/* ===========================================
                  5 RECEIVE

                  รับจริงในปีเท่านั้น
                  ไม่รวมยอดยก
              =========================================== */}

              <PdfDataCell
                numeric
              >
                {displayStockValue(
                  material.receiveQty
                )}
              </PdfDataCell>

              {/* ===========================================
                  6 ISSUE
              =========================================== */}

              <PdfDataCell
                numeric
              >
                {displayStockValue(
                  material.issueQty
                )}
              </PdfDataCell>

              {/* ===========================================
                  7 CURRENT BALANCE
              =========================================== */}

              <PdfDataCell
                numeric
              >
                {displayStockValue(
                  material.closingBalance
                )}
              </PdfDataCell>

              {/* ===========================================
                  8 CORRECT
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  bg-white

                  p-0

                  text-center
                  align-middle
                "
              >
                <input
                  type="radio"
                  name={`accuracy-${material.materialId}`}
                  checked={
                    row.accuracy ===
                    "CORRECT"
                  }
                  onChange={() =>
                    updateAccuracy(
                      material.materialId,
                      "CORRECT"
                    )
                  }
                  className="
                    h-4
                    w-4

                    cursor-pointer

                    accent-emerald-600
                  "
                />
              </td>

              {/* ===========================================
                  9 INCORRECT
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  bg-white

                  p-0

                  text-center
                  align-middle
                "
              >
                <input
                  type="radio"
                  name={`accuracy-${material.materialId}`}
                  checked={
                    row.accuracy ===
                    "INCORRECT"
                  }
                  onChange={() =>
                    updateAccuracy(
                      material.materialId,
                      "INCORRECT"
                    )
                  }
                  className="
                    h-4
                    w-4

                    cursor-pointer

                    accent-red-600
                  "
                />
              </td>

              {/* ===========================================
                  10 SHORTAGE
              =========================================== */}

              <CompactNumberCell
                value={
                  row.shortageQty
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "shortageQty",
                    value
                  )
                }
              />

              {/* ===========================================
                  11 EXCESS
              =========================================== */}

              <CompactNumberCell
                value={
                  row.excessQty
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "excessQty",
                    value
                  )
                }
              />

              {/* ===========================================
                  12 BAHT
              =========================================== */}

              <CompactNumberCell
                value={
                  row.baht
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "baht",
                    value
                  )
                }
              />

              {/* ===========================================
                  13 SATANG
              =========================================== */}

              <CompactNumberCell
                value={
                  row.satang
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "satang",
                    value
                  )
                }
              />

              {/* ===========================================
                  14 DAMAGED
              =========================================== */}

              <CompactNumberCell
                value={
                  row.damagedQty
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "damagedQty",
                    value
                  )
                }
              />

              {/* ===========================================
                  15 DETERIORATED
              =========================================== */}

              <CompactNumberCell
                value={
                  row.deterioratedQty
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "deterioratedQty",
                    value
                  )
                }
              />

              {/* ===========================================
                  16 UNNECESSARY
              =========================================== */}

              <CompactNumberCell
                value={
                  row.unnecessaryQty
                }
                inputClass={
                  inputClass
                }
                onChange={(
                  value
                ) =>
                  updateNumberField(
                    material.materialId,
                    "unnecessaryQty",
                    value
                  )
                }
              />

              {/* ===========================================
                  17 REMARK
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  bg-white

                  p-0
                "
              >
                <input
                  type="text"
                  value={
                    row.remark
                  }
                  placeholder=""
                  onChange={(
                    event
                  ) =>
                    updateRemark(
                      material.materialId,
                      event.target.value
                    )
                  }
                  className="
                    h-[22px]
                    w-full

                    rounded-none

                    border-0

                    bg-transparent

                    px-1

                    text-left
                    text-[12px]
                    font-normal
                    leading-none

                    !text-black

                    outline-none

                    focus:bg-blue-50
                    focus:ring-0
                  "
                />
              </td>
            </tr>
          );
        }
      )}
    </>
  );
}

/* =========================================================
   PDF STYLE DATA CELL
========================================================= */

function PdfDataCell({
  children,
  numeric = false,
}: {
  children:
    React.ReactNode;

  numeric?:
    boolean;
}) {
  return (
    <td
      className={`
        h-[23.25px]

        border
        border-black

        bg-white

        px-1
        py-0

        text-center
        align-middle
        text-[12px]
        font-normal
        leading-none

        !text-black

        ${
          numeric
            ? "tabular-nums"
            : ""
        }
      `}
    >
      {children}
    </td>
  );
}

/* =========================================================
   NUMBER CELL
========================================================= */

function CompactNumberCell({
  value,
  inputClass,
  onChange,
}: {
  value: string;

  inputClass: string;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <td
      className="
        h-[23.25px]

        border
        border-black

        bg-white

        p-0
      "
    >
      <input
        type="text"
        inputMode="numeric"
        value={
          value
        }
        placeholder=""
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClass
        }
      />
    </td>
  );
}