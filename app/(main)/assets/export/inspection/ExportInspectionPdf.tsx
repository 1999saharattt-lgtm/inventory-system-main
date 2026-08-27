"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Department = {
  id: number;
  name: string;
};

type Inspection = {
  id: number;
  year: number;
  quarter: string;
  inspectionDate: string;
  status: string;
  condition: string | null;
  location: string | null;
  remark: string | null;
  inspectorName: string | null;

  asset: {
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
  };
};

type Props = {
  departments: Department[];
  inspections: Inspection[];
};

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  MONITOR: "เครื่องปรับอากาศ",
  TELEPHONE: "เครื่องโทรศัพท์",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  OTHER: "ทั่วไป",
  SHELF: "ไม่มีอยู่ในระบบ",
};

const statusName: Record<string, string> = {
  IN_USE: "ใช้งานปกติ",
  RETURNED: "ส่งคืน",
  DAMAGED: "ชำรุด",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const quarterName: Record<string, string> = {
  Q1: "ไตรมาส 1",
  Q2: "ไตรมาส 2",
  Q3: "ไตรมาส 3",
  Q4: "ไตรมาส 4",
};

function formatDate(value: string | null) {
  if (!value) return "-";

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

export default function ExportInspectionPdf({
  departments,
  inspections,
}: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [departmentId, setDepartmentId] =
    useState<string>("all");

  const [year, setYear] =
    useState<string>("all");

  const [quarter, setQuarter] =
    useState<string>("all");

  const [isExporting, setIsExporting] =
    useState(false);

  const years = Array.from(
    new Set(inspections.map((inspection) => inspection.year))
  ).sort((a, b) => b - a);

  const filteredInspections = inspections.filter(
    (inspection) => {
      const departmentMatch =
        departmentId === "all" ||
        inspection.asset.departmentId ===
          Number(departmentId);

      const yearMatch =
        year === "all" ||
        inspection.year === Number(year);

      const quarterMatch =
        quarter === "all" ||
        inspection.quarter === quarter;

      return (
        departmentMatch &&
        yearMatch &&
        quarterMatch
      );
    }
  );

  async function handleExportPdf() {
    if (
      !pdfRef.current ||
      filteredInspections.length === 0
    ) {
      return;
    }

    try {
      setIsExporting(true);

      const canvas = await html2canvas(
        pdfRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        }
      );

      const imageData =
        canvas.toDataURL("image/png");

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
        pageWidth -
        marginLeft -
        marginRight;

      const contentHeight =
        pageHeight -
        marginTop -
        marginBottom;

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

      const departmentName =
        departmentId === "all"
          ? "ทุกหน่วยงาน"
          : departments.find(
              (department) =>
                department.id ===
                Number(departmentId)
            )?.name ?? "หน่วยงาน";

      const yearText =
        year === "all"
          ? "ทุกปี"
          : year;

      const quarterText =
        quarter === "all"
          ? "ทุกไตรมาส"
          : quarterName[quarter] ??
            quarter;

      const fileName =
        `รายงานการตรวจสอบครุภัณฑ์_${departmentName}_${yearText}_${quarterText}.pdf`;

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
            🔎 เลือกรายการรายงาน
          </h2>
        </div>

        <div
          className="
            grid
            gap-4
            p-4
            sm:grid-cols-2
            lg:grid-cols-3
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
                setDepartmentId(
                  event.target.value
                )
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

              {departments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ปี */}

          <div>
            <label
              htmlFor="year"
              className="
                text-sm
                font-extrabold
                text-slate-700
              "
            >
              ปีตรวจสอบ
            </label>

            <select
              id="year"
              value={year}
              onChange={(event) =>
                setYear(event.target.value)
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
                ทุกปี
              </option>

              {years.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>
          </div>

          {/* ไตรมาส */}

          <div>
            <label
              htmlFor="quarter"
              className="
                text-sm
                font-extrabold
                text-slate-700
              "
            >
              รอบการตรวจ
            </label>

            <select
              id="quarter"
              value={quarter}
              onChange={(event) =>
                setQuarter(
                  event.target.value
                )
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
                ทุกไตรมาส
              </option>

              <option value="Q1">
                ไตรมาส 1
              </option>

              <option value="Q2">
                ไตรมาส 2
              </option>

              <option value="Q3">
                ไตรมาส 3
              </option>

              <option value="Q4">
                ไตรมาส 4
              </option>
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
              {filteredInspections.length.toLocaleString(
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
              filteredInspections.length === 0
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
        {/* Header */}

        <div className="mb-5 text-center">
          <h2
            className="
              text-2xl
              font-extrabold
              text-slate-900
            "
          >
            รายงานการตรวจสอบครุภัณฑ์
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

            {year === "all"
              ? "ทุกปี"
              : year}

            {" / "}

            {quarter === "all"
              ? "ทุกไตรมาส"
              : quarterName[quarter] ??
                quarter}
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
                  หน่วยงาน
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
                  รอบตรวจ
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
                  วันที่ตรวจ
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
                  ผลการตรวจ
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
                  สภาพ
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
                  สถานที่
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
                  ผู้ตรวจ
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInspections.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
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
                    ไม่พบข้อมูลการตรวจสอบครุภัณฑ์
                  </td>
                </tr>
              ) : (
                filteredInspections.map(
                  (inspection, index) => (
                    <tr key={inspection.id}>
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
                        {inspection.asset.name}
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
                        {categoryName[
                          inspection.asset.category
                        ] ??
                          inspection.asset.category}
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
                        {inspection.asset
                          .governmentAssetNo ||
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
                        {inspection.asset
                          .officeAssetNo ||
                          "-"}
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
                        {
                          inspection.asset
                            .departmentName
                        }
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
                        {quarterName[
                          inspection.quarter
                        ] ??
                          inspection.quarter}

                        <br />

                        {inspection.year}
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
                          inspection.inspectionDate
                        )}
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
                        {statusName[
                          inspection.status
                        ] ??
                          inspection.status}
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
                        {inspection.condition ||
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
                        {inspection.location ||
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
                        {inspection.inspectorName ||
                          "-"}
                      </td>
                    </tr>
                  )
                )
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
            จำนวน{" "}
            {filteredInspections.length.toLocaleString(
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