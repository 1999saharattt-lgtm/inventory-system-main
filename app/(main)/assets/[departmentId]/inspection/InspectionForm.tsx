"use client";

import { useRef, useState } from "react";
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

  // ใช้สำหรับหน้าแก้ไขประวัติ
  initialData?: InitialData;

  // ถ้าไม่ส่งมา จะใช้ API บันทึกใหม่ตามเดิม
  submitUrl?: string;

  // หน้าใหม่ = POST / หน้าแก้ไข = PUT
  submitMethod?: "POST" | "PUT";

  // URL ปุ่มยกเลิก
  cancelHref?: string;

  // ข้อความบนปุ่มบันทึก
  submitLabel?: string;
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

function getCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getOneYearBefore(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "";
  }

  date.setFullYear(date.getFullYear() - 1);

  return formatDateInput(date);
}

function getOneDayBefore(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "";
  }

  date.setDate(date.getDate() - 1);

  return formatDateInput(date);
}

function formatThaiDate(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "........";
  }

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

function getFiscalYear(value: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return INSPECTION_FISCAL_YEAR;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return String(month >= 10 ? year + 1 + 543 : year + 543);
}

function getCategoryUnit(category: string) {
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

function createInitialRows(assets: Asset[]): InspectionRow[] {
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
  if (!initialRows || initialRows.length === 0) {
    return createInitialRows(assets);
  }

  return assets.map((asset) => {
    const existingRow = initialRows.find(
      (row) => row.assetId === asset.id
    );

    if (existingRow) {
      return {
        assetId: asset.id,
        countedQty: existingRow.countedQty ?? "1",
        accuracy: existingRow.accuracy ?? "",
        status: existingRow.status ?? "",
        remark: existingRow.remark ?? "",
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

function normalizeInspectorIds(ids?: string[]) {
  const result = Array(5).fill("");

  if (!ids) {
    return result;
  }

  ids.slice(0, 5).forEach((id, index) => {
    result[index] = String(id ?? "");
  });

  return result;
}

export default function InspectionForm({
  department,
  assets,
  officers,
  initialData,
  submitUrl = "/api/assets/inspection",
  submitMethod = "POST",
  cancelHref,
  submitLabel,
}: Props) {
  const today = getCurrentDate();

  const [inspectionStartDate, setInspectionStartDate] = useState(
    initialData?.inspectionStartDate || today
  );

  const [inspectionEndDate, setInspectionEndDate] = useState(
    initialData?.inspectionEndDate || today
  );

  const [accountStartDate, setAccountStartDate] = useState(
    initialData?.accountStartDate ||
      getOneYearBefore(initialData?.inspectionStartDate || today)
  );

  const [accountEndDate, setAccountEndDate] = useState(
    initialData?.accountEndDate ||
      getOneDayBefore(initialData?.inspectionEndDate || today)
  );

  const [movementFiscalYear, setMovementFiscalYear] = useState(
    initialData?.movementFiscalYear ||
      getFiscalYear(initialData?.inspectionStartDate || today)
  );

  const [rows, setRows] = useState<InspectionRow[]>(() =>
    normalizeInitialRows(assets, initialData?.rows)
  );

  const [inspectorIds, setInspectorIds] = useState<string[]>(() =>
    normalizeInspectorIds(initialData?.inspectorIds)
  );

  const [isSaving, setIsSaving] = useState(false);

  const inspectionStartDateRef = useRef<HTMLInputElement>(null);
  const inspectionEndDateRef = useRef<HTMLInputElement>(null);

  const isEditMode = submitMethod === "PUT";

  const finalCancelHref =
    cancelHref || `/assets/${department.id}`;

  const finalSubmitLabel =
    submitLabel ||
    (isEditMode
      ? "บันทึกการแก้ไข"
      : "บันทึกผลการตรวจสอบ");

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  }

  function updateRow(
    assetId: number,
    field: keyof InspectionRow,
    value: string
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.assetId === assetId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function updateInspector(index: number, value: string) {
    setInspectorIds((current) => {
      const next = [...current];
      next[index] = value;

      return next;
    });
  }

  function getOfficer(id: string) {
    return officers.find(
      (officer) => String(officer.id) === id
    );
  }

  function isOfficerSelected(
    officerId: string,
    currentIndex: number
  ) {
    return inspectorIds.some(
      (id, index) =>
        index !== currentIndex && id === officerId
    );
  }

  async function handleSave() {
    if (!inspectionStartDate || !inspectionEndDate) {
      alert(
        "กรุณาระบุวันที่เริ่มและวันที่ตรวจสอบแล้วเสร็จ"
      );
      return;
    }

    const startDate = parseDateOnly(
      inspectionStartDate
    );

    const endDate = parseDateOnly(
      inspectionEndDate
    );

    if (!startDate || !endDate) {
      alert("รูปแบบวันที่ไม่ถูกต้อง");
      return;
    }

    if (endDate < startDate) {
      alert(
        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มดำเนินการตรวจสอบ"
      );
      return;
    }

    if (inspectorIds.some((id) => !id)) {
      alert(
        "กรุณาเลือกรายชื่อผู้ตรวจสอบให้ครบทั้ง 5 คน"
      );
      return;
    }

    const uniqueInspectorIds = new Set(
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

    if (rows.length === 0) {
      alert(
        "ไม่พบรายการครุภัณฑ์สำหรับตรวจสอบ"
      );
      return;
    }

    for (const row of rows) {
      const countedQty = Number(
        row.countedQty
      );

      if (
        !Number.isInteger(countedQty) ||
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

      const response = await fetch(
        submitUrl,
        {
          method: submitMethod,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            departmentId: department.id,

            inspectionStartDate,
            inspectionEndDate,

            accountStartDate,
            accountEndDate,

            movementFiscalYear,

            inspectorIds:
              inspectorIds.map(Number),

            rows,
          }),
        }
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            (isEditMode
              ? "ไม่สามารถแก้ไขข้อมูลได้"
              : "ไม่สามารถบันทึกข้อมูลได้")
        );
      }

      alert(
        isEditMode
          ? "แก้ไขข้อมูลการตรวจสอบเรียบร้อยแล้ว"
          : "บันทึกข้อมูลการตรวจสอบเรียบร้อยแล้ว"
      );

      /*
       * หน้าแก้ไข:
       * เมื่อบันทึกสำเร็จ ให้กลับไปหน้ารายละเอียดปีนั้น
       *
       * หน้าเพิ่มใหม่:
       * คงพฤติกรรมเดิมไว้ ไม่ redirect
       */
      if (isEditMode && finalCancelHref) {
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

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* =====================================================
          ข้อมูลการตรวจสอบ
      ===================================================== */}

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold !text-white">
            ข้อมูลการตรวจสอบ
          </h2>

          <ExportInspectionPdf
            department={department}
            assets={assets}
            rows={rows}
            inspectorIds={inspectorIds}
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
            officers={officers}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* วันที่เริ่ม */}

          <div>
            <label className="mb-2 block text-lg font-extrabold text-white">
              เริ่มดำเนินการตรวจสอบวันที่
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  openDatePicker(
                    inspectionStartDateRef.current
                  )
                }
                className="flex min-h-[46px] w-full cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-2.5 text-left font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                aria-label="เลือกวันที่เริ่มดำเนินการตรวจสอบ"
              >
                <span>
                  {formatThaiDate(
                    inspectionStartDate
                  )}
                </span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-auto h-5 w-5 shrink-0 text-slate-500"
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
              </button>

              <input
                ref={
                  inspectionStartDateRef
                }
                type="date"
                value={
                  inspectionStartDate
                }
                onChange={(e) => {
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
                    getFiscalYear(value)
                  );
                }}
                required
                aria-label="วันที่เริ่มดำเนินการตรวจสอบ"
                className="absolute bottom-0 left-0 h-px w-px opacity-0"
              />
            </div>
          </div>

          {/* วันที่เสร็จ */}

          <div>
            <label className="mb-2 block text-lg font-extrabold text-white">
              ตรวจสอบแล้วเสร็จวันที่
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  openDatePicker(
                    inspectionEndDateRef.current
                  )
                }
                className="flex min-h-[46px] w-full cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-2.5 text-left font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                aria-label="เลือกวันที่ตรวจสอบแล้วเสร็จ"
              >
                <span>
                  {formatThaiDate(
                    inspectionEndDate
                  )}
                </span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-auto h-5 w-5 shrink-0 text-slate-500"
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
              </button>

              <input
                ref={
                  inspectionEndDateRef
                }
                type="date"
                value={
                  inspectionEndDate
                }
                onChange={(e) => {
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
                aria-label="วันที่ตรวจสอบแล้วเสร็จ"
                className="absolute bottom-0 left-0 h-px w-px opacity-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ตารางตรวจสอบ
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2300px] border-collapse text-[13px] leading-tight">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  รายการ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
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
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
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
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
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
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  <span className="whitespace-nowrap">
                    จำนวนที่ตรวจนับได้
                  </span>
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
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
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  <span className="whitespace-nowrap">
                    สภาพครุภัณฑ์ที่ตรวจนับ
                  </span>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-2 text-center align-middle font-extrabold"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <th className="border border-black px-3 py-2 text-center font-extrabold">
                  รับ
                </th>

                <th className="border border-black px-3 py-2 text-center font-extrabold">
                  จ่าย
                </th>

                <th className="border border-black px-3 py-2 text-center font-extrabold">
                  ถูกต้อง
                </th>

                <th className="border border-black px-3 py-2 text-center font-extrabold">
                  ไม่ถูกต้อง
                </th>

                <th className="min-w-[105px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold">
                  ใช้งานปกติ
                </th>

                <th className="min-w-[70px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold">
                  ชำรุด
                </th>

                <th className="min-w-[95px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold">
                  เสื่อมสภาพ
                </th>

                <th className="min-w-[125px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold">
                  ไม่จำเป็นต้องใช้
                </th>
              </tr>
            </thead>

            <tbody>
              {assets.map(
                (asset, index) => {
                  const row =
                    rows.find(
                      (item) =>
                        item.assetId ===
                        asset.id
                    );

                  /*
                   * ผู้รับผิดชอบ:
                   * กลุ่มอำนวยการ แสดง "กลุ่มอำนวยการ / ชื่องาน"
                   * กลุ่มอื่น แสดงชื่อกลุ่มงาน
                   */
                  const responsibleGroup =
                    department.name ===
                    "กลุ่มอำนวยการ"
                      ? [
                          department.name,
                          asset.section
                            ?.name || "",
                        ]
                          .filter(Boolean)
                          .join(" / ")
                      : department.name;

                  return (
                    <tr
                      key={asset.id}
                      className="bg-white text-sm font-medium text-slate-900"
                    >
                      <td className="border border-black px-2 py-2 text-center align-middle">
                        {index + 1}
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

                      {/* จำนวนที่ตรวจนับ */}

                      <td className="border border-black px-2 py-2 text-center align-middle">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            row?.countedQty ??
                            "1"
                          }
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "countedQty",
                              e.target.value
                            )
                          }
                          className="mx-auto h-8 w-16 rounded border border-slate-400 px-2 py-1 text-center"
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
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "accuracy",
                              e.target.value
                            )
                          }
                          className="h-4 w-4"
                          aria-label="ถูกต้อง"
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
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "accuracy",
                              e.target.value
                            )
                          }
                          className="h-4 w-4"
                          aria-label="ไม่ถูกต้อง"
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
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "status",
                              e.target.value
                            )
                          }
                          className="h-4 w-4"
                          aria-label="ใช้งานปกติ"
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
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "status",
                              e.target.value
                            )
                          }
                          className="h-4 w-4"
                          aria-label="ชำรุด"
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
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "status",
                              e.target.value
                            )
                          }
                          className="h-4 w-4"
                          aria-label="เสื่อมสภาพ"
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
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "status",
                              e.target.value
                            )
                          }
                          className="h-4 w-4"
                          aria-label="ไม่จำเป็นต้องใช้"
                        />
                      </td>

                      {/* หมายเหตุ */}

                      <td className="border border-black px-2 py-2 align-middle">
                        <input
                          type="text"
                          value={
                            row?.remark ?? ""
                          }
                          onChange={(e) =>
                            updateRow(
                              asset.id,
                              "remark",
                              e.target.value
                            )
                          }
                          className="h-8 w-full rounded border border-slate-400 px-2 py-1"
                          placeholder=""
                        />
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          ผู้ตรวจสอบ
      ===================================================== */}

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
                <label className="mb-2 block text-lg font-extrabold">
                  ผู้ตรวจสอบคนที่{" "}
                  {index + 1}
                </label>

                <select
                  value={
                    inspectorId
                  }
                  onChange={(e) =>
                    updateInspector(
                      index,
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">
                    -- เลือกผู้ตรวจสอบ --
                  </option>

                  {officers.map(
                    (officer) => {
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
                          value={value}
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

                {inspectorId && (
                  <p className="mt-2 text-sm font-semibold text-slate-300">
                    ตำแหน่ง:{" "}
                    {getOfficer(
                      inspectorId
                    )?.position || "-"}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* =====================================================
          ปุ่ม
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href={finalCancelHref}
          className="rounded-xl bg-gradient-to-r from-slate-600 to-slate-500 px-4 py-2.5 text-base font-extrabold !text-white shadow-lg transition hover:scale-[1.02] hover:from-slate-700 hover:to-slate-600"
        >
          ยกเลิก
        </a>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2.5 text-base font-extrabold !text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? isEditMode
              ? "กำลังบันทึกการแก้ไข..."
              : "กำลังบันทึก..."
            : finalSubmitLabel}
        </button>
      </div>
    </div>
  );
}