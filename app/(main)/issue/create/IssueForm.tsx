"use client";

import { useState } from "react";
import { createIssue } from "./action";

type Department = {
  id: number;
  name: string;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  section: {
    departmentId: number;
  } | null;
};

type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  latestPrice: number;
};

type Props = {
  departments: Department[];
  officers: Officer[];
  materials: Material[];
};

type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
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
];

export default function IssueForm({
  departments,
  officers,
  materials,
}: Props) {
  const emptyRow = (): IssueRow => ({
    category: "",
    materialId: "",
    qty: "",
  });

  const [items, setItems] = useState<IssueRow[]>(
    Array.from(
      {
        length: 15,
      },
      emptyRow
    )
  );

  const [departmentId, setDepartmentId] = useState("");

  const [pdfFile, setPdfFile] =
    useState<File | null>(null);

  function updateRow(
    index: number,
    key: keyof IssueRow,
    value: string
  ) {
    const copy = [...items];

    copy[index][key] = value;

    if (key === "category") {
      copy[index].materialId = "";
    }

    setItems(copy);
  }

  const filteredOfficers = officers.filter(
  (officer) =>
    officer.section?.departmentId === Number(departmentId)
);

  return (
    <div className="rounded-xl bg-white p-6 shadow">
  <form
    action={createIssue}
    encType="multipart/form-data"
    className="space-y-6"
  >
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block font-medium text-gray-900">
          วันที่เบิกจ่าย
        </label>

        <input
          type="date"
          name="issueDate"
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
          หน่วยงาน
        </label>

        <select
          name="departmentId"
          required
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full rounded-lg border p-2 text-gray-900"
        >
          <option value="">
            -- เลือกหน่วยงาน --
          </option>

          {departments.map((department) => (
            <option
              key={department.id}
              value={department.id}
            >
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium text-gray-900">
          ผู้ขอเบิก
        </label>

        <select
          name="officerId"
          required
          disabled={!departmentId}
          className="w-full rounded-lg border p-2 text-gray-900 disabled:bg-gray-100"
        >
          <option value="">
            {departmentId
              ? "-- เลือกผู้ขอเบิก --"
              : "-- กรุณาเลือกหน่วยงานก่อน --"}
          </option>

          {filteredOfficers.map((officer) => (
            <option
              key={officer.id}
              value={officer.id}
            >
              {officer.firstName} {officer.lastName}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="overflow-x-auto">
  <table className="w-full border border-gray-300 text-sm">
    <thead className="bg-gray-100 text-black">
      <tr>
        <th className="w-12 border p-2 text-center">
          ลำดับ
        </th>

        <th className="w-40 border p-2 text-center">
          หมวดหมู่
        </th>

        <th className="w-72 border p-2 text-center">
          รายการพัสดุ
        </th>

        <th className="w-24 border p-2 text-center">
          หน่วย
        </th>

        <th className="w-28 border p-2 text-center">
          จำนวน
        </th>

        <th className="w-36 border p-2 text-center">
          ราคาล่าสุด
        </th>
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
                className="w-full rounded border p-2 text-gray-900"
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

            <td className="border p-2">
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
                className="w-full rounded border p-2 text-gray-900"
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
                readOnly
                value={selectedMaterial?.unit ?? ""}
                className="w-full rounded border bg-gray-100 p-2 text-center text-gray-900"
              />
            </td>

            <td className="border p-2">
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
                className="w-full rounded border p-2 text-center text-gray-900"
              />
            </td>

            <td className="border p-2">
              <input
                type="text"
                name={`items[${index}].price`}
                readOnly
                value={
                  selectedMaterial
                    ? Number(
                        selectedMaterial.latestPrice
                      ).toFixed(2)
                    : ""
                }
                className="w-full rounded border bg-gray-100 p-2 text-right text-gray-900"
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
    เอกสารแนบใบเบิก (PDF)
  </label>

  <input
    type="file"
    name="pdf"
    accept="application/pdf"
    onChange={(e) => {
      const file =
        e.target.files?.[0] ?? null;

      setPdfFile(file);
    }}
    className="w-full rounded-lg border p-2 text-gray-900"
  />

  {pdfFile && (
    <div className="mt-3 flex items-center gap-3">
      <span className="text-gray-700">
        {pdfFile.name}
      </span>

      <button
        type="button"
        onClick={() => {
          setPdfFile(null);

          const input =
            document.querySelector(
              'input[name="pdf"]'
            ) as HTMLInputElement;

          if (input) {
            input.value = "";
          }
        }}
        className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
      >
        ลบไฟล์
      </button>
    </div>
  )}
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
