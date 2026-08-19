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

      /*
       * ใส่ภาพเต็มหน้า A4
       *
       * เนื้อหาภายในตัว element มี
       * ขอบบน/ล่าง 5mm
       * ขอบซ้าย/ขวา 3mm
       */
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

          ขอบบน    5mm = 0.5cm
          ขอบล่าง  5mm = 0.5cm
          ขอบซ้าย  3mm = 0.3cm
          ขอบขวา   3mm = 0.3cm

          เพื่อป้องกันการตกขอบเวลาพิมพ์จริง
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
          px-[3mm]
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
              max-w-[145mm]
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

            เว้นระยะจากหัวตารางให้ชัดเจน
        ===================================================== */}

        <div
          className="
            mb-[3mm]
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
            ขอบซ้าย/ขวา 3mm
            พื้นที่ตาราง = 204mm

            หัวตาราง = 4mm
            แถวข้อมูล = 3.5mm

            พื้นขาว
            ตัวอักษรดำ
            เส้นดำ
            ไม่มี rounded
        ===================================================== */}

        <div className="flex justify-center">
          <table
            className="
              w-[204mm]
              table-fixed
              border-collapse
              border
              border-black
              bg-white
              text-black
            "
            style={{
              width: "204mm",
              tableLayout: "fixed",
              borderSpacing: 0,
              borderRadius: 0,
              fontSize: "12px",
              color: "#000000",
              backgroundColor: "#ffffff",
            }}
          >
            <thead>
              <tr
                style={{
                  height: "4mm",
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
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "4mm",
                    minHeight: "4mm",
                    maxHeight: "4mm",
                    padding: 0,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "12px",
                    lineHeight: "0.8",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                  }}
                >
                  ลำดับ
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
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "4mm",
                    minHeight: "4mm",
                    maxHeight: "4mm",
                    padding: 0,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "12px",
                    lineHeight: "0.8",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                  }}
                >
                  หมวดหมู่
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
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "4mm",
                    minHeight: "4mm",
                    maxHeight: "4mm",
                    padding: 0,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "12px",
                    lineHeight: "0.8",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                  }}
                >
                  รายการพัสดุ
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
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "4mm",
                    minHeight: "4mm",
                    maxHeight: "4mm",
                    padding: 0,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "12px",
                    lineHeight: "0.8",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                  }}
                >
                  จำนวนที่ขอเบิก
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
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "4mm",
                    minHeight: "4mm",
                    maxHeight: "4mm",
                    padding: 0,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "12px",
                    lineHeight: "0.8",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                  }}
                >
                  จำนวนที่เบิกจ่าย
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
                    px-0
                    py-0
                    text-center
                    align-middle
                    font-bold
                    text-black
                  "
                  style={{
                    height: "4mm",
                    minHeight: "4mm",
                    maxHeight: "4mm",
                    padding: 0,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "12px",
                    lineHeight: "0.8",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
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
                    height: "3.5mm",
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
                      px-0
                      py-0
                      text-center
                      align-middle
                      text-black
                    "
                    style={{
                      height: "3.5mm",
                      minHeight: "3.5mm",
                      maxHeight: "3.5mm",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "0.8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      verticalAlign: "middle",
                    }}
                  >
                    {index + 1}
                  </td>

                  {/* =================================================
                      หมวดหมู่
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      px-0
                      py-0
                      align-middle
                      text-black
                    "
                    style={{
                      height: "3.5mm",
                      minHeight: "3.5mm",
                      maxHeight: "3.5mm",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "0.8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "clip",
                      verticalAlign: "middle",
                    }}
                  >
                    {item
                      ? categoryLabels[
                          item.material.category
                        ] ?? item.material.category
                      : ""}
                  </td>

                  {/* =================================================
                      รายการพัสดุ
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      px-0
                      py-0
                      align-middle
                      text-black
                    "
                    style={{
                      height: "3.5mm",
                      minHeight: "3.5mm",
                      maxHeight: "3.5mm",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "0.8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "clip",
                      verticalAlign: "middle",
                    }}
                  >
                    {item ? item.material.name : ""}
                  </td>

                  {/* =================================================
                      จำนวนขอเบิก
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      px-0
                      py-0
                      text-center
                      align-middle
                      text-black
                    "
                    style={{
                      height: "3.5mm",
                      minHeight: "3.5mm",
                      maxHeight: "3.5mm",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "0.8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      verticalAlign: "middle",
                    }}
                  >
                    {item?.qty ?? ""}
                  </td>

                  {/* =================================================
                      จำนวนเบิกจ่าย
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      px-0
                      py-0
                      text-center
                      align-middle
                      text-black
                    "
                    style={{
                      height: "3.5mm",
                      minHeight: "3.5mm",
                      maxHeight: "3.5mm",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "0.8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      verticalAlign: "middle",
                    }}
                  >
                    {item ? item.qty : ""}
                  </td>

                  {/* =================================================
                      หมายเหตุ
                  ================================================= */}

                  <td
                    className="
                      border
                      border-black
                      bg-white
                      px-0
                      py-0
                      align-middle
                      text-black
                    "
                    style={{
                      height: "3.5mm",
                      minHeight: "3.5mm",
                      maxHeight: "3.5mm",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "0.8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "clip",
                      verticalAlign: "middle",
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
            mt-[2mm]
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
            mt-[2mm]
            px-[2mm]
            text-[16px]
            leading-none
            text-black
          "
        >
          วันที่ลงบัญชีหักพัสดุ
          {" "}
          ................................................................................
        </div>

        {/* =====================================================
            ลายเซ็น 4 ตำแหน่ง

            รูปแบบราชการ:

            ลงชื่อ ................................................ ผู้รับของ

            (....................................................)

            วันที่ ................................................
        ===================================================== */}

        <div
          className="
            mt-[5mm]
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

            <div className="mb-[5mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                .....................................................
                {" "}
                ผู้รับของ
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>

            {/* ผู้จ่าย */}

            <div>
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                .....................................................
                {" "}
                ผู้จ่าย
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
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
                .....................................................
                {" "}
                หัวหน้ากลุ่ม
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>

            {/* ผู้อนุญาต */}

            <div>
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                .....................................................
                {" "}
                ผู้อนุญาต
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                (....................................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................................
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}