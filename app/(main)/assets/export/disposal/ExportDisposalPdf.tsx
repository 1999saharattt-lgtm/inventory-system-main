"use client";

import React, { useMemo, useState } from "react";

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
  departmentName: string;
  sectionName: string | null;
  officerName: string | null;
  status: string;
  purchaseDate: string | null;
  price: number | null;
  location: string | null;
  remark: string | null;
};

type Props = {
  departments: Department[];
  assets: Asset[];
};

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  CABINET: "ตู้",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอคอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "โทรศัพท์",
  SHELF: "ชั้นวาง/ชั้นใส่แฟ้ม",
  OTHER: "อื่น ๆ",
};

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

export default function ExportDisposalPdf({
  departments,
  assets,
}: Props) {
  const [departmentId, setDepartmentId] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("WAITING_DISPOSAL");

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (
        departmentId &&
        asset.departmentId !== Number(departmentId)
      ) {
        return false;
      }

      if (category && asset.category !== category) {
        return false;
      }

      if (status && asset.status !== status) {
        return false;
      }

      return true;
    });
  }, [assets, departmentId, category, status]);

  const handlePrint = () => {
    if (filteredAssets.length === 0) {
      alert("ไม่พบรายการครุภัณฑ์สำหรับจัดทำรายงาน");
      return;
    }

    window.print();
  };

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl print:hidden">
        <div className="border-b border-slate-900 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-extrabold !text-white sm:text-xl">
            🗂️ เลือกรายการสำหรับส่งออก
          </h2>
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <div>
            <label
              htmlFor="departmentId"
              className="text-sm font-extrabold text-slate-700"
            >
              หน่วยงาน
            </label>

            <select
              id="departmentId"
              value={departmentId}
              onChange={(event) =>
                setDepartmentId(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">ทุกหน่วยงาน</option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category"
              className="text-sm font-extrabold text-slate-700"
            >
              ประเภทครุภัณฑ์
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">ทุกประเภท</option>

              {Object.entries(categoryName).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="text-sm font-extrabold text-slate-700"
            >
              สถานะ
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">ทุกสถานะ</option>

              <option value="WAITING_DISPOSAL">
                {statusName.WAITING_DISPOSAL}
              </option>

              <option value="DISPOSED">
                {statusName.DISPOSED}
              </option>

              <option value="IN_USE">
                {statusName.IN_USE}
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="font-extrabold text-slate-700">
            พบรายการ{" "}
            <span className="text-emerald-700">
              {filteredAssets.length.toLocaleString("th-TH")}
            </span>{" "}
            รายการ
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 font-extrabold !text-white shadow-lg transition hover:scale-[1.02] hover:from-emerald-700 hover:to-green-600 active:scale-[0.98] sm:w-auto"
          >
            🖨️ พิมพ์ / บันทึกเป็น PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-extrabold">
            รายงานทะเบียนครุภัณฑ์รอจำหน่าย
          </h1>

          <p className="mt-2 text-base">
            {departmentId
              ? departments.find(
                  (department) =>
                    department.id === Number(departmentId)
                )?.name ?? "ทุกหน่วยงาน"
              : "ทุกหน่วยงาน"}
          </p>

          <p className="mt-1 text-base">
            ประเภท:{" "}
            {category
              ? categoryName[category] ?? category
              : "ทุกประเภท"}
            {"   "}
            สถานะ:{" "}
            {status
              ? statusName[status] ?? status
              : "ทุกสถานะ"}
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black px-2 py-2 text-center">
                ลำดับ
              </th>

              <th className="border border-black px-2 py-2 text-left">
                รายการครุภัณฑ์
              </th>

              <th className="border border-black px-2 py-2 text-center">
                ประเภท
              </th>

              <th className="border border-black px-2 py-2 text-center">
                เลขครุภัณฑ์กรม
              </th>

              <th className="border border-black px-2 py-2 text-center">
                เลขครุภัณฑ์ประจำสำนัก
              </th>

              <th className="border border-black px-2 py-2 text-left">
                หน่วยงาน
              </th>

              <th className="border border-black px-2 py-2 text-left">
                กลุ่มงาน
              </th>

              <th className="border border-black px-2 py-2 text-left">
                ผู้ครอบครอง
              </th>

              <th className="border border-black px-2 py-2 text-center">
                สถานะ
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredAssets.map((asset, index) => (
              <tr key={asset.id}>
                <td className="border border-black px-2 py-2 text-center">
                  {index + 1}
                </td>

                <td className="border border-black px-2 py-2">
                  {asset.name}
                </td>

                <td className="border border-black px-2 py-2 text-center">
                  {categoryName[asset.category] ??
                    asset.category}
                </td>

                <td className="border border-black px-2 py-2 text-center">
                  {asset.governmentAssetNo ?? "-"}
                </td>

                <td className="border border-black px-2 py-2 text-center">
                  {asset.officeAssetNo ?? "-"}
                </td>

                <td className="border border-black px-2 py-2">
                  {asset.departmentName}
                </td>

                <td className="border border-black px-2 py-2">
                  {asset.sectionName ?? "-"}
                </td>

                <td className="border border-black px-2 py-2">
                  {asset.officerName ?? "-"}
                </td>

                <td className="border border-black px-2 py-2 text-center">
                  {statusName[asset.status] ??
                    asset.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 text-right text-sm">
          จำนวนทั้งสิ้น{" "}
          <span className="font-extrabold">
            {filteredAssets.length.toLocaleString("th-TH")}
          </span>{" "}
          รายการ
        </div>
      </div>
    </>
  );
}