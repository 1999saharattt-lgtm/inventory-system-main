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
   * FY2569
   * =
   * ยอดคงเหลือ ณ 30 ก.ย.68
   */
  openingBalance: number;

  /*
   * รับอย่างเดียว
   * ภายใน FY ที่ตรวจ
   */
  receiveQty: number;

  /*
   * จ่ายจริง APPROVED
   * ภายใน FY ที่ตรวจ
   */
  issueQty: number;

  /*
   * คงเหลือ Stock Card ปัจจุบัน
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
========================================================= */

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

  useEffect(
    () => {
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
    },
    []
  );

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

  function previousMonth() {
    if (
      displayMonth === 0
    ) {
      setDisplayMonth(
        11
      );

      setDisplayYear(
        (current) =>
          current - 1
      );

      return;
    }

    setDisplayMonth(
      (current) =>
        current - 1
    );
  }

  function nextMonth() {
    if (
      displayMonth === 11
    ) {
      setDisplayMonth(
        0
      );

      setDisplayYear(
        (current) =>
          current + 1
      );

      return;
    }

    setDisplayMonth(
      (current) =>
        current + 1
    );
  }

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
            (current) =>
              !current
          )
        }
        className="
          flex
          h-[46px]
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
            text-base
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
            top-[52px]
            z-[1000]

            w-[330px]
            max-w-[calc(100vw-32px)]

            rounded-[22px]

            border
            border-slate-200

            bg-white/95

            p-3

            shadow-2xl

            backdrop-blur-xl
          "
        >
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
   INITIAL ROWS
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
   STOCK DISPLAY
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
   OPTIONAL INTEGER
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
   COMPONENT
========================================================= */

