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

import DepartmentInspectionSelect from "./DepartmentInspectionSelect";
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

  departments?: Department[];

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

/* =========================================================
   CONSTANT
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
    parseDateOnly(
      value
    );

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
    parseDateOnly(
      value
    );

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
    parseDateOnly(
      value
    );

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
    parseDateOnly(
      value
    );

  if (!date) {
    return INSPECTION_FISCAL_YEAR;
  }

  const year =
    date.getFullYear();

  const month =
    date.getMonth() +
    1;

  return String(
    month >= 10
      ? year + 1 + 543
      : year + 543
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
   RESPONSIBLE
========================================================= */

function getResponsibleName(
  asset: Asset,
  department: Department
) {
  const originalResponsibleName =
    asset.responsibleName?.trim();

  let responsibleName =
    "";

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
   INITIAL ROW
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
  initialRows?: InspectionRow[]
) {
  if (
    !initialRows ||
    initialRows.length === 0
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

      if (
        existingRow
      ) {
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
   ICONS
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
  department,
  departments,
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
  ] = useState(false);

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
              asset.section?.name,
              officerName,
              asset.remark,
            ]
              .filter(
                (value) =>
                  value !==
                    null &&
                  value !==
                    undefined
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
     TABLE WIDTH
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
        : "บันทึก"
    );

  /* =======================================================
     DATE
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
     QUICK ACTION
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
      const row of
      rows
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
        relative

        w-full
        min-w-0

        space-y-5

        sm:space-y-6
      "
    >
      {/* =====================================================
          1. INSPECTION INFORMATION
          ขึ้นก่อน Search
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
            DEPARTMENT
        ================================================= */}

        {departments &&
          departments.length >
            0 && (
            <div
              className="
                relative
                z-30

                mt-5

                w-full
                max-w-[560px]
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
                กลุ่มงาน
              </label>

              <DepartmentInspectionSelect
                departments={
                  departments
                }
                currentDepartmentId={
                  department.id
                }
              />
            </div>
          )}

        {/* =================================================
            DATE
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
          <div>
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
                  min-h-[52px]
                  w-full

                  items-center

                  rounded-[16px]

                  border
                  border-slate-300/90

                  px-4
                  py-3

                  text-left
                  text-sm
                  font-bold

                  !text-slate-900

                  shadow-sm

                  outline-none

                  transition-all
                  duration-200

                  ${
                    readOnly
                      ? "cursor-default bg-slate-100"
                      : "cursor-pointer bg-white/90 hover:border-slate-400 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  }
                `}
              >
                {formatThaiDate(
                  inspectionStartDate
                )}

                {!readOnly && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="
                      ml-auto
                      h-5
                      w-5
                      shrink-0

                      !text-slate-500
                    "
                    aria-hidden="true"
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

          <div>
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
                  min-h-[52px]
                  w-full

                  items-center

                  rounded-[16px]

                  border
                  border-slate-300/90

                  px-4
                  py-3

                  text-left
                  text-sm
                  font-bold

                  !text-slate-900

                  shadow-sm

                  outline-none

                  transition-all
                  duration-200

                  ${
                    readOnly
                      ? "cursor-default bg-slate-100"
                      : "cursor-pointer bg-white/90 hover:border-slate-400 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  }
                `}
              >
                {formatThaiDate(
                  inspectionEndDate
                )}

                {!readOnly && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="
                      ml-auto
                      h-5
                      w-5
                      shrink-0

                      !text-slate-500
                    "
                    aria-hidden="true"
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
          2. SEARCH
          อยู่หลังข้อมูลการตรวจสอบ
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
      </div>

      {/* =====================================================
          3. TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบครุภัณฑ์"
        subtitle="ตรวจสอบและบันทึกผลรายการครุภัณฑ์"
        badge={`${filteredAssets.length.toLocaleString(
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

              <AppButton
                type="button"
                variant="success"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "IN_USE"
                  )
                }
              >
                ใช้งานปกติทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="warning"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "DAMAGED"
                  )
                }
              >
                ชำรุดทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="warning"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "DETERIORATED"
                  )
                }
              >
                เสื่อมสภาพทั้งหมด
              </AppButton>

              <AppButton
                type="button"
                variant="danger"
                size="sm"
                onClick={() =>
                  updateAllStatus(
                    "UNUSABLE"
                  )
                }
              >
                ไม่จำเป็นต้องใช้ทั้งหมด
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
              min-w-[2900px]

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
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รายการครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หน่วย
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountStartDate
                    )}
                  </div>
                </th>

                <th
                  colSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    รายการเคลื่อนไหวระหว่าง
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ปีงบประมาณ พ.ศ.{" "}
                    {
                      movementFiscalYear
                    }
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountEndDate
                    )}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  จำนวนที่ตรวจนับได้
                </th>

                <th
                  colSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ผลการตรวจนับถูกต้องตรงกับ
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>
                </th>

                <th
                  colSpan={4}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  สภาพครุภัณฑ์ที่ตรวจนับ
                </th>

                <th
                  rowSpan={2}
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

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
                  (title) => (
                    <th
                      key={
                        title
                      }
                      className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2.5 text-center font-extrabold !text-white"
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
              {filteredAssets.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-14

                      text-center
                    "
                  >
                    <p
                      className="
                        text-base
                        font-extrabold

                        !text-slate-900
                      "
                    >
                      ไม่พบรายการครุภัณฑ์ที่ตรงกับคำค้นหา
                    </p>

                    {searchTerm && (
                      <div className="mt-4">
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
                        <td className="border border-black px-2 py-2.5 text-center">
                          {
                            displayOrder
                          }
                        </td>

                        <td className="whitespace-nowrap border border-black px-2 py-2.5 text-center">
                          {asset.governmentAssetNo?.trim()
                            ? asset.governmentAssetNo
                            : "-"}
                        </td>

                        <td className="whitespace-nowrap border border-black px-2 py-2.5 text-center">
                          {asset.officeAssetNo?.trim()
                            ? asset.officeAssetNo
                            : "-"}
                        </td>

                        <td className="whitespace-nowrap border border-black px-2 py-2.5 text-center">
                          {
                            responsibleName
                          }
                        </td>

                        <td className="whitespace-nowrap border border-black px-3 py-2.5 font-semibold">
                          {
                            asset.name
                          }
                        </td>

                        <td className="border border-black px-2 py-2.5 text-center">
                          {
                            assetUnit
                          }
                        </td>

                        <td className="border border-black px-2 py-2.5 text-center">
                          {
                            quantity
                          }
                        </td>

                        <td className="border border-black px-2 py-2.5 text-center">
                          -
                        </td>

                        <td className="border border-black px-2 py-2.5 text-center">
                          -
                        </td>

                        <td className="border border-black px-2 py-2.5 text-center">
                          {
                            quantity
                          }
                        </td>

                        <td className="border border-black px-2 py-2 text-center">
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
                            className="
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

                              focus:border-blue-500
                              focus:ring-2
                              focus:ring-blue-500/10

                              disabled:bg-slate-100
                            "
                          />
                        </td>

                        {[
                          "CORRECT",
                          "INCORRECT",
                        ].map(
                          (accuracy) => (
                            <td
                              key={
                                accuracy
                              }
                              className="border border-black px-2 py-2 text-center"
                            >
                              <input
                                type="radio"
                                name={`accuracy-${asset.id}`}
                                value={
                                  accuracy
                                }
                                checked={
                                  row?.accuracy ===
                                  accuracy
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

                                  accent-blue-600
                                "
                              />
                            </td>
                          )
                        )}

                        {[
                          "IN_USE",
                          "DAMAGED",
                          "DETERIORATED",
                          "UNUSABLE",
                        ].map(
                          (status) => (
                            <td
                              key={
                                status
                              }
                              className="border border-black px-2 py-2 text-center"
                            >
                              <input
                                type="radio"
                                name={`status-${asset.id}`}
                                value={
                                  status
                                }
                                checked={
                                  row?.status ===
                                  status
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

                                  accent-blue-600
                                "
                              />
                            </td>
                          )
                        )}

                        <td className="whitespace-nowrap border border-black px-2 py-2">
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

                              disabled:bg-slate-100
                            "
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
            เลือกผู้ตรวจสอบจำนวน 5 คน โดยไม่สามารถเลือกรายชื่อซ้ำกันได้
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
            ) => {
              const officerOptions =
                officers
                  .filter(
                    (officer) => {
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
                    (officer) => ({
                      value:
                        String(
                          officer.id
                        ),

                      label:
                        `${officer.firstName} ${officer.lastName}`.trim(),

                      description:
                        [
                          officer.position,
                          officer.department?.name,
                          officer.section?.name,
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
                    disabled={
                      readOnly
                    }
                    required={
                      !readOnly
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
                      )?.position ||
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
          {/* ===============================================
              CANCEL
              ตัวกลาง + สีน้ำเงิน
              ไม่มี emoji กากบาท
          =============================================== */}

          <AppButton
            href={
              finalCancelHref
            }
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
          =============================================== */}

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