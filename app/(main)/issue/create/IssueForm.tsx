"use client";

import { useState } from "react";
import { createIssue } from "./action";

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  latestPrice: number;
};

type ReceiveLot = {
  id: number;
  materialId: number;
  balance: number;
  manufacture: Date | string | null;
  expiry: Date | string | null;
};

type Department = {
  id: number;
  name: string;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number | null;

  department?: {
    id: number;
  } | null;

  section?: {
    departmentId: number | null;
  } | null;
};

type Props = {
  materials: Material[];
  receiveLots: ReceiveLot[];
  departments: Department[];
  officers: Officer[];
  documentNo: string;
};

type ItemRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
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

function getCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function IssueForm({
  materials,
  receiveLots,
  departments,
  officers,
  documentNo,
}: Props) {
  // =====================================================
  // กลุ่มงาน
  //
  // ถ้ามี department เดียว
  // ให้เลือกให้อัตโนมัติ
  //
  // สำหรับผู้ใช้งานทั่วไป departments จะถูกกรอง
  // มาจากหน้า Server ให้เหลือเฉพาะกลุ่มของตัวเอง
  // =====================================================

  const initialDepartmentId =
    departments.length === 1
      ? String(departments[0].id)
      : "";

  const [departmentId, setDepartmentId] =
    useState(initialDepartmentId);

  const [officerId, setOfficerId] =
    useState("");

  const [editDocumentNo, setEditDocumentNo] =
    useState(false);

  const [documentValue, setDocumentValue] =
    useState(documentNo);

  // =====================================================
  // วันที่เบิก
  //
  // ค่าเริ่มต้นเป็นวันที่ปัจจุบัน
  // =====================================================

  const [issueDate, setIssueDate] =
    useState(getCurrentDate());

  const emptyRow = (): ItemRow => ({
    category: "",
    materialId: "",
    qty: "",
    remark: "",
  });

  // พอ.101 มี 18 รายการ
  const [rows, setRows] =
    useState<ItemRow[]>(
      Array.from(
        {
          length: 18,
        },
        emptyRow
      )
    );

  // =====================================================
  // กรองผู้ขอเบิกตามกลุ่มงาน
  //
  // รองรับทั้ง:
  // - officer.departmentId
  // - officer.section.departmentId
  // =====================================================

  const filteredOfficers =
    officers.filter(
      (officer) =>
        String(
          officer.departmentId
        ) === departmentId ||
        String(
          officer.section?.departmentId
        ) === departmentId
    );

  function updateRow(
    index: number,
    key: keyof ItemRow,
    value: string
  ) {
    const copy = [...rows];

    copy[index] = {
      ...copy[index],
      [key]: value,
    };

    // เปลี่ยนหมวดหมู่
    // ต้องล้างพัสดุและจำนวนเดิม
    if (key === "category") {
      copy[index].materialId = "";
      copy[index].qty = "";
    }

    // เปลี่ยนพัสดุ
    // ต้องล้างจำนวนเดิม
    if (key === "materialId") {
      copy[index].qty = "";
    }

    setRows(copy);
  }

  return (
    <div
      className="
        mx-auto
        max-w-[1600px]
        rounded-2xl
        border
        border-slate-300
        bg-white
        p-4
        shadow-xl
        sm:p-6
      "
    >
      <form
        action={createIssue}
        className="space-y-6"
      >
        {/* =====================================================
            หัวแบบฟอร์ม พอ.101
        ===================================================== */}

        <div
          className="
            relative
            border-b
            border-slate-300
            pb-6
          "
        >
          {/* เลขที่เอกสาร */}

          <div
            className="
              mb-4
              flex
              justify-end
            "
          >
            <div className="w-full sm:w-[300px]">
              <label
                className="
                  mb-2
                  block
                  text-base
                  font-extrabold
                  text-slate-900
                "
              >
                เลขที่เอกสาร
              </label>

              <input
                type="text"
                name="documentNo"
                value={documentValue}
                onChange={(e) =>
                  setDocumentValue(
                    e.target.value
                  )
                }
                readOnly={!editDocumentNo}
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  p-2.5
                  text-base
                  font-extrabold
                  text-slate-900
                  outline-none
                  focus:border-cyan-500
                  focus:ring-2
                  focus:ring-cyan-100
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
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                <input
                  type="checkbox"
                  checked={editDocumentNo}
                  onChange={(e) => {
                    const checked =
                      e.target.checked;

                    setEditDocumentNo(
                      checked
                    );

                    if (!checked) {
                      setDocumentValue(
                        documentNo
                      );
                    }
                  }}
                  className="
                    h-4
                    w-4
                    cursor-pointer
                  "
                />

                แก้ไขเลขที่เอกสาร
              </label>
            </div>
          </div>

          {/* พอ.101 */}

          <div
            className="
              text-center
              text-lg
              font-bold
              text-slate-900
            "
          >
            พอ.101
          </div>

          {/* ใบเบิกพัสดุ */}

          <h1
            className="
              mt-1
              text-center
              text-2xl
              font-extrabold
              text-slate-900
            "
          >
            ใบเบิกพัสดุ
          </h1>
        </div>

        {/* =====================================================
            ข้อมูลใบเบิก
        ===================================================== */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >
          {/* วันที่เบิก */}

          <div>
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-slate-900
              "
            >
              วันที่เบิก
            </label>

            <input
              type="date"
              name="issueDate"
              value={issueDate}
              onChange={(e) =>
                setIssueDate(e.target.value)
              }
              required
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2.5
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
                focus:ring-2
                focus:ring-cyan-100
              "
            />
          </div>

          {/* หน่วยงาน */}

          <div>
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-slate-900
              "
            >
              หน่วยงาน / กลุ่มงาน
            </label>

            <select
              name="departmentId"
              required
              value={departmentId}
              onChange={(e) => {
                const value =
                  e.target.value;

                setDepartmentId(value);

                // เปลี่ยนกลุ่มงาน
                // ต้องล้างผู้ขอเบิกเดิม
                setOfficerId("");
              }}
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2.5
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
                focus:ring-2
                focus:ring-cyan-100
              "
            >
              {departments.length !== 1 && (
                <option value="">
                  -- เลือกหน่วยงาน --
                </option>
              )}

              {departments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ผู้ขอเบิก */}

          <div>
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-slate-900
              "
            >
              ผู้ขอเบิก
            </label>

            <select
              name="officerId"
              value={officerId}
              onChange={(e) =>
                setOfficerId(
                  e.target.value
                )
              }
              disabled={!departmentId}
              required
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2.5
                font-semibold
                text-slate-900
                outline-none
                disabled:bg-slate-100
                focus:border-cyan-500
                focus:ring-2
                focus:ring-cyan-100
              "
            >
              <option value="">
                -- เลือกผู้ขอเบิก --
              </option>

              {filteredOfficers.map(
                (officer) => (
                  <option
                    key={officer.id}
                    value={officer.id}
                  >
                    {officer.firstName}{" "}
                    {officer.lastName}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* =====================================================
            ข้อความนำหน้าตาราง
        ===================================================== */}

        <div
          className="
            pt-2
            text-base
            font-semibold
            text-slate-900
          "
        >
          ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ
          ดังมีรายการต่อไปนี้
        </div>

        {/* =====================================================
            ตารางรายการ พอ.101
        ===================================================== */}

        <div
          className="
            overflow-x-auto
            rounded-xl
            border
            border-black
            bg-white
          "
        >
          <table
            className="
              w-full
              min-w-[1100px]
              border-collapse
              border
              border-black
              text-sm
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-slate-800
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    w-[18%]
                    border
                    border-black
                    bg-slate-800
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  หมวดหมู่
                </th>

                <th
                  className="
                    w-[35%]
                    border
                    border-black
                    bg-slate-800
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  รายการพัสดุ
                </th>

                <th
                  className="
                    w-[13%]
                    border
                    border-black
                    bg-slate-800
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  จำนวนที่ขอเบิก
                </th>

                <th
                  className="
                    w-[13%]
                    border
                    border-black
                    bg-slate-800
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  จำนวนที่เบิกจ่าย
                </th>

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-slate-800
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  หมายเหตุ
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const list =
                  materials.filter(
                    (material) =>
                      material.category ===
                      row.category
                  );

                return (
                  <tr
                    key={index}
                    className="
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    {/* ลำดับ */}

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                        font-bold
                        text-slate-900
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
                        py-2
                      "
                    >
                      <select
                        value={
                          row.category
                        }
                        onChange={(e) =>
                          updateRow(
                            index,
                            "category",
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-semibold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                          focus:ring-2
                          focus:ring-cyan-100
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
                        border-black
                        px-2
                        py-2
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
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-semibold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                          focus:ring-2
                          focus:ring-cyan-100
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
                              {material.name}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    {/* จำนวนที่ขอเบิก */}

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
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
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          p-2
                          text-center
                          font-bold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                          focus:ring-2
                          focus:ring-cyan-100
                        "
                      />
                    </td>

                    {/* จำนวนที่เบิกจ่าย */}

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                        text-center
                      "
                    >
                      <input
                        type="text"
                        readOnly
                        value={
                          row.qty
                            ? row.qty
                            : ""
                        }
                        className="
                          w-full
                          rounded-lg
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

                    {/* หมายเหตุ */}

                    <td
                      className="
                        border
                        border-black
                        px-2
                        py-2
                      "
                    >
                      <input
                        type="text"
                        name={`items[${index}].remark`}
                        value={
                          row.remark
                        }
                        onChange={(e) =>
                          updateRow(
                            index,
                            "remark",
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          p-2
                          font-semibold
                          text-slate-900
                          outline-none
                          focus:border-cyan-500
                          focus:ring-2
                          focus:ring-cyan-100
                        "
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            ปุ่มบันทึก
        ===================================================== */}

        <div
          className="
            flex
            justify-end
            pt-2
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
            💾 บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}