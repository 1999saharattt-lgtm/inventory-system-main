"use client";

import Link from "next/link";
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
  role?: string;
};

const categoryIcon: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
};

const categoryColor: Record<string, string> = {
  OFFICE: "from-blue-500 to-blue-700",
  COMPUTER: "from-violet-500 to-violet-700",
  ELECTRIC: "from-amber-400 to-amber-600",
  HOUSEHOLD: "from-emerald-500 to-emerald-700",
  VEHICLE: "from-red-500 to-red-700",
  PRINTING: "from-cyan-500 to-cyan-700",
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
  role,
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

  /*
   * =====================================================
   * ADMIN
   * =====================================================
   */

  if (role === "ADMIN") {
    return (
      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        {/* =====================================================
            Search Box
        ===================================================== */}

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

        {/* =====================================================
            Categories
        ===================================================== */}

        <div className="w-full min-w-0 space-y-5 sm:space-y-6">
          {categories.map((category) => {
            const categoryMaterials = filteredMaterials.filter(
              (material) => material.category === category
            );

            return (
              <section
                key={category}
                className="
                  w-full
                  min-w-0
                "
              >
                {/* =====================================================
                    Category Header
                ===================================================== */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-t-2xl
                    bg-gradient-to-r
                    from-slate-950
                    via-slate-800
                    to-slate-700
                    px-4
                    py-4
                    text-white
                    sm:px-6
                  "
                >
                  <h2
                    className="
                      min-w-0
                      break-words
                      text-xl
                      font-extrabold
                      !text-white
                      sm:text-2xl
                    "
                  >
                    {categoryName[category] ?? category}
                  </h2>

                  <span
                    className="
                      shrink-0
                      rounded-lg
                      bg-white/10
                      px-3
                      py-2
                      text-sm
                      font-bold
                      text-white
                      sm:px-4
                      sm:text-base
                    "
                  >
                    {categoryMaterials.length} รายการ
                  </span>
                </div>

                {/* =====================================================
                    Table
                    ไม่มีกรอบ wrapper ซ้ำ
                ===================================================== */}

                <div
                  className="
                    w-full
                    min-w-0
                    overflow-x-auto
                    overscroll-x-contain
                  "
                >
                  <table
                    className="
                      w-full
                      min-w-[900px]
                      border-collapse
                      border-x
                      border-t
                      border-black
                      bg-white
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
                              whitespace-nowrap
                              border
                              border-black
                              bg-gradient-to-r
                              from-slate-800
                              to-slate-700
                              px-4
                              py-4
                              text-center
                              text-lg
                              font-extrabold
                              !text-white
                            "
                          >
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="text-slate-900">
                      {categoryMaterials.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="
                              border
                              border-black
                              px-4
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
                              text-slate-900
                              transition
                              hover:bg-blue-50
                            "
                          >
                            <td
                              className="
                                whitespace-nowrap
                                border
                                border-black
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
                                whitespace-nowrap
                                border
                                border-black
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
                                border-black
                                px-4
                                py-3
                                font-bold
                              "
                            >
                              {material.name || "-"}
                            </td>

                            <td
                              className="
                                whitespace-nowrap
                                border
                                border-black
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
                                whitespace-nowrap
                                border
                                border-black
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
                                whitespace-nowrap
                                border
                                border-black
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
                                border-black
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

                    {/* =================================================
                        เส้นปิดท้ายตารางสีดำ
                    ================================================= */}

                    <tfoot>
                      <tr>
                        <td
                          colSpan={7}
                          className="
                            h-0
                            border-x-0
                            border-b-2
                            border-t-0
                            border-black
                            bg-white
                            p-0
                          "
                          style={{
                            height: "2px",
                          }}
                        />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * STAFF / VIEWER
   * =====================================================
   */

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* =====================================================
          Search
      ===================================================== */}

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

      {/* =====================================================
          Category Cards
      ===================================================== */}

      <div
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-3
          sm:gap-5
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {categories.map((category) => {
          const categoryMaterials = filteredMaterials.filter(
            (material) => material.category === category
          );

          return (
            <Link
              key={category}
              href={`/materials/summary/${category}`}
              className="
                group
                min-w-0
                overflow-hidden
                rounded-2xl
                border
                border-slate-300
                bg-white
                shadow-lg
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
              "
            >
              <div
                className={`
                  h-1.5
                  bg-gradient-to-r
                  ${
                    categoryColor[category] ??
                    "from-slate-700 to-slate-900"
                  }
                  sm:h-2
                `}
              />

              <div
                className="
                  flex
                  min-h-[180px]
                  min-w-0
                  flex-col
                  items-center
                  justify-between
                  gap-3
                  p-4
                  text-center
                  sm:min-h-[230px]
                  sm:p-6
                "
              >
                <div
                  className="
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-100
                    text-2xl
                    shadow-md
                    transition
                    duration-300
                    group-hover:scale-110
                    sm:h-16
                    sm:w-16
                    sm:text-3xl
                  "
                >
                  {categoryIcon[category] ?? "📦"}
                </div>

                <div className="min-w-0 max-w-full">
                  <h2
                    className="
                      break-words
                      text-base
                      font-extrabold
                      leading-tight
                      text-slate-900
                      sm:text-xl
                    "
                  >
                    {categoryName[category] ?? category}
                  </h2>

                  <p
                    className="
                      mt-2
                      break-words
                      text-xs
                      font-semibold
                      leading-tight
                      text-slate-600
                      sm:text-base
                    "
                  >
                    คลิกเพื่อดูรายการพัสดุในหมวดนี้
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    bg-slate-100
                    px-5
                    py-2
                    text-sm
                    font-extrabold
                    text-slate-800
                    shadow-sm
                    sm:px-6
                    sm:py-2.5
                    sm:text-base
                  "
                >
                  {categoryMaterials.length} รายการ
                </div>

                <span
                  className="
                    rounded-xl
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-950
                    px-6
                    py-2
                    text-sm
                    font-extrabold
                    text-white
                    shadow-lg
                    transition
                    group-hover:scale-105
                    sm:px-8
                    sm:py-3
                    sm:text-lg
                  "
                >
                  เปิด
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}