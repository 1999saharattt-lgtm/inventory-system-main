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
};

const categoryMap: Record<string, string> = {
  "วัสดุสำนักงาน": "OFFICE",
  "วัสดุคอมพิวเตอร์": "COMPUTER",
  "วัสดุไฟฟ้าและวิทยุ": "ELECTRIC",
  "วัสดุงานบ้านและงานครัว": "HOUSEHOLD",
  "วัสดุยานพาหนะ": "VEHICLE",
  "วัสดุสื่อสิ่งพิมพ์": "PRINTING",
};

export default function MaterialForm({
  vendors,
  materialMasters,
}: Props) {
  const categories = Object.keys(categoryMap);

  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /* =========================================================
     Material Names
  ========================================================= */

  const names = useMemo(() => {
    if (!category) return [];

    const oldNames =
      MATERIALS[
        category as keyof typeof MATERIALS
      ] ?? [];

    const newNames = materialMasters
      .filter(
        (item) =>
          item.category ===
          categoryMap[category]
      )
      .map((item) => item.name);

    return Array.from(
      new Set([...oldNames, ...newNames])
    );
  }, [category, materialMasters]);

  /* =========================================================
     Unit
  ========================================================= */

  const unit =
    name === "__NEW__"
      ? newUnit.trim()
      : UNITS[name] ??
        materialMasters.find(
          (item) => item.name === name
        )?.unit ??
        "";

  /* =========================================================
     Submit
  ========================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(
      e.currentTarget
    );

    const materialName =
      name === "__NEW__"
        ? newName.trim()
        : name;

    if (!materialName) {
      alert("กรุณาระบุชื่อรายการพัสดุ");
      return;
    }

    if (!unit) {
      alert("กรุณาระบุหน่วย");
      return;
    }

    if (!categoryMap[category]) {
      alert("กรุณาเลือกหมวดหมู่");
      return;
    }

    const body = {
      vendorId: formData.get("vendorId")
        ? Number(formData.get("vendorId"))
        : null,

      category: categoryMap[category],

      name: materialName,

      unit,

      balance: Number(
        formData.get("balance")
      ),

      latestPrice: Number(
        Number(
          formData.get("latestPrice")
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
          body: JSON.stringify(body),
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
     Shared Classes
  ========================================================= */

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
    border-black
    bg-white/90
    px-4
    py-3
    text-base
    font-bold
    !text-slate-900
    shadow-[0_6px_18px_-14px_rgba(15,23,42,0.3)]
    outline-none
    backdrop-blur-xl
    transition-all
    duration-200
    placeholder:!text-slate-400
    hover:border-black
    focus:border-black
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
        mx-auto
        w-full
        max-w-4xl
        overflow-hidden
        rounded-[30px]
        border
        border-white/80
        bg-white/80
        shadow-[0_24px_70px_-34px_rgba(15,23,42,0.35)]
        backdrop-blur-2xl
      "
    >
      {/* =====================================================
          Ambient Decoration
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-blue-200/20
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-24
          -left-24
          h-72
          w-72
          rounded-full
          bg-cyan-200/20
          blur-3xl
        "
      />

      {/* =====================================================
          Form Header
      ===================================================== */}

      <div
        className="
          relative
          border-b
          border-slate-200/80
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
              bg-gradient-to-br
              from-blue-500
              to-blue-600
              text-xl
              shadow-[0_14px_28px_-16px_rgba(59,130,246,0.65)]
              ring-1
              ring-white/40
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
          Form Content
      ===================================================== */}

      <div
        className="
          relative
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
            className={labelClassName}
          >
            ผู้จำหน่าย
          </label>

          <select
            id="vendorId"
            name="vendorId"
            defaultValue=""
            className={inputClassName}
          >
            <option value="">
              เลือกผู้จำหน่าย
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
        </div>

        {/* ===================================================
            หมวดหมู่
        =================================================== */}

        <div>
          <label
            htmlFor="category"
            className={labelClassName}
          >
            หมวดหมู่
          </label>

          <select
            id="category"
            value={category}
            onChange={(e) => {
              const value = e.target.value;

              setCategory(value);
              setName("");
              setNewName("");
              setNewUnit("");
            }}
            required
            className={inputClassName}
          >
            <option value="">
              เลือกหมวดหมู่
            </option>

            {categories.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* ===================================================
            รายการพัสดุ
        =================================================== */}

        <div>
          <label
            htmlFor="materialName"
            className={labelClassName}
          >
            รายการพัสดุ
          </label>

          <select
            id="materialName"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
            disabled={!category}
            className={`
              ${inputClassName}
              disabled:cursor-not-allowed
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

            {names.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}

            <option value="__NEW__">
              + เพิ่มรายการใหม่...
            </option>
          </select>

          {/* =================================================
              New Material
          ================================================= */}

          {name === "__NEW__" && (
            <div
              className="
                mt-4
                space-y-4
                rounded-[22px]
                border
                border-blue-100
                bg-blue-50/60
                p-4
                shadow-inner
                sm:p-5
              "
            >
              <div>
                <label
                  htmlFor="newName"
                  className={labelClassName}
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
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="newUnit"
                  className={labelClassName}
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
                  className={inputClassName}
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
              className={labelClassName}
            >
              จำนวน
            </label>

            <input
              id="balance"
              type="number"
              name="balance"
              defaultValue={0}
              className={inputClassName}
            />
          </div>

          {/* หน่วย */}

          <div>
            <label
              htmlFor="unit"
              className={labelClassName}
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
                border-black
                bg-slate-100/90
                px-4
                py-3
                text-base
                font-extrabold
                !text-slate-600
                shadow-inner
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
            className={labelClassName}
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
                !text-slate-400
              "
            >
              บาท
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          Buttons
      ===================================================== */}

      <div
        className="
          relative
          flex
          flex-col-reverse
          gap-3
          border-t
          border-slate-200/80
          bg-slate-50/70
          px-5
          py-5
          backdrop-blur-xl
          sm:flex-row
          sm:justify-end
          sm:px-8
        "
      >
        {/* Cancel */}

        <AppButton
          href="/materials"
          variant="secondary"
          size="md"
          className="
            w-full
            sm:w-auto
          "
        >
          ยกเลิก
        </AppButton>

        {/* Submit */}

        <AppButton
          type="submit"
          variant="success"
          size="md"
          disabled={isSubmitting}
          icon={
            isSubmitting ? (
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white/40
                  border-t-white
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