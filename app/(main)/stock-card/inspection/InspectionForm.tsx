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

  position:
    | string
    | null;

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

  materials:
    MaterialRow[];

  officers:
    Officer[];

  initialInspectionDate?: string;
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
   SEARCHABLE DROPDOWN
========================================================= */

type SearchableOption = {
  value: string;

  label: string;
};

type SearchableDropdownProps = {
  id: string;

  value: string;

  options:
    SearchableOption[];

  placeholder: string;

  searchPlaceholder?: string;

  emptyText?: string;

  disabled?: boolean;

  required?: boolean;

  onChange:
    (
      value: string
    ) => void;
};

/* =========================================================
   DATE
========================================================= */

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
   DISPLAY NUMBER

   0 / ไม่มีค่า = -
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

          transition-all

          hover:border-slate-400
          hover:bg-slate-50

          focus:border-blue-400
          focus:ring-4
          focus:ring-blue-500/10
        "
      >
        <span
          className={
            selectedOption
              ? "!text-slate-900"
              : "!text-slate-400"
          }
        >
          {selectedOption
            ?.label ??
            placeholder}
        </span>

        <span
          className={`
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

              shadow-xl
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
                  ) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
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

                        rounded-[10px]

                        px-3
                        py-2.5

                        text-left
                        font-bold

                        ${
                          option.value ===
                          value
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

                      {option.value ===
                        value && (
                        <span>
                          ✓
                        </span>
                      )}
                    </button>
                  )
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
        getTodayDateOnly()
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
     GROUP BY CATEGORY
  ======================================================= */

  const groupedMaterials =
    useMemo(
      () => {
        return CATEGORY_ORDER
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
          );
      },
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
      keyof InspectionRow,

    value:
      string
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

  /* =======================================================
     INPUT STYLE
  ======================================================= */

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
          INFORMATION CARD
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

          {/* ===============================================
              INSPECTION DATE
          =============================================== */}

          <div
            className="
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
                text-sm
                font-extrabold

                !text-slate-500
              "
            >
              ตรวจสอบเมื่อวันที่
            </label>

            <input
              id="inspectionDate"
              type="date"
              value={
                inspectionDate
              }
              onChange={(
                event
              ) =>
                setInspectionDate(
                  event.target.value
                )
              }
              className="
                mt-2

                min-h-[44px]
                w-full

                rounded-[12px]

                border
                border-slate-300

                bg-white

                px-3

                text-base
                font-bold

                !text-slate-900

                outline-none

                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/10
              "
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
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center !text-white"
                >
                  รายการพัสดุ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
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
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
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

                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
                >
                  คงเหลือ
                </th>

                <th
                  colSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
                >
                  ผลการตรวจสอบ
                </th>

                <th
                  colSpan={
                    4
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
                >
                  ถ้าไม่ถูกต้องจำนวนที่ขาด
                  จำนวนที่เกินคิดเป็นร้อยละ
                </th>

                <th
                  colSpan={
                    3
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
                >
                  จำนวนที่
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center !text-white"
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
                      className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center !text-white"
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
                    <>
                      {/* ===================================
                          CATEGORY ROW
                      =================================== */}

                      <tr
                        key={`category-${group.category}`}
                      >
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

                      {/* ===================================
                          MATERIAL ROWS
                          ลำดับเริ่มใหม่ทุกหมวด
                      =================================== */}

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
                              className={
                                index %
                                  2 ===
                                0
                                  ? "bg-white"
                                  : "bg-slate-50/60"
                              }
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
                                    "shortageQty",
                                  value:
                                    row.shortageQty,
                                },
                                {
                                  field:
                                    "excessQty",
                                  value:
                                    row.excessQty,
                                },
                                {
                                  field:
                                    "baht",
                                  value:
                                    row.baht,
                                },
                                {
                                  field:
                                    "satang",
                                  value:
                                    row.satang,
                                },
                                {
                                  field:
                                    "damagedQty",
                                  value:
                                    row.damagedQty,
                                },
                                {
                                  field:
                                    "deterioratedQty",
                                  value:
                                    row.deterioratedQty,
                                },
                                {
                                  field:
                                    "unnecessaryQty",
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
                                          input.field as keyof InspectionRow,
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
                    </>
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

        <div
          className="
            mt-6

            flex
            flex-col-reverse
            gap-3

            border-t
            border-slate-200

            pt-5

            sm:flex-row
            sm:justify-end
          "
        >
          <AppButton
            href={`/stock-card?fiscalYear=${fiscalYear}`}
            variant="secondary"
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
            onClick={
              handleSave
            }
            disabled={
              isSaving
            }
          >
            {isSaving
              ? "กำลังบันทึก..."
              : "บันทึก"}
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
}