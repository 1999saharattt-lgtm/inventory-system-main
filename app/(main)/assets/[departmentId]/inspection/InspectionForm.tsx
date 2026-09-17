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

  const month =
    date.getMonth() + 1;

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
    case "PRINTER":
    case "TELEPHONE":
    case "AIR_CONDITIONER":
    case "FAN":
      return "เครื่อง";

    case "CHAIR":
    case "DESK":
    case "TABLE":
      return "ตัว";

    case "CABINET":
      return "ตู้";

    case "OTHER":
    default:
      return "รายการ";
  }
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
    countedQty: "1",
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
          "1",
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
      countedQty: "1",
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

  const [rows, setRows] =
    useState<InspectionRow[]>(
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

          const searchableText = [
            sourceOrder,
            asset.name,
            asset.category,
            asset.brand,
            asset.model,
            asset.serialNumber,
            asset.governmentAssetNo,
            asset.officeAssetNo,
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
    }, [assets, searchTerm]);

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
  ] = useState(2300);

  /* =======================================================
     SCROLLBAR
     ======================================================= */

  useEffect(() => {
    function updateTableWidth() {
      if (!tableRef.current) {
        return;
      }

      setTableScrollWidth(
        tableRef.current.scrollWidth
      );
    }

    updateTableWidth();

    window.addEventListener(
      "resize",
      updateTableWidth
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateTableWidth
      );
    };
  }, [filteredAssets]);

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
     SELECT ALL

     ทำงานเฉพาะรายการที่กำลังแสดงจากการค้นหา
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

      if (
        isEditMode &&
        finalCancelHref
      ) {
        window.location.href =
          finalCancelHref;
      }
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

      <div className="
        rounded-2xl
        border
        border-slate-700
        bg-gradient-to-br
        from-slate-950
        to-slate-800
        p-5
        text-white
        shadow-xl
      ">
        <h2 className="
          mb-4
          text-2xl
          font-extrabold
          !text-white
        ">
          🔍 ค้นหารายการครุภัณฑ์
        </h2>

        <div className="
          flex
          flex-col
          gap-3
          sm:flex-row
        ">
          <input
            id="inspection-search"
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            placeholder="ค้นหาชื่อครุภัณฑ์, รหัส GFMIS, รหัสครุภัณฑ์, ยี่ห้อ, รุ่น, Serial Number..."
            className="
              min-h-[48px]
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              font-semibold
              text-slate-900
              outline-none
              placeholder:text-slate-400
              focus:border-emerald-500
              focus:ring-2
              focus:ring-emerald-200
            "
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm("")
              }
              className="
                min-h-[48px]
                shrink-0
                rounded-xl
                bg-gradient-to-r
                from-slate-600
                to-slate-500
                px-5
                py-2.5
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:from-slate-700
                hover:to-slate-600
              "
            >
              ล้างค้นหา
            </button>
          )}
        </div>

        <p className="
          mt-3
          text-sm
          font-semibold
          !text-slate-300
        ">
          แสดง{" "}
          {filteredAssets.length}{" "}
          จาก {assets.length} รายการ
        </p>
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
          QUICK SELECT
          =================================================== */}

      {!readOnly && (
        <div className="
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-5
          shadow-lg
        ">
          <div className="
            flex
            flex-col
            gap-4
            xl:flex-row
            xl:items-center
            xl:justify-between
          ">
            <div>
              <h2 className="
                text-xl
                font-extrabold
                text-slate-900
              ">
                เลือกผลการตรวจสอบแบบรวดเร็ว
              </h2>

              <p className="
                mt-1
                text-sm
                font-semibold
                text-slate-500
              ">
                ใช้กับรายการที่กำลังแสดง{" "}
                {filteredAssets.length} รายการ
              </p>
            </div>

            <div className="
              flex
              flex-wrap
              gap-2
            ">
              <button
                type="button"
                onClick={() =>
                  updateAllAccuracy(
                    "CORRECT"
                  )
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-600
                  to-green-500
                  px-4
                  py-2.5
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-[1.02]
                  hover:from-emerald-700
                  hover:to-green-600
                "
              >
                ✓ ถูกต้องทั้งหมด
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAllAccuracy(
                    "INCORRECT"
                  )
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-red-700
                  to-red-500
                  px-4
                  py-2.5
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-[1.02]
                  hover:from-red-800
                  hover:to-red-600
                "
              >
                ✕ ไม่ถูกต้องทั้งหมด
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAllStatus(
                    "IN_USE"
                  )
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-600
                  to-green-500
                  px-4
                  py-2.5
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-[1.02]
                  hover:from-emerald-700
                  hover:to-green-600
                "
              >
                ✓ ใช้งานปกติทั้งหมด
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAllStatus(
                    "DAMAGED"
                  )
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-orange-600
                  to-orange-500
                  px-4
                  py-2.5
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-[1.02]
                  hover:from-orange-700
                  hover:to-orange-600
                "
              >
                ชำรุดทั้งหมด
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAllStatus(
                    "DETERIORATED"
                  )
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-amber-600
                  to-yellow-500
                  px-4
                  py-2.5
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-[1.02]
                  hover:from-amber-700
                  hover:to-yellow-600
                "
              >
                เสื่อมสภาพทั้งหมด
              </button>

              <button
                type="button"
                onClick={() =>
                  updateAllStatus(
                    "UNUSABLE"
                  )
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-red-700
                  to-red-500
                  px-4
                  py-2.5
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-[1.02]
                  hover:from-red-800
                  hover:to-red-600
                "
              >
                ไม่จำเป็นต้องใช้ทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          TABLE
          =================================================== */}

      <div className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-300
        bg-white
        shadow-lg
      ">
        {/* ===============================================
            TOP SCROLLBAR
            =============================================== */}

        <div className="
          border-b
          border-slate-300
          bg-slate-100
          px-2
          pt-2
        ">
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
          <table
            ref={tableRef}
            className="
              w-full
              min-w-[2300px]
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
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
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
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                <th className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  รับ
                </th>

                <th className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  จ่าย
                </th>

                <th className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  ถูกต้อง
                </th>

                <th className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  ไม่ถูกต้อง
                </th>

                <th className="min-w-[105px] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  ใช้งานปกติ
                </th>

                <th className="min-w-[70px] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  ชำรุด
                </th>

                <th className="min-w-[95px] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
                  เสื่อมสภาพ
                </th>

                <th className="min-w-[125px] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold !text-white">
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

                    /* ===============================
                       ลำดับเดิมจากหน้า /all
                       =============================== */

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

                    const responsibleGroup =
                      department.name ===
                      "กลุ่มอำนวยการ"
                        ? [
                            department.name,
                            asset.section
                              ?.name ||
                              "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " / "
                            )
                        : department.name;

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
                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {
                            displayOrder
                          }
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {asset.governmentAssetNo ||
                            "-"}
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {asset.officeAssetNo ||
                            "-"}
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {
                            responsibleGroup
                          }
                        </td>

                        <td className="border border-black px-2 py-2 text-left align-middle">
                          {asset.name}
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          {getCategoryUnit(
                            asset.category
                          )}
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          1
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          -
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          -
                        </td>

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          1
                        </td>

                        {/* จำนวนตรวจนับ */}

                        <td className="border border-black px-2 py-2 text-center align-middle">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              row?.countedQty ??
                              "1"
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
                                e.target
                                  .value
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
                                e.target
                                  .value
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
                                e.target
                                  .value
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
                                e.target
                                  .value
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
                                e.target
                                  .value
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
                                e.target
                                  .value
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
                                e.target
                                  .value
                              )
                            }
                            className="h-4 w-4 disabled:cursor-default disabled:opacity-100"
                          />
                        </td>

                        {/* หมายเหตุ */}

                        <td className="border border-black px-2 py-2 align-middle">
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
                                e.target
                                  .value
                              )
                            }
                            className={`
                              h-8
                              w-full
                              min-w-[140px]
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
          INSPECTORS
          =================================================== */}

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <h2 className="mb-6 text-2xl font-extrabold !text-white">
          รายชื่อผู้ตรวจสอบ
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {inspectorIds.map(
            (
              inspectorId,
              index
            ) => (
              <div key={index}>
                <label className="mb-2 block text-lg font-extrabold !text-white">
                  ผู้ตรวจสอบคนที่{" "}
                  {index + 1}
                </label>

                {readOnly ? (
                  <div className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
                    {inspectorId
                      ? `${getOfficer(inspectorId)?.firstName || ""} ${
                          getOfficer(inspectorId)?.lastName || ""
                        }`.trim() ||
                        "-"
                      : "-"}
                  </div>
                ) : (
                  <select
                    value={
                      inspectorId
                    }
                    onChange={(
                      e
                    ) =>
                      updateInspector(
                        index,
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">
                      -- เลือกผู้ตรวจสอบ --
                    </option>

                    {officers.map(
                      (
                        officer
                      ) => {
                        const value =
                          String(
                            officer.id
                          );

                        if (
                          isOfficerSelected(
                            value,
                            index
                          )
                        ) {
                          return null;
                        }

                        return (
                          <option
                            key={
                              officer.id
                            }
                            value={
                              value
                            }
                          >
                            {
                              officer.firstName
                            }{" "}
                            {
                              officer.lastName
                            }
                          </option>
                        );
                      }
                    )}
                  </select>
                )}

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