"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createIssue } from "./action";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";

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
};

type ItemRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
};

type SearchableOption = {
  value: string;
  label: string;
};

type SearchableDropdownProps = {
  id: string;
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  onChange: (
    value: string
  ) => void;
};

/* =========================================================
   CATEGORY
========================================================= */

const categories = [
  {
    value: "OFFICE",
    label: "วัสดุสำนักงาน",
  },
  {
    value: "COMPUTER",
    label:
      "วัสดุคอมพิวเตอร์",
  },
  {
    value: "ELECTRIC",
    label:
      "วัสดุไฟฟ้าและวิทยุ",
  },
  {
    value: "HOUSEHOLD",
    label:
      "วัสดุงานบ้านและงานครัว",
  },
  {
    value: "VEHICLE",
    label:
      "วัสดุยานพาหนะ",
  },
  {
    value: "PRINTING",
    label:
      "วัสดุสื่อสิ่งพิมพ์",
  },
];

/* =========================================================
   THAI DATE
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

function getCurrentDate() {
  const now = new Date();

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

function formatThaiFullDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  return `${day} ${
    thaiMonths[
      month - 1
    ]
  } ${year + 543}`;
}

/* =========================================================
   DATE FIELD
========================================================= */

type DateFieldProps = {
  id: string;
  name?: string;
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
};

function DateField({
  id,
  name,
  value,
  placeholder = "เลือกวันที่",
  onChange,
}: DateFieldProps) {
  const dateRef =
    useRef<HTMLInputElement>(
      null
    );

  function openCalendar() {
    const input =
      dateRef.current;

    if (!input) {
      return;
    }

    try {
      if (
        typeof input.showPicker ===
        "function"
      ) {
        input.showPicker();
      } else {
        input.focus();
        input.click();
      }
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <div
      className="
        relative
        h-[52px]
        w-full
        min-w-0
      "
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
        />
      )}

      <div
        className="
          flex
          h-[52px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3

          rounded-[16px]

          border
          border-slate-200

          bg-white

          pl-4
          pr-2

          shadow-sm

          transition-all
          duration-200

          hover:border-slate-300
          hover:bg-slate-50

          focus-within:border-blue-300
          focus-within:ring-4
          focus-within:ring-blue-100/70
        "
      >
        <span
          className={`
            min-w-0
            flex-1
            truncate

            text-base
            font-bold

            ${
              value
                ? "!text-slate-900"
                : "!text-slate-400"
            }
          `}
        >
          {value
            ? formatThaiFullDate(
                value
              )
            : placeholder}
        </span>

        <button
          type="button"
          aria-label="เปิดปฏิทิน"
          onClick={
            openCalendar
          }
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center

            rounded-[11px]

            bg-slate-100

            text-lg

            shadow-inner

            transition-all
            duration-200

            hover:bg-slate-200

            active:scale-[0.96]

            focus:outline-none
            focus:ring-4
            focus:ring-blue-100
          "
        >
          📅
        </button>

        <input
          ref={dateRef}
          id={id}
          type="date"
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          tabIndex={-1}
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-0
            right-0
            h-px
            w-px
            opacity-0
          "
        />
      </div>
    </div>
  );
}

/* =========================================================
   SEARCHABLE DROPDOWN
========================================================= */

