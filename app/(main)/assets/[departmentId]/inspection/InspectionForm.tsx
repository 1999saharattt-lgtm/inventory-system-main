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
  purchaseDate: Date | null;
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

export default function InspectionForm({
  department,
  assets,
  officers,
}: Props) {
  const [inspectionStartDate, setInspectionStartDate] =
    useState(getCurrentDate());

  const [inspectionEndDate, setInspectionEndDate] =
    useState(getCurrentDate());

  const [accountStartDate, setAccountStartDate] = useState(
    getOneYearBefore(getCurrentDate())
  );

  const [accountEndDate, setAccountEndDate] = useState(
    getOneDayBefore(getCurrentDate())
  );

  const [movementFiscalYear, setMovementFiscalYear] = useState(
    getFiscalYear(getCurrentDate())
  );

  const [rows, setRows] = useState<InspectionRow[]>(
    createInitialRows(assets)
  );

  const [inspectorIds, setInspectorIds] = useState<string[]>(
    Array(5).fill("")
  );

  const [isSaving, setIsSaving] = useState(false);

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
    return officers.find((officer) => String(officer.id) === id);
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
      alert("กรุณาระบุวันที่เริ่มและวันที่ตรวจสอบแล้วเสร็จ");
      return;
    }

    const startDate = parseDateOnly(inspectionStartDate);
    const endDate = parseDateOnly(inspectionEndDate);

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
      alert("กรุณาเลือกรายชื่อผู้ตรวจสอบให้ครบทั้ง 5 คน");
      return;
    }

    const uniqueInspectorIds = new Set(inspectorIds);

    if (uniqueInspectorIds.size !== inspectorIds.length) {
      alert("ไม่สามารถเลือกผู้ตรวจสอบซ้ำกันได้");
      return;
    }

    if (rows.length === 0) {
      alert("ไม่พบรายการครุภัณฑ์สำหรับตรวจสอบ");
      return;
    }

    for (const row of rows) {
      const countedQty = Number(row.countedQty);

      if (!Number.isInteger(countedQty) || countedQty < 0) {
        alert("จำนวนที่ตรวจนับต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
        return;
      }

      if (!row.accuracy) {
        alert("กรุณาระบุผลการตรวจสอบยอดคงเหลือให้ครบทุกรายการ");
        return;
      }

      if (!row.status) {
        alert("กรุณาระบุสถานะครุภัณฑ์ให้ครบทุกรายการ");
        return;
      }
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/assets/inspection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          departmentId: department.id,
          inspectionStartDate,
          inspectionEndDate,
          inspectorIds: inspectorIds.map(Number),
          rows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "ไม่สามารถบันทึกข้อมูลได้");
      }

      alert("บันทึกข้อมูลการตรวจสอบเรียบร้อยแล้ว");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold">
            ข้อมูลการตรวจสอบ
          </h2>

          <p className="mt-1 text-lg font-bold text-slate-300">
            {department.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-lg font-extrabold text-white">
              เริ่มดำเนินการตรวจสอบวันที่
            </label>

            <div className="relative">
              <div className="pointer-events-none flex min-h-[46px] w-full items-center rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
                {formatThaiDate(inspectionStartDate)}
              </div>

              <input
                type="date"
                value={inspectionStartDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setInspectionStartDate(value);
                  setAccountStartDate(
                    getOneYearBefore(value)
                  );
                  setMovementFiscalYear(
                    getFiscalYear(value)
                  );
                }}
                required
                aria-label="วันที่เริ่มดำเนินการตรวจสอบ"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-lg font-extrabold text-white">
              ตรวจสอบแล้วเสร็จวันที่
            </label>

            <div className="relative">
              <div className="pointer-events-none flex min-h-[46px] w-full items-center rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
                {formatThaiDate(inspectionEndDate)}
              </div>

              <input
                type="date"
                value={inspectionEndDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setInspectionEndDate(value);
                  setAccountEndDate(
                    getOneDayBefore(value)
                  );
                }}
                required
                aria-label="วันที่ตรวจสอบแล้วเสร็จ"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2200px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-white text-slate-900">
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  รายการ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  <div>ยอดคงเหลือตามบัญชี</div>
                  <div>
                    ณ วันที่ {formatThaiDate(accountStartDate)}
                  </div>
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  <div>รายการเคลื่อนไหวระหว่าง</div>
                  <div>
                    ปีงบประมาณ พ.ศ. {movementFiscalYear}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  <div>ยอดคงเหลือตามบัญชี</div>
                  <div>
                    ณ วันที่ {formatThaiDate(accountEndDate)}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  จำนวนที่ตรวจนับได้
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  <div>ผลการตรวจนับถูกต้องตรงกับ</div>
                  <div>ยอดคงเหลือตามบัญชี</div>
                </th>

                <th
                  colSpan={4}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  สภาพครุภัณฑ์ที่ตรวจนับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-bold"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr className="bg-white text-slate-900">
                <th className="border border-black px-2 py-2 text-center font-bold">
                  รับ
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  จ่าย
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  ถูกต้อง
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  ไม่ถูกต้อง
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  ใช้งาน
                  <br />
                  ปกติ
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  ชำรุด
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  เสื่อมสภาพ
                </th>

                <th className="border border-black px-2 py-2 text-center font-bold">
                  ไม่จำเป็นต้องใช้
                </th>
              </tr>
            </thead>

            <tbody>
              {assets.map((asset, index) => {
                const row = rows.find(
                  (item) => item.assetId === asset.id
                );

                const responsibleOfficer = asset.officer
                  ? `${asset.officer.firstName} ${asset.officer.lastName}`
                  : "-";

                return (
                  <tr
                    key={asset.id}
                    className="bg-white text-sm font-medium text-slate-900"
                  >
                    <td className="border border-black px-2 py-3 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      {asset.governmentAssetNo || "-"}
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      {asset.officeAssetNo || "-"}
                    </td>

                    <td className="border border-black px-2 py-3">
                      {responsibleOfficer}
                    </td>

                    <td className="border border-black px-2 py-3">
                      {asset.name}
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      {getCategoryUnit(asset.category)}
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      1
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      -
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      -
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      1
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row?.countedQty ?? "1"}
                        onChange={(e) =>
                          updateRow(
                            asset.id,
                            "countedQty",
                            e.target.value
                          )
                        }
                        className="mx-auto w-16 rounded border border-slate-400 px-2 py-1 text-center"
                      />
                    </td>

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="radio"
                        name={`accuracy-${asset.id}`}
                        value="CORRECT"
                        checked={row?.accuracy === "CORRECT"}
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

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="radio"
                        name={`accuracy-${asset.id}`}
                        value="INCORRECT"
                        checked={row?.accuracy === "INCORRECT"}
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

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        value="IN_USE"
                        checked={row?.status === "IN_USE"}
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

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        value="DAMAGED"
                        checked={row?.status === "DAMAGED"}
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

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        value="DETERIORATED"
                        checked={row?.status === "DETERIORATED"}
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

                    <td className="border border-black px-2 py-3 text-center">
                      <input
                        type="radio"
                        name={`status-${asset.id}`}
                        value="UNUSABLE"
                        checked={row?.status === "UNUSABLE"}
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

                    <td className="border border-black px-2 py-3">
                      <input
                        type="text"
                        value={row?.remark ?? ""}
                        onChange={(e) =>
                          updateRow(
                            asset.id,
                            "remark",
                            e.target.value
                          )
                        }
                        className="w-full rounded border border-slate-400 px-2 py-1"
                        placeholder=""
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <h2 className="mb-6 text-2xl font-extrabold">
          รายชื่อผู้ตรวจสอบ
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {inspectorIds.map((inspectorId, index) => (
            <div key={index}>
              <label className="mb-2 block text-lg font-extrabold">
                ผู้ตรวจสอบคนที่ {index + 1}
              </label>

              <select
                value={inspectorId}
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

                {officers.map((officer) => {
                  const value = String(officer.id);

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
                      key={officer.id}
                      value={value}
                    >
                      {officer.firstName}{" "}
                      {officer.lastName}
                      {officer.position
                        ? ` (${officer.position})`
                        : ""}
                    </option>
                  );
                })}
              </select>

              {inspectorId && (
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  ตำแหน่ง:{" "}
                  {getOfficer(inspectorId)?.position ||
                    "-"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href={`/assets/${department.id}`}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2.5 text-base font-extrabold !text-white shadow-lg transition hover:scale-[1.02]"
        >
          ยกเลิก
        </a>

        <ExportInspectionPdf
          department={department}
          assets={assets}
          rows={rows}
          inspectorIds={inspectorIds}
          inspectionStartDate={inspectionStartDate}
          inspectionEndDate={inspectionEndDate}
          accountStartDate={accountStartDate}
          accountEndDate={accountEndDate}
          movementFiscalYear={movementFiscalYear}
          officers={officers}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2.5 text-base font-extrabold !text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "กำลังบันทึก..."
            : "บันทึกผลการตรวจสอบ"}
        </button>
      </div>
    </div>
  );
}
