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
  balance: number;
};

type ReceiveItem = {
  id: number;
  materialId: number;
  qty: number;
  manufacture: Date | null;
  expiry: Date | null;
};

type Props = {
  issue: any;
  departments: Department[];
  materials: Material[];
  receiveItems: ReceiveItem[];
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

type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
  manufacture: string;
  expiry: string;
  receiveItemId: string;
};

const statusName: Record<string, string> = {
  PENDING: "รอ Admin ตรวจสอบ",
  APPROVED: "เบิกจ่ายแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

const statusClass: Record<string, string> = {
  PENDING:
    "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800",
  APPROVED:
    "border-emerald-600 bg-gradient-to-r from-emerald-600 to-green-500 text-white",
  REJECTED:
    "border-red-300 bg-gradient-to-r from-red-50 to-rose-50 text-red-800",
};

// =====================================================
// เดือนภาษาไทย
// =====================================================

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

// =====================================================
// แปลง Date / string เป็น YYYY-MM-DD
// ป้องกันปัญหา timezone ทำให้วันที่เหลื่อม
// =====================================================

function toDateInputValue(
  value: Date | string | null | undefined
) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// =====================================================
// แปลง YYYY-MM-DD เป็น วัน เดือน ปี พ.ศ.
// =====================================================

function formatThaiDate(
  dateString: string | null | undefined
) {
  if (!dateString) {
    return "-";
  }

  const match = dateString.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return "-";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !year ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "-";
  }

  return `${day} ${thaiMonths[month - 1]} ${
    year + 543
  }`;
}

