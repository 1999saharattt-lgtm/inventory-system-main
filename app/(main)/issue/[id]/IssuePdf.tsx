"use client";

import React, { useRef } from "react";

type IssueItem = {
  id: number;
  qty: number;
  issuedQty: number;
  remark?: string | null;

  material: {
    code: string;
    name: string;
    unit: string;
    category: string;
    latestPrice: {
      toString(): string;
    };
  };
};

type IssuePdfProps = {
  issueId: number;
  documentNo: string;
  issueDate: Date | string;
  departmentName: string;
  requesterName?: string | null;
  items: IssueItem[];
};

// =====================================================
// สีเส้นตาราง
// =====================================================

const TABLE_BORDER_COLOR = "#64748b";

// =====================================================
// วันที่ภาษาไทย
// =====================================================

function formatThaiDate(value: Date | string) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function IssuePdf({
  issueId,
  documentNo,
  issueDate,
  departmentName,
  items,
}: IssuePdfProps) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] =
    React.useState(false);

  // =====================================================
  // สร้าง PDF
  //
  // หลักการ:
  // 1. ไม่เปิด Tab ว่างก่อน
  // 2. ไม่แสดงหน้า "กำลังสร้างเอกสาร PDF"
  // 3. สร้าง PDF ให้เสร็จก่อน
  // 4. จากนั้นจึงเปิด PDF
  // =====================================================

  const handleExport = async () => {
    if (!pdfRef.current || loading) {
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // Import Library
      // =================================================

      const html2canvas =
        (await import("html2canvas")).default;

      const jsPDF =
        (await import("jspdf")).default;

      // =================================================
      // รอ Font
      // =================================================

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // =================================================
      // รอ Browser Render
      // =================================================

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

      const element = pdfRef.current;

      if (!element) {
        throw new Error(
          "ไม่พบพื้นที่สำหรับสร้าง PDF"
        );
      }

      const width = element.clientWidth;
      const height = element.clientHeight;

      if (width <= 0 || height <= 0) {
        throw new Error(
          "ขนาดพื้นที่สำหรับสร้าง PDF ไม่ถูกต้อง"
        );
      }

      // =================================================
      // HTML -> Canvas
      // =================================================

      const canvas = await html2canvas(
        element,
        {
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
        }
      );

      // =================================================
      // Canvas -> PNG
      // =================================================

      const imageData =
        canvas.toDataURL(
          "image/png",
          1.0
        );

      // =================================================
      // สร้าง PDF A4
      // =================================================

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      // =================================================
      // ใส่เอกสารลง PDF
      // =================================================

      pdf.addImage(
        imageData,
        "PNG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST"
      );

      // =================================================
      // สร้าง PDF Blob
      // =================================================

      const pdfBlob =
        pdf.output("blob");

      const pdfUrl =
        URL.createObjectURL(pdfBlob);

      // =================================================
      // เปิด PDF โดยตรง
      // =================================================

      const pdfWindow = window.open(
        pdfUrl,
        "_blank"
      );

      // =================================================
      // กรณี Browser Block Popup
      //
      // ใช้ลิงก์ชั่วคราวเป็น fallback
      // =================================================

      if (!pdfWindow) {
        const link =
          document.createElement("a");

        link.href = pdfUrl;

        link.target = "_blank";

        link.rel =
          "noopener noreferrer";

        link.style.display = "none";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
      }

      // =================================================
      // คืน Memory ภายหลัง
      // =================================================

      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถสร้าง PDF ได้"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // พอ.101 จำนวน 18 แถว
  // =====================================================

  const rows = Array.from(
    { length: 18 },
    (_, index) =>
      items[index] ?? null
  );

  const totalItems = items.length;

  // =====================================================
  // Base style ของ Cell
  // =====================================================

  const cellBaseStyle:
    React.CSSProperties = {
    minHeight: "8mm",

    padding: 0,

    margin: 0,

    backgroundColor: "#ffffff",

    color: "#000000",

    fontFamily:
      "TH Sarabun New, Sarabun, Arial, sans-serif",

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1",

    verticalAlign: "middle",

    boxSizing: "border-box",

    border:
      `1px solid ${TABLE_BORDER_COLOR}`,
  };

  // =====================================================
  // ข้อความหัวตาราง
  // =====================================================

  const headerTextStyle:
    React.CSSProperties = {
    display: "inline-block",

    position: "relative",

    top: "-1.35mm",

    margin: 0,

    padding: 0,

    fontFamily:
      "TH Sarabun New, Sarabun, Arial, sans-serif",

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1",

    whiteSpace: "nowrap",

    textAlign: "center",

    verticalAlign: "middle",
  };

  // =====================================================
  // Cell หัวตาราง
  // =====================================================

  const headerCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    height: "8mm",

    textAlign: "center",

    whiteSpace: "nowrap",
  };

  // =====================================================
  // ข้อความข้อมูลทั่วไป
  // =====================================================

  const dataTextStyle:
    React.CSSProperties = {
    display: "inline-block",

    position: "relative",

    top: "-1.35mm",

    margin: 0,

    padding: 0,

    fontFamily:
      "TH Sarabun New, Sarabun, Arial, sans-serif",

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1",

    whiteSpace: "nowrap",

    verticalAlign: "middle",
  };

  // =====================================================
  // ข้อความรายการพัสดุ
  // =====================================================

  const materialNameTextStyle:
    React.CSSProperties = {
    display: "block",

    position: "relative",

    top: "-1.35mm",

    margin: 0,

    padding: 0,

    fontFamily:
      "TH Sarabun New, Sarabun, Arial, sans-serif",

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1",

    whiteSpace: "normal",

    overflowWrap: "break-word",

    wordBreak: "normal",

    verticalAlign: "middle",
  };

  // =====================================================
  // ข้อความหมายเหตุ
  // =====================================================

  const remarkTextStyle:
    React.CSSProperties = {
    display: "block",

    position: "relative",

    top: "-1.35mm",

    margin: 0,

    padding: 0,

    fontFamily:
      "TH Sarabun New, Sarabun, Arial, sans-serif",

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1",

    whiteSpace: "normal",

    overflowWrap: "break-word",

    wordBreak: "normal",

    verticalAlign: "middle",
  };

  // =====================================================
  // Cell ข้อมูลตรงกลาง
  // =====================================================

  const centerCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    textAlign: "center",

    whiteSpace: "nowrap",

    overflow: "visible",
  };

  // =====================================================
  // Cell ข้อมูลชิดซ้าย
  // =====================================================

  const leftCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    textAlign: "left",

    whiteSpace: "normal",

    overflow: "visible",

    paddingLeft: "1mm",

    paddingRight: "1mm",

    verticalAlign: "middle",
  };

  // =====================================================
  // ความสูงแต่ละแถว
  // =====================================================

  function getRowStyle(
    item: IssueItem | null
  ): React.CSSProperties {
    const hasLongMaterialName =
      Boolean(
        item &&
        item.material.name.length > 42
      );

    const hasLongRemark =
      Boolean(
        item &&
        item.remark &&
        item.remark.length > 30
      );

    const height =
      !item
        ? "8mm"
        : hasLongMaterialName ||
            hasLongRemark
          ? "10mm"
          : "8mm";

    return {
      height,
    };
  }

  return (
    <div>
      {/* =====================================================
          ปุ่มส่งออก PDF
      ===================================================== */}

      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="
          rounded-xl
          bg-gradient-to-r
          from-emerald-600
          to-green-500
          px-5
          py-2.5
          text-sm
          font-extrabold
          text-white
          shadow-lg
          transition
          hover:scale-105
          disabled:cursor-not-allowed
          disabled:opacity-60
          sm:px-6
          sm:py-3
          sm:text-base
        "
      >
        {loading
          ? "กำลังสร้าง PDF..."
          : "📄 ส่งออก PDF"}
      </button>

      {/* =====================================================
          พื้นที่สร้าง PDF
      ===================================================== */}

      <div
        style={{
          position: "fixed",

          left: "-10000px",

          top: "0",

          width: "210mm",

          height: "297mm",

          overflow: "hidden",

          pointerEvents: "none",

          opacity: 1,

          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div
          ref={pdfRef}
          id={`issue-pdf-${issueId}`}
          className="
            box-border
            h-[297mm]
            w-[210mm]
            overflow-hidden
            bg-white
            px-[10mm]
            py-[5mm]
            text-black
          "
          style={{
            fontFamily:
              "TH Sarabun New, Sarabun, Arial, sans-serif",

            fontSize: "16px",

            lineHeight: "1",

            backgroundColor: "#ffffff",

            color: "#000000",
          }}
        >
          {/* =================================================
              ส่วนหัวเอกสาร
          ================================================= */}

          <div className="relative h-[27mm]">
            {/* เลขที่เอกสาร */}

            <div
              className="
                absolute
                right-0
                top-0
                whitespace-nowrap
                text-[21px]
                leading-none
                text-black
              "
            >
              เลขที่เอกสาร{" "}
              {documentNo || "-"}
            </div>

            {/* พอ.101 */}

            <div
              className="
                pt-[1mm]
                text-center
                text-[21px]
                font-bold
                leading-none
                text-black
              "
            >
              พอ.101
            </div>

            {/* ใบเบิกพัสดุ */}

            <div
              className="
                mt-[0.8mm]
                text-center
                text-[21px]
                font-bold
                leading-none
                text-black
              "
            >
              ใบเบิกพัสดุ
            </div>

            {/* กลุ่ม/งาน */}

            <div
              className="
                absolute
                left-0
                right-0
                top-[15mm]
                whitespace-nowrap
                text-[21px]
                leading-none
                text-black
              "
            >
              <span className="inline-block w-[20mm]">
                กลุ่ม/งาน :
              </span>

              <span>
                {departmentName || "-"}
              </span>

              <span className="ml-[3mm]">
                สำนักอนามัยการเจริญพันธุ์
                กรมอนามัย
              </span>
            </div>

            {/* วันที่ */}

            <div
              className="
                absolute
                left-0
                right-0
                top-[21mm]
                whitespace-nowrap
                text-[21px]
                leading-none
                text-black
              "
            >
              <span className="inline-block w-[20mm]">
                วันที่ :
              </span>

              {formatThaiDate(issueDate)}
            </div>
          </div>

          {/* =================================================
              ข้อความประสงค์
          ================================================= */}

          <div
            className="
              mb-[4mm]
              text-[21px]
              leading-none
              text-black
            "
          >
            ประสงค์จะขอเบิกสิ่งของต่างๆ
            สำหรับใช้ในราชการ
            ดังมีรายการต่อไปนี้
          </div>

          {/* =================================================
              ตาราง
          ================================================= */}

          <div className="flex justify-center">
            <table
              className="
                w-[190mm]
                table-fixed
                border-collapse
                bg-white
                text-black
              "
              style={{
                width: "190mm",

                tableLayout: "fixed",

                borderSpacing: 0,

                borderRadius: 0,

                border:
                  `1px solid ${TABLE_BORDER_COLOR}`,

                fontSize: "16px",

                color: "#000000",

                backgroundColor:
                  "#ffffff",
              }}
            >
              <thead>
                <tr
                  style={{
                    height: "8mm",
                  }}
                >
                  <th
                    style={{
                      ...headerCellStyle,
                      width: "8%",
                    }}
                  >
                    <span style={headerTextStyle}>
                      ลำดับ
                    </span>
                  </th>

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "44%",
                    }}
                  >
                    <span style={headerTextStyle}>
                      รายการพัสดุ
                    </span>
                  </th>

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "15%",
                    }}
                  >
                    <span style={headerTextStyle}>
                      จำนวนที่ขอเบิก
                    </span>
                  </th>

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "15%",
                    }}
                  >
                    <span style={headerTextStyle}>
                      จำนวนที่เบิกจ่าย
                    </span>
                  </th>

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "18%",
                    }}
                  >
                    <span style={headerTextStyle}>
                      หมายเหตุ
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (item, index) => (
                    <tr
                      key={
                        item?.id ??
                        `empty-${index}`
                      }
                      style={getRowStyle(item)}
                    >
                      {/* ลำดับ */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        <span
                          style={
                            dataTextStyle
                          }
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        style={
                          leftCellStyle
                        }
                      >
                        {item ? (
                          <span
                            style={
                              materialNameTextStyle
                            }
                          >
                            {
                              item.material
                                .name
                            }
                          </span>
                        ) : null}
                      </td>

                      {/* จำนวนที่ขอเบิก */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        <span
                          style={
                            dataTextStyle
                          }
                        >
                          {item?.qty ?? ""}
                        </span>
                      </td>

                      {/* จำนวนที่เบิกจ่าย */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        <span
                          style={
                            dataTextStyle
                          }
                        >
                          {item
                            ? item.issuedQty >
                              0
                              ? item.issuedQty
                              : ""
                            : ""}
                        </span>
                      </td>

                      {/* หมายเหตุ */}

                      <td
                        style={
                          leftCellStyle
                        }
                      >
                        {item?.remark ? (
                          <span
                            style={
                              remarkTextStyle
                            }
                          >
                            {item.remark}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              หลังตาราง
          ================================================= */}

          <div
            className="
              mt-[3mm]
              flex
              justify-between
              px-[2mm]
              text-[21px]
              leading-none
              text-black
            "
          >
            <div>
              ได้รับของจากงานพัสดุเรียบร้อยแล้ว
            </div>

            <div>
              รวมทั้งสิ้น{" "}
              {totalItems} รายการ
            </div>
          </div>

          {/* =================================================
              วันที่ลงบัญชีหักพัสดุ
          ================================================= */}

          <div
            className="
              mt-[2.5mm]
              px-[2mm]
              text-[21px]
              leading-none
              text-black
            "
          >
            วันที่ลงบัญชีหักพัสดุ{" "}
            ................................................
          </div>

          {/* =================================================
              ลายเซ็น
          ================================================= */}

          <div
            className="
              mt-[6mm]
              grid
              grid-cols-2
              gap-x-[15mm]
              px-[8mm]
              text-[21px]
              leading-none
              text-black
            "
          >
            {/* ฝั่งซ้าย */}

            <div className="text-center">
              {/* ผู้รับของ */}

              <div className="mb-[6mm]">
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................{" "}
                  ผู้รับของ
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่{" "}
                  ................................................
                </div>
              </div>

              {/* ผู้จ่าย */}

              <div>
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................{" "}
                  ผู้จ่าย
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่{" "}
                  ................................................
                </div>
              </div>
            </div>

            {/* ฝั่งขวา */}

            <div className="text-center">
              {/* หัวหน้ากลุ่ม */}

              <div className="mb-[6mm]">
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................{" "}
                  หัวหน้ากลุ่ม
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่{" "}
                  ................................................
                </div>
              </div>

              {/* ผู้อนุญาต */}

              <div>
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................{" "}
                  ผู้อนุญาต
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่{" "}
                  ................................................
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}