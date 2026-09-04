"use client";

import { useState } from "react";

type Vendor = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

export default function EditVendorForm({
  vendor,
}: {
  vendor: Vendor;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const formData =
        new FormData(
          e.currentTarget as HTMLFormElement
        );

      const body = {
        name: formData.get("name"),
        address: formData.get("address"),
        phone: formData.get("phone"),
        taxId: formData.get("taxId"),
      };

      const res = await fetch(
        `/api/vendors/${vendor.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        alert("บันทึกสำเร็จ");

        location.href = "/vendors";
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);

      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          ข้อมูลผู้จำหน่าย
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
        <h2 className="text-lg font-extrabold !text-white sm:text-xl">
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
        {/* ชื่อผู้จำหน่าย */}

        <div className="min-w-0">
          <label
            htmlFor="name"
            className="
              block
              text-sm
              font-extrabold
              !text-slate-200
            "
          >
            ชื่อผู้จำหน่าย *
          </label>

          <input
            id="name"
            name="name"
            defaultValue={vendor.name}
            required
            className="
              mt-2
              min-h-[50px]
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />
        </div>

        {/* เบอร์โทร */}

        <div className="min-w-0">
          <label
            htmlFor="phone"
            className="
              block
              text-sm
              font-extrabold
              !text-slate-200
            "
          >
            เบอร์โทร
          </label>

          <input
            id="phone"
            name="phone"
            defaultValue={vendor.phone ?? ""}
            className="
              mt-2
              min-h-[50px]
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />
        </div>

        {/* เลขประจำตัวผู้เสียภาษี */}

        <div className="min-w-0">
          <label
            htmlFor="taxId"
            className="
              block
              text-sm
              font-extrabold
              !text-slate-200
            "
          >
            เลขประจำตัวผู้เสียภาษี
          </label>

          <input
            id="taxId"
            name="taxId"
            defaultValue={vendor.taxId ?? ""}
            className="
              mt-2
              min-h-[50px]
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />
        </div>
      </div>

      {/* =====================================================
          ที่อยู่
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
          <h2 className="text-lg font-extrabold !text-white sm:text-xl">
            📍 ที่อยู่ผู้จำหน่าย
          </h2>
        </div>

        <div className="mt-4">
          <label
            htmlFor="address"
            className="
              block
              text-sm
              font-extrabold
              !text-slate-200
            "
          >
            ที่อยู่
          </label>

          <textarea
            id="address"
            name="address"
            rows={4}
            defaultValue={vendor.address ?? ""}
            className="
              mt-2
              min-h-[120px]
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />
        </div>
      </div>

      {/* =====================================================
          ปุ่ม
      ===================================================== */}

      <div
        className="
          flex
          w-full
          flex-col
          gap-3
          border-t
          border-slate-700
          pt-5
          sm:flex-row
          sm:justify-end
        "
      >
        {/* ยกเลิก */}

        <a
          href="/vendors"
          className="
            w-full
            rounded-xl
            bg-slate-700
            px-6
            py-3
            text-center
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:bg-slate-800
            sm:w-auto
          "
        >
          ยกเลิก
        </a>

        {/* บันทึก */}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-7
            py-3
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-emerald-700
            hover:to-green-600
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          {loading
            ? "กำลังบันทึก..."
            : "💾 บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  );
}