export default function EditIssueForm({
  issue,
  departments,
  materials,
  receiveItems,
}: Props) {
  const isPending = issue.status === "PENDING";

  // =====================================================
  // วันที่เบิกจ่าย
  // =====================================================

  const [issueDate, setIssueDate] = useState(
    toDateInputValue(issue.issueDate)
  );

  // =====================================================
  // รายการเบิก
  // =====================================================

  const [items, setItems] = useState<IssueRow[]>(() => {
    const rows = issue.items.map((item: any) => {
      const receiveItemId =
        item.receiveItemId != null
          ? String(item.receiveItemId)
          : "";

      const lot =
        receiveItemId !== ""
          ? receiveItems.find(
              (r) => r.id === Number(receiveItemId)
            )
          : null;

      return {
        category: item.material.category,
        materialId: String(item.materialId),
        qty: String(item.qty),
        receiveItemId,

        manufacture: lot?.manufacture
          ? toDateInputValue(lot.manufacture)
          : item.manufacture
            ? toDateInputValue(item.manufacture)
            : "",

        expiry: lot?.expiry
          ? toDateInputValue(lot.expiry)
          : item.expiry
            ? toDateInputValue(item.expiry)
            : "",
      };
    });

    while (rows.length < 15) {
      rows.push({
        category: "",
        materialId: "",
        qty: "",
        manufacture: "",
        expiry: "",
        receiveItemId: "",
      });
    }

    return rows;
  });

  function updateRow(
    index: number,
    key: keyof IssueRow,
    value: string
  ) {
    if (!isPending) {
      return;
    }

    const copy = [...items];
    copy[index][key] = value;

    if (key === "category") {
      copy[index].materialId = "";
      copy[index].receiveItemId = "";
      copy[index].manufacture = "";
      copy[index].expiry = "";
    }

    if (key === "materialId") {
      copy[index].receiveItemId = "";
      copy[index].manufacture = "";
      copy[index].expiry = "";
    }

    setItems(copy);
  }

  const inputClass = `
    w-full
    rounded-xl
    border
    border-slate-300
    bg-white
    p-3
    font-bold
    text-black
    outline-none
    transition
    focus:border-slate-600
    focus:ring-2
    focus:ring-slate-200
    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:text-slate-500
  `;

  const tableInputClass = `
    w-full
    rounded-lg
    border
    border-slate-300
    bg-white
    p-2
    font-bold
    text-black
    outline-none
    transition
    focus:border-slate-600
    focus:ring-2
    focus:ring-slate-200
    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:text-slate-500
  `;

  return (
    <div
      className="
        w-full
        min-w-0
        rounded-2xl
        border
        border-slate-300
        bg-white
        p-4
        shadow-lg
        sm:p-6
      "
    >
      {/* =====================================================
          สถานะใบเบิก
      ===================================================== */}

      <div
        className="
          mb-6
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          !text-white
          shadow-xl
          sm:p-6
        "
      >
        <p
          className="
            text-sm
            font-bold
            !text-slate-200
            sm:text-lg
          "
        >
          สถานะใบเบิก
        </p>

        <div className="mt-2">
          <span
            className={`
              inline-flex
              items-center
              justify-center
              rounded-xl
              border
              px-4
              py-2
              text-sm
              font-extrabold
              shadow-lg
              sm:px-5
              sm:py-2.5
              sm:text-base
              ${
                statusClass[issue.status] ??
                "border-slate-300 bg-slate-100 text-slate-700"
              }
            `}
          >
            {statusName[issue.status] ?? issue.status}
          </span>
        </div>
      </div>

      <form
        action={isPending ? updateIssue : undefined}
        className="space-y-6"
      >
        <input
          type="hidden"
          name="issueId"
          value={issue.id}
        />

        {/* =====================================================
            ข้อมูลเอกสาร
        ===================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            to-slate-800
            p-4
            !text-white
            shadow-xl
            sm:p-5
          "
        >
          <div
            className="
              mb-4
              border-b
              border-slate-700
              pb-4
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-2xl
              "
            >
              📋 ข้อมูลเอกสาร
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-300
                sm:text-base
              "
            >
              ข้อมูลพื้นฐานของเอกสารเบิกจ่ายพัสดุ
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* วันที่เบิกจ่าย */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  !text-white
                  sm:text-base
                "
              >
                วันที่เบิกจ่าย
              </label>

              <div className="relative">
                <input
                  type="date"
                  name="issueDate"
                  value={issueDate}
                  onChange={(e) =>
                    setIssueDate(e.target.value)
                  }
                  disabled={!isPending}
                  required
                  className="
                    absolute
                    inset-0
                    z-10
                    h-full
                    w-full
                    cursor-pointer
                    opacity-0
                    disabled:cursor-not-allowed
                  "
                />

                <div
                  className={`
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
                    ${
                      !isPending
                        ? "bg-slate-100 text-slate-500"
                        : ""
                    }
                  `}
                >
                  <span>
                    {formatThaiDate(issueDate)}
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
                  text-sm
                  font-extrabold
                  !text-white
                  sm:text-base
                "
              >
                เลขที่เอกสาร
              </label>

              <input
                type="text"
                name="documentNo"
                defaultValue={issue.documentNo}
                disabled={!isPending}
                className={inputClass}
              />
            </div>

            {/* หน่วยงาน */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  !text-white
                  sm:text-base
                "
              >
                หน่วยงาน
              </label>

              <select
                name="departmentId"
                defaultValue={issue.departmentId}
                disabled={!isPending}
                className={inputClass}
              >
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
          </div>
        </div>

        {/* =====================================================
            ตารางรายการ
        ===================================================== */}

        <div
          className="
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            bg-white
            shadow-xl
          "
        >
          <div className="w-full overflow-x-auto">
            <table
              className="
                w-full
                min-w-[1100px]
                border-collapse
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
                  ].map((header) => (
                    <th
                      key={header}
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-3
                        py-3
                        text-center
                        text-lg
                        font-extrabold
                        !text-white
                      "
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (row: IssueRow, index: number) => {
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
                          transition
                          hover:bg-emerald-50
                        "
                      >
                        {/* ลำดับ */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-slate-900
                            px-3
                            py-3
                            text-center
                            font-bold
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
                            disabled={!isPending}
                            onChange={(e) =>
                              updateRow(
                                index,
                                "category",
                                e.target.value
                              )
                            }
                            className={tableInputClass}
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
                            disabled={!isPending}
                            onChange={(e) =>
                              updateRow(
                                index,
                                "materialId",
                                e.target.value
                              )
                            }
                            className={tableInputClass}
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
                                  {material.code} -{" "}
                                  {material.name}
                                </option>
                              )
                            )}
                          </select>

                          <input
                            type="hidden"
                            name={`items[${index}].receiveItemId`}
                            value={row.receiveItemId}
                          />
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
                            className={`
                              ${tableInputClass}
                              text-center
                              bg-slate-50
                            `}
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
                            disabled={!isPending}
                            onChange={(e) =>
                              updateRow(
                                index,
                                "qty",
                                e.target.value
                              )
                            }
                            min={1}
                            className={`
                              ${tableInputClass}
                              text-center
                            `}
                          />
                        </td>

                        {/* ราคาต่อหน่วย */}

                        <td
                          className="
                            border
                            border-slate-900
                            px-3
                            py-3
                            text-center
                          "
                        >
                          <input
                            type="text"
                            readOnly
                            value={
                              selectedMaterial
                                ? Number(
                                    selectedMaterial.latestPrice
                                  ).toFixed(2)
                                : ""
                            }
                            className={`
                              ${tableInputClass}
                              bg-slate-50
                              text-center
                            `}
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
                              type="date"
                              value={row.manufacture}
                              readOnly
                              tabIndex={-1}
                              className="
                                absolute
                                inset-0
                                z-10
                                h-full
                                w-full
                                opacity-0
                              "
                            />

                            <div
                              className={`
                                flex
                                min-h-[42px]
                                w-full
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-300
                                bg-slate-100
                                p-2
                                text-center
                                font-bold
                                text-slate-700
                              `}
                            >
                              <span>
                                {formatThaiDate(
                                  row.manufacture
                                )}
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
                              type="date"
                              value={row.expiry}
                              readOnly
                              tabIndex={-1}
                              className="
                                absolute
                                inset-0
                                z-10
                                h-full
                                w-full
                                opacity-0
                              "
                            />

                            <div
                              className="
                                flex
                                min-h-[42px]
                                w-full
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-300
                                bg-slate-100
                                p-2
                                text-center
                                font-bold
                                text-slate-700
                              "
                            >
                              <span>
                                {formatThaiDate(
                                  row.expiry
                                )}
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
        </div>

        {/* =====================================================
            ปุ่มบันทึก
        ===================================================== */}

        {isPending ? (
          <div
            className="
              flex
              justify-end
              border-t
              border-slate-200
              pt-5
            "
          >
            <button
              type="submit"
              className="
                w-full
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-8
                py-3
                text-base
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:scale-[1.02]
                sm:w-auto
                sm:text-lg
              "
            >
              💾 บันทึกการแก้ไข
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}