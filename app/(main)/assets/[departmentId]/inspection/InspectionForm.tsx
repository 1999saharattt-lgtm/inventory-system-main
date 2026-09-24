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

  quantity: number;
  unit: string | null;

  responsibleName: string | null;

  departmentId: number;
  sectionId: number | null;
  officerId: number | null;

  status: string;

  purchaseDate:
    | Date
    | string
    | null;

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

  submitMethod?:
    | "POST"
    | "PUT";

  cancelHref?: string;

  submitLabel?: string;

  readOnly?: boolean;
};

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

/* =========================================================
   CONSTANTS
========================================================= */

const INSPECTION_FISCAL_YEAR =
  "2569";

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
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

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
  ] = value
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

function formatDateInput(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getOneYearBefore(
  value: string
) {
  const date =
    parseDateOnly(value);

  if (!date) {
    return "";
  }

  date.setFullYear(
    date.getFullYear() - 1
  );

  return formatDateInput(
    date
  );
}

function getOneDayBefore(
  value: string
) {
  const date =
    parseDateOnly(value);

  if (!date) {
    return "";
  }

  date.setDate(
    date.getDate() - 1
  );

  return formatDateInput(
    date
  );
}

function formatThaiDate(
  value: string
) {
  const date =
    parseDateOnly(value);

  if (!date) {
    return "........";
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

function getFiscalYear(
  value: string
) {
  const date =
    parseDateOnly(value);

  if (!date) {
    return INSPECTION_FISCAL_YEAR;
  }

  return String(
    date.getFullYear() +
      543
  );
}

/* =========================================================
   UNIT
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
========================================================= */

function getResponsibleName(
  asset: Asset,
  department: Department
): string {
  const originalResponsibleName =
    asset.responsibleName?.trim();

  let responsibleName =
    "";

  if (
    originalResponsibleName &&
    originalResponsibleName !==
      "-"
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
    } else if (
      officerName
    ) {
      responsibleName =
        officerName;
    } else if (
      asset.section?.name
    ) {
      responsibleName =
        asset.section.name;
    } else {
      responsibleName =
        "-";
    }
  }

  /* =======================================================
     กลุ่มอำนวยการ
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

  const match =
    remark.match(
      /SOURCE:DEPARTMENT_1:(\d+)/
    );

  if (!match) {
    return null;
  }

  const sourceOrder =
    Number(
      match[1]
    );

  if (
    !Number.isInteger(
      sourceOrder
    ) ||
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
  return assets.map(
    (asset) => ({
      assetId:
        asset.id,

      countedQty:
        String(
          asset.quantity ??
            1
        ),

      accuracy:
        "",

      status:
        "",

      remark:
        "",
    })
  );
}

function normalizeInitialRows(
  assets: Asset[],
  initialRows?:
    InspectionRow[]
): InspectionRow[] {
  if (
    !initialRows ||
    initialRows.length ===
      0
  ) {
    return createInitialRows(
      assets
    );
  }

  return assets.map(
    (asset) => {
      const existingRow =
        initialRows.find(
          (row) =>
            row.assetId ===
            asset.id
        );

      if (existingRow) {
        return {
          assetId:
            asset.id,

          countedQty:
            existingRow.countedQty ??
            String(
              asset.quantity ??
                1
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
        assetId:
          asset.id,

        countedQty:
          String(
            asset.quantity ??
              1
          ),

        accuracy:
          "",

        status:
          "",

        remark:
          "",
      };
    }
  );
}

function normalizeInspectorIds(
  ids?: string[]
) {
  const result =
    Array<string>(
      5
    ).fill("");

  if (!ids) {
    return result;
  }

  ids
    .slice(
      0,
      5
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

/* =========================================================
   SEARCHABLE OFFICER SELECT
========================================================= */

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
      [
        officers,
        value,
      ]
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
      <div
        className="
          min-h-[48px]
          w-full

          rounded-[14px]

          border
          border-slate-300

          bg-slate-50

          px-4
          py-3

          font-semibold

          !text-slate-900
        "
      >
        {selectedOfficerName ||
          "-"}
      </div>
    );
  }

  return (
    <div
      className="
        relative
        w-full
        min-w-0
      "
    >
      <input
        type="text"
        value={
          searchText
        }
        placeholder="พิมพ์ชื่อผู้ตรวจสอบเพื่อค้นหา..."
        autoComplete="off"
        onFocus={(
          event
        ) => {
          setIsOpen(
            true
          );

          event.currentTarget.select();
        }}
        onChange={(
          event
        ) => {
          setSearchText(
            event.target.value
          );

          setIsOpen(
            true
          );
        }}
        onBlur={() => {
          window.setTimeout(
            () => {
              setIsOpen(
                false
              );

              setSearchText(
                selectedOfficerName
              );
            },
            150
          );
        }}
        className="
          min-h-[48px]
          w-full

          rounded-[14px]

          border
          border-slate-300

          bg-white

          px-4
          py-3
          pr-10

          font-semibold

          !text-slate-900

          outline-none

          transition-all
          duration-200

          placeholder:!text-slate-400

          hover:border-slate-400

          focus:border-emerald-500
          focus:ring-4
          focus:ring-emerald-500/10
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-3.5
          top-1/2

          -translate-y-1/2

          !text-slate-500
        "
      >
        ▼
      </div>

      {isOpen && (
        <div
          className="
            absolute
            inset-x-0
            top-[calc(100%+6px)]
            z-[100]

            max-h-[280px]

            overflow-y-auto

            rounded-[16px]

            border
            border-slate-200

            bg-white/95

            p-1.5

            shadow-2xl

            backdrop-blur-xl
          "
        >
          {filteredOfficers.length ===
          0 ? (
            <div
              className="
                px-4
                py-5

                text-center
                text-sm
                font-semibold

                !text-slate-500
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
                    key={
                      officer.id
                    }
                    type="button"
                    onMouseDown={(
                      event
                    ) => {
                      event.preventDefault();
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

                      rounded-[12px]

                      px-3
                      py-2.5

                      text-left

                      transition-colors

                      ${
                        isSelected
                          ? "bg-emerald-50 !text-emerald-800"
                          : "!text-slate-900 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span
                      className="
                        font-extrabold
                      "
                    >
                      {
                        officerName
                      }
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

                          !text-slate-500
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

  /* =======================================================
     STATE
  ======================================================= */

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
  ] = useState<
    InspectionRow[]
  >(
    () =>
      normalizeInitialRows(
        assets,
        initialData?.rows
      )
  );

  const [
    inspectorIds,
    setInspectorIds,
  ] = useState<
    string[]
  >(
    () =>
      normalizeInspectorIds(
        initialData?.inspectorIds
      )
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(
    false
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  /* =======================================================
     SEARCH
  ======================================================= */

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
            getAssetUnit(
              asset
            );

          const searchableText =
            [
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
              asset.section
                ?.name,
              officerName,
              asset.remark,
            ]
              .filter(
                (
                  value
                ) =>
                  value !==
                    null &&
                  value !==
                    undefined
              )
              .join(
                " "
              )
              .toLowerCase();

          return searchableText.includes(
            keyword
          );
        }
      );
    }, [
      assets,
      searchTerm,
      department,
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

  const [
    tableScrollWidth,
    setTableScrollWidth,
  ] = useState(0);

  /* =======================================================
     TABLE MEASUREMENTS
  ======================================================= */

  useEffect(() => {
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

            if (!table) {
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
    submitMethod ===
    "PUT";

  const finalCancelHref =
    cancelHref ||
    `/assets/${department.id}`;

  const finalSubmitLabel =
    submitLabel ||
    (
      isEditMode
        ? "บันทึกการแก้ไข"
        : "บันทึกผลการตรวจสอบ"
    );

  /* =======================================================
     DATE PICKER
  ======================================================= */

  function openDatePicker(
    input:
      | HTMLInputElement
      | null
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
    field:
      keyof InspectionRow,
    value: string
  ) {
    if (readOnly) {
      return;
    }

    setRows(
      (
        currentRows
      ) =>
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
      (
        currentRows
      ) =>
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
      (
        currentRows
      ) =>
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
      (
        current
      ) => {
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

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    if (readOnly) {
      return;
    }

    /* =====================================================
       DATE
    ===================================================== */

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
      endDate <
      startDate
    ) {
      alert(
        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มดำเนินการตรวจสอบ"
      );

      return;
    }

    /* =====================================================
       INSPECTOR
    ===================================================== */

    if (
      inspectorIds.some(
        (id) =>
          !id
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

    /* =====================================================
       ROWS
    ===================================================== */

    if (
      rows.length ===
      0
    ) {
      alert(
        "ไม่พบรายการครุภัณฑ์สำหรับตรวจสอบ"
      );

      return;
    }

    for (
      const row of rows
    ) {
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

      if (
        !row.accuracy
      ) {
        alert(
          "กรุณาระบุผลการตรวจสอบยอดคงเหลือให้ครบทุกรายการ"
        );

        return;
      }

      if (
        !row.status
      ) {
        alert(
          "กรุณาระบุสถานะครุภัณฑ์ให้ครบทุกรายการ"
        );

        return;
      }
    }

    /* =====================================================
       SUBMIT
    ===================================================== */

    try {
      setIsSaving(
        true
      );

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
        data =
          null;
      }

      if (
        !response.ok
      ) {
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

      window.location.href =
        "/assets/inspection-history";
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "เกิดข้อผิดพลาดในการแก้ไขข้อมูล"
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

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
          SEARCH

          ใช้ AppSearchInput ตัวกลาง
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
          setSearchTerm("")
        }
        placeholder="ค้นหารายการ / รหัส GFMIS / รหัสครุภัณฑ์ / ผู้รับผิดชอบ"
        resultCount={
          filteredAssets.length
        }
        resultLabel="รายการ"
        showSearchButton
        showClearButton
        searchButtonText="ค้นหา"
        clearButtonText="ล้าง"
      />

      {/* =====================================================
          INSPECTION INFORMATION

          ใช้ AppCard ตัวกลาง
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
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
              flex-1
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
              {department.name} •
              ประจำปีงบประมาณ
              พ.ศ.{" "}
              {
                movementFiscalYear
              }
            </p>
          </div>

          <div
            className="
              shrink-0
            "
          >
            <ExportInspectionPdf
              department={
                department
              }
              assets={
                assets
              }
              rows={
                rows
              }
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
        </div>

        {/* =================================================
            DATES
        ================================================= */}

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
              START
          =============================================== */}

          <div
            className="
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
              เริ่มดำเนินการตรวจสอบวันที่
            </label>

            <div
              className="
                relative
              "
            >
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
                  min-h-[50px]
                  w-full

                  items-center

                  rounded-[14px]

                  border
                  border-slate-300

                  px-4
                  py-3

                  text-left
                  font-semibold

                  !text-slate-900

                  outline-none

                  transition-all

                  ${
                    readOnly
                      ? "cursor-default bg-slate-50"
                      : "cursor-pointer bg-white hover:border-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  }
                `}
              >
                <span>
                  {formatThaiDate(
                    inspectionStartDate
                  )}
                </span>

                {!readOnly && (
                  <span
                    aria-hidden="true"
                    className="
                      ml-auto

                      !text-slate-500
                    "
                  >
                    📅
                  </span>
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
                    event
                  ) => {
                    const value =
                      event.target.value;

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
                  className="
                    absolute
                    bottom-0
                    left-0

                    h-px
                    w-px

                    opacity-0
                  "
                />
              )}
            </div>
          </div>

          {/* ===============================================
              END
          =============================================== */}

          <div
            className="
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
              ตรวจสอบแล้วเสร็จวันที่
            </label>

            <div
              className="
                relative
              "
            >
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
                  min-h-[50px]
                  w-full

                  items-center

                  rounded-[14px]

                  border
                  border-slate-300

                  px-4
                  py-3

                  text-left
                  font-semibold

                  !text-slate-900

                  outline-none

                  transition-all

                  ${
                    readOnly
                      ? "cursor-default bg-slate-50"
                      : "cursor-pointer bg-white hover:border-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  }
                `}
              >
                <span>
                  {formatThaiDate(
                    inspectionEndDate
                  )}
                </span>

                {!readOnly && (
                  <span
                    aria-hidden="true"
                    className="
                      ml-auto

                      !text-slate-500
                    "
                  >
                    📅
                  </span>
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
                    event
                  ) => {
                    const value =
                      event.target.value;

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
                  className="
                    absolute
                    bottom-0
                    left-0

                    h-px
                    w-px

                    opacity-0
                  "
                />
              )}
            </div>
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          TABLE

          13 MAIN HEADERS
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบครุภัณฑ์"
        subtitle={`${department.name} • ตรวจสอบครุภัณฑ์ประจำปี`}
        badge={`${filteredAssets.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
          max-w-full
        "
      >
        {/* =================================================
            QUICK ACTIONS

            ใช้ AppButton ตัวกลางทั้งหมด
        ================================================= */}

        {!readOnly && (
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
                items-center

                gap-2
              "
            >
              <AppButton
                type="button"
                variant="primary"
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
                variant="primary"
                size="sm"
                onClick={() =>
                  updateAllAccuracy(
                    "INCORRECT"
                  )
                }
              >
                ✕ ไม่ถูกต้องทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "IN_USE"
                  )
                }
              >
                ✓ ใช้งานปกติทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "DAMAGED"
                  )
                }
              >
                ✓ ชำรุดทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "DETERIORATED"
                  )
                }
              >
                ✓ เสื่อมสภาพทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "UNUSABLE"
                  )
                }
              >
                ✓ ไม่จำเป็นต้องใช้ทั้งหมด
              </AppButton>
            </div>
          </div>
        )}

        {/* =================================================
            TOP SCROLLBAR
        ================================================= */}

        <div
          className="
            border-b
            border-slate-200

            bg-slate-50

            px-2
            pt-2
          "
        >
          <div
            ref={
              topScrollRef
            }
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
                height:
                  12,
              }}
            />
          </div>
        </div>

        {/* =================================================
            TABLE SCROLL
        ================================================= */}

        <div
          ref={
            bottomScrollRef
          }
          onScroll={
            handleBottomScroll
          }
          className="
            w-full

            overflow-x-auto
            overscroll-x-contain

            [-webkit-overflow-scrolling:touch]
          "
        >
          <table
            ref={
              tableRef
            }
            className="
              w-max
              min-w-full

              table-auto
              border-collapse

              text-[13px]
              leading-tight
            "
          >
            {/* ===============================================
                HEADER
            =============================================== */}

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
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  รหัส GFMIS
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

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  รหัสครุภัณฑ์
                </th>

                {/* 4 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    whitespace-nowrap

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
                  ผู้รับผิดชอบ
                </th>

                {/* 5 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    whitespace-nowrap

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
                  รายการครุภัณฑ์
                </th>

                {/* 6 */}

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
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  หน่วย
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

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  <div
                    className="
                      whitespace-nowrap
                    "
                  >
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                    "
                  >
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountStartDate
                    )}
                  </div>
                </th>

                {/* 8 */}

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

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  <div
                    className="
                      whitespace-nowrap
                    "
                  >
                    รายการเคลื่อนไหวระหว่าง
                  </div>

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                    "
                  >
                    ปีงบประมาณ พ.ศ.{" "}
                    {
                      movementFiscalYear
                    }
                  </div>
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

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  <div
                    className="
                      whitespace-nowrap
                    "
                  >
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                    "
                  >
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountEndDate
                    )}
                  </div>
                </th>

                {/* 10 */}

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
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  <span
                    className="
                      whitespace-nowrap
                    "
                  >
                    จำนวนที่ตรวจนับได้
                  </span>
                </th>

                {/* 11 */}

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

                    px-2
                    py-3

                    text-center
                    align-middle
                    font-extrabold

                    !text-white
                  "
                >
                  <div
                    className="
                      whitespace-nowrap
                    "
                  >
                    ผลการตรวจนับถูกต้องตรงกับ
                  </div>

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                    "
                  >
                    ยอดคงเหลือตามบัญชี
                  </div>
                </th>

                {/* 12 */}

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
                  <span
                    className="
                      whitespace-nowrap
                    "
                  >
                    สภาพครุภัณฑ์ที่ตรวจนับ
                  </span>
                </th>

                {/* 13 */}

                <th
                  rowSpan={
                    2
                  }
                  className="
                    whitespace-nowrap

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
                  "ถูกต้อง",
                  "ไม่ถูกต้อง",
                  "ใช้งานปกติ",
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

            {/* ===============================================
                BODY
            =============================================== */}

            <tbody>
              {filteredAssets.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      18
                    }
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-14

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto

                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-14
                          w-14

                          place-items-center

                          text-2xl
                        "
                        aria-hidden="true"
                      >
                        🔎
                      </div>

                      <p
                        className="
                          mt-3

                          text-base
                          font-extrabold

                          !text-slate-900
                        "
                      >
                        ไม่พบรายการครุภัณฑ์ที่ตรงกับคำค้นหา
                      </p>

                      {searchTerm && (
                        <div
                          className="
                            mt-4
                          "
                        >
                          <AppButton
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setSearchTerm(
                                ""
                              )
                            }
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(
                  (
                    asset,
                    index
                  ) => {
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
                      originalIndex +
                        1;

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
                      asset.quantity ??
                      1;

                    return (
                      <tr
                        key={
                          asset.id
                        }
                        className={`
                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          text-sm
                          font-medium

                          !text-slate-900

                          transition-colors

                          hover:bg-emerald-50/60
                        `}
                      >
                        {/* ORDER */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          {
                            displayOrder
                          }
                        </td>

                        {/* GFMIS */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          {asset.governmentAssetNo?.trim()
                            ? asset.governmentAssetNo
                            : "-"}
                        </td>

                        {/* ASSET NO */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          {asset.officeAssetNo?.trim()
                            ? asset.officeAssetNo
                            : "-"}
                        </td>

                        {/* RESPONSIBLE */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          <span
                            className="
                              whitespace-nowrap

                              font-semibold
                            "
                          >
                            {
                              responsibleName
                            }
                          </span>
                        </td>

                        {/* NAME */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-2.5

                            text-left
                            align-middle

                            font-semibold
                          "
                        >
                          {
                            asset.name
                          }
                        </td>

                        {/* UNIT */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          {
                            assetUnit
                          }
                        </td>

                        {/* OPEN BALANCE */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle

                            tabular-nums
                          "
                        >
                          {
                            quantity
                          }
                        </td>

                        {/* RECEIVE */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          -
                        </td>

                        {/* ISSUE */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle
                          "
                        >
                          -
                        </td>

                        {/* END BALANCE */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2.5

                            text-center
                            align-middle

                            tabular-nums
                          "
                        >
                          {
                            quantity
                          }
                        </td>

                        {/* COUNTED QTY */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "countedQty",
                                event.target.value
                              )
                            }
                            className={`
                              mx-auto

                              h-9
                              w-20

                              rounded-[10px]

                              border
                              border-slate-300

                              px-2

                              text-center
                              font-semibold

                              !text-slate-900

                              outline-none

                              focus:border-emerald-500
                              focus:ring-2
                              focus:ring-emerald-500/10

                              ${
                                readOnly
                                  ? "cursor-default bg-slate-100 opacity-100"
                                  : "bg-white"
                              }
                            `}
                          />
                        </td>

                        {/* CORRECT */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "accuracy",
                                event.target.value
                              )
                            }
                            className="
                              h-4
                              w-4

                              accent-emerald-600

                              disabled:cursor-default
                              disabled:opacity-100
                            "
                          />
                        </td>

                        {/* INCORRECT */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "accuracy",
                                event.target.value
                              )
                            }
                            className="
                              h-4
                              w-4

                              accent-emerald-600

                              disabled:cursor-default
                              disabled:opacity-100
                            "
                          />
                        </td>

                        {/* IN USE */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                event.target.value
                              )
                            }
                            className="
                              h-4
                              w-4

                              accent-emerald-600

                              disabled:cursor-default
                              disabled:opacity-100
                            "
                          />
                        </td>

                        {/* DAMAGED */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                event.target.value
                              )
                            }
                            className="
                              h-4
                              w-4

                              accent-emerald-600

                              disabled:cursor-default
                              disabled:opacity-100
                            "
                          />
                        </td>

                        {/* DETERIORATED */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                event.target.value
                              )
                            }
                            className="
                              h-4
                              w-4

                              accent-emerald-600

                              disabled:cursor-default
                              disabled:opacity-100
                            "
                          />
                        </td>

                        {/* UNUSABLE */}

                        <td
                          className="
                            border
                            border-black

                            px-2
                            py-2

                            text-center
                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "status",
                                event.target.value
                              )
                            }
                            className="
                              h-4
                              w-4

                              accent-emerald-600

                              disabled:cursor-default
                              disabled:opacity-100
                            "
                          />
                        </td>

                        {/* REMARK */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-2
                            py-2

                            align-middle
                          "
                        >
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
                              event
                            ) =>
                              updateRow(
                                asset.id,
                                "remark",
                                event.target.value
                              )
                            }
                            className={`
                              h-9
                              w-[160px]

                              rounded-[10px]

                              border
                              border-slate-300

                              px-3

                              font-semibold

                              !text-slate-900

                              outline-none

                              focus:border-emerald-500
                              focus:ring-2
                              focus:ring-emerald-500/10

                              ${
                                readOnly
                                  ? "cursor-default bg-slate-100 opacity-100"
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
      </AppTableCard>

      {/* =====================================================
          INSPECTION COMMITTEE

          ใช้ AppCard ตัวกลาง
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
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
            เลือกผู้ตรวจสอบจำนวน 5 คน
            โดยไม่สามารถเลือกรายชื่อซ้ำกันได้
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
          {inspectorIds.map(
            (
              inspectorId,
              index
            ) => (
              <div
                key={
                  index
                }
                className="
                  min-w-0

                  rounded-[18px]

                  border
                  border-slate-200

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

                <SearchableOfficerSelect
                  officers={
                    officers
                  }
                  value={
                    inspectorId
                  }
                  readOnly={
                    readOnly
                  }
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
            )
          )}
        </div>
      </AppCard>

      {/* =====================================================
          ACTIONS

          ใช้ AppButton ตัวกลางทั้งหมด
      ===================================================== */}

      {!readOnly && (
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
              finalCancelHref
            }
            variant="back"
            size="md"
          >
            ยกเลิก
          </AppButton>

          <AppButton
            type="button"
            variant="primary"
            size="md"
            onClick={
              handleSave
            }
            disabled={
              isSaving
            }
          >
            {isSaving
              ? isEditMode
                ? "กำลังบันทึกการแก้ไข..."
                : "กำลังบันทึก..."
              : finalSubmitLabel}
          </AppButton>
        </div>
      )}
    </div>
  );
}