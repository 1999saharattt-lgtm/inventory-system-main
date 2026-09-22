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

   มาตรฐาน Dropdown ของระบบ
   - พิมพ์ค้นหาได้
   - ไม่มีรูปแว่นขยายในช่องค้นหา
   - กรอบดำทั้ง Control และ Search Input
   - ไม่ต้องติดตั้ง Library เพิ่ม
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
     AUTO FOCUS SEARCH INPUT
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* =====================================================
          SELECT CONTROL
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
          min-h-[52px]
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
          focus:bg-white
          focus:ring-4
          focus:ring-slate-900/10

          disabled:cursor-not-allowed
          disabled:!border-black
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
            z-[100]

            overflow-hidden

            rounded-[16px]

            border-2
            !border-black

            bg-white

            shadow-[0_18px_45px_-20px_rgba(15,23,42,0.45)]
          "
        >
          {/* =================================================
              SEARCH INPUT
              ไม่มีรูปแว่นขยาย
          ================================================= */}

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

                transition-all
                duration-200

                placeholder:!text-slate-400

                hover:!border-black
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

  /* =========================================================
     MATERIAL NAMES
  ========================================================= */

  const names = useMemo(() => {
    const thaiCategory =
      categoryName[category];

    const categoryMaterials =
      MATERIALS[
        thaiCategory as keyof typeof MATERIALS
      ] ?? [];

    /*
     * ป้องกันกรณีชื่อพัสดุเดิมไม่มีอยู่ใน MATERIALS
     * แต่มีอยู่ในฐานข้อมูลแล้ว
     */

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

  /* =========================================================
     UNIT

     ถ้าชื่อเดิมไม่มีใน UNITS
     ให้ใช้หน่วยเดิมจากฐานข้อมูล
  ========================================================= */

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

  /* =========================================================
     OPTIONS
  ========================================================= */

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

  /* =========================================================
     SUBMIT
  ========================================================= */

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

    setLoading(true);

    try {
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

      alert("บันทึกสำเร็จ");

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

  /* =========================================================
     SHARED UI CLASSES
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
        relative
        w-full
        min-w-0

        overflow-visible

        rounded-[30px]

        border
        border-slate-300

        bg-white/90

        p-5

        shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]

        backdrop-blur-2xl

        sm:p-7
        lg:p-8
      "
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20

          h-64
          w-64

          rounded-full

          bg-blue-400/10

          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-24
          -left-20

          h-64
          w-64

          rounded-full

          bg-cyan-400/10

          blur-3xl
        "
      />

      <div className="relative space-y-6">
        {/* ===================================================
            FORM HEADER
        =================================================== */}

        <div
          className="
            flex
            items-center
            gap-4

            border-b
            border-slate-300

            pb-5
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

              bg-slate-900

              text-xl

              shadow-[0_12px_28px_-16px_rgba(15,23,42,0.6)]
            "
          >
            ✏️
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
              ตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนบันทึก
            </p>
          </div>
        </div>

        {/* ===================================================
            รหัสพัสดุ
        =================================================== */}

        <div>
          <label
            htmlFor="code"
            className={labelClass}
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
              inputClass
            }
          />
        </div>

        {/* ===================================================
            หมวดหมู่
        =================================================== */}

        <div>
          <label
            htmlFor="category"
            className={labelClass}
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
        </div>

        {/* ===================================================
            รายการพัสดุ
        =================================================== */}

        <div>
          <label
            htmlFor="name"
            className={labelClass}
          >
            รายการพัสดุ
          </label>

          <SearchableDropdown
            id="name"
            value={name}
            options={
              materialOptions
            }
            placeholder="เลือกรายการพัสดุ"
            searchPlaceholder="พิมพ์ค้นหารายการพัสดุ..."
            emptyText="ไม่พบรายการพัสดุ"
            disabled={!category}
            onChange={setName}
          />
        </div>

        {/* ===================================================
            ผู้จำหน่าย
        =================================================== */}

        <div>
          <label
            htmlFor="vendorId"
            className={labelClass}
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
          <div>
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
              min="0"
              defaultValue={
                material.balance
              }
              className={
                inputClass
              }
            />
          </div>

          <div>
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
              value={unit}
              readOnly
              placeholder="เลือกพัสดุเพื่อแสดงหน่วย"
              className="
                min-h-[52px]
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
            className={labelClass}
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
                ${inputClass}
                pr-16
                text-right
                tabular-nums
              `}
            />

            <span
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2

                -translate-y-1/2

                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              บาท
            </span>
          </div>
        </div>

        {/* ===================================================
            BUTTONS

            ใช้ขนาดจาก AppButton กลางโดยตรง
            ไม่กำหนด width / min-width ซ้ำในหน้านี้
        =================================================== */}

        <div
          className="
            flex
            flex-col-reverse
            gap-3

            border-t
            border-slate-300

            pt-6

            sm:flex-row
            sm:justify-end
          "
        >
          <AppButton
            type="button"
            variant="secondary"
            size="md"
            disabled={loading}
            onClick={() =>
              router.push(
                `/materials/category/${material.category}`
              )
            }
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
                <span>💾</span>
              )
            }
          >
            {loading
              ? "กำลังบันทึก..."
              : "บันทึก"}
          </AppButton>
        </div>
      </div>
    </form>
  );
}