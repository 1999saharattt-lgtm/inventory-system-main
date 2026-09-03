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
        w-full
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
          grid
          grid-cols-1
          gap-5
          md:grid-cols-2
        "
      >
        {/* ชื่อผู้จำหน่าย */}

        <div>
          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            "
          >
            ชื่อผู้จำหน่าย
          </label>

          <input
            name="name"
            defaultValue={vendor.name}
            required
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:outline-none
            "
          />
        </div>

        {/* เบอร์โทร */}

        <div>
          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            "
          >
            เบอร์โทร
          </label>

          <input
            name="phone"
            defaultValue={vendor.phone ?? ""}
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:outline-none
            "
          />
        </div>

        {/* เลขประจำตัวผู้เสียภาษี */}

        <div>
          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            "
          >
            เลขประจำตัวผู้เสียภาษี
          </label>

          <input
            name="taxId"
            defaultValue={vendor.taxId ?? ""}
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:outline-none
            "
          />
        </div>
      </div>

      {/* =====================================================
          ที่อยู่
      ===================================================== */}

      <div>
        <label
          className="
            mb-2
            block
            text-lg
            font-extrabold
            text-white
          "
        >
          ที่อยู่
        </label>

        <textarea
          name="address"
          rows={4}
          defaultValue={vendor.address ?? ""}
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            font-bold
            text-white
            outline-none
            transition
            focus:border-cyan-400
            focus:outline-none
          "
        />
      </div>

      {/* =====================================================
          ปุ่ม
      ===================================================== */}

      <div
        className="
          flex
          justify-end
          gap-3
          border-t
          border-slate-700
          pt-5
        "
      >
        {/* ยกเลิก */}

        <a
          href="/vendors"
          className="
            rounded-xl
            bg-slate-700
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:bg-slate-800
          "
        >
          ยกเลิก
        </a>

        {/* บันทึก */}

        <button
          type="submit"
          disabled={loading}
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-7
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            disabled:cursor-not-allowed
            disabled:opacity-50
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