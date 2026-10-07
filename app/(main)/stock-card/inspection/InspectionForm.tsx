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
   THAI DATE
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
   CURRENT DATE - ASIA/BANGKOK
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
   PARSE DATE ONLY
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
   TO DATE VALUE
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
   THAI DATE DISPLAY
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
     OUTSIDE CLICK
  ======================================================= */

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
      displayMonth +
        1,
      0
    ).getDate();

  const calendarCells: Array<
    number | null
  > = [];

  for (
    let index = 0;
    index <
    firstDay;
    index++
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

  /* =======================================================
     PREVIOUS MONTH
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

  /* =======================================================
     NEXT MONTH
  ======================================================= */

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

  /* =======================================================
     SELECT DAY
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

  /* =======================================================
     TODAY
  ======================================================= */

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
      {/* =====================================================
          SELECTED DATE
      ===================================================== */}

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
            text-lg
          "
        >
          📅
        </span>
      </button>

      {/* =====================================================
          CALENDAR
      ===================================================== */}

      {open && (
        <div
          role="dialog"
          className="
            absolute
            left-0
            top-[58px]
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
          {/* ===============================================
              MONTH
          =============================================== */}

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

                transition

                hover:bg-slate-200
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
                  {
                    day
                  }
                </div>
              )
            )}
          </div>

          {/* ===============================================
              DAYS
          =============================================== */}

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

          {/* ===============================================
              FOOTER
          =============================================== */}

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

   0 / ไม่มีค่า
   =
   -
========================================================= */

