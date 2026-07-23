"use client";

import { useMemo, useState } from "react";
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
    Array.from({ length: 15 }, emptyRow)
  );

  const updateRow = (
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) => {
    const copy = [...items];
    copy[index][key] = value;

    if (key === "category") {
      copy[index].materialId = "";
    }

    setItems(copy);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <form action={createReceive} className="space-y-6">
                <div>
          <label className="mb-2 block font-medium text-gray-900">
            วันที่รับเข้า
          </label>

          <input
            type="date"
            name="receiveDate"
            required
            className="w-full rounded-lg border p-2 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium text-gray-900">
            เลขที่เอกสาร
          </label>

          <input
            type="text"
            name="documentNo"
            required
            className="w-full rounded-lg border p-2 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium text-gray-900">
            ผู้จำหน่าย
          </label>

          <select
            name="vendorId"
            required
            className="w-full rounded-lg border p-2 text-gray-900"
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

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="border p-2 w-12 text-black font-semibold">ลำดับ</th>
                <th className="border p-2 text-black font-semibold">หมวดหมู่</th>
                <th className="border p-2 text-black font-semibold">รายการพัสดุ</th>
                <th className="border p-2 w-24 text-black font-semibold">หน่วย</th>
                <th className="border p-2 w-28 text-black font-semibold">จำนวน</th>
                <th className="border p-2 w-36 text-black font-semibold">ราคาล่าสุด</th>
                <th className="border p-2 w-40 text-black font-semibold">วันผลิต</th>
                <th className="border p-2 w-40 text-black font-semibold">วันหมดอายุ</th>
              </tr>
            </thead>

            <tbody className="text-black">
              {items.map((row, index) => {
                const filteredMaterials = materials.filter(
                  (m) => m.category === row.category
                );

                const selectedMaterial = materials.find(
                  (m) => m.id === Number(row.materialId)
                );

                return (
                  <tr key={index}>
                    <td className="border p-2 text-center">
                      {index + 1}
                    </td>

                    <td className="border p-2">
                      <select
                        value={row.category}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "category",
                            e.target.value
                          )
                        }
                        className="w-full rounded border p-2"
                      >
                        <option value="">
                          เลือกหมวด
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
                                        <td className="border p-2">
                      <select
                        value={row.materialId}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "materialId",
                            e.target.value
                          )
                        }
                        className="w-full rounded border p-2"
                      >
                        <option value="">
                          เลือกพัสดุ
                        </option>

                        {filteredMaterials.map((material) => (
                          <option
                            key={material.id}
                            value={material.id}
                          >
                            {material.code} - {material.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border p-2">
                      <input
                        type="text"
                        value={selectedMaterial?.unit ?? ""}
                        readOnly
                        className="w-full rounded border bg-gray-100 p-2"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "qty",
                            e.target.value
                          )
                        }
                        className="w-full rounded border p-2"
                        min={1}
                      />

                      <input
                        type="hidden"
                        name={`items[${index}].qty`}
                        value={row.qty}
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateRow(
                            index,
                            "unitPrice",
                            e.target.value
                          )
                        }
                        className="w-full rounded border p-2"
                        step="0.01"
                      />

                      <input
                        type="hidden"
                        name={`items[${index}].unitPrice`}
                        value={row.unitPrice}
                      />
                    </td>

                    <td className="border p-2">
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
                        className="w-full rounded border p-2"
                      />

                      <input
                        type="hidden"
                        name={`items[${index}].manufacture`}
                        value={row.manufacture}
                      />
                    </td>

                    <td className="border p-2">
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
                        className="w-full rounded border p-2"
                      />

                      <input
                        type="hidden"
                        name={`items[${index}].expiry`}
                        value={row.expiry}
                      />

                      <input
                        type="hidden"
                        name={`items[${index}].materialId`}
                        value={row.materialId}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <label className="mb-2 block font-medium text-gray-900">
            หมายเหตุ
          </label>

          <textarea
            name="remark"
            rows={4}
            className="w-full rounded-lg border p-2 text-gray-900"
          />
        </div>
                <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-green-700 px-6 py-2 text-white hover:bg-green-800"
          >
            บันทึกข้อมูล
          </button>
        </div>
      </form>
    </div>
  );
}