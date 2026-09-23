"use client";

import { useState } from "react";

import AppButton from "@/components/AppButton";

import { createIssue } from "./action";

/* =========================================================
   TYPES
========================================================= */

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
  initialDepartmentId?: string;

  /*
   * true  = ADMIN สามารถเปลี่ยนกลุ่มงานได้
   * false = ผู้ใช้งานทั่วไป ล็อกกลุ่มงาน
   */
  canChangeDepartment: boolean;
};

type ItemRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
};

/* =========================================================
   CATEGORIES
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
   THAI MONTHS
========================================================= */

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

/* =========================================================
   CURRENT DATE
   YYYY-MM-DD
========================================================= */

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

/* =========================================================
   THAI DATE
========================================================= */

function formatThaiDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const match =
    dateString.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return "";
  }

  const year = Number(
    match[1]
  );

  const month = Number(
    match[2]
  );

  const day = Number(
    match[3]
  );

  if (
    !year ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }

  return `${String(day).padStart(
    2,
    "0"
  )} ${
    thaiMonths[month - 1]
  } ${year + 543}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function IssueForm({
  materials,
  receiveLots,
  departments,
  officers,
  documentNo,
  initialDepartmentId,
  canChangeDepartment,
}: Props) {
  /* =======================================================
     DEFAULT DEPARTMENT
  ======================================================= */

  const defaultDepartmentId =
    initialDepartmentId ||
    (departments.length === 1
      ? String(
          departments[0].id
        )
      : "");

  const [
    departmentId,
    setDepartmentId,
  ] = useState(
    defaultDepartmentId
  );

  /* =======================================================
     OFFICER
  ======================================================= */

  const [
    officerId,
    setOfficerId,
  ] = useState("");

  /* =======================================================
     DOCUMENT NUMBER
  ======================================================= */

  const [
    editDocumentNo,
    setEditDocumentNo,
  ] = useState(false);

  const [
    documentValue,
    setDocumentValue,
  ] = useState(documentNo);

  /* =======================================================
     ISSUE DATE
  ======================================================= */

  const [
    issueDate,
    setIssueDate,
  ] = useState(
    getCurrentDate()
  );

  /* =======================================================
     ROWS
  ======================================================= */

  const emptyRow =
    (): ItemRow => ({
      category: "",
      materialId: "",
      qty: "",
      remark: "",
    });

  /*
   * พอ.101
   * 18 รายการ
   */
  const [rows, setRows] =
    useState<ItemRow[]>(
      Array.from(
        {
          length: 18,
        },
        emptyRow
      )
    );

  /* =======================================================
     FILTER OFFICERS
  ======================================================= */

  const filteredOfficers =
    officers.filter(
      (officer) =>
        String(
          officer.departmentId
        ) === departmentId ||
        String(
          officer.section
            ?.departmentId
        ) === departmentId
    );

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  function updateRow(
    index: number,
    key: keyof ItemRow,
    value: string
  ) {
    const copy = [
      ...rows,
    ];

    copy[index] = {
      ...copy[index],
      [key]: value,
    };

    /* -----------------------------------------------------
       เปลี่ยนหมวดหมู่
    ----------------------------------------------------- */

    if (
      key === "category"
    ) {
      copy[index].materialId =
        "";

      copy[index].qty = "";
    }

    /* -----------------------------------------------------
       เปลี่ยนพัสดุ
    ----------------------------------------------------- */

    if (
      key === "materialId"
    ) {
      copy[index].qty = "";
    }

    setRows(copy);
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        w-full
        min-w-0
        bg-white
      "
    >
      <form
        action={createIssue}
        className="space-y-6"
      >
        {/* =================================================
            DOCUMENT NUMBER
        ================================================= */}

        <div
          className="
            flex
            w-full
            justify-end
          "
        >
          <div
            className="
              w-full
              max-w-[260px]
            "
          >
            <label
              className="
                mb-1.5
                block
                text-sm
                font-extrabold
                !text-slate-700
              "
            >
              เลขที่เอกสาร
            </label>

            <input
              type="text"
              name="documentNo"
              value={
                documentValue
              }
              onChange={(e) =>
                setDocumentValue(
                  e.target.value
                )
              }
              readOnly={
                !editDocumentNo
              }
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                font-extrabold
                !text-slate-900
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                read-only:bg-slate-50
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
                text-xs
                font-semibold
                !text-slate-600
              "
            >
              <input
                type="checkbox"
                checked={
                  editDocumentNo
                }
                onChange={(e) => {
                  const checked =
                    e.target.checked;

                  setEditDocumentNo(
                    checked
                  );

                  if (
                    !checked
                  ) {
                    setDocumentValue(
                      documentNo
                    );
                  }
                }}
                className="
                  h-4
                  w-4
                  shrink-0
                  cursor-pointer
                  rounded
                  border-slate-300
                "
              />

              <span>
                แก้ไขเลขที่เอกสาร
              </span>
            </label>
          </div>
        </div>

        {/* =================================================
            FORM TITLE
        ================================================= */}

        <div
          className="
            border-b
            border-slate-200
            pb-5
            text-center
          "
        >
          <div
            className="
              text-base
              font-bold
              !text-slate-600
            "
          >
            พอ.101
          </div>

          <h2
            className="
              mt-1
              text-2xl
              font-extrabold
              !text-slate-900
            "
          >
            ใบเบิกพัสดุ
          </h2>
        </div>

        {/* =================================================
            DOCUMENT INFORMATION
        ================================================= */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-3
          "
        >
          {/* ===============================================
              ISSUE DATE
          =============================================== */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              วันที่เบิก
            </label>

            <div
              className="
                relative
                h-11
                w-full
              "
            >
              <input
                type="date"
                name="issueDate"
                value={issueDate}
                onChange={(e) =>
                  setIssueDate(
                    e.target.value
                  )
                }
                required
                className="
                  absolute
                  inset-0
                  z-10
                  h-11
                  w-full
                  cursor-pointer
                  opacity-0
                "
              />

              <div
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  text-sm
                  font-bold
                  !text-slate-900
                  shadow-sm
                "
              >
                <span>
                  {formatThaiDate(
                    issueDate
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className="
                    shrink-0
                    text-lg
                  "
                >
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* ===============================================
              DEPARTMENT
          =============================================== */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              หน่วยงาน / กลุ่มงาน
            </label>

            {/* ------------------------------------------------
                disabled select จะไม่ส่งค่าตอน submit
                ผู้ใช้ทั่วไปจึงส่งผ่าน hidden input
            ------------------------------------------------ */}

            {!canChangeDepartment && (
              <input
                type="hidden"
                name="departmentId"
                value={
                  departmentId
                }
              />
            )}

            <select
              name={
                canChangeDepartment
                  ? "departmentId"
                  : undefined
              }
              required={
                canChangeDepartment
              }
              value={
                departmentId
              }
              disabled={
                !canChangeDepartment
              }
              onChange={(e) => {
                if (
                  !canChangeDepartment
                ) {
                  return;
                }

                const value =
                  e.target.value;

                setDepartmentId(
                  value
                );

                setOfficerId("");
              }}
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                font-bold
                !text-slate-900
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:bg-slate-100
                disabled:!text-slate-500
              "
            >
              {canChangeDepartment && (
                <option value="">
                  -- เลือกหน่วยงาน --
                </option>
              )}

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

          {/* ===============================================
              OFFICER
          =============================================== */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-extrabold
                !text-slate-800
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
              disabled={
                !departmentId
              }
              required
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                font-bold
                !text-slate-900
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:bg-slate-100
                disabled:!text-slate-500
              "
            >
              <option value="">
                -- เลือกผู้ขอเบิก --
              </option>

              {filteredOfficers.map(
                (officer) => (
                  <option
                    key={
                      officer.id
                    }
                    value={
                      officer.id
                    }
                  >
                    {
                      officer.firstName
                    }{" "}
                    {
                      officer.lastName
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

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
              min-w-[1250px]
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
                  "จำนวนที่ขอเบิก",
                  "จำนวนที่เบิกจ่าย",
                  "หน่วย",
                  "หมายเหตุ",
                ].map(
                  (
                    tableTitle
                  ) => (
                    <th
                      key={
                        tableTitle
                      }
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-4
                        py-4
                        text-center
                        text-base
                        font-extrabold
                        !text-white
                      "
                    >
                      {
                        tableTitle
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (
                  row,
                  index
                ) => {
                  const list =
                    materials.filter(
                      (
                        material
                      ) =>
                        material.category ===
                        row.category
                    );

                  const selectedMaterial =
                    materials.find(
                      (
                        material
                      ) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  const unit =
                    selectedMaterial
                      ?.unit ?? "";

                  return (
                    <tr
                      key={index}
                      className={`
                        transition-colors
                        duration-200

                        ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =====================================
                          NUMBER
                      ===================================== */}

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

                      {/* =====================================
                          CATEGORY
                      ===================================== */}

                      <td
                        className="
                          min-w-[190px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <select
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
                          className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                          "
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
                          MATERIAL
                      ===================================== */}

                      <td
                        className="
                          min-w-[300px]
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
                          disabled={
                            !row.category
                          }
                          className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                          "
                        >
                          <option value="">
                            {row.category
                              ? "เลือกรายการพัสดุ"
                              : "เลือกหมวดหมู่ก่อน"}
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
                                  material.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* =====================================
                          REQUEST QTY
                      ===================================== */}

                      <td
                        className="
                          min-w-[150px]
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
                          value={
                            row.qty
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
                          className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            text-center
                            font-bold
                            !text-slate-900
                            outline-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                          "
                        />
                      </td>

                      {/* =====================================
                          APPROVED QTY
                      ===================================== */}

                      <td
                        className="
                          min-w-[150px]
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
                          value=""
                          aria-label={`จำนวนที่เบิกจ่ายรายการที่ ${
                            index +
                            1
                          }`}
                          className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-100
                            px-3
                            text-center
                            font-bold
                            !text-slate-500
                            outline-none
                          "
                        />
                      </td>

                      {/* =====================================
                          UNIT
                      ===================================== */}

                      <td
                        className="
                          min-w-[120px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          type="text"
                          readOnly
                          value={unit}
                          aria-label={`หน่วยของรายการที่ ${
                            index +
                            1
                          }`}
                          className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-50
                            px-3
                            text-center
                            font-bold
                            !text-slate-700
                            outline-none
                          "
                        />

                        <input
                          type="hidden"
                          name={`items[${index}].unit`}
                          value={unit}
                        />
                      </td>

                      {/* =====================================
                          REMARK
                      ===================================== */}

                      <td
                        className="
                          min-w-[220px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          type="text"
                          name={`items[${index}].remark`}
                          value={
                            row.remark
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
                          className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                          "
                        />
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            SUBMIT
        ================================================= */}

        <div
          className="
            flex
            justify-end
            border-t
            border-slate-200
            pt-5
          "
        >
          <AppButton
            type="submit"
            variant="success"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                💾
              </span>
            }
          >
            บันทึก
          </AppButton>
        </div>
      </form>
    </div>
  );
}