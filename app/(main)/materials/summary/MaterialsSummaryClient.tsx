"use client";

import { useMemo, useState } from "react";

type Material = {
  id: number;
  category: string;
  code: string;
  name: string;
  balance: number;
  unit: string;
  latestPrice: number | null;
  latestVendor: string;
};

type Props = {
  materials: Material[];
  categories: string[];
  categoryName: Record<string, string>;
};

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MaterialsSummaryClient({
  materials,
  categories,
  categoryName,
}: Props) {
  const [search, setSearch] = useState("");

  const keyword = search.trim().toLowerCase();

  const filteredMaterials = useMemo(() => {
    if (!keyword) {
      return materials;
    }

    return materials.filter((material) => {
      return (
        material.code?.toLowerCase().includes(keyword) ||
        material.name?.toLowerCase().includes(keyword) ||
        material.latestVendor?.toLowerCase().includes(keyword)
      );
    });
  }, [materials, keyword]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      {/* Search Box */}

      <form onSubmit={handleSubmit}>
        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            p-4
            shadow-xl
          "
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              className="
                flex-1
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                px-4
                py-3
                text-base
                font-semibold
                text-white
                placeholder:text-slate-400
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-500/20
              "
            />

            <button
              type="submit"
              className="
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-6
                py-3
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-105
                hover:shadow-xl
                active:scale-95
              "
            >
              ค้นหา
            </button>

            <div
              className="
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                px-5
                py-3
                text-center
                font-extrabold
                text-white
              "
            >
              พบ {filteredMaterials.length} รายการ
            </div>

          </div>
        </div>
      </form>

      {/* Categories */}

      {categories.map((category) => {
        const categoryMaterials = filteredMaterials.filter(
          (material) => material.category === category
        );

        return (
          <div
            key={category}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-300
              bg-white
              shadow-lg
            "
          >
            {/* Category Header */}

            <div
              className="
                flex
                items-center
                justify-between
                bg-gradient-to-r
                from-slate-950
                via-slate-800
                to-slate-700
                px-6
                py-4
                text-white
              "
            >
              <h2
                className="
                  text-2xl
                  font-extrabold
                  !text-white
                "
              >
                {categoryName[category] ?? category}
              </h2>

              <span
                className="
                  rounded-lg
                  bg-white/10
                  px-4
                  py-2
                  font-bold
                  text-white
                "
              >
                {categoryMaterials.length} รายการ
              </span>
            </div>

            {/* Table */}

            <div className="overflow-x-auto">
              <table
                className="
                  min-w-full
                  border-collapse
                  border
                  border-slate-900
                "
              >
                <thead>
                  <tr>
                    {[
                      "ลำดับ",
                      "รหัสพัสดุ",
                      "รายการพัสดุ",
                      "จำนวน",
                      "หน่วย",
                      "ราคา",
                      "ผู้จำหน่ายล่าสุด",
                    ].map((title) => (
                      <th
                        key={title}
                        className="
                          border
                          border-slate-900
                          bg-gradient-to-r
                          from-slate-800
                          to-slate-700
                          px-4
                          py-4
                          text-center
                          text-lg
                          font-extrabold
                          text-white
                        "
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {categoryMaterials.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="
                          border
                          border-slate-900
                          py-10
                          text-center
                          text-lg
                          font-bold
                          text-slate-500
                        "
                      >
                        {keyword
                          ? "ไม่พบข้อมูลที่ค้นหา"
                          : "ยังไม่มีพัสดุในหมวดนี้"}
                      </td>
                    </tr>
                  ) : (
                    categoryMaterials.map((material, index) => (
                      <tr
                        key={material.id}
                        className="
                          border
                          border-slate-900
                          text-slate-900
                          transition
                          hover:bg-blue-50
                        "
                      >
                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            text-center
                            font-bold
                          "
                        >
                          {index + 1}
                        </td>

                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            text-center
                            font-bold
                          "
                        >
                          {material.code || "-"}
                        </td>

                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            font-bold
                          "
                        >
                          {material.name || "-"}
                        </td>

                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            text-center
                            font-extrabold
                          "
                        >
                          {material.balance ?? 0}
                        </td>

                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            text-center
                            font-semibold
                          "
                        >
                          {material.unit || "-"}
                        </td>

                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            text-right
                            font-semibold
                          "
                        >
                          {formatMoney(material.latestPrice)}
                        </td>

                        <td
                          className="
                            border
                            border-slate-900
                            px-4
                            py-3
                            font-semibold
                          "
                        >
                          {material.latestVendor || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}