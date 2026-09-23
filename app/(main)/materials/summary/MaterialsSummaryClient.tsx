"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import AppSearchInput from "@/components/AppSearchInput";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   CATEGORY
========================================================= */

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

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return value.toLocaleString(
    "th-TH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function MaterialsSummaryClient({
  materials,
  categories,
  categoryName,
  role,
}: Props) {
  const [
    search,
    setSearch,
  ] = useState("");

  const keyword = search
    .trim()
    .toLowerCase();

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMaterials =
    useMemo(() => {
      if (!keyword) {
        return materials;
      }

      return materials.filter(
        (material) => {
          return (
            material.code
              ?.toLowerCase()
              .includes(keyword) ||
            material.name
              ?.toLowerCase()
              .includes(keyword) ||
            material.latestVendor
              ?.toLowerCase()
              .includes(keyword)
          );
        }
      );
    }, [
      materials,
      keyword,
    ]);

  /* =======================================================
     SEARCH COMPONENT

     ใช้ AppSearchInput ตัวกลางทั้งหมด
     - ช่องค้นหา
     - ปุ่มค้นหา
     - จำนวนผลลัพธ์
     - ปุ่มล้าง
  ======================================================= */

  const searchBox = (
    <AppSearchInput
      value={search}
      onChange={(event) =>
        setSearch(
          event.target.value
        )
      }
      onSubmit={() => {
        /* Search ทำแบบ realtime อยู่แล้ว */
      }}
      onClear={() =>
        setSearch("")
      }
      placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / ผู้จำหน่าย"
      resultCount={
        filteredMaterials.length
      }
      resultLabel="รายการ"
      showSearchButton
      showClearButton
      searchButtonText="ค้นหา"
      clearButtonText="ล้าง"
    />
  );

  /* =======================================================
     ADMIN
  ======================================================= */

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
        {/* ===============================================
            SEARCH
        =============================================== */}

        {searchBox}

        {/* ===============================================
            CATEGORY TABLES
        =============================================== */}

        <div
          className="
            w-full
            min-w-0
            space-y-6
          "
        >
          {categories.map(
            (category) => {
              const categoryMaterials =
                filteredMaterials.filter(
                  (material) =>
                    material.category ===
                    category
                );

              return (
                <AppTableCard
                  key={category}
                  title={
                    categoryName[
                      category
                    ] ?? category
                  }
                  subtitle={`รายการพัสดุในหมวดนี้ • ${categoryMaterials.length.toLocaleString(
                    "th-TH"
                  )} รายการ`}
                >
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
                          ].map(
                            (
                              title
                            ) => (
                              <th
                                key={
                                  title
                                }
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
                                {
                                  title
                                }
                              </th>
                            )
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {categoryMaterials.length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan={
                                7
                              }
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
                            (
                              material,
                              index
                            ) => (
                              <tr
                                key={
                                  material.id
                                }
                                className={`
                                  transition-colors
                                  duration-200

                                  ${
                                    index %
                                      2 ===
                                    0
                                      ? "bg-white"
                                      : "bg-slate-50/60"
                                  }

                                  hover:bg-blue-50/70
                                `}
                              >
                                {/* ORDER */}

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
                                  {index +
                                    1}
                                </td>

                                {/* CODE */}

                                <td
                                  className="
                                    whitespace-nowrap
                                    border
                                    border-black
                                    px-4
                                    py-3.5
                                    text-center
                                    font-extrabold
                                    !text-slate-900
                                  "
                                >
                                  {material.code ||
                                    "-"}
                                </td>

                                {/* NAME */}

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

                                {/* BALANCE */}

                                <td
                                  className="
                                    whitespace-nowrap
                                    border
                                    border-black
                                    px-4
                                    py-3.5
                                    text-center
                                    font-black
                                    tabular-nums
                                    !text-slate-900
                                  "
                                >
                                  {(
                                    material.balance ??
                                    0
                                  ).toLocaleString(
                                    "th-TH"
                                  )}
                                </td>

                                {/* UNIT */}

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
                                  {material.unit ||
                                    "-"}
                                </td>

                                {/* PRICE */}

                                <td
                                  className="
                                    whitespace-nowrap
                                    border
                                    border-black
                                    px-4
                                    py-3.5
                                    text-right
                                    font-extrabold
                                    tabular-nums
                                    !text-slate-900
                                  "
                                >
                                  {formatMoney(
                                    material.latestPrice
                                  )}
                                </td>

                                {/* VENDOR */}

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
                </AppTableCard>
              );
            }
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     STAFF / VIEWER
  ======================================================= */

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-5
        sm:space-y-6
      "
    >
      {/* ===============================================
          SEARCH
      =============================================== */}

      {searchBox}

      {/* ===============================================
          CATEGORY CARDS
      =============================================== */}

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
        {categories.map(
          (category) => {
            const categoryMaterials =
              filteredMaterials.filter(
                (material) =>
                  material.category ===
                  category
              );

            const color =
              categoryColor[
                category
              ] ??
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
                  border-slate-200
                  bg-white
                  shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]
                  transition-all
                  duration-300
                  ease-out
                  hover:-translate-y-1
                  hover:border-slate-300
                  hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.4)]
                  active:translate-y-0
                  active:scale-[0.985]
                "
              >
                {/* =========================================
                    ACCENT
                ========================================= */}

                <div
                  className={`
                    h-1.5
                    w-full
                    bg-gradient-to-r
                    ${color}
                  `}
                />

                {/* =========================================
                    AMBIENT
                ========================================= */}

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
                  {/* =======================================
                      ICON
                  ======================================= */}

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
                    {categoryIcon[
                      category
                    ] ?? "📦"}
                  </div>

                  {/* =======================================
                      CONTENT
                  ======================================= */}

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
                      {categoryName[
                        category
                      ] ?? category}
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

                  {/* =======================================
                      FOOTER
                  ======================================= */}

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
                        bg-slate-50
                        px-3
                        py-1.5
                        text-xs
                        font-extrabold
                        !text-slate-600
                      "
                    >
                      {categoryMaterials.length.toLocaleString(
                        "th-TH"
                      )}{" "}
                      รายการ
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
                      <span>
                        เปิด
                      </span>

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
          }
        )}
      </section>
    </div>
  );
}