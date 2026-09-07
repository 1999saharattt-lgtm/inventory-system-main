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

type InspectionRow = {
assetId: number;
countedQty: string;
accuracy: string;
status: string;
remark: string;
};

type Props = {
department: Department;
assets: Asset[];
rows: InspectionRow[];
inspectionStartDate: string;
inspectionEndDate: string;
inspectorIds: string[];
officers: Officer[];
};

/* =========================================================
จำนวนรายการต่อหน้า
========================================================= */

const ROWS_PER_PAGE = 20;

/* =========================================================
ปีงบประมาณที่ตรวจสอบ

รอบการตรวจนี้เป็นปีงบประมาณ พ.ศ. 2569
========================================================= */

const INSPECTION_FISCAL_YEAR = "2569";

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

/* =========================================================
ขนาดพื้นที่ PDF
A4 Landscape
========================================================= */

const PDF_WIDTH = 277;
const PDF_HEIGHT = 190;
const PDF_SCALE = 0.7;

/* =========================================================
วันที่
========================================================= */

function parseDateOnly(value: string) {
if (!value) {
return new Date(NaN);
}

const parts = value.split("-").map(Number);

if (parts.length !== 3 || parts.some(Number.isNaN)) {
return new Date(NaN);
}

const [year, month, day] = parts;

return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
if (Number.isNaN(date.getTime())) {
return "";
}

const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function formatThaiDate(value: string) {
if (!value) {
return "........";
}

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "........";
}

const day = date.getDate();
const month = thaiMonths[date.getMonth()];
const year = date.getFullYear() + 543;

return `${day} ${month} ${year}`;
}

/* =========================================================
ปีงบประมาณทั่วไป
ต.ค. - ธ.ค. ใช้ปีถัดไป
========================================================= */

function getFiscalYear(value: string) {
if (!value) {
return "........";
}

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "........";
}

const year = date.getFullYear();

return date.getMonth() >= 9
? String(year + 1 + 543)
: String(year + 543);
}

/* =========================================================
วันที่ย้อนหลัง 1 ปี
========================================================= */

function getOneYearBefore(value: string) {
if (!value) {
return "";
}

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "";
}

date.setFullYear(date.getFullYear() - 1);

return formatDateOnly(date);
}

/* =========================================================
วันที่ย้อนหลัง 1 วัน
========================================================= */

function getOneDayBefore(value: string) {
if (!value) {
return "";
}

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "";
}

date.setDate(date.getDate() - 1);

return formatDateOnly(date);
}

/* =========================================================
หน่วยครุภัณฑ์
========================================================= */

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

/* =========================================================
ผู้ตรวจสอบ
========================================================= */

function getOfficer(
officerId: string,
officers: Officer[]
) {
if (!officerId) {
return undefined;
}

return officers.find(
(officer) =>
String(officer.id) === officerId
);
}

/* =========================================================
ผลการตรวจสอบ
========================================================= */

function getStatusChecked(
row: InspectionRow,
status: string
) {
return row.status === status ? "✓" : "";
}

function getAccuracyChecked(
row: InspectionRow,
accuracy: string
) {
return row.accuracy === accuracy ? "✓" : "";
}

/* =========================================================
Component
========================================================= */

