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
   ปีงบประมาณราชการ + ไตรมาส
   ========================================================= */

function getFiscalQuarterInfo() {
  const now = new Date();

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let quarter: number;
  let fiscalYear: number;
  let startDate: Date;
  let endDate: Date;

  /*
   * ไตรมาส 1
   * 1 ตุลาคม - 31 ธันวาคม
   * เป็นปีงบประมาณถัดไป
   */
  if (month >= 10) {
    quarter = 1;
    fiscalYear = year + 1 + 543;

    startDate = new Date(year, 9, 1);
    endDate = new Date(year, 11, 31);
  }

  /*
   * ไตรมาส 2
   * 1 มกราคม - 31 มีนาคม
   */
  else if (month >= 1 && month <= 3) {
    quarter = 2;
    fiscalYear = year + 543;

    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 2, 31);
  }

  /*
   * ไตรมาส 3
   * 1 เมษายน - 30 มิถุนายน
   */
  else if (month >= 4 && month <= 6) {
    quarter = 3;
    fiscalYear = year + 543;

    startDate = new Date(year, 3, 1);
    endDate = new Date(year, 5, 30);
  }

  /*
   * ไตรมาส 4
   * 1 กรกฎาคม - 30 กันยายน
   */
  else {
    quarter = 4;
    fiscalYear = year + 543;

    startDate = new Date(year, 6, 1);
    endDate = new Date(year, 8, 30);
  }

  return {
    quarter,
    fiscalYear,
    startDate,
    endDate,
  };
}

/* =========================================================
   เดือนภาษาไทยแบบราชการ
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
   วันที่ภาษาไทยแบบเต็ม
   ========================================================= */

function formatThaiDate(date: Date) {
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

/* =========================================================
   วันที่ภาษาไทยแบบย่อราชการ
   เช่น 1 ก.ค. 2569
   ========================================================= */

function formatThaiShortDate(date: Date) {
  const day = date.getDate();
  const month = thaiMonthShort[date.getMonth()];
  const year = date.getFullYear() + 543;

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
    return status === "IN_USE" ? "/" : "";
  }

  if (condition === "damaged") {
    return status === "DAMAGED" ? "/" : "";
  }

  if (condition === "deteriorated") {
    return status === "WAITING_DISPOSAL" ? "/" : "";
  }

  if (condition === "notRequired") {
    return status === "DISPOSED" ? "/" : "";
  }

  return "";
}

