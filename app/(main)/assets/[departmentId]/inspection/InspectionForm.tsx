"use client";

import { useState } from "react";
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
    position: string;
  } | null;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  type: string;
  departmentId: number | null;
  sectionId: number | null;
  department: {
    id: number;
    name: string;
  } | null;
  section: {
    id: number;
    name: string;
  } | null;
};

type Props = {
  department: Department;
  assets: Asset[];
  officers: Officer[];
};

type InspectionRow = {
  assetId: number;
  countedQty: string;
  accuracy: string;
  status: string;
  remark: string;
};

const inspectionStatuses = [
  {
    value: "IN_USE",
    label: "ใช้งาน",
  },
  {
    value: "DAMAGED",
    label: "ชำรุด",
  },
  {
    value: "DETERIORATED",
    label: "เสื่อมสภาพ",
  },
  {
    value: "UNUSABLE",
    label: "ไม่สามารถใช้งาน",
  },
];

const accuracyOptions = [
  {
    value: "CORRECT",
    label: "ถูกต้อง",
  },
  {
    value: "INCORRECT",
    label: "ไม่ถูกต้อง",
  },
];

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

const thaiMonthsShort = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getOneYearBefore(value: string) {
  if (!value) return "";

  const date = parseDateOnly(value);
  date.setFullYear(date.getFullYear() - 1);

  return formatDateInput(date);
}

