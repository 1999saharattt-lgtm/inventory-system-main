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

const ROWS_PER_PAGE = 12;

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
   วันที่
========================================================= */

function parseDateOnly(value: string) {
  if (!value) {
    return new Date(NaN);
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
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
    ? year + 1 + 543
    : year + 543;
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
    (officer) => String(officer.id) === officerId
  );
}

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
    Math.ceil(assets.length / ROWS_PER_PAGE)
  );

  /* =======================================================
     Export PDF
  ======================================================= */

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

      /*
       * ใช้ค่า props ล่าสุด ณ เวลาที่กด Export
       * ดังนั้นวันที่และรายชื่อผู้ตรวจสอบจะตรงกับ
       * สิ่งที่ผู้ใช้เลือกในหน้า InspectionForm
       */
      const currentInspectionStartDate =
        inspectionStartDate;

      const currentInspectionEndDate =
        inspectionEndDate;

      const currentInspectorIds = [
        ...inspectorIds,
      ];

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
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

      const pdfWidth = 297;
      const pdfHeight = 210;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const width = page.clientWidth;
        const height = page.clientHeight;

        const canvas = await html2canvas(page, {
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

        const imageData = canvas.toDataURL(
          "image/png",
          1.0
        );

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imageData,
          "PNG",
          0,
          0,
          pdfWidth,
          pdfHeight,
          undefined,
          "FAST"
        );
      }

      const safeDepartmentName =
        department.name
          .replace(/[\\/:*?"<>|]/g, "_")
          .trim();

      pdf.save(
        `กระดาษทำการตรวจสอบพัสดุ_${safeDepartmentName}_พ.ศ.${getFiscalYear(
          currentInspectionStartDate
        )}.pdf`
      );

      /*
       * currentInspectorIds ถูกอ่านจาก inspectorIds
       * ล่าสุดก่อนสร้าง PDF
       *
       * ตัว PDF ที่ render อยู่ด้านล่างก็ใช้ inspectorIds
       * จาก render ล่าสุดของ component เช่นเดียวกัน
       */
      void currentInspectorIds;
      void currentInspectionEndDate;
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
    <>
      {/* =====================================================
          ปุ่ม Export
      ===================================================== */}

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={
          isExporting || assets.length === 0
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
          text-white
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
          : "📄 Export PDF"}
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
          width: "297mm",
          background: "#ffffff",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        {Array.from(
          { length: totalPages },
          (_, pageIndex) => {
            const startIndex =
              pageIndex * ROWS_PER_PAGE;

            const pageAssets = assets.slice(
              startIndex,
              startIndex + ROWS_PER_PAGE
            );

            return (
              <div
                key={pageIndex}
                className="inspection-pdf-page"
                style={{
                  width: "297mm",
                  height: "210mm",
                  boxSizing: "border-box",
                  padding:
                    "7mm 8mm 5mm 8mm",
                  background: "#ffffff",
                  fontFamily:
                    "TH Sarabun New, Tahoma, Arial, sans-serif",
                  color: "#000000",
                  overflow: "hidden",
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
                    marginBottom: "3mm",
                  }}
                >
                  <div
                    style={{
                      fontSize: "21px",
                      fontWeight: 700,
                      marginBottom: "1mm",
                    }}
                  >
                    กระดาษทำการตรวจสอบพัสดุ
                    ประจำปีงบประมาณ พ.ศ.{" "}
                    {getFiscalYear(
                      inspectionStartDate
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "19px",
                      fontWeight: 700,
                      marginBottom: "1mm",
                    }}
                  >
                    สำนักอนามัยการเจริญพันธุ์
                  </div>

                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
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
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    fontSize: "10px",
                    lineHeight: 1,
                  }}
                >
                  <colgroup>
                    <col style={{ width: "3.5%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "3.5%" }} />

                    <col style={{ width: "3.5%" }} />
                    <col style={{ width: "3.5%" }} />
                    <col style={{ width: "7%" }} />

                    <col style={{ width: "7%" }} />

                    <col style={{ width: "3.5%" }} />
                    <col style={{ width: "4%" }} />

                    <col style={{ width: "3.5%" }} />
                    <col style={{ width: "3.5%" }} />
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "6%" }} />

                    <col style={{ width: "7%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        ลำดับ
                      </th>

                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        รหัส GFMIS
                      </th>

                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        รหัสครุภัณฑ์
                      </th>

                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        ผู้รับผิดชอบ
                      </th>

                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        รายการ
                      </th>

                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        หน่วย
                      </th>

                      <th
                        colSpan={2}
                        style={headerStyle}
                      >
                        <div>
                          ยอดคงเหลือตามบัญชี
                        </div>

                        <div
                          style={{
                            marginTop: "1mm",
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
                        rowSpan={2}
                        style={headerStyle}
                      >
                        <div>
                          ยอดคงเหลือตามบัญชี
                        </div>

                        <div
                          style={{
                            marginTop: "1mm",
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
                        จำนวนที่ตรวจนับได้
                      </th>

                      <th
                        colSpan={2}
                        style={headerStyle}
                      >
                        <div>
                          ผลการตรวจนับ
                        </div>

                        <div
                          style={{
                            marginTop: "1mm",
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
                        สภาพครุภัณฑ์ที่ตรวจนับ
                      </th>

                      <th
                        rowSpan={2}
                        style={headerStyle}
                      >
                        หมายเหตุ
                      </th>
                    </tr>

                    <tr>
                      <th style={headerStyle}>
                        รับ
                      </th>

                      <th style={headerStyle}>
                        จ่าย
                      </th>

                      <th style={headerStyle}>
                        ถูกต้อง
                      </th>

                      <th style={headerStyle}>
                        ไม่ถูกต้อง
                      </th>

                      <th style={headerStyle}>
                        ใช้งาน
                      </th>

                      <th style={headerStyle}>
                        ชำรุด
                      </th>

                      <th style={headerStyle}>
                        เสื่อมสภาพ
                      </th>

                      <th style={headerStyle}>
                        ไม่สามารถใช้งาน
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageAssets.map(
                      (asset, localIndex) => {
                        const actualIndex =
                          startIndex +
                          localIndex;

                        const row =
                          rows[actualIndex] || {
                            assetId: asset.id,
                            countedQty: "1",
                            accuracy: "",
                            status: "",
                            remark: "",
                          };

                        const officer =
                          asset.officer;

                        return (
                          <tr key={asset.id}>
                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              {actualIndex + 1}
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              {asset.governmentAssetNo ||
                                ""}
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              {asset.officeAssetNo ||
                                ""}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {officer
                                ? `${officer.firstName} ${officer.lastName}`
                                : ""}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                textAlign:
                                  "left",
                                paddingLeft:
                                  "3px",
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "clip",
                              }}
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
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              {getCategoryUnit(
                                asset.category
                              )}
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              -
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              -
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              -
                            </td>

                            <td
                              style={
                                bodyCellStyle
                              }
                            >
                              {row.countedQty}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {getAccuracyChecked(
                                row,
                                "CORRECT"
                              )}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {getAccuracyChecked(
                                row,
                                "INCORRECT"
                              )}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {getStatusChecked(
                                row,
                                "IN_USE"
                              )}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {getStatusChecked(
                                row,
                                "DAMAGED"
                              )}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {getStatusChecked(
                                row,
                                "DETERIORATED"
                              )}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {getStatusChecked(
                                row,
                                "UNUSABLE"
                              )}
                            </td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                textAlign:
                                  "left",
                                paddingLeft:
                                  "3px",
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                              }}
                            >
                              {row.remark || ""}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>

                {/* =================================================
                    SIGNATURE
                    ใช้ inspectorIds + officers ล่าสุด
                ================================================= */}

                <div
                  style={{
                    marginTop: "3mm",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(5, 1fr)",
                    columnGap: "3mm",
                    width: "100%",
                  }}
                >
                  {Array.from(
                    { length: 5 },
                    (_, index) => {
                      /*
                       * ดึงจาก inspectorIds ที่เลือกใน
                       * InspectionForm โดยตรง
                       */
                      const selectedInspectorId =
                        inspectorIds[index] || "";

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
                            fontSize:
                              "11px",
                            lineHeight:
                              1.05,
                          }}
                        >
                          <div
                            style={{
                              marginBottom:
                                "2mm",
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
                                "1mm",
                              whiteSpace:
                                "nowrap",
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
                    marginTop: "2mm",
                    fontSize: "10px",
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
  fontWeight: 700,
  padding: "1.5mm 1mm",
  lineHeight: 1,
  height: "8mm",
};

const bodyCellStyle: React.CSSProperties = {
  border: "1px solid #000000",
  background: "#ffffff",
  color: "#000000",
  textAlign: "center",
  verticalAlign: "middle",
  padding: "1mm 0.8mm",
  lineHeight: 1,
  height: "8mm",
  boxSizing: "border-box",
};