"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Asset = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
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
  departmentName: string;
  assets: Asset[];
};

const categoryUnit: Record<string, string> = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  CABINET: "ตัว",
  COMPUTER: "เครื่อง",
  PRINTER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

/* =========================================================
   เดือนภาษาไทย
   ========================================================= */

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

const thaiMonthShort = [
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

/* =========================================================
   ปีงบประมาณราชการ
   ========================================================= */

function getFiscalYear(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month >= 10
    ? year + 1 + 543
    : year + 543;
}

/* =========================================================
   แปลงวันที่จาก input type="date"
   เป็น Date โดยไม่ให้ timezone ทำให้วันที่เลื่อน
   ========================================================= */

function parseInputDate(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

/* =========================================================
   วันที่ภาษาไทยแบบเต็ม
   ========================================================= */

function formatThaiDate(
  value: string
) {
  const date = parseInputDate(value);

  if (!date) {
    return "-";
  }

  const day = date.getDate();
  const month =
    thaiMonths[date.getMonth()];
  const year =
    date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

/* =========================================================
   วันที่ภาษาไทยแบบย่อ
   เช่น 1 ต.ค. 2568
   ========================================================= */

function formatThaiShortDate(
  value: string
) {
  const date = parseInputDate(value);

  if (!date) {
    return "-";
  }

  const day = date.getDate();
  const month =
    thaiMonthShort[date.getMonth()];
  const year =
    date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

/* =========================================================
   สถานะครุภัณฑ์
   ========================================================= */

function getConditionMark(
  status: string,
  condition: string
) {
  if (condition === "normal") {
    return status === "IN_USE"
      ? "/"
      : "";
  }

  if (condition === "damaged") {
    return status === "DAMAGED"
      ? "/"
      : "";
  }

  if (condition === "deteriorated") {
    return status === "WAITING_DISPOSAL"
      ? "/"
      : "";
  }

  if (condition === "notRequired") {
    return status === "DISPOSED"
      ? "/"
      : "";
  }

  return "";
}

function getInspectionMark(
  status: string
) {
  return status === "IN_USE" ||
    status === "DAMAGED" ||
    status === "WAITING_DISPOSAL" ||
    status === "DISPOSED"
    ? "/"
    : "";
}

/* =========================================================
   Component
   ========================================================= */

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const pdfRef =
    useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] =
    useState(false);

  /* =========================================================
     วันที่ตรวจสอบ
     ผู้ใช้เลือกเอง
     ========================================================= */

  const today = new Date();

  const defaultDate =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

  const [inspectionStartDate, setInspectionStartDate] =
    useState(defaultDate);

  const [inspectionEndDate, setInspectionEndDate] =
    useState(defaultDate);

  /* =========================================================
     ปีงบประมาณ
     อ้างอิงจากวันที่เริ่มตรวจสอบ
     ========================================================= */

  const startDateObject =
    parseInputDate(
      inspectionStartDate
    );

  const fiscalYear =
    startDateObject
      ? getFiscalYear(startDateObject)
      : getFiscalYear(today);

  /* =========================================================
     A4 แนวนอน
     พื้นที่จริง 297 x 210 mm
     ขอบ 10 mm
     ========================================================= */

  const pdfWidth = 277;
  const pdfHeight = 190;

  /*
   * ฟอนต์ต้นฉบับ 14 pt
   * เนื้อหา PDF จะถูกย่อเหลือ 70%
   * ตอนนำลง A4 เพื่อให้ตารางยังพอดีหน้า
   */

  const pdfScale = 0.7;

  /*
   * จำนวนรายการต่อหน้า
   * เพิ่มขนาดฟอนต์เป็น 14 pt
   * จึงลดจำนวนแถวลงเพื่อไม่ให้ชนพื้นที่ลายเซ็น
   */

  const rowsPerPage = 12;

  const totalPages = Math.max(
    1,
    Math.ceil(
      assets.length / rowsPerPage
    )
  );

  /* =========================================================
     Export PDF
     ========================================================= */

  async function handleExportPdf() {
    if (
      !pdfRef.current ||
      assets.length === 0
    ) {
      return;
    }

    if (
      !inspectionStartDate ||
      !inspectionEndDate
    ) {
      alert(
        "กรุณาเลือกวันที่เริ่มดำเนินการตรวจสอบและวันที่ตรวจสอบแล้วเสร็จ"
      );

      return;
    }

    if (
      inspectionEndDate <
      inspectionStartDate
    ) {
      alert(
        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มดำเนินการตรวจสอบ"
      );

      return;
    }

    try {
      setIsExporting(true);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pages =
        pdfRef.current.querySelectorAll<HTMLElement>(
          "[data-pdf-page]"
        );

      for (
        let pageIndex = 0;
        pageIndex < pages.length;
        pageIndex++
      ) {
        const page = pages[pageIndex];

        const canvas =
          await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor:
              "#ffffff",
            logging: false,
            width: page.scrollWidth,
            height: page.scrollHeight,
          });

        const imageData =
          canvas.toDataURL(
            "image/png"
          );

        if (pageIndex > 0) {
          pdf.addPage(
            "a4",
            "landscape"
          );
        }

        /*
         * A4 พื้นที่ใช้งาน 277 x 190 mm
         * ย่อเนื้อหาลง 70%
         * และจัดให้อยู่กึ่งกลางหน้า
         */

        const imageWidth =
          pdfWidth * pdfScale;

        const imageHeight =
          pdfHeight * pdfScale;

        const imageX =
          10 +
          (pdfWidth -
            imageWidth) /
            2;

        const imageY =
          10 +
          (pdfHeight -
            imageHeight) /
            2;

        pdf.addImage(
          imageData,
          "PNG",
          imageX,
          imageY,
          imageWidth,
          imageHeight,
          undefined,
          "FAST"
        );
      }

      const pdfBlob =
        pdf.output("blob");

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

      const newWindow =
        window.open(
          pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

      if (!newWindow) {
        const link =
          document.createElement(
            "a"
          );

        link.href = pdfUrl;
        link.target = "_blank";
        link.rel =
          "noopener noreferrer";

        link.click();
      }

      setTimeout(() => {
        URL.revokeObjectURL(
          pdfUrl
        );
      }, 60000);
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

  /* =========================================================
     แบ่งข้อมูลเป็นหน้า
     ========================================================= */

  const pages = Array.from(
    {
      length: totalPages,
    },
    (_, pageIndex) =>
      assets.slice(
        pageIndex *
          rowsPerPage,
        (pageIndex + 1) *
          rowsPerPage
      )
  );

  return (
    <div className="shrink-0">
      {/* =====================================================
          ตัวเลือกวันที่
          ===================================================== */}

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-lg sm:flex-row sm:items-end sm:justify-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-slate-700">
            เริ่มดำเนินการตรวจสอบ
          </label>

          <input
            type="date"
            value={inspectionStartDate}
            onChange={(event) =>
              setInspectionStartDate(
                event.target.value
              )
            }
            className="
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-2
              text-sm
              text-slate-800
              outline-none
              focus:border-slate-500
              focus:ring-2
              focus:ring-slate-200
            "
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-slate-700">
            ตรวจสอบแล้วเสร็จ
          </label>

          <input
            type="date"
            value={inspectionEndDate}
            onChange={(event) =>
              setInspectionEndDate(
                event.target.value
              )
            }
            className="
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-2
              text-sm
              text-slate-800
              outline-none
              focus:border-slate-500
              focus:ring-2
              focus:ring-slate-200
            "
          />
        </div>

        {/* ===================================================
            Export Button
            =================================================== */}

        <button
          type="button"
          onClick={
            handleExportPdf
          }
          disabled={
            isExporting ||
            assets.length === 0
          }
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-3
            text-sm
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
            sm:px-6
          "
        >
          {isExporting
            ? "⏳ กำลังสร้าง PDF..."
            : "📄 ส่งออก PDF"}
        </button>
      </div>

      {/* =====================================================
          Hidden PDF Document
          ===================================================== */}

      <div
        ref={pdfRef}
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-[-10000px]
          top-0
          z-[-1]
        "
      >
        {pages.map(
          (
            pageAssets,
            pageIndex
          ) => (
            <div
              key={pageIndex}
              data-pdf-page
              className="
                box-border
                h-[190mm]
                w-[277mm]
                overflow-hidden
                bg-white
                px-[2mm]
                py-[1mm]
                text-black
              "
              style={{
                fontFamily:
                  "'TH Sarabun New', 'Tahoma', sans-serif",
                fontSize: "14pt",
                lineHeight: "1",
              }}
            >
              {/* ===============================================
                  Header
                  =============================================== */}

              <div className="text-center leading-none">
                <div
                  className="
                    text-[14pt]
                    font-bold
                  "
                >
                  กระดาษทำการตรวจสอบพัสดุ
                  ประจำปีงบประมาณ พ.ศ.{" "}
                  {fiscalYear}
                </div>

                <div
                  className="
                    mt-[1.5mm]
                    text-[14pt]
                    font-bold
                  "
                >
                  สำนักอนามัยการเจริญพันธุ์
                </div>

                <div
                  className="
                    mt-[1.5mm]
                    text-[14pt]
                    font-bold
                  "
                >
                  เริ่มดำเนินการตรวจสอบวันที่{" "}
                  {formatThaiDate(
                    inspectionStartDate
                  )}
                </div>

                <div
                  className="
                    mt-[1mm]
                    text-[14pt]
                    font-bold
                  "
                >
                  ตรวจสอบแล้วเสร็จวันที่{" "}
                  {formatThaiDate(
                    inspectionEndDate
                  )}
                </div>
              </div>

              {/* ===============================================
                  Table
                  =============================================== */}

              <table
                className="
                  mt-[3mm]
                  w-full
                  table-fixed
                  border-collapse
                  border
                  border-black
                  text-[14pt]
                  leading-none
                "
              >
                <colgroup>
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>

                <thead>
                  <tr className="h-[12mm]">
                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ลำดับ
                    </th>

                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รหัส GFMIS
                    </th>

                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รหัสครุภัณฑ์
                    </th>

                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ผู้รับผิดชอบ
                    </th>

                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รายการ
                    </th>

                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      หน่วยนับ
                    </th>

                    <th
                      rowSpan={2}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ยอดคงเหลือ
                      <br />
                      ตามทะเบียน
                      <br />
                      ณ วันที่
                      <br />
                      {formatThaiShortDate(
                        inspectionStartDate
                      )}
                    </th>

                    <th
                      colSpan={2}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รายการรับ - จ่าย
                      <br />
                      ระหว่างปีงบประมาณ
                      <br />
                      พ.ศ. {fiscalYear}
                    </th>

                    <th
                      rowSpan={2}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ยอดคงเหลือ
                      <br />
                      ตามทะเบียน
                      <br />
                      ณ วันที่ตรวจนับ
                    </th>

                    <th
                      rowSpan={2}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      จำนวนที่
                      <br />
                      ตรวจนับได้
                    </th>

                    <th
                      colSpan={2}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ผลการตรวจนับ
                      <br />
                      ครุภัณฑ์ตามทะเบียน
                    </th>

                    <th
                      colSpan={4}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      สภาพครุภัณฑ์
                      ที่ตรวจนับพบ
                    </th>

                    <th
                      rowSpan={3}
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      หมายเหตุ
                    </th>
                  </tr>

                  <tr className="h-[8mm]">
                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รับ
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      จ่าย
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ถูกต้อง
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ไม่ถูกต้อง
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ใช้งาน
                      <br />
                      ได้
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ชำรุด
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      เสื่อม
                      <br />
                      สภาพ
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ไม่จำเป็น
                      <br />
                      ต้องใช้
                    </th>
                  </tr>

                  <tr className="h-[6mm]">
                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      -
                    </th>
                  </tr>
                </thead>

                {/* =================================================
                    Body
                    ================================================= */}

                <tbody>
                  {pageAssets.map(
                    (asset, index) => {
                      const globalIndex =
                        pageIndex *
                          rowsPerPage +
                        index;

                      return (
                        <tr
                          key={asset.id}
                          className="h-[7.5mm]"
                        >
                          <td className="border border-black px-1 text-center">
                            {globalIndex +
                              1}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {asset.governmentAssetNo ||
                              "-"}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {asset.officeAssetNo ||
                              "-"}
                          </td>

                          {/* =========================================
                              ผู้รับผิดชอบ = กลุ่มงาน
                              ========================================= */}

                          <td className="border border-black px-1 text-center">
                            {asset.sectionName ||
                              asset.departmentName ||
                              "-"}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {asset.name}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {categoryUnit[
                              asset.category
                            ] ||
                              "ตัว"}
                          </td>

                          <td className="border border-black px-1 text-center">
                            1
                          </td>

                          <td className="border border-black px-1 text-center">
                            -
                          </td>

                          <td className="border border-black px-1 text-center">
                            -
                          </td>

                          <td className="border border-black px-1 text-center">
                            1
                          </td>

                          <td className="border border-black px-1 text-center">
                            1
                          </td>

                          <td className="border border-black px-1 text-center">
                            {getInspectionMark(
                              asset.status
                            )}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {asset.status ===
                            "DAMAGED"
                              ? ""
                              : ""}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {getConditionMark(
                              asset.status,
                              "normal"
                            )}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {getConditionMark(
                              asset.status,
                              "damaged"
                            )}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {getConditionMark(
                              asset.status,
                              "deteriorated"
                            )}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {getConditionMark(
                              asset.status,
                              "notRequired"
                            )}
                          </td>

                          <td className="border border-black px-1 text-center">
                            {asset.remark ||
                              ""}
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {/* ===============================================
                      เติมแถวว่าง
                      =============================================== */}

                  {pageAssets.length <
                    rowsPerPage &&
                    Array.from(
                      {
                        length:
                          rowsPerPage -
                          pageAssets.length,
                      },
                      (
                        _,
                        emptyIndex
                      ) => (
                        <tr
                          key={`empty-${emptyIndex}`}
                          className="h-[7.5mm]"
                        >
                          {Array.from(
                            {
                              length: 18,
                            },
                            (
                              _,
                              cellIndex
                            ) => (
                              <td
                                key={
                                  cellIndex
                                }
                                className="
                                  border
                                  border-black
                                  bg-white
                                  px-1
                                "
                              >
                                &nbsp;
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}
                </tbody>
              </table>

              {/* =================================================
                  Signature
                  ================================================= */}

              {pageIndex ===
                totalPages - 1 && (
                <div
                  className="
                    mt-[6mm]
                    grid
                    grid-cols-5
                    gap-[5mm]
                    text-center
                    text-[14pt]
                    leading-tight
                  "
                >
                  <div>
                    <div>
                      ลงชื่อ................................
                    </div>

                    <div className="mt-[1.5mm]">
                      (................................)
                    </div>

                    <div className="mt-[1mm]">
                      ................................
                    </div>
                  </div>

                  <div>
                    <div>
                      ลงชื่อ................................
                    </div>

                    <div className="mt-[1.5mm]">
                      (................................)
                    </div>

                    <div className="mt-[1mm]">
                      ................................
                    </div>
                  </div>

                  <div>
                    <div>
                      ลงชื่อ................................
                    </div>

                    <div className="mt-[1.5mm]">
                      (................................)
                    </div>

                    <div className="mt-[1mm]">
                      ................................
                    </div>
                  </div>

                  <div>
                    <div>
                      ลงชื่อ................................
                    </div>

                    <div className="mt-[1.5mm]">
                      (................................)
                    </div>

                    <div className="mt-[1mm]">
                      ................................
                    </div>
                  </div>

                  <div>
                    <div>
                      ลงชื่อ................................
                    </div>

                    <div className="mt-[1.5mm]">
                      (................................)
                    </div>

                    <div className="mt-[1mm]">
                      ................................
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}