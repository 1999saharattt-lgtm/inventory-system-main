"use client";

import React, { useRef } from "react";

type IssueItem = {
  id: number;
  qty: number;
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

      const element = pdfRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const imageData = canvas.toDataURL("image/png");

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
          from-red-600
          to-rose-500
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
        {loading ? "กำลังสร้าง PDF..." : "📄 Export PDF"}
      </button>

      {/* =====================================================
          พอ.101

          A4 = 210 x 297 mm

          ขอบบน    5mm
          ขอบล่าง  5mm
          ขอบซ้าย  10mm
          ขอบขวา   10mm

          พื้นที่ใช้งานแนวนอน = 190mm
      ===================================================== */}

      <div
        ref={pdfRef}
        id="issue-pdf"
        className="
          mx-auto
          mt-6
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
              text-[16px]
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
              text-[17px]
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
              text-[16px]
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
              text-[16px]
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
            text-[16px]
            leading-none
            text-black
          "
        >
          ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ
          ดังมีรายการต่อไปนี้
        </div>

        {/* =====================================================
            ตารางรายการ

            A4 กว้าง 210mm
            ขอบซ้าย/ขวา 10mm
            ตารางกว้าง 190mm

            หัวตาราง 8mm
            แถวข้อมูล 8mm

            ข้อความในตาราง 16px

            การจัดแนว:
            - ลำดับ       = กึ่งกลางแนวนอน
            - หมวดหมู่    = กึ่งกลางแนวนอน
            - รายการพัสดุ = ชิดซ้ายแนวนอน
            - จำนวนขอเบิก = กึ่งกลางแนวนอน
            - จำนวนเบิกจ่าย = ว่าง
            - หมายเหตุ    = กึ่งกลางแนวนอน
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
                {/* =================================================
                    ลำดับ
                ================================================= */}

                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-white
                    p-0
                    text-black
                  "
                  style={{
                    height: "8mm",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "16px",
                    lineHeight: "1.2",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "8mm",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1.2",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    ลำดับ
                  </div>
                </th>

                {/* =================================================
                    หมวดหมู่
                ================================================= */}

                <th
                  className="
                    w-[18%]
                    border
                    border-black
                    bg-white
                    p-0
                    text-black
                  "
                  style={{
                    height: "8mm",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "16px",
                    lineHeight: "1.2",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "8mm",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1.2",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    หมวดหมู่
                  </div>
                </th>

                {/* =================================================
                    รายการพัสดุ
                ================================================= */}

                <th
                  className="
                    w-[38%]
                    border
                    border-black
                    bg-white
                    p-0
                    text-black
                  "
                  style={{
                    height: "8mm",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "16px",
                    lineHeight: "1.2",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "8mm",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1.2",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    รายการพัสดุ
                  </div>
                </th>

                {/* =================================================
                    จำนวนที่ขอเบิก
                ================================================= */}

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-white
                    p-0
                    text-black
                  "
                  style={{
                    height: "8mm",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "16px",
                    lineHeight: "1.2",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "8mm",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1.2",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    จำนวนที่ขอเบิก
                  </div>
                </th>

                {/* =================================================
                    จำนวนที่เบิกจ่าย
                ================================================= */}

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-white
                    p-0
                    text-black
                  "
                  style={{
                    height: "8mm",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "16px",
                    lineHeight: "1.2",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "8mm",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1.2",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    จำนวนที่เบิกจ่าย
                  </div>
                </th>

                {/* =================================================
                    หมายเหตุ
                ================================================= */}

                <th
                  className="
                    w-[9%]
                    border
                    border-black
                    bg-white
                    p-0
                    text-black
                  "
                  style={{
                    height: "8mm",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "16px",
                    lineHeight: "1.2",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "8mm",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1.2",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    หมายเหตุ
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={item?.id ?? `empty-${index}`}
                  style={{
                    height: "8mm",
                  }}
                >
                  {/* =================================================
                      ลำดับ
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={{
                      height: "8mm",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "16px",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "8mm",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1.2",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      {index + 1}
                    </div>
                  </td>

                  {/* =================================================
                      หมวดหมู่
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={{
                      height: "8mm",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "16px",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "8mm",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1.2",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "clip",
                        padding: "0 0.5mm",
                        boxSizing: "border-box",
                      }}
                    >
                      {item
                        ? categoryLabels[
                            item.material.category
                          ] ?? item.material.category
                        : ""}
                    </div>
                  </td>

                  {/* =================================================
                      รายการพัสดุ

                      ชิดซ้ายแนวนอน
                      กึ่งกลางแนวตั้ง
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={{
                      height: "8mm",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "16px",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "8mm",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        lineHeight: "1.2",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "clip",
                        paddingLeft: "1mm",
                        paddingRight: "0.5mm",
                        boxSizing: "border-box",
                      }}
                    >
                      {item ? item.material.name : ""}
                    </div>
                  </td>

                  {/* =================================================
                      จำนวนขอเบิก

                      กึ่งกลางแนวนอน
                      กึ่งกลางแนวตั้ง
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={{
                      height: "8mm",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "16px",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "8mm",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1.2",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      {item?.qty ?? ""}
                    </div>
                  </td>

                  {/* =================================================
                      จำนวนเบิกจ่าย

                      เว้นว่างทั้งหมด
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={{
                      height: "8mm",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "16px",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "8mm",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1.2",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* เว้นว่าง */}
                    </div>
                  </td>

                  {/* =================================================
                      หมายเหตุ

                      กึ่งกลางแนวนอน
                      กึ่งกลางแนวตั้ง
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      p-0
                      text-black
                    "
                    style={{
                      height: "8mm",
                      padding: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "16px",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "8mm",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1.2",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "clip",
                        padding: "0 0.5mm",
                        boxSizing: "border-box",
                      }}
                    >
                      {item?.remark ?? ""}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            หลังตาราง
        ===================================================== */}

        <div
          className="
            mt-[3mm]
            flex
            justify-between
            px-[2mm]
            text-[16px]
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
            text-[16px]
            leading-none
            text-black
          "
        >
          วันที่ลงบัญชีหักพัสดุ
          {" "}
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
            text-[16px]
            leading-none
            text-black
          "
        >
          {/* =================================================
              ฝั่งซ้าย
          ================================================= */}

          <div className="text-center">
            {/* ผู้รับของ */}

            <div className="mb-[6mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ...............................................................
                {" "}
                ผู้รับของ
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
                ลงชื่อ
                {" "}
                ...............................................................
                {" "}
                ผู้จ่าย
              </div>

              <div className="mt-[1mm] whitespace-nowrap">
                (.........................................................)
              </div>

              <div className="mt-[1mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>
          </div>

          {/* =================================================
              ฝั่งขวา
          ================================================= */}

          <div className="text-center">
            {/* หัวหน้ากลุ่ม */}

            <div className="mb-[6mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ...............................................................
                {" "}
                หัวหน้ากลุ่ม
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
                ลงชื่อ
                {" "}
                ...............................................................
                {" "}
                ผู้อนุญาต
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
  );
}