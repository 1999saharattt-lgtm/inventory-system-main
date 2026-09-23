"use client";

import {
  useMemo,
  useState,
} from "react";

import { createIssue } from "./action";

import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";
import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Material = {
  id: number;
  code?: string;
  name: string;
  category: string;
  unit: string;
  latestPrice: number;
};

type ReceiveLot = {
  id: number;
  materialId: number;
  balance: number;
  manufacture:
    | Date
    | string
    | null;
  expiry:
    | Date
    | string
    | null;
};

type Department = {
  id: number;
  name: string;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  departmentId:
    | number
    | null;

  department?: {
    id: number;
  } | null;

  section?: {
    departmentId:
      | number
      | null;
  } | null;
};

type Props = {
  materials: Material[];
  receiveLots: ReceiveLot[];
  departments: Department[];
  officers: Officer[];
  documentNo: string;
  initialDepartmentId?: string;
  isAdmin: boolean;
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
    label:
      "วัสดุงานบ้านและงานครัว",
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
========================================================= */

function getCurrentDate() {
  const now =
    new Date();

  const year =
    now.getFullYear();

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

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    !year ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }

  return `${String(
    day
  ).padStart(
    2,
    "0"
  )} ${
    thaiMonths[
      month - 1
    ]
  } ${year + 543}`;
}

/* =========================================================
   FORM
========================================================= */

