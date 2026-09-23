"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { MATERIALS } from "@/lib/materials";
import { UNITS } from "@/lib/units";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

/* =========================================================
   TYPES
========================================================= */

type Material = {
  id: number;
  code: string;
  category: string;
  name: string;
  balance: number;
  unit: string;
  latestPrice: number;
  minimumStock: number;
  remark: string | null;
  vendorId: number | null;
};

type Vendor = {
  id: number;
  name: string;
};

type Props = {
  material: Material;
  vendors: Vendor[];
  backHref?: string;
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
  required?: boolean;
  onChange: (value: string) => void;
};

/* =========================================================
   CATEGORY
========================================================= */

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

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
  required = false,
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

  /* =======================================================
     CLOSE WHEN CLICK OUTSIDE
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
     AUTO FOCUS
  ======================================================= */

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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      ref={containerRef}
      className={`
        relative
        w-full

        ${
          open
            ? "z-[200]"
            : "z-0"
        }
      `}
    >
      {/* =====================================================
          REQUIRED FIELD
      ===================================================== */}

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

          border
          border-slate-300

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

          hover:border-slate-400
          hover:bg-slate-50

          focus:border-blue-400
          focus:bg-white
          focus:ring-4
          focus:ring-blue-500/10

          disabled:cursor-not-allowed
          disabled:border-slate-200
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
            border-slate-200

            bg-white

            shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)]
          "
        >
          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="
              border-b
              border-slate-200

              bg-slate-50

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
                min-h-[46px]
                w-full

                rounded-[12px]

                border
                border-slate-300

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

                hover:border-slate-400

                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-500/10
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
   EDIT MATERIAL FORM
========================================================= */

