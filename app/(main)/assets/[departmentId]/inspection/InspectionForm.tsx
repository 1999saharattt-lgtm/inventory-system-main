"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ExportInspectionPdf from "./ExportInspectionPdf";

type Department = {
  id: number;
  name: string;
};

type Asset = {
  id: number;
  name: string;
  category: string;

  brand: string | null;
  model: string | null;
  serialNumber: string | null;

  governmentAssetNo: string | null;
  officeAssetNo: string | null;

  // จำนวน / หน่วย ตามทะเบียนต้นฉบับ
  quantity: number;
  unit: string | null;

  // ผู้รับผิดชอบตามทะเบียนต้นฉบับ
  responsibleName: string | null;

  departmentId: number;
  sectionId: number | null;
  officerId: number | null;

  status: string;

  purchaseDate: Date | string | null;
  price: number | null;
  location: string | null;
  remark: string | null;

  section: {
    id: number;
    name: string;
  } | null;

  officer: {
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
  } | null;
};

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
  assetId: number;
  countedQty: string;
  accuracy: string;
  status: string;
  remark: string;
};

type QuickActionPosition = {
  left: number;
  width: number;
};

type InitialData = {
  inspectionStartDate?: string;
  inspectionEndDate?: string;
  accountStartDate?: string;
  accountEndDate?: string;
  movementFiscalYear?: string;
  rows?: InspectionRow[];
  inspectorIds?: string[];
};

type Props = {
  department: Department;
  assets: Asset[];
  officers: Officer[];
  initialData?: InitialData;
  submitUrl?: string;
  submitMethod?: "POST" | "PUT";
  cancelHref?: string;
  submitLabel?: string;
  readOnly?: boolean;
};

const INSPECTION_FISCAL_YEAR = "2569";

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

/* =========================================================
   DATE
   ========================================================= */

function getCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string) {
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

function formatDateInput(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getOneYearBefore(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "";
  }

  date.setFullYear(
    date.getFullYear() - 1
  );

  return formatDateInput(date);
}

function getOneDayBefore(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "";
  }

  date.setDate(
    date.getDate() - 1
  );

  return formatDateInput(date);
}

function formatThaiDate(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "........";
  }

  const day = date.getDate();

  const month =
    thaiMonths[date.getMonth()];

  const year =
    date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

function getFiscalYear(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return INSPECTION_FISCAL_YEAR;
  }

  const year = date.getFullYear();

  return String(
    year + 543
  );
}

/* =========================================================
   UNIT

   ใช้ unit จากทะเบียนต้นฉบับก่อน
   หากไม่มีจึง fallback ตาม category
   ========================================================= */

function getCategoryUnit(
  category: string
) {
  switch (category) {
    case "COMPUTER":
    case "DESKTOP":
    case "LAPTOP":
    case "MONITOR":
    case "PRINTER":
    case "TELEPHONE":
    case "AIR_CONDITIONER":
    case "FAN":
      return "เครื่อง";

    case "CHAIR":
    case "DESK":
    case "TABLE":
    case "SHELF":
      return "ตัว";

    case "CABINET":
      return "ตู้";

    case "OTHER":
    case "NO_SYSTEM":
    default:
      return "รายการ";
  }
}

function getAssetUnit(
  asset: Asset
) {
  const originalUnit =
    asset.unit?.trim();

  if (
    originalUnit &&
    originalUnit !== "-"
  ) {
    return originalUnit;
  }

  return getCategoryUnit(
    asset.category
  );
}

/* =========================================================
   RESPONSIBLE NAME

   ใช้ Logic เดียวกับหน้า /assets/[departmentId]/all

   1. responsibleName จากทะเบียนต้นฉบับ
   2. Officer + Section
   3. Officer
   4. Section
   5. -
   ========================================================= */

function getResponsibleName(
  asset: Asset,
  department: Department
): string {
  const originalResponsibleName =
    asset.responsibleName?.trim();

  let responsibleName = "";

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    responsibleName =
      originalResponsibleName;
  } else {
    const officerName =
      asset.officer
        ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
        : "";

    if (
      officerName &&
      asset.section?.name
    ) {
      responsibleName =
        `${officerName} / ${asset.section.name}`;
    } else if (officerName) {
      responsibleName =
        officerName;
    } else if (
      asset.section?.name
    ) {
      responsibleName =
        asset.section.name;
    } else {
      responsibleName = "-";
    }
  }

  /* =======================================================
     กลุ่มอำนวยการ

     แสดงชื่อกลุ่มนำหน้าผู้รับผิดชอบเดิมทุกอัน

     ตัวอย่าง:
     หน้าห้องหัวหน้าอำนวยการ
     →
     กลุ่มอำนวยการ / หน้าห้องหัวหน้าอำนวยการ
     ======================================================= */

  if (
    department.name ===
      "กลุ่มอำนวยการ" &&
    responsibleName !== "-"
  ) {
    const prefix =
      `${department.name} / `;

    if (
      !responsibleName.startsWith(
        prefix
      ) &&
      responsibleName !==
        department.name
    ) {
      return `${department.name} / ${responsibleName}`;
    }
  }

  return responsibleName;
}

