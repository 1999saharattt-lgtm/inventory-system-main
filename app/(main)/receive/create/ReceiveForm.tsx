"use client";

import { useState } from "react";
import { createReceive } from "./actions";

import AppButton from "@/components/AppButton";

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

/* =========================================================
   CATEGORY
========================================================= */

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

/* =========================================================
   THAI SHORT DATE
   ตัวอย่าง 22 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  const buddhistYear = String(
    year + 543
  ).slice(-2);

  return `${String(day).padStart(
    2,
    "0"
  )} ${
    thaiShortMonths[month - 1]
  } ${buddhistYear}`;
}

/* =========================================================
   TODAY INPUT VALUE
========================================================= */

function getTodayInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),

    String(
      today.getMonth() + 1
    ).padStart(2, "0"),

    String(
      today.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

/* =========================================================
   RECEIVE FORM
========================================================= */

export default function ReceiveForm({
  vendors,
  materials,
  documentNo,
}: Props) {
  /* =======================================================
     EMPTY ROW
  ======================================================= */

  const emptyRow =
    (): ReceiveRow => ({
      category: "",
      materialId: "",
      qty: "",
      unitPrice: "",
      manufacture: "",
      expiry: "",
    });

  /* =======================================================
     STATE
  ======================================================= */

  const [items, setItems] =
    useState<ReceiveRow[]>(
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
  ] = useState(
    getTodayInputValue()
  );

  /* =======================================================
     UPDATE ROW
  ======================================================= */

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
      copy[index].materialId =
        "";
    }

    setItems(copy);
  }

  /* =======================================================
     SHARED CLASSES
  ======================================================= */

  const labelClass = `
    mb-2
    block
    text-sm
    font-extrabold
    !text-slate-800
    sm:text-base
  `;

  const inputClass = `
    min-h-[52px]
    w-full
    rounded-[16px]
    border-2
    !border-black
    bg-white
    px-4
    py-3
    text-base
    font-bold
    !text-slate-900
    shadow-sm
    outline-none
    transition-all
    duration-200
    placeholder:!text-slate-400
    hover:!border-black
    hover:bg-slate-50
    focus:!border-black
    focus:bg-white
    focus:ring-4
    focus:ring-slate-900/10
  `;

  const tableControlClass = `
    h-10
    rounded-[12px]
    border-2
    !border-black
    bg-white
    px-3
    font-bold
    !text-slate-900
    shadow-sm
    outline-none
    transition-all
    duration-200
    hover:!border-black
    focus:!border-black
    focus:ring-4
    focus:ring-slate-900/10
  `;

  /* =========================================================
     UI
  ========================================================= */

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
          border-slate-300
          bg-white/85
          p-4
          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]
          backdrop-blur-xl
          sm:p-5
        "
      >
        {/* ===================================================
            SECTION HEADER
        =================================================== */}

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
              bg-slate-900
              text-xl
              shadow-[0_12px_28px_-16px_rgba(15,23,42,0.6)]
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
              ระบุวันที่ เอกสาร
              และผู้จำหน่าย
            </p>
          </div>
        </div>

        {/* ===================================================
            FORM GRID
        =================================================== */}

        <div
          className="
            grid
            min-w-0
            gap-5
            md:grid-cols-2
          "
        >
          {/* =================================================
              วันที่รับเข้า
          ================================================= */}

          <div className="min-w-0">
            <label
              className={
                labelClass
              }
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
                  min-h-[52px]
                  w-full
                  items-center
                  justify-between
                  rounded-[16px]
                  border-2
                  !border-black
                  bg-white
                  px-4
                  py-3
                  text-base
                  font-bold
                  !text-slate-900
                  shadow-sm
                  transition-all
                  duration-200
                  hover:bg-slate-50
                "
              >
                <span>
                  {receiveDate
                    ? formatThaiShortDate(
                        receiveDate
                      )
                    : "เลือกวันที่"}
                </span>

                <span
                  aria-hidden="true"
                  className="
                    text-lg
                  "
                >
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              เลขที่เอกสาร
          ================================================= */}

          <div className="min-w-0">
            <label
              className={
                labelClass
              }
            >
              เลขที่เอกสาร
            </label>

            <input
              type="text"
              name="documentNo"
              value={
                documentValue
              }
              readOnly={
                !isOpeningBalance
              }
              onChange={(e) =>
                setDocumentValue(
                  e.target.value
                )
              }
              className={
                inputClass
              }
            />

            {/* ===============================================
                ยอดยกเข้าระบบ
            =============================================== */}

            <label
              className="
                mt-3
                inline-flex
                cursor-pointer
                items-center
                gap-2.5
                rounded-[14px]
                border
                border-slate-300
                bg-white
                px-3
                py-2
                text-sm
                font-bold
                !text-slate-700
                shadow-sm
                transition-colors
                hover:bg-slate-50
              "
            >
              <input
                type="checkbox"
                checked={
                  isOpeningBalance
                }
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
                  accent-slate-900
                "
              />

              <span>
                ยอดยกเข้าระบบ
              </span>
            </label>
          </div>

          {/* =================================================
              ผู้จำหน่าย
          ================================================= */}

          <div
            className="
              min-w-0
              md:col-span-2
            "
          >
            <label
              className={
                labelClass
              }
            >
              ผู้จำหน่าย
            </label>

            <select
              name="vendorId"
              required
              defaultValue=""
              className={
                inputClass
              }
            >
              <option value="">
                -- เลือกผู้จำหน่าย --
              </option>

              {vendors.map(
                (vendor) => (
                  <option
                    key={
                      vendor.id
                    }
                    value={
                      vendor.id
                    }
                  >
                    {vendor.name}
                  </option>
                )
              )}
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
          border-slate-300
          bg-white/85
          shadow-[0_16px_40px_-26px_rgba(15,23,42,0.35)]
          backdrop-blur-xl
        "
      >
        {/* ===================================================
            TABLE TITLE
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2
            border-b
            border-slate-300
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
              ระบุรายการ ราคา
              จำนวน และข้อมูลวันผลิต/หมดอายุ
            </p>
          </div>

          <span
            className="
              inline-flex
              w-fit
              items-center
              rounded-full
              border
              border-slate-300
              bg-slate-100/80
              px-3
              py-1.5
              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            15 รายการ
          </span>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

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
              border
              border-black
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
                      border-black
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
                      className={`
                        transition-colors
                        duration-200

                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ลำดับ
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* =======================================
                          หมวดหมู่
                      ======================================= */}

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
                          onChange={(
                            e
                          ) =>
                            updateRow(
                              index,
                              "category",
                              e.target
                                .value
                            )
                          }
                          className={`
                            ${tableControlClass}
                            min-w-[170px]
                          `}
                        >
                          <option value="">
                            เลือกหมวดหมู่
                          </option>

                          {categories.map(
                            (
                              category
                            ) => (
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

                      {/* =======================================
                          รายการพัสดุ
                      ======================================= */}

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
                          onChange={(
                            e
                          ) =>
                            updateRow(
                              index,
                              "materialId",
                              e.target
                                .value
                            )
                          }
                          className={`
                            ${tableControlClass}
                            min-w-[260px]
                          `}
                        >
                          <option value="">
                            เลือกรายการพัสดุ
                          </option>

                          {list.map(
                            (
                              material
                            ) => (
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

                      {/* =======================================
                          หน่วย
                      ======================================= */}

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
                            min-w-[90px]
                            rounded-[12px]
                            border-2
                            !border-black
                            bg-slate-100
                            px-2
                            text-center
                            font-extrabold
                            !text-slate-700
                            outline-none
                          "
                        />
                      </td>

                      {/* =======================================
                          ราคา
                      ======================================= */}

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
                          onChange={(
                            e
                          ) =>
                            updateRow(
                              index,
                              "unitPrice",
                              e.target
                                .value
                            )
                          }
                          className={`
                            ${tableControlClass}
                            w-28
                            text-center
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* =======================================
                          จำนวน
                      ======================================= */}

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
                          name={`items[${index}].qty`}
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(
                            e
                          ) =>
                            updateRow(
                              index,
                              "qty",
                              e.target
                                .value
                            )
                          }
                          className={`
                            ${tableControlClass}
                            w-24
                            text-center
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* =======================================
                          วันผลิต
                      ======================================= */}

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
                            onChange={(
                              e
                            ) =>
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
                              border-2
                              !border-black
                              bg-white
                              px-3
                              font-bold
                              !text-slate-900
                              shadow-sm
                              transition-colors
                              hover:bg-slate-50
                            "
                          >
                            <span
                              className="
                                whitespace-nowrap
                                text-sm
                              "
                            >
                              {row.manufacture
                                ? formatThaiShortDate(
                                    row.manufacture
                                  )
                                : "เลือกวันที่"}
                            </span>

                            <span
                              aria-hidden="true"
                            >
                              📅
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* =======================================
                          วันหมดอายุ
                      ======================================= */}

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
                            onChange={(
                              e
                            ) =>
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
                              border-2
                              !border-black
                              bg-white
                              px-3
                              font-bold
                              !text-slate-900
                              shadow-sm
                              transition-colors
                              hover:bg-slate-50
                            "
                          >
                            <span
                              className="
                                whitespace-nowrap
                                text-sm
                              "
                            >
                              {row.expiry
                                ? formatThaiShortDate(
                                    row.expiry
                                  )
                                : "เลือกวันที่"}
                            </span>

                            <span
                              aria-hidden="true"
                            >
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
          border-slate-300
          bg-white/85
          p-4
          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]
          backdrop-blur-xl
          sm:p-5
        "
      >
        <label
          className={
            labelClass
          }
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
            border-2
            !border-black
            bg-white
            p-4
            text-base
            font-bold
            !text-slate-900
            shadow-sm
            outline-none
            transition-all
            duration-200
            placeholder:!text-slate-400
            hover:!border-black
            hover:bg-slate-50
            focus:!border-black
            focus:bg-white
            focus:ring-4
            focus:ring-slate-900/10
          "
        />
      </section>

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div
        className="
          flex
          justify-end
          border-t
          border-slate-300
          pt-6
        "
      >
        <AppButton
          type="submit"
          variant="success"
          size="md"
          icon={
            <span>💾</span>
          }
        >
          บันทึก
        </AppButton>
      </div>
    </form>
  );
}