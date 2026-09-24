"use client";

import { useState } from "react";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

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
         ERROR RESPONSE
      ===================================================== */

      let errorMessage =
        "บันทึกไม่สำเร็จ";

      try {
        const errorData =
          await res.json();

        if (
          errorData &&
          typeof errorData.message ===
            "string"
        ) {
          errorMessage =
            errorData.message;
        }
      } catch {
        // ใช้ข้อความเริ่มต้น
      }

      alert(errorMessage);
    } catch (error) {
      console.error(
        "Update vendor error:",
        error
      );

      alert(
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setLoading(false);
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

  const inputClassName = `
    min-h-[50px]
    w-full
    min-w-0

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
      onSubmit={
        handleSubmit
      }
      className="
        w-full
        min-w-0
      "
    >
      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            FORM HEADER
        =================================================== */}

        <div
          className="
            mb-6

            flex
            flex-col
            gap-2

            border-b
            border-slate-200

            pb-5
          "
        >
          <div
            className="
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

                rounded-xl

                bg-slate-100

                text-xl
              "
              aria-hidden="true"
            >
              🏢
            </div>

            <div className="min-w-0">
              <h2
                className="
                  text-lg
                  font-extrabold
                  !text-slate-900

                  sm:text-xl
                "
              >
                ข้อมูลผู้จำหน่าย
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                แก้ไขรายละเอียดข้อมูลผู้จำหน่าย
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            VENDOR INFORMATION
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4

            lg:grid-cols-2
          "
        >
          {/* =================================================
              NAME
          ================================================= */}

          <AppInfoCard>
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
          </AppInfoCard>

          {/* =================================================
              PHONE
          ================================================= */}

          <AppInfoCard>
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
          </AppInfoCard>

          {/* =================================================
              TAX ID
          ================================================= */}

          <div
            className="
              lg:col-span-2
            "
          >
            <AppInfoCard>
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
                autoComplete="off"
                placeholder="ระบุเลขประจำตัวผู้เสียภาษี"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>
          </div>
        </div>

        {/* ===================================================
            ADDRESS
        =================================================== */}

        <div
          className="
            mt-6

            border-t
            border-slate-200

            pt-6
          "
        >
          <div
            className="
              mb-4
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-xl

                bg-slate-100

                text-lg
              "
              aria-hidden="true"
            >
              📍
            </div>

            <div>
              <h2
                className="
                  text-base
                  font-extrabold
                  !text-slate-900

                  sm:text-lg
                "
              >
                ที่อยู่ผู้จำหน่าย
              </h2>

              <p
                className="
                  mt-0.5
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ระบุที่อยู่สำหรับติดต่อผู้จำหน่าย
              </p>
            </div>
          </div>

          <AppInfoCard>
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

                min-h-[130px]
                resize-y
                leading-relaxed
              `}
            />
          </AppInfoCard>
        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div
          className="
            mt-6

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
          {/* =================================================
              CANCEL
          ================================================= */}

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

          {/* =================================================
              SAVE
          ================================================= */}

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
      </AppCard>
    </form>
  );
}