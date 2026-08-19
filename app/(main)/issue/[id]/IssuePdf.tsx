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
          A4 210 x 297 mm

          ขอบบน    5mm
          ขอบล่าง  5mm
          ขอบซ้าย  0mm
          ขอบขวา   0mm

          เพื่อให้ตารางมีพื้นที่เต็มหน้า
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
          px-0
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
            ส่วนหัว
        ===================================================== */}

        <div className="relative h-[25mm] px-[5mm]">
          {/* เลขที่เอกสาร */}

          <div
            className="
              absolute
              right-[5mm]
              top-0
              whitespace-nowrap
              text-[16px]
              leading-none
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
            "
          >
            พอ.101
          </div>

          {/* ใบเบิกพัสดุ */}

          <div
            className="
              mt-[0.5mm]
              text-center
              text-[21px]
              font-bold
              leading-none
            "
          >
            ใบเบิกพัสดุ
          </div>

          {/* หน่วยงาน */}

          <div
            className="
              absolute
              bottom-[2mm]
              left-[5mm]
              max-w-[145mm]
              whitespace-nowrap
              text-[16px]
              leading-none
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
              right-[5mm]
              whitespace-nowrap
              text-[16px]
              leading-none
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
            mb-[1.5mm]
            px-[5mm]
            text-[16px]
            leading-none
          "
        >
          ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ
          ดังมีรายการต่อไปนี้
        </div>

        {/* =====================================================
            ตารางรายการ

            กว้างเต็ม A4
            หัวตารางไม่ตกบรรทัด
            พื้นขาว
            ตัวอักษรดำ
            เส้นดำ
            ไม่มี rounded
        ===================================================== */}

        <div className="flex justify-center">
          <table
            className="
              w-[210mm]
              table-fixed
              border-collapse
              border
              border-black
              text-black
              leading-none
            "
            style={{
              borderRadius: 0,
              borderSpacing: 0,
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  height: "3.5mm",
                }}
              >
                {/* ลำดับ */}

                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-white
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "3.5mm",
                    minHeight: "3.5mm",
                    maxHeight: "3.5mm",
                    padding: 0,
                    borderRadius: 0,
                    fontSize: "12px",
                    lineHeight: "0.75",
                    whiteSpace: "nowrap",
                  }}
                >
                  ลำดับ
                </th>

                {/* หมวดหมู่ */}

                <th
                  className="
                    w-[18%]
                    border
                    border-black
                    bg-white
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "3.5mm",
                    minHeight: "3.5mm",
                    maxHeight: "3.5mm",
                    padding: 0,
                    borderRadius: 0,
                    fontSize: "12px",
                    lineHeight: "0.75",
                    whiteSpace: "nowrap",
                  }}
                >
                  หมวดหมู่
                </th>

                {/* รายการพัสดุ */}

                <th
                  className="
                    w-[38%]
                    border
                    border-black
                    bg-white
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "3.5mm",
                    minHeight: "3.5mm",
                    maxHeight: "3.5mm",
                    padding: 0,
                    borderRadius: 0,
                    fontSize: "12px",
                    lineHeight: "0.75",
                    whiteSpace: "nowrap",
                  }}
                >
                  รายการพัสดุ
                </th>

                {/* จำนวนที่ขอเบิก */}

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-white
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "3.5mm",
                    minHeight: "3.5mm",
                    maxHeight: "3.5mm",
                    padding: 0,
                    borderRadius: 0,
                    fontSize: "12px",
                    lineHeight: "0.75",
                    whiteSpace: "nowrap",
                  }}
                >
                  จำนวนที่ขอเบิก
                </th>

                {/* จำนวนที่เบิกจ่าย */}

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-white
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "3.5mm",
                    minHeight: "3.5mm",
                    maxHeight: "3.5mm",
                    padding: 0,
                    borderRadius: 0,
                    fontSize: "12px",
                    lineHeight: "0.75",
                    whiteSpace: "nowrap",
                  }}
                >
                  จำนวนที่เบิกจ่าย
                </th>

                {/* หมายเหตุ */}

                <th
                  className="
                    w-[9%]
                    border
                    border-black
                    bg-white
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "3.5mm",
                    minHeight: "3.5mm",
                    maxHeight: "3.5mm",
                    padding: 0,
                    borderRadius: 0,
                    fontSize: "12px",
                    lineHeight: "0.75",
                    whiteSpace: "nowrap",
                  }}
                >
                  หมายเหตุ
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={item?.id ?? `empty-${index}`}
                  style={{
                    height: "2.8mm",
                  }}
                >
                  {/* ลำดับ */}

                  <td
                    className="
                      border
                      border-black
                      px-0
                      py-0
                      text-center
                      align-middle
                    "
                    style={{
                      height: "2.8mm",
                      minHeight: "2.8mm",
                      maxHeight: "2.8mm",
                      padding: 0,
                      borderRadius: 0,
                      fontSize: "12px",
                      lineHeight: "0.7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {index + 1}
                  </td>

                  {/* หมวดหมู่ */}

                  <td
                    className="
                      border
                      border-black
                      px-0
                      py-0
                      align-middle
                    "
                    style={{
                      height: "2.8mm",
                      minHeight: "2.8mm",
                      maxHeight: "2.8mm",
                      padding: 0,
                      borderRadius: 0,
                      fontSize: "12px",
                      lineHeight: "0.7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {item
                      ? categoryLabels[
                          item.material.category
                        ] ?? item.material.category
                      : ""}
                  </td>

                  {/* รายการ */}

                  <td
                    className="
                      border
                      border-black
                      px-0
                      py-0
                      align-middle
                    "
                    style={{
                      height: "2.8mm",
                      minHeight: "2.8mm",
                      maxHeight: "2.8mm",
                      padding: 0,
                      borderRadius: 0,
                      fontSize: "12px",
                      lineHeight: "0.7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {item ? item.material.name : ""}
                  </td>

                  {/* จำนวนขอเบิก */}

                  <td
                    className="
                      border
                      border-black
                      px-0
                      py-0
                      text-center
                      align-middle
                    "
                    style={{
                      height: "2.8mm",
                      minHeight: "2.8mm",
                      maxHeight: "2.8mm",
                      padding: 0,
                      borderRadius: 0,
                      fontSize: "12px",
                      lineHeight: "0.7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {item?.qty ?? ""}
                  </td>

                  {/* จำนวนเบิกจ่าย */}

                  <td
                    className="
                      border
                      border-black
                      px-0
                      py-0
                      text-center
                      align-middle
                    "
                    style={{
                      height: "2.8mm",
                      minHeight: "2.8mm",
                      maxHeight: "2.8mm",
                      padding: 0,
                      borderRadius: 0,
                      fontSize: "12px",
                      lineHeight: "0.7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {item ? item.qty : ""}
                  </td>

                  {/* หมายเหตุ */}

                  <td
                    className="
                      border
                      border-black
                      px-0
                      py-0
                      align-middle
                    "
                    style={{
                      height: "2.8mm",
                      minHeight: "2.8mm",
                      maxHeight: "2.8mm",
                      padding: 0,
                      borderRadius: 0,
                      fontSize: "12px",
                      lineHeight: "0.7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {item?.remark ?? ""}
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
            mt-[1.5mm]
            flex
            justify-between
            px-[5mm]
            text-[16px]
            leading-none
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
            mt-[1.5mm]
            px-[5mm]
            text-[16px]
            leading-none
          "
        >
          วันที่ลงบัญชีหักพัสดุ
          {" "}
          ................................................................................
        </div>

        {/* =====================================================
            ลายเซ็นทั้ง 4 ตำแหน่ง

            จัดกึ่งกลางของแต่ละช่อง
            เส้นลายเซ็นยาวขึ้น
            วันที่ยาวขึ้น
        ===================================================== */}

        <div
          className="
            mt-[4mm]
            grid
            grid-cols-2
            gap-x-[20mm]
            px-[12mm]
            text-[16px]
            leading-[1]
          "
        >
          {/* =================================================
              ฝั่งซ้าย
          ================================================= */}

          <div className="text-center">
            {/* ผู้รับของ */}

            <div className="mb-[5mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ........................................................
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                ผู้รับของ
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>

            {/* ผู้จ่าย */}

            <div>
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ........................................................
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                ผู้จ่าย
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>
          </div>

          {/* =================================================
              ฝั่งขวา
          ================================================= */}

          <div className="text-center">
            {/* หัวหน้ากลุ่ม */}

            <div className="mb-[5mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ........................................................
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                หัวหน้ากลุ่ม
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>

            {/* ผู้อนุญาต */}

            <div>
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ........................................................
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                ผู้อนุญาต
              </div>

              <div className="mt-[0.5mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}