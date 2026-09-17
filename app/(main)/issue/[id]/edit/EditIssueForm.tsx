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

type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
  receiveItemId: string;
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
// Date -> YYYY-MM-DD
// =====================================================

function toDateInputValue(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

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
// YYYY-MM-DD -> วัน เดือน ปี พ.ศ.
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
}: Props) {
  const isPending =
    issue.status === "PENDING";

  // =====================================================
  // วันที่เบิก
  // =====================================================

  const [issueDate, setIssueDate] =
    useState(
      toDateInputValue(
        issue.issueDate
      )
    );

  // =====================================================
  // รายการเบิก
  // =====================================================

  const [items, setItems] =
    useState<IssueRow[]>(() => {
      const rows: IssueRow[] =
        issue.items.map(
          (item: any) => ({
            category:
              item.material.category ?? "",

            materialId:
              String(
                item.materialId
              ),

            qty:
              String(
                item.qty
              ),

            remark:
              item.remark ?? "",

            receiveItemId:
              item.receiveItemId != null
                ? String(
                    item.receiveItemId
                  )
                : "",
          })
        );

      while (rows.length < 15) {
        rows.push({
          category: "",
          materialId: "",
          qty: "",
          remark: "",
          receiveItemId: "",
        });
      }

      return rows;
    });

  // =====================================================
  // Update Row
  // =====================================================

  function updateRow(
    index: number,
    key: keyof IssueRow,
    value: string
  ) {
    if (!isPending) {
      return;
    }

    setItems(
      (currentItems) => {
        const copy =
          currentItems.map(
            (item) => ({
              ...item,
            })
          );

        copy[index][key] =
          value;

        // ===============================================
        // เปลี่ยนหมวดหมู่
        // ล้างรายการเดิม
        // ===============================================

        if (key === "category") {
          copy[index].materialId = "";
          copy[index].receiveItemId = "";
        }

        // ===============================================
        // เปลี่ยนพัสดุ
        // ล้างล็อตเดิม
        // ===============================================

        if (key === "materialId") {
          copy[index].receiveItemId = "";
        }

        return copy;
      }
    );
  }

  // =====================================================
  // Input
  // =====================================================

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
    px-3
    py-2.5
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

  // =====================================================
  // Header ตาราง
  // =====================================================

  const tableHeaderClass = `
    border
    border-black
    bg-gradient-to-r
    from-slate-800
    to-slate-700
    px-3
    py-4
    text-center
    text-base
    font-extrabold
    !text-white
  `;

  // =====================================================
  // Cell ตาราง
  // =====================================================

  const tableCellClass = `
    border
    border-black
    bg-white
    px-3
    py-3
    align-middle
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
          สถานะ
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
                statusClass[
                  issue.status
                ] ??
                "border-slate-300 bg-slate-100 text-slate-700"
              }
            `}
          >
            {statusName[
              issue.status
            ] ??
              issue.status}
          </span>
        </div>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <form
        action={
          isPending
            ? updateIssue
            : undefined
        }
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

          <div
            className="
              grid
              gap-4
              md:grid-cols-3
            "
          >
            {/* วันที่ */}

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
                    setIssueDate(
                      e.target.value
                    )
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
                    {formatThaiDate(
                      issueDate
                    )}
                  </span>

                  <span className="text-xl">
                    📅
                  </span>
                </div>
              </div>
            </div>

            {/* เลขเอกสาร */}

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
                defaultValue={
                  issue.documentNo
                }
                disabled={!isPending}
                className={
                  inputClass
                }
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
                defaultValue={
                  issue.departmentId
                }
                disabled={!isPending}
                className={
                  inputClass
                }
              >
                {departments.map(
                  (department) => (
                    <option
                      key={
                        department.id
                      }
                      value={
                        department.id
                      }
                    >
                      {
                        department.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* =====================================================
            ตาราง

            ลำดับ
            หมวดหมู่
            รายการพัสดุ
            จำนวนที่ขอเบิก
            หน่วย
            หมายเหตุ
        ===================================================== */}

        <div
          className="
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-black
            bg-white
            shadow-xl
          "
        >
          <div
            className="
              w-full
              overflow-x-auto
            "
          >
            <table
              className="
                w-full
                min-w-[1100px]
                table-fixed
                border-collapse
              "
            >
              {/* ===============================================
                  ความกว้างคอลัมน์
              =============================================== */}

              <colgroup>
                <col
                  style={{
                    width: "6%",
                  }}
                />

                <col
                  style={{
                    width: "17%",
                  }}
                />

                <col
                  style={{
                    width: "35%",
                  }}
                />

                <col
                  style={{
                    width: "13%",
                  }}
                />

                <col
                  style={{
                    width: "10%",
                  }}
                />

                <col
                  style={{
                    width: "19%",
                  }}
                />
              </colgroup>

              {/* ===============================================
                  Header
              =============================================== */}

              <thead>
                <tr>
                  <th
                    className={
                      tableHeaderClass
                    }
                  >
                    ลำดับ
                  </th>

                  <th
                    className={
                      tableHeaderClass
                    }
                  >
                    หมวดหมู่
                  </th>

                  <th
                    className={
                      tableHeaderClass
                    }
                  >
                    รายการพัสดุ
                  </th>

                  <th
                    className={
                      tableHeaderClass
                    }
                  >
                    จำนวนที่ขอเบิก
                  </th>

                  <th
                    className={
                      tableHeaderClass
                    }
                  >
                    หน่วย
                  </th>

                  <th
                    className={
                      tableHeaderClass
                    }
                  >
                    หมายเหตุ
                  </th>
                </tr>
              </thead>

              {/* ===============================================
                  Body
              =============================================== */}

              <tbody>
                {items.map(
                  (
                    row,
                    index
                  ) => {
                    // =========================================
                    // แสดงเฉพาะ Material ในหมวดที่เลือก
                    // =========================================

                    const filteredMaterials =
                      row.category
                        ? materials.filter(
                            (
                              material
                            ) =>
                              material.category ===
                              row.category
                          )
                        : [];

                    const selectedMaterial =
                      materials.find(
                        (
                          material
                        ) =>
                          material.id ===
                          Number(
                            row.materialId
                          )
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
                        {/* =====================================
                            ลำดับ
                        ===================================== */}

                        <td
                          className={`
                            ${tableCellClass}
                            text-center
                            font-bold
                          `}
                        >
                          {index + 1}
                        </td>

                        {/* =====================================
                            หมวดหมู่
                        ===================================== */}

                        <td
                          className={
                            tableCellClass
                          }
                        >
                          <select
                            value={
                              row.category
                            }
                            disabled={
                              !isPending
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
                            className={
                              tableInputClass
                            }
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

                        {/* =====================================
                            รายการพัสดุ
                        ===================================== */}

                        <td
                          className={
                            tableCellClass
                          }
                        >
                          <select
                            name={`items[${index}].materialId`}
                            value={
                              row.materialId
                            }
                            disabled={
                              !isPending ||
                              !row.category
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
                            className={
                              tableInputClass
                            }
                          >
                            <option value="">
                              {row.category
                                ? "เลือกรายการพัสดุ"
                                : "เลือกหมวดหมู่ก่อน"}
                            </option>

                            {filteredMaterials.map(
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

                          <input
                            type="hidden"
                            name={`items[${index}].receiveItemId`}
                            value={
                              row.receiveItemId
                            }
                          />
                        </td>

                        {/* =====================================
                            จำนวนที่ขอเบิก
                        ===================================== */}

                        <td
                          className={
                            tableCellClass
                          }
                        >
                          <input
                            type="number"
                            name={`items[${index}].qty`}
                            value={
                              row.qty
                            }
                            disabled={
                              !isPending
                            }
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
                            min={1}
                            className={`
                              ${tableInputClass}
                              text-center
                            `}
                          />
                        </td>

                        {/* =====================================
                            หน่วย
                        ===================================== */}

                        <td
                          className={
                            tableCellClass
                          }
                        >
                          <div
                            className="
                              flex
                              min-h-[46px]
                              w-full
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-slate-300
                              bg-slate-50
                              px-2
                              py-2
                              text-center
                              font-bold
                              text-slate-700
                            "
                          >
                            {selectedMaterial?.unit ??
                              ""}
                          </div>
                        </td>

                        {/* =====================================
                            หมายเหตุ
                        ===================================== */}

                        <td
                          className={
                            tableCellClass
                          }
                        >
                          <input
                            type="text"
                            name={`items[${index}].remark`}
                            value={
                              row.remark
                            }
                            disabled={
                              !isPending
                            }
                            onChange={(
                              e
                            ) =>
                              updateRow(
                                index,
                                "remark",
                                e.target
                                  .value
                              )
                            }
                            placeholder="ระบุหมายเหตุ"
                            className={
                              tableInputClass
                            }
                          />
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
                hover:from-emerald-700
                hover:to-green-600
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