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

type Props = {
  department: Department;
  assets: Asset[];
  rows: InspectionRow[];
  inspectionStartDate: string;
  inspectionEndDate: string;
  inspectorIds: string[];
  accountStartDate: string;
  accountEndDate: string;
  movementFiscalYear: string;
  officers?: Officer[];
};

/* =========================================================
จำนวนรายการต่อหน้า
A4 แนวนอน = 15 รายการต่อหน้า
========================================================= */

const ROWS_PER_PAGE = 15;

/* =========================================================
ปีงบประมาณที่ตรวจสอบ
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
พื้นที่พิมพ์ A4 Landscape
297 x 210 mm
เว้นขอบรอบด้าน 10 mm
========================================================= */

const PDF_MARGIN = 10;
const PDF_WIDTH = 277;
const PDF_HEIGHT = 190;

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

function getOfficer(officerId: string, officers: Officer[]) {
  if (!officerId) {
    return undefined;
  }

  return officers.find((officer) => String(officer.id) === officerId);
}

/* =========================================================
ผลการตรวจสอบ
========================================================= */

function getStatusChecked(row: InspectionRow, status: string) {
  return row.status === status ? "✓" : "";
}

function getAccuracyChecked(row: InspectionRow, accuracy: string) {
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
  accountStartDate,
  accountEndDate,
  movementFiscalYear,
  officers = [],
}: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalPages = Math.max(
    1,
    Math.ceil(assets.length / ROWS_PER_PAGE)
  );

  async function handleExportPdf() {
    if (!pdfRef.current) {
      return;
    }

    if (assets.length === 0) {
      alert("ไม่พบรายการครุภัณฑ์สำหรับสร้าง PDF");
      return;
    }

    try {
      setIsExporting(true);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

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

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          logging: false,
        });

        const imageData = canvas.toDataURL("image/png", 1.0);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imageData,
          "PNG",
          PDF_MARGIN,
          PDF_MARGIN,
          PDF_WIDTH,
          PDF_HEIGHT,
          undefined,
          "FAST"
        );
      }

      const safeDepartmentName = department.name
        .replace(/[\/:*?"<>|]/g, "_")
        .trim();

      pdf.save(
        `กระดาษทำการตรวจสอบพัสดุ_${safeDepartmentName}_พ.ศ.${INSPECTION_FISCAL_YEAR}.pdf`
      );
    } catch (error) {
      console.error("ไม่สามารถสร้าง PDF ได้:", error);

      alert("ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExporting || assets.length === 0}
        className="
          rounded-xl
          bg-gradient-to-r
          from-red-700
          to-red-500
          px-5
          py-2.5
          text-base
          font-extrabold
          !text-white
          shadow-lg
          transition
          hover:scale-105
          hover:from-red-800
          hover:to-red-600
          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:hover:scale-100
        "
      >
        {isExporting ? "กำลังสร้าง PDF..." : "📄 ส่งออก PDF"}
      </button>

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
        {Array.from({ length: totalPages }, (_, pageIndex) => {
          const startIndex = pageIndex * ROWS_PER_PAGE;

          const pageAssets = assets.slice(
            startIndex,
            startIndex + ROWS_PER_PAGE
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
                margin: 0,
                background: "#ffffff",
                fontFamily:
                  "TH Sarabun New, Sarabun, Arial, sans-serif",
                color: "#000000",
                overflow: "hidden",
                fontSize: "14px",
                lineHeight: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  height: "15mm",
                  boxSizing: "border-box",
                  width: "100%",
                  textAlign: "center",
                  fontFamily:
                    "TH Sarabun New, Sarabun, Arial, sans-serif",
                  lineHeight: 1,
                  overflow: "hidden",
                  marginBottom: "2mm",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    height: "5mm",
                    lineHeight: "5mm",
                    whiteSpace: "nowrap",
                  }}
                >
                  กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ.{" "}
                  {INSPECTION_FISCAL_YEAR}
                </div>

                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    height: "5mm",
                    lineHeight: "5mm",
                    whiteSpace: "nowrap",
                  }}
                >
                  สำนักอนามัยการเจริญพันธุ์
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    height: "5mm",
                    lineHeight: "5mm",
                    whiteSpace: "nowrap",
                  }}
                >
                  เริ่มดำเนินการตรวจสอบวันที่{" "}
                  {formatThaiDate(inspectionStartDate)}
                  {"     "}
                  ตรวจสอบแล้วเสร็จวันที่{" "}
                  {formatThaiDate(inspectionEndDate)}
                </div>
              </div>

              {/* TABLE */}
              <table
                style={{
                  width: "100%",
                  height: "136mm",
                  borderCollapse: "collapse",
                  borderSpacing: 0,
                  border: "1px solid #000000",
                  borderRadius: 0,
                  tableLayout: "fixed",
                  fontFamily:
                    "TH Sarabun New, Sarabun, Arial, sans-serif",
                  fontSize: "13px",
                  lineHeight: 1,
                  color: "#000000",
                  backgroundColor: "#ffffff",
                }}
              >
                <colgroup>
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "7.5%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "4.5%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th rowSpan={2} style={headerStyle}>ลำดับ</th>
                    <th rowSpan={2} style={headerStyle}>รหัส GFMIS</th>
                    <th rowSpan={2} style={headerStyle}>รหัสครุภัณฑ์</th>
                    <th rowSpan={2} style={headerStyle}>ผู้รับผิดชอบ</th>
                    <th rowSpan={2} style={headerStyle}>รายการ</th>
                    <th rowSpan={2} style={headerStyle}>หน่วยนับ</th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerOneLineStyle}>
                        ยอดคงเหลือตามบัญชี
                      </div>
                      <div style={headerOneLineStyle}>
                        ณ วันที่ {formatThaiDate(accountStartDate)}
                      </div>
                    </th>

                    <th colSpan={2} style={headerStyle}>
                      <div style={headerOneLineStyle}>
                        รายการเคลื่อนไหวระหว่าง
                      </div>
                      <div style={headerOneLineStyle}>
                        ปีงบประมาณ พ.ศ. {movementFiscalYear}
                      </div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerOneLineStyle}>
                        ยอดคงเหลือตามบัญชี
                      </div>
                      <div style={headerOneLineStyle}>
                        ณ วันที่ {formatThaiDate(accountEndDate)}
                      </div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      จำนวนที่ตรวจนับได้
                    </th>

                    <th colSpan={2} style={headerStyle}>
                      <div style={headerOneLineStyle}>
                        ผลการตรวจนับถูกต้องตรงกับ
                      </div>
                      <div style={headerOneLineStyle}>
                        ยอดคงเหลือตามบัญชี
                      </div>
                    </th>

                    <th colSpan={4} style={headerStyle}>
                      สภาพครุภัณฑ์ที่ตรวจนับ
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      หมายเหตุ
                    </th>
                  </tr>

                  <tr>
                    <th style={subHeaderStyle}>รับ</th>
                    <th style={subHeaderStyle}>จ่าย</th>
                    <th style={subHeaderStyle}>ถูกต้อง</th>
                    <th style={subHeaderStyle}>ไม่ถูกต้อง</th>
                    <th style={subHeaderStyle}>ใช้งานปกติ</th>
                    <th style={subHeaderStyle}>ชำรุด</th>
                    <th style={subHeaderStyle}>เสื่อมสภาพ</th>
                    <th style={subHeaderStyle}>ไม่จำเป็นต้องใช้</th>
                  </tr>
                </thead>

                <tbody>
                  {pageAssets.map((asset, localIndex) => {
                    const actualIndex = startIndex + localIndex;

                    const row =
                      rows.find((item) => item.assetId === asset.id) || {
                        assetId: asset.id,
                        countedQty: "1",
                        accuracy: "",
                        status: "",
                        remark: "",
                      };

                    const officer = asset.officer;

                    const assetName = [
                      asset.name,
                      asset.brand,
                      asset.model,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr key={asset.id} style={{ height: "6.9mm" }}>
                        <td style={bodyCellStyle}>{actualIndex + 1}</td>

                        <td style={bodyCellStyle}>
                          <span style={singleLineTextStyle}>
                            {asset.governmentAssetNo || ""}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span style={singleLineTextStyle}>
                            {asset.officeAssetNo || ""}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span style={singleLineTextStyle}>
                            {officer
                              ? `${officer.firstName} ${officer.lastName}`
                              : ""}
                          </span>
                        </td>

                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "left",
                          }}
                        >
                          <span style={singleLineTextStyle}>
                            {assetName}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          {getCategoryUnit(asset.category)}
                        </td>

                        <td style={bodyCellStyle}>1</td>
                        <td style={bodyCellStyle}>-</td>
                        <td style={bodyCellStyle}>-</td>
                        <td style={bodyCellStyle}>1</td>
                        <td style={bodyCellStyle}>{row.countedQty}</td>

                        <td style={checkCellStyle}>
                          {getAccuracyChecked(row, "CORRECT")}
                        </td>

                        <td style={checkCellStyle}>
                          {getAccuracyChecked(row, "INCORRECT")}
                        </td>

                        <td style={checkCellStyle}>
                          {getStatusChecked(row, "IN_USE")}
                        </td>

                        <td style={checkCellStyle}>
                          {getStatusChecked(row, "DAMAGED")}
                        </td>

                        <td style={checkCellStyle}>
                          {getStatusChecked(row, "DETERIORATED")}
                        </td>

                        <td style={checkCellStyle}>
                          {getStatusChecked(row, "UNUSABLE")}
                        </td>

                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "left",
                          }}
                        >
                          <span style={singleLineTextStyle}>
                            {row.remark || ""}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {Array.from(
                    {
                      length: Math.max(
                        0,
                        ROWS_PER_PAGE - pageAssets.length
                      ),
                    },
                    (_, emptyIndex) => (
                      <tr
                        key={`empty-${emptyIndex}`}
                        style={{ height: "6.9mm" }}
                      >
                        {Array.from({ length: 18 }, (_, cellIndex) => (
                          <td
                            key={cellIndex}
                            style={bodyCellStyle}
                          />
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {/* SIGNATURE */}
              <div
                style={{
                  height: "33mm",
                  boxSizing: "border-box",
                  paddingTop: "3mm",
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  columnGap: "3mm",
                  width: "100%",
                  fontFamily:
                    "TH Sarabun New, Sarabun, Arial, sans-serif",
                  overflow: "hidden",
                }}
              >
                {Array.from({ length: 5 }, (_, index) => {
                  const selectedInspectorId =
                    inspectorIds[index] || "";

                  const selectedOfficer = getOfficer(
                    selectedInspectorId,
                    officers
                  );

                  return (
                    <div
                      key={index}
                      style={{
                        textAlign: "center",
                        fontSize: "13px",
                        lineHeight: 1.2,
                        minWidth: 0,
                      }}
                    >
                      <div style={signatureLineStyle}>
                        ลงชื่อ ................................
                      </div>

                      <div style={signatureLineStyle}>
                        (
                        {selectedOfficer
                          ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`
                          : "................................"}
                        )
                      </div>

                      <div style={signatureLineStyle}>
                        {selectedOfficer?.position ||
                          "................................"}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
}

/* =========================================================
Style ตาราง PDF
========================================================= */

const headerStyle: React.CSSProperties = {
  border: "1px solid #000000",
  borderRadius: 0,
  background: "#ffffff",
  color: "#000000",
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontWeight: "normal",
  fontSize: "12px",
  padding: "0.4mm 0.25mm",
  lineHeight: 1.05,
  height: "9mm",
  boxSizing: "border-box",
  overflow: "hidden",
};

const subHeaderStyle: React.CSSProperties = {
  ...headerStyle,
  height: "6mm",
  fontSize: "11.5px",
  whiteSpace: "nowrap",
};

const headerOneLineStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "clip",
  lineHeight: 1.1,
};

const bodyCellStyle: React.CSSProperties = {
  border: "1px solid #000000",
  borderRadius: 0,
  background: "#ffffff",
  color: "#000000",
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: "12.5px",
  fontWeight: "normal",
  padding: "0.35mm 0.35mm",
  lineHeight: 1,
  height: "6.9mm",
  boxSizing: "border-box",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

const singleLineTextStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1,
};

const checkCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "center",
};

const signatureLineStyle: React.CSSProperties = {
  height: "5.5mm",
  lineHeight: "5.5mm",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
