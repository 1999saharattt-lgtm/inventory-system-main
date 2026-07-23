"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  { value: "OFFICE", label: "วัสดุสำนักงาน" },
  { value: "COMPUTER", label: "วัสดุคอมพิวเตอร์" },
  { value: "ELECTRIC", label: "วัสดุไฟฟ้าและวิทยุ" },
  { value: "HOUSEHOLD", label: "วัสดุงานบ้านและงานครัว" },
  { value: "VEHICLE", label: "วัสดุยานพาหนะ" },
  { value: "PRINTING", label: "สื่อสิ่งพิมพ์" },
];

export default function MaterialMasterForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("OFFICE");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/material-master", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category,
        name,
        unit,
      }),
    });

    if (res.ok) {
      alert("บันทึกสำเร็จ");
      router.push("/material-master");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.message ?? "บันทึกไม่สำเร็จ");
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow text-black"
    >
      <div>
        <label className="mb-2 block font-medium">
          หมวดหมู่
        </label>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border p-3"
        >
          {categories.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          ชื่อพัสดุ
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          หน่วยนับ
        </label>

        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          required
          className="w-full rounded-lg border p-3"
          placeholder="เช่น ชิ้น, กล่อง, รีม"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-gray-300 px-6 py-3 hover:bg-gray-400"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}