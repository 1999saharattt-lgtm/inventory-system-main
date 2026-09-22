"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { updateReceive } from "./actions";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Vendor = {
  id: number;
  name: string;
};

type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
};

type ReceiveRow = {
  category: string;
  materialId: string;
  qty: string;
  unitPrice: string;
  manufacture: string;
  expiry: string;
};

type ReceiveItem = {
  materialId: number;
  qty: number;
  unitPrice: number | string;
  manufacture: Date | string | null;
  expiry: Date | string | null;

  material: {
    category: string;
  };
};

type Receive = {
  id: number;
  receiveDate: Date | string;
  documentNo: string;
  vendorId: number;
  remark: string | null;
  items: ReceiveItem[];
};

type Props = {
  receive: Receive;
  vendors: Vendor[];
  materials: Material[];
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
   THAI DATE
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const thaiYear = String(
    year + 543
  ).slice(-2);

  return `${String(day).padStart(
    2,
    "0"
  )} ${
    thaiShortMonths[month - 1]
  } ${thaiYear}`;
}

/* =========================================================
   DATE INPUT VALUE
========================================================= */

function toDateInputValue(
  value: Date | string | null
) {
  if (!value) {
    return "";
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

/* =========================================================
   DATE FIELD
   มาตรฐานปฏิทินของระบบ
========================================================= */

type DateFieldProps = {
  id: string;
  name?: string;
  value: string;
  placeholder?: string;
  compact?: boolean;
  onChange: (value: string) => void;
};

function DateField({
  id,
  name,
  value,
  placeholder = "เลือกวันที่",
  compact = false,
  onChange,
}: DateFieldProps) {
  const dateRef =
    useRef<HTMLInputElement>(null);

  function openCalendar() {
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
        className="
          flex
          h-[52px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-2

          rounded-[16px]

          border
          !border-black

          bg-white

          pl-4
          pr-2

          shadow-sm

          transition-all
          duration-200

          hover:bg-slate-50

          focus-within:ring-4
          focus-within:ring-slate-900/10
        "
      >
        <span
          className={`
            min-w-0
            flex-1
            truncate

            ${
              compact
                ? "text-sm"
                : "text-base"
            }

            font-bold

            ${
              value
                ? "!text-slate-900"
                : "!text-slate-400"
            }
          `}
        >
          {value
            ? formatThaiShortDate(
                value
              )
            : placeholder}
        </span>

        <button
          type="button"
          aria-label="เปิดปฏิทิน"
          onClick={openCalendar}
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center

            rounded-[11px]

            border
            border-slate-200

            bg-slate-100/90

            text-lg

            shadow-sm

            transition-all
            duration-200

            hover:bg-slate-200

            active:scale-95

            focus:outline-none
            focus:ring-4
            focus:ring-slate-900/10
          "
        >
          📅
        </button>

        <input
          ref={dateRef}
          id={id}
          type="date"
          value={value}
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
            ? "z-[999]"
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
          !border-black

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

          hover:bg-slate-50

          focus:!border-black
          focus:bg-white
          focus:ring-4
          focus:ring-slate-900/10

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:!text-slate-400
          disabled:opacity-70
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
            !text-slate-600

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

            z-[9999]

            overflow-hidden

            rounded-[18px]

            border
            !border-black

            bg-white/95

            shadow-[0_24px_60px_-16px_rgba(15,23,42,0.48)]

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

                rounded-[12px]

                border
                !border-black

                bg-white

                px-4

                text-base
                font-bold
                !text-slate-900

                shadow-sm
                outline-none

                placeholder:!text-slate-400

                focus:ring-4
                focus:ring-slate-900/10
              "
            />
          </div>

          <div
            role="listbox"
            className="
              max-h-[280px]
              overflow-y-auto
              overscroll-contain

              bg-white/95

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

                        transition-all
                        duration-150

                        ${
                          selected
                            ? `
                              bg-slate-900
                              !text-white
                              shadow-sm
                            `
                            : `
                              bg-transparent
                              !text-slate-900
                              hover:bg-slate-100
                            `
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
                        <span
                          className="
                            shrink-0
                            !text-white
                          "
                        >
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
   EDIT RECEIVE FORM
========================================================= */

export default function EditReceiveForm({
  receive,
  vendors,
  materials,
}: Props) {
  const [receiveDate, setReceiveDate] =
    useState(
      toDateInputValue(
        receive.receiveDate
      )
    );

  const [vendorId, setVendorId] =
    useState(
      String(
        receive.vendorId ?? ""
      )
    );

  const [items, setItems] =
    useState<ReceiveRow[]>(
      () => {
        const rows: ReceiveRow[] =
          receive.items.map(
            (item) => ({
              category:
                item.material.category,

              materialId:
                String(
                  item.materialId
                ),

              qty: String(
                item.qty
              ),

              unitPrice:
                Number(
                  item.unitPrice
                ).toFixed(2),

              manufacture:
                item.manufacture
                  ? toDateInputValue(
                      item.manufacture
                    )
                  : "",

              expiry:
                item.expiry
                  ? toDateInputValue(
                      item.expiry
                    )
                  : "",
            })
          );

        while (
          rows.length < 15
        ) {
          rows.push({
            category: "",
            materialId: "",
            qty: "",
            unitPrice: "",
            manufacture: "",
            expiry: "",
          });
        }

        return rows;
      }
    );

  function updateRow(
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) {
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

        if (
          key === "category"
        ) {
          copy[index].materialId =
            "";
        }

        return copy;
      }
    );
  }

  const vendorOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        vendors.map(
          (vendor) => ({
            value:
              String(vendor.id),
            label: vendor.name,
          })
        ),
      [vendors]
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
    !border-black

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

    hover:bg-slate-50

    focus:!border-black
    focus:bg-white
    focus:ring-4
    focus:ring-slate-900/10
  `;

  const tableInputClass = `
    h-[52px]

    rounded-[16px]

    border
    !border-black

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

    hover:bg-slate-50

    focus:!border-black
    focus:bg-white
    focus:ring-4
    focus:ring-slate-900/10
  `;

  return (
    <form
      action={updateReceive}
      className="
        relative
        w-full
        min-w-0
        space-y-4
        overflow-visible
      "
    >
      <input
        type="hidden"
        name="receiveId"
        value={receive.id}
      />

      <input
        type="hidden"
        name="vendorId"
        value={vendorId}
      />

      {/* =====================================================
          ข้อมูลการรับเข้า
      ===================================================== */}

      <section
        className="
          relative
          z-[200]

          overflow-visible

          rounded-[28px]

          border
          border-slate-200/90

          bg-white/80

          p-4

          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl

          sm:p-5
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            -z-10
            h-40
            w-40
            rounded-full
            bg-blue-400/[0.07]
            blur-3xl
          "
        />

        <div
          className="
            grid
            min-w-0
            gap-5

            md:grid-cols-2
          "
        >
          {/* วันที่รับเข้า */}

          <div className="min-w-0">
            <label
              htmlFor="receiveDate"
              className={labelClass}
            >
              วันที่รับเข้า
            </label>

            <DateField
              id="receiveDate"
              name="receiveDate"
              value={receiveDate}
              placeholder="เลือกวันที่รับเข้า"
              onChange={
                setReceiveDate
              }
            />
          </div>

          {/* เลขที่เอกสาร */}

          <div className="min-w-0">
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
                receive.documentNo
              }
              className={inputClass}
            />
          </div>

          {/* ผู้จำหน่าย */}

          <div
            className="
              relative
              z-[300]
              min-w-0

              md:col-span-2
            "
          >
            <label
              htmlFor="vendorIdControl"
              className={labelClass}
            >
              ผู้จำหน่าย
            </label>

            <SearchableDropdown
              id="vendorIdControl"
              value={vendorId}
              options={
                vendorOptions
              }
              placeholder="-- เลือกผู้จำหน่าย --"
              searchPlaceholder="พิมพ์ค้นหาผู้จำหน่าย..."
              emptyText="ไม่พบผู้จำหน่าย"
              onChange={
                setVendorId
              }
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          ตารางรายการ
      ===================================================== */}

      <section
        className="
          relative
          z-10

          w-full
          min-w-0

          overflow-visible

          rounded-[28px]

          border
          border-slate-200/90

          bg-white/80

          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2

            px-5
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
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
              รายการพัสดุรับเข้า
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              แก้ไขรายการ ราคา จำนวน และข้อมูลวันผลิต/หมดอายุ
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2

              rounded-full

              border
              border-slate-200

              bg-slate-100/80

              px-3
              py-1.5

              text-sm
              font-extrabold
              !text-slate-700

              shadow-sm
            "
          >
            <span>ทั้งหมด</span>

            <span
              className="
                inline-flex
                min-w-6
                items-center
                justify-center

                rounded-full

                bg-white

                px-2
                py-0.5

                !text-slate-900

                shadow-sm
              "
            >
              {items.length}
            </span>
          </div>
        </div>

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
              min-w-[1280px]

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
                  "หน่วย",
                  "จำนวน",
                  "ราคาต่อหน่วย",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title) => (
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
                ))}
              </tr>
            </thead>

            <tbody className="relative">
              {items.map(
                (row, index) => {
                  const filteredMaterials =
                    materials.filter(
                      (material) =>
                        material.category ===
                        row.category
                    );

                  const selectedMaterial =
                    materials.find(
                      (material) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  const materialOptions:
                    SearchableOption[] =
                    filteredMaterials.map(
                      (material) => ({
                        value:
                          String(
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
                          index % 2 ===
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
                          min-w-[210px]

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

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          relative
                          min-w-[320px]

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

                      {/* หน่วย */}

                      <td
                        className="
                          min-w-[120px]

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
                            !border-black

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

                      {/* จำนวน */}

                      <td
                        className="
                          min-w-[120px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="number"
                          min="1"
                          name={`items[${index}].qty`}
                          value={row.qty}
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

                            w-full
                            text-center
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* ราคาต่อหน่วย */}

                      <td
                        className="
                          min-w-[150px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`items[${index}].unitPrice`}
                          value={
                            row.unitPrice
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "unitPrice",
                              event.target
                                .value
                            )
                          }
                          className={`
                            ${tableInputClass}

                            w-full
                            text-right
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* วันผลิต */}

                      <td
                        className="
                          min-w-[190px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <DateField
                          id={`manufacture-${index}`}
                          name={`items[${index}].manufacture`}
                          value={
                            row.manufacture
                          }
                          compact
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              index,
                              "manufacture",
                              value
                            )
                          }
                        />
                      </td>

                      {/* วันหมดอายุ */}

                      <td
                        className="
                          min-w-[190px]

                          border
                          border-black

                          px-3
                          py-3

                          align-top
                        "
                      >
                        <DateField
                          id={`expiry-${index}`}
                          name={`items[${index}].expiry`}
                          value={
                            row.expiry
                          }
                          compact
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              index,
                              "expiry",
                              value
                            )
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
      </section>

      {/* =====================================================
          หมายเหตุ
      ===================================================== */}

      <section
        className="
          relative

          rounded-[28px]

          border
          border-slate-200/90

          bg-white/80

          p-4

          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl

          sm:p-5
        "
      >
        <label
          htmlFor="remark"
          className={labelClass}
        >
          หมายเหตุ
        </label>

        <textarea
          id="remark"
          name="remark"
          rows={4}
          defaultValue={
            receive.remark ?? ""
          }
          placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
          className="
            min-h-[120px]
            w-full

            resize-y

            rounded-[16px]

            border
            !border-black

            bg-white

            p-4

            text-base
            font-bold
            !text-slate-900

            shadow-sm
            outline-none

            transition-all
            duration-200

            placeholder:!text-slate-400

            hover:bg-slate-50

            focus:!border-black
            focus:bg-white
            focus:ring-4
            focus:ring-slate-900/10
          "
        />
      </section>

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div
        className="
          flex
          justify-end
          pt-2
        "
      >
        <AppButton
          type="submit"
          variant="success"
          size="md"
          icon={<span>💾</span>}
        >
          บันทึก
        </AppButton>
      </div>
    </form>
  );
}