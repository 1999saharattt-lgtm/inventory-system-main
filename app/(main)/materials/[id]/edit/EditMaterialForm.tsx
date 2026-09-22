"use client";

import { useMemo, useState } from "react";
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
      material.vendorId?.toString() ?? ""
    );

  /* =========================================================
     Material Names
  ========================================================= */

  const names = useMemo(() => {
    const thaiCategory =
      categoryName[category];

    return (
      MATERIALS[
        thaiCategory as keyof typeof MATERIALS
      ] ?? []
    );
  }, [category]);

  /* =========================================================
     Unit
  ========================================================= */

  const unit = name
    ? UNITS[name] ?? ""
    : "";

  /* =========================================================
     Submit
  ========================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(
        e.currentTarget
      );

      const body = {
        code: formData.get("code"),
        category,
        name,
        unit,

        balance: Number(
          formData.get("balance")
        ),

        latestPrice: Number(
          formData.get("latestPrice")
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

          body: JSON.stringify(body),
        }
      );

      const text = await res.text();

      let data: {
        message: string;
      } | null = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = {
          message: text,
        };
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
     Shared UI Classes
  ========================================================= */

  const labelClass = `
    mb-2
    block
    text-sm
    font-extrabold
    !text-slate-800
    sm:text-base
  `;

  /* =========================================================
     INPUT มาตรฐาน
     ช่องข้อมูลใช้กรอบสีดำ
  ========================================================= */

  const inputClass = `
    min-h-[52px]
    w-full
    rounded-[16px]
    border
    border-black
    bg-white
    px-4
    py-3
    font-bold
    !text-slate-900
    shadow-sm
    outline-none
    transition-all
    duration-200
    placeholder:!text-slate-400
    hover:bg-slate-50
    focus:border-blue-500
    focus:bg-white
    focus:ring-4
    focus:ring-blue-500/10
  `;

  /* =========================================================
     SELECT มาตรฐาน
     ช่องข้อมูลใช้กรอบสีดำ
  ========================================================= */

  const selectClass = `
    min-h-[52px]
    w-full
    appearance-none
    rounded-[16px]
    border
    border-black
    bg-white
    px-4
    py-3
    font-bold
    !text-slate-900
    shadow-sm
    outline-none
    transition-all
    duration-200
    hover:bg-slate-50
    focus:border-blue-500
    focus:bg-white
    focus:ring-4
    focus:ring-blue-500/10
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
        overflow-hidden
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
          Ambient Background
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
            Form Header
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
            defaultValue={material.code}
            className={inputClass}
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

          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(
                  e.target.value
                );

                setName("");
              }}
              className={`${selectClass} pr-11`}
            >
              {categories.map((c) => (
                <option
                  key={c}
                  value={c}
                >
                  {categoryName[c]}
                </option>
              ))}
            </select>

            <span
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-xs
                !text-slate-500
              "
            >
              ▼
            </span>
          </div>
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

          <div className="relative">
            <select
              id="name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className={`${selectClass} pr-11`}
            >
              <option value="">
                เลือกรายการพัสดุ
              </option>

              {names.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <span
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-xs
                !text-slate-500
              "
            >
              ▼
            </span>
          </div>
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

          <div className="relative">
            <select
              id="vendorId"
              value={vendorId}
              onChange={(e) =>
                setVendorId(
                  e.target.value
                )
              }
              className={`${selectClass} pr-11`}
            >
              <option value="">
                -- ไม่ระบุผู้จำหน่าย --
              </option>

              {vendors.map((vendor) => (
                <option
                  key={vendor.id}
                  value={vendor.id}
                >
                  {vendor.name}
                </option>
              ))}
            </select>

            <span
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-xs
                !text-slate-500
              "
            >
              ▼
            </span>
          </div>
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
              className={labelClass}
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
              className={inputClass}
            />
          </div>

          {/* หน่วย */}

          <div>
            <label
              htmlFor="unit"
              className={labelClass}
            >
              หน่วย
            </label>

            <input
              id="unit"
              value={unit}
              readOnly
              className="
                min-h-[52px]
                w-full
                cursor-default
                rounded-[16px]
                border
                border-black
                bg-slate-100
                px-4
                py-3
                font-bold
                !text-slate-700
                shadow-inner
                outline-none
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
            Buttons
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
          {/* =================================================
              ยกเลิก
          ================================================= */}

          <AppButton
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() =>
              router.push(
                `/materials/category/${category}`
              )
            }
            className="
              w-full
              sm:w-auto
              sm:min-w-[120px]
            "
          >
            ยกเลิก
          </AppButton>

          {/* =================================================
              บันทึก
          ================================================= */}

          <AppButton
            type="submit"
            variant="primary"
            disabled={loading}
            className="
              w-full
              sm:w-auto
              sm:min-w-[180px]
            "
          >
            {loading ? (
              <>
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

                <span>
                  กำลังบันทึก...
                </span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>บันทึก</span>
              </>
            )}
          </AppButton>
        </div>
      </div>
    </form>
  );
}