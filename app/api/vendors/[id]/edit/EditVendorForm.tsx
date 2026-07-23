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
    formData: FormData
  ) {
    setLoading(true);

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

    setLoading(false);
  }

  return (
    <form
      action={handleSubmit}
      className="max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow text-black"
    >
      <div>
        <label className="mb-2 block font-medium">
          ชื่อผู้จำหน่าย
        </label>

        <input
          name="name"
          defaultValue={vendor.name}
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
          defaultValue={vendor.address ?? ""}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          เบอร์โทร
        </label>

        <input
          name="phone"
          defaultValue={vendor.phone ?? ""}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          เลขประจำตัวผู้เสียภาษี
        </label>

        <input
          name="taxId"
          defaultValue={vendor.taxId ?? ""}
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