export default function InspectionForm({
  fiscalYear,
  startShortYear,
  endShortYear,
  materials,
  officers,
}: Props) {
  /* =======================================================
     DATE
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
     ROWS
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

     ALL
     =
     ทุกหมวด

     PDF:
     ถ้าทุกหมวด
     จะขึ้นหน้าใหม่ทุกหมวด

     WEB:
     แสดงเป็นชุดหมวดต่อกัน
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

  /* =======================================================
     ACCURACY
  ======================================================= */

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

     เปลี่ยนเฉพาะรายการ
     ที่กำลังแสดง
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
     NUMBER
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
       INSPECTOR
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
       ROW VALIDATION
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

      const values = [
        row.shortageQty,
        row.excessQty,
        row.baht,
        row.satang,
        row.damagedQty,
        row.deterioratedQty,
        row.unnecessaryQty,
      ];

      if (
        values.some(
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
       POST
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

                  /*
                   * Schema ปัจจุบัน
                   * เก็บ inspectionDate
                   *
                   * ใช้วันที่เริ่มตรวจสอบ
                   */
                  inspectionDate:
                    inspectionStartDate,

                  /*
                   * ส่งไว้ด้วย
                   * เพื่อรองรับการเพิ่ม field ภายหลัง
                   */
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
     TABLE INPUT STYLE

     PDF ใช้ Font 15
     Form ใช้ 15px

     ความสูงแถวมาตรฐาน
     23.25 px
  ======================================================= */

  const compactInputClass = `
    h-[22px]
    w-full
    min-w-0

    rounded-[4px]

    border
    border-slate-300

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

    focus:border-blue-500
    focus:ring-1
    focus:ring-blue-100
  `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        w-full
        min-w-0

        space-y-4
      "
    >
      {/* =====================================================
          1. INSPECTION INFO
      ===================================================== */}

      <AppCard
        padding={
          false
        }
        className="
          !overflow-visible
          !rounded-[22px]
        "
      >
        <div
          className="
            relative
            z-20

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
            <div
              className="
                shrink-0

                lg:w-[210px]
              "
            >
              <h2
                className="
                  text-lg
                  font-black
                  tracking-tight

                  !text-slate-900
                "
              >
                ข้อมูลการตรวจสอบ
              </h2>

              <p
                className="
                  mt-0.5

                  text-xs
                  font-semibold

                  !text-slate-500
                "
              >
                ระบุช่วงวันที่ดำเนินการตรวจสอบ
              </p>
            </div>

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
                  relative
                  z-30
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

              <div
                className="
                  relative
                  z-20
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
          3. TABLE
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
            CATEGORY / PDF / QUICK ACTION
        =================================================== */}

        <div
          className="
            border-b
            border-slate-200

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
                z-30

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
                ACTIONS
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

              {/* =============================================
                  PDF

                  ใช้ข้อมูลชุดเดียวกับตาราง
                  และหมวดที่เลือกอยู่
              ============================================= */}

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
            TABLE

            สัดส่วนคอลัมน์เดียวกับ PDF

            PDF = 285 mm
            WEB = scale × 6
            รวมประมาณ 1710 px
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
            {/* =================================================
                WIDTH

                อัตราส่วนเดียวกับ PDF
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
                {/* 1 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  ลำดับ
                </th>

                {/* 2 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  ชื่อหรือชนิดวัสดุหรือครุภัณฑ์
                </th>

                {/* 3 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  หน่วยนับ
                </th>

                {/* 4 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
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
                </th>

                {/* 5-6 */}

                <th
                  colSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  {`01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`}
                </th>

                {/* 7 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  คงเหลือปัจจุบัน
                </th>

                {/* 8 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  ถูกต้อง
                </th>

                {/* 9 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  ไม่ถูกต้อง
                </th>

                {/* 10-13 */}

                <th
                  colSpan={
                    4
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  รายละเอียดกรณีไม่ถูกต้อง
                </th>

                {/* 14 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  ชำรุด
                </th>

                {/* 15 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  เสื่อมสภาพ
                </th>

                {/* 16 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
                  ไม่จำเป็นต้องใช้
                </th>

                {/* 17 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-1
                    py-2

                    text-center
                    align-middle
                    text-[15px]
                    font-extrabold
                    leading-tight

                    !text-white
                  "
                >
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
                ].map(
                  (
                    title
                  ) => (
                    <th
                      key={
                        title
                      }
                      className="
                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-1
                        py-1

                        text-center
                        text-[15px]
                        font-extrabold
                        leading-tight

                        !text-white
                      "
                    >
                      {
                        title
                      }
                    </th>
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
                      text-[15px]
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
                        compactInputClass
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
      ===================================================== */}

      <AppCard
        className="
          relative
          z-20

          w-full
          min-w-0

          !overflow-visible

          !p-4
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

              return (
                <div
                  key={
                    index
                  }
                  className="
                    relative
                    min-w-0

                    rounded-[16px]

                    border
                    border-slate-200/80

                    bg-slate-50/60

                    p-3
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
   CATEGORY ROWS

   รูปแบบให้ตรงกับ PDF

   - หมวดอยู่ด้านในตาราง
   - อยู่ก่อนเลข 1
   - ไม่มีสีพื้นหลัง
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

          ไม่มี background
          เหมือน PDF
      ===================================================== */}

      <tr
        className="
          h-[23.25px]

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
            py-0

            text-left
            text-[15px]
            font-bold
            leading-none

            !text-black
          "
        >
          {categoryName}
        </td>
      </tr>

      {/* =====================================================
          ITEMS
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
              className={`
                min-h-[23.25px]

                transition-colors

                hover:bg-blue-50/50

                ${
                  index %
                    2 ===
                  0
                    ? "bg-white"
                    : "bg-slate-50/35"
                }
              `}
            >
              {/* ===========================================
                  1. ORDER
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  px-1
                  py-0

                  text-center
                  text-[15px]
                  font-normal
                  leading-none

                  !text-black
                "
              >
                {index +
                  1}
              </td>

              {/* ===========================================
                  2. NAME
              =========================================== */}

              <td
                className="
                  min-h-[23.25px]

                  border
                  border-black

                  px-2
                  py-[2px]

                  text-left
                  text-[15px]
                  font-normal
                  leading-tight

                  !text-black
                "
              >
                {material.name}
              </td>

              {/* ===========================================
                  3. UNIT
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  px-1
                  py-0

                  text-center
                  text-[15px]
                  font-normal
                  leading-none

                  !text-black
                "
              >
                {material.unit ||
                  "-"}
              </td>

              {/* ===========================================
                  4. OPENING

                  FY2569
                  =
                  ยอดยกเข้าระบบ
                  ณ 01 ต.ค.68

                  แสดงใต้หัว
                  30 ก.ย.68
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  px-1
                  py-0

                  text-center
                  text-[15px]
                  font-normal
                  leading-none
                  tabular-nums

                  !text-black
                "
              >
                {displayStockValue(
                  material.openingBalance
                )}
              </td>

              {/* ===========================================
                  5. RECEIVE

                  รับอย่างเดียวใน FY
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  px-1
                  py-0

                  text-center
                  text-[15px]
                  font-normal
                  leading-none
                  tabular-nums

                  !text-black
                "
              >
                {displayStockValue(
                  material.receiveQty
                )}
              </td>

              {/* ===========================================
                  6. ISSUE

                  จ่ายจริง APPROVED ใน FY
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  px-1
                  py-0

                  text-center
                  text-[15px]
                  font-normal
                  leading-none
                  tabular-nums

                  !text-black
                "
              >
                {displayStockValue(
                  material.issueQty
                )}
              </td>

              {/* ===========================================
                  7. CURRENT BALANCE
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  px-1
                  py-0

                  text-center
                  text-[15px]
                  font-normal
                  leading-none
                  tabular-nums

                  !text-black
                "
              >
                {displayStockValue(
                  material.closingBalance
                )}
              </td>

              {/* ===========================================
                  8. CORRECT
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  p-0

                  text-center
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
                    h-[15px]
                    w-[15px]

                    cursor-pointer

                    accent-emerald-600
                  "
                />
              </td>

              {/* ===========================================
                  9. INCORRECT
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

                  p-0

                  text-center
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
                    h-[15px]
                    w-[15px]

                    cursor-pointer

                    accent-red-600
                  "
                />
              </td>

              {/* ===========================================
                  10. SHORTAGE
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
                  11. EXCESS
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
                  12. BAHT
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
                  13. SATANG
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
                  14. DAMAGED
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
                  15. DETERIORATED
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
                  16. UNNECESSARY
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
                  17. REMARK
              =========================================== */}

              <td
                className="
                  h-[23.25px]

                  border
                  border-black

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
                    text-[15px]
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
   COMPACT NUMBER CELL

   Height 23.25 px
   เหมือน PDF / Excel Standard
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