export default function IssueForm({
  materials,
  receiveLots,
  departments,
  officers,
  documentNo,
  initialDepartmentId,
  isAdmin,
}: Props) {
  /* =======================================================
     DEPARTMENT
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

  const [
    rows,
    setRows,
  ] = useState<
    ItemRow[]
  >(
    Array.from(
      {
        length: 18,
      },
      emptyRow
    )
  );

  /* =======================================================
     OFFICER FILTER
  ======================================================= */

  const filteredOfficers =
    useMemo(
      () =>
        officers.filter(
          (officer) =>
            String(
              officer.departmentId
            ) ===
              departmentId ||
            String(
              officer.section
                ?.departmentId
            ) ===
              departmentId
        ),
      [
        officers,
        departmentId,
      ]
    );

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  function updateRow(
    index: number,
    key: keyof ItemRow,
    value: string
  ) {
    setRows(
      (currentRows) => {
        const copy =
          currentRows.map(
            (row) => ({
              ...row,
            })
          );

        copy[index][key] =
          value;

        if (
          key === "category"
        ) {
          copy[
            index
          ].materialId = "";

          copy[index].qty =
            "";
        }

        if (
          key ===
          "materialId"
        ) {
          copy[index].qty =
            "";
        }

        return copy;
      }
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      action={createIssue}
      className="
        relative
        w-full
        min-w-0
        space-y-6
        overflow-visible
      "
    >
      {/* ===================================================
          DOCUMENT / BASIC INFORMATION
      =================================================== */}

      <AppCard>
        <div
          className="
            w-full
            min-w-0
            space-y-6
          "
        >
          {/* ===============================================
              TOP
          =============================================== */}

          <div
            className="
              flex
              flex-col
              gap-4

              border-b
              border-slate-200

              pb-5

              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            {/* =============================================
                TITLE
            ============================================= */}

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-500
                "
              >
                พอ.101
              </p>

              <h2
                className="
                  mt-1
                  text-xl
                  font-extrabold
                  !text-slate-900
                  sm:text-2xl
                "
              >
                ใบเบิกพัสดุ
              </h2>
            </div>

            {/* =============================================
                DOCUMENT NUMBER
                ขนาดเล็ก ด้านขวาบน
            ============================================= */}

            <div
              className="
                w-full
                lg:w-[260px]
              "
            >
              <label
                className="
                  mb-1.5
                  block
                  text-xs
                  font-extrabold
                  !text-slate-600
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
                  focus:border-slate-500
                  focus:ring-2
                  focus:ring-slate-200
                "
              />

              {/* ===========================================
                  CHECKBOX
                  รูปแบบเดียวกับยอดยกเข้าระบบ
              =========================================== */}

              <label
                className="
                  mt-2
                  inline-flex
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
                      e.target
                        .checked;

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
                    cursor-pointer
                    rounded
                    border-slate-300
                  "
                />

                แก้ไขเลขที่เอกสาร
              </label>
            </div>
          </div>

          {/* ===============================================
              BASIC INFORMATION
          =============================================== */}

          <div
            className="
              grid
              gap-5
              lg:grid-cols-3
            "
          >
            {/* =============================================
                DATE
            ============================================= */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  !text-slate-700
                "
              >
                วันที่เบิก
              </label>

              <div
                className="
                  relative
                  max-w-[280px]
                "
              >
                <input
                  type="date"
                  name="issueDate"
                  value={
                    issueDate
                  }
                  onChange={(
                    e
                  ) =>
                    setIssueDate(
                      e.target
                        .value
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

                  <span>
                    📅
                  </span>
                </div>
              </div>
            </div>

            {/* =============================================
                DEPARTMENT
            ============================================= */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  !text-slate-700
                "
              >
                หน่วยงาน /
                กลุ่มงาน
              </label>

              {isAdmin ? (
                <select
                  name="departmentId"
                  required
                  value={
                    departmentId
                  }
                  onChange={(e) => {
                    setDepartmentId(
                      e.target
                        .value
                    );

                    setOfficerId(
                      ""
                    );
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
                    focus:border-slate-500
                    focus:ring-2
                    focus:ring-slate-200
                  "
                >
                  <option value="">
                    --
                    เลือกกลุ่มงาน
                    --
                  </option>

                  {departments.map(
                    (
                      department
                    ) => (
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
              ) : (
                <>
                  <input
                    type="hidden"
                    name="departmentId"
                    value={
                      departmentId
                    }
                  />

                  <div
                    className="
                      flex
                      h-11
                      w-full
                      items-center

                      rounded-xl

                      border
                      border-slate-200

                      bg-slate-100

                      px-3

                      text-sm
                      font-bold
                      !text-slate-600
                    "
                  >
                    {departments.find(
                      (
                        department
                      ) =>
                        String(
                          department.id
                        ) ===
                        departmentId
                    )?.name ??
                      "-"}
                  </div>
                </>
              )}
            </div>

            {/* =============================================
                OFFICER
            ============================================= */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  !text-slate-700
                "
              >
                ผู้ขอเบิก
              </label>

              <select
                name="officerId"
                value={
                  officerId
                }
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
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                  disabled:!text-slate-400
                  focus:border-slate-500
                  focus:ring-2
                  focus:ring-slate-200
                "
              >
                <option value="">
                  --
                  เลือกผู้ขอเบิก
                  --
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
        </div>
      </AppCard>

      {/* ===================================================
          ITEMS TABLE
      =================================================== */}

      <AppTableCard
        title="รายการพัสดุที่ขอเบิก"
        subtitle="แบบ พอ.101"
        className="
          w-full
          min-w-0
        "
      >
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
              min-w-[1280px]
              border-collapse
              bg-white
              text-sm
            "
          >
            {/* =============================================
                HEADER
            ============================================= */}

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
                  (title) => (
                    <th
                      key={title}
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
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =============================================
                BODY
            ============================================= */}

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

                  const availableBalance =
                    receiveLots
                      .filter(
                        (lot) =>
                          lot.materialId ===
                          Number(
                            row.materialId
                          )
                      )
                      .reduce(
                        (
                          total,
                          lot
                        ) =>
                          total +
                          lot.balance,
                        0
                      );

                  return (
                    <tr
                      key={index}
                      className={`
                        transition-all
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
                      {/* ===================================
                          NUMBER
                      =================================== */}

                      <td
                        className="
                          w-[70px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {index +
                          1}
                      </td>

                      {/* ===================================
                          CATEGORY
                      =================================== */}

                      <td
                        className="
                          min-w-[220px]
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
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
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

                      {/* ===================================
                          MATERIAL
                      =================================== */}

                      <td
                        className="
                          min-w-[340px]
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
                          disabled={
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
                          className="
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
                            disabled:bg-slate-100
                            disabled:!text-slate-400
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

                      {/* ===================================
                          REQUEST QTY
                      =================================== */}

                      <td
                        className="
                          min-w-[150px]
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
                          max={
                            availableBalance >
                            0
                              ? availableBalance
                              : undefined
                          }
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
                            h-11
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
                          "
                        />
                      </td>

                      {/* ===================================
                          APPROVED QTY
                      =================================== */}

                      <td
                        className="
                          min-w-[150px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <div
                          className="
                            flex
                            h-11
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-100
                            px-3
                            font-bold
                            !text-slate-400
                          "
                        >
                          -
                        </div>
                      </td>

                      {/* ===================================
                          UNIT
                      =================================== */}

                      <td
                        className="
                          min-w-[120px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <div
                          className="
                            flex
                            h-11
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            px-3
                            font-bold
                            !text-slate-700
                          "
                        >
                          {unit ||
                            "-"}
                        </div>

                        <input
                          type="hidden"
                          name={`items[${index}].unit`}
                          value={
                            unit
                          }
                        />
                      </td>

                      {/* ===================================
                          REMARK
                      =================================== */}

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
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
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
      </AppTableCard>

      {/* ===================================================
          SAVE
      =================================================== */}

      <div
        className="
          flex
          w-full
          justify-end
        "
      >
        <AppButton
          type="submit"
          variant="success"
          size="md"
          icon={
            <span>
              💾
            </span>
          }
        >
          บันทึก
        </AppButton>
      </div>
    </form>
  );
}