export default function ExportInspectionPdf({
department,
assets,
rows,
inspectionStartDate,
inspectionEndDate,
inspectorIds,
officers,
}: Props) {
const pdfRef = useRef<HTMLDivElement>(null);

const [isExporting, setIsExporting] = useState(false);

const totalPages = Math.max(
1,
Math.ceil(
assets.length / ROWS_PER_PAGE
)
);

/* =======================================================
Export PDF
======================================================= */

async function handleExportPdf() {
if (!pdfRef.current) {
return;
}

```
if (assets.length === 0) {
  alert(
    "ไม่พบรายการครุภัณฑ์สำหรับสร้าง PDF"
  );
  return;
}

try {
  setIsExporting(true);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise<void>(
    (resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    }
  );

  const pages =
    pdfRef.current.querySelectorAll<HTMLElement>(
      ".inspection-pdf-page"
    );

  if (pages.length === 0) {
    return;
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pdfMargin = 10;

  for (
    let i = 0;
    i < pages.length;
    i++
  ) {
    const page = pages[i];

    const width =
      page.clientWidth;

    const height =
      page.clientHeight;

    const canvas =
      await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });

    const imageData =
      canvas.toDataURL(
        "image/png",
        1.0
      );

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imageData,
      "PNG",
      pdfMargin,
      pdfMargin,
      PDF_WIDTH,
      PDF_HEIGHT,
      undefined,
      "FAST"
    );
  }

  const safeDepartmentName =
    department.name
      .replace(
        /[\\/:*?"<>|]/g,
        "_"
      )
      .trim();

  pdf.save(
    `กระดาษทำการตรวจสอบพัสดุ_${safeDepartmentName}_พ.ศ.${INSPECTION_FISCAL_YEAR}.pdf`
  );
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
```

}

return (
<>
{/* =====================================================
ปุ่ม Export
===================================================== */}

```
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
      via-green-500
      to-emerald-500
      px-8
      py-3
      text-lg
      font-extrabold
      !text-white
      shadow-lg
      transition
      hover:scale-105
      disabled:cursor-not-allowed
      disabled:opacity-50
      disabled:hover:scale-100
    "
  >
    {isExporting
      ? "กำลังสร้าง PDF..."
      : "📄 ส่งออก PDF"}
  </button>

  {/* =====================================================
      พื้นที่สร้าง PDF
  ===================================================== */}

  <div
    ref={pdfRef}
    style={{
      position: "fixed",
      left: "-100000px",
      top: 0,
      width: `${PDF_WIDTH}mm`,
      background: "#ffffff",
      zIndex: -1,
      pointerEvents: "none",
    }}
  >
    {Array.from(
      {
        length: totalPages,
      },
      (_, pageIndex) => {
        const startIndex =
          pageIndex *
          ROWS_PER_PAGE;

        const pageAssets =
          assets.slice(
            startIndex,
            startIndex +
              ROWS_PER_PAGE
          );

        return (
          <div
            key={pageIndex}
            className="inspection-pdf-page"
            style={{
              width: `${PDF_WIDTH}mm`,
              height: `${PDF_HEIGHT}mm`,
              boxSizing: "border-box",
              padding: 0,
              background: "#ffffff",
              fontFamily:
                "TH Sarabun New, Sarabun, Arial, sans-serif",
              color: "#000000",
              overflow: "hidden",
              transform: `scale(${PDF_SCALE})`,
              transformOrigin:
                "top left",
              marginBottom: `${-PDF_HEIGHT * (1 - PDF_SCALE)}mm`,
              fontSize: "16px",
              lineHeight: 1,
            }}
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div
              style={{
                width: "100%",
                textAlign: "center",
                lineHeight: 1,
                marginBottom: "2.5mm",
                fontFamily:
                  "TH Sarabun New, Sarabun, Arial, sans-serif",
              }}
            >
              <div
                style={{
                  fontSize: "21px",
                  fontWeight: 700,
                  marginBottom: "0.8mm",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                กระดาษทำการตรวจสอบพัสดุ
                {" "}
                ประจำปีงบประมาณ พ.ศ.{" "}
                {INSPECTION_FISCAL_YEAR}
              </div>

              <div
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  marginBottom: "0.8mm",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                สำนักอนามัยการเจริญพันธุ์
              </div>

              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                เริ่มดำเนินการตรวจสอบวันที่{" "}
                {formatThaiDate(
                  inspectionStartDate
                )}
                {"     "}
                ตรวจสอบแล้วเสร็จวันที่{" "}
                {formatThaiDate(
                  inspectionEndDate
                )}
              </div>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                tableLayout: "fixed",
                fontFamily:
                  "TH Sarabun New, Sarabun, Arial, sans-serif",
                fontSize: "16px",
                lineHeight: 1,
                color: "#000000",
                backgroundColor:
                  "#ffffff",
              }}
            >
              <colgroup>
                <col style={{ width: "2.8%" }} />
                <col style={{ width: "5.6%" }} />
                <col style={{ width: "6.4%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "3.3%" }} />
                <col style={{ width: "3.3%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "3.8%" }} />
                <col style={{ width: "4.5%" }} />
                <col style={{ width: "6.3%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      ลำดับ
                    </span>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      รหัส GFMIS
                    </span>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      รหัสครุภัณฑ์
                    </span>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      ผู้รับผิดชอบ
                    </span>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      รายการ
                    </span>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      หน่วย
                    </span>
                  </th>

                  {/* =================================================
                      ยอดคงเหลือตามบัญชีครั้งที่ 1
                  ================================================= */}

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <div
                      style={{
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ยอดคงเหลือตามบัญชี
                    </div>

                    <div
                      style={{
                        marginTop:
                          "0.8mm",
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ณ วันที่{" "}
                      {formatThaiDate(
                        getOneYearBefore(
                          inspectionStartDate
                        )
                      )}
                    </div>
                  </th>

                  <th
                    colSpan={2}
                    style={headerStyle}
                  >
                    <div
                      style={{
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      รายการเคลื่อนไหวระหว่าง
                      ปีงบประมาณ
                    </div>

                    <div
                      style={{
                        marginTop:
                          "0.8mm",
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      พ.ศ.{" "}
                      {INSPECTION_FISCAL_YEAR}
                    </div>
                  </th>

                  {/* =================================================
                      ยอดคงเหลือตามบัญชีครั้งที่ 2
                  ================================================= */}

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <div
                      style={{
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ยอดคงเหลือตามบัญชี
                    </div>

                    <div
                      style={{
                        marginTop:
                          "0.8mm",
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ณ วันที่{" "}
                      {formatThaiDate(
                        getOneDayBefore(
                          inspectionEndDate
                        )
                      )}
                    </div>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      จำนวนที่ตรวจนับได้
                    </span>
                  </th>

                  <th
                    colSpan={2}
                    style={headerStyle}
                  >
                    <div
                      style={{
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ผลการตรวจนับ
                    </div>

                    <div
                      style={{
                        marginTop:
                          "0.8mm",
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        fontWeight:
                          "normal",
                        lineHeight: 1,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      ถูกต้องตรงกับ
                      ยอดคงเหลือตามบัญชี
                    </div>
                  </th>

                  <th
                    colSpan={4}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      สภาพครุภัณฑ์ที่ตรวจนับ
                    </span>
                  </th>

                  <th
                    rowSpan={2}
                    style={headerStyle}
                  >
                    <span
                      style={headerTextStyle}
                    >
                      หมายเหตุ
                    </span>
                  </th>
                </tr>

                <tr>
                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      รับ
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      จ่าย
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      ถูกต้อง
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      ไม่ถูกต้อง
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      ใช้งาน
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      ชำรุด
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      เสื่อมสภาพ
                    </span>
                  </th>

                  <th style={headerStyle}>
                    <span
                      style={headerTextStyle}
                    >
                      ไม่สามารถใช้งาน
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {pageAssets.map(
                  (
                    asset,
                    localIndex
                  ) => {
                    const actualIndex =
                      startIndex +
                      localIndex;

                    const row =
                      rows[
                        actualIndex
                      ] || {
                        assetId:
                          asset.id,
                        countedQty:
                          "1",
                        accuracy: "",
                        status: "",
                        remark: "",
                      };

                    const officer =
                      asset.officer;

                    return (
                      <tr
                        key={asset.id}
                      >
                        {/* ลำดับ */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {actualIndex +
                              1}
                          </span>
                        </td>

                        {/* รหัส GFMIS */}

                        <td
                          style={{
                            ...bodyCellStyle,
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {asset.governmentAssetNo ||
                              ""}
                          </span>
                        </td>

                        {/* รหัสครุภัณฑ์ */}

                        <td
                          style={{
                            ...bodyCellStyle,
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {asset.officeAssetNo ||
                              ""}
                          </span>
                        </td>

                        {/* ผู้รับผิดชอบ */}

                        <td
                          style={{
                            ...bodyCellStyle,
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "break-word",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {officer
                              ? `${officer.firstName} ${officer.lastName}`
                              : ""}
                          </span>
                        </td>

                        {/* รายการ */}

                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign:
                              "left",
                            paddingLeft:
                              "2px",
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "break-word",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          <span
                            style={
                              materialNameTextStyle
                            }
                          >
                            {asset.name}

                            {(asset.brand ||
                              asset.model) && (
                              <span>
                                {" "}
                                (
                                {asset.brand ||
                                  ""}
                                {asset.brand &&
                                asset.model
                                  ? " / "
                                  : ""}
                                {asset.model ||
                                  ""}
                                )
                              </span>
                            )}
                          </span>
                        </td>

                        {/* หน่วย */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {getCategoryUnit(
                              asset.category
                            )}
                          </span>
                        </td>

                        {/* =================================================
                            ยอดคงเหลือตามบัญชี
                            1 ต่อ 1 เลขครุภัณฑ์
                        ================================================= */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            1
                          </span>
                        </td>

                        {/* รับ */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            -
                          </span>
                        </td>

                        {/* จ่าย */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            -
                          </span>
                        </td>

                        {/* =================================================
                            ยอดคงเหลือตามบัญชี
                            1 ต่อ 1 เลขครุภัณฑ์
                        ================================================= */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            1
                          </span>
                        </td>

                        {/* จำนวนที่ตรวจนับได้ */}

                        <td
                          style={
                            bodyCellStyle
                          }
                        >
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {row.countedQty}
                          </span>
                        </td>

                        {/* ถูกต้อง */}

                        <td
                          style={
                            checkCellStyle
                          }
                        >
                          <span
                            style={
                              checkTextStyle
                            }
                          >
                            {getAccuracyChecked(
                              row,
                              "CORRECT"
                            )}
                          </span>
                        </td>

                        {/* ไม่ถูกต้อง */}

                        <td
                          style={
                            checkCellStyle
                          }
                        >
                          <span
                            style={
                              checkTextStyle
                            }
                          >
                            {getAccuracyChecked(
                              row,
                              "INCORRECT"
                            )}
                          </span>
                        </td>

                        {/* ใช้งาน */}

                        <td
                          style={
                            checkCellStyle
                          }
                        >
                          <span
                            style={
                              checkTextStyle
                            }
                          >
                            {getStatusChecked(
                              row,
                              "IN_USE"
                            )}
                          </span>
                        </td>

                        {/* ชำรุด */}

                        <td
                          style={
                            checkCellStyle
                          }
                        >
                          <span
                            style={
                              checkTextStyle
                            }
                          >
                            {getStatusChecked(
                              row,
                              "DAMAGED"
                            )}
                          </span>
                        </td>

                        {/* เสื่อมสภาพ */}

                        <td
                          style={
                            checkCellStyle
                          }
                        >
                          <span
                            style={
                              checkTextStyle
                            }
                          >
                            {getStatusChecked(
                              row,
                              "DETERIORATED"
                            )}
                          </span>
                        </td>

                        {/* ไม่สามารถใช้งาน */}

                        <td
                          style={
                            checkCellStyle
                          }
                        >
                          <span
                            style={
                              checkTextStyle
                            }
                          >
                            {getStatusChecked(
                              row,
                              "UNUSABLE"
                            )}
                          </span>
                        </td>

                        {/* หมายเหตุ */}

                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign:
                              "left",
                            paddingLeft:
                              "2px",
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "break-word",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          <span
                            style={
                              materialNameTextStyle
                            }
                          >
                            {row.remark ||
                              ""}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>

            {/* =================================================
                SIGNATURE — ผู้ตรวจสอบ 5 คน
            ================================================= */}

            <div
              style={{
                marginTop: "2.5mm",
                display: "grid",
                gridTemplateColumns:
                  "repeat(5, 1fr)",
                columnGap: "3mm",
                width: "100%",
                fontFamily:
                  "TH Sarabun New, Sarabun, Arial, sans-serif",
              }}
            >
              {Array.from(
                {
                  length: 5,
                },
                (_, index) => {
                  const selectedInspectorId =
                    inspectorIds[
                      index
                    ] || "";

                  const selectedOfficer =
                    getOfficer(
                      selectedInspectorId,
                      officers
                    );

                  return (
                    <div
                      key={index}
                      style={{
                        textAlign:
                          "center",
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                        fontSize:
                          "16px",
                        lineHeight:
                          1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          marginBottom:
                            "1.5mm",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        ลงชื่อ
                        ................................
                      </div>

                      <div
                        style={{
                          whiteSpace:
                            "nowrap",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                        }}
                      >
                        (
                        {selectedOfficer
                          ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`
                          : "................................"}
                        )
                      </div>

                      <div
                        style={{
                          marginTop:
                            "0.8mm",
                          whiteSpace:
                            "nowrap",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                        }}
                      >
                        {selectedOfficer?.position ||
                          "................................"}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* =================================================
                PAGE NUMBER
            ================================================= */}

            <div
              style={{
                textAlign: "right",
                marginTop: "1.5mm",
                fontFamily:
                  "TH Sarabun New, Sarabun, Arial, sans-serif",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              หน้า {pageIndex + 1} /{" "}
              {totalPages}
            </div>
          </div>
        );
      }
    )}
  </div>