function getOneDayBefore(value: string) {
  if (!value) return "";

  const date = parseDateOnly(value);
  date.setDate(date.getDate() - 1);

  return formatDateInput(date);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatThaiDateDisplay(value: string) {
  if (!value) return "เลือกวันที่";

  const date = parseDateOnly(value);
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

function formatThaiShortDate(value: string) {
  if (!value) return "........";

  const date = parseDateOnly(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = thaiMonthsShort[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

function getCategoryUnit(category: string) {
  const categoryUnit: Record<string, string> = {
    COMPUTER: "เครื่อง",
    DESKTOP: "เครื่อง",
    LAPTOP: "เครื่อง",
    PRINTER: "เครื่อง",
    TELEPHONE: "เครื่อง",
    AIR_CONDITIONER: "เครื่อง",
    FAN: "เครื่อง",
    CHAIR: "ตัว",
    DESK: "ตัว",
    CABINET: "ตู้",
    TABLE: "ตัว",
    OTHER: "รายการ",
  };

  return categoryUnit[category] || "รายการ";
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

export default function InspectionForm({
  department,
  assets,
  officers,
}: Props) {
  const [inspectionStartDate, setInspectionStartDate] =
    useState(getCurrentDate());

  const [inspectionEndDate, setInspectionEndDate] =
    useState(getCurrentDate());

  const accountStartDate = getOneYearBefore(inspectionStartDate);
  const accountEndDate = getOneDayBefore(inspectionEndDate);

  const [rows, setRows] = useState<InspectionRow[]>(() =>
    createInitialRows(assets),
  );

  const [inspectorIds, setInspectorIds] = useState<string[]>(
    Array.from({ length: 5 }, () => ""),
  );

  function updateRow(
    index: number,
    key: keyof InspectionRow,
    value: string,
  ) {
    const copy = [...rows];

    copy[index] = {
      ...copy[index],
      [key]: value,
    };

    setRows(copy);
  }

  function updateInspector(index: number, value: string) {
    const copy = [...inspectorIds];

    copy[index] = value;

    setInspectorIds(copy);
  }

  function getOfficer(officerId: string) {
    return officers.find(
      (officer) => String(officer.id) === officerId,
    );
  }

  function isOfficerSelected(
    officerId: number,
    currentIndex: number,
  ) {
    return inspectorIds.some(
      (selectedId, index) =>
        index !== currentIndex &&
        selectedId === String(officerId),
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* =========================================================
          INFORMATION CARD
      ========================================================= */}
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white shadow-xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold sm:text-2xl">
            ตรวจสอบครุภัณฑ์
          </h2>

          <p className="mt-1 text-sm text-slate-300 sm:text-base">
            {department.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-white">
              เริ่มดำเนินการตรวจสอบ
            </label>

            <input
              type="date"
              value={inspectionStartDate}
              onChange={(event) =>
                setInspectionStartDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />

            <p className="mt-1 text-xs text-slate-400">
              {formatThaiDateDisplay(inspectionStartDate)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white">
              ตรวจสอบแล้วเสร็จ
            </label>

            <input
              type="date"
              value={inspectionEndDate}
              onChange={(event) =>
                setInspectionEndDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />

            <p className="mt-1 text-xs text-slate-400">
              {formatThaiDateDisplay(inspectionEndDate)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <ExportInspectionPdf
            department={department}
            assets={assets}
            rows={rows}
            officers={officers}
            inspectorIds={inspectorIds}
            inspectionStartDate={inspectionStartDate}
            inspectionEndDate={inspectionEndDate}
          />
        </div>
      </div>

      {/* =========================================================
          INSPECTION TABLE
      ========================================================= */}
      <div className="w-full rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-2 text-white shadow-xl sm:p-3 lg:p-4">
        <div className="mb-3">
          <h2 className="text-lg font-extrabold sm:text-xl">
            รายการครุภัณฑ์
          </h2>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            กรุณาตรวจสอบข้อมูลและบันทึกผลการตรวจนับครุภัณฑ์
          </p>
        </div>

        <div className="w-full min-w-0 overflow-x-auto overflow-y-visible rounded-xl bg-white [scrollbar-width:thin]">
          <table className="min-w-[2050px] w-full table-fixed border-collapse text-xs leading-tight">
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "6.5%" }} />
              <col style={{ width: "9.5%" }} />
              <col style={{ width: "10.5%" }} />
              <col style={{ width: "3.5%" }} />

              {/* ยอดคงเหลือตามบัญชี ณ วันที่เริ่มต้น
                  รับ / จ่าย ต้องสมดุลและมีพื้นที่เพียงพอ */}
              <col style={{ width: "5%" }} />
              <col style={{ width: "5%" }} />

              {/* ยอดคงเหลือตามบัญชี ณ วันที่สิ้นสุด */}
              <col style={{ width: "8%" }} />

              <col style={{ width: "6%" }} />

              <col style={{ width: "4%" }} />
              <col style={{ width: "5%" }} />

              <col style={{ width: "4%" }} />
              <col style={{ width: "4%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "7%" }} />

              <col style={{ width: "9%" }} />
            </colgroup>

            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  รายการ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  หน่วย
                </th>

                {/* =================================================
                    GROUP 1
                    ยอดคงเหลือตามบัญชี
                    ณ วันที่ 07 ก.ย. 2568
                    ครอบ 2 ช่อง รับ / จ่าย เท่านั้น
                ================================================= */}
                <th
                  colSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  <div className="flex min-w-0 flex-col items-center justify-center leading-tight">
                    <span className="whitespace-nowrap text-xs font-extrabold">
                      ยอดคงเหลือตามบัญชี
                    </span>

                    <span className="mt-1 whitespace-nowrap text-xs font-extrabold">
                      ณ วันที่ {formatThaiShortDate(accountStartDate)}
                    </span>
                  </div>
                </th>

                {/* =================================================
                    GROUP 2
                    ช่องแยกเดี่ยว ไม่รวมกับ รับ / จ่าย
                ================================================= */}
                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  <div className="flex min-w-0 flex-col items-center justify-center leading-tight">
                    <span className="whitespace-nowrap text-xs font-extrabold">
                      ยอดคงเหลือตามบัญชี
                    </span>

                    <span className="mt-1 whitespace-nowrap text-xs font-extrabold">
                      ณ วันที่ {formatThaiShortDate(accountEndDate)}
                    </span>
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  จำนวนที่ตรวจนับได้
                </th>

                <th
                  colSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  <div className="flex min-w-0 flex-col items-center justify-center leading-tight">
                    <span className="whitespace-nowrap text-xs font-extrabold">
                      ผลการตรวจนับ
                    </span>

                    <span className="mt-1 whitespace-nowrap text-xs font-extrabold">
                      ถูกต้องตรงกับยอดคงเหลือตามบัญชี
                    </span>
                  </div>
                </th>

                <th
                  colSpan={4}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap text-xs font-extrabold">
                    สภาพครุภัณฑ์ที่ตรวจนับ
                  </span>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                {/* รับ / จ่าย */}
                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  รับ
                </th>

                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  จ่าย
                </th>

                {/* ผลการตรวจนับ */}
                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ถูกต้อง
                </th>

                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ไม่ถูกต้อง
                </th>

                {/* สภาพครุภัณฑ์ */}
                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ใช้งาน
                </th>

                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ชำรุด
                </th>

                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  เสื่อมสภาพ
                </th>

                <th
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-2 text-center align-middle text-xs font-extrabold !text-white"
                >
                  ไม่สามารถใช้งาน
                </th>
              </tr>
            </thead>

            <tbody>
              {assets.map((asset, index) => {
                const row = rows[index];
                const officer = asset.officer;

                return (
                  <tr
                    key={asset.id}
                    className="transition hover:bg-emerald-50"
                  >
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      {index + 1}
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      {asset.governmentAssetNo || "-"}
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      {asset.officeAssetNo || "-"}
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      {officer
                        ? `${officer.firstName} ${officer.lastName}`
                        : "-"}
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-left align-middle text-xs text-slate-900">
                      {asset.name}

                      {(asset.brand || asset.model) && (
                        <span className="ml-1">
                          (
                          {[
                            asset.brand,
                            asset.model,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                          )
                        </span>
                      )}
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      {getCategoryUnit(asset.category)}
                    </td>

                    {/* รับ */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      -
                    </td>

                    {/* จ่าย */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      -
                    </td>

                    {/* ยอดคงเหลือ ณ วันสิ้นสุด */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle text-xs text-slate-900">
                      -
                    </td>

                    {/* จำนวนที่ตรวจนับได้ */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="number"
                        min="0"
                        value={row?.countedQty ?? ""}
                        onChange={(event) =>
                          updateRow(
                            index,
                            "countedQty",
                            event.target.value,
                          )
                        }
                        className="w-full min-w-[55px] rounded-lg border border-slate-300 px-2 py-1 text-center text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>

                    {/* ถูกต้อง */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="radio"
                        name={`accuracy-${asset.id}`}
                        checked={row?.accuracy === "CORRECT"}
                        onChange={() =>
                          updateRow(
                            index,
                            "accuracy",
                            "CORRECT",
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>

                    {/* ไม่ถูกต้อง */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="radio"
                        name={`accuracy-${asset.id}`}
                        checked={row?.accuracy === "INCORRECT"}
                        onChange={() =>
                          updateRow(
                            index,
                            "accuracy",
                            "INCORRECT",
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>

                    {/* ใช้งาน */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        checked={row?.status === "IN_USE"}
                        onChange={() =>
                          updateRow(
                            index,
                            "status",
                            "IN_USE",
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>

                    {/* ชำรุด */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        checked={row?.status === "DAMAGED"}
                        onChange={() =>
                          updateRow(
                            index,
                            "status",
                            "DAMAGED",
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>

                    {/* เสื่อมสภาพ */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        checked={
                          row?.status === "DETERIORATED"
                        }
                        onChange={() =>
                          updateRow(
                            index,
                            "status",
                            "DETERIORATED",
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>

                    {/* ไม่สามารถใช้งาน */}
                    <td className="border border-slate-300 px-2 py-2 text-center align-middle">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        checked={
                          row?.status === "UNUSABLE"
                        }
                        onChange={() =>
                          updateRow(
                            index,
                            "status",
                            "UNUSABLE",
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>

                    {/* หมายเหตุ */}
                    <td className="border border-slate-300 px-2 py-2 align-middle">
                      <input
                        type="text"
                        value={row?.remark ?? ""}
                        onChange={(event) =>
                          updateRow(
                            index,
                            "remark",
                            event.target.value,
                          )
                        }
                        className="w-full min-w-[120px] rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}

              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={17}
                    className="border border-slate-300 px-4 py-8 text-center text-xs text-slate-500"
                  >
                    ไม่พบรายการครุภัณฑ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          INSPECTORS
      ========================================================= */}
      <div className="w-full rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white shadow-xl sm:p-6">
        <h2 className="mb-4 text-lg font-extrabold sm:text-xl">
          รายชื่อผู้ตรวจสอบ
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {inspectorIds.map((inspectorId, index) => {
            const selectedOfficer = getOfficer(inspectorId);

            return (
              <div key={index}>
                <label className="mb-2 block text-sm font-bold">
                  ผู้ตรวจสอบคนที่ {index + 1}
                </label>

                <select
                  value={inspectorId}
                  onChange={(event) =>
                    updateInspector(
                      index,
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">
                    -- เลือกรายชื่อผู้ตรวจสอบ --
                  </option>

                  {officers.map((officer) => (
                    <option
                      key={officer.id}
                      value={officer.id}
                      disabled={isOfficerSelected(
                        officer.id,
                        index,
                      )}
                    >
                      {officer.firstName}{" "}
                      {officer.lastName}
                    </option>
                  ))}
                </select>

                {selectedOfficer && (
                  <p className="mt-1 text-xs text-slate-400">
                    ตำแหน่ง:{" "}
                    {selectedOfficer.position || "-"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          ACTION BUTTONS
      ========================================================= */}
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-100"
        >
          ยกเลิก
        </button>

        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-emerald-700 hover:to-green-600"
        >
          บันทึกผลการตรวจสอบ
        </button>
      </div>
    </div>
  );
}