/* =========================================================
   SOURCE ORDER
   ========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_1:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder =
    Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   ROWS
   ========================================================= */

function createInitialRows(
  assets: Asset[]
): InspectionRow[] {
  return assets.map((asset) => ({
    assetId: asset.id,

    // ค่าเริ่มต้นใช้จำนวนตามทะเบียนจริง
    countedQty: String(
      asset.quantity ?? 1
    ),

    accuracy: "",
    status: "",
    remark: "",
  }));
}

function normalizeInitialRows(
  assets: Asset[],
  initialRows?: InspectionRow[]
): InspectionRow[] {
  if (
    !initialRows ||
    initialRows.length === 0
  ) {
    return createInitialRows(
      assets
    );
  }

  return assets.map((asset) => {
    const existingRow =
      initialRows.find(
        (row) =>
          row.assetId === asset.id
      );

    if (existingRow) {
      return {
        assetId: asset.id,

        countedQty:
          existingRow.countedQty ??
          String(
            asset.quantity ?? 1
          ),

        accuracy:
          existingRow.accuracy ??
          "",

        status:
          existingRow.status ??
          "",

        remark:
          existingRow.remark ??
          "",
      };
    }

    return {
      assetId: asset.id,

      countedQty: String(
        asset.quantity ?? 1
      ),

      accuracy: "",
      status: "",
      remark: "",
    };
  });
}

function normalizeInspectorIds(
  ids?: string[]
) {
  const result =
    Array<string>(5).fill("");

  if (!ids) {
    return result;
  }

  ids
    .slice(0, 5)
    .forEach(
      (id, index) => {
        result[index] =
          String(id ?? "");
      }
    );

  return result;
}

/* =========================================================
   SEARCHABLE OFFICER SELECT

   Dropdown รายชื่อผู้ตรวจสอบ
   - พิมพ์ค้นหาชื่อได้
   - ค้นหานามสกุลได้
   - ค้นหาตำแหน่งได้
   - ค้นหากลุ่ม/งานได้
   - ไม่แสดงคนที่ถูกเลือกในช่องอื่นแล้ว
   ========================================================= */

type SearchableOfficerSelectProps = {
  officers: Officer[];
  value: string;
  readOnly: boolean;

  isUnavailable: (
    officerId: string
  ) => boolean;

  onChange: (
    officerId: string
  ) => void;
};

