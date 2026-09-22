"use client";

import { useMemo, useState } from "react";
import { MATERIALS } from "@/lib/materials";
import { UNITS } from "@/lib/units";
import AppButton from "@/components/AppButton";

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

  /*
   * รับหมวดหมู่จากหน้า /materials/new
   *
   * ตัวอย่าง
   * OFFICE
   * COMPUTER
   * ELECTRIC
   */
  initialCategory?: string;
};

/* =========================================================
   CATEGORY MAP
========================================================= */

const categoryMap: Record<string, string> = {
  "วัสดุสำนักงาน": "OFFICE",
  "วัสดุคอมพิวเตอร์": "COMPUTER",
  "วัสดุไฟฟ้าและวิทยุ": "ELECTRIC",
  "วัสดุงานบ้านและงานครัว": "HOUSEHOLD",
  "วัสดุยานพาหนะ": "VEHICLE",
  "วัสดุสื่อสิ่งพิมพ์": "PRINTING",
};

/* =========================================================
   CATEGORY CODE -> THAI NAME
========================================================= */

const categoryLabelMap: Record<string, string> =
  Object.fromEntries(
    Object.entries(categoryMap).map(
      ([label, code]) => [
        code,
        label,
      ]
    )
  );

/* =========================================================
   COMPONENT
========================================================= */

export default function MaterialForm({
  vendors,
  materialMasters,
  initialCategory = "",
}: Props) {
  const categories =
    Object.keys(categoryMap);

  /* =========================================================
     INITIAL CATEGORY

     initialCategory ที่ได้รับจะเป็น CODE
     เช่น OFFICE

     แต่ state category ใช้ชื่อภาษาไทย
     เช่น วัสดุสำนักงาน
  ========================================================= */

  const initialCategoryLabel =
    categoryLabelMap[
      initialCategory.toUpperCase()
    ] ?? "";

  const [category, setCategory] =
    useState(initialCategoryLabel);

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
     CURRENT CATEGORY CODE
  ========================================================= */

  const currentCategoryCode =
    categoryMap[category] ?? "";

  /* =========================================================
     CANCEL / BACK URL

     ถ้ามีหมวดที่เลือกอยู่
     ให้กลับเข้าหมวดนั้น

     ถ้าไม่มีหมวด
     ให้กลับหน้า /materials
  ========================================================= */

  const cancelHref =
    currentCategoryCode
      ? `/materials/category/${currentCategoryCode}`
      : initialCategory &&
          categoryLabelMap[
            initialCategory.toUpperCase()
          ]
        ? `/materials/category/${initialCategory.toUpperCase()}`
        : "/materials";

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

  /* =========================================================
     UNIT
  ========================================================= */

  const unit =
    name === "__NEW__"
      ? newUnit.trim()
      : UNITS[name] ??
        materialMasters.find(
          (item) =>
            item.name === name
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

    /* =======================================================
       VALIDATION
    ======================================================= */

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

    if (!currentCategoryCode) {
      alert(
        "กรุณาเลือกหมวดหมู่"
      );

      return;
    }

    /* =======================================================
       REQUEST BODY
    ======================================================= */

    const body = {
      vendorId:
        formData.get("vendorId")
          ? Number(
              formData.get(
                "vendorId"
              )
            )
          : null,

      category:
        currentCategoryCode,

      name:
        materialName,

      unit,

      balance:
        Number(
          formData.get(
            "balance"
          )
        ),

      latestPrice:
        Number(
          Number(
            formData.get(
              "latestPrice"
            )
          ).toFixed(2)
        ),
    };

    /* =======================================================
       SAVE
    ======================================================= */

    try {
      setIsSubmitting(true);

      const res =
        await fetch(
          "/api/materials",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      /* =====================================================
         SUCCESS

         กลับเข้าหมวดของรายการที่เพิ่ม
      ===================================================== */

      if (res.ok) {
        window.location.href =
          `/materials/category/${currentCategoryCode}`;

        return;
      }

      /* =====================================================
         API ERROR
      ===================================================== */

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

  /* =========================================================
     INPUT STANDARD

     มาตรฐานช่องข้อมูลของระบบ

     - กรอบดำ
     - border-2
     - !border-black
     - ทุก input / select ใช้มาตรฐานเดียวกัน
  ========================================================= */

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
        overflow-hidden
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

          <select
            id="vendorId"
            name="vendorId"
            defaultValue=""
            className={
              inputClassName
            }
          >
            <option value="">
              เลือกผู้จำหน่าย
            </option>

            {vendors.map(
              (vendor) => (
                <option
                  key={
                    vendor.id
                  }
                  value={
                    vendor.id
                  }
                >
                  {vendor.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* ===================================================
            หมวดหมู่
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

          <select
            id="category"
            value={category}
            onChange={(e) => {
              const value =
                e.target.value;

              setCategory(
                value
              );

              setName("");

              setNewName("");

              setNewUnit("");
            }}
            required
            className={
              inputClassName
            }
          >
            <option value="">
              เลือกหมวดหมู่
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        {/* ===================================================
            รายการพัสดุ
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

          <select
            id="materialName"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            required
            disabled={!category}
            className={`
              ${inputClassName}

              disabled:cursor-not-allowed
              disabled:!border-black
              disabled:bg-slate-100
              disabled:!text-slate-400
              disabled:opacity-70
            `}
          >
            <option value="">
              {category
                ? "เลือกรายการพัสดุ"
                : "กรุณาเลือกหมวดหมู่ก่อน"}
            </option>

            {names.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}

            <option value="__NEW__">
              + เพิ่มรายการใหม่...
            </option>
          </select>

          {/* =================================================
              NEW MATERIAL
          ================================================= */}

          {name ===
            "__NEW__" && (
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
              {/* =============================================
                  NEW NAME
              ============================================= */}

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
                  value={
                    newName
                  }
                  onChange={(
                    e
                  ) =>
                    setNewName(
                      e.target
                        .value
                    )
                  }
                  placeholder="กรอกชื่อรายการพัสดุใหม่"
                  required
                  className={
                    inputClassName
                  }
                />
              </div>

              {/* =============================================
                  NEW UNIT
              ============================================= */}

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
                  value={
                    newUnit
                  }
                  onChange={(
                    e
                  ) =>
                    setNewUnit(
                      e.target
                        .value
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
          {/* =================================================
              จำนวน
          ================================================= */}

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

          {/* =================================================
              หน่วย
          ================================================= */}

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

          ปุ่มใช้ AppButton กลางเท่านั้น

          ยกเลิก:
          กลับไปหมวดที่กำลังเพิ่มรายการ
      ===================================================== */}

      <div
        className="
          flex
          flex-col-reverse
          gap-3
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
        {/* ===================================================
            CANCEL
        =================================================== */}

        <AppButton
          href={cancelHref}
          variant="secondary"
          size="md"
          className="
            w-full
            sm:w-auto
          "
        >
          ยกเลิก
        </AppButton>

        {/* ===================================================
            SAVE
        =================================================== */}

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
              <span>
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