function SearchableDropdown({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  onChange,
}: SearchableDropdownProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [open, setOpen] =
    useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const selectedOption =
    options.find(
      (option) =>
        option.value ===
        value
    );

  const filteredOptions =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLocaleLowerCase(
            "th"
          );

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) =>
          option.label
            .toLocaleLowerCase(
              "th"
            )
            .includes(
              keyword
            ) ||
          option.value
            .toLocaleLowerCase(
              "th"
            )
            .includes(
              keyword
            )
      );
    }, [
      options,
      search,
    ]);

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          inputRef.current?.focus();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`
        relative
        w-full
        min-w-0

        ${
          open
            ? "z-[9999]"
            : "z-10"
        }
      `}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) {
            return;
          }

          setOpen(
            (current) =>
              !current
          );
        }}
        className="
          flex
          h-[52px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3

          rounded-[16px]

          border
          border-slate-200

          bg-white

          px-4

          text-left
          text-base
          font-bold
          !text-slate-900

          shadow-sm
          outline-none

          transition-all
          duration-200

          hover:border-slate-300
          hover:bg-slate-50

          focus:border-blue-300
          focus:ring-4
          focus:ring-blue-100/70

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:!text-slate-400
        "
      >
        <span
          className={`
            min-w-0
            flex-1
            truncate

            ${
              selectedOption
                ? "!text-slate-900"
                : "!text-slate-400"
            }
          `}
        >
          {selectedOption?.label ??
            placeholder}
        </span>

        <span
          aria-hidden="true"
          className={`
            shrink-0
            text-xs
            !text-slate-500

            transition-transform
            duration-200

            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        >
          ▼
        </span>
      </button>

      {open &&
        !disabled && (
          <div
            className="
              absolute
              left-0
              right-0
              top-[calc(100%+8px)]

              z-[99999]

              overflow-hidden

              rounded-[20px]

              border
              border-slate-200

              bg-white/95

              shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35)]

              backdrop-blur-2xl
            "
          >
            <div
              className="
                border-b
                border-slate-200

                bg-slate-50/90

                p-3
              "
            >
              <input
                ref={
                  inputRef
                }
                type="text"
                value={
                  search
                }
                autoComplete="off"
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Escape"
                  ) {
                    setOpen(
                      false
                    );
                    setSearch(
                      ""
                    );
                  }

                  if (
                    event.key ===
                      "Enter" &&
                    filteredOptions.length ===
                      1
                  ) {
                    event.preventDefault();

                    onChange(
                      filteredOptions[0]
                        .value
                    );

                    setOpen(
                      false
                    );
                    setSearch(
                      ""
                    );
                  }
                }}
                placeholder={
                  searchPlaceholder
                }
                className="
                  h-[46px]
                  w-full

                  rounded-[14px]

                  border
                  border-slate-200

                  bg-white

                  px-4

                  text-base
                  font-bold
                  !text-slate-900

                  shadow-sm
                  outline-none

                  placeholder:!text-slate-400

                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-100/70
                "
              />
            </div>

            <div
              role="listbox"
              className="
                max-h-[280px]

                overflow-y-auto
                overscroll-contain

                bg-white

                p-2
              "
            >
              {filteredOptions.length >
              0 ? (
                filteredOptions.map(
                  (
                    option
                  ) => {
                    const selected =
                      option.value ===
                      value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        role="option"
                        aria-selected={
                          selected
                        }
                        onClick={() => {
                          onChange(
                            option.value
                          );

                          setOpen(
                            false
                          );
                          setSearch(
                            ""
                          );
                        }}
                        className={`
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3

                          rounded-[12px]

                          px-3
                          py-2.5

                          text-left
                          text-base
                          font-bold

                          transition-colors

                          ${
                            selected
                              ? "bg-slate-900 !text-white"
                              : "bg-white !text-slate-900 hover:bg-slate-100"
                          }
                        `}
                      >
                        <span
                          className="
                            min-w-0
                            flex-1
                            break-words
                          "
                        >
                          {
                            option.label
                          }
                        </span>

                        {selected && (
                          <span className="!text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )
              ) : (
                <div
                  className="
                    px-4
                    py-8

                    text-center
                    text-sm
                    font-bold
                    !text-slate-500
                  "
                >
                  {
                    emptyText
                  }
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

/* =========================================================
   ISSUE FORM
========================================================= */

export default function IssueForm({
  materials,
  receiveLots,
  departments,
  officers,
  documentNo,
  initialDepartmentId,
}: Props) {
  /* =======================================================
     DEFAULT DEPARTMENT
  ======================================================= */

  const defaultDepartmentId =
    initialDepartmentId ||
    (departments.length ===
    1
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

  const [
    officerId,
    setOfficerId,
  ] = useState("");

  const [
    editDocumentNo,
    setEditDocumentNo,
  ] = useState(false);

  const [
    documentValue,
    setDocumentValue,
  ] = useState(
    documentNo
  );

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
  ] = useState<ItemRow[]>(
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
     OPTIONS
  ======================================================= */

  const departmentOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        departments.map(
          (department) => ({
            value: String(
              department.id
            ),
            label:
              department.name,
          })
        ),
      [departments]
    );

  const officerOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        filteredOfficers.map(
          (officer) => ({
            value: String(
              officer.id
            ),
            label: `${officer.firstName} ${officer.lastName}`,
          })
        ),
      [filteredOfficers]
    );

  const categoryOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        categories.map(
          (category) => ({
            value:
              category.value,
            label:
              category.label,
          })
        ),
      []
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

        copy[index] = {
          ...copy[index],
          [key]: value,
        };

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
     CENTRAL FORM CLASSES
     รูปแบบเดียวกับ RECEIVE
  ======================================================= */

  const labelClass = `
    mb-2
    block

    text-base
    font-extrabold
    !text-slate-800
  `;

  const inputClass = `
    h-[52px]
    w-full
    min-w-0

    rounded-[16px]

    border
    border-slate-200

    bg-white

    px-4

    text-base
    font-bold
    !text-slate-900

    shadow-sm
    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-300
    hover:bg-slate-50

    focus:border-blue-300
    focus:ring-4
    focus:ring-blue-100/70
  `;

  const tableInputClass = `
    h-[52px]

    rounded-[16px]

    border
    border-slate-200

    bg-white

    px-3

    text-sm
    font-bold
    !text-slate-900

    shadow-sm
    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-300
    hover:bg-slate-50

    focus:border-blue-300
    focus:ring-4
    focus:ring-blue-100/70
  `;

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
          HIDDEN VALUES
      =================================================== */}

      <input
        type="hidden"
        name="departmentId"
        value={departmentId}
      />

      <input
        type="hidden"
        name="officerId"
        value={officerId}
      />

      {/* ===================================================
          DOCUMENT INFORMATION
      =================================================== */}

      <AppCard
        className="
          relative
          z-[200]

          overflow-visible

          p-4

          sm:p-5
        "
      >
        <div
          className="
            mb-5

            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center

              rounded-[15px]

              bg-blue-50/90

              text-xl

              shadow-sm

              ring-1
              ring-blue-100/80
            "
          >
            📄
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900

                sm:text-xl
              "
            >
              ข้อมูลใบเบิก
            </h2>

            <p
              className="
                mt-0.5

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              พอ.101 • ใบเบิกพัสดุ
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-4

            md:grid-cols-2
          "
        >
          {/* ===============================================
              DOCUMENT NUMBER
          =============================================== */}

          <AppInfoCard
            className="
              relative
              overflow-visible
            "
          >
            <label
              htmlFor="documentNo"
              className={
                labelClass
              }
            >
              เลขที่เอกสาร
            </label>

            <input
              id="documentNo"
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
                !editDocumentNo
              }
              className={`
                ${inputClass}

                ${
                  !editDocumentNo
                    ? "cursor-default bg-slate-100"
                    : ""
                }
              `}
            />

            <label
              className="
                mt-3
                flex
                w-fit
                cursor-pointer
                items-center
                gap-2

                text-sm
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
          </AppInfoCard>

          {/* ===============================================
              ISSUE DATE
          =============================================== */}

          <AppInfoCard
            className="
              relative
              overflow-visible
            "
          >
            <label
              htmlFor="issueDate"
              className={
                labelClass
              }
            >
              วันที่เบิก
            </label>

            <DateField
              id="issueDate"
              name="issueDate"
              value={issueDate}
              placeholder="เลือกวันที่เบิก"
              onChange={
                setIssueDate
              }
            />
          </AppInfoCard>

          {/* ===============================================
              DEPARTMENT
          =============================================== */}

          <AppInfoCard
            className="
              relative
              z-[500]
              overflow-visible
            "
          >
            <label
              htmlFor="departmentIdControl"
              className={
                labelClass
              }
            >
              หน่วยงาน / กลุ่มงาน
            </label>

            <SearchableDropdown
              id="departmentIdControl"
              value={
                departmentId
              }
              options={
                departmentOptions
              }
              placeholder="-- เลือกหน่วยงาน / กลุ่มงาน --"
              searchPlaceholder="พิมพ์ค้นหาหน่วยงาน / กลุ่มงาน..."
              emptyText="ไม่พบหน่วยงาน / กลุ่มงาน"
              onChange={(
                value
              ) => {
                setDepartmentId(
                  value
                );

                setOfficerId(
                  ""
                );
              }}
            />
          </AppInfoCard>

          {/* ===============================================
              OFFICER
          =============================================== */}

          <AppInfoCard
            className="
              relative
              z-[400]
              overflow-visible
            "
          >
            <label
              htmlFor="officerIdControl"
              className={
                labelClass
              }
            >
              ผู้ขอเบิก
            </label>

            <SearchableDropdown
              id="officerIdControl"
              value={
                officerId
              }
              options={
                officerOptions
              }
              placeholder="-- เลือกผู้ขอเบิก --"
              searchPlaceholder="พิมพ์ค้นหาผู้ขอเบิก..."
              emptyText="ไม่พบผู้ขอเบิก"
              disabled={
                !departmentId
              }
              onChange={
                setOfficerId
              }
            />
          </AppInfoCard>
        </div>
      </AppCard>

      {/* ===================================================
          DESCRIPTION
      =================================================== */}

      <AppCard
        className="
          relative
          z-10

          p-4

          sm:p-5
        "
      >
        <p
          className="
            text-base
            font-bold
            leading-relaxed
            !text-slate-800

            sm:text-lg
          "
        >
          ประสงค์จะขอเบิกสิ่งของต่างๆ
          สำหรับใช้ในราชการ
          ดังมีรายการต่อไปนี้
        </p>
      </AppCard>

      {/* ===================================================
          TABLE
      =================================================== */}

      <AppTableCard
        title="รายการพัสดุที่ขอเบิก"
        subtitle="พอ.101 • ระบุหมวดหมู่ รายการพัสดุ และจำนวนที่ต้องการเบิก"
        badge={`${rows.length} รายการ`}
        className="
          relative
          z-10
          overflow-visible
        "
      >
        <div
          className="
            relative
            w-full
            min-w-0

            overflow-x-auto
            overflow-y-visible
            overscroll-x-contain
          "
        >
          <table
            className="
              relative
              w-full
              min-w-[1200px]

              border-collapse

              bg-white

              text-sm
            "
          >
            <thead
              className="
                relative
                z-10
              "
            >
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "จำนวนที่ขอเบิก",
                  "จำนวนที่เบิกจ่าย",
                  "หน่วย",
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
                  )
                )}
              </tr>
            </thead>

            <tbody className="relative">
              {rows.map(
                (
                  row,
                  index
                ) => {
                  const filteredMaterials =
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
                    selectedMaterial?.unit ??
                    "";

                  const materialOptions:
                    SearchableOption[] =
                    filteredMaterials.map(
                      (
                        material
                      ) => ({
                        value:
                          String(
                            material.id
                          ),
                        label:
                          material.code
                            ? `${material.code} - ${material.name}`
                            : material.name,
                      })
                    );

                  const rowZIndex =
                    rows.length -
                    index +
                    20;

                  return (
                    <tr
                      key={
                        index
                      }
                      style={{
                        position:
                          "relative",
                        zIndex:
                          rowZIndex,
                      }}
                      className={`
                        ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* ===================================
                          INDEX
                      =================================== */}

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
                        {index +
                          1}
                      </td>

                      {/* ===================================
                          CATEGORY
                      =================================== */}

                      <td
                        className="
                          relative
                          min-w-[220px]

                          overflow-visible

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <SearchableDropdown
                          id={`category-${index}`}
                          value={
                            row.category
                          }
                          options={
                            categoryOptions
                          }
                          placeholder="เลือกหมวดหมู่"
                          searchPlaceholder="พิมพ์ค้นหาหมวดหมู่..."
                          emptyText="ไม่พบหมวดหมู่"
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              index,
                              "category",
                              value
                            )
                          }
                        />
                      </td>

                      {/* ===================================
                          MATERIAL
                      =================================== */}

                      <td
                        className="
                          relative
                          min-w-[340px]

                          overflow-visible

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="hidden"
                          name={`items[${index}].materialId`}
                          value={
                            row.materialId
                          }
                        />

                        <SearchableDropdown
                          id={`material-${index}`}
                          value={
                            row.materialId
                          }
                          options={
                            materialOptions
                          }
                          placeholder="เลือกรายการพัสดุ"
                          searchPlaceholder="พิมพ์ค้นหารายการพัสดุ..."
                          emptyText="ไม่พบรายการพัสดุ"
                          disabled={
                            !row.category
                          }
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              index,
                              "materialId",
                              value
                            )
                          }
                        />
                      </td>

                      {/* ===================================
                          REQUEST QTY
                      =================================== */}

                      <td
                        className="
                          min-w-[160px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
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
                            event
                          ) =>
                            updateRow(
                              index,
                              "qty",
                              event
                                .target
                                .value
                            )
                          }
                          className={`
                            ${tableInputClass}

                            w-full

                            text-center
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* ===================================
                          APPROVED QTY
                      =================================== */}

                      <td
                        className="
                          min-w-[160px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="text"
                          readOnly
                          value=""
                          className="
                            h-[52px]
                            w-full

                            cursor-default

                            rounded-[16px]

                            border
                            border-slate-200

                            bg-slate-100

                            px-3

                            text-center
                            text-base
                            font-extrabold
                            !text-slate-700

                            outline-none
                          "
                        />
                      </td>

                      {/* ===================================
                          UNIT
                      =================================== */}

                      <td
                        className="
                          min-w-[140px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="text"
                          readOnly
                          value={
                            unit ||
                            "-"
                          }
                          aria-label={`หน่วยของรายการที่ ${
                            index +
                            1
                          }`}
                          className="
                            h-[52px]
                            w-full

                            cursor-default

                            rounded-[16px]

                            border
                            border-slate-200

                            bg-slate-100

                            px-3

                            text-center
                            text-base
                            font-extrabold
                            !text-slate-700

                            outline-none
                          "
                        />

                        <input
                          type="hidden"
                          name={`items[${index}].unit`}
                          value={
                            unit
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
      </AppTableCard>

      {/* ===================================================
          ACTION
      =================================================== */}

      <div
        className="
          flex
          justify-end

          pt-1
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