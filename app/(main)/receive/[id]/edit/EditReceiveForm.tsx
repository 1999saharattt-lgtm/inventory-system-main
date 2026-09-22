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
   THAI SHORT DATE
   ตัวอย่าง 22 ก.ย. 69
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

  if (
    Number.isNaN(date.getTime())
  ) {
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
   SEARCHABLE DROPDOWN

   มาตรฐาน Dropdown ของระบบ
   - พิมพ์ค้นหาได้
   - ไม่มีรูปแว่นขยาย
   - กรอบดำ
   - Dropdown แสดงเหนือส่วนอื่น
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

  /* =========================================================
     SELECTED OPTION
  ========================================================= */

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  /* =========================================================
     FILTER OPTIONS
  ========================================================= */

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
            .includes(keyword) ||
          option.value
            .toLocaleLowerCase(
              "th"
            )
            .includes(keyword)
      );
    }, [options, search]);

  /* =========================================================
     CLICK OUTSIDE
  ========================================================= */

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

  /* =========================================================
     AUTO FOCUS
  ========================================================= */

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
      className="
        relative
        z-[60]
        w-full
        min-w-0
      "
    >
      {/* =====================================================
          CONTROL
      ===================================================== */}

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
          min-h-[52px]
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
          py-3

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
            !text-slate-700

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

      {/* =====================================================
          DROPDOWN PANEL
      ===================================================== */}

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]

            z-[9999]

            overflow-hidden

            rounded-[16px]

            border
            !border-black

            bg-white

            shadow-[0_18px_45px_-20px_rgba(15,23,42,0.45)]
          "
        >
          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="
              border-b
              border-black
              bg-slate-50
              p-3
            "
          >
            <input
              ref={inputRef}
              type="text"
              value={search}
              autoComplete="off"
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
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
                min-h-[46px]
                w-full

                rounded-[12px]

                border
                !border-black

                bg-white

                px-4
                py-2.5

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
          </div>

          {/* =================================================
              OPTIONS
          ================================================= */}

          <div
            role="listbox"
            className="
              max-h-[260px]
              overflow-y-auto
              overscroll-contain
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

                        setOpen(
                          false
                        );

                        setSearch("");
                      }}
                      className={`
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-3

                        rounded-[10px]

                        px-3
                        py-2.5

                        text-left
                        text-base
                        font-bold

                        transition-colors

                        ${
                          selected
                            ? `
                              bg-slate-900
                              !text-white
                            `
                            : `
                              bg-white
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
                          aria-hidden="true"
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
                item.material
                  .category,

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

  /* =========================================================
     UPDATE ROW
  ========================================================= */

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

  /* =========================================================
     OPTIONS
  ========================================================= */

  const vendorOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        vendors.map(
          (vendor) => ({
            value:
              String(
                vendor.id
              ),
            label:
              vendor.name,
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

  /* =========================================================
     SHARED CLASSES
  ========================================================= */

  const labelClass = `
    mb-2
    block

    text-sm
    font-extrabold
    !text-slate-800

    sm:text-base
  `;

  const inputClass = `
    min-h-[52px]
    w-full
    min-w-0

    rounded-[16px]

    border
    !border-black

    bg-white

    px-4
    py-3

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
    min-h-[42px]

    rounded-[12px]

    border
    !border-black

    bg-white

    px-3
    py-2

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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      action={updateReceive}
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
        name="receiveId"
        value={receive.id}
      />

      <input
        type="hidden"
        name="vendorId"
        value={vendorId}
      />

      {/* =====================================================
          DOCUMENT INFORMATION
      ===================================================== */}

      <section
        className="
          relative
          z-[50]

          overflow-visible

          rounded-[24px]

          border
          border-slate-300

          bg-white/80

          p-4

          shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]

          backdrop-blur-2xl

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

              bg-blue-50

              text-xl

              shadow-sm

              ring-1
              ring-blue-100
            "
          >
            🧾
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                !text-slate-900

                sm:text-xl
              "
            >
              ข้อมูลการรับเข้า
            </h2>

            <p
              className="
                mt-0.5

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              แก้ไขวันที่ เอกสาร และผู้จำหน่าย
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-5

            md:grid-cols-2
          "
        >
          {/* =================================================
              วันที่รับเข้า
          ================================================= */}

          <div className="min-w-0">
            <label
              htmlFor="receiveDate"
              className={
                labelClass
              }
            >
              วันที่รับเข้า
            </label>

            <div
              className="
                relative
                min-h-[52px]
                w-full
              "
            >
              <input
                type="hidden"
                name="receiveDate"
                value={receiveDate}
              />

              <input
                id="receiveDate"
                type="date"
                value={receiveDate}
                onChange={(
                  event
                ) =>
                  setReceiveDate(
                    event.target
                      .value
                  )
                }
                className="
                  absolute
                  inset-0

                  z-20

                  h-full
                  w-full

                  cursor-pointer

                  opacity-0
                "
              />

              <div
                className="
                  flex
                  min-h-[52px]
                  w-full
                  items-center
                  justify-between
                  gap-3

                  rounded-[16px]

                  border
                  !border-black

                  bg-white

                  px-4
                  py-3

                  text-base
                  font-bold
                  !text-slate-900

                  shadow-sm

                  transition-all
                  duration-200

                  hover:bg-slate-50
                "
              >
                <span
                  className={`
                    min-w-0
                    flex-1
                    truncate

                    ${
                      receiveDate
                        ? "!text-slate-900"
                        : "!text-slate-400"
                    }
                  `}
                >
                  {receiveDate
                    ? formatThaiShortDate(
                        receiveDate
                      )
                    : "เลือกวันที่รับเข้า"}
                </span>

                <span
                  aria-hidden="true"
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center

                    rounded-[11px]

                    bg-slate-100

                    text-xl
                  "
                >
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              เลขที่เอกสาร
          ================================================= */}

          <div className="min-w-0">
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
              defaultValue={
                receive.documentNo
              }
              className={
                inputClass
              }
            />
          </div>

          {/* =================================================
              ผู้จำหน่าย
          ================================================= */}

          <div
            className="
              relative
              z-[100]

              min-w-0

              md:col-span-2
            "
          >
            <label
              htmlFor="vendorIdControl"
              className={
                labelClass
              }
            >
              ผู้จำหน่าย
            </label>

            <SearchableDropdown
              id="vendorIdControl"
              value={vendorId}
              options={
                vendorOptions
              }
              placeholder="เลือกผู้จำหน่าย"
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
          MATERIAL TABLE
      ===================================================== */}

      <section
        className="
          relative
          z-10

          w-full
          min-w-0

          overflow-visible

          rounded-[24px]

          border
          border-slate-300

          bg-white/85

          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            TABLE HEADER
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2

            border-b
            border-black

            bg-white/70

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
                mt-0.5

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
              border-slate-300

              bg-slate-100/80

              px-3
              py-1.5

              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            <span>
              ทั้งหมด
            </span>

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

        {/* ===================================================
            TABLE
        =================================================== */}

        <div
          className="
            w-full
            min-w-0

            overflow-x-auto
            overflow-y-visible

            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1280px]

              border-collapse

              border
              border-black

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
                  "หน่วย",
                  "จำนวน",
                  "ราคาต่อหน่วย",
                  "วันผลิต",
                  "วันหมดอายุ",
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
                        text-base
                        font-extrabold
                        !text-white

                        sm:text-lg
                      "
                    >
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {items.map(
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

                        label: `${material.code} - ${material.name}`,
                      })
                    );

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
                          ลำดับ
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
                          หมวดหมู่
                      ===================================== */}

                      <td
                        className="
                          relative

                          min-w-[210px]

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

                      {/* =====================================
                          รายการพัสดุ
                      ===================================== */}

                      <td
                        className="
                          relative

                          min-w-[320px]

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

                      {/* =====================================
                          หน่วย
                      ===================================== */}

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
                            min-h-[52px]
                            w-full

                            cursor-default

                            rounded-[16px]

                            border
                            !border-black

                            bg-slate-100

                            px-3
                            py-3

                            text-center
                            text-base
                            font-extrabold
                            !text-slate-700

                            outline-none
                          "
                        />
                      </td>

                      {/* =====================================
                          จำนวน
                      ===================================== */}

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
                          value={
                            row.qty
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
                          className={`
                            ${tableInputClass}

                            min-h-[52px]
                            w-full

                            text-center
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* =====================================
                          ราคาต่อหน่วย
                      ===================================== */}

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

                            min-h-[52px]
                            w-full

                            text-right
                            tabular-nums
                          `}
                        />
                      </td>

                      {/* =====================================
                          วันผลิต
                      ===================================== */}

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
                        <div
                          className="
                            relative
                            min-h-[52px]
                            w-full
                          "
                        >
                          <input
                            type="hidden"
                            name={`items[${index}].manufacture`}
                            value={
                              row.manufacture
                            }
                          />

                          <input
                            type="date"
                            value={
                              row.manufacture
                            }
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                index,
                                "manufacture",
                                event
                                  .target
                                  .value
                              )
                            }
                            className="
                              absolute
                              inset-0

                              z-20

                              h-full
                              w-full

                              cursor-pointer

                              opacity-0
                            "
                          />

                          <div
                            className="
                              flex
                              min-h-[52px]
                              w-full
                              items-center
                              justify-between
                              gap-2

                              rounded-[16px]

                              border
                              !border-black

                              bg-white

                              px-3
                              py-3

                              text-sm
                              font-bold
                              !text-slate-900

                              shadow-sm
                            "
                          >
                            <span
                              className={`
                                min-w-0
                                flex-1
                                whitespace-nowrap

                                ${
                                  row.manufacture
                                    ? "!text-slate-900"
                                    : "!text-slate-400"
                                }
                              `}
                            >
                              {row.manufacture
                                ? formatThaiShortDate(
                                    row.manufacture
                                  )
                                : "เลือกวันที่"}
                            </span>

                            <span
                              aria-hidden="true"
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center

                                rounded-[10px]

                                bg-slate-100

                                text-lg
                              "
                            >
                              📅
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* =====================================
                          วันหมดอายุ
                      ===================================== */}

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
                        <div
                          className="
                            relative
                            min-h-[52px]
                            w-full
                          "
                        >
                          <input
                            type="hidden"
                            name={`items[${index}].expiry`}
                            value={
                              row.expiry
                            }
                          />

                          <input
                            type="date"
                            value={
                              row.expiry
                            }
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                index,
                                "expiry",
                                event
                                  .target
                                  .value
                              )
                            }
                            className="
                              absolute
                              inset-0

                              z-20

                              h-full
                              w-full

                              cursor-pointer

                              opacity-0
                            "
                          />

                          <div
                            className="
                              flex
                              min-h-[52px]
                              w-full
                              items-center
                              justify-between
                              gap-2

                              rounded-[16px]

                              border
                              !border-black

                              bg-white

                              px-3
                              py-3

                              text-sm
                              font-bold
                              !text-slate-900

                              shadow-sm
                            "
                          >
                            <span
                              className={`
                                min-w-0
                                flex-1
                                whitespace-nowrap

                                ${
                                  row.expiry
                                    ? "!text-slate-900"
                                    : "!text-slate-400"
                                }
                              `}
                            >
                              {row.expiry
                                ? formatThaiShortDate(
                                    row.expiry
                                  )
                                : "เลือกวันที่"}
                            </span>

                            <span
                              aria-hidden="true"
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center

                                rounded-[10px]

                                bg-slate-100

                                text-lg
                              "
                            >
                              📅
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
      </section>

      {/* =====================================================
          REMARK
      ===================================================== */}

      <section
        className="
          rounded-[24px]

          border
          border-slate-300

          bg-white/80

          p-4

          shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]

          backdrop-blur-2xl

          sm:p-5
        "
      >
        <label
          htmlFor="remark"
          className={
            labelClass
          }
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

          border-t
          border-slate-300

          pt-6
        "
      >
        <AppButton
          type="submit"
          variant="success"
          size="md"
          icon={
            <span>💾</span>
          }
        >
          บันทึกการแก้ไข
        </AppButton>
      </div>
    </form>
  );
}