"use client";

import { useState } from "react";

export default function VendorForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const body = Object.fromEntries(formData.entries());

    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      alert("เพิ่มผู้จำหน่ายสำเร็จ");
      window.location.href = "/vendors";
    } else {
      alert("เกิดข้อผิดพลาด");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow text-black"
    >
      <div>
        <label className="mb-2 block font-medium">
          ชื่อผู้จำหน่าย
        </label>

        <input
          name="name"
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          ที่อยู่
        </label>

        <textarea
          name="address"
          rows={3}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          เบอร์โทร
        </label>

        <input
          name="phone"
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          เลขประจำตัวผู้เสียภาษี
        </label>

        <input
          name="taxId"
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex gap-3">
        <button
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>

        <a
          href="/vendors"
          className="rounded-lg bg-gray-300 px-6 py-3"
        >
          ยกเลิก
        </a>
      </div>
    </form>
  );
}