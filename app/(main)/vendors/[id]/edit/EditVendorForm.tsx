"use client";

import { useState } from "react";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Vendor = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

type Props = {
  vendor: Vendor;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function EditVendorForm({
  vendor,
}: Props) {
  const [loading, setLoading] =
    useState(false);

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

    setLoading(true);

    try {
      const formData =
        new FormData(
          e.currentTarget
        );

      const body = {
        name:
          formData.get(
            "name"
          ),

        address:
          formData.get(
            "address"
          ),

        phone:
          formData.get(
            "phone"
          ),

        taxId:
          formData.get(
            "taxId"
          ),
      };

      const res =
        await fetch(
          `/api/vendors/${vendor.id}`,
          {
            method: "PUT",

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
      ===================================================== */

      if (res.ok) {
        alert(
          "บันทึกสำเร็จ"
        );

        window.location.href =
          "/vendors";

        return;
      }

      /* =====================================================
         ERROR
      ===================================================== */

      alert(
        "บันทึกไม่สำเร็จ"
      );
    } catch (error) {
      console.error(
        "Update vendor error:",
        error
      );

      alert(
        "เกิดข้อผิดพลาด"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     SHARED CLASSES
  ========================================================= */

  const labelClassName = `
    block
    text-sm
    font-extrabold
    !text-slate-200
  `;

  const inputClassName = `
    mt-2
    min-h-[50px]
    w-full

    rounded-xl

    border
    border-slate-300

    bg-white

    px-4
    py-3

    text-base
    font-semibold
    !text-slate-900

    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-400

    focus:border-emerald-600
    focus:ring-4
    focus:ring-emerald-500/10
  `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="
        mx-auto
        w-full
        max-w-4xl
        space-y-6

        rounded-3xl

        border
        border-slate-700

        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-800

        p-6

        text-white

        shadow-2xl

        sm:p-8
      "
    >
      {/* =====================================================
          VENDOR INFORMATION
      ===================================================== */}

      <div
        className="
          rounded-xl

          bg-gradient-to-r
          from-slate-800
          to-slate-700

          px-4
          py-3
        "
      >
        <h2
          className="
            text-lg
            font-extrabold
            !text-white

            sm:text-xl
          "
        >
          🏢 ข้อมูลผู้จำหน่าย
        </h2>
      </div>

      {/* =====================================================
          FIELDS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5

          md:grid-cols-2
        "
      >
        {/* ===================================================
            NAME
        =================================================== */}

        <div className="min-w-0">
          <label
            htmlFor="name"
            className={
              labelClassName
            }
          >
            ชื่อผู้จำหน่าย{" "}
            <span className="!text-red-400">
              *
            </span>
          </label>

          <input
            id="name"
            name="name"
            type="text"
            defaultValue={
              vendor.name
            }
            required
            autoComplete="organization"
            placeholder="ระบุชื่อผู้จำหน่าย"
            className={
              inputClassName
            }
          />
        </div>

        {/* ===================================================
            PHONE
        =================================================== */}

        <div className="min-w-0">
          <label
            htmlFor="phone"
            className={
              labelClassName
            }
          >
            เบอร์โทร
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={
              vendor.phone ??
              ""
            }
            autoComplete="tel"
            placeholder="ระบุเบอร์โทร"
            className={
              inputClassName
            }
          />
        </div>

        {/* ===================================================
            TAX ID
        =================================================== */}

        <div className="min-w-0">
          <label
            htmlFor="taxId"
            className={
              labelClassName
            }
          >
            เลขประจำตัวผู้เสียภาษี
          </label>

          <input
            id="taxId"
            name="taxId"
            type="text"
            defaultValue={
              vendor.taxId ??
              ""
            }
            inputMode="numeric"
            placeholder="ระบุเลขประจำตัวผู้เสียภาษี"
            className={
              inputClassName
            }
          />
        </div>
      </div>

      {/* =====================================================
          ADDRESS
      ===================================================== */}

      <div>
        <div
          className="
            rounded-xl

            bg-gradient-to-r
            from-slate-800
            to-slate-700

            px-4
            py-3
          "
        >
          <h2
            className="
              text-lg
              font-extrabold
              !text-white

              sm:text-xl
            "
          >
            📍 ที่อยู่ผู้จำหน่าย
          </h2>
        </div>

        <div className="mt-4">
          <label
            htmlFor="address"
            className={
              labelClassName
            }
          >
            ที่อยู่
          </label>

          <textarea
            id="address"
            name="address"
            rows={4}
            defaultValue={
              vendor.address ??
              ""
            }
            autoComplete="street-address"
            placeholder="ระบุที่อยู่ผู้จำหน่าย"
            className={`
              ${inputClassName}

              min-h-[120px]
              resize-y
              leading-relaxed
            `}
          />
        </div>
      </div>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div
        className="
          flex
          w-full
          flex-col-reverse
          gap-3

          border-t
          border-slate-700

          pt-5

          sm:flex-row
          sm:items-center
          sm:justify-end
        "
      >
        {/* ===================================================
            CANCEL

            ใช้ AppButton ตัวกลาง
        =================================================== */}

        <AppButton
          href="/vendors"
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

            ใช้ AppButton ตัวกลาง
        =================================================== */}

        <AppButton
          type="submit"
          variant="success"
          size="md"
          disabled={
            loading
          }
          icon={
            <span
              aria-hidden="true"
            >
              {loading
                ? "⏳"
                : "💾"}
            </span>
          }
          className="
            w-full
            sm:w-auto
          "
        >
          {loading
            ? "กำลังบันทึก..."
            : "บันทึก"}
        </AppButton>
      </div>
    </form>
  );
}