export default function EditMaterialForm({
  material,
  vendors,
  backHref = `/materials/category/${material.category}`,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [category, setCategory] =
    useState(material.category);

  const [name, setName] =
    useState(material.name);

  const [vendorId, setVendorId] =
    useState(
      material.vendorId?.toString() ??
        ""
    );

  /* =======================================================
     MATERIAL NAMES
  ======================================================= */

  const names = useMemo(() => {
    const thaiCategory =
      categoryName[category];

    const categoryMaterials =
      MATERIALS[
        thaiCategory as keyof typeof MATERIALS
      ] ?? [];

    return Array.from(
      new Set([
        ...categoryMaterials,

        ...(material.category ===
          category &&
        material.name
          ? [material.name]
          : []),
      ])
    );
  }, [
    category,
    material.category,
    material.name,
  ]);

  /* =======================================================
     UNIT
  ======================================================= */

  const unit = useMemo(() => {
    if (!name) {
      return "";
    }

    const mappedUnit =
      UNITS[name];

    if (mappedUnit) {
      return mappedUnit;
    }

    if (
      name === material.name
    ) {
      return material.unit;
    }

    return "";
  }, [
    name,
    material.name,
    material.unit,
  ]);

  /* =======================================================
     OPTIONS
  ======================================================= */

  const categoryOptions =
    useMemo<SearchableOption[]>(
      () =>
        categories.map(
          (categoryCode) => ({
            value: categoryCode,

            label:
              categoryName[
                categoryCode
              ],
          })
        ),
      []
    );

  const materialOptions =
    useMemo<SearchableOption[]>(
      () =>
        names.map(
          (materialName) => ({
            value: materialName,
            label: materialName,
          })
        ),
      [names]
    );

  const vendorOptions =
    useMemo<SearchableOption[]>(
      () => [
        {
          value: "",
          label:
            "-- ไม่ระบุผู้จำหน่าย --",
        },

        ...vendors.map(
          (vendor) => ({
            value:
              vendor.id.toString(),

            label: vendor.name,
          })
        ),
      ],
      [vendors]
    );

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (!category) {
      alert(
        "กรุณาเลือกหมวดหมู่"
      );

      return;
    }

    if (!name) {
      alert(
        "กรุณาเลือกรายการพัสดุ"
      );

      return;
    }

    if (!unit) {
      alert(
        "ไม่พบหน่วยของรายการพัสดุ กรุณาตรวจสอบข้อมูล"
      );

      return;
    }

    const formData =
      new FormData(
        e.currentTarget
      );

    const body = {
      code:
        formData.get("code"),

      category,

      name,

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

      vendorId: vendorId
        ? Number(vendorId)
        : null,
    };

    try {
      setLoading(true);

      const res = await fetch(
        `/api/materials/${material.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            body
          ),
        }
      );

      const text =
        await res.text();

      let data: {
        message?: string;
      } | null = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = text
          ? {
              message: text,
            }
          : null;
      }

      if (!res.ok) {
        throw new Error(
          data?.message ??
            "บันทึกไม่สำเร็จ"
        );
      }

      alert(
        "บันทึกสำเร็จ"
      );

      router.push(
        `/materials/category/${category}`
      );

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     SHARED INPUT
  ======================================================= */

  const labelClassName = `
    mb-2
    block

    text-sm
    font-extrabold
    !text-slate-700

    sm:text-base
  `;

  const inputClassName = `
    min-h-[50px]
    w-full

    rounded-[16px]

    border
    border-slate-300

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

    hover:border-slate-400
    hover:bg-slate-50

    focus:border-blue-400
    focus:bg-white
    focus:ring-4
    focus:ring-blue-500/10
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        relative

        z-0

        w-full
        min-w-0

        overflow-visible
      "
    >
      <AppCard
        className="
          relative

          w-full

          !overflow-visible
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6">
          <h2
            className="
              text-lg
              font-extrabold
              !text-slate-900
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
            "
          >
            ตรวจสอบและแก้ไขรายละเอียดของพัสดุ
          </p>
        </div>

        {/* =================================================
            GRID
        ================================================= */}

        <div
          className="
            relative

            grid
            grid-cols-1
            gap-4

            overflow-visible

            lg:grid-cols-2
          "
        >
          {/* ===============================================
              VENDOR
          =============================================== */}

          <div
            className="
              relative
              z-50
            "
          >
            <AppInfoCard
              className="
                !overflow-visible
              "
            >
              <label
                htmlFor="vendorId"
                className={
                  labelClassName
                }
              >
                ผู้จำหน่าย
              </label>

              <SearchableDropdown
                id="vendorId"
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
            </AppInfoCard>
          </div>

          {/* ===============================================
              CATEGORY
          =============================================== */}

          <div
            className="
              relative
              z-50
            "
          >
            <AppInfoCard
              className="
                !overflow-visible
              "
            >
              <label
                htmlFor="category"
                className={
                  labelClassName
                }
              >
                หมวดหมู่
              </label>

              <SearchableDropdown
                id="category"
                value={category}
                options={
                  categoryOptions
                }
                placeholder="เลือกหมวดหมู่"
                searchPlaceholder="พิมพ์ค้นหาหมวดหมู่..."
                required
                onChange={(
                  selectedCategory
                ) => {
                  if (
                    selectedCategory ===
                    category
                  ) {
                    return;
                  }

                  setCategory(
                    selectedCategory
                  );

                  setName("");
                }}
              />
            </AppInfoCard>
          </div>

          {/* ===============================================
              MATERIAL
          =============================================== */}

          <div
            className="
              relative
              z-40

              lg:col-span-2
            "
          >
            <AppInfoCard
              className="
                !overflow-visible
              "
            >
              <label
                htmlFor="name"
                className={
                  labelClassName
                }
              >
                รายการพัสดุ
              </label>

              <SearchableDropdown
                id="name"
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
                emptyText="ไม่พบรายการพัสดุ"
                disabled={!category}
                required
                onChange={setName}
              />
            </AppInfoCard>
          </div>

          {/* ===============================================
              BALANCE
          =============================================== */}

          <div
            className="
              relative
              z-20
            "
          >
            <AppInfoCard>
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
                min="0"
                defaultValue={
                  material.balance
                }
                className={
                  inputClassName
                }
              />
            </AppInfoCard>
          </div>

          {/* ===============================================
              UNIT
          =============================================== */}

          <div
            className="
              relative
              z-20
            "
          >
            <AppInfoCard>
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

                  border
                  border-slate-300

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
            </AppInfoCard>
          </div>

          {/* ===============================================
              CODE
          =============================================== */}

          <div
            className="
              relative
              z-10
            "
          >
            <AppInfoCard>
              <label
                htmlFor="code"
                className={
                  labelClassName
                }
              >
                รหัสพัสดุ
              </label>

              <input
                id="code"
                name="code"
                defaultValue={
                  material.code
                }
                className={
                  inputClassName
                }
              />
            </AppInfoCard>
          </div>

          {/* ===============================================
              PRICE
          =============================================== */}

          <div
            className="
              relative
              z-10
            "
          >
            <AppInfoCard>
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
                  step="0.01"
                  min="0"
                  name="latestPrice"
                  defaultValue={
                    material.latestPrice
                  }
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
            </AppInfoCard>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="
            relative
            z-0

            mt-6

            flex
            flex-col-reverse
            gap-3

            border-t
            border-slate-200

            pt-5

            sm:flex-row
            sm:justify-end
          "
        >
          <AppButton
            href={backHref}
            variant="secondary"
            size="md"
          >
            ยกเลิก
          </AppButton>

          <AppButton
            type="submit"
            variant="success"
            size="md"
            disabled={loading}
            icon={
              loading ? (
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
                <span>
                  💾
                </span>
              )
            }
          >
            {loading
              ? "กำลังบันทึก..."
              : "บันทึก"}
          </AppButton>
        </div>
      </AppCard>
    </form>
  );
}