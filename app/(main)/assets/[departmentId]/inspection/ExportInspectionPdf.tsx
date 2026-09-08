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
  normalSize = 16,
  mediumSize = 14,
  smallSize = 12
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
    return "12px";
  }

  if (length > 22) {
    return "12.5px";
  }

  if (length > 18) {
    return "13px";
  }

  return "14px";
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
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginBottom: "3mm",
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
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "3.25%" }} />
                  <col style={{ width: "3.25%" }} />
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
                        <div>ผลการตรวจนับถูกต้อง</div>
                        <div>ตรงกับยอดคงเหลือตามบัญชี</div>
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

                    const responsibleOfficer = officer
                      ? `${officer.firstName} ${officer.lastName}`
                      : "";

                    const assetName = [
                      asset.name,
                      asset.brand,
                      asset.model,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr key={asset.id} style={{ height: "8mm" }}>
                        <td style={bodyCellStyle}>
                          {actualIndex + 1}
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...codeTextStyle,
                              fontSize: getCodeFontSize(
                                asset.governmentAssetNo || ""
                              ),
                            }}
                          >
                            {asset.governmentAssetNo || ""}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...codeTextStyle,
                              fontSize: getCodeFontSize(
                                asset.officeAssetNo || ""
                              ),
                            }}
                          >
                            {asset.officeAssetNo || ""}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...bodyTextStyle,
                              fontSize: getCompactFontSize(
                                responsibleOfficer,
                                12,
                                11,
                                10
                              ),
                            }}
                          >
                            {responsibleOfficer}
                          </span>
                        </td>

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...bodyTextStyle,
                              fontSize: getCompactFontSize(
                                assetName,
                                12,
                                11,
                                10
                              ),
                            }}
                          >
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

                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              ...bodyTextStyle,
                              fontSize: getCompactFontSize(
                                row.remark || "",
                                12,
                                11,
                                10
                              ),
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
                        style={{ height: "8mm" }}
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
                  minHeight: "35mm",
                  paddingTop: "4mm",
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
                        ลงชื่อ ................................
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
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: 1.15,
  whiteSpace: "nowrap",
};

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
  fontSize: "16px",
  padding: 0,
  margin: 0,
  lineHeight: 1,
  height: "8mm",
  minHeight: "8mm",
  boxSizing: "border-box",
  whiteSpace: "normal",
  overflow: "visible",
};

const subHeaderStyle: React.CSSProperties = {
  ...headerStyle,
  height: "8mm",
  minHeight: "8mm",
  fontSize: "16px",
  padding: 0,
  lineHeight: 1,
  whiteSpace: "normal",
  overflow: "visible",
};

const headerCenterStyle: React.CSSProperties = {
  display: "inline-block",
  position: "relative",
  top: "-1.35mm",
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: "16px",
  fontWeight: "normal",
  lineHeight: 1,
  whiteSpace: "normal",
  overflow: "visible",
  wordBreak: "normal",
  overflowWrap: "break-word",
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
  fontSize: "16px",
  fontWeight: "normal",
  padding: 0,
  margin: 0,
  lineHeight: 1,
  height: "8mm",
  minHeight: "8mm",
  boxSizing: "border-box",
  overflow: "visible",
  whiteSpace: "normal",
};

const bodyTextStyle: React.CSSProperties = {
  display: "block",
  position: "relative",
  top: "-1.35mm",
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: "16px",
  fontWeight: "normal",
  lineHeight: 1,
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
  wordBreak: "normal",
  overflowWrap: "break-word",
};

const headerNoWrapStyle: React.CSSProperties = {
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
  lineHeight: 1,
  fontSize: "16px",
  overflow: "visible",
};

const accountHeaderLineStyle: React.CSSProperties = {
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
  lineHeight: 1,
  fontSize: "16px",
  overflow: "visible",
};

const codeTextStyle: React.CSSProperties = {
  display: "inline-block",
  position: "relative",
  top: "-1.35mm",
  width: "100%",
  margin: 0,
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontFamily:
    "TH Sarabun New, Sarabun, Arial, sans-serif",
  fontSize: "16px",
  fontWeight: "normal",
  lineHeight: 1,
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
  wordBreak: "normal",
};

const checkCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
  fontSize: "18px",
  fontWeight: 700,
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const signatureTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.15,
  minHeight: "5mm",
  whiteSpace: "nowrap",
};

const signatureTextStyle: React.CSSProperties = {
  minHeight: "6mm",
  padding: "0.4mm 0",
  lineHeight: 1.08,
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "break-word",
};
