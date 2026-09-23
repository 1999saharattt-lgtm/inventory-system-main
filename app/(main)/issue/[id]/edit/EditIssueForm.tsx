"use client";

import {
  useMemo,
  useState,
} from "react";

import AppButton from "@/components/AppButton";

import { updateIssue } from "./action";

/* =========================================================
   TYPES
========================================================= */

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

type IssueItem = {
  materialId: number;
  qty: number;
  remark: string | null;
  receiveItemId: number | null;

  material: {
    category: string;
  };
};

type Issue = {
  id: number;
  issueDate: Date | string;
  documentNo: string;
  departmentId: number;
  status: string;
  items: IssueItem[];
};

type Props = {
  issue: Issue;
  departments: Department[];
  materials: Material[];
  receiveItems: ReceiveItem[];

  /*
   * true  = ADMIN สามารถเปลี่ยนกลุ่มงานได้
   * false = ผู้ใช้งานทั่วไป ล็อกกลุ่มงาน
   */
  canChangeDepartment: boolean;
};

type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
  receiveItemId: string;
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
   STATUS
========================================================= */

const statusName: Record<
  string,
  string
> = {
  PENDING: "รอ Admin ตรวจสอบ",
  APPROVED: "เบิกจ่ายแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

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
   DATE -> YYYY-MM-DD
========================================================= */

function toDateInputValue(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    const match =
      value.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
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
  ).padStart(2, "0")} ${
    thaiMonths[
      month - 1
    ]
  } ${year + 543}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EditIssueForm({
  issue,
  departments,
  materials,
  receiveItems,
  canChangeDepartment,
}: Props) {
  /* =======================================================
     PERMISSION
  ======================================================= */

  const isPending =
    issue.status ===
    "PENDING";

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const [
    departmentId,
    setDepartmentId,
  ] = useState(
    String(
      issue.departmentId ??
        ""
    )
  );

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
  ] = useState(
    issue.documentNo
  );

  /* =======================================================
     ISSUE DATE
  ======================================================= */

  const [
    issueDate,
    setIssueDate,
  ] = useState(
    toDateInputValue(
      issue.issueDate
    )
  );

  /* =======================================================
     ROWS

     ให้จำนวนแถวเหมือน /issue/create = 18 แถว
  ======================================================= */

  const [rows, setRows] =
    useState<IssueRow[]>(
      () => {
        const initialRows =
          issue.items.map(
            (item) => ({
              category:
                item.material
                  .category ??
                "",

              materialId:
                String(
                  item.materialId
                ),

              qty:
                String(
                  item.qty
                ),

              remark:
                item.remark ??
                "",

              receiveItemId:
                item.receiveItemId !=
                null
                  ? String(
                      item.receiveItemId
                    )
                  : "",
            })
          );

        while (
          initialRows.length <
          18
        ) {
          initialRows.push({
            category: "",
            materialId: "",
            qty: "",
            remark: "",
            receiveItemId:
              "",
          });
        }

        return initialRows;
      }
    );

  /* =======================================================
     AVAILABLE MATERIAL IDS

     เก็บ receiveItems ไว้ตาม logic เดิม
     และใช้ตรวจว่าพัสดุมีล็อตคงเหลือ

     รายการเดิมในใบเบิกยังคงแสดงได้
  ======================================================= */

  const availableMaterialIds =
    useMemo(() => {
      return new Set(
        receiveItems.map(
          (item) =>
            item.materialId
        )
      );
    }, [receiveItems]);

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  function updateRow(
    index: number,
    key: keyof IssueRow,
    value: string
  ) {
    if (!isPending) {
      return;
    }

    setRows(
      (currentRows) => {
        const copy =
          currentRows.map(
            (row) => ({
              ...row,
            })
          );

        copy[index] = {
          ...copy[index],
          [key]: value,
        };

        /* -------------------------------------------------
           เปลี่ยนหมวดหมู่
        ------------------------------------------------- */

        if (
          key === "category"
        ) {
          copy[
            index
          ].materialId = "";

          copy[
            index
          ].receiveItemId =
            "";

          copy[index].qty =
            "";
        }

        /* -------------------------------------------------
           เปลี่ยนพัสดุ
        ------------------------------------------------- */

        if (
          key ===
          "materialId"
        ) {
          copy[
            index
          ].receiveItemId =
            "";

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
    <div
      className="
        w-full
        min-w-0
        bg-white
      "
    >
      <form
        action={
          isPending
            ? updateIssue
            : undefined
        }
        className="space-y-6"
      >
        {/* =================================================
            HIDDEN ISSUE ID
        ================================================= */}

        <input
          type="hidden"
          name="issueId"
          value={issue.id}
        />

        {/* =================================================
            DOCUMENT NUMBER
            แบบเดียวกับ /issue/create
            อยู่ด้านบนขวา
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
              onChange={(
                event
              ) =>
                setDocumentValue(
                  event.target
                    .value
                )
              }
              readOnly={
                !editDocumentNo ||
                !isPending
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
                read-only:!text-slate-700
              "
            />

            {isPending && (
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
                  onChange={(
                    event
                  ) => {
                    const checked =
                      event.target
                        .checked;

                    setEditDocumentNo(
                      checked
                    );

                    if (
                      !checked
                    ) {
                      setDocumentValue(
                        issue.documentNo
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
            )}
          </div>
        </div>

        {/* =================================================
            FORM TITLE
            แบบเดียวกับ /issue/create
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

          <div
            className="
              mt-3
              flex
              justify-center
            "
          >
            <span
              className={`
                inline-flex
                items-center
                justify-center

                rounded-full

                border

                px-4
                py-1.5

                text-sm
                font-extrabold

                ${
                  issue.status ===
                  "PENDING"
                    ? "border-amber-200 bg-amber-50 !text-amber-800"
                    : issue.status ===
                        "APPROVED"
                      ? "border-emerald-200 bg-emerald-50 !text-emerald-800"
                      : issue.status ===
                          "REJECTED"
                        ? "border-red-200 bg-red-50 !text-red-800"
                        : "border-slate-200 bg-slate-50 !text-slate-700"
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

        {/* =================================================
            DOCUMENT INFORMATION
            โครงเดียวกับ /issue/create
        ================================================= */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
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
                value={
                  issueDate
                }
                onChange={(
                  event
                ) =>
                  setIssueDate(
                    event.target
                      .value
                  )
                }
                disabled={
                  !isPending
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
                  disabled:cursor-not-allowed
                "
              />

              <div
                className={`
                  flex
                  h-11
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-300
                  px-3
                  text-sm
                  font-bold
                  shadow-sm

                  ${
                    isPending
                      ? "bg-white !text-slate-900"
                      : "bg-slate-100 !text-slate-500"
                  }
                `}
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
                USER:
                disabled select ไม่ส่งค่า
                จึงส่ง departmentId ผ่าน hidden input

                ADMIN:
                select ส่งค่าปกติ
            ------------------------------------------------ */}

            {(!canChangeDepartment ||
              !isPending) && (
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
                canChangeDepartment &&
                isPending
                  ? "departmentId"
                  : undefined
              }
              value={
                departmentId
              }
              disabled={
                !canChangeDepartment ||
                !isPending
              }
              required={
                canChangeDepartment &&
                isPending
              }
              onChange={(
                event
              ) => {
                if (
                  !canChangeDepartment ||
                  !isPending
                ) {
                  return;
                }

                setDepartmentId(
                  event.target
                    .value
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
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:bg-slate-100
                disabled:!text-slate-500
              "
            >
              {canChangeDepartment &&
                isPending && (
                  <option value="">
                    -- เลือกหน่วยงาน --
                  </option>
                )}

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
          </div>
        </div>

        {/* =================================================
            MATERIAL TABLE

            เหมือน /issue/create

            7 ช่อง:
            1. ลำดับ
            2. หมวดหมู่
            3. รายการพัสดุ
            4. จำนวนที่ขอเบิก
            5. จำนวนที่เบิกจ่าย
            6. หน่วย
            7. หมายเหตุ
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
            {/* ===============================================
                HEADER
            =============================================== */}

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

            {/* ===============================================
                BODY
            =============================================== */}

            <tbody>
              {rows.map(
                (
                  row,
                  index
                ) => {
                  /*
                   * รายการพัสดุในหมวด
                   *
                   * - รายการเดิมต้องแสดงได้เสมอ
                   * - รายการอื่นให้เลือกจากพัสดุที่มีล็อตคงเหลือ
                   */

                  const filteredMaterials =
                    materials.filter(
                      (
                        material
                      ) => {
                        if (
                          material.category !==
                          row.category
                        ) {
                          return false;
                        }

                        if (
                          String(
                            material.id
                          ) ===
                          row.materialId
                        ) {
                          return true;
                        }

                        return availableMaterialIds.has(
                          material.id
                        );
                      }
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
                          disabled={
                            !isPending
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "category",
                              event.target
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
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                            disabled:!text-slate-500
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
                          disabled={
                            !isPending ||
                            !row.category
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "materialId",
                              event.target
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
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                            disabled:!text-slate-500
                          "
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
                          disabled={
                            !isPending
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "qty",
                              event.target
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
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                            disabled:!text-slate-500
                          "
                        />
                      </td>

                      {/* =====================================
                          ISSUED QTY

                          หน้าแก้ไขใบเบิก
                          ไม่แก้จำนวนที่พัสดุจ่าย
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
                            index + 1
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
                            index + 1
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
                          disabled={
                            !isPending
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "remark",
                              event.target
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
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                            disabled:!text-slate-500
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

        {isPending && (
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
              บันทึกการแก้ไข
            </AppButton>
          </div>
        )}
      </form>
    </div>
  );
}