function SearchableOfficerSelect({
  officers,
  value,
  readOnly,
  isUnavailable,
  onChange,
}: SearchableOfficerSelectProps) {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const selectedOfficer =
    useMemo(
      () =>
        officers.find(
          (officer) =>
            String(
              officer.id
            ) === value
        ),
      [officers, value]
    );

  const selectedOfficerName =
    selectedOfficer
      ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`.trim()
      : "";

  useEffect(() => {
    setSearchText(
      selectedOfficerName
    );
  }, [
    selectedOfficerName,
  ]);

  const filteredOfficers =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      return officers.filter(
        (officer) => {
          const officerId =
            String(
              officer.id
            );

          if (
            isUnavailable(
              officerId
            )
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchableText =
            [
              officer.firstName,
              officer.lastName,
              officer.position,
              officer.department
                ?.name,
              officer.section
                ?.name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            keyword
          );
        }
      );
    }, [
      officers,
      searchText,
      isUnavailable,
    ]);

  if (readOnly) {
    return (
      <div className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
        {selectedOfficerName ||
          "-"}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={searchText}
        placeholder="พิมพ์ชื่อผู้ตรวจสอบเพื่อค้นหา..."
        autoComplete="off"
        onFocus={(e) => {
          setIsOpen(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setSearchText(
            e.target.value
          );
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(
            () => {
              setIsOpen(false);
              setSearchText(
                selectedOfficerName
              );
            },
            150
          );
        }}
        className="
          w-full
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-2.5
          pr-10
          font-semibold
          text-slate-900
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-cyan-500
          focus:ring-2
          focus:ring-cyan-100
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-3
          top-[13px]
          text-slate-500
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+6px)]
            z-[100]
            max-h-[260px]
            overflow-y-auto
            rounded-xl
            border
            border-slate-300
            bg-white
            p-1.5
            shadow-2xl
          "
        >
          {filteredOfficers.length ===
          0 ? (
            <div
              className="
                px-4
                py-4
                text-center
                text-sm
                font-semibold
                text-slate-500
              "
            >
              ไม่พบรายชื่อผู้ตรวจสอบ
            </div>
          ) : (
            filteredOfficers.map(
              (officer) => {
                const officerId =
                  String(
                    officer.id
                  );

                const officerName =
                  `${officer.firstName} ${officer.lastName}`.trim();

                const isSelected =
                  officerId ===
                  value;

                return (
                  <button
                    key={officer.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      onChange(
                        officerId
                      );

                      setSearchText(
                        officerName
                      );

                      setIsOpen(
                        false
                      );
                    }}
                    className={`
                      flex
                      w-full
                      flex-col
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      transition
                      ${
                        isSelected
                          ? "bg-emerald-100 text-emerald-900"
                          : "text-slate-900 hover:bg-slate-100"
                      }
                    `}
                  >
                    <span className="font-extrabold">
                      {officerName}
                    </span>

                    {(officer.position ||
                      officer.department
                        ?.name ||
                      officer.section
                        ?.name) && (
                      <span
                        className="
                          mt-0.5
                          text-xs
                          font-semibold
                          text-slate-500
                        "
                      >
                        {[
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
                          )}
                      </span>
                    )}
                  </button>
                );
              }
            )
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function InspectionForm({
  department,
  assets,
  officers,
  initialData,
  submitUrl = "/api/assets/inspection",
  submitMethod = "POST",
  cancelHref,
  submitLabel,
  readOnly = false,
}: Props) {
  const today =
    getCurrentDate();

  const [
    inspectionStartDate,
    setInspectionStartDate,
  ] = useState(
    initialData?.inspectionStartDate ||
      today
  );

  const [
    inspectionEndDate,
    setInspectionEndDate,
  ] = useState(
    initialData?.inspectionEndDate ||
      today
  );

  const [
    accountStartDate,
    setAccountStartDate,
  ] = useState(
    initialData?.accountStartDate ||
      getOneYearBefore(
        initialData?.inspectionStartDate ||
          today
      )
  );

  const [
    accountEndDate,
    setAccountEndDate,
  ] = useState(
    initialData?.accountEndDate ||
      getOneDayBefore(
        initialData?.inspectionEndDate ||
          today
      )
  );

  const [
    movementFiscalYear,
    setMovementFiscalYear,
  ] = useState(
    initialData?.movementFiscalYear ||
      getFiscalYear(
        initialData?.inspectionStartDate ||
          today
      )
  );

  const [
    rows,
    setRows,
  ] = useState<InspectionRow[]>(
    () =>
      normalizeInitialRows(
        assets,
        initialData?.rows
      )
  );

  const [
    inspectorIds,
    setInspectorIds,
  ] = useState<string[]>(
    () =>
      normalizeInspectorIds(
        initialData?.inspectorIds
      )
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /* =======================================================
     SEARCH
     ======================================================= */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const filteredAssets =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase();

      if (!keyword) {
        return assets;
      }

      return assets.filter(
        (asset) => {
          const officerName =
            asset.officer
              ? `${asset.officer.firstName} ${asset.officer.lastName}`
              : "";

          const sourceOrder =
            getSourceOrder(
              asset.remark
            );

          const responsibleName =
            getResponsibleName(
              asset,
              department
            );

          const unit =
            getAssetUnit(asset);

          const searchableText = [
            sourceOrder,
            asset.name,
            asset.category,
            asset.brand,
            asset.model,
            asset.serialNumber,
            asset.governmentAssetNo,
            asset.officeAssetNo,
            asset.quantity,
            unit,
            responsibleName,
            asset.location,
            asset.section?.name,
            officerName,
            asset.remark,
          ]
            .filter(
              (value) =>
                value !== null &&
                value !== undefined
            )
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            keyword
          );
        }
      );
    }, [
      assets,
      searchTerm,
    ]);

  /* =======================================================
     REFS
     ======================================================= */

  const inspectionStartDateRef =
    useRef<HTMLInputElement>(
      null
    );

  const inspectionEndDateRef =
    useRef<HTMLInputElement>(
      null
    );

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

  /* =======================================================
     QUICK ACTION HEADER REFS

     ใช้วัดตำแหน่งจริงของคอลัมน์
     เพื่อให้ปุ่มด้านบนตรงกับหัวตารางของช่องนั้น
     ======================================================= */

  const correctHeaderRef =
    useRef<HTMLTableCellElement>(
      null
    );

  const incorrectHeaderRef =
    useRef<HTMLTableCellElement>(
      null
    );

  const inUseHeaderRef =
    useRef<HTMLTableCellElement>(
      null
    );

  const damagedHeaderRef =
    useRef<HTMLTableCellElement>(
      null
    );

  const deterioratedHeaderRef =
    useRef<HTMLTableCellElement>(
      null
    );

  const unusableHeaderRef =
    useRef<HTMLTableCellElement>(
      null
    );

  const [
    tableScrollWidth,
    setTableScrollWidth,
  ] = useState(0);

  const [
    quickActionPositions,
    setQuickActionPositions,
  ] = useState<{
    correct: QuickActionPosition | null;
    incorrect: QuickActionPosition | null;
    inUse: QuickActionPosition | null;
    damaged: QuickActionPosition | null;
    deteriorated: QuickActionPosition | null;
    unusable: QuickActionPosition | null;
  }>({
    correct: null,
    incorrect: null,
    inUse: null,
    damaged: null,
    deteriorated: null,
    unusable: null,
  });

  /* =======================================================
     SCROLLBAR
     ======================================================= */

  useEffect(() => {
    let animationFrame = 0;

    function updateTableMeasurements() {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame =
        requestAnimationFrame(
          () => {
            const table =
              tableRef.current;

            if (!table) {
              return;
            }

            const tableRect =
              table.getBoundingClientRect();

            setTableScrollWidth(
              table.scrollWidth
            );

            function measureHeader(
              element:
                | HTMLTableCellElement
                | null
            ): QuickActionPosition | null {
              if (!element) {
                return null;
              }

              const rect =
                element.getBoundingClientRect();

              return {
                left:
                  rect.left -
                  tableRect.left,
                width:
                  rect.width,
              };
            }

            setQuickActionPositions({
              correct:
                measureHeader(
                  correctHeaderRef.current
                ),

              incorrect:
                measureHeader(
                  incorrectHeaderRef.current
                ),

              inUse:
                measureHeader(
                  inUseHeaderRef.current
                ),

              damaged:
                measureHeader(
                  damagedHeaderRef.current
                ),

              deteriorated:
                measureHeader(
                  deterioratedHeaderRef.current
                ),

              unusable:
                measureHeader(
                  unusableHeaderRef.current
                ),
            });
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
  }, [
    filteredAssets,
    accountStartDate,
    accountEndDate,
    movementFiscalYear,
    readOnly,
  ]);

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
     GENERAL
     ======================================================= */

  const isEditMode =
    submitMethod === "PUT";

  const finalCancelHref =
    cancelHref ||
    `/assets/${department.id}`;

  const finalSubmitLabel =
    submitLabel ||
    (isEditMode
      ? "บันทึกการแก้ไข"
      : "บันทึกผลการตรวจสอบ");

  /* =======================================================
     DATE PICKER
     ======================================================= */

  function openDatePicker(
    input: HTMLInputElement | null
  ) {
    if (
      readOnly ||
      !input
    ) {
      return;
    }

    if (
      typeof input.showPicker ===
      "function"
    ) {
      input.showPicker();
      return;
    }

    input.click();
  }

  /* =======================================================
     UPDATE ROW
     ======================================================= */

  function updateRow(
    assetId: number,
    field: keyof InspectionRow,
    value: string
  ) {
    if (readOnly) {
      return;
    }

    setRows(
      (currentRows) =>
        currentRows.map(
          (row) =>
            row.assetId ===
            assetId
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
     QUICK SELECT

     ใช้เฉพาะรายการที่กำลังแสดง
     หากไม่มีการค้นหา = ทั้งหมด
     หากค้นหา = เฉพาะผลการค้นหา
     ======================================================= */

  function updateAllAccuracy(
    value:
      | "CORRECT"
      | "INCORRECT"
  ) {
    if (readOnly) {
      return;
    }

    const visibleAssetIds =
      new Set(
        filteredAssets.map(
          (asset) =>
            asset.id
        )
      );

    setRows(
      (currentRows) =>
        currentRows.map(
          (row) =>
            visibleAssetIds.has(
              row.assetId
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

  function updateAllStatus(
    value:
      | "IN_USE"
      | "DAMAGED"
      | "DETERIORATED"
      | "UNUSABLE"
  ) {
    if (readOnly) {
      return;
    }

    const visibleAssetIds =
      new Set(
        filteredAssets.map(
          (asset) =>
            asset.id
        )
      );

    setRows(
      (currentRows) =>
        currentRows.map(
          (row) =>
            visibleAssetIds.has(
              row.assetId
            )
              ? {
                  ...row,
                  status:
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
    index: number,
    value: string
  ) {
    if (readOnly) {
      return;
    }

    setInspectorIds(
      (current) => {
        const next = [
          ...current,
        ];

        next[index] =
          value;

        return next;
      }
    );
  }

  function getOfficer(
    id: string
  ) {
    return officers.find(
      (officer) =>
        String(officer.id) ===
        id
    );
  }

  function isOfficerSelected(
    officerId: string,
    currentIndex: number
  ) {
    return inspectorIds.some(
      (id, index) =>
        index !==
          currentIndex &&
        id === officerId
    );
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function handleSave() {
    if (readOnly) {
      return;
    }

    if (
      !inspectionStartDate ||
      !inspectionEndDate
    ) {
      alert(
        "กรุณาระบุวันที่เริ่มและวันที่ตรวจสอบแล้วเสร็จ"
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
        "รูปแบบวันที่ไม่ถูกต้อง"
      );
      return;
    }

    if (
      endDate < startDate
    ) {
      alert(
        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มดำเนินการตรวจสอบ"
      );
      return;
    }

    if (
      inspectorIds.some(
        (id) => !id
      )
    ) {
      alert(
        "กรุณาเลือกรายชื่อผู้ตรวจสอบให้ครบทั้ง 5 คน"
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
      rows.length === 0
    ) {
      alert(
        "ไม่พบรายการครุภัณฑ์สำหรับตรวจสอบ"
      );
      return;
    }

    for (const row of rows) {
      const countedQty =
        Number(
          row.countedQty
        );

      if (
        !Number.isInteger(
          countedQty
        ) ||
        countedQty < 0
      ) {
        alert(
          "จำนวนที่ตรวจนับต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป"
        );
        return;
      }

      if (!row.accuracy) {
        alert(
          "กรุณาระบุผลการตรวจสอบยอดคงเหลือให้ครบทุกรายการ"
        );
        return;
      }

      if (!row.status) {
        alert(
          "กรุณาระบุสถานะครุภัณฑ์ให้ครบทุกรายการ"
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      const response =
        await fetch(
          submitUrl,
          {
            method:
              submitMethod,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  departmentId:
                    department.id,

                  inspectionStartDate,
                  inspectionEndDate,

                  accountStartDate,
                  accountEndDate,

                  movementFiscalYear,

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
        unknown = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        let errorMessage =
          isEditMode
            ? "ไม่สามารถแก้ไขข้อมูลได้"
            : "ไม่สามารถบันทึกข้อมูลได้";

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
        isEditMode
          ? "แก้ไขข้อมูลการตรวจสอบเรียบร้อยแล้ว"
          : "บันทึกข้อมูลการตรวจสอบเรียบร้อยแล้ว"
      );

      /* ===================================================
         หลังบันทึกสำเร็จ
         ไปหน้าประวัติการตรวจสอบครุภัณฑ์
         =================================================== */

      window.location.href =
        "/assets/inspection-history";
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "เกิดข้อผิดพลาดในการแก้ไขข้อมูล"
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* ===================================================
          SEARCH CARD
          =================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-5
        "
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchTerm(
              searchTerm.trim()
            );
          }}
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3
            sm:flex-row
          "
        >
          <input
            id="inspection-search"
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            placeholder="ค้นหารายการ / รหัส GFMIS / รหัสครุภัณฑ์ / ผู้รับผิดชอบ"
            className="
              min-w-0
              flex-1
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />

          <button
            type="submit"
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
              py-3
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-105
              sm:w-auto
            "
          >
            ค้นหา
          </button>

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm("")
              }
              className="
                w-full
                rounded-xl
                bg-slate-600
                px-5
                py-3
                text-center
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:bg-slate-500
                sm:w-auto
              "
            >
              ล้างการค้นหา
            </button>
          )}
        </form>
      </div>

      {/* ===================================================
          ข้อมูลการตรวจสอบ
          =================================================== */}

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold !text-white">
            ข้อมูลการตรวจสอบ
          </h2>

          <ExportInspectionPdf
            department={
              department
            }
            assets={assets}
            rows={rows}
            inspectorIds={
              inspectorIds
            }
            inspectionStartDate={
              inspectionStartDate
            }
            inspectionEndDate={
              inspectionEndDate
            }
            accountStartDate={
              accountStartDate
            }
            accountEndDate={
              accountEndDate
            }
            movementFiscalYear={
              movementFiscalYear
            }
            officers={
              officers
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* วันที่เริ่ม */}

          <div>
            <label className="mb-2 block text-lg font-extrabold !text-white">
              เริ่มดำเนินการตรวจสอบวันที่
            </label>

            <div className="relative">
              <button
                type="button"
                disabled={
                  readOnly
                }
                onClick={() =>
                  openDatePicker(
                    inspectionStartDateRef.current
                  )
                }
                className={`
                  flex
                  min-h-[46px]
                  w-full
                  items-center
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  p-2.5
                  text-left
                  font-semibold
                  text-slate-900
                  outline-none
                  ${
                    readOnly
                      ? "cursor-default"
                      : "cursor-pointer focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  }
                `}
              >
                <span>
                  {formatThaiDate(
                    inspectionStartDate
                  )}
                </span>

                {!readOnly && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-auto h-5 w-5 shrink-0 text-slate-500"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                    />

                    <path d="M16 3v4M8 3v4M3 11h18" />
                  </svg>
                )}
              </button>

              {!readOnly && (
                <input
                  ref={
                    inspectionStartDateRef
                  }
                  type="date"
                  value={
                    inspectionStartDate
                  }
                  onChange={(
                    e
                  ) => {
                    const value =
                      e.target.value;

                    setInspectionStartDate(
                      value
                    );

                    setAccountStartDate(
                      getOneYearBefore(
                        value
                      )
                    );

                    setMovementFiscalYear(
                      getFiscalYear(
                        value
                      )
                    );
                  }}
                  required
                  className="absolute bottom-0 left-0 h-px w-px opacity-0"
                />
              )}
            </div>
          </div>

          {/* วันที่สิ้นสุด */}

          <div>
            <label className="mb-2 block text-lg font-extrabold !text-white">
              ตรวจสอบแล้วเสร็จวันที่
            </label>

            <div className="relative">
              <button
                type="button"
                disabled={
                  readOnly
                }
                onClick={() =>
                  openDatePicker(
                    inspectionEndDateRef.current
                  )
                }
                className={`
                  flex
                  min-h-[46px]
                  w-full
                  items-center
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  p-2.5
                  text-left
                  font-semibold
                  text-slate-900
                  outline-none
                  ${
                    readOnly
                      ? "cursor-default"
                      : "cursor-pointer focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  }
                `}
              >
                <span>
                  {formatThaiDate(
                    inspectionEndDate
                  )}
                </span>

                {!readOnly && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-auto h-5 w-5 shrink-0 text-slate-500"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                    />

                    <path d="M16 3v4M8 3v4M3 11h18" />
                  </svg>
                )}
              </button>

              {!readOnly && (
                <input
                  ref={
                    inspectionEndDateRef
                  }
                  type="date"
                  value={
                    inspectionEndDate
                  }
                  onChange={(
                    e
                  ) => {
                    const value =
                      e.target.value;

                    setInspectionEndDate(
                      value
                    );

                    setAccountEndDate(
                      getOneDayBefore(
                        value
                      )
                    );
                  }}
                  required
                  className="absolute bottom-0 left-0 h-px w-px opacity-0"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          TABLE
          =================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-300
          bg-white
          shadow-lg
        "
      >
        {/* ===============================================
            TOP SCROLLBAR
            =============================================== */}

        <div
          className="
            border-b
            border-slate-300
            bg-slate-100
            px-2
            pt-2
          "
        >
          <div
            ref={topScrollRef}
            onScroll={
              handleTopScroll
            }
            className="
              overflow-x-auto
              overflow-y-hidden
            "
          >
            <div
              style={{
                width:
                  tableScrollWidth,
                height: 12,
              }}
            />
          </div>
        </div>

        {/* ===============================================
            TABLE + BOTTOM SCROLLBAR
            =============================================== */}

        <div
          ref={
            bottomScrollRef
          }
          onScroll={
            handleBottomScroll
          }
          className="overflow-x-auto"
        >
          {/* ===============================================
              QUICK ACTIONS

              อยู่ในการ์ดเดียวกับตาราง
              แต่อยู่นอกตารางและเหนือเส้นหัวตาราง

              ปุ่มแต่ละอันตรงกับหัวคอลัมน์ของตัวเอง
              และกว้างเท่ากับคอลัมน์นั้น
              =============================================== */}

          {!readOnly && (
            <div
              className="
                relative
                h-[50px]
                min-w-full
                border-b
                border-slate-300
                bg-slate-50
              "
              style={{
                width:
                  tableScrollWidth ||
                  undefined,
              }}
            >
              {quickActionPositions.correct && (
                <button
                  type="button"
                  title="ถูกต้องทั้งหมด"
                  aria-label="ถูกต้องทั้งหมด"
                  onClick={() =>
                    updateAllAccuracy(
                      "CORRECT"
                    )
                  }
                  style={{
                    left:
                      quickActionPositions
                        .correct.left +
                      quickActionPositions
                        .correct.width /
                        2,
                    transform:
                      "translateX(-50%)",
                  }}
                  className="
                    absolute
                    top-2
                    flex
                    h-[34px]
                    w-[34px]
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-emerald-600
                    to-green-500
                    p-0
                    text-center
                    text-lg
                    font-extrabold
                    leading-none
                    !text-white
                    shadow
                    transition
                    hover:scale-105
                    hover:from-emerald-700
                    hover:to-green-600
                  "
                >
                  ✓
                </button>
              )}

              {quickActionPositions.incorrect && (
                <button
                  type="button"
                  title="ไม่ถูกต้องทั้งหมด"
                  aria-label="ไม่ถูกต้องทั้งหมด"
                  onClick={() =>
                    updateAllAccuracy(
                      "INCORRECT"
                    )
                  }
                  style={{
                    left:
                      quickActionPositions
                        .incorrect.left +
                      quickActionPositions
                        .incorrect.width /
                        2,
                    transform:
                      "translateX(-50%)",
                  }}
                  className="
                    absolute
                    top-2
                    flex
                    h-[34px]
                    w-[34px]
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-red-700
                    to-red-500
                    p-0
                    text-center
                    text-lg
                    font-extrabold
                    leading-none
                    !text-white
                    shadow
                    transition
                    hover:scale-105
                    hover:from-red-800
                    hover:to-red-600
                  "
                >
                  ✕
                </button>
              )}

              {quickActionPositions.inUse && (
                <button
                  type="button"
                  title="ใช้งานปกติทั้งหมด"
                  aria-label="ใช้งานปกติทั้งหมด"
                  onClick={() =>
                    updateAllStatus(
                      "IN_USE"
                    )
                  }
                  style={{
                    left:
                      quickActionPositions
                        .inUse.left +
                      quickActionPositions
                        .inUse.width /
                        2,
                    transform:
                      "translateX(-50%)",
                  }}
                  className="
                    absolute
                    top-2
                    flex
                    h-[34px]
                    w-[34px]
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-emerald-600
                    to-green-500
                    p-0
                    text-center
                    text-lg
                    font-extrabold
                    leading-none
                    !text-white
                    shadow
                    transition
                    hover:scale-105
                    hover:from-emerald-700
                    hover:to-green-600
                  "
                >
                  ✓
                </button>
              )}

              {quickActionPositions.damaged && (
                <button
                  type="button"
                  title="ชำรุดทั้งหมด"
                  aria-label="ชำรุดทั้งหมด"
                  onClick={() =>
                    updateAllStatus(
                      "DAMAGED"
                    )
                  }
                  style={{
                    left:
                      quickActionPositions
                        .damaged.left +
                      quickActionPositions
                        .damaged.width /
                        2,
                    transform:
                      "translateX(-50%)",
                  }}
                  className="
                    absolute
                    top-2
                    flex
                    h-[34px]
                    w-[34px]
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-emerald-600
                    to-green-500
                    p-0
                    text-center
                    text-lg
                    font-extrabold
                    leading-none
                    !text-white
                    shadow
                    transition
                    hover:scale-105
                    hover:from-emerald-700
                    hover:to-green-600
                  "
                >
                  ✓
                </button>
              )}

              {quickActionPositions.deteriorated && (
                <button
                  type="button"
                  title="เสื่อมสภาพทั้งหมด"
                  aria-label="เสื่อมสภาพทั้งหมด"
                  onClick={() =>
                    updateAllStatus(
                      "DETERIORATED"
                    )
                  }
                  style={{
                    left:
                      quickActionPositions
                        .deteriorated.left +
                      quickActionPositions
                        .deteriorated.width /
                        2,
                    transform:
                      "translateX(-50%)",
                  }}
                  className="
                    absolute
                    top-2
                    flex
                    h-[34px]
                    w-[34px]
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-emerald-600
                    to-green-500
                    p-0
                    text-center
                    text-lg
                    font-extrabold
                    leading-none
                    !text-white
                    shadow
                    transition
                    hover:scale-105
                    hover:from-emerald-700
                    hover:to-green-600
                  "
                >
                  ✓
                </button>
              )}

              {quickActionPositions.unusable && (
                <button
                  type="button"
                  title="ไม่จำเป็นต้องใช้ทั้งหมด"
                  aria-label="ไม่จำเป็นต้องใช้ทั้งหมด"
                  onClick={() =>
                    updateAllStatus(
                      "UNUSABLE"
                    )
                  }
                  style={{
                    left:
                      quickActionPositions
                        .unusable.left +
                      quickActionPositions
                        .unusable.width /
                        2,
                    transform:
                      "translateX(-50%)",
                  }}
                  className="
                    absolute
                    top-2
                    flex
                    h-[34px]
                    w-[34px]
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-red-700
                    to-red-500
                    p-0
                    text-center
                    text-lg
                    font-extrabold
                    leading-none
                    !text-white
                    shadow
                    transition
                    hover:scale-105
                    hover:from-red-800
                    hover:to-red-600
                  "
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <table
            ref={tableRef}
            className="
              w-max
              min-w-full
              table-auto
              border-collapse
              text-[13px]
              leading-tight
            "
          >
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  รายการครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  หน่วย
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountStartDate
                    )}
                  </div>
                </th>

                <th
                  colSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    รายการเคลื่อนไหวระหว่าง
                  </div>

                  <div className="whitespace-nowrap">
                    ปีงบประมาณ พ.ศ.{" "}
                    {movementFiscalYear}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountEndDate
                    )}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap">
                    จำนวนที่ตรวจนับได้
                  </span>
                </th>

                <th
                  colSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ผลการตรวจนับถูกต้องตรงกับ
                  </div>

                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>
                </th>

                <th
                  colSpan={4}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap">
                    สภาพครุภัณฑ์ที่ตรวจนับ
                  </span>
                </th>

                <th
                  rowSpan={2}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white">
                  รับ
                </th>

                <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white">
                  จ่าย
                </th>

                <th
                  ref={correctHeaderRef}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white"
                >

                  ถูกต้อง
                </th>

                <th
                  ref={incorrectHeaderRef}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white"
                >

                  ไม่ถูกต้อง
                </th>

                <th
                  ref={inUseHeaderRef}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white"
                >

                  ใช้งานปกติ
                </th>

                <th
                  ref={damagedHeaderRef}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white"
                >

                  ชำรุด
                </th>

                <th
                  ref={deterioratedHeaderRef}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white"
                >

                  เสื่อมสภาพ
                </th>

                <th
                  ref={unusableHeaderRef}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center font-extrabold !text-white"
                >

                  ไม่จำเป็นต้องใช้
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="
                      border
                      border-black
                      px-4
                      py-10
                      text-center
                      text-base
                      font-bold
                      text-slate-500
                    "
                  >
                    ไม่พบรายการครุภัณฑ์ที่ตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                filteredAssets.map(
                  (asset) => {
                    const row =
                      rows.find(
                        (item) =>
                          item.assetId ===
                          asset.id
                      );

                    const sourceOrder =
                      getSourceOrder(
                        asset.remark
                      );

                    const originalIndex =
                      assets.findIndex(
                        (item) =>
                          item.id ===
                          asset.id
                      );

                    const displayOrder =
                      sourceOrder ??
                      originalIndex + 1;

                    const responsibleName =
                      getResponsibleName(
                        asset,
                        department
                      );

                    const assetUnit =
                      getAssetUnit(
                        asset
                      );

                    const quantity =
                      asset.quantity ?? 1;

                    return (
                      <tr
                        key={
                          asset.id
                        }
                        className="
                          bg-white
                          text-sm
                          font-medium
                          text-slate-900
                          transition
                          hover:bg-emerald-50
                        "
                      >
                        {/* ลำดับ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {
                            displayOrder
                          }
                        </td>

                        {/* GFMIS */}

                        <td className="whitespace-nowrap border border-black px-2 py-2 text-center align-middle">
                          {asset.governmentAssetNo?.trim()
                            ? asset.governmentAssetNo
                            : "-"}
                        </td>

                        {/* รหัสครุภัณฑ์ */}

                        <td className="whitespace-nowrap border border-black px-2 py-2 text-center align-middle">
                          {asset.officeAssetNo?.trim()
                            ? asset.officeAssetNo
                            : "-"}
                        </td>

                        {/* ผู้รับผิดชอบ */}

                        <td className="whitespace-nowrap border border-black px-2 py-2 text-center align-middle">
                          <span className="whitespace-nowrap font-semibold">
                            {
                              responsibleName
                            }
                          </span>
                        </td>

                        {/* รายการ */}

                        <td className="whitespace-nowrap border border-black px-2 py-2 text-left align-middle font-semibold">
                          {asset.name}
                        </td>

                        {/* หน่วย */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {
                            assetUnit
                          }
                        </td>

                        {/* ยอดต้น */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {
                            quantity
                          }
                        </td>

                        {/* รับ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          -
                        </td>

                        {/* จ่าย */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          -
                        </td>

                        {/* ยอดปลาย */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {
                            quantity
                          }
                        </td>

                        {/* จำนวนตรวจนับ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row?.countedQty ??
                              String(
                                quantity
                              )
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "countedQty",
                                e.target.value
                              )
                            }
                            className={`
                              mx-auto
                              h-8
                              w-16
                              rounded
                              border
                              border-slate-400
                              px-2
                              py-1
                              text-center
                              ${
                                readOnly
                                  ? "cursor-default bg-slate-100 text-slate-900 opacity-100"
                                  : "bg-white"
                              }
                            `}
                          />
                        </td>

                        {/* ถูกต้อง */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="radio"
                            name={`accuracy-${asset.id}`}
                            value="CORRECT"
                            checked={
                              row?.accuracy ===
                              "CORRECT"
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "accuracy",
                                e.target.value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* ไม่ถูกต้อง */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="radio"
                            name={`accuracy-${asset.id}`}
                            value="INCORRECT"
                            checked={
                              row?.accuracy ===
                              "INCORRECT"
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "accuracy",
                                e.target.value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* ใช้งานปกติ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="radio"
                            name={`status-${asset.id}`}
                            value="IN_USE"
                            checked={
                              row?.status ===
                              "IN_USE"
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                e.target.value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* ชำรุด */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="radio"
                            name={`status-${asset.id}`}
                            value="DAMAGED"
                            checked={
                              row?.status ===
                              "DAMAGED"
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                e.target.value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* เสื่อมสภาพ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="radio"
                            name={`status-${asset.id}`}
                            value="DETERIORATED"
                            checked={
                              row?.status ===
                              "DETERIORATED"
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                e.target.value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* ไม่จำเป็นต้องใช้ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="radio"
                            name={`status-${asset.id}`}
                            value="UNUSABLE"
                            checked={
                              row?.status ===
                              "UNUSABLE"
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                e.target.value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* หมายเหตุ */}

                        <td className="whitespace-nowrap border border-black px-2 py-2 align-middle">
                          <input
                            type="text"
                            value={
                              row?.remark ??
                              ""
                            }
                            disabled={
                              readOnly
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                asset.id,
                                "remark",
                                e.target.value
                              )
                            }
                            className={`
                              h-8
                              w-[140px]
                              rounded
                              border
                              border-slate-400
                              px-2
                              py-1
                              ${
                                readOnly
                                  ? "cursor-default bg-slate-100 text-slate-900 opacity-100"
                                  : "bg-white"
                              }
                            `}
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
      </div>

      {/* ===================================================
          คณะกรรมการตรวจสอบครุภัณฑ์
          =================================================== */}

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <h2 className="mb-6 text-2xl font-extrabold !text-white">
          คณะกรรมการตรวจสอบครุภัณฑ์
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {inspectorIds.map(
            (
              inspectorId,
              index
            ) => (
              <div key={index}>
                <label className="mb-2 block text-lg font-extrabold !text-white">
                  {index === 0
                    ? "ประธานกรรมการ"
                    : "กรรมการ"}
                </label>

                <SearchableOfficerSelect
                  officers={officers}
                  value={inspectorId}
                  readOnly={readOnly}
                  isUnavailable={(
                    officerId
                  ) =>
                    isOfficerSelected(
                      officerId,
                      index
                    )
                  }
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
                  <p className="mt-2 text-sm font-semibold !text-slate-300">
                    ตำแหน่ง:{" "}
                    {getOfficer(
                      inspectorId
                    )?.position ||
                      "-"}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* ===================================================
          ACTION BUTTONS
          =================================================== */}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <a
            href={
              finalCancelHref
            }
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-600
              to-slate-500
              px-4
              py-2.5
              text-base
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              hover:from-slate-700
              hover:to-slate-600
            "
          >
            ยกเลิก
          </a>

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              isSaving
            }
            className="
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-4
              py-2.5
              text-base
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              hover:from-emerald-700
              hover:to-green-600
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {isSaving
              ? isEditMode
                ? "กำลังบันทึกการแก้ไข..."
                : "กำลังบันทึก..."
              : finalSubmitLabel}
          </button>
        </div>
      )}
    </div>
  );
}