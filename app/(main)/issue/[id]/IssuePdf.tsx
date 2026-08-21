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
  items: IssueItem[];
};

const categoryLabels: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

function formatThaiDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

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

  const [loading, setLoading] = React.useState(false);

  // =====================================================
  // Export PDF
  // =====================================================

  const handleExport = async () => {
    if (!pdfRef.current) {
      return;
    }

    try {
      setLoading(true);

      const html2canvas =
        (await import("html2canvas")).default;

      const jsPDF =
        (await import("jspdf")).default;

      // =================================================
      // รอ font ให้พร้อมก่อนสร้าง canvas
      // =================================================

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // รอ browser render 2 รอบ
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

      const element = pdfRef.current;

      const width = element.clientWidth;
      const height = element.clientHeight;

      const canvas = await html2canvas(element, {
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

      pdf.save(
        `ใบเบิกพัสดุ-${documentNo || issueId}.pdf`
      );
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // พอ.101 มี 18 รายการ
  // =====================================================

  const rows = Array.from(
    { length: 18 },
    (_, index) => items[index] ?? null
  );

  const totalItems = items.length;

  // =====================================================
  // Base style ของ cell
  //
  // ใช้ขนาดมาตรฐาน 16px
  // ไม่ลดขนาดตามความยาวข้อความ
  // =====================================================

  const cellBaseStyle: React.CSSProperties = {
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
  };

  // =====================================================
  // ตัวข้อความหัวตาราง
  // =====================================================

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
    lineHeight: "1",
    whiteSpace: "nowrap",
    textAlign: "center",
    verticalAlign: "middle",
  };

  // =====================================================
  // Cell หัวตาราง
  // =====================================================

  const headerCellStyle: React.CSSProperties = {
    ...cellBaseStyle,
    height: "8mm",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  // =====================================================
  // ตัวข้อความข้อมูลทั่วไป
  // =====================================================

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
    lineHeight: "1",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };

  // =====================================================
  // ตัวข้อความรายการพัสดุ
  //
  // ใช้ขนาดมาตรฐาน 16px เสมอ
  //
  // ชื่อที่ยาวสามารถขึ้น 2 บรรทัดได้
  // =====================================================

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
    lineHeight: "1",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "normal",
    verticalAlign: "middle",
  };

  // =====================================================
  // Cell ข้อมูลทั่วไป
  // =====================================================

  const centerCellStyle: React.CSSProperties = {
    ...cellBaseStyle,
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "visible",
  };

  // =====================================================
  // Cell ข้อมูลรายการพัสดุ
  //
  // อนุญาตให้ข้อความขึ้น 2 บรรทัด
  // ไม่ตัดข้อความด้วย overflow:hidden
  // =====================================================

  const leftCellStyle: React.CSSProperties = {
    ...cellBaseStyle,
    textAlign: "left",
    whiteSpace: "normal",
    overflow: "visible",
    paddingLeft: "1mm",
    paddingRight: "0.5mm",
    verticalAlign: "middle",
  };

  // =====================================================
  // กำหนดความสูงของแถว
  //
  // ชื่อพัสดุสั้น  = 8mm
  // ชื่อพัสดุยาว   = 10mm
  //
  // ไม่ลด font
  // =====================================================

  function getRowStyle(
    item: IssueItem | null
  ): React.CSSProperties {
    if (!item) {
      return {
        height: "8mm",
      };
    }

    const nameLength =
      item.material.name.length;

    return {
      height:
        nameLength > 32
          ? "10mm"
          : "8mm",
    };
  }

  return (
    <div>
      {/* =====================================================
          ปุ่ม Export PDF
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
          px-6
          py-3
          font-extrabold
          text-white
          shadow-lg
          transition
          hover:scale-105
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {loading
          ? "กำลังสร้าง PDF..."
          : "📄 Export PDF"}
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
          id="issue-pdf"
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
          {/* =====================================================
              ส่วนหัวเอกสาร
          ===================================================== */}

          <div className="relative h-[25mm]">
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
              เลขที่ {documentNo || "-"}
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

            {/* หน่วยงาน */}

            <div
              className="
                absolute
                bottom-[2mm]
                left-0
                max-w-[135mm]
                whitespace-nowrap
                text-[21px]
                leading-none
                text-black
              "
            >
              กลุ่มงาน {departmentName} สำนักอนามัยการเจริญพันธุ์
              กรมอนามัย
            </div>

            {/* วันที่ */}

            <div
              className="
                absolute
                bottom-[2mm]
                right-0
                whitespace-nowrap
                text-[21px]
                leading-none
                text-black
              "
            >
              วันที่ {formatThaiDate(issueDate)}
            </div>
          </div>

          {/* =====================================================
              ข้อความนำหน้าตาราง
          ===================================================== */}

          <div
            className="
              mb-[4mm]
              text-[21px]
              leading-none
              text-black
            "
          >
            ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ
            ดังมีรายการต่อไปนี้
          </div>

          {/* =====================================================
              ตารางรายการ
          ===================================================== */}

          <div className="flex justify-center">
            <table
              className="
                w-[190mm]
                table-fixed
                border-collapse
                border
                border-black
                bg-white
                text-black
              "
              style={{
                width: "190mm",
                tableLayout: "fixed",
                borderSpacing: 0,
                borderRadius: 0,
                fontSize: "16px",
                color: "#000000",
                backgroundColor: "#ffffff",
              }}
            >
              <thead>
                <tr
                  style={{
                    height: "8mm",
                  }}
                >
                  <th
                    className="
                      w-[7%]
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={headerCellStyle}
                  >
                    <span style={headerTextStyle}>
                      ลำดับ
                    </span>
                  </th>

                  <th
                    className="
                      w-[17%]
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={headerCellStyle}
                  >
                    <span style={headerTextStyle}>
                      หมวดหมู่
                    </span>
                  </th>

                  <th
                    className="
                      w-[37%]
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={headerCellStyle}
                  >
                    <span style={headerTextStyle}>
                      รายการพัสดุ
                    </span>
                  </th>

                  <th
                    className="
                      w-[13%]
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={headerCellStyle}
                  >
                    <span style={headerTextStyle}>
                      จำนวนที่ขอเบิก
                    </span>
                  </th>

                  <th
                    className="
                      w-[13%]
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={headerCellStyle}
                  >
                    <span style={headerTextStyle}>
                      จำนวนที่เบิกจ่าย
                    </span>
                  </th>

                  <th
                    className="
                      w-[13%]
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={headerCellStyle}
                  >
                    <span style={headerTextStyle}>
                      หน่วย
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item, index) => (
                  <tr
                    key={
                      item?.id ??
                      `empty-${index}`
                    }
                    style={getRowStyle(item)}
                  >
                    <td
                      className="
                        border
                        border-black
                        bg-white
                        p-0
                        text-black
                      "
                      style={centerCellStyle}
                    >
                      <span style={dataTextStyle}>
                        {index + 1}
                      </span>
                    </td>

                    <td
                      className="
                        border
                        border-black
                        bg-white
                        p-0
                        text-black
                      "
                      style={{
                        ...centerCellStyle,
                        paddingLeft: "0.5mm",
                        paddingRight: "0.5mm",
                      }}
                    >
                      <span style={dataTextStyle}>
                        {item
                          ? categoryLabels[
                              item.material.category
                            ] ??
                            item.material.category
                          : ""}
                      </span>
                    </td>

                    <td
                      className="
                        border
                        border-black
                        bg-white
                        p-0
                        text-black
                      "
                      style={leftCellStyle}
                    >
                      {item ? (
                        <span
                          style={
                            materialNameTextStyle
                          }
                        >
                          {item.material.name}
                        </span>
                      ) : null}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        bg-white
                        p-0
                        text-black
                      "
                      style={centerCellStyle}
                    >
                      <span style={dataTextStyle}>
                        {item?.qty ?? ""}
                      </span>
                    </td>

                    {/* จำนวนที่เบิกจ่ายจริง
                        ตั้งใจเว้นว่างเสมอใน PDF */}
                    <td
                      className="
                        border
                        border-black
                        bg-white
                        p-0
                        text-black
                      "
                      style={centerCellStyle}
                    >
                      <span style={dataTextStyle}>
                        {""}
                      </span>
                    </td>

                    <td
                      className="
                        border
                        border-black
                        bg-white
                        p-0
                        text-black
                      "
                      style={{
                        ...centerCellStyle,
                        paddingLeft: "0.5mm",
                        paddingRight: "0.5mm",
                      }}
                    >
                      <span style={dataTextStyle}>
                        {item?.material.unit ?? ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =====================================================
              หลังตาราง
              ใช้ 21px เท่ากับ "ใบเบิกพัสดุ"
          ===================================================== */}

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
              รวมทั้งสิ้น {totalItems} รายการ
            </div>
          </div>

          {/* =====================================================
              วันที่ลงบัญชีหักพัสดุ
          ===================================================== */}

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

          {/* =====================================================
              ลายเซ็น 4 ตำแหน่ง
          ===================================================== */}

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
                  ...............................................................
                  {" "}ผู้รับของ
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่ ................................................
                </div>
              </div>

              {/* ผู้จ่าย */}

              <div>
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................
                  {" "}ผู้จ่าย
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่ ................................................
                </div>
              </div>
            </div>

            {/* ฝั่งขวา */}

            <div className="text-center">
              {/* หัวหน้ากลุ่ม */}

              <div className="mb-[6mm]">
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................
                  {" "}หัวหน้ากลุ่ม
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่ ................................................
                </div>
              </div>

              {/* ผู้อนุญาต */}

              <div>
                <div className="whitespace-nowrap">
                  ลงชื่อ{" "}
                  ...............................................................
                  {" "}ผู้อนุญาต
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  (.........................................................)
                </div>

                <div className="mt-[1mm] whitespace-nowrap">
                  วันที่ ................................................
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}