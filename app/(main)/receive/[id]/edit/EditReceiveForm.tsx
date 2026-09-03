"use client";

import { useState } from "react";
import { updateReceive } from "./actions";

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

type Props = {
  receive: any;
  vendors: Vendor[];
  materials: Material[];
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

type ReceiveRow = {
  category: string;
  materialId: string;
  qty: string;
  unitPrice: string;
  manufacture: string;
  expiry: string;
};

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

  if (!year || !month || !day) return "";

  return `${day} ${thaiMonths[month - 1]} ${
    year + 543
  }`;
}

function toDateInputValue(value: Date | string | null) {
  if (!value) return "";

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function EditReceiveForm({
  receive,
  vendors,
  materials,
}: Props) {
  const [receiveDate, setReceiveDate] = useState(
    toDateInputValue(receive.receiveDate)
  );

  const [items, setItems] = useState<ReceiveRow[]>(() => {
    const rows = receive.items.map((item: any) => ({
      category: item.material.category,

      materialId: String(item.materialId),

      qty: String(item.qty),

      unitPrice: Number(item.unitPrice).toFixed(2),

      manufacture: item.manufacture
        ? toDateInputValue(item.manufacture)
        : "",

      expiry: item.expiry
        ? toDateInputValue(item.expiry)
        : "",
    }));

    while (rows.length < 15) {
      rows.push({
        category: "",
        materialId: "",
        qty: "",
        unitPrice: "",
        manufacture: "",
        expiry: "",
      });
    }

    return rows;
  });

  function updateRow(
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) {
    const copy = [...items];

    copy[index][key] = value;

    if (key === "category") {
      copy[index].materialId = "";
    }

    setItems(copy);
  }

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-700
        bg-white
        p-6
        shadow-xl
      "
    >
      <form
        action={updateReceive}
        className="space-y-6"
      >
        <input
          type="hidden"
          name="receiveId"
          value={receive.id}
        />

        {/* =====================================================
            ข้อมูลเอกสาร
        ===================================================== */}

        <div
          className="
            grid
            gap-5
            md:grid-cols-3
          "
        >
          {/* วันที่รับเข้า */}

          <div>
            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-900
              "
            >
              วันที่รับเข้า
            </label>

            <div className="relative">
              <input
                type="hidden"
                name="receiveDate"
                value={receiveDate}
              />

              <input
                type="date"
                value={receiveDate}
                onChange={(e) =>
                  setReceiveDate(e.target.value)
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
                  min-h-[50px]
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  p-3
                  font-bold
                  text-black
                "
              >
                <span>
                  {receiveDate
                    ? formatThaiDate(receiveDate)
                    : "เลือกวันที่รับเข้า"}
                </span>

                <span className="text-xl">
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* เลขที่เอกสาร */}

          <div>
            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-900
              "
            >
              เลขที่เอกสาร
            </label>

            <input
              type="text"
              name="documentNo"
              defaultValue={receive.documentNo}
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-bold
                text-black
              "
            />
          </div>

          {/* ผู้จำหน่าย */}

          <div>
            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-900
              "
            >
              ผู้จำหน่าย
            </label>

            <select
              name="vendorId"
              defaultValue={receive.vendorId}
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-bold
                text-black
              "
            >
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

        {/* =====================================================
            ตารางรายการ
        ===================================================== */}

        <div
          className="
            w-full
            overflow-x-auto
            rounded-xl
          "
        >
          <table
            className="
              w-full
              min-w-[1100px]
              border-collapse
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
                  "จำนวน",
                  "ราคาต่อหน่วย",
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
              {items.map((row, index) => {
                const filteredMaterials =
                  materials.filter(
                    (material) =>
                      material.category ===
                      row.category
                  );

                const selectedMaterial =
                  materials.find(
                    (material) =>
                      material.id ===
                      Number(row.materialId)
                  );

                return (
                  <tr
                    key={index}
                    className="
                      text-slate-900
                      hover:bg-emerald-50
                    "
                  >
                    {/* ลำดับ */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

                    {/* หมวดหมู่ */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <select
                        value={row.category}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "category",
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-bold
                          text-black
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
                              {category.label}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    {/* รายการพัสดุ */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <select
                        name={`items[${index}].materialId`}
                        value={row.materialId}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "materialId",
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-bold
                          text-black
                        "
                      >
                        <option value="">
                          เลือกรายการพัสดุ
                        </option>

                        {filteredMaterials.map(
                          (material) => (
                            <option
                              key={material.id}
                              value={material.id}
                            >
                              {material.code}
                              {" - "}
                              {material.name}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    {/* หน่วย */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <input
                        type="text"
                        readOnly
                        value={
                          selectedMaterial?.unit ??
                          ""
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          text-center
                          font-bold
                          text-black
                        "
                      />
                    </td>

                    {/* จำนวน */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <input
                        type="number"
                        name={`items[${index}].qty`}
                        value={row.qty}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "qty",
                            e.target.value
                          )
                        }
                        min={1}
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          text-center
                          font-bold
                          text-black
                        "
                      />
                    </td>

                    {/* ราคาต่อหน่วย */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <input
                        type="number"
                        name={`items[${index}].unitPrice`}
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "unitPrice",
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          text-center
                          font-bold
                          text-black
                        "
                      />
                    </td>

                    {/* วันผลิต */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <div className="relative">
                        <input
                          type="hidden"
                          name={`items[${index}].manufacture`}
                          value={row.manufacture}
                        />

                        <input
                          type="date"
                          value={row.manufacture}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "manufacture",
                              e.target.value
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
                            min-h-[42px]
                            w-full
                            items-center
                            justify-between
                            gap-2
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-center
                            font-bold
                            text-black
                          "
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {row.manufacture
                              ? formatThaiDate(
                                  row.manufacture
                                )
                              : "เลือกวันผลิต"}
                          </span>

                          <span className="shrink-0">
                            📅
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* วันหมดอายุ */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      <div className="relative">
                        <input
                          type="hidden"
                          name={`items[${index}].expiry`}
                          value={row.expiry}
                        />

                        <input
                          type="date"
                          value={row.expiry}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "expiry",
                              e.target.value
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
                            min-h-[42px]
                            w-full
                            items-center
                            justify-between
                            gap-2
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-center
                            font-bold
                            text-black
                          "
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {row.expiry
                              ? formatThaiDate(
                                  row.expiry
                                )
                              : "เลือกวันหมดอายุ"}
                          </span>

                          <span className="shrink-0">
                            📅
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            หมายเหตุ
        ===================================================== */}

        <div>
          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-slate-900
            "
          >
            หมายเหตุ
          </label>

          <textarea
            name="remark"
            rows={4}
            defaultValue={receive.remark ?? ""}
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              p-3
              font-bold
              text-black
            "
          />
        </div>

        {/* =====================================================
            ปุ่มบันทึก
        ===================================================== */}

        <div
          className="
            flex
            justify-end
          "
        >
          <button
            type="submit"
            className="
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              via-green-500
              to-emerald-500
              px-8
              py-3
              text-lg
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
            "
          >
            💾 บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </div>
  );
}