function getInspectionMark(status: string) {
  return status === "IN_USE" ||
    status === "DAMAGED" ||
    status === "WAITING_DISPOSAL" ||
    status === "DISPOSED"
    ? "/"
    : "";
}

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  /* =========================================================
     ข้อมูลปีงบประมาณและไตรมาสปัจจุบัน
     ========================================================= */

  const {
    quarter,
    fiscalYear,
    startDate,
    endDate,
  } = getFiscalQuarterInfo();

  /* =========================================================
     ขนาดพื้นที่ A4 แนวนอน
     กระดาษจริง 297 x 210 mm
     ขอบ 10 mm
     พื้นที่ใช้งาน 277 x 190 mm
     ========================================================= */

  const pdfWidth = 277;
  const pdfHeight = 190;

  /* =========================================================
     จำนวนรายการต่อหน้า
     ========================================================= */

  const rowsPerPage = 18;

  const totalPages = Math.max(
    1,
    Math.ceil(assets.length / rowsPerPage)
  );

  /* =========================================================
     Export PDF
     ========================================================= */

  async function handleExportPdf() {
    if (!pdfRef.current || assets.length === 0) {
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

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: page.scrollWidth,
          height: page.scrollHeight,
        });

        const imageData = canvas.toDataURL("image/png");

        if (pageIndex > 0) {
          pdf.addPage("a4", "landscape");
        }

        pdf.addImage(
          imageData,
          "PNG",
          10,
          10,
          pdfWidth,
          pdfHeight,
          undefined,
          "FAST"
        );
      }

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const newWindow = window.open(
        pdfUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!newWindow) {
        const link = document.createElement("a");

        link.href = pdfUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.click();
      }

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
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
     แบ่งข้อมูลตามจำนวนรายการต่อหน้า
     ========================================================= */

  const pages = Array.from(
    { length: totalPages },
    (_, pageIndex) =>
      assets.slice(
        pageIndex * rowsPerPage,
        (pageIndex + 1) * rowsPerPage
      )
  );

  return (
    <div className="shrink-0">
      {/* =====================================================
          Export Button
          ===================================================== */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExportPdf}
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
            sm:text-base
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
        {pages.map((pageAssets, pageIndex) => (
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
            }}
          >
            {/* =================================================
                Header
                ================================================= */}

            <div className="text-center leading-none">
              <div
                className="
                  text-[13px]
                  font-bold
                "
              >
                กระดาษทำการตรวจสอบพัสดุ
                ประจำปีงบประมาณ พ.ศ. {fiscalYear}
              </div>

              <div
                className="
                  mt-[1mm]
                  text-[12px]
                  font-bold
                "
              >
                {departmentName}
              </div>

              <div
                className="
                  mt-[1.5mm]
                  text-[11px]
                  font-bold
                "
              >
                ไตรมาสที่ {quarter}
              </div>

              <div
                className="
                  mt-[1mm]
                  text-[10px]
                  font-bold
                "
              >
                ระหว่างวันที่ {formatThaiDate(startDate)}
                {" "}
                ถึงวันที่ {formatThaiDate(endDate)}
              </div>
            </div>

            {/* =================================================
                Table
                ================================================= */}

            <table
              className="
                mt-[2mm]
                w-full
                table-fixed
                border-collapse
                border
                border-black
                text-[9px]
                leading-none
              "
            >
              {/* =================================================
                  รวมความกว้าง = 100%
                  เพื่อไม่ให้ตารางล้น A4
                  ================================================= */}

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
                <tr className="h-[11mm]">
                  <th
                    rowSpan={3}
                    className="
                      border
                      border-black
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                    {formatThaiShortDate(startDate)}
                  </th>

                  <th
                    colSpan={2}
                    className="
                      border
                      border-black
                      bg-transparent
                      px-1
                      text-center
                      font-bold
                      text-black
                    "
                  >
                    รายการรับ - จ่ายระหว่าง
                    <br />
                    ไตรมาสที่ {quarter}
                    <br />
                    ปีงบประมาณ พ.ศ. {fiscalYear}
                  </th>

                  <th
                    rowSpan={2}
                    className="
                      border
                      border-black
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
                      px-1
                      text-center
                      font-bold
                      text-black
                    "
                  >
                    สภาพครุภัณฑ์ที่ตรวจนับพบ
                  </th>

                  <th
                    rowSpan={3}
                    className="
                      border
                      border-black
                      bg-transparent
                      px-1
                      text-center
                      font-bold
                      text-black
                    "
                  >
                    หมายเหตุ
                  </th>
                </tr>

                <tr className="h-[7mm]">
                  <th
                    className="
                      border
                      border-black
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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

                <tr className="h-[5mm]">
                  <th
                    className="
                      border
                      border-black
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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
                      bg-transparent
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

              <tbody>
                {pageAssets.map((asset, index) => {
                  const globalIndex =
                    pageIndex * rowsPerPage + index;

                  return (
                    <tr
                      key={asset.id}
                      className="h-[6.2mm]"
                    >
                      <td className="border border-black px-1 text-center">
                        {globalIndex + 1}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.governmentAssetNo || "-"}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.officeAssetNo || "-"}
                      </td>

                      {/* =================================================
                          ผู้รับผิดชอบ = กลุ่มงาน
                          ใช้ sectionName แทน officerName
                          ================================================= */}

                      <td className="border border-black px-1 text-center">
                        {asset.sectionName ||
                          asset.departmentName ||
                          "-"}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.name}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {categoryUnit[asset.category] || "ตัว"}
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
                        {asset.status === "DAMAGED"
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
                        {asset.remark || ""}
                      </td>
                    </tr>
                  );
                })}

                {/* =================================================
                    เติมแถวว่างให้ทุกหน้ามีความสูงเท่ากัน
                    ================================================= */}

                {pageAssets.length < rowsPerPage &&
                  Array.from(
                    {
                      length:
                        rowsPerPage - pageAssets.length,
                    },
                    (_, emptyIndex) => (
                      <tr
                        key={`empty-${emptyIndex}`}
                        className="h-[6.2mm]"
                      >
                        {Array.from(
                          { length: 18 },
                          (_, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="
                                border
                                border-black
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
                Signature area
                แสดงเฉพาะหน้าสุดท้าย
                ================================================= */}

            {pageIndex === totalPages - 1 && (
              <div
                className="
                  mt-[5mm]
                  grid
                  grid-cols-5
                  gap-[5mm]
                  text-center
                  text-[10px]
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
        ))}
      </div>
    </div>
  );
}