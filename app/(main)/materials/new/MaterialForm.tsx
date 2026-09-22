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
  "วัสดุคอมพิวเตอร์": "COMPUTER",
  "วัสดุไฟฟ้าและวิทยุ": "ELECTRIC",
  "วัสดุงานบ้านและงานครัว":
    "HOUSEHOLD",
  "วัสดุยานพาหนะ": "VEHICLE",
  "วัสดุสื่อสิ่งพิมพ์":
    "PRINTING",
};

const categoryCodeToName =
  Object.fromEntries(
    Object.entries(categoryMap).map(
      ([name, code]) => [
        code,
        name,
      ]
    )
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
  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const containerRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  /* =========================================================
     SELECTED OPTION
  ========================================================= */

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredOptions =
    useMemo(() => {
      const keyword =
        search.trim().toLocaleLowerCase(
          "th"
        );

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) =>
          option.label
            .toLocaleLowerCase("th")
            .includes(keyword)
      );
    }, [options, search]);

  /* =========================================================
     CLOSE WHEN CLICK OUTSIDE
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
     FOCUS SEARCH
  ========================================================= */

  useEffect(() => {
    if (!open) {
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Hidden field for required validation */}

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

      {/* ===============================================
          CONTROL
      =============================================== */}

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

          setOpen((current) => {
            const next = !current;

            if (!next) {
              setSearch("");
            }

            return next;
          });
        }}
        className="
          flex
          min-h-[50px]
          w-full
          items-center
          justify-between
          gap-3
          rounded-[16px]
          border-2
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

          hover:!border-black
          hover:bg-slate-50

          focus:!border-black
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

      {/* ===============================================
          DROPDOWN
      =============================================== */}

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-50
            overflow-hidden
            rounded-[16px]
            border-2
            !border-black
            bg-white
            shadow-[0_18px_45px_-20px_rgba(15,23,42,0.45)]
          "
        >
          {/* =============================================
              SEARCH INPUT
          ============================================= */}

          <div
            className="
              border-b
              border-slate-200
              bg-slate-50
              p-3
            "
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-y-0
                  left-3
                  flex
                  items-center
                  !text-slate-500
                "
              >
                🔎
              </div>

              <input
                ref={inputRef}
                type="text"
                value={search}
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
                  min-h-[44px]
                  w-full
                  rounded-[12px]
                  border-2
                  !border-black
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-base
                  font-bold
                  !text-slate-900
                  outline-none
                  placeholder:!text-slate-400

                  focus:!border-black
                  focus:ring-4
                  focus:ring-slate-900/10
                "
              />
            </div>
          </div>

          {/* =============================================
              OPTIONS
          ============================================= */}

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
                          active
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
                      <span className="min-w-0 break-words">
                        {
                          option.label
                        }
                      </span>

                      {active && (
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
  const categories =
    Object.keys(categoryMap);

  const initialCategoryName =
    categoryCodeToName[
      initialCategory
    ] ?? "";

  const [vendorId, setVendorId] =
    useState("");

  const [category, setCategory] =
    useState(initialCategoryName);

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

  /* =========================================================
     DROPDOWN OPTIONS
  ========================================================= */

  const vendorOptions =
    useMemo<SearchableOption[]>(
      () =>
        vendors.map((vendor) => ({
          value: String(vendor.id),
          label: vendor.name,
        })),
      [vendors]
    );

  const categoryOptions =
    useMemo<SearchableOption[]>(
      () =>
        categories.map(
          (item) => ({
            value: item,
            label: item,
          })
        ),
      [categories]
    );

  /* =========================================================
     MATERIAL NAMES
  ========================================================= */

  const names = useMemo(() => {
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
            categoryMap[category]
        )
        .map(
          (item) => item.name
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
    useMemo<SearchableOption[]>(
      () => [
        ...names.map((item) => ({
          value: item,
          label: item,
        })),

        {
          value: "__NEW__",
          label:
            "+ เพิ่มรายการใหม่...",
        },
      ],
      [names]
    );

  /* =========================================================
     UNIT
  ========================================================= */

  const unit =
    name === "__NEW__"
      ? newUnit.trim()
      : UNITS[name] ??
        materialMasters.find(
          (item) =>
            item.name === name &&
            item.category ===
              categoryMap[category]
        )?.unit ??
        "";

  /* =========================================================
     SUBMIT
  ========================================================= */

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

    if (!categoryMap[category]) {
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
        categoryMap[category],

      name: materialName,

      unit,

      balance: Number(
        formData.get("balance")
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
      setIsSubmitting(true);

      const res = await fetch(
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

      const data = await res
        .json()
        .catch(() => null);

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
      setIsSubmitting(false);
    }
  }

  /* =========================================================
     SHARED CLASSES
  ========================================================= */

  const labelClassName = `
    mb-2
    block
    text-sm
    font-extrabold
    !text-slate-700
    sm:text-base
  `;

  /*
   * มาตรฐานช่องข้อมูลของระบบ
   * ทุกช่องต้องมีกรอบดำ
   */

  const inputClassName = `
    min-h-[50px]
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

    hover:!border-black
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
      onSubmit={handleSubmit}
      className="
        mx-auto
        w-full
        max-w-4xl
        overflow-visible
        rounded-[30px]
        border
        border-slate-200
        bg-slate-50/95
        shadow-[0_24px_65px_-34px_rgba(15,23,42,0.35)]
        backdrop-blur-xl
      "
    >
      {/* =====================================================
          FORM HEADER
      ===================================================== */}

      <div
        className="
          rounded-t-[30px]
          border-b
          border-slate-200
          bg-white/70
          px-5
          py-5
          sm:px-8
          sm:py-6
        "
      >
        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-[16px]
              border
              border-slate-200
              bg-white
              text-xl
              shadow-sm
            "
          >
            📦
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-xl
                font-black
                tracking-tight
                !text-slate-900
                sm:text-2xl
              "
            >
              ข้อมูลพัสดุ
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
                sm:text-base
              "
            >
              ระบุรายละเอียดของพัสดุที่ต้องการเพิ่ม
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          FORM CONTENT
      ===================================================== */}

      <div
        className="
          space-y-5
          p-5
          sm:space-y-6
          sm:p-8
        "
      >
        {/* ===================================================
            ผู้จำหน่าย
            พิมพ์ค้นหาได้
        =================================================== */}

        <div>
          <label
            htmlFor="vendorId"
            className={
              labelClassName
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
        </div>

        {/* ===================================================
            หมวดหมู่
            พิมพ์ค้นหาได้
        =================================================== */}

        <div>
          <label
            htmlFor="category"
            className={
              labelClassName
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
            onChange={(value) => {
              setCategory(value);

              setName("");
              setNewName("");
              setNewUnit("");
            }}
          />
        </div>

        {/* ===================================================
            รายการพัสดุ
            พิมพ์ค้นหาได้
        =================================================== */}

        <div>
          <label
            htmlFor="materialName"
            className={
              labelClassName
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
            disabled={!category}
            required
            onChange={(value) => {
              setName(value);

              if (
                value !== "__NEW__"
              ) {
                setNewName("");
                setNewUnit("");
              }
            }}
          />

          {/* =================================================
              NEW MATERIAL
          ================================================= */}

          {name === "__NEW__" && (
            <div
              className="
                mt-4
                space-y-4
                rounded-[22px]
                border-2
                !border-black
                bg-slate-100/80
                p-4
                shadow-sm
                sm:p-5
              "
            >
              <div>
                <label
                  htmlFor="newName"
                  className={
                    labelClassName
                  }
                >
                  ชื่อรายการใหม่
                </label>

                <input
                  id="newName"
                  value={newName}
                  onChange={(e) =>
                    setNewName(
                      e.target.value
                    )
                  }
                  placeholder="กรอกชื่อรายการพัสดุใหม่"
                  required
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="newUnit"
                  className={
                    labelClassName
                  }
                >
                  หน่วย
                </label>

                <input
                  id="newUnit"
                  value={newUnit}
                  onChange={(e) =>
                    setNewUnit(
                      e.target.value
                    )
                  }
                  placeholder="เช่น ชิ้น, กล่อง, อัน"
                  required
                  className={
                    inputClassName
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            จำนวน + หน่วย
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
          "
        >
          {/* จำนวน */}

          <div>
            <label
              htmlFor="balance"
              className={
                labelClassName
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
              className={
                inputClassName
              }
            />
          </div>

          {/* หน่วย */}

          <div>
            <label
              htmlFor="unit"
              className={
                labelClassName
              }
            >
              หน่วย
            </label>

            <input
              id="unit"
              value={unit}
              readOnly
              placeholder="เลือกพัสดุเพื่อแสดงหน่วย"
              className="
                min-h-[50px]
                w-full
                cursor-default
                rounded-[16px]
                border-2
                !border-black
                bg-slate-100
                px-4
                py-3
                text-base
                font-extrabold
                !text-slate-700
                shadow-sm
                outline-none
                placeholder:!text-slate-400
              "
            />
          </div>
        </div>

        {/* ===================================================
            ราคาล่าสุด
        =================================================== */}

        <div>
          <label
            htmlFor="latestPrice"
            className={
              labelClassName
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
                ${inputClassName}
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
        </div>
      </div>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div
        className="
          flex
          flex-col-reverse
          gap-3
          rounded-b-[30px]
          border-t
          border-slate-200
          bg-white/70
          px-5
          py-5
          sm:flex-row
          sm:justify-end
          sm:px-8
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
              <span>💾</span>
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