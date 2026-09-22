"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppButton from "@/components/AppButton";

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

  /* =========================================================
     Search
  ========================================================= */

  const filteredMaterials = useMemo(() => {
    if (!keyword) {
      return materials;
    }

    return materials.filter((material) => {
      return (
        material.code?.toLowerCase().includes(keyword) ||
        material.name?.toLowerCase().includes(keyword) ||
        material.latestVendor
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [materials, keyword]);

  function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
  }

  /* =========================================================
     Search Component
  ========================================================= */

  const searchBox = (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border
          border-white/80
          bg-white/75
          p-4
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
          sm:p-5
        "
      >
        {/* Ambient background */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-20
            -top-20
            h-48
            w-48
            rounded-full
            bg-blue-400/10
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-24
            right-0
            h-48
            w-48
            rounded-full
            bg-cyan-400/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-3
            lg:flex-row
            lg:items-center
          "
        >
          {/* Search Input */}

          <div className="relative min-w-0 flex-1">
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-4
                flex
                items-center
                text-lg
              "
            >
              🔎
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / ผู้จำหน่าย"
              className="
                h-12
                w-full
                rounded-[16px]
                border
                border-black
                bg-white/90
                py-3
                pl-12
                pr-4
                text-base
                font-bold
                !text-slate-900
                shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]
                outline-none
                transition-all
                duration-300
                placeholder:!text-slate-400
                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          {/* Search Button */}

          <AppButton
            type="submit"
            variant="secondary"
            size="lg"
            icon={<span>🔎</span>}
          >
            ค้นหา
          </AppButton>

          {/* Result Count */}

          <div
            className="
              inline-flex
              h-12
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-[16px]
              border
              border-black
              bg-slate-100/80
              px-5
              text-sm
              font-extrabold
              !text-slate-700
              shadow-sm
              backdrop-blur-xl
            "
          >
            <span
              className="
                flex
                h-7
                min-w-7
                items-center
                justify-center
                rounded-full
                border
                border-black
                bg-white
                px-2
                text-xs
                font-black
                !text-slate-900
                shadow-sm
              "
            >
              {filteredMaterials.length}
            </span>

            <span>รายการ</span>
          </div>

          {/* Clear Search */}

          {search && (
            <AppButton
              type="button"
              variant="outline"
              size="lg"
              icon={<span>✕</span>}
              onClick={() => setSearch("")}
            >
              ล้าง
            </AppButton>
          )}
        </div>
      </div>
    </form>
  );

  /* =========================================================
     ADMIN
  ========================================================= */

  if (role === "ADMIN") {
    return (
      <div
        className="
          w-full
          min-w-0
          space-y-5
          sm:space-y-6
        "
      >
        {/* Search */}

        {searchBox}

        {/* ===================================================
            Categories
        =================================================== */}

        <div
          className="
            w-full
            min-w-0
            space-y-6
          "
        >
          {categories.map((category) => {
            const categoryMaterials =
              filteredMaterials.filter(
                (material) =>
                  material.category === category
              );

            const color =
              categoryColor[category] ??
              "from-slate-600 to-slate-800";

            return (
              <section
                key={category}
                className="
                  w-full
                  min-w-0
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-slate-200
                  bg-white/90
                  shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
                  backdrop-blur-xl
                "
              >
                {/* ===========================================
                    Category Header
                =========================================== */}

                <div
                  className="
                    relative
                    flex
                    min-h-[76px]
                    items-center
                    justify-between
                    gap-4
                    overflow-hidden
                    border-b
                    border-slate-200
                    bg-white/90
                    px-4
                    py-4
                    sm:px-6
                  "
                >
                  {/* Ambient Glow */}

                  <div
                    aria-hidden="true"
                    className={`
                      pointer-events-none
                      absolute
                      -left-12
                      -top-20
                      h-40
                      w-40
                      rounded-full
                      bg-gradient-to-br
                      ${color}
                      opacity-[0.08]
                      blur-3xl
                    `}
                  />

                  <div
                    className="
                      relative
                      flex
                      min-w-0
                      items-center
                      gap-3
                    "
                  >
                    {/* Icon */}

                    <div
                      className={`
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-[16px]
                        bg-gradient-to-br
                        ${color}
                        text-2xl
                        shadow-[0_12px_24px_-14px_rgba(15,23,42,0.5)]
                        ring-1
                        ring-white/30
                      `}
                    >
                      {categoryIcon[category] ??
                        "📦"}
                    </div>

                    <div className="min-w-0">
                      <h2
                        className="
                          break-words
                          text-xl
                          font-black
                          leading-tight
                          tracking-tight
                          !text-slate-900
                          sm:text-2xl
                        "
                      >
                        {categoryName[category] ??
                          category}
                      </h2>

                      <p
                        className="
                          mt-1
                          text-xs
                          font-bold
                          !text-slate-500
                          sm:text-sm
                        "
                      >
                        รายการพัสดุในหมวดนี้
                      </p>
                    </div>
                  </div>

                  {/* Count */}

                  <span
                    className="
                      relative
                      inline-flex
                      h-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-slate-200
                      bg-slate-100/80
                      px-4
                      text-sm
                      font-extrabold
                      !text-slate-700
                      shadow-sm
                    "
                  >
                    {categoryMaterials.length} รายการ
                  </span>
                </div>

                {/* ===========================================
                    Table
                =========================================== */}

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
                      min-w-[950px]
                      border-collapse
                      border
                      border-black
                      !rounded-none
                      !shadow-none
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

                    <tbody>
                      {categoryMaterials.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="
                              border
                              border-black
                              bg-white
                              px-4
                              py-12
                              text-center
                            "
                          >
                            <div
                              className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                gap-2
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-12
                                  w-12
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-slate-100
                                  text-xl
                                "
                              >
                                🔎
                              </div>

                              <span
                                className="
                                  text-base
                                  font-extrabold
                                  !text-slate-500
                                "
                              >
                                {keyword
                                  ? "ไม่พบข้อมูลที่ค้นหา"
                                  : "ยังไม่มีพัสดุในหมวดนี้"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        categoryMaterials.map(
                          (material, index) => (
                            <tr
                              key={material.id}
                              className="
                                bg-white
                                transition-colors
                                duration-200
                                hover:bg-slate-50
                              "
                            >
                              <td
                                className="
                                  whitespace-nowrap
                                  border
                                  border-black
                                  px-4
                                  py-3.5
                                  text-center
                                  font-bold
                                  !text-slate-700
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
                                  py-3.5
                                  text-center
                                "
                              >
                                <span
                                  className="
                                    inline-flex
                                    rounded-lg
                                    bg-slate-100
                                    px-2.5
                                    py-1
                                    font-extrabold
                                    !text-slate-800
                                  "
                                >
                                  {material.code ||
                                    "-"}
                                </span>
                              </td>

                              <td
                                className="
                                  border
                                  border-black
                                  px-4
                                  py-3.5
                                  font-extrabold
                                  !text-slate-900
                                "
                              >
                                {material.name ||
                                  "-"}
                              </td>

                              <td
                                className="
                                  whitespace-nowrap
                                  border
                                  border-black
                                  px-4
                                  py-3.5
                                  text-center
                                "
                              >
                                <span
                                  className="
                                    inline-flex
                                    min-w-10
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-blue-50
                                    px-3
                                    py-1
                                    font-black
                                    !text-blue-700
                                  "
                                >
                                  {material.balance ??
                                    0}
                                </span>
                              </td>

                              <td
                                className="
                                  whitespace-nowrap
                                  border
                                  border-black
                                  px-4
                                  py-3.5
                                  text-center
                                  font-bold
                                  !text-slate-600
                                "
                              >
                                {material.unit ||
                                  "-"}
                              </td>

                              <td
                                className="
                                  whitespace-nowrap
                                  border
                                  border-black
                                  px-4
                                  py-3.5
                                  text-right
                                  font-extrabold
                                  !text-slate-800
                                "
                              >
                                {formatMoney(
                                  material.latestPrice
                                )}
                              </td>

                              <td
                                className="
                                  border
                                  border-black
                                  px-4
                                  py-3.5
                                  font-bold
                                  !text-slate-700
                                "
                              >
                                {material.latestVendor ||
                                  "-"}
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================================================
     STAFF / VIEWER
  ========================================================= */

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-5
        sm:space-y-6
      "
    >
      {/* =====================================================
          Search
      ===================================================== */}

      {searchBox}

      {/* =====================================================
          Category Cards
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {categories.map((category) => {
          const categoryMaterials =
            filteredMaterials.filter(
              (material) =>
                material.category === category
            );

          const color =
            categoryColor[category] ??
            "from-slate-600 to-slate-800";

          return (
            <Link
              key={category}
              href={`/materials/summary/${category}`}
              prefetch
              className="
                group
                relative
                min-w-0
                overflow-hidden
                rounded-[28px]
                border
                border-white/80
                bg-white/80
                shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
                backdrop-blur-2xl
                transition-all
                duration-300
                ease-out
                hover:-translate-y-1
                hover:border-slate-200
                hover:bg-white/95
                hover:shadow-[0_26px_64px_-28px_rgba(15,23,42,0.45)]
                active:translate-y-0
                active:scale-[0.985]
              "
            >
              {/* Accent */}

              <div
                className={`
                  h-1.5
                  bg-gradient-to-r
                  ${color}
                `}
              />

              {/* Ambient Glow */}

              <div
                aria-hidden="true"
                className={`
                  pointer-events-none
                  absolute
                  -right-12
                  -top-12
                  h-36
                  w-36
                  rounded-full
                  bg-gradient-to-br
                  ${color}
                  opacity-[0.08]
                  blur-3xl
                  transition-all
                  duration-500
                  group-hover:scale-125
                  group-hover:opacity-[0.14]
                `}
              />

              <div
                className="
                  relative
                  flex
                  min-h-[220px]
                  min-w-0
                  flex-col
                  p-5
                  sm:min-h-[235px]
                  sm:p-6
                "
              >
                {/* Icon */}

                <div
                  className={`
                    flex
                    h-16
                    w-16
                    shrink-0
                    items-center
                    justify-center
                    rounded-[20px]
                    bg-gradient-to-br
                    ${color}
                    text-3xl
                    shadow-[0_16px_30px_-18px_rgba(15,23,42,0.5)]
                    ring-1
                    ring-white/30
                    transition-all
                    duration-300
                    group-hover:-translate-y-0.5
                    group-hover:scale-[1.06]
                    group-active:scale-[0.96]
                  `}
                >
                  {categoryIcon[category] ??
                    "📦"}
                </div>

                {/* Text */}

                <div className="mt-5 min-w-0">
                  <h2
                    className="
                      break-words
                      text-xl
                      font-black
                      leading-tight
                      tracking-tight
                      !text-slate-900
                      sm:text-2xl
                    "
                  >
                    {categoryName[category] ??
                      category}
                  </h2>

                  <p
                    className="
                      mt-2
                      break-words
                      text-sm
                      font-semibold
                      leading-relaxed
                      !text-slate-500
                      sm:text-base
                    "
                  >
                    คลิกเพื่อดูรายการพัสดุในหมวดนี้
                  </p>
                </div>

                {/* Footer */}

                <div
                  className="
                    mt-auto
                    flex
                    items-center
                    justify-between
                    gap-3
                    pt-5
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-slate-200
                      bg-white/80
                      px-3
                      py-1.5
                      text-xs
                      font-extrabold
                      !text-slate-600
                      shadow-sm
                    "
                  >
                    {categoryMaterials.length} รายการ
                  </span>

                  <span
                    className="
                      inline-flex
                      h-10
                      items-center
                      justify-center
                      gap-2
                      rounded-[14px]
                      bg-slate-900
                      px-4
                      text-sm
                      font-extrabold
                      !text-white
                      shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)]
                      transition-all
                      duration-300
                      group-hover:bg-slate-800
                      group-active:scale-[0.96]
                    "
                  >
                    <span>เปิด</span>

                    <span
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    >
                      →
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}