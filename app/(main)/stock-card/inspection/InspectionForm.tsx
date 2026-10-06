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
   DISPLAY NUMBER

   ไม่มีค่า / 0 = "-"
========================================================= */

function displayQuantity(
  value:
    number | null | undefined
) {
  const numberValue =
    Number(
      value ?? 0
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

   รูปแบบเดียวกับหน้าตรวจสอบครุภัณฑ์ต้นฉบับ
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
            ) => {
              const next =
                !current;

              if (
                !next
              ) {
                setSearch(
                  ""
                );
              }

              return next;
            }
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

          transition-all
          duration-200

          hover:border-slate-400
          hover:bg-slate-50

          focus:border-blue-400
          focus:bg-white
          focus:ring-4
          focus:ring-blue-500/10

          disabled:cursor-not-allowed
          disabled:border-slate-200
          disabled:bg-slate-100
          disabled:!text-slate-400
          disabled:opacity-70
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
            shrink-0
            text-xs
            !text-slate-500

            transition-transform
            duration-200

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
                autoComplete="off"
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

                    setSearch(
                      ""
                    );
                  }

                  if (
                    event.key ===
                      "Enter" &&
                    filteredOptions.length ===
                      1
                  ) {
                    event.preventDefault();

                    onChange(
                      filteredOptions[
                        0
                      ].value
                    );

                    setOpen(
                      false
                    );

                    setSearch(
                      ""
                    );
                  }
                }}
                className="
                  min-h-[46px]
                  w-full

                  rounded-[12px]

                  border
                  border-slate-300

                  bg-white

                  px-4
                  py-2.5

                  text-base
                  font-bold
                  !text-slate-900

                  shadow-sm
                  outline-none

                  transition-all
                  duration-200

                  placeholder:!text-slate-400

                  hover:border-slate-400

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
                overscroll-contain

                bg-white

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
                          {
                            option.label
                          }
                        </span>

                        {selected && (
                          <span
                            aria-hidden="true"
                            className="
                              shrink-0
                              !text-white
                            "
                          >
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
}: Props) {
  /* =======================================================
     STATE
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
          ) => {
            const searchableText =
              [
                material.code,
                material.name,
                material.unit,
                material.category,
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

            return searchableText.includes(
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
     TABLE SCROLL
  ======================================================= */

  const topScrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const bottomScrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const tableRef =
    useRef<HTMLTableElement>(
      null
    );

  const [
    tableScrollWidth,
    setTableScrollWidth,
  ] =
    useState(
      0
    );

  useEffect(
    () => {
      let animationFrame =
        0;

      function updateTableMeasurements() {
        cancelAnimationFrame(
          animationFrame
        );

        animationFrame =
          requestAnimationFrame(
            () => {
              const table =
                tableRef.current;

              if (
                !table
              ) {
                return;
              }

              setTableScrollWidth(
                table.scrollWidth
              );
            }
          );
      }

      updateTableMeasurements();

      window.addEventListener(
        "resize",
        updateTableMeasurements
      );

      const table =
        tableRef.current;

      const resizeObserver =
        typeof ResizeObserver !==
          "undefined" &&
        table
          ? new ResizeObserver(
              updateTableMeasurements
            )
          : null;

      if (
        resizeObserver &&
        table
      ) {
        resizeObserver.observe(
          table
        );
      }

      return () => {
        cancelAnimationFrame(
          animationFrame
        );

        window.removeEventListener(
          "resize",
          updateTableMeasurements
        );

        resizeObserver?.disconnect();
      };
    },
    [
      filteredMaterials,
    ]
  );

  function handleTopScroll() {
    if (
      !topScrollRef.current ||
      !bottomScrollRef.current
    ) {
      return;
    }

    bottomScrollRef.current.scrollLeft =
      topScrollRef.current.scrollLeft;
  }

  function handleBottomScroll() {
    if (
      !topScrollRef.current ||
      !bottomScrollRef.current
    ) {
      return;
    }

    topScrollRef.current.scrollLeft =
      bottomScrollRef.current.scrollLeft;
  }

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
     ACCURACY
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
     INSPECTORS
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

  function getOfficer(
    id:
      string
  ) {
    return officers.find(
      (
        officer
      ) =>
        String(
          officer.id
        ) ===
        id
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

     ส่งข้อมูลไป API สำหรับ Stock Card Inspection
  ======================================================= */

  async function handleSave() {
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

    const uniqueInspectorIds =
      new Set(
        inspectorIds
      );

    if (
      uniqueInspectorIds.size !==
      inspectorIds.length
    ) {
      alert(
        "ไม่สามารถเลือกผู้ตรวจสอบซ้ำกันได้"
      );

      return;
    }

    if (
      rows.length ===
      0
    ) {
      alert(
        "ไม่พบรายการพัสดุสำหรับตรวจสอบ"
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

                  inspectorIds:
                    inspectorIds.map(
                      Number
                    ),

                  rows,
                }
              ),
          }
        );

      let data:
        unknown =
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
        let errorMessage =
          "ไม่สามารถบันทึกข้อมูลได้";

        if (
          data &&
          typeof data ===
            "object" &&
          "error" in data &&
          typeof data.error ===
            "string"
        ) {
          errorMessage =
            data.error;
        }

        throw new Error(
          errorMessage
        );
      }

      alert(
        "บันทึกข้อมูลการตรวจสอบเรียบร้อยแล้ว"
      );
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

     ไม่ใช้กรอบดำ
     ใช้แบบเดียวกับต้นฉบับครุภัณฑ์
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

      transition-all

      placeholder:!text-slate-400

      hover:border-slate-400

      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500/10
    `;

  const remarkInputClass =
    `
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

      transition-all

      placeholder:!text-slate-400

      hover:border-slate-400

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
        relative

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
          z-20

          w-full
          min-w-0

          !overflow-visible
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col

            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              min-w-0
            "
          >
            <h2
              className="
                text-xl
                font-black
                tracking-tight

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

          {/* ===============================================
              PDF BUTTON
          =============================================== */}

          <div
            className="
              shrink-0
            "
          >
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
        </div>

        <div
          className="
            mt-5

            grid
            grid-cols-1

            gap-4

            md:grid-cols-3
          "
        >
          <div
            className="
              rounded-[18px]

              border
              border-slate-200/80

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
              rounded-[18px]

              border
              border-slate-200/80

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
              border-slate-200/80

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
          placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / หน่วยนับ"
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
        subtitle={`ตรวจสอบรายการพัสดุประจำปีงบประมาณ ${fiscalYear}`}
        badge={`${filteredMaterials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          relative
          z-0

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
              ✓ ถูกต้องทั้งหมด
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
              ✕ ไม่ถูกต้องทั้งหมด
            </AppButton>
          </div>
        </div>

        {/* ===================================================
            TOP SCROLL
        =================================================== */}

        <div
          ref={
            topScrollRef
          }
          onScroll={
            handleTopScroll
          }
          className="
            w-full
            overflow-x-auto
            overflow-y-hidden
          "
        >
          <div
            style={{
              width:
                tableScrollWidth,
              height:
                1,
            }}
          />
        </div>

        {/* ===================================================
            TABLE SCROLL
        =================================================== */}

        <div
          ref={
            bottomScrollRef
          }
          onScroll={
            handleBottomScroll
          }
          className="
            w-full
            min-w-0

            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            ref={
              tableRef
            }
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
                  className="
                    w-[70px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    align-middle

                    text-sm
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

                    px-4
                    py-4

                    text-center
                    align-middle

                    text-sm
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
                    min-w-[110px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    align-middle

                    text-sm
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
                    min-w-[190px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    align-middle

                    text-sm
                    font-extrabold

                    !text-white
                  "
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
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-4
                    py-4

                    text-center

                    text-sm
                    font-extrabold

                    !text-white
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
                </th>

                <th
                  colSpan={
                    1
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center

                    text-sm
                    font-extrabold

                    !text-white
                  "
                >
                  คงเหลือ
                </th>

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

                    px-4
                    py-4

                    text-center

                    text-sm
                    font-extrabold

                    !text-white
                  "
                >
                  ผลการตรวจสอบ
                </th>

                <th
                  colSpan={
                    4
                  }
                  className="
                    min-w-[430px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-4
                    py-4

                    text-center

                    text-sm
                    font-extrabold

                    leading-relaxed

                    !text-white
                  "
                >
                  ถ้าไม่ถูกต้องจำนวนที่ขาด
                  จำนวนที่เกินคิดเป็นร้อยละ
                </th>

                <th
                  colSpan={
                    3
                  }
                  className="
                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-4
                    py-4

                    text-center

                    text-sm
                    font-extrabold

                    !text-white
                  "
                >
                  จำนวนที่
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="
                    min-w-[220px]

                    border
                    border-black

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-4
                    py-4

                    text-center
                    align-middle

                    text-sm
                    font-extrabold

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
                      className="
                        min-w-[100px]

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-3
                        py-3

                        text-center

                        text-sm
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

            <tbody>
              {filteredMaterials.length ===
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
                filteredMaterials.map(
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

                          transition-colors

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
                        {/* ===================================
                            ลำดับ
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                          "
                        >
                          {
                            index +
                            1
                          }
                        </td>

                        {/* ===================================
                            รายการพัสดุ
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-2.5

                            font-semibold
                          "
                        >
                          <div
                            className="
                              !text-slate-900
                            "
                          >
                            {
                              material.name
                            }
                          </div>

                          {material.code && (
                            <div
                              className="
                                mt-1

                                text-xs
                                font-semibold

                                !text-slate-500
                              "
                            >
                              รหัส:{" "}
                              {
                                material.code
                              }
                            </div>
                          )}
                        </td>

                        {/* ===================================
                            หน่วย
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                          "
                        >
                          {material.unit?.trim()
                            ? material.unit
                            : "-"}
                        </td>

                        {/* ===================================
                            OPENING
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            font-semibold
                          "
                        >
                          {displayQuantity(
                            material.openingBalance
                          )}
                        </td>

                        {/* ===================================
                            RECEIVE
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            font-semibold
                          "
                        >
                          {displayQuantity(
                            material.receiveQty
                          )}
                        </td>

                        {/* ===================================
                            ISSUE
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            font-semibold
                          "
                        >
                          {displayQuantity(
                            material.issueQty
                          )}
                        </td>

                        {/* ===================================
                            CLOSING
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            font-semibold
                          "
                        >
                          {displayQuantity(
                            material.closingBalance
                          )}
                        </td>

                        {/* ===================================
                            CORRECT / INCORRECT

                            วงกลมแบบต้นฉบับ
                        =================================== */}

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
                              className="
                                border
                                border-black

                                px-2
                                py-2

                                text-center
                              "
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

                        {/* ===================================
                            ขาด
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row.shortageQty
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "shortageQty",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            เกิน
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row.excessQty
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "excessQty",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            บาท
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row.baht
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "baht",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            สตางค์
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="1"
                            value={
                              row.satang
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "satang",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            ชำรุด
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row.damagedQty
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "damagedQty",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            เสื่อมสภาพ
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row.deterioratedQty
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "deterioratedQty",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            ไม่จำเป็นต้องใช้
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2
                            text-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row.unnecessaryQty
                            }
                            placeholder="-"
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                material.materialId,
                                "unnecessaryQty",
                                event.target.value
                              )
                            }
                            className={
                              numberInputClass
                            }
                          />
                        </td>

                        {/* ===================================
                            REMARK
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

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
                              updateRow(
                                material.materialId,
                                "remark",
                                event.target.value
                              )
                            }
                            className={
                              remarkInputClass
                            }
                          />
                        </td>
                      </tr>
                    );
                  }
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
          z-10

          w-full
          min-w-0

          !overflow-visible
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
            เลือกผู้ตรวจสอบจำนวน 3 คน
            โดยไม่สามารถเลือกรายชื่อซ้ำกันได้
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

                  <SearchableDropdown
                    id={`inspector-${index}`}
                    value={
                      inspectorId
                    }
                    options={
                      officerOptions
                    }
                    placeholder="-- เลือกผู้ตรวจสอบ --"
                    searchPlaceholder="พิมพ์ค้นหาผู้ตรวจสอบ..."
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
                      )?.position ||
                        "-"}
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>

        {/* ===================================================
            ACTION BUTTONS
        =================================================== */}

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
            sm:items-center
            sm:justify-end
          "
        >
          <AppButton
            href={`/stock-card?fiscalYear=${fiscalYear}`}
            variant="secondary"
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
      </AppCard>
    </div>
  );
}