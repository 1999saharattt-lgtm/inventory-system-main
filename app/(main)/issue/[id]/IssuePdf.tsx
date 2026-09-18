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
// ตาราง พอ.101
//
// ใช้เส้นสีดำบาง
// ไม่ใช้ rgba เพื่อให้เวลาพิมพ์ออกมาเป็นสีดำจริง
// แต่ลดความหนาของเส้นแทน
// =====================================================

const TABLE_BORDER_COLOR = "#000000";
const TABLE_BORDER_WIDTH = "0.25px";
const TABLE_BORDER =
  `${TABLE_BORDER_WIDTH} solid ${TABLE_BORDER_COLOR}`;

// =====================================================
// ทุกแถวสูงเท่ากัน
// =====================================================

const TABLE_ROW_HEIGHT = "8mm";

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
  const pdfRef =
    useRef<HTMLDivElement>(null);

  const [loading, setLoading] =
    React.useState(false);

  // =====================================================
  // สร้าง PDF
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

      const width =
        element.clientWidth;

      const height =
        element.clientHeight;

      if (width <= 0 || height <= 0) {
        throw new Error(
          "ขนาดพื้นที่สำหรับสร้าง PDF ไม่ถูกต้อง"
        );
      }

      // =================================================
      // HTML -> Canvas
      //
      // scale 3 เพื่อให้ตัวอักษรและเส้นคมขึ้น
      // =================================================

      const canvas =
        await html2canvas(element, {
          scale: 3,

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

      const pdf =
        new jsPDF({
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
      // ใส่ภาพลง PDF
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
      // สร้าง Blob
      // =================================================

      const pdfBlob =
        pdf.output("blob");

      const pdfUrl =
        URL.createObjectURL(pdfBlob);

      // =================================================
      // เปิด PDF
      // =================================================

      const pdfWindow =
        window.open(
          pdfUrl,
          "_blank"
        );

      // =================================================
      // Fallback
      // =================================================

      if (!pdfWindow) {
        const link =
          document.createElement("a");

        link.href = pdfUrl;
        link.target = "_blank";
        link.rel =
          "noopener noreferrer";

        link.style.display =
          "none";

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );
      }

      // =================================================
      // คืน Memory ภายหลัง
      // =================================================

      window.setTimeout(() => {
        URL.revokeObjectURL(
          pdfUrl
        );
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
  //
  // ช่องว่างยังคงมีเส้นตาราง
  // แต่ไม่แสดงเลขลำดับ
  // =====================================================

  const rows = Array.from(
    { length: 18 },
    (_, index) =>
      items[index] ?? null
  );

  const totalItems =
    items.length;

  // =====================================================
  // Base Style ของ Cell
  //
  // สำคัญ:
  // ไม่ใช้ top: -1.35mm กับข้อความอีก
  // เพราะทำให้ตัวอักษรถูกตัด
  // =====================================================

  const cellBaseStyle:
    React.CSSProperties = {
    height: TABLE_ROW_HEIGHT,

    padding: 0,
    margin: 0,

    backgroundColor: "#ffffff",
    color: "#000000",

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1",

    verticalAlign: "middle",

    boxSizing: "border-box",

    border: TABLE_BORDER,
  };

  // =====================================================
  // Wrapper สำหรับจัดข้อความกึ่งกลางแนวตั้ง
  //
  // ใช้ flex แทน position/top
  // ป้องกันตัวหนังสือตกหรือถูกตัด
  // =====================================================

  const centerContentStyle:
    React.CSSProperties = {
    width: "100%",
    height: "100%",

    minHeight: TABLE_ROW_HEIGHT,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    paddingTop: 0,
    paddingBottom: 0,

    margin: 0,
  };

  const leftContentStyle:
    React.CSSProperties = {
    width: "100%",
    height: "100%",

    minHeight: TABLE_ROW_HEIGHT,

    display: "flex",

    alignItems: "center",

    justifyContent: "flex-start",

    boxSizing: "border-box",

    paddingLeft: "1mm",
    paddingRight: "1mm",

    paddingTop: 0,
    paddingBottom: 0,

    margin: 0,

    overflow: "hidden",
  };

  // =====================================================
  // ข้อความหัวตาราง
  // =====================================================

  const headerTextStyle:
    React.CSSProperties = {
    display: "block",

    margin: 0,
    padding: 0,

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1.15",

    whiteSpace: "nowrap",

    textAlign: "center",
  };

  // =====================================================
  // Cell หัวตาราง
  // =====================================================

  const headerCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    height: TABLE_ROW_HEIGHT,

    textAlign: "center",

    whiteSpace: "nowrap",

    verticalAlign: "middle",
  };

  // =====================================================
  // ข้อความข้อมูล
  // =====================================================

  const dataTextStyle:
    React.CSSProperties = {
    display: "block",

    margin: 0,
    padding: 0,

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1.15",

    whiteSpace: "nowrap",
  };

  // =====================================================
  // รายการพัสดุ
  // =====================================================

  const materialNameTextStyle:
    React.CSSProperties = {
    display: "block",

    width: "100%",

    margin: 0,
    padding: 0,

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1.15",

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "clip",
  };

  // =====================================================
  // หมายเหตุ
  // =====================================================

  const remarkTextStyle:
    React.CSSProperties = {
    display: "block",

    width: "100%",

    margin: 0,
    padding: 0,

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize: "16px",

    fontWeight: "normal",

    lineHeight: "1.15",

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "clip",
  };

  // =====================================================
  // Cell ตรงกลาง
  // =====================================================

  const centerCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    textAlign: "center",

    whiteSpace: "nowrap",

    overflow: "hidden",

    verticalAlign: "middle",
  };

  // =====================================================
  // Cell ชิดซ้าย
  // =====================================================

  const leftCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    textAlign: "left",

    whiteSpace: "nowrap",

    overflow: "hidden",

    verticalAlign: "middle",
  };

  // =====================================================
  // ทุกแถวสูงเท่ากัน
  // =====================================================

  function getRowStyle():
    React.CSSProperties {
    return {
      height: TABLE_ROW_HEIGHT,
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
              '"TH Sarabun New", Sarabun, Arial, sans-serif',

            fontSize: "16px",

            lineHeight: "1",

            backgroundColor:
              "#ffffff",

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

              {formatThaiDate(
                issueDate
              )}
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
              ตารางรายการ
          ================================================= */}

          <div className="flex justify-center">
            <table
              style={{
                width: "190mm",

                tableLayout: "fixed",

                borderCollapse:
                  "collapse",

                borderSpacing: 0,

                borderRadius: 0,

                border: TABLE_BORDER,

                fontSize: "16px",

                color: "#000000",

                backgroundColor:
                  "#ffffff",
              }}
            >
              <thead>
                <tr style={getRowStyle()}>
                  {/* ลำดับ */}

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "8%",
                    }}
                  >
                    <div
                      style={
                        centerContentStyle
                      }
                    >
                      <span
                        style={
                          headerTextStyle
                        }
                      >
                        ลำดับ
                      </span>
                    </div>
                  </th>

                  {/* รายการพัสดุ */}

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "44%",
                    }}
                  >
                    <div
                      style={
                        centerContentStyle
                      }
                    >
                      <span
                        style={
                          headerTextStyle
                        }
                      >
                        รายการพัสดุ
                      </span>
                    </div>
                  </th>

                  {/* จำนวนที่ขอเบิก */}

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "15%",
                    }}
                  >
                    <div
                      style={
                        centerContentStyle
                      }
                    >
                      <span
                        style={
                          headerTextStyle
                        }
                      >
                        จำนวนที่ขอเบิก
                      </span>
                    </div>
                  </th>

                  {/* จำนวนที่พัสดุจ่าย */}

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "15%",
                    }}
                  >
                    <div
                      style={
                        centerContentStyle
                      }
                    >
                      <span
                        style={
                          headerTextStyle
                        }
                      >
                        จำนวนที่พัสดุจ่าย
                      </span>
                    </div>
                  </th>

                  {/* หมายเหตุ */}

                  <th
                    style={{
                      ...headerCellStyle,
                      width: "18%",
                    }}
                  >
                    <div
                      style={
                        centerContentStyle
                      }
                    >
                      <span
                        style={
                          headerTextStyle
                        }
                      >
                        หมายเหตุ
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        item?.id ??
                        `empty-${index}`
                      }
                      style={
                        getRowStyle()
                      }
                    >
                      {/* ลำดับ */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        <div
                          style={
                            centerContentStyle
                          }
                        >
                          {item ? (
                            <span
                              style={
                                dataTextStyle
                              }
                            >
                              {index + 1}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        style={
                          leftCellStyle
                        }
                      >
                        <div
                          style={
                            leftContentStyle
                          }
                        >
                          {item ? (
                            <span
                              style={
                                materialNameTextStyle
                              }
                            >
                              {
                                item
                                  .material
                                  .name
                              }
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* จำนวนที่ขอเบิก */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        <div
                          style={
                            centerContentStyle
                          }
                        >
                          {item ? (
                            <span
                              style={
                                dataTextStyle
                              }
                            >
                              {item.qty}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* จำนวนที่พัสดุจ่าย */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        <div
                          style={
                            centerContentStyle
                          }
                        >
                          {item &&
                          item.issuedQty >
                            0 ? (
                            <span
                              style={
                                dataTextStyle
                              }
                            >
                              {
                                item.issuedQty
                              }
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* หมายเหตุ */}

                      <td
                        style={
                          leftCellStyle
                        }
                      >
                        <div
                          style={
                            leftContentStyle
                          }
                        >
                          {item?.remark ? (
                            <span
                              style={
                                remarkTextStyle
                              }
                            >
                              {
                                item.remark
                              }
                            </span>
                          ) : null}
                        </div>
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
              px-[2mm]
              text-[21px]
              leading-none
              text-black
            "
          >
            {/* =================================================
                ฝั่งซ้าย
            ================================================= */}

            <div className="text-left">
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

            {/* =================================================
                ฝั่งขวา
            ================================================= */}

            <div className="text-center">
              {/* ผู้เบิก */}

              <div className="mb-[6mm]">
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................{" "}
                  ผู้เบิก
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