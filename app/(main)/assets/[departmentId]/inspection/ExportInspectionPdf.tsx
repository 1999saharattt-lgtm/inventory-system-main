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

const ROWS_PER_PAGE = 15;
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

const PDF_MARGIN = 10;
const PDF_WIDTH = 277;
const PDF_HEIGHT = 190;
const TABLE_HEADER_FONT_SIZE = "9px";
const TABLE_BODY_FONT_SIZE = "10px";
const CHECKMARK_FONT_SIZE = "12px";

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

function getOfficer(officerId: string, officers: Officer[]) {
  if (!officerId) {
    return undefined;
  }

  return officers.find((officer) => String(officer.id) === officerId);
}

function getStatusChecked(row: InspectionRow, status: string) {
  return row.status === status ? "✓" : "";
}

function getAccuracyChecked(row: InspectionRow, accuracy: string) {
  return row.accuracy === accuracy ? "✓" : "";
}

function getCompactFontSize(
  text: string,
  normalSize = 13,
  mediumSize = 12,
  smallSize = 11
) {
  const length = text.trim().length;

  if (length > 48) {
    return `${smallSize}px`;
  }

  if (length > 30) {
    return `${mediumSize}px`;
  }

  return `${normalSize}px`;
}

function getCodeFontSize(text: string) {
  const length = text.trim().length;

  if (length > 26) {
    return "9px";
  }

  if (length > 22) {
    return "9.5px";
  }

  if (length > 18) {
    return "10px";
  }

  return "10.5px";
}

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
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                paddingTop: "3mm",
              }}
            >
              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginBottom: "3.5mm",
                  flexShrink: 0,
                }}
              >
                <div style={mainTitleStyle}>
                  กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ พ.ศ.{" "}
                  {INSPECTION_FISCAL_YEAR}
                </div>

                <div style={mainTitleStyle}>
                  สำนักอนามัยการเจริญพันธุ์
                </div>

                <div style={dateTitleStyle}>
                  เริ่มดำเนินการตรวจสอบวันที่{" "}
                  {formatThaiDate(inspectionStartDate)}
                  {"     "}
                  ตรวจสอบแล้วเสร็จวันที่{" "}
                  {formatThaiDate(inspectionEndDate)}
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderSpacing: 0,
                  border: "1px solid #000000",
                  borderRadius: 0,
                  outline: "none",
                  tableLayout: "fixed",
                  fontFamily:
                    "TH Sarabun New, Sarabun, Arial, sans-serif",
                  color: "#000000",
                  backgroundColor: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <colgroup>
                  <col style={{ width: "2.5%" }} />
                  <col style={{ width: "6.5%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "6.5%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "6.5%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "4.75%" }} />
                  <col style={{ width: "4.75%" }} />
                  <col style={{ width: "3.75%" }} />
                  <col style={{ width: "3.5%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "5.75%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>ลำดับ</div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>รหัส GFMIS</div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>รหัสครุภัณฑ์</div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>ผู้รับผิดชอบ</div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>รายการ</div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>หน่วยนับ</div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>
                        <div style={accountHeaderLineStyle}>
                          ยอดคงเหลือตามบัญชี
                        </div>
                        <div style={accountHeaderLineStyle}>
                          ณ วันที่ {formatThaiDate(accountStartDate)}
                        </div>
                      </div>
                    </th>

                    <th colSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>
                        <div style={headerNoWrapStyle}>
                          รายการเคลื่อนไหวระหว่าง
                        </div>
                        <div style={headerNoWrapStyle}>
                          ปีงบประมาณ พ.ศ. {movementFiscalYear}
                        </div>
                      </div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>
                        <div style={accountHeaderLineStyle}>
                          ยอดคงเหลือตามบัญชี
                        </div>
                        <div style={accountHeaderLineStyle}>
                          ณ วันที่ {formatThaiDate(accountEndDate)}
                        </div>
                      </div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>
                        จำนวนที่ตรวจนับได้
                      </div>
                    </th>

                    <th colSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>
                        <div style={resultHeaderLineStyle}>
                          ผลการตรวจนับถูกต้อง
                        </div>
                        <div style={resultHeaderLineStyle}>
                          ตรงกับยอดคงเหลือตามบัญชี
                        </div>
                      </div>
                    </th>

                    <th colSpan={4} style={headerStyle}>
                      <div style={headerCenterStyle}>
                        สภาพครุภัณฑ์ที่ตรวจนับ
                      </div>
                    </th>

                    <th rowSpan={2} style={headerStyle}>
                      <div style={headerCenterStyle}>หมายเหตุ</div>
                    </th>
                  </tr>

                  <tr>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>รับ</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>จ่าย</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>ถูกต้อง</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>ไม่ถูกต้อง</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>ใช้งานปกติ</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>ชำรุด</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>เสื่อมสภาพ</div>
                    </th>
                    <th style={subHeaderStyle}>
                      <div style={subHeaderTextStyle}>ไม่จำเป็นต้องใช้</div>
                    </th>
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

                    const responsibleGroup =
                      department.name === "กลุ่มอำนวยการ"
                        ? [
                            department.name,
                            asset.section?.name || "",
                          ]
                            .filter(Boolean)
                            .join(" / ")
                        : department.name;

                    const assetName = [
                      asset.name,
                      asset.brand,
                      asset.model,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr key={asset.id} style={{ height: "7.6mm" }}>
                        <td style={bodyCellStyle}>
                          <span style={bodyTextStyle}>
                            {actualIndex + 1}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...codeTextStyle,
                              fontSize: TABLE_BODY_FONT_SIZE,
                            }}
                          >
                            {asset.governmentAssetNo || ""}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...codeTextStyle,
                              fontSize: TABLE_BODY_FONT_SIZE,
                            }}
                          >
                            {asset.officeAssetNo || ""}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...bodyTextStyle,
                              fontSize: TABLE_BODY_FONT_SIZE,
                            }}
                          >
                            {responsibleGroup}
                          </span>
                        </td>

                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              ...bodyTextStyle,
                              textAlign: "left",
                              justifyContent: "flex-start",
                              paddingLeft: "0.8mm",
                              paddingRight: "0.4mm",
                              fontSize: TABLE_BODY_FONT_SIZE,
                            }}
                          >
                            {assetName}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span style={bodyTextStyle}>
                            {getCategoryUnit(asset.category)}
                          </span>
                        </td>

                        <td style={bodyCellStyle}><span style={bodyTextStyle}>1</span></td>
                        <td style={bodyCellStyle}><span style={bodyTextStyle}>-</span></td>
                        <td style={bodyCellStyle}><span style={bodyTextStyle}>-</span></td>
                        <td style={bodyCellStyle}><span style={bodyTextStyle}>1</span></td>
                        <td style={bodyCellStyle}>
                          <span style={bodyTextStyle}>{row.countedQty}</span>
                        </td>

                        <td style={checkCellStyle}>
                          <span style={checkTextStyle}>
                            {getAccuracyChecked(row, "CORRECT")}
                          </span>
                        </td>

                        <td style={checkCellStyle}>
                          <span style={checkTextStyle}>
                            {getAccuracyChecked(row, "INCORRECT")}
                          </span>
                        </td>

                        <td style={checkCellStyle}>
                          <span style={checkTextStyle}>
                            {getStatusChecked(row, "IN_USE")}
                          </span>
                        </td>

                        <td style={checkCellStyle}>
                          <span style={checkTextStyle}>
                            {getStatusChecked(row, "DAMAGED")}
                          </span>
                        </td>

                        <td style={checkCellStyle}>
                          <span style={checkTextStyle}>
                            {getStatusChecked(row, "DETERIORATED")}
                          </span>
                        </td>

                        <td style={checkCellStyle}>
                          <span style={checkTextStyle}>
                            {getStatusChecked(row, "UNUSABLE")}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...bodyTextStyle,
                              fontSize: TABLE_BODY_FONT_SIZE,
                            }}
                          >
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
                        style={{ height: "7.6mm" }}
                      >
                        {Array.from({ length: 18 }, (_, cellIndex) => (
                          <td key={cellIndex} style={bodyCellStyle} />
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              <div
                style={{
                  width: "100%",
                  minHeight: "27mm",
                  paddingTop: "3mm",
                  boxSizing: "border-box",
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  columnGap: "3mm",
                  flexShrink: 0,
                }}
              >
                {Array.from({ length: 5 }, (_, index) => {
                  const selectedInspectorId =
                    inspectorIds[index] || "";

                  const selectedOfficer = getOfficer(
                    selectedInspectorId,
                    officers
                  );

                  const inspectorName = selectedOfficer
                    ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`
                    : "................................";

                  const inspectorPosition =
                    selectedOfficer?.position ||
                    "................................";

                  return (
                    <div
                      key={index}
                      style={{
                        textAlign: "center",
                        minWidth: 0,
                        fontFamily:
                          "TH Sarabun New, Sarabun, Arial, sans-serif",
                      }}
                    >
                      <div style={signatureTitleStyle}>
                        ลงชื่อ ....................................................
                      </div>

                      <div
                        style={{
                          ...signatureTextStyle,
                          fontSize: getCompactFontSize(
                            inspectorName,
                            12,
                            11,
                            10
                          ),
                        }}
                      >
                        ({inspectorName})
                      </div>

                      <div
                        style={{
                          ...signatureTextStyle,
                          fontSize: getCompactFontSize(
                            inspectorPosition,
                            12,
                            11,
                            10
                          ),
                        }}
                      >
                        {inspectorPosition}
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

const mainTitleStyle: React.CSSProperties = {
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: "17px",
  fontWeight: 700,
  lineHeight: 1.15,
  marginBottom: "0.8mm",
  whiteSpace: "nowrap",
};

const dateTitleStyle: React.CSSProperties = {
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: "17px",
  fontWeight: 600,
  lineHeight: 1.15,
  whiteSpace: "nowrap",
};

const headerStyle: React.CSSProperties = {
  border: "1px solid #000000",
  borderRadius: "0px",
  background: "#ffffff",
  color: "#000000",
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontWeight: "normal",
  fontSize: TABLE_HEADER_FONT_SIZE,
  padding: "0.6mm 0.3mm",
  margin: 0,
  lineHeight: 1.08,
  height: "10.5mm",
  boxSizing: "border-box",
  whiteSpace: "normal",
  overflow: "visible",
};

const subHeaderStyle: React.CSSProperties = {
  ...headerStyle,
  height: "6.5mm",
  fontSize: TABLE_HEADER_FONT_SIZE,
  padding: "0.45mm 0.25mm",
  lineHeight: 1.08,
  overflow: "visible",
};

const headerCenterStyle: React.CSSProperties = {
  display: "block",
  position: "relative",
  top: "-0.65mm",
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: TABLE_HEADER_FONT_SIZE,
  fontWeight: "normal",
  lineHeight: 1.08,
  whiteSpace: "normal",
  overflow: "visible",
  wordBreak: "normal",
  overflowWrap: "break-word",
};

const bodyCellStyle: React.CSSProperties = {
  border: "1px solid #000000",
  borderRadius: "0px",
  background: "#ffffff",
  color: "#000000",
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: TABLE_BODY_FONT_SIZE,
  fontWeight: "normal",
  padding: 0,
  margin: 0,
  lineHeight: 1,
  height: "7.6mm",
  minHeight: "7.6mm",
  boxSizing: "border-box",
  overflow: "visible",
};

const bodyTextStyle: React.CSSProperties = {
  display: "flex",
  position: "relative",
  top: "-1.15mm",
  width: "100%",
  minHeight: "5.4mm",
  margin: 0,
  padding: "0 0.3mm",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: TABLE_BODY_FONT_SIZE,
  fontWeight: "normal",
  lineHeight: 1,
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
  wordBreak: "normal",
  overflowWrap: "break-word",
  boxSizing: "border-box",
};

const headerNoWrapStyle: React.CSSProperties = {
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
  lineHeight: 1.08,
  fontSize: TABLE_HEADER_FONT_SIZE,
  overflow: "visible",
};

const accountHeaderLineStyle: React.CSSProperties = {
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
  lineHeight: 1.08,
  fontSize: TABLE_HEADER_FONT_SIZE,
  overflow: "visible",
};

const resultHeaderLineStyle: React.CSSProperties = {
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
  lineHeight: 1.08,
  fontSize: TABLE_HEADER_FONT_SIZE,
  overflow: "visible",
};

const subHeaderTextStyle: React.CSSProperties = {
  display: "flex",
  width: "100%",
  height: "100%",
  minHeight: "5.2mm",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  verticalAlign: "middle",
  margin: 0,
  padding: "0.35mm 0.15mm 0.55mm",
  boxSizing: "border-box",
  lineHeight: 1,
  fontSize: TABLE_HEADER_FONT_SIZE,
  whiteSpace: "nowrap",
  overflow: "visible",
};

const codeTextStyle: React.CSSProperties = {
  display: "flex",
  position: "relative",
  top: "-1.15mm",
  width: "100%",
  minHeight: "5.4mm",
  margin: 0,
  padding: "0 0.25mm",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: TABLE_BODY_FONT_SIZE,
  fontWeight: "normal",
  lineHeight: 1,
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
  wordBreak: "normal",
  boxSizing: "border-box",
};

const checkCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
  fontSize: CHECKMARK_FONT_SIZE,
  fontWeight: 700,
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const checkTextStyle: React.CSSProperties = {
  display: "flex",
  position: "relative",
  top: "-1.15mm",
  width: "100%",
  minHeight: "5.4mm",
  alignItems: "center",
  justifyContent: "center",
  margin: 0,
  padding: 0,
  fontSize: CHECKMARK_FONT_SIZE,
  lineHeight: 1,
};

const signatureTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.05,
  minHeight: "4mm",
  whiteSpace: "nowrap",
};

const signatureTextStyle: React.CSSProperties = {
  minHeight: "4mm",
  padding: "0.1mm 0",
  lineHeight: 1.02,
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "break-word",
};
