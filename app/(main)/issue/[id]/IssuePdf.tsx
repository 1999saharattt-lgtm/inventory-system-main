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

      const element =
        pdfRef.current;

      const canvas =
        await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          width: element.offsetWidth,
          height: element.offsetHeight,
          scrollX: 0,
          scrollY: 0,
        });

      const imageData =
        canvas.toDataURL("image/png");

      // =================================================
      // A4 ขนาด 210 x 297 mm
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

      // เต็มหน้า A4 พอดี
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
      // บันทึก PDF
      // =================================================

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
    (_, index) =>
      items[index] ?? null
  );

  const totalItems =
    items.length;

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
        {loading
          ? "กำลังสร้าง PDF..."
          : "📄 Export PDF"}
      </button>

      {/* =====================================================
          พอ.101
          ขนาด A4 ตายตัว 210 x 297 mm
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
          px-[13mm]
          py-[9mm]
          text-black
        "
        style={{
          fontFamily:
            "TH Sarabun New, Sarabun, Arial, sans-serif",
        }}
      >
        {/* =====================================================
            ส่วนหัว
        ===================================================== */}

        <div
          className="
            relative
            h-[25mm]
          "
        >
          {/* เลขที่ */}

          <div
            className="
              absolute
              right-[1mm]
              top-0
              text-[14px]
            "
          >
            เลขที่ ........../..........
          </div>

          {/* พอ.101 */}

          <div
            className="
              pt-0
              text-center
              text-[18px]
              font-bold
            "
          >
            พอ.101
          </div>

          {/* ใบเบิกพัสดุ */}

          <div
            className="
              mt-[1mm]
              text-center
              text-[20px]
              font-bold
            "
          >
            ใบเบิกพัสดุ
          </div>

          {/* ข้อมูลหน่วยงาน */}

          <div
            className="
              absolute
              bottom-0
              left-0
              text-[14px]
            "
          >
            กลุ่มงาน {departmentName}
            {" "}
            สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
          </div>

          {/* วันที่ */}

          <div
            className="
              absolute
              bottom-0
              right-0
              text-[14px]
            "
          >
            วันที่{" "}
            {formatThaiDate(issueDate)}
          </div>
        </div>

        {/* =====================================================
            ข้อความนำหน้าตาราง
        ===================================================== */}

        <div
          className="
            mb-[2mm]
            text-[14px]
            leading-none
          "
        >
          ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ
          ดังมีรายการต่อไปนี้
        </div>

        {/* =====================================================
            ตารางรายการ
        ===================================================== */}

        <table
          className="
            w-full
            table-fixed
            border-collapse
            border
            border-black
            text-[12px]
            leading-none
          "
        >
          <thead>
            <tr>
              {/* ลำดับ */}

              <th
                className="
                  w-[7%]
                  border
                  border-black
                  px-[1mm]
                  py-[1.5mm]
                  text-center
                  font-bold
                "
              >
                ลำดับ
              </th>

              {/* หมวดหมู่ */}

              <th
                className="
                  w-[18%]
                  border
                  border-black
                  px-[1mm]
                  py-[1.5mm]
                  text-center
                  font-bold
                "
              >
                หมวดหมู่
              </th>

              {/* รายการ */}

              <th
                className="
                  w-[38%]
                  border
                  border-black
                  px-[1mm]
                  py-[1.5mm]
                  text-center
                  font-bold
                "
              >
                รายการพัสดุ
              </th>

              {/* จำนวนขอเบิก */}

              <th
                className="
                  w-[13%]
                  border
                  border-black
                  px-[1mm]
                  py-[1.5mm]
                  text-center
                  font-bold
                "
              >
                จำนวนที่ขอเบิก
              </th>

              {/* จำนวนเบิกจ่าย */}

              <th
                className="
                  w-[13%]
                  border
                  border-black
                  px-[1mm]
                  py-[1.5mm]
                  text-center
                  font-bold
                "
              >
                จำนวนที่เบิกจ่าย
              </th>

              {/* หมายเหตุ */}

              <th
                className="
                  w-[11%]
                  border
                  border-black
                  px-[1mm]
                  py-[1.5mm]
                  text-center
                  font-bold
                "
              >
                หมายเหตุ
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
                  className="h-[9mm]"
                >
                  {/* ลำดับ */}

                  <td
                    className="
                      border
                      border-black
                      px-[1mm]
                      py-[1mm]
                      text-center
                    "
                  >
                    {index + 1}
                  </td>

                  {/* หมวดหมู่ */}

                  <td
                    className="
                      border
                      border-black
                      px-[1mm]
                      py-[1mm]
                      align-middle
                    "
                  >
                    {item
                      ? categoryLabels[
                          item.material.category
                        ] ??
                        item.material.category
                      : ""}
                  </td>

                  {/* รายการพัสดุ */}

                  <td
                    className="
                      border
                      border-black
                      px-[1mm]
                      py-[1mm]
                      align-middle
                    "
                  >
                    {item
                      ? item.material.name
                      : ""}
                  </td>

                  {/* จำนวนที่ขอเบิก */}

                  <td
                    className="
                      border
                      border-black
                      px-[1mm]
                      py-[1mm]
                      text-center
                      align-middle
                    "
                  >
                    {item?.qty ?? ""}
                  </td>

                  {/* จำนวนที่เบิกจ่าย */}

                  <td
                    className="
                      border
                      border-black
                      px-[1mm]
                      py-[1mm]
                      text-center
                      align-middle
                    "
                  >
                    {item
                      ? item.qty
                      : ""}
                  </td>

                  {/* หมายเหตุ */}

                  <td
                    className="
                      border
                      border-black
                      px-[1mm]
                      py-[1mm]
                      align-middle
                    "
                  >
                    {item?.remark ?? ""}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {/* =====================================================
            ข้อความหลังตาราง
        ===================================================== */}

        <div
          className="
            mt-[3mm]
            flex
            items-center
            justify-between
            text-[13px]
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

        {/* =====================================================
            ส่วนลายเซ็น
        ===================================================== */}

        <div
          className="
            mt-[7mm]
            grid
            grid-cols-2
            gap-x-[16mm]
            text-[13px]
            leading-tight
          "
        >
          {/* =================================================
              ฝั่งซ้าย
          ================================================= */}

          <div>
            {/* ผู้รับของ */}

            <div className="mb-[7mm]">
              <div>
                ลงชื่อ
                {" "}
                ........................................
                {" "}
                ผู้รับของ
              </div>

              <div className="ml-[10mm] mt-[1mm]">
                (..............................................)
              </div>

              <div className="mt-[1mm]">
                วันที่ ........................................
              </div>
            </div>

            {/* ผู้จ่าย */}

            <div>
              <div>
                ลงชื่อ
                {" "}
                ........................................
                {" "}
                ผู้จ่าย
              </div>

              <div className="ml-[10mm] mt-[1mm]">
                (..............................................)
              </div>

              <div className="mt-[1mm]">
                วันที่ ........................................
              </div>

              {/* วันที่ลงหักบัญชี */}

              <div className="mt-[7mm]">
                วันที่ลงหักบัญชีพัสดุ
                {" "}
                ...............................
              </div>
            </div>
          </div>

          {/* =================================================
              ฝั่งขวา
          ================================================= */}

          <div>
            {/* หัวหน้ากลุ่ม */}

            <div className="mb-[7mm]">
              <div>
                ลงชื่อ
                {" "}
                ........................................
                {" "}
                หัวหน้ากลุ่ม
              </div>

              <div className="ml-[10mm] mt-[1mm]">
                (..............................................)
              </div>

              <div className="mt-[1mm]">
                วันที่ ........................................
              </div>
            </div>

            {/* ผู้อนุญาต */}

            <div>
              <div>
                ลงชื่อ
                {" "}
                ........................................
                {" "}
                ผู้อนุญาต
              </div>

              <div className="ml-[10mm] mt-[1mm]">
                (..............................................)
              </div>

              <div className="mt-[1mm]">
                วันที่ ........................................
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            พื้นที่ด้านล่างสำหรับแบบฟอร์ม
        ===================================================== */}

        <div
          className="
            mt-[6mm]
            text-[12px]
          "
        >
          ลงวันที่ในบัญชีพัสดุแล้ว
          {" "}
          ..............................................................
        </div>
      </div>
    </div>
  );
}