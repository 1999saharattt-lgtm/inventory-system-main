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
        });

      const imageData =
        canvas.toDataURL("image/png");

      const pdf =
        new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const imageWidth =
        pageWidth;

      const imageHeight =
        (canvas.height * imageWidth) /
        canvas.width;

      let heightLeft =
        imageHeight;

      let position = 0;

      pdf.addImage(
        imageData,
        "PNG",
        0,
        position,
        imageWidth,
        imageHeight
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position =
          heightLeft -
          imageHeight;

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          0,
          position,
          imageWidth,
          imageHeight
        );

        heightLeft -=
          pageHeight;
      }

      pdf.save(
        `ใบเบิกพัสดุ-${documentNo || issueId}.pdf`
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * พอ.101 มีพื้นที่สำหรับ 18 รายการ
   */
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
      ===================================================== */}

      <div
        ref={pdfRef}
        id="issue-pdf"
        className="
          mx-auto
          mt-6
          w-[210mm]
          min-h-[297mm]
          bg-white
          px-[15mm]
          py-[12mm]
          text-black
        "
      >
        {/* =====================================================
            ส่วนหัว
        ===================================================== */}

        <div className="relative">
          {/* เลขที่เอกสาร */}

          <div
            className="
              absolute
              right-0
              top-0
              text-[14px]
            "
          >
            เลขที่ {documentNo}
          </div>

          {/* พอ.101 */}

          <div
            className="
              pt-1
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
              mt-1
              text-center
              text-[20px]
              font-bold
            "
          >
            ใบเบิกพัสดุ
          </div>
        </div>

        {/* =====================================================
            ข้อมูลหน่วยงาน / วันที่
        ===================================================== */}

        <div
          className="
            mt-7
            space-y-2
            text-[15px]
          "
        >
          <div>
            กลุ่มงาน {departmentName}
            {" "}
            สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
          </div>

          <div>
            วันที่ {formatThaiDate(issueDate)}
          </div>

          <div className="mt-5">
            ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับ
            ใช้ในราชการดังมีรายการต่อไปนี้
          </div>
        </div>

        {/* =====================================================
            ตารางรายการ 18 รายการ
        ===================================================== */}

        <table
          className="
            mt-4
            w-full
            border-collapse
            border
            border-black
            text-[12px]
          "
        >
          <thead>
            <tr>
              {/* ลำดับ */}

              <th
                className="
                  w-[8%]
                  border
                  border-black
                  px-2
                  py-2
                  text-center
                  font-bold
                "
              >
                ลำดับ
              </th>

              {/* หมวดหมู่ */}

              <th
                className="
                  w-[19%]
                  border
                  border-black
                  px-2
                  py-2
                  text-center
                  font-bold
                "
              >
                หมวดหมู่
              </th>

              {/* รายการพัสดุ */}

              <th
                className="
                  w-[34%]
                  border
                  border-black
                  px-2
                  py-2
                  text-center
                  font-bold
                "
              >
                รายการพัสดุ
              </th>

              {/* จำนวนที่ขอเบิก */}

              <th
                className="
                  w-[13%]
                  border
                  border-black
                  px-2
                  py-2
                  text-center
                  font-bold
                "
              >
                จำนวนที่ขอเบิก
              </th>

              {/* จำนวนที่เบิกจ่าย */}

              <th
                className="
                  w-[13%]
                  border
                  border-black
                  px-2
                  py-2
                  text-center
                  font-bold
                "
              >
                จำนวนที่เบิกจ่าย
              </th>

              {/* หมายเหตุ */}

              <th
                className="
                  w-[13%]
                  border
                  border-black
                  px-2
                  py-2
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
                      px-2
                      py-1
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
                      px-2
                      py-1
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
                      px-2
                      py-1
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
                      px-2
                      py-1
                      text-center
                    "
                  >
                    {item?.qty ?? ""}
                  </td>

                  {/* จำนวนที่เบิกจ่าย */}

                  <td
                    className="
                      border
                      border-black
                      px-2
                      py-1
                      text-center
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
                      px-2
                      py-1
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
            หลังตาราง
        ===================================================== */}

        <div
          className="
            mt-4
            flex
            justify-between
            text-[14px]
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
            ลายเซ็น 2 ฝั่ง
        ===================================================== */}

        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-16
            text-[14px]
          "
        >
          {/* =================================================
              ฝั่งซ้าย
          ================================================= */}

          <div className="space-y-7">
            {/* ผู้รับของ */}

            <div>
              <div>
                ลงชื่อ
                {" "}
                ........................................
                {" "}
                ผู้รับของ
              </div>

              <div className="ml-10">
                (..............................................)
              </div>

              <div className="mt-2">
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

              <div className="ml-10">
                (..............................................)
              </div>

              <div className="mt-2">
                วันที่ ........................................
              </div>

              {/* วันที่ลงหักบัญชีพัสดุ
                  อยู่ล่างซ้าย ใต้วันที่ผู้จ่าย */}

              <div className="mt-6">
                วันที่ลงหักบัญชีพัสดุ
                {" "}
                ................................
              </div>
            </div>
          </div>

          {/* =================================================
              ฝั่งขวา
          ================================================= */}

          <div className="space-y-7">
            {/* หัวหน้ากลุ่ม */}

            <div>
              <div>
                ลงชื่อ
                {" "}
                ........................................
                {" "}
                หัวหน้ากลุ่ม
              </div>

              <div className="ml-10">
                (..............................................)
              </div>

              <div className="mt-2">
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

              <div className="ml-10">
                (..............................................)
              </div>

              <div className="mt-2">
                วันที่ ........................................
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}