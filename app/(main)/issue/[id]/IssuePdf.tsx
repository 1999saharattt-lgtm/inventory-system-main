"use client";

import React from "react";

type IssueItem = {
  id: number;
  qty: number;

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
  documentNo: string;
  issueDate: Date | string;
  departmentName: string;
  items: IssueItem[];
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
  documentNo,
  issueDate,
  departmentName,
  items,
}: IssuePdfProps) {
  const rows = Array.from(
    { length: 18 },
    (_, index) => items[index] ?? null
  );

  const totalItems = items.length;

  return (
    <div
      id="issue-pdf"
      className="
        mx-auto
        w-[210mm]
        min-h-[297mm]
        bg-white
        px-[15mm]
        py-[12mm]
        text-black
      "
    >
      {/* =====================================================
          ส่วนหัวเอกสาร
      ===================================================== */}

      <div className="relative">
        {/* เลขที่เอกสาร มุมขวาบน */}

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
          กลุ่มงาน {departmentName} สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
        </div>

        <div>
          วันที่ {formatThaiDate(issueDate)}
        </div>

        <div className="mt-5">
          ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับ ใช้ในราชการดังมีรายการต่อไป
        </div>
      </div>

      {/* =====================================================
          ตารางรายการ
      ===================================================== */}

      <table
        className="
          mt-4
          w-full
          border-collapse
          border
          border-black
          text-[13px]
        "
      >
        <thead>
          <tr>
            <th
              className="
                w-[10%]
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

            <th
              className="
                w-[52%]
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

            <th
              className="
                w-[12%]
                border
                border-black
                px-2
                py-2
                text-center
                font-bold
              "
            >
              จำนวนที่เบิก
            </th>

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
              จำนวนที่จ่าย
            </th>

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
          {rows.map((item, index) => (
            <tr
              key={item?.id ?? `empty-${index}`}
              className="h-[9mm]"
            >
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

              <td
                className="
                  border
                  border-black
                  px-2
                  py-1
                "
              >
                {item ? (
                  <div>
                    {item.material.name}
                  </div>
                ) : null}
              </td>

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

              <td
                className="
                  border
                  border-black
                  px-2
                  py-1
                  text-center
                "
              >
                {item ? item.qty : ""}
              </td>

              <td
                className="
                  border
                  border-black
                  px-2
                  py-1
                "
              />
            </tr>
          ))}
        </tbody>
      </table>

      {/* =====================================================
          ส่วนหลังตาราง
      ===================================================== */}

      <div
        className="
          mt-4
          flex
          justify-between
          text-[14px]
        "
      >
        {/* ฝั่งซ้าย */}

        <div>
          ได้รับของจากงานพัสดุเรียบร้อยแล้ว
        </div>

        {/* ฝั่งขวา */}

        <div>
          รวมทั้งสิ้น {totalItems} รายการ
        </div>
      </div>

      {/* =====================================================
          วันที่ลงหักบัญชี
      ===================================================== */}

      <div
        className="
          mt-5
          flex
          justify-end
          text-[14px]
        "
      >
        วันที่ลงหักบัญชีพัสดุ
        {" "}
        .............................................................
      </div>

      {/* =====================================================
          ลายเซ็น
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
            <div className="font-bold">
              ผู้รับของ
            </div>

            <div className="mt-3">
              ลงชื่อ ........................................
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
            <div className="font-bold">
              ผู้จ่าย
            </div>

            <div className="mt-3">
              ลงชื่อ ........................................
            </div>

            <div className="ml-10">
              (..............................................)
            </div>

            <div className="mt-2">
              วันที่ ........................................
            </div>
          </div>
        </div>

        {/* =================================================
            ฝั่งขวา
        ================================================= */}

        <div className="space-y-7">
          {/* หัวหน้ากลุ่ม */}

          <div>
            <div className="font-bold">
              หัวหน้ากลุ่ม
            </div>

            <div className="mt-3">
              ลงชื่อ ........................................
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
            <div className="font-bold">
              ผู้อนุญาต
            </div>

            <div className="mt-3">
              ลงชื่อ ........................................
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
  );
}