</>
```

);
}

/* =========================================================
Style ตาราง PDF
========================================================= */

const headerStyle: React.CSSProperties = {
border: "1px solid #000000",
background: "#ffffff",
color: "#000000",
textAlign: "center",
verticalAlign: "middle",
fontFamily:
"TH Sarabun New, Sarabun, Arial, sans-serif",
fontWeight: "normal",
fontSize: "16px",
padding: "0.65mm 0.5mm",
lineHeight: 1,
height: "7mm",
overflowWrap: "break-word",
wordBreak: "break-word",
boxSizing: "border-box",
};

const bodyCellStyle: React.CSSProperties = {
border: "1px solid #000000",
background: "#ffffff",
color: "#000000",
textAlign: "center",
verticalAlign: "middle",
fontFamily:
"TH Sarabun New, Sarabun, Arial, sans-serif",
fontSize: "16px",
fontWeight: "normal",
padding: "0.65mm 0.5mm",
lineHeight: 1,
height: "5.4mm",
minHeight: "5.4mm",
boxSizing: "border-box",
};

const headerTextStyle: React.CSSProperties = {
display: "inline-block",
position: "relative",
top: "-1.35mm",
margin: 0,
padding: 0,
fontFamily:
"TH Sarabun New, Sarabun, Arial, sans-serif",
fontSize: "16px",
fontWeight: "normal",
lineHeight: 1,
whiteSpace: "nowrap",
textAlign: "center",
verticalAlign: "middle",
};

const dataTextStyle: React.CSSProperties = {
display: "inline-block",
position: "relative",
top: "-1.35mm",
margin: 0,
padding: 0,
fontFamily:
"TH Sarabun New, Sarabun, Arial, sans-serif",
fontSize: "16px",
fontWeight: "normal",
lineHeight: 1,
whiteSpace: "nowrap",
verticalAlign: "middle",
};

const materialNameTextStyle: React.CSSProperties = {
display: "block",
position: "relative",
top: "-1.35mm",
margin: 0,
padding: 0,
fontFamily:
"TH Sarabun New, Sarabun, Arial, sans-serif",
fontSize: "16px",
fontWeight: "normal",
lineHeight: 1,
whiteSpace: "normal",
overflowWrap: "break-word",
wordBreak: "normal",
verticalAlign: "middle",
};

const checkCellStyle: React.CSSProperties = {
...bodyCellStyle,
textAlign: "center",
whiteSpace: "nowrap",
overflow: "visible",
};

const checkTextStyle: React.CSSProperties = {
display: "inline-block",
position: "relative",
top: "-1.35mm",
margin: 0,
padding: 0,
fontFamily:
"TH Sarabun New, Sarabun, Arial, sans-serif",
fontSize: "16px",
fontWeight: "normal",
lineHeight: 1,
whiteSpace: "nowrap",
verticalAlign: "middle",
};