function displayStockValue(
  value: number
) {
  if (
    value ===
      0 ||
    !Number.isFinite(
      value
    )
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
    number >=
      0
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
     STATE
  ======================================================= */

  const [
    inspectionDate,
    setInspectionDate,
  ] =
    useState(
      getCurrentDate()
    );

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
     FILTER MATERIAL
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
          ) => {
            const searchable =
              [
                material.code,

                material.name,

                material.unit,

                material.category,

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
      ]
    );

  /* =======================================================
     GROUPED MATERIAL
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
                .length >
              0
          ),
      [
        filteredMaterials,
      ]
    );

  /* =======================================================
     GET ROW
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
     UPDATE ACCURACY
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

     ทำเฉพาะรายการที่กำลังแสดง
     ตาม Search ปัจจุบัน
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
     NUMBER CHANGE
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
        const next =
          [
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

      const numericFields =
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
        numericFields.some(
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
            "ไม่สามารถบันทึกข้อมูลการตรวจสอบได้"
        );
      }

      alert(
        data?.message ||
          "บันทึกผลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว"
      );

      /* ===============================================
         หลังบันทึก
         ไปหน้าประวัติของปีที่บันทึกทันที
      =============================================== */

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
     INPUT STYLE

     ช่องกรอกในตาราง
     ไม่ใช้กรอบดำ
  ======================================================= */

  const numberInputClass =
    `
      h-10
      w-full
      min-w-[62px]

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

      transition-all
      duration-150

      placeholder:!text-slate-400

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
        w-full
        min-w-0

        space-y-5

        sm:space-y-6
      "
    >
      {/* =====================================================
          1. INSPECTION INFORMATION
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
        <div>
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
            ระบุวันที่ดำเนินการตรวจสอบบัญชีพัสดุประจำปี
          </p>
        </div>

        <div
          className="
            mt-5

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
                mt-2

                text-xl
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
          2. SEARCH
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
            กำหนดผลการตรวจสอบให้กับรายการที่กำลังแสดง
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
          </div>
        </div>

        {/* ===================================================
            TABLE
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
              min-w-[2100px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                <th
                  rowSpan={
                    2
                  }
                  className="
                    w-[70px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[320px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  รายการพัสดุ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[100px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[150px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  <div>
                    คงเหลือยอดยกมาเมื่อ
                  </div>

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                    "
                  >
                    30 ก.ย.{" "}
                    {
                      startShortYear
                    }
                  </div>
                </th>

                {/* =========================================
                    MOVEMENT
                ========================================= */}

                <th
                  colSpan={
                    2
                  }
                  className="
                    min-w-[180px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold
                    whitespace-nowrap

                    !text-white
                  "
                >
                  {`01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`}
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[90px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  ยกไป
                </th>

                {/* =========================================
                    CORRECT
                ========================================= */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[90px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  ถูกต้อง
                </th>

                {/* =========================================
                    INCORRECT RADIO
                ========================================= */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[105px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  ไม่ถูกต้อง
                </th>

                {/* =========================================
                    INCORRECT DETAIL

                    ยังคงเป็นกลุ่มเดียว colSpan = 4
                ========================================= */}

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

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  รายละเอียดกรณีไม่ถูกต้อง
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[100px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  ชำรุด
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[115px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  เสื่อมสภาพ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[150px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  ไม่จำเป็นต้องใช้
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[240px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  หมายเหตุ
                </th>
              </tr>

              {/* =============================================
                  SECOND HEADER
              ============================================= */}

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
                        min-w-[85px]

                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-2
                        py-2.5

                        text-center
                        font-extrabold

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
                      numberInputClass={
                        numberInputClass
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
          5. ACTIONS

          ทั้งสองปุ่มใช้ AppButton ตัวกลาง

          ยกเลิก = สีฟ้า
          บันทึก = สีเขียว + 💾
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
        {/* ===============================================
            CANCEL

            กลับหน้า Stock Card ปีเดิม
        =============================================== */}

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

        {/* ===============================================
            SAVE

            ใช้ไอคอนบันทึกแบบหน้าอื่นของระบบ
        =============================================== */}

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
   CATEGORY ROW COMPONENT
========================================================= */

function MaterialCategoryRows({
  categoryName,
  materials,
  getRow,
  numberInputClass,
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

  numberInputClass: string;

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
          MATERIALS

          เลขลำดับเริ่มใหม่ที่ 1 ทุกหมวด
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
                  1. ORDER
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
                  2. MATERIAL
              =========================================== */}

              <td
                className="
                  min-w-[320px]

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
                    material.name
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
                    material.code
                  }
                </div>
              </td>

              {/* ===========================================
                  3. UNIT
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-2
                  py-3

                  text-center
                  font-bold

                  !text-slate-700
                "
              >
                {material.unit ||
                  "-"}
              </td>

              {/* ===========================================
                  4. OPENING
              =========================================== */}

              <td
                className="
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
                  material.openingBalance
                )}
              </td>

              {/* ===========================================
                  5. RECEIVE
              =========================================== */}

              <td
                className="
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
                  material.receiveQty
                )}
              </td>

              {/* ===========================================
                  6. ISSUE
              =========================================== */}

              <td
                className="
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
                  material.issueQty
                )}
              </td>

              {/* ===========================================
                  7. CLOSING
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-2
                  py-3

                  text-center
                  font-black
                  tabular-nums

                  !text-slate-900
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
                  border
                  border-black

                  px-2
                  py-3

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
                    h-5
                    w-5

                    cursor-pointer

                    accent-emerald-600
                  "
                  aria-label={`${material.name} ถูกต้อง`}
                />
              </td>

              {/* ===========================================
                  9. INCORRECT
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-2
                  py-3

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
                    h-5
                    w-5

                    cursor-pointer

                    accent-red-600
                  "
                  aria-label={`${material.name} ไม่ถูกต้อง`}
                />
              </td>

              {/* ===========================================
                  10. SHORTAGE
              =========================================== */}

              <NumberCell
                value={
                  row.shortageQty
                }
                inputClass={
                  numberInputClass
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

              <NumberCell
                value={
                  row.excessQty
                }
                inputClass={
                  numberInputClass
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

              <NumberCell
                value={
                  row.baht
                }
                inputClass={
                  numberInputClass
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

              <NumberCell
                value={
                  row.satang
                }
                inputClass={
                  numberInputClass
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

              <NumberCell
                value={
                  row.damagedQty
                }
                inputClass={
                  numberInputClass
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

              <NumberCell
                value={
                  row.deterioratedQty
                }
                inputClass={
                  numberInputClass
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

              <NumberCell
                value={
                  row.unnecessaryQty
                }
                inputClass={
                  numberInputClass
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
                  min-w-[240px]

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
                    updateRemark(
                      material.materialId,
                      event.target.value
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

                    transition-all
                    duration-150

                    placeholder:!text-slate-400

                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
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
   NUMBER CELL
========================================================= */

function NumberCell({
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
        min-w-[85px]

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
          value
        }
        placeholder="-"
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