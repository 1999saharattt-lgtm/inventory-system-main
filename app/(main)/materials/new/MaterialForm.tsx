"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MATERIALS } from "@/lib/materials";
import { UNITS } from "@/lib/units";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

/* =========================================================
   TYPES
========================================================= */

type Vendor = {
  id: number;
  name: string;
};

type MaterialMaster = {
  id: number;
  category: string;
  name: string;
  unit: string;
};

type Props = {
  vendors: Vendor[];
  materialMasters: MaterialMaster[];
  initialCategory?: string;
  backHref?: string;
};

type SearchableOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id: string;
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryMap: Record<
  string,
  string
> = {
  "วัสดุสำนักงาน": "OFFICE",
  "วัสดุคอมพิวเตอร์":
    "COMPUTER",
  "วัสดุไฟฟ้าและวิทยุ":
    "ELECTRIC",
  "วัสดุงานบ้านและงานครัว":
    "HOUSEHOLD",
  "วัสดุยานพาหนะ":
    "VEHICLE",
  "วัสดุสื่อสิ่งพิมพ์":
    "PRINTING",
};

const categoryCodeToName =
  Object.fromEntries(
    Object.entries(
      categoryMap
    ).map(([name, code]) => [
      code,
      name,
    ])
  ) as Record<string, string>;

/* =========================================================
   SEARCHABLE SELECT
========================================================= */

function SearchableSelect({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  disabled = false,
  required = false,
  onChange,
}: SearchableSelectProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  /* =======================================================
     SELECTED OPTION
  ======================================================= */

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  /* =======================================================
     FILTER
  ======================================================= */

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
            .includes(keyword)
      );
    }, [options, search]);

  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

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

  /* =======================================================
     FOCUS SEARCH
  ======================================================= */

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

  /* =======================================================
     UI
  ======================================================= */

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
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => {}}
          required
          className="
            pointer-events-none
            absolute
            h-px
            w-px
            opacity-0
          "
        />
      )}

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
                  const active =
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
                        active
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
                          active
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

                      {active && (
                        <span
                          aria-hidden="true"
                          className="!text-white"
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
                ไม่พบข้อมูลที่ค้นหา
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MATERIAL FORM
========================================================= */

export default function MaterialForm({
  vendors,
  materialMasters,
  initialCategory = "",
  backHref = "/materials",
}: Props) {
  /* =======================================================
     STATE
  ======================================================= */

  const initialCategoryName =
    categoryCodeToName[
      initialCategory
    ] ?? "";

  const [vendorId, setVendorId] =
    useState("");

  const [category, setCategory] =
    useState(
      initialCategoryName
    );

  const [name, setName] =
    useState("");

  const [newName, setNewName] =
    useState("");

  const [newUnit, setNewUnit] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* =======================================================
     OPTIONS
  ======================================================= */

  const vendorOptions =
    useMemo<
      SearchableOption[]
    >(
      () =>
        vendors.map(
          (vendor) => ({
            value: String(
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
        Object.keys(
          categoryMap
        ).map((item) => ({
          value: item,
          label: item,
        })),
      []
    );

  /* =======================================================
     MATERIAL NAMES
  ======================================================= */

  const names =
    useMemo(() => {
      if (!category) {
        return [];
      }

      const oldNames =
        MATERIALS[
          category as keyof typeof MATERIALS
        ] ?? [];

      const newNames =
        materialMasters
          .filter(
            (item) =>
              item.category ===
              categoryMap[
                category
              ]
          )
          .map(
            (item) =>
              item.name
          );

      return Array.from(
        new Set([
          ...oldNames,
          ...newNames,
        ])
      );
    }, [
      category,
      materialMasters,
    ]);

  const materialOptions =
    useMemo<
      SearchableOption[]
    >(
      () => [
        ...names.map(
          (item) => ({
            value: item,
            label: item,
          })
        ),

        {
          value: "__NEW__",
          label:
            "+ เพิ่มรายการใหม่...",
        },
      ],
      [names]
    );

  /* =======================================================
     UNIT
  ======================================================= */

  const unit =
    name === "__NEW__"
      ? newUnit.trim()
      : UNITS[name] ??
        materialMasters.find(
          (item) =>
            item.name ===
              name &&
            item.category ===
              categoryMap[
                category
              ]
        )?.unit ??
        "";

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData =
      new FormData(
        e.currentTarget
      );

    const materialName =
      name === "__NEW__"
        ? newName.trim()
        : name;

    if (
      !categoryMap[
        category
      ]
    ) {
      alert(
        "กรุณาเลือกหมวดหมู่"
      );
      return;
    }

    if (!materialName) {
      alert(
        "กรุณาระบุชื่อรายการพัสดุ"
      );
      return;
    }

    if (!unit) {
      alert(
        "กรุณาระบุหน่วย"
      );
      return;
    }

    const body = {
      vendorId: vendorId
        ? Number(vendorId)
        : null,

      category:
        categoryMap[
          category
        ],

      name: materialName,

      unit,

      balance: Number(
        formData.get(
          "balance"
        )
      ),

      latestPrice: Number(
        Number(
          formData.get(
            "latestPrice"
          )
        ).toFixed(2)
      ),
    };

    try {
      setIsSubmitting(
        true
      );

      const res =
        await fetch(
          "/api/materials",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              body
            ),
          }
        );

      if (res.ok) {
        window.location.href =
          `/materials/category/${categoryMap[category]}`;

        return;
      }

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      alert(
        data?.message ??
          "บันทึกไม่สำเร็จ"
      );
    } catch (error) {
      console.error(
        "เกิดข้อผิดพลาดในการบันทึกพัสดุ:",
        error
      );

      alert(
        "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /* =======================================================
     STANDARD FIELD CLASSES
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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        relative
        w-full
        min-w-0

        space-y-6

        overflow-visible
      "
    >
      {/* =====================================================
          MATERIAL INFORMATION
          ใช้ AppCard กลาง
      ===================================================== */}

      <AppCard
        className="
          relative

          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            CARD TITLE
        =================================================== */}

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
              min-w-0
            "
          >
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900

                sm:text-xl
              "
            >
              ข้อมูลพัสดุ
            </h2>

            <p
              className="
                mt-0.5

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุรายละเอียดของพัสดุที่ต้องการเพิ่ม
            </p>
          </div>
        </div>

        {/* ===================================================
            FORM GRID
        =================================================== */}

        <div
          className="
            grid
            min-w-0
            gap-4

            md:grid-cols-2
          "
        >
          {/* =================================================
              VENDOR
          ================================================= */}

          <AppInfoCard
            className="
              relative
              z-[500]
              overflow-visible
            "
          >
            <label
              htmlFor="vendorId"
              className={
                labelClass
              }
            >
              ผู้จำหน่าย
            </label>

            <SearchableSelect
              id="vendorId"
              value={vendorId}
              options={
                vendorOptions
              }
              placeholder="เลือกผู้จำหน่าย"
              searchPlaceholder="พิมพ์ค้นหาผู้จำหน่าย..."
              onChange={
                setVendorId
              }
            />
          </AppInfoCard>

          {/* =================================================
              CATEGORY
          ================================================= */}

          <AppInfoCard
            className="
              relative
              z-[400]
              overflow-visible
            "
          >
            <label
              htmlFor="category"
              className={
                labelClass
              }
            >
              หมวดหมู่
            </label>

            <SearchableSelect
              id="category"
              value={category}
              options={
                categoryOptions
              }
              placeholder="เลือกหมวดหมู่"
              searchPlaceholder="พิมพ์ค้นหาหมวดหมู่..."
              required
              onChange={(
                value
              ) => {
                setCategory(
                  value
                );

                setName("");
                setNewName("");
                setNewUnit("");
              }}
            />
          </AppInfoCard>

          {/* =================================================
              MATERIAL
          ================================================= */}

          <AppInfoCard
            className="
              relative
              z-[300]
              overflow-visible

              md:col-span-2
            "
          >
            <label
              htmlFor="materialName"
              className={
                labelClass
              }
            >
              รายการพัสดุ
            </label>

            <SearchableSelect
              id="materialName"
              value={name}
              options={
                materialOptions
              }
              placeholder={
                category
                  ? "เลือกรายการพัสดุ"
                  : "กรุณาเลือกหมวดหมู่ก่อน"
              }
              searchPlaceholder="พิมพ์ค้นหารายการพัสดุ..."
              disabled={
                !category
              }
              required
              onChange={(
                value
              ) => {
                setName(value);

                if (
                  value !==
                  "__NEW__"
                ) {
                  setNewName(
                    ""
                  );
                  setNewUnit(
                    ""
                  );
                }
              }}
            />
          </AppInfoCard>

          {/* =================================================
              NEW MATERIAL
          ================================================= */}

          {name ===
            "__NEW__" && (
            <AppInfoCard
              className="
                relative
                z-[200]

                overflow-visible

                md:col-span-2
              "
            >
              <div
                className="
                  grid
                  gap-4

                  md:grid-cols-2
                "
              >
                <div>
                  <label
                    htmlFor="newName"
                    className={
                      labelClass
                    }
                  >
                    ชื่อรายการใหม่
                  </label>

                  <input
                    id="newName"
                    type="text"
                    value={
                      newName
                    }
                    onChange={(
                      event
                    ) =>
                      setNewName(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="กรอกชื่อรายการพัสดุใหม่"
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="newUnit"
                    className={
                      labelClass
                    }
                  >
                    หน่วย
                  </label>

                  <input
                    id="newUnit"
                    type="text"
                    value={
                      newUnit
                    }
                    onChange={(
                      event
                    ) =>
                      setNewUnit(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="เช่น ชิ้น, กล่อง, อัน"
                    required
                    className={
                      inputClass
                    }
                  />
                </div>
              </div>
            </AppInfoCard>
          )}

          {/* =================================================
              BALANCE
          ================================================= */}

          <AppInfoCard>
            <label
              htmlFor="balance"
              className={
                labelClass
              }
            >
              จำนวน
            </label>

            <input
              id="balance"
              type="number"
              name="balance"
              defaultValue={0}
              min="0"
              className={`
                ${inputClass}

                text-center
                tabular-nums
              `}
            />
          </AppInfoCard>

          {/* =================================================
              UNIT
          ================================================= */}

          <AppInfoCard>
            <label
              htmlFor="unit"
              className={
                labelClass
              }
            >
              หน่วย
            </label>

            <input
              id="unit"
              type="text"
              value={unit}
              readOnly
              placeholder="เลือกพัสดุเพื่อแสดงหน่วย"
              className="
                h-[52px]
                w-full
                min-w-0

                cursor-default

                rounded-[16px]

                border
                border-slate-200

                bg-slate-100

                px-4

                text-base
                font-extrabold
                !text-slate-700

                outline-none

                placeholder:!text-slate-400
              "
            />
          </AppInfoCard>

          {/* =================================================
              PRICE
          ================================================= */}

          <AppInfoCard
            className="
              md:col-span-2
            "
          >
            <label
              htmlFor="latestPrice"
              className={
                labelClass
              }
            >
              ราคาล่าสุด
            </label>

            <div className="relative">
              <input
                id="latestPrice"
                type="number"
                name="latestPrice"
                defaultValue="0.00"
                step="0.01"
                min="0"
                className={`
                  ${inputClass}

                  pr-16
                  text-right
                  tabular-nums
                `}
              />

              <div
                className="
                  pointer-events-none

                  absolute
                  inset-y-0
                  right-4

                  flex
                  items-center

                  text-sm
                  font-extrabold
                  !text-slate-500
                "
              >
                บาท
              </div>
            </div>
          </AppInfoCard>
        </div>
      </AppCard>

      {/* =====================================================
          ACTIONS
          ใช้ AppButton กลางทั้งหมด
      ===================================================== */}

      <div
        className="
          flex
          flex-col-reverse
          gap-3

          sm:flex-row
          sm:justify-end
        "
      >
        <AppButton
          href={backHref}
          variant="secondary"
          size="md"
          className="
            w-full
            sm:w-auto
          "
        >
          ยกเลิก
        </AppButton>

        <AppButton
          type="submit"
          variant="success"
          size="md"
          disabled={
            isSubmitting
          }
          icon={
            isSubmitting ? (
              <span
                className="
                  h-4
                  w-4
                  animate-spin

                  rounded-full

                  border-2
                  border-current
                  border-t-transparent
                "
              />
            ) : (
              <span
                aria-hidden="true"
              >
                💾
              </span>
            )
          }
          className="
            w-full
            sm:w-auto
          "
        >
          {isSubmitting
            ? "กำลังบันทึก..."
            : "บันทึก"}
        </AppButton>
      </div>
    </form>
  );
}