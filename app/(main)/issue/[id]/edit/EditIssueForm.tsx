"use client";

import { useState } from "react";
import { updateIssue } from "./action";

type Department = {
  id: number;
  name: string;
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
  issue: any;
  departments: Department[];
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
];

type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
};

export default function EditIssueForm({
  issue,
  departments,
  materials,
}: Props) {
  const [items, setItems] = useState<IssueRow[]>(() => {
    const rows = issue.items.map((item: any) => ({
      category: item.material.category,
      materialId: String(item.materialId),
      qty: String(item.qty),
    }));

    while (rows.length < 15) {
      rows.push({
        category: "",
        materialId: "",
        qty: "",
      });
    }

    return rows;
  });

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

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-700
        bg-gradient-to-br
        from-slate-950
        to-slate-800
        p-6
        shadow-xl
      "
    >
      <form
        action={updateIssue}
        className="space-y-6"
      >
        <input
          type="hidden"
          name="issueId"
          value={issue.id}
        />

        {/* ข้อมูลเอกสาร */}

        <div
          className="
            grid
            gap-5
            md:grid-cols-3
          "
        >
          <div>
            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
              "
            >
              วันที่เบิกจ่าย
            </label>

            <input
              type="date"
              name="issueDate"
              defaultValue={
                issue.issueDate
                  .toISOString()
                  .split("T")[0]
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-black
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
              "
            >
              เลขที่ใบเบิก
            </label>

            <input
              type="text"
              name="documentNo"
              defaultValue={issue.documentNo}
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-black
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
              "
            >
              หน่วยงาน
            </label>

            <select
              name="departmentId"
              defaultValue={issue.departmentId}
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-black
              "
            >
              {departments.map((department: any) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ตารางรายการ */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-xl
          "
        >
          <div className="overflow-x-auto">

            <table className="w-full text-sm">
                          <thead>

                <tr
                  className="
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                  "
                >

                  <th
                    className="
                      border
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    ลำดับ
                  </th>

                  <th
                    className="
                      border
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    หมวด
                  </th>

                  <th
                    className="
                      border
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    ชื่อพัสดุ
                  </th>

                  <th
                    className="
                      border
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    หน่วย
                  </th>

                  <th
                    className="
                      border
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    จำนวน
                  </th>

                  <th
                    className="
                      border
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    ราคาต่อหน่วย
                  </th>

                </tr>

              </thead>

              <tbody>

                {items.map((row: any, index: number) => {

                  const filteredMaterials =
                    materials.filter(
                      (m) =>
                        m.category === row.category
                    );

                  const selectedMaterial =
                    materials.find(
                      (m) =>
                        m.id === Number(row.materialId)
                    );

                  return (

                    <tr
                      key={index}
                      className="
                        border-b
                        border-slate-200
                        text-slate-900
                        hover:bg-emerald-50
                      "
                    >

                      <td className="border px-3 py-3 text-center font-bold">
                        {index + 1}
                      </td>

                      <td className="border px-3 py-3">

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
                            text-black
                          "
                        >

                          <option value="">
                            เลือกหมวด
                          </option>

                          {categories.map((c: any) => (

                            <option
                              key={c.value}
                              value={c.value}
                            >
                              {c.label}
                            </option>

                          ))}

                        </select>

                      </td>

                      <td className="border px-3 py-3">

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
                            text-black
                          "
                        >

                          <option value="">
                            เลือกพัสดุ
                          </option>

                          {filteredMaterials.map((material: any) => (

                            <option
                              key={material.id}
                              value={material.id}
                            >
                              {material.code} - {material.name}
                            </option>

                          ))}

                        </select>

                      </td>

                      <td className="border px-3 py-3">

                        <input
                          type="text"
                          value={selectedMaterial?.unit ?? ""}
                          readOnly
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-100
                            p-2
                            text-center
                            text-black
                          "
                        />

                      </td>
                                            <td className="border px-3 py-3">

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
                            text-black
                          "
                        />

                      </td>

                      <td className="border px-3 py-3">

                        <input
                          type="text"
                          value={
                            selectedMaterial
                              ? Number(
                                  selectedMaterial.latestPrice
                                ).toFixed(2)
                              : ""
                          }
                          readOnly
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-100
                            p-2
                            text-right
                            text-black
                          "
                        />

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        </div>

        {/* หมายเหตุ */}

        <div>

          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            "
          >
            หมายเหตุ
          </label>

          <textarea
            name="remark"
            rows={4}
            defaultValue={issue.remark ?? ""}
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              p-3
              text-black
            "
          />

        </div>

        {/* ปุ่มบันทึก */}

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