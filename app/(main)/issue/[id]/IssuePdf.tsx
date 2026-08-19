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
          A4 210 x 297 mm

          ปรับพื้นที่ใช้งานให้สมดุล
          - ซ้าย/ขวา 18mm
          - บน 8mm
          - ล่าง 7mm
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
          px-[18mm]
          py-[8mm]
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

        <div className="relative h-[27mm]">
          {/* เลขที่เอกสาร - ดึงจาก documentNo อัตโนมัติ */}

          <div
            className="
              absolute
              right-0
              top-0
              text-[16px]
              whitespace-nowrap
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
            "
          >
            ใบเบิกพัสดุ
          </div>

          {/* หน่วยงาน */}

          <div
            className="
              absolute
              bottom-[3mm]
              left-0
              max-w-[125mm]
              whitespace-nowrap
              text-[16px]
            "
          >
            กลุ่มงาน {departmentName} สำนักอนามัยการเจริญพันธุ์
            กรมอนามัย
          </div>

          {/* วันที่ */}

          <div
            className="
              absolute
              bottom-[3mm]
              right-0
              whitespace-nowrap
              text-[16px]
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
            mb-[2mm]
            text-[16px]
            leading-[1.05]
          "
        >
          ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ
          ดังมีรายการต่อไปนี้
        </div>

        {/* =====================================================
            ตารางรายการ
            - ลดความกว้าง
            - ไม่มีสีหัวตาราง
            - 18 แถว
            - ความสูงแต่ละแถวลดลง
        ===================================================== */}

        <div className="flex justify-center">
          <table
            className="
              w-[174mm]
              table-fixed
              border-collapse
              border
              border-black
              text-[16px]
              leading-[0.95]
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    w-[9%]
                    border
                    border-black
                    bg-white
                    px-[0.8mm]
                    py-[0.5mm]
                    text-center
                    font-bold
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    w-[18%]
                    border
                    border-black
                    bg-white
                    px-[0.8mm]
                    py-[0.5mm]
                    text-center
                    font-bold
                  "
                >
                  หมวดหมู่
                </th>

                <th
                  className="
                    w-[35%]
                    border
                    border-black
                    bg-white
                    px-[0.8mm]
                    py-[0.5mm]
                    text-center
                    font-bold
                  "
                >
                  รายการพัสดุ
                </th>

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-white
                    px-[0.8mm]
                    py-[0.5mm]
                    text-center
                    font-bold
                  "
                >
                  จำนวนที่ขอเบิก
                </th>

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-white
                    px-[0.8mm]
                    py-[0.5mm]
                    text-center
                    font-bold
                  "
                >
                  จำนวนที่เบิกจ่าย
                </th>

                <th
                  className="
                    w-[10%]
                    border
                    border-black
                    bg-white
                    px-[0.8mm]
                    py-[0.5mm]
                    text-center
                    font-bold
                  "
                >
                  หมายเหตุ
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={item?.id ?? `empty-${index}`}
                  className="h-[5mm]"
                >
                  {/* ลำดับ */}

                  <td
                    className="
                      border
                      border-black
                      px-[0.8mm]
                      py-[0.5mm]
                      text-center
                      align-middle
                    "
                  >
                    {index + 1}
                  </td>

                  {/* หมวดหมู่ */}

                  <td
                    className="
                      border
                      border-black
                      px-[0.8mm]
                      py-[0.5mm]
                      align-middle
                    "
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
                      px-[0.8mm]
                      py-[0.5mm]
                      align-middle
                    "
                  >
                    {item ? item.material.name : ""}
                  </td>

                  {/* จำนวนขอเบิก */}

                  <td
                    className="
                      border
                      border-black
                      px-[0.8mm]
                      py-[0.5mm]
                      text-center
                      align-middle
                    "
                  >
                    {item?.qty ?? ""}
                  </td>

                  {/* จำนวนเบิกจ่าย */}

                  <td
                    className="
                      border
                      border-black
                      px-[0.8mm]
                      py-[0.5mm]
                      text-center
                      align-middle
                    "
                  >
                    {item ? item.qty : ""}
                  </td>

                  {/* หมายเหตุ */}

                  <td
                    className="
                      border
                      border-black
                      px-[0.8mm]
                      py-[0.5mm]
                      align-middle
                    "
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
            mt-[2mm]
            text-[16px]
            leading-none
          "
        >
          วันที่ลงบัญชีหักพัสดุ
          {" "}
          ..............................................................
        </div>

        {/* =====================================================
            ลายเซ็นทั้ง 4 ตำแหน่ง
            จัดให้อยู่ภายในพื้นที่ A4 หน้าเดียว
        ===================================================== */}

        <div
          className="
            mt-[5mm]
            grid
            grid-cols-2
            gap-x-[12mm]
            text-[16px]
            leading-[1.05]
          "
        >
          {/* =================================================
              ฝั่งซ้าย
          ================================================= */}

          <div>
            {/* ผู้รับของ */}

            <div className="mb-[6mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ....................................
                {" "}
                ผู้รับของ
              </div>

              <div className="ml-[9mm] mt-[0.8mm] whitespace-nowrap">
                (........................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................
              </div>
            </div>

            {/* ผู้จ่าย */}

            <div>
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ....................................
                {" "}
                ผู้จ่าย
              </div>

              <div className="ml-[9mm] mt-[0.8mm] whitespace-nowrap">
                (........................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................
              </div>
            </div>
          </div>

          {/* =================================================
              ฝั่งขวา
          ================================================= */}

          <div>
            {/* หัวหน้ากลุ่ม */}

            <div className="mb-[6mm]">
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ....................................
                {" "}
                หัวหน้ากลุ่ม
              </div>

              <div className="ml-[9mm] mt-[0.8mm] whitespace-nowrap">
                (........................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................
              </div>
            </div>

            {/* ผู้อนุญาต */}

            <div>
              <div className="whitespace-nowrap">
                ลงชื่อ
                {" "}
                ....................................
                {" "}
                ผู้อนุญาต
              </div>

              <div className="ml-[9mm] mt-[0.8mm] whitespace-nowrap">
                (........................................)
              </div>

              <div className="mt-[0.8mm] whitespace-nowrap">
                วันที่ ................................
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}