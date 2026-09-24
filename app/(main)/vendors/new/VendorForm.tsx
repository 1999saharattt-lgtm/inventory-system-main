"use client";

import { useState } from "react";

import AppButton from "@/components/AppButton";

/* =========================================================
   COMPONENT
========================================================= */

export default function VendorForm() {
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

      const body =
        Object.fromEntries(
          formData.entries()
        );

      const res =
        await fetch(
          "/api/vendors",
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

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          text ||
            "บันทึกไม่สำเร็จ"
        );
      }

      alert(
        "เพิ่มผู้จำหน่ายสำเร็จ"
      );

      window.location.href =
        "/vendors";
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
     SHARED CLASSES
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

    rounded-[14px]

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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        w-full
        min-w-0

        rounded-2xl

        border
        border-slate-200

        bg-white

        p-5

        shadow-sm

        sm:p-6
        lg:p-8
      "
    >
      {/* =====================================================
          VENDOR INFORMATION
      ===================================================== */}

      <div
        className="
          mb-6

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

      <div
        className="
          grid
          grid-cols-1
          gap-5

          md:grid-cols-2
        "
      >
        {/* ===============================================
            NAME
        =============================================== */}

        <div className="min-w-0">
          <label
            htmlFor="name"
            className={
              labelClassName
            }
          >
            ชื่อผู้จำหน่าย{" "}
            <span className="!text-red-500">
              *
            </span>
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="ระบุชื่อผู้จำหน่าย"
            className={
              inputClassName
            }
          />
        </div>

        {/* ===============================================
            PHONE
        =============================================== */}

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
            placeholder="ระบุเบอร์โทร"
            className={
              inputClassName
            }
          />
        </div>

        {/* ===============================================
            TAX ID
        =============================================== */}

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
            inputMode="numeric"
            placeholder="ระบุเลขผู้เสียภาษี"
            className={
              inputClassName
            }
          />
        </div>
      </div>

      {/* =====================================================
          ADDRESS
      ===================================================== */}

      <div className="mt-8">
        <div
          className="
            mb-5

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

        <div className="min-w-0">
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
            placeholder="ระบุที่อยู่ผู้จำหน่าย"
            className="
              min-h-[130px]
              w-full
              resize-y

              rounded-[14px]

              border
              border-slate-300

              bg-white

              px-4
              py-3

              text-base
              font-bold
              leading-relaxed
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
            "
          />
        </div>
      </div>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div
        className="
          mt-8

          flex
          flex-col-reverse
          gap-3

          border-t
          border-slate-200

          pt-5

          sm:flex-row
          sm:items-center
          sm:justify-end
        "
      >
        {/* ===============================================
            CANCEL

            ใช้ AppButton ตัวกลาง
        =============================================== */}

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

        {/* ===============================================
            SAVE

            ใช้ AppButton ตัวกลาง
        =============================================== */}

        <AppButton
          type="submit"
          variant="success"
          size="md"
          disabled={loading}
          className="
            w-full
            sm:w-auto
          "
          icon={
            <span aria-hidden="true">
              {loading
                ? "⏳"
                : "💾"}
            </span>
          }
        >
          {loading
            ? "กำลังบันทึก..."
            : "บันทึก"}
        </AppButton>
      </div>
    </form>
  );
}