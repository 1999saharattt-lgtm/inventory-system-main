"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ExportAssetsPdf({
  departments,
  assets,
}: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [departmentId, setDepartmentId] =
    useState<string>("all");

  const [category, setCategory] =
    useState<string>("all");

  const [isExporting, setIsExporting] =
    useState(false);

  const filteredAssets = assets.filter((asset) => {
    const departmentMatch =
      departmentId === "all" ||
      asset.departmentId === Number(departmentId);

    const categoryMatch =
      category === "all" ||
      asset.category === category;

    return departmentMatch && categoryMatch;
  });

  const categories = Array.from(
    new Set(assets.map((asset) => asset.category))
  );

  async function handleExportPdf() {
    if (!pdfRef.current || filteredAssets.length === 0) {
      return;
    }

    try {
      setIsExporting(true);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 297;
      const pageHeight = 210;

      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 8;
      const marginBottom = 8;

      const contentWidth =
        pageWidth - marginLeft - marginRight;

      const contentHeight =
        pageHeight - marginTop - marginBottom;

      const imageRatio =
        canvas.width / canvas.height;

      let imageWidth = contentWidth;
      let imageHeight = imageWidth / imageRatio;

      if (imageHeight > contentHeight) {
        imageHeight = contentHeight;
        imageWidth = imageHeight * imageRatio;
      }

      const x =
        marginLeft +
        (contentWidth - imageWidth) / 2;

      const y =
        marginTop +
        (contentHeight - imageHeight) / 2;

      pdf.addImage(
        imageData,
        "PNG",
        x,
        y,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
      );

      const departmentName =
        departmentId === "all"
          ? "ทุกหน่วยงาน"
          : departments.find(
              (department) =>
                department.id === Number(departmentId)
            )?.name ?? "หน่วยงาน";

      const categoryText =
        category === "all"
          ? "ทุกประเภท"
          : categoryName[category] ?? category;

      const fileName =
        `ทะเบียนคุมครุภัณฑ์_${departmentName}_${categoryText}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* =====================================================
          Filter
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-300
          bg-white
          shadow-xl
        "
      >
        <div
          className="
            border-b
            border-slate-900
            bg-gradient-to-r
            from-slate-800
            to-slate-700
            px-4
            py-4
            sm:px-6
          "
        >
          <h2 className="text-lg font-extrabold !text-white sm:text-xl">
            🔎 เลือกรายการส่งออก
          </h2>
        </div>

        <div
          className="
            grid
            gap-4
            p-4
            sm:grid-cols-2
            sm:p-6
          "
        >
          {/* หน่วยงาน */}

          <div>
            <label
              htmlFor="department"
              className="
                text-sm
                font-extrabold
                text-slate-700
              "
            >
              หน่วยงาน
            </label>

            <select
              id="department"
              value={departmentId}
              onChange={(event) =>
                setDepartmentId(event.target.value)
              }
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                font-semibold
                text-slate-900
                outline-none
                focus:border-emerald-600
                focus:ring-2
                focus:ring-emerald-200
              "
            >
              <option value="all">
                ทุกหน่วยงาน
              </option>

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

          {/* ประเภท */}

          <div>
            <label
              htmlFor="category"
              className="
                text-sm
                font-extrabold
                text-slate-700
              "
            >
              ประเภทครุภัณฑ์
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                font-semibold
                text-slate-900
                outline-none
                focus:border-emerald-600
                focus:ring-2
                focus:ring-emerald-200
              "
            >
              <option value="all">
                ทุกประเภท
              </option>

              {categories.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {categoryName[value] ?? value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="
            flex
            flex-col
            gap-3
            border-t
            border-slate-200
            p-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          <p className="font-bold text-slate-600">
            พบทั้งหมด{" "}
            <span className="font-extrabold text-slate-900">
              {filteredAssets.length.toLocaleString("th-TH")}
            </span>{" "}
            รายการ
          </p>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={
              isExporting ||
              filteredAssets.length === 0
            }
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-6
              py-3
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              hover:from-emerald-700
              hover:to-green-600
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            {isExporting
              ? "⏳ กำลังสร้าง PDF..."
              : "📄 ส่งออก PDF"}
          </button>
        </div>
      </div>

      {/* =====================================================
          PDF Content
      ===================================================== */}

      <div
        ref={pdfRef}
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-5
          shadow-xl
        "
      >
        {/* PDF Header */}

        <div className="mb-5 text-center">
          <h2
            className="
              text-2xl
              font-extrabold
              text-slate-900
            "
          >
            ทะเบียนคุมครุภัณฑ์
          </h2>

          <p
            className="
              mt-2
              text-base
              font-bold
              text-slate-700
            "
          >
            สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
          </p>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              text-slate-600
            "
          >
            {departmentId === "all"
              ? "ทุกหน่วยงาน"
              : departments.find(
                  (department) =>
                    department.id ===
                    Number(departmentId)
                )?.name ?? "-"}

            {" / "}

            {category === "all"
              ? "ทุกประเภท"
              : categoryName[category] ?? category}
          </p>
        </div>

        {/* Table */}

        <div className="overflow-hidden">
          <table
            className="
              w-full
              border-collapse
              border
              border-black
              text-xs
            "
          >
            <thead>
              <tr
                className="
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  text-white
                "
              >
                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-center
                    font-extrabold
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-left
                    font-extrabold
                  "
                >
                  รายการครุภัณฑ์
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-center
                    font-extrabold
                  "
                >
                  ประเภท
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-left
                    font-extrabold
                  "
                >
                  ยี่ห้อ / รุ่น
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-left
                    font-extrabold
                  "
                >
                  เลขครุภัณฑ์กรม
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-left
                    font-extrabold
                  "
                >
                  เลขครุภัณฑ์ประจำสำนัก
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-center
                    font-extrabold
                  "
                >
                  ผู้ครอบครอง
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-center
                    font-extrabold
                  "
                >
                  สถานะ
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-center
                    font-extrabold
                  "
                >
                  วันที่จัดซื้อ
                </th>

                <th
                  className="
                    border
                    border-black
                    px-2
                    py-2
                    text-right
                    font-extrabold
                  "
                >
                  ราคา
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="
                      border
                      border-black
                      px-4
                      py-8
                      text-center
                      font-bold
                      text-slate-500
                    "
                  >
                    ไม่พบข้อมูลครุภัณฑ์
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, index) => (
                  <tr key={asset.id}>
                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        font-semibold
                        text-slate-900
                      "
                    >
                      {asset.name}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {categoryName[asset.category] ??
                        asset.category}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        font-semibold
                        text-slate-900
                      "
                    >
                      {asset.brand || asset.model
                        ? [
                            asset.brand,
                            asset.model,
                          ]
                            .filter(Boolean)
                            .join(" / ")
                        : "-"}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        font-semibold
                        text-slate-900
                      "
                    >
                      {asset.governmentAssetNo ||
                        "-"}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        font-semibold
                        text-slate-900
                      "
                    >
                      {asset.officeAssetNo || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {asset.officerName || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {statusName[asset.status] ??
                        asset.status}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {formatDate(
                        asset.purchaseDate
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-right
                        font-semibold
                        text-slate-900
                      "
                    >
                      {formatPrice(asset.price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div
          className="
            mt-4
            flex
            justify-between
            text-xs
            font-semibold
            text-slate-600
          "
        >
          <span>
            จำนวน {filteredAssets.length.toLocaleString("th-TH")} รายการ
          </span>

          <span>
            พิมพ์วันที่{" "}
            {new Date().toLocaleDateString("th-TH")}
          </span>
        </div>
      </div>
    </div>
  );
}