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

  const [items, setItems] = useState<ReceiveRow[]>(
    Array.from(
      {
        length: 15,
      },
      emptyRow
    )
  );

  const [isOpeningBalance, setIsOpeningBalance] =
    useState(false);

  const [documentValue, setDocumentValue] =
    useState(documentNo);

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
    <div
      className="
        w-full
        min-w-0
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-3
        shadow-xl
        sm:p-6
      "
    >
      <form
        action={createReceive}
        className="space-y-5 sm:space-y-6"
      >
        {/* ข้อมูลรับเข้า */}

        <div
          className="
            grid
            min-w-0
            gap-4
            md:grid-cols-2
            sm:gap-5
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
                text-slate-900
                sm:text-lg
              "
            >
              วันที่รับเข้า
            </label>

            <input
              type="date"
              name="receiveDate"
              defaultValue={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              required
              className="
                w-full
                min-w-0
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-100
              "
            />
          </div>

          {/* เลขที่เอกสาร */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-slate-900
                sm:text-lg
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
                setDocumentValue(e.target.value)
              }
              className="
                w-full
                min-w-0
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-base
                font-extrabold
                text-cyan-700
                outline-none
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-100
                sm:text-lg
              "
            />

            <label
              className="
                mt-2
                flex
                w-fit
                cursor-pointer
                items-center
                gap-2
                whitespace-nowrap
                text-sm
                font-semibold
                text-slate-900
              "
            >
              <input
                type="checkbox"
                checked={isOpeningBalance}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setIsOpeningBalance(checked);

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
                "
              />

              ยอดยกเข้าระบบ
            </label>
          </div>

          {/* ผู้จำหน่าย */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-slate-900
                sm:text-lg
              "
            >
              ผู้จำหน่าย
            </label>

            <select
              name="vendorId"
              required
              className="
                w-full
                min-w-0
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-100
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

        {/* ตารางรายการรับเข้า */}

        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            rounded-2xl
            border
            border-slate-900
            bg-white
            shadow-xl
          "
        >
          <table
            className="
              w-full
              min-w-[1050px]
              border-collapse
              border
              border-black
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
              {items.map((row, index) => {
                const list = materials.filter(
                  (m) =>
                    m.category === row.category
                );

                const selected = materials.find(
                  (m) =>
                    String(m.id) ===
                    row.materialId
                );

                return (
                  <tr
                    key={index}
                    className="
                      border-b
                      border-black
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        font-bold
                        text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

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
                        value={row.category}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "category",
                            e.target.value
                          )
                        }
                        className="
                          min-w-[170px]
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-semibold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                        "
                      >
                        <option value="">
                          เลือกหมวดหมู่
                        </option>

                        {categories.map((c) => (
                          <option
                            key={c.value}
                            value={c.value}
                          >
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>

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
                        value={row.materialId}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "materialId",
                            e.target.value
                          )
                        }
                        className="
                          min-w-[260px]
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-semibold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                        "
                      >
                        <option value="">
                          เลือกรายการพัสดุ
                        </option>

                        {list.map((m) => (
                          <option
                            key={m.id}
                            value={m.id}
                          >
                            {m.code}
                            {" - "}
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </td>

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
                          selected?.unit ?? "-"
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-slate-100
                          p-2
                          text-center
                          font-bold
                          text-slate-900
                        "
                      />
                    </td>

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
                          w-28
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          text-center
                          font-bold
                          text-slate-900
                        "
                      />
                    </td>

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
                            e.target.value
                          )
                        }
                        className="
                          w-24
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          text-center
                          font-bold
                          text-slate-900
                        "
                      />
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-3
                      "
                    >
                      <input
                        type="date"
                        name={`items[${index}].manufacture`}
                        value={row.manufacture}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "manufacture",
                            e.target.value
                          )
                        }
                        className="
                          w-36
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-bold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                        "
                      />
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-3
                      "
                    >
                      <input
                        type="date"
                        name={`items[${index}].expiry`}
                        value={row.expiry}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "expiry",
                            e.target.value
                          )
                        }
                        className="
                          w-36
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-bold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                        "
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* หมายเหตุ */}

        <div>
          <label
            className="
              mb-2
              block
              text-base
              font-extrabold
              text-slate-900
              sm:text-lg
            "
          >
            หมายเหตุ
          </label>

          <textarea
            name="remark"
            className="
              min-h-[120px]
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              p-3
              font-semibold
              text-slate-900
              outline-none
              focus:border-cyan-500
              focus:ring-4
              focus:ring-cyan-100
            "
          />
        </div>

        {/* ปุ่มบันทึก */}

        <div className="flex justify-end">
          <button
            type="submit"
            className="
              w-full
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
              sm:w-auto
            "
          >
            💾 บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}