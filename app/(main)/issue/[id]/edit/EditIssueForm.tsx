"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { updateIssue } from "./action";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";

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
};

type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
  remark: string;
  receiveItemId: string;
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
  onChange: (value: string) => void;
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

const statusName: Record<string, string> = {
  PENDING: "รอ Admin ตรวจสอบ",
  APPROVED: "เบิกจ่ายแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

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

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function formatThaiFullDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  if (!year || !month || !day) {
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
   DATE FIELD
   รูปแบบเดียวกับ RECEIVE
========================================================= */

type DateFieldProps = {
  id: string;
  name?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function DateField({
  id,
  name,
  value,
  placeholder = "เลือกวันที่",
  disabled = false,
  onChange,
}: DateFieldProps) {
  const dateRef =
    useRef<HTMLInputElement>(null);

  function openCalendar() {
    if (disabled) {
      return;
    }

    const input = dateRef.current;

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
        className={`
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

          pl-4
          pr-2

          shadow-sm

          transition-all
          duration-200

          ${
            disabled
              ? "bg-slate-100"
              : "bg-white hover:border-slate-300 hover:bg-slate-50 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/70"
          }
        `}
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
          disabled={disabled}
          onClick={openCalendar}
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

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          📅
        </button>

        <input
          ref={dateRef}
          id={id}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(event) =>
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
   รูปแบบเดียวกับ RECEIVE
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
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  const filteredOptions =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLocaleLowerCase("th");

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) =>
          option.label
            .toLocaleLowerCase("th")
            .includes(keyword) ||
          option.value
            .toLocaleLowerCase("th")
            .includes(keyword)
      );
    }, [options, search]);

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
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

    return () => {
      window.clearTimeout(timer);
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
            (current) => !current
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
          disabled:border-slate-200
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

      {open && !disabled && (
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
              ref={inputRef}
              type="text"
              value={search}
              autoComplete="off"
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Escape"
                ) {
                  setOpen(false);
                  setSearch("");
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

                  setOpen(false);
                  setSearch("");
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
                (option) => {
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

                        setOpen(false);
                        setSearch("");
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
                        {option.label}
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
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   EDIT ISSUE FORM
========================================================= */

export default function EditIssueForm({
  issue,
  departments,
  materials,
}: Props) {
  const isPending =
    issue.status === "PENDING";

  /* =======================================================
     STATE
  ======================================================= */

  const [issueDate, setIssueDate] =
    useState(
      toDateInputValue(
        issue.issueDate
      )
    );

  const [
    departmentId,
    setDepartmentId,
  ] = useState(
    String(
      issue.departmentId ?? ""
    )
  );

  const [items, setItems] =
    useState<IssueRow[]>(() => {
      const rows: IssueRow[] =
        issue.items.map(
          (item) => ({
            category:
              item.material
                .category ?? "",

            materialId: String(
              item.materialId
            ),

            qty: String(
              item.qty
            ),

            remark:
              item.remark ?? "",

            receiveItemId:
              item.receiveItemId !=
              null
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

        copy[index] = {
          ...copy[index],
          [key]: value,
        };

        if (key === "category") {
          copy[index].materialId =
            "";

          copy[index].receiveItemId =
            "";

          copy[index].qty = "";
        }

        if (
          key === "materialId"
        ) {
          copy[index].receiveItemId =
            "";

          copy[index].qty = "";
        }

        return copy;
      }
    );
  }

  /* =======================================================
     CENTRAL-LIKE INPUT CLASSES
     สำหรับ input HTML ที่ยังไม่มี component กลาง
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

    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:!text-slate-500
  `;

  const tableInputClass = `
    h-[52px]
    w-full
    min-w-0

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

    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:!text-slate-500
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      action={
        isPending
          ? updateIssue
          : undefined
      }
      className="
        relative
        w-full
        min-w-0

        space-y-6

        overflow-visible
      "
    >
      <input
        type="hidden"
        name="issueId"
        value={issue.id}
      />

      <input
        type="hidden"
        name="departmentId"
        value={departmentId}
      />

      {/* ===================================================
          STATUS
      =================================================== */}

      <AppCard
        className="
          relative
          z-[300]

          overflow-visible

          p-4

          sm:p-5
        "
      >
        <AppInfoCard>
          <div
            className="
              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-base
                  font-extrabold
                  !text-slate-800
                "
              >
                สถานะใบเบิก
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                สถานะปัจจุบันของเอกสารเบิกจ่ายพัสดุ
              </p>
            </div>

            <div
              className="
                inline-flex
                h-[40px]
                shrink-0
                items-center
                justify-center

                rounded-[14px]

                border
                border-slate-200

                bg-slate-100

                px-4

                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              {statusName[
                issue.status
              ] ?? issue.status}
            </div>
          </div>
        </AppInfoCard>
      </AppCard>

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
            📋
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
              ข้อมูลเอกสาร
            </h2>

            <p
              className="
                mt-0.5

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              แก้ไขวันที่ เลขที่เอกสาร และหน่วยงาน
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-4

            md:grid-cols-3
          "
        >
          {/* วันที่เบิกจ่าย */}

          <AppInfoCard
            className="
              relative
              overflow-visible
            "
          >
            <label
              htmlFor="issueDate"
              className={labelClass}
            >
              วันที่เบิกจ่าย
            </label>

            <DateField
              id="issueDate"
              name="issueDate"
              value={issueDate}
              placeholder="เลือกวันที่เบิกจ่าย"
              disabled={!isPending}
              onChange={
                setIssueDate
              }
            />
          </AppInfoCard>

          {/* เลขที่เอกสาร */}

          <AppInfoCard
            className="
              relative
              overflow-visible
            "
          >
            <label
              htmlFor="documentNo"
              className={labelClass}
            >
              เลขที่เอกสาร
            </label>

            <input
              id="documentNo"
              type="text"
              name="documentNo"
              defaultValue={
                issue.documentNo
              }
              disabled={!isPending}
              className={inputClass}
            />
          </AppInfoCard>

          {/* หน่วยงาน */}

          <AppInfoCard
            className="
              relative
              z-[400]
              overflow-visible
            "
          >
            <label
              htmlFor="departmentIdControl"
              className={labelClass}
            >
              หน่วยงาน / กลุ่มงาน
            </label>

            <SearchableDropdown
              id="departmentIdControl"
              value={departmentId}
              options={
                departmentOptions
              }
              placeholder="-- เลือกหน่วยงาน --"
              searchPlaceholder="พิมพ์ค้นหาหน่วยงาน..."
              emptyText="ไม่พบหน่วยงาน"
              disabled={!isPending}
              onChange={
                setDepartmentId
              }
            />
          </AppInfoCard>
        </div>
      </AppCard>

      {/* ===================================================
          MATERIAL TABLE
      =================================================== */}

      <AppTableCard
        title="รายการพัสดุเบิกจ่าย"
        subtitle="แก้ไขหมวดหมู่ รายการพัสดุ จำนวน และหมายเหตุ"
        badge={`${items.length} รายการ`}
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
            <thead className="relative z-10">
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "จำนวนที่ขอเบิก",
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
              {items.map(
                (row, index) => {
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
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  const materialOptions:
                    SearchableOption[] =
                    filteredMaterials.map(
                      (
                        material
                      ) => ({
                        value: String(
                          material.id
                        ),

                        label: `${material.code} - ${material.name}`,
                      })
                    );

                  const rowZIndex =
                    items.length -
                    index +
                    20;

                  return (
                    <tr
                      key={index}
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
                      {/* ลำดับ */}

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

                      {/* หมวดหมู่ */}

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
                          disabled={
                            !isPending
                          }
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

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          relative
                          min-w-[360px]

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

                        <input
                          type="hidden"
                          name={`items[${index}].receiveItemId`}
                          value={
                            row.receiveItemId
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
                          placeholder={
                            row.category
                              ? "เลือกรายการพัสดุ"
                              : "เลือกหมวดหมู่ก่อน"
                          }
                          searchPlaceholder="พิมพ์ค้นหารายการพัสดุ..."
                          emptyText="ไม่พบรายการพัสดุ"
                          disabled={
                            !isPending ||
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

                      {/* จำนวนที่ขอเบิก */}

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
                          type="number"
                          name={`items[${index}].qty`}
                          value={
                            row.qty
                          }
                          disabled={
                            !isPending
                          }
                          min="1"
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
                          className={`
                            ${tableInputClass}

                            text-center
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* หน่วย */}

                      <td
                        className="
                          min-w-[130px]

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
                            selectedMaterial?.unit ??
                            "-"
                          }
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

                      {/* หมายเหตุ */}

                      <td
                        className="
                          min-w-[240px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
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
                          placeholder="ระบุหมายเหตุ"
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
      </AppTableCard>

      {/* ===================================================
          ACTION
          ใช้ AppButton กลางเท่านั้น
      =================================================== */}

      {isPending && (
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
            บันทึกการแก้ไข
          </AppButton>
        </div>
      )}
    </form>
  );
}