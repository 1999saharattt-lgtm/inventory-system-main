"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AppButton from "@/components/AppButton";

import { createReceive } from "./actions";

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

type Props = {
  vendors: Vendor[];
  materials: Material[];
  documentNo: string;
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
  compact?: boolean;
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

function formatThaiDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = dateString
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
    thaiMonths[month - 1]
  } ${year + 543}`;
}

function getTodayInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(
      today.getMonth() + 1
    ).padStart(2, "0"),
    String(
      today.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

/* =========================================================
   SEARCHABLE DROPDOWN

   มาตรฐานของระบบ
   - พิมพ์ค้นหาได้
   - ไม่มีแว่นขยายในช่องค้นหา
   - กรอบดำ
========================================================= */

function SearchableDropdown({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  compact = false,
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
      window.clearTimeout(
        timer
      );
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
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
        className={`
          flex
          w-full
          items-center
          justify-between
          gap-3

          ${
            compact
              ? "min-h-[40px] rounded-[12px] px-3 py-2"
              : "min-h-[52px] rounded-[16px] px-4 py-3"
          }

          border-2
          !border-black

          bg-white

          text-left
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
          disabled:opacity-70
        `}
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

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-[200]

            overflow-hidden

            rounded-[16px]

            border-2
            !border-black

            bg-white

            shadow-[0_18px_45px_-20px_rgba(15,23,42,0.45)]
          "
        >
          <div
            className="
              border-b-2
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
                  event.target.value
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

                border-2
                !border-black

                bg-white

                px-4
                py-2.5

                text-base
                font-bold
                !text-slate-900

                shadow-sm
                outline-none

                placeholder:!text-slate-400

                focus:!border-black
                focus:ring-4
                focus:ring-slate-900/10
              "
            />
          </div>

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

                        setOpen(false);
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
   DATE PICKER CONTROL

   แสดงผลเป็นกล่องแบบ iOS
   ใช้ native date input overlay เพื่อคงระบบเลือกวันที่
========================================================= */

function DatePickerControl({
  name,
  value,
  onChange,
  compact = false,
}: {
  name: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="date"
        name={name}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
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
        className={`
          flex
          w-full
          items-center
          justify-between
          gap-3

          ${
            compact
              ? "min-h-[40px] rounded-[12px] px-3"
              : "min-h-[52px] rounded-[16px] px-4"
          }

          border-2
          !border-black

          bg-white

          font-bold
          !text-slate-900

          shadow-sm

          transition-all
          duration-200
        `}
      >
        <span
          className="
            min-w-0
            flex-1
            whitespace-nowrap
          "
        >
          {value
            ? formatThaiDate(
                value
              )
            : "เลือกวันที่"}
        </span>

        <span
          aria-hidden="true"
          className={`
            flex
            shrink-0
            items-center
            justify-center

            rounded-[10px]

            bg-slate-100

            shadow-inner

            ${
              compact
                ? "h-8 w-8 text-lg"
                : "h-10 w-10 text-2xl"
            }
          `}
        >
          📅
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   FORM
========================================================= */

export default function ReceiveForm({
  vendors,
  materials,
  documentNo,
}: Props) {
  const emptyRow =
    (): ReceiveRow => ({
      category: "",
      materialId: "",
      qty: "",
      unitPrice: "",
      manufacture: "",
      expiry: "",
    });

  const [items, setItems] =
    useState<ReceiveRow[]>(
      Array.from(
        {
          length: 15,
        },
        emptyRow
      )
    );

  const [
    isOpeningBalance,
    setIsOpeningBalance,
  ] = useState(false);

  const [
    documentValue,
    setDocumentValue,
  ] = useState(documentNo);

  const [
    receiveDate,
    setReceiveDate,
  ] = useState(
    getTodayInputValue()
  );

  const [vendorId, setVendorId] =
    useState("");

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

  function updateRow(
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) {
    const copy = [...items];

    copy[index] = {
      ...copy[index],
      [key]: value,
    };

    if (key === "category") {
      copy[index].materialId =
        "";
    }

    setItems(copy);
  }

  /* =========================================================
     SHARED INPUT
  ========================================================= */

  const inputClass = `
    min-h-[52px]
    w-full

    rounded-[16px]

    border-2
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
    min-h-[40px]

    rounded-[12px]

    border-2
    !border-black

    bg-white

    px-3

    font-bold
    !text-slate-900

    shadow-sm
    outline-none

    focus:!border-black
    focus:ring-4
    focus:ring-slate-900/10
  `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      action={createReceive}
      className="
        w-full
        min-w-0
        space-y-6
      "
    >
      {/* =====================================================
          HIDDEN VENDOR
      ===================================================== */}

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
          overflow-visible

          rounded-[24px]

          border
          border-slate-300

          bg-white/75

          p-4

          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]

          backdrop-blur-xl

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
              ระบุวันที่ เอกสาร และผู้จำหน่าย
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            items-start
            gap-5
            md:grid-cols-2
          "
        >
          {/* ===============================================
              วันที่รับเข้า
          =============================================== */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              วันที่รับเข้า
            </label>

            <DatePickerControl
              name="receiveDate"
              value={receiveDate}
              onChange={
                setReceiveDate
              }
            />
          </div>

          {/* ===============================================
              เลขที่เอกสาร
          =============================================== */}

          <div className="min-w-0">
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              เลขที่เอกสาร
            </label>

            <input
              type="text"
              name="documentNo"
              value={documentValue}
              readOnly={
                !isOpeningBalance
              }
              onChange={(event) =>
                setDocumentValue(
                  event.target.value
                )
              }
              className={`
                ${inputClass}
                font-extrabold
                !text-blue-700
              `}
            />

            <div
              className="
                mt-3
                flex
                min-h-[32px]
                items-center
              "
            >
              <label
                className="
                  inline-flex
                  w-fit
                  cursor-pointer
                  items-center
                  gap-2.5

                  whitespace-nowrap

                  rounded-full

                  border
                  border-slate-300

                  bg-white

                  px-3
                  py-1.5

                  text-sm
                  font-bold
                  !text-slate-700

                  shadow-sm
                "
              >
                <input
                  type="checkbox"
                  checked={
                    isOpeningBalance
                  }
                  onChange={(
                    event
                  ) => {
                    const checked =
                      event.target
                        .checked;

                    setIsOpeningBalance(
                      checked
                    );

                    setDocumentValue(
                      checked
                        ? "ยอดยกเข้าระบบ"
                        : documentNo
                    );
                  }}
                  className="
                    h-4
                    w-4
                    shrink-0
                    cursor-pointer
                    accent-blue-600
                  "
                />

                <span className="whitespace-nowrap">
                  ยอดยกเข้าระบบ
                </span>
              </label>
            </div>
          </div>

          {/* ===============================================
              ผู้จำหน่าย
          =============================================== */}

          <div
            className="
              min-w-0
              md:col-span-2
            "
          >
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              ผู้จำหน่าย
            </label>

            <SearchableDropdown
              id="vendorIdDropdown"
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
          ตารางรายการรับเข้า
      ===================================================== */}

      <section
        className="
          overflow-visible

          rounded-[24px]

          border
          border-slate-300

          bg-white/80

          shadow-[0_16px_40px_-26px_rgba(15,23,42,0.35)]

          backdrop-blur-xl
        "
      >
        {/* ===================================================
            TABLE TITLE
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2

            border-b
            border-black

            bg-white/80

            px-4
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-5
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-black
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
              ระบุรายการ ราคา จำนวน
              และข้อมูลวันผลิต/หมดอายุ
            </p>
          </div>

          <span
            className="
              inline-flex
              w-fit
              items-center

              rounded-full

              border
              border-slate-300

              bg-slate-100/80

              px-3
              py-1.5

              text-xs
              font-extrabold
              !text-slate-600
            "
          >
            15 รายการ
          </span>
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
              min-w-[1200px]
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
                  "ราคา",
                  "จำนวน",
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

            <tbody>
              {items.map(
                (row, index) => {
                  const list =
                    materials.filter(
                      (material) =>
                        material.category ===
                        row.category
                    );

                  const selected =
                    materials.find(
                      (material) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );

                  const materialOptions: SearchableOption[] =
                    list.map(
                      (material) => ({
                        value: String(
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
                          index % 2 === 0
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
                          min-w-[190px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          type="hidden"
                          name={`items[${index}].category`}
                          value={
                            row.category
                          }
                        />

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
                          compact
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
                          min-w-[290px]
                          border
                          border-black
                          px-3
                          py-3
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
                          compact
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
                          value={
                            selected?.unit ??
                            "-"
                          }
                          className="
                            min-h-[40px]
                            w-full
                            min-w-[90px]

                            rounded-[12px]

                            border-2
                            !border-black

                            bg-slate-100

                            px-2

                            text-center
                            font-extrabold
                            !text-slate-700

                            outline-none
                          "
                        />
                      </td>

                      {/* =====================================
                          ราคา
                      ===================================== */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
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
                            w-28
                            text-center
                          `}
                        />
                      </td>

                      {/* =====================================
                          จำนวน
                      ===================================== */}

                      <td
                        className="
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
                            w-24
                            text-center
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
                        "
                      >
                        <DatePickerControl
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
                        "
                      >
                        <DatePickerControl
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
          rounded-[24px]
          border
          border-slate-300
          bg-white/75
          p-4
          shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]
          backdrop-blur-xl
          sm:p-5
        "
      >
        <label
          className="
            mb-2
            block
            text-base
            font-extrabold
            !text-slate-800
          "
        >
          หมายเหตุ
        </label>

        <textarea
          name="remark"
          placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
          className="
            min-h-[120px]
            w-full
            resize-y

            rounded-[16px]

            border-2
            !border-black

            bg-white

            p-4

            font-bold
            !text-slate-900

            shadow-sm
            outline-none

            transition-all
            duration-200

            placeholder:!text-slate-400

            focus:!border-black
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

          pt-5
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
          บันทึก
        </AppButton>
      </div>
    </form>
  );
}