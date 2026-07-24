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
      const formData = new FormData(
        e.currentTarget
      );

      const body = {
        code: formData.get("code"),

        category,

        name,

        unit,

        balance: Number(
          formData.get("balance")
        ),

        latestPrice: Number(
          formData.get("latestPrice")
        ),

        // ใช้ค่าที่เลือกจาก Dropdown
        vendorId: vendorId
          ? Number(vendorId)
          : null,
      };

      const res = await fetch(
        `/api/materials/${material.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const text = await res.text();

      let data: {
  message: string;
} | null = null;

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
          data?.message ??
            "บันทึกไม่สำเร็จ"
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
        <div>
        <label className="mb-2 block font-medium">
          ผู้จำหน่าย
        </label>

        <select
          value={vendorId}
          onChange={(e) =>
            setVendorId(e.target.value)
          }
          className="
            w-full
            rounded-lg
            border
            p-3
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
        return (
    <form
      onSubmit={handleSubmit}
      className="
        space-y-5
        rounded-xl
        bg-white
        p-6
        shadow
        text-black
      "
    >
      <div>
        <label className="mb-2 block font-medium">
          รหัสพัสดุ
        </label>

        <input
          name="code"
          defaultValue={material.code}
          className="
            w-full
            rounded-lg
            border
            p-3
          "
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          หมวด
        </label>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setName("");
          }}
          className="
            w-full
            rounded-lg
            border
            p-3
          "
        >
          {categories.map((c) => (
            <option
              key={c}
              value={c}
            >
              {categoryName[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          รายการพัสดุ
        </label>

        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="
            w-full
            rounded-lg
            border
            p-3
          "
        >
          <option value="">
            เลือกพัสดุ
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

      <div>
        <label className="mb-2 block font-medium">
          ผู้จำหน่าย
        </label>

        <select
          value={vendorId}
          onChange={(e) =>
            setVendorId(e.target.value)
          }
          className="
            w-full
            rounded-lg
            border
            p-3
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

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="mb-2 block font-medium">
            จำนวนคงเหลือ
          </label>

          <input
            type="number"
            name="balance"
            defaultValue={material.balance}
            className="
              w-full
              rounded-lg
              border
              p-3
            "
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            หน่วย
          </label>

          <input
            value={unit}
            readOnly
            className="
              w-full
              rounded-lg
              border
              bg-gray-100
              p-3
            "
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          ราคาล่าสุด
        </label>

        <input
          type="number"
          step="0.01"
          name="latestPrice"
          defaultValue={material.latestPrice}
          className="
            w-full
            rounded-lg
            border
            p-3
          "
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="
            rounded-lg
            bg-blue-600
            px-6
            py-3
            text-white
            hover:bg-blue-700
            disabled:opacity-50
          "
        >
          {loading
            ? "กำลังบันทึก..."
            : "บันทึก"}
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/materials/category/${material.category}`
            )
          }
          className="
            rounded-lg
            bg-slate-200
            px-6
            py-3
            text-slate-700
            hover:bg-slate-300
          "
        >
          ← กลับ
        </button>
      </div>
    </form>
  );
}
