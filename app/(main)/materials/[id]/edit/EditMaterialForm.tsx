"use client";

import { useMemo, useState } from "react";
import { MATERIALS } from "@/lib/materials";
import { UNITS } from "@/lib/units";
import { useRouter } from "next/navigation";

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

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
];

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
};

export default function EditMaterialForm({
  material,
  vendors,
}: {
  material: Material;
  vendors: Vendor[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState(material.category);
  const [name, setName] = useState(material.name);

  const [vendorId, setVendorId] = useState(
    material.vendorId?.toString() ?? ""
  );
    const names = useMemo(() => {
    const thaiCategory = categoryName[category];

    return (
      MATERIALS[
        thaiCategory as keyof typeof MATERIALS
      ] ?? []
    );
  }, [category]);

  const unit = name ? UNITS[name] ?? "" : "";

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const body = {
        code: formData.get("code"),
        category,
        name,
        unit,
        balance: Number(formData.get("balance")),
        latestPrice: Number(formData.get("latestPrice")),
        vendorId: vendorId
          ? Number(vendorId)
          : null,
      };

      const res = await fetch(
        `/api/materials/${material.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const text = await res.text();

      let data: { message: string } | null = null;

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
          data?.message ?? "บันทึกไม่สำเร็จ"
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
    return (
    <form
      onSubmit={handleSubmit}
      className="
        space-y-6
        rounded-3xl
        border
        border-slate-700
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-800
        p-8
        text-white
        shadow-2xl
      "
    >

      {/* รหัสพัสดุ */}

      <div>

        <label className="mb-2 block text-lg font-extrabold text-white">
          รหัสพัสดุ
        </label>

        <input
          name="code"
          defaultValue={material.code}
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "
        />

      </div>

      {/* หมวดหมู่ */}

      <div>

        <label className="mb-2 block text-lg font-extrabold text-white">
          หมวดหมู่
        </label>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setName("");
          }}
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryName[c]}
            </option>
          ))}
        </select>

      </div>

      {/* รายการพัสดุ */}

      <div>

        <label className="mb-2 block text-lg font-extrabold text-white">
          รายการพัสดุ
        </label>

        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "
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

      </div>

      {/* ผู้จำหน่าย */}

      <div>

        <label className="mb-2 block text-lg font-extrabold text-white">
          ผู้จำหน่าย
        </label>

        <select
          value={vendorId}
          onChange={(e) =>
            setVendorId(e.target.value)
          }
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "
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

      </div>
            {/* จำนวนคงเหลือ + หน่วย */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          md:grid-cols-2
        "
      >

        <div>

          <label className="mb-2 block text-lg font-extrabold text-white">
            จำนวนคงเหลือ
          </label>

          <input
            type="number"
            name="balance"
            defaultValue={material.balance}
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              text-white
              focus:border-cyan-400
              focus:outline-none
            "
          />

        </div>

        <div>

          <label className="mb-2 block text-lg font-extrabold text-white">
            หน่วย
          </label>

          <input
            value={unit}
            readOnly
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-700
              p-3
              text-white
            "
          />

        </div>

      </div>

      {/* ราคาล่าสุด */}

      <div>

        <label className="mb-2 block text-lg font-extrabold text-white">
          ราคาล่าสุด
        </label>

        <input
          type="number"
          step="0.01"
          name="latestPrice"
          defaultValue={material.latestPrice}
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-right
            text-white
            focus:border-cyan-400
            focus:outline-none
          "
        />

      </div>

      {/* Buttons */}

      <div
        className="
          flex
          gap-4
          pt-4
        "
      >

        <button
          type="submit"
          disabled={loading}
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-8
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            disabled:opacity-50
          "
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>

      </div>

    </form>
  );
}