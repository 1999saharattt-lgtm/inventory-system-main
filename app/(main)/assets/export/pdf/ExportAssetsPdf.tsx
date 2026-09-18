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

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

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

  const [isExporting, setIsExporting] =
    useState(false);

  // =====================================================
  // Filter
  //
  // เหลือเฉพาะการกรองตามหน่วยงาน
  // ไม่มีการกรองตามประเภทแล้ว
  // =====================================================

  const filteredAssets = assets.filter((asset) => {
    return (
      departmentId === "all" ||
      asset.departmentId === Number(departmentId)
    );
  });

  // =====================================================
  // Export PDF
  // =====================================================

  async function handleExportPdf() {
    if (
      !pdfRef.current ||
      filteredAssets.length === 0 ||
      isExporting
    ) {
      return;
    }

    try {
      setIsExporting(true);

      // =================================================
      // HTML -> Canvas
      // =================================================

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png");

      // =================================================
      // PDF A4 Landscape
      // =================================================

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
      let imageHeight =
        imageWidth / imageRatio;

      if (imageHeight > contentHeight) {
        imageHeight = contentHeight;
        imageWidth =
          imageHeight * imageRatio;
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

      // =================================================
      // ชื่อหน่วยงาน
      // =================================================

      const departmentName =
        departmentId === "all"
          ? "ทุกหน่วยงาน"
          : departments.find(
              (department) =>
                department.id === Number(departmentId)
            )?.name ?? "หน่วยงาน";

      // =================================================
      // ชื่อไฟล์
      //
      // เอาประเภทออกจากชื่อไฟล์ด้วย
      // =================================================

      const fileName =
        `ทะเบียนคุมครุภัณฑ์_${departmentName}.pdf`;

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

        {/* =================================================
            เลือกหน่วยงาน

            เอาตัวเลือก "ประเภทครุภัณฑ์" ออกแล้ว
        ================================================= */}

        <div className="p-4 sm:p-6">
          <div className="w-full sm:max-w-xl">
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
        </div>

        {/* =================================================
            จำนวนรายการ + ปุ่ม Export
        ================================================= */}

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
              {filteredAssets.length.toLocaleString(
                "th-TH"
              )}
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
        {/* =================================================
            PDF Header
        ================================================= */}

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

          {/* ===============================================
              แสดงเฉพาะหน่วยงาน
              ไม่มี "/ ทุกประเภท" แล้ว
          =============================================== */}

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
          </p>
        </div>

        {/* =================================================
            Table

            เอาคอลัมน์ "ประเภท" ออก
        ================================================= */}

        <div className="overflow-hidden">
          <table
            className="
              w-full
              table-fixed
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
                {/* ลำดับ */}

                <th
                  className="
                    w-[5%]
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

                {/* รายการครุภัณฑ์ */}

                <th
                  className="
                    w-[23%]
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

                {/* ยี่ห้อ / รุ่น */}

                <th
                  className="
                    w-[13%]
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

                {/* เลขครุภัณฑ์กรม */}

                <th
                  className="
                    w-[14%]
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

                {/* เลขครุภัณฑ์ประจำสำนัก */}

                <th
                  className="
                    w-[15%]
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

                {/* ผู้ครอบครอง */}

                <th
                  className="
                    w-[11%]
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

                {/* สถานะ */}

                <th
                  className="
                    w-[7%]
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

                {/* วันที่จัดซื้อ */}

                <th
                  className="
                    w-[7%]
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

                {/* ราคา */}

                <th
                  className="
                    w-[5%]
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
                    colSpan={9}
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
                filteredAssets.map(
                  (asset, index) => (
                    <tr key={asset.id}>
                      {/* ลำดับ */}

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

                      {/* รายการครุภัณฑ์ */}

                      <td
                        className="
                          break-words
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

                      {/* ยี่ห้อ / รุ่น */}

                      <td
                        className="
                          break-words
                          border
                          border-black
                          px-2
                          py-2
                          font-semibold
                          text-slate-900
                        "
                      >
                        {asset.brand ||
                        asset.model
                          ? [
                              asset.brand,
                              asset.model,
                            ]
                              .filter(Boolean)
                              .join(" / ")
                          : "-"}
                      </td>

                      {/* เลขครุภัณฑ์กรม */}

                      <td
                        className="
                          break-all
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

                      {/* เลขครุภัณฑ์ประจำสำนัก */}

                      <td
                        className="
                          break-all
                          border
                          border-black
                          px-2
                          py-2
                          font-semibold
                          text-slate-900
                        "
                      >
                        {asset.officeAssetNo ||
                          "-"}
                      </td>

                      {/* ผู้ครอบครอง */}

                      <td
                        className="
                          break-words
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

                      {/* สถานะ */}

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
                        {statusName[
                          asset.status
                        ] ?? asset.status}
                      </td>

                      {/* วันที่จัดซื้อ */}

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

                      {/* ราคา */}

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
                        {formatPrice(
                          asset.price
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            Footer
        ================================================= */}

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
            จำนวน{" "}
            {filteredAssets.length.toLocaleString(
              "th-TH"
            )}{" "}
            รายการ
          </span>

          <span>
            พิมพ์วันที่{" "}
            {new Date().toLocaleDateString(
              "th-TH"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}