"use client";

import { useState } from "react";
import { createReceive } from "./actions";

type Vendor = {
  id: number;
  name: string;
};

type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
};

type ReceiveRow = {
  category: string;
  materialId: string;
  qty: string;
  unitPrice: string;
  manufacture: string;
  expiry: string;
};

type Props = {
  vendors: Vendor[];
  materials: Material[];
  documentNo: string;
};

const categories = [
  {
    value: "OFFICE",
    label: "วัสดุสำนักงาน",
  },
  {
    value: "COMPUTER",
    label: "วัสดุคอมพิวเตอร์",
  },
  {
    value: "ELECTRIC",
    label: "วัสดุไฟฟ้าและวิทยุ",
  },
  {
    value: "HOUSEHOLD",
    label: "วัสดุงานบ้านและงานครัว",
  },
  {
    value: "VEHICLE",
    label: "วัสดุยานพาหนะ",
  },
  {
    value: "PRINTING",
    label: "วัสดุสื่อสิ่งพิมพ์",
  },
];

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiDate(dateString: string) {
  if (!dateString) return "";

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return "";
  }

  return `${day} ${
    thaiMonths[month - 1]
  } ${year + 543}`;
}

function getTodayInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(today.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");
}

export default function ReceiveForm({
  vendors,
  materials,
  documentNo,
}: Props) {
  const emptyRow = (): ReceiveRow => ({
    category: "",
    materialId: "",
    qty: "",
    unitPrice: "",
    manufacture: "",
    expiry: "",
  });

  const [items, setItems] = useState<
    ReceiveRow[]
  >(
    Array.from(
      {
        length: 15,
      },
      emptyRow
    )
  );

  const [
    isOpeningBalance,
    setIsOpeningBalance,
  ] = useState(false);

  const [
    documentValue,
    setDocumentValue,
  ] = useState(documentNo);

  const [
    receiveDate,
    setReceiveDate,
  ] = useState(getTodayInputValue());

  function updateRow(
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) {
    const copy = [...items];

    copy[index] = {
      ...copy[index],
      [key]: value,
    };

    if (key === "category") {
      copy[index].materialId = "";
    }

    setItems(copy);
  }

  return (
    <form
      action={createReceive}
      className="
        w-full
        min-w-0
        space-y-6
      "
    >
      {/* =====================================================
          ข้อมูลการรับเข้า
      ===================================================== */}

      <section
        className="
          rounded-[24px]
          border
          border-slate-200/80
          bg-white/75
          p-4
          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]
          backdrop-blur-xl
          sm:p-5
        "
      >
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-[15px]
              bg-blue-50
              text-xl
              shadow-sm
              ring-1
              ring-blue-100
            "
          >
            🧾
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                !text-slate-900
                sm:text-xl
              "
            >
              ข้อมูลการรับเข้า
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุวันที่ เอกสาร และผู้จำหน่าย
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-5
            md:grid-cols-2
          "
        >
          {/* วันที่รับเข้า */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              วันที่รับเข้า
            </label>

            <div className="relative">
              <input
                type="date"
                name="receiveDate"
                value={receiveDate}
                onChange={(e) =>
                  setReceiveDate(
                    e.target.value
                  )
                }
                required
                className="
                  absolute
                  inset-0
                  z-10
                  h-full
                  w-full
                  cursor-pointer
                  opacity-0
                "
              />

              <div
                className="
                  flex
                  h-12
                  w-full
                  items-center
                  justify-between
                  rounded-[15px]
                  border
                  border-slate-200
                  bg-white/90
                  px-4
                  font-bold
                  !text-slate-800
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-blue-300
                  hover:shadow-md
                "
              >
                <span>
                  {receiveDate
                    ? formatThaiDate(
                        receiveDate
                      )
                    : "เลือกวันที่"}
                </span>

                <span className="text-lg">
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* เลขที่เอกสาร */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              เลขที่เอกสาร
            </label>

            <input
              type="text"
              name="documentNo"
              value={documentValue}
              readOnly={!isOpeningBalance}
              onChange={(e) =>
                setDocumentValue(
                  e.target.value
                )
              }
              className="
                h-12
                w-full
                min-w-0
                rounded-[15px]
                border
                border-slate-200
                bg-white/90
                px-4
                text-base
                font-extrabold
                !text-blue-700
                shadow-sm
                outline-none
                transition-all
                duration-200
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-500/10
              "
            />

            <label
              className="
                mt-3
                inline-flex
                cursor-pointer
                items-center
                gap-2.5
                rounded-full
                border
                border-slate-200
                bg-white/70
                px-3
                py-1.5
                text-sm
                font-bold
                !text-slate-600
                shadow-sm
                transition
                hover:bg-white
              "
            >
              <input
                type="checkbox"
                checked={isOpeningBalance}
                onChange={(e) => {
                  const checked =
                    e.target.checked;

                  setIsOpeningBalance(
                    checked
                  );

                  setDocumentValue(
                    checked
                      ? "ยอดยกเข้าระบบ"
                      : documentNo
                  );
                }}
                className="
                  h-4
                  w-4
                  cursor-pointer
                  accent-blue-600
                "
              />

              <span>ยอดยกเข้าระบบ</span>
            </label>
          </div>

          {/* ผู้จำหน่าย */}

          <div className="min-w-0 md:col-span-2">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              ผู้จำหน่าย
            </label>

            <select
              name="vendorId"
              required
              className="
                h-12
                w-full
                min-w-0
                rounded-[15px]
                border
                border-slate-200
                bg-white/90
                px-4
                font-bold
                !text-slate-800
                shadow-sm
                outline-none
                transition-all
                duration-200
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-500/10
              "
            >
              <option value="">
                -- เลือกผู้จำหน่าย --
              </option>

              {vendors.map((vendor) => (
                <option
                  key={vendor.id}
                  value={vendor.id}
                >
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          ตารางรายการรับเข้า
      ===================================================== */}

      <section
        className="
          overflow-hidden
          rounded-[24px]
          border
          border-slate-200/80
          bg-white/80
          shadow-[0_16px_40px_-26px_rgba(15,23,42,0.35)]
          backdrop-blur-xl
        "
      >
        {/* Table Title */}

        <div
          className="
            flex
            flex-col
            gap-2
            border-b
            border-slate-200
            bg-white/80
            px-4
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-5
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-black
                !text-slate-900
                sm:text-xl
              "
            >
              รายการพัสดุรับเข้า
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุรายการ ราคา จำนวน
              และข้อมูลวันผลิต/หมดอายุ
            </p>
          </div>

          <span
            className="
              inline-flex
              w-fit
              items-center
              rounded-full
              border
              border-slate-200
              bg-slate-50
              px-3
              py-1.5
              text-xs
              font-extrabold
              !text-slate-500
            "
          >
            15 รายการ
          </span>
        </div>

        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1050px]
              border-collapse
              bg-white
              text-sm
            "
          >
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "หน่วย",
                  "ราคา",
                  "จำนวน",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      !text-white
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map(
                (row, index) => {
                  const list =
                    materials.filter(
                      (material) =>
                        material.category ===
                        row.category
                    );

                  const selected =
                    materials.find(
                      (material) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  return (
                    <tr
                      key={index}
                      className="
                        transition-colors
                        duration-200
                        hover:bg-blue-50/60
                      "
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                          !text-slate-800
                        "
                      >
                        {index + 1}
                      </td>

                      {/* หมวดหมู่ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <select
                          name={`items[${index}].category`}
                          value={
                            row.category
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "category",
                              e.target
                                .value
                            )
                          }
                          className="
                            h-10
                            min-w-[170px]
                            rounded-[12px]
                            border
                            border-slate-200
                            bg-white
                            px-3
                            font-bold
                            !text-slate-800
                            shadow-sm
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-4
                            focus:ring-blue-500/10
                          "
                        >
                          <option value="">
                            เลือกหมวดหมู่
                          </option>

                          {categories.map(
                            (category) => (
                              <option
                                key={
                                  category.value
                                }
                                value={
                                  category.value
                                }
                              >
                                {
                                  category.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <select
                          name={`items[${index}].materialId`}
                          value={
                            row.materialId
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "materialId",
                              e.target
                                .value
                            )
                          }
                          className="
                            h-10
                            min-w-[260px]
                            rounded-[12px]
                            border
                            border-slate-200
                            bg-white
                            px-3
                            font-bold
                            !text-slate-800
                            shadow-sm
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-4
                            focus:ring-blue-500/10
                          "
                        >
                          <option value="">
                            เลือกรายการพัสดุ
                          </option>

                          {list.map(
                            (material) => (
                              <option
                                key={
                                  material.id
                                }
                                value={
                                  material.id
                                }
                              >
                                {
                                  material.code
                                }{" "}
                                -{" "}
                                {
                                  material.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* หน่วย */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        <input
                          type="text"
                          readOnly
                          value={
                            selected?.unit ??
                            "-"
                          }
                          className="
                            h-10
                            w-full
                            rounded-[12px]
                            border
                            border-slate-200
                            bg-slate-100
                            px-2
                            text-center
                            font-extrabold
                            !text-slate-700
                            shadow-none
                          "
                        />
                      </td>

                      {/* ราคา */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`items[${index}].unitPrice`}
                          value={
                            row.unitPrice
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "unitPrice",
                              e.target
                                .value
                            )
                          }
                          className="
                            h-10
                            w-28
                            rounded-[12px]
                            border
                            border-slate-200
                            bg-white
                            px-2
                            text-center
                            font-bold
                            !text-slate-800
                            shadow-sm
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-4
                            focus:ring-blue-500/10
                          "
                        />
                      </td>

                      {/* จำนวน */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          name={`items[${index}].qty`}
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "qty",
                              e.target
                                .value
                            )
                          }
                          className="
                            h-10
                            w-24
                            rounded-[12px]
                            border
                            border-slate-200
                            bg-white
                            px-2
                            text-center
                            font-bold
                            !text-slate-800
                            shadow-sm
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-4
                            focus:ring-blue-500/10
                          "
                        />
                      </td>

                      {/* วันผลิต */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <div className="relative">
                          <input
                            type="date"
                            name={`items[${index}].manufacture`}
                            value={
                              row.manufacture
                            }
                            onChange={(e) =>
                              updateRow(
                                index,
                                "manufacture",
                                e.target
                                  .value
                              )
                            }
                            className="
                              absolute
                              inset-0
                              z-10
                              h-full
                              w-full
                              cursor-pointer
                              opacity-0
                            "
                          />

                          <div
                            className="
                              flex
                              h-10
                              w-40
                              items-center
                              justify-between
                              rounded-[12px]
                              border
                              border-slate-200
                              bg-white
                              px-3
                              font-bold
                              !text-slate-800
                              shadow-sm
                              transition
                              hover:border-blue-300
                            "
                          >
                            <span className="whitespace-nowrap text-sm">
                              {row.manufacture
                                ? formatThaiDate(
                                    row.manufacture
                                  )
                                : "เลือกวันที่"}
                            </span>

                            <span>
                              📅
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* วันหมดอายุ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <div className="relative">
                          <input
                            type="date"
                            name={`items[${index}].expiry`}
                            value={
                              row.expiry
                            }
                            onChange={(e) =>
                              updateRow(
                                index,
                                "expiry",
                                e.target
                                  .value
                              )
                            }
                            className="
                              absolute
                              inset-0
                              z-10
                              h-full
                              w-full
                              cursor-pointer
                              opacity-0
                            "
                          />

                          <div
                            className="
                              flex
                              h-10
                              w-40
                              items-center
                              justify-between
                              rounded-[12px]
                              border
                              border-slate-200
                              bg-white
                              px-3
                              font-bold
                              !text-slate-800
                              shadow-sm
                              transition
                              hover:border-blue-300
                            "
                          >
                            <span className="whitespace-nowrap text-sm">
                              {row.expiry
                                ? formatThaiDate(
                                    row.expiry
                                  )
                                : "เลือกวันที่"}
                            </span>

                            <span>
                              📅
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          หมายเหตุ
      ===================================================== */}

      <section
        className="
          rounded-[24px]
          border
          border-slate-200/80
          bg-white/75
          p-4
          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]
          backdrop-blur-xl
          sm:p-5
        "
      >
        <label
          className="
            mb-2
            block
            text-base
            font-extrabold
            !text-slate-800
          "
        >
          หมายเหตุ
        </label>

        <textarea
          name="remark"
          placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
          className="
            min-h-[120px]
            w-full
            resize-y
            rounded-[16px]
            border
            border-slate-200
            bg-white/90
            p-4
            font-bold
            !text-slate-800
            shadow-sm
            outline-none
            transition-all
            duration-200
            placeholder:!text-slate-400
            focus:border-blue-400
            focus:ring-4
            focus:ring-blue-500/10
          "
        />
      </section>

      {/* =====================================================
          Action
      ===================================================== */}

      <div
        className="
          flex
          justify-end
          border-t
          border-slate-200/80
          pt-5
        "
      >
        <button
          type="submit"
          className="
            group
            inline-flex
            h-11
            w-full
            items-center
            justify-center
            gap-2
            rounded-[16px]
            border
            border-slate-900
            bg-slate-900
            px-6
            text-sm
            font-extrabold
            !text-white
            shadow-[0_12px_28px_-16px_rgba(15,23,42,0.55)]
            transition-all
            duration-300
            ease-out
            hover:-translate-y-0.5
            hover:bg-slate-800
            hover:shadow-[0_18px_34px_-18px_rgba(15,23,42,0.6)]
            active:translate-y-0
            active:scale-[0.97]
            focus:outline-none
            focus:ring-4
            focus:ring-slate-400/20
            sm:w-auto
            sm:min-w-[150px]
          "
        >
          <span
            className="
              transition-transform
              duration-300
              group-hover:scale-105
            "
          >
            💾
          </span>

          <span>บันทึก</span>
        </button>
      </div>
    </form>
  );
}