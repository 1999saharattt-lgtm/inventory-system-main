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
// เส้นสีดำบาง
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

function formatThaiDate(
  value: Date | string
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "th-TH",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

// =====================================================
// ปรับขนาดตัวอักษรรายการพัสดุ
//
// จุดประสงค์:
// - ไม่ตัดข้อความ
// - ไม่ให้ข้อความชนเส้นตาราง
// - ยังคงความสูงทุกแถวเท่ากัน
// =====================================================

function getMaterialFontSize(
  text: string
) {
  const length = text.length;

  if (length > 85) {
    return "10px";
  }

  if (length > 70) {
    return "11px";
  }

  if (length > 55) {
    return "12px";
  }

  if (length > 42) {
    return "13px";
  }

  return "15px";
}

// =====================================================
// ปรับขนาดตัวอักษรหมายเหตุ
// =====================================================

function getRemarkFontSize(
  text: string
) {
  const length = text.length;

  if (length > 35) {
    return "9.5px";
  }

  if (length > 28) {
    return "10.5px";
  }

  if (length > 20) {
    return "12px";
  }

  if (length > 14) {
    return "13px";
  }

  return "15px";
}

// =====================================================
// ลายเซ็น
//
// เส้นลงชื่ออยู่คอลัมน์กลาง
// วงเล็บชื่อ + วันที่
// จัดกึ่งกลางตรงใต้เส้นลงชื่อ
// =====================================================

function SignatureBlock({
  role,
}: {
  role: string;
}) {
  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {/* ===============================================
          แถวลงชื่อ
      =============================================== */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "12mm 45mm 1fr",

          alignItems: "center",

          width: "100%",
        }}
      >
        <div className="whitespace-nowrap">
          ลงชื่อ
        </div>

        <div
          className="
            whitespace-nowrap
            text-center
          "
          style={{
            width: "45mm",
          }}
        >
          ...............................................................
        </div>

        <div className="whitespace-nowrap">
          {role}
        </div>
      </div>

      {/* ===============================================
          วงเล็บชื่อ
          อยู่กึ่งกลางใต้เส้นลงชื่อ
      =============================================== */}

      <div
        className="
          mt-[1mm]
          whitespace-nowrap
          text-center
        "
        style={{
          marginLeft: "12mm",
          width: "45mm",
        }}
      >
        (.........................................................)
      </div>

      {/* ===============================================
          วันที่
          อยู่กึ่งกลางใต้เส้นลงชื่อ
      =============================================== */}

      <div
        className="
          mt-[1mm]
          whitespace-nowrap
          text-center
        "
        style={{
          marginLeft: "12mm",
          width: "45mm",
        }}
      >
        วันที่{" "}
        ................................................
      </div>
    </div>
  );
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
    if (
      !pdfRef.current ||
      loading
    ) {
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // Import Library
      // =================================================

      const html2canvas =
        (
          await import(
            "html2canvas"
          )
        ).default;

      const jsPDF =
        (
          await import(
            "jspdf"
          )
        ).default;

      // =================================================
      // รอ Font
      // =================================================

      if (
        document.fonts?.ready
      ) {
        await document.fonts.ready;
      }

      // =================================================
      // รอ Browser Render
      // =================================================

      await new Promise<void>(
        (resolve) => {
          requestAnimationFrame(
            () => {
              requestAnimationFrame(
                () => {
                  resolve();
                }
              );
            }
          );
        }
      );

      const element =
        pdfRef.current;

      if (!element) {
        throw new Error(
          "ไม่พบพื้นที่สำหรับสร้าง PDF"
        );
      }

      const width =
        element.clientWidth;

      const height =
        element.clientHeight;

      if (
        width <= 0 ||
        height <= 0
      ) {
        throw new Error(
          "ขนาดพื้นที่สำหรับสร้าง PDF ไม่ถูกต้อง"
        );
      }

      // =================================================
      // HTML -> Canvas
      // =================================================

      const canvas =
        await html2canvas(
          element,
          {
            scale: 3,

            useCORS: true,

            allowTaint: false,

            backgroundColor:
              "#ffffff",

            width,

            height,

            windowWidth:
              width,

            windowHeight:
              height,

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

      const pdf =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",

          compress:
            true,
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
        pdf.output(
          "blob"
        );

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

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
          document.createElement(
            "a"
          );

        link.href =
          pdfUrl;

        link.target =
          "_blank";

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

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            pdfUrl
          );
        },
        5 * 60 * 1000
      );
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
  // แถวว่าง:
  // - ยังมีเส้น
  // - ไม่มีเลขลำดับ
  // =====================================================

  const rows =
    Array.from(
      {
        length: 18,
      },
      (_, index) =>
        items[index] ??
        null
    );

  const totalItems =
    items.length;

  // =====================================================
  // Base Style ของ Cell
  //
  // ใช้ verticalAlign ของ Table โดยตรง
  // ไม่บังคับ position/top
  // ไม่ใช้ overflow:hidden ครอบข้อความแนวตั้ง
  // =====================================================

  const cellBaseStyle:
    React.CSSProperties = {
    height:
      TABLE_ROW_HEIGHT,

    padding:
      "0 1mm",

    margin:
      0,

    backgroundColor:
      "#ffffff",

    color:
      "#000000",

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize:
      "15px",

    fontWeight:
      "normal",

    lineHeight:
      "1.35",

    verticalAlign:
      "middle",

    boxSizing:
      "border-box",

    border:
      TABLE_BORDER,
  };

  // =====================================================
  // Cell หัวตาราง
  // =====================================================

  const headerCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    height:
      TABLE_ROW_HEIGHT,

    padding:
      "0 1mm",

    textAlign:
      "center",

    verticalAlign:
      "middle",

    whiteSpace:
      "nowrap",

    fontSize:
      "15px",

    lineHeight:
      "1.35",
  };

  // =====================================================
  // Cell ตรงกลาง
  // =====================================================

  const centerCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    textAlign:
      "center",

    verticalAlign:
      "middle",

    whiteSpace:
      "nowrap",
  };

  // =====================================================
  // Cell ชิดซ้าย
  // =====================================================

  const leftCellStyle:
    React.CSSProperties = {
    ...cellBaseStyle,

    textAlign:
      "left",

    verticalAlign:
      "middle",

    whiteSpace:
      "nowrap",

    paddingLeft:
      "1.5mm",

    paddingRight:
      "1mm",
  };

  // =====================================================
  // ข้อความหัวตาราง
  // =====================================================

  const headerTextStyle:
    React.CSSProperties = {
    display:
      "inline-block",

    margin:
      0,

    padding:
      0,

    color:
      "#000000",

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize:
      "15px",

    fontWeight:
      "normal",

    lineHeight:
      "1.35",

    whiteSpace:
      "nowrap",

    verticalAlign:
      "middle",
  };

  // =====================================================
  // ข้อมูลตัวเลข
  // =====================================================

  const dataTextStyle:
    React.CSSProperties = {
    display:
      "inline-block",

    margin:
      0,

    padding:
      0,

    color:
      "#000000",

    fontFamily:
      '"TH Sarabun New", Sarabun, Arial, sans-serif',

    fontSize:
      "15px",

    fontWeight:
      "normal",

    lineHeight:
      "1.35",

    whiteSpace:
      "nowrap",

    verticalAlign:
      "middle",
  };

  // =====================================================
  // ทุกแถวสูงเท่ากัน
  // =====================================================

  function getRowStyle():
    React.CSSProperties {
    return {
      height:
        TABLE_ROW_HEIGHT,
    };
  }

  return (
    <div>
      {/* =====================================================
          ปุ่มส่งออก PDF
      ===================================================== */}

      <button
        type="button"
        onClick={
          handleExport
        }
        disabled={
          loading
        }
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
          position:
            "fixed",

          left:
            "-10000px",

          top:
            "0",

          width:
            "210mm",

          height:
            "297mm",

          overflow:
            "hidden",

          pointerEvents:
            "none",

          opacity:
            1,

          zIndex:
            -1,
        }}
        aria-hidden="true"
      >
        <div
          ref={
            pdfRef
          }
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

            fontSize:
              "16px",

            lineHeight:
              "1",

            backgroundColor:
              "#ffffff",

            color:
              "#000000",
          }}
        >
          {/* =================================================
              ส่วนหัวเอกสาร
          ================================================= */}

          <div
            className="
              relative
              h-[27mm]
            "
          >
            {/* ===============================================
                เลขที่เอกสาร
            =============================================== */}

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
              {documentNo ||
                "-"}
            </div>

            {/* ===============================================
                พอ.101
                ใหญ่ + หนา + ดำ
            =============================================== */}

            <div
              className="
                pt-[0.5mm]
                text-center
                text-[28px]
                font-extrabold
                leading-none
                !text-black
              "
              style={{
                color:
                  "#000000",

                fontWeight:
                  800,
              }}
            >
              พอ.101
            </div>

            {/* ===============================================
                ใบเบิกพัสดุ
                ใหญ่ + หนา + ดำ
            =============================================== */}

            <div
              className="
                mt-[1mm]
                text-center
                text-[28px]
                font-extrabold
                leading-none
                !text-black
              "
              style={{
                color:
                  "#000000",

                fontWeight:
                  800,
              }}
            >
              ใบเบิกพัสดุ
            </div>

            {/* ===============================================
                กลุ่ม/งาน
            =============================================== */}

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
              <span
                className="
                  inline-block
                  w-[20mm]
                "
              >
                กลุ่ม/งาน :
              </span>

              <span>
                {departmentName ||
                  "-"}
              </span>

              <span
                className="
                  ml-[3mm]
                "
              >
                สำนักอนามัยการเจริญพันธุ์
                กรมอนามัย
              </span>
            </div>

            {/* ===============================================
                วันที่
            =============================================== */}

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
              <span
                className="
                  inline-block
                  w-[20mm]
                "
              >
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

          <div
            className="
              flex
              justify-center
            "
          >
            <table
              style={{
                width:
                  "190mm",

                tableLayout:
                  "fixed",

                borderCollapse:
                  "collapse",

                borderSpacing:
                  0,

                borderRadius:
                  0,

                border:
                  TABLE_BORDER,

                color:
                  "#000000",

                backgroundColor:
                  "#ffffff",
              }}
            >
              <thead>
                <tr
                  style={
                    getRowStyle()
                  }
                >
                  {/* =========================================
                      ลำดับ
                  ========================================= */}

                  <th
                    style={{
                      ...headerCellStyle,

                      width:
                        "8%",
                    }}
                  >
                    <span
                      style={
                        headerTextStyle
                      }
                    >
                      ลำดับ
                    </span>
                  </th>

                  {/* =========================================
                      รายการพัสดุ
                  ========================================= */}

                  <th
                    style={{
                      ...headerCellStyle,

                      width:
                        "44%",
                    }}
                  >
                    <span
                      style={
                        headerTextStyle
                      }
                    >
                      รายการพัสดุ
                    </span>
                  </th>

                  {/* =========================================
                      จำนวนที่ขอเบิก
                  ========================================= */}

                  <th
                    style={{
                      ...headerCellStyle,

                      width:
                        "15%",
                    }}
                  >
                    <span
                      style={
                        headerTextStyle
                      }
                    >
                      จำนวนที่ขอเบิก
                    </span>
                  </th>

                  {/* =========================================
                      จำนวนที่พัสดุจ่าย
                  ========================================= */}

                  <th
                    style={{
                      ...headerCellStyle,

                      width:
                        "15%",
                    }}
                  >
                    <span
                      style={
                        headerTextStyle
                      }
                    >
                      จำนวนที่พัสดุจ่าย
                    </span>
                  </th>

                  {/* =========================================
                      หมายเหตุ
                  ========================================= */}

                  <th
                    style={{
                      ...headerCellStyle,

                      width:
                        "18%",
                    }}
                  >
                    <span
                      style={
                        headerTextStyle
                      }
                    >
                      หมายเหตุ
                    </span>
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
                      {/* =====================================
                          ลำดับ
                      ===================================== */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        {item ? (
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {index +
                              1}
                          </span>
                        ) : null}
                      </td>

                      {/* =====================================
                          รายการพัสดุ
                      ===================================== */}

                      <td
                        style={
                          leftCellStyle
                        }
                      >
                        {item ? (
                          <span
                            style={{
                              display:
                                "inline-block",

                              margin:
                                0,

                              padding:
                                0,

                              color:
                                "#000000",

                              fontFamily:
                                '"TH Sarabun New", Sarabun, Arial, sans-serif',

                              fontSize:
                                getMaterialFontSize(
                                  item
                                    .material
                                    .name
                                ),

                              fontWeight:
                                "normal",

                              lineHeight:
                                "1.4",

                              whiteSpace:
                                "nowrap",

                              verticalAlign:
                                "middle",
                            }}
                          >
                            {
                              item
                                .material
                                .name
                            }
                          </span>
                        ) : null}
                      </td>

                      {/* =====================================
                          จำนวนที่ขอเบิก
                      ===================================== */}

                      <td
                        style={
                          centerCellStyle
                        }
                      >
                        {item ? (
                          <span
                            style={
                              dataTextStyle
                            }
                          >
                            {
                              item.qty
                            }
                          </span>
                        ) : null}
                      </td>

                      {/* =====================================
                          จำนวนที่พัสดุจ่าย
                      ===================================== */}

                      <td
                        style={
                          centerCellStyle
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
                              item
                                .issuedQty
                            }
                          </span>
                        ) : null}
                      </td>

                      {/* =====================================
                          หมายเหตุ
                      ===================================== */}

                      <td
                        style={
                          leftCellStyle
                        }
                      >
                        {item?.remark ? (
                          <span
                            style={{
                              display:
                                "inline-block",

                              margin:
                                0,

                              padding:
                                0,

                              color:
                                "#000000",

                              fontFamily:
                                '"TH Sarabun New", Sarabun, Arial, sans-serif',

                              fontSize:
                                getRemarkFontSize(
                                  item.remark
                                ),

                              fontWeight:
                                "normal",

                              lineHeight:
                                "1.4",

                              whiteSpace:
                                "nowrap",

                              verticalAlign:
                                "middle",
                            }}
                          >
                            {
                              item.remark
                            }
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
              {totalItems}{" "}
              รายการ
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

              แถวบน:
              ผู้รับของ ↔ ผู้เบิก

              แถวล่าง:
              ผู้จ่าย ↔ ผู้อนุญาต

              วงเล็บชื่อและวันที่
              อยู่กึ่งกลางใต้เส้นลงชื่อ
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

            <div
              className="
                text-left
              "
            >
              {/* ผู้รับของ */}

              <div
                className="
                  mb-[6mm]
                "
              >
                <SignatureBlock
                  role="ผู้รับของ"
                />
              </div>

              {/* ผู้จ่าย */}

              <SignatureBlock
                role="ผู้จ่าย"
              />
            </div>

            {/* =================================================
                ฝั่งขวา
            ================================================= */}

            <div
              className="
                text-left
              "
            >
              {/* ผู้เบิก */}

              <div
                className="
                  mb-[6mm]
                "
              >
                <SignatureBlock
                  role="ผู้เบิก"
                />
              </div>

              {/* ผู้อนุญาต */}

              <SignatureBlock
                role="ผู้อนุญาต"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}