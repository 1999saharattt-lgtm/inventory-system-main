"use client";

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
  categoryName: Record<
    string,
    string
  >;
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

export default function LowStockClient({
  materials,
  categories,
  categoryName,
}: Props) {
  /* =======================================================
     SEARCH
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const keyword =
    search
      .trim()
      .toLowerCase();

  /* =======================================================
     FILTER
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
              .includes(
                keyword
              ) ||
            material.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            material.unit
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            material.latestVendor
              ?.toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [
      materials,
      keyword,
    ]);

  /* =======================================================
     UI
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
      {/* =====================================================
          SEARCH
          ใช้ AppSearchInput ตัวกลาง
      ===================================================== */}

      <AppSearchInput
        value={search}
        onChange={(
          event
        ) =>
          setSearch(
            event.target.value
          )
        }
        onSubmit={() => {
          /*
           * ค้นหาแบบ realtime
           */
        }}
        onClear={() =>
          setSearch("")
        }
        placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / หน่วย / ผู้จำหน่าย"
        resultCount={
          filteredMaterials.length
        }
        resultLabel="รายการ"
        showSearchButton
        showClearButton
        searchButtonText="ค้นหา"
        clearButtonText="ล้าง"
      />

      {/* =====================================================
          TABLES
      ===================================================== */}

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
                (
                  material
                ) =>
                  material.category ===
                  category
              );

            return (
              <AppTableCard
                key={
                  category
                }
                title={
                  categoryName[
                    category
                  ] ??
                  category
                }
                subtitle={`รายการพัสดุที่ต้องตรวจสอบ • ${categoryMaterials.length.toLocaleString(
                  "th-TH"
                )} รายการ`}
                className="
                  w-full
                  min-w-0
                "
              >
                {/* ===========================================
                    TABLE SCROLL
                =========================================== */}

                <div
                  className="
                    w-full
                    min-w-0

                    overflow-x-auto
                    overscroll-x-contain

                    [-webkit-overflow-scrolling:touch]
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
                    {/* =======================================
                        HEADER
                    ======================================= */}

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

                    {/* =======================================
                        BODY
                    ======================================= */}

                    <tbody>
                      {categoryMaterials.length >
                      0 ? (
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
                                ${
                                  index %
                                    2 ===
                                  0
                                    ? "bg-white"
                                    : "bg-slate-50/60"
                                }

                                transition-colors
                                duration-200

                                hover:bg-emerald-50/60
                              `}
                            >
                              {/* =============================
                                  ORDER
                              ============================= */}

                              <td
                                className="
                                  whitespace-nowrap

                                  border
                                  border-black

                                  px-4
                                  py-3.5

                                  text-center
                                  font-bold

                                  tabular-nums

                                  !text-slate-700
                                "
                              >
                                {(
                                  index +
                                  1
                                ).toLocaleString(
                                  "th-TH"
                                )}
                              </td>

                              {/* =============================
                                  CODE
                              ============================= */}

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

                              {/* =============================
                                  NAME
                              ============================= */}

                              <td
                                className="
                                  min-w-[260px]

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

                              {/* =============================
                                  BALANCE
                              ============================= */}

                              <td
                                className={`
                                  whitespace-nowrap

                                  border
                                  border-black

                                  px-4
                                  py-3.5

                                  text-center
                                  text-base
                                  font-black

                                  tabular-nums

                                  ${
                                    material.balance <=
                                    0
                                      ? `
                                        bg-red-50
                                        !text-red-700
                                      `
                                      : `
                                        bg-amber-50
                                        !text-amber-700
                                      `
                                  }
                                `}
                              >
                                {material.balance.toLocaleString(
                                  "th-TH"
                                )}
                              </td>

                              {/* =============================
                                  UNIT
                              ============================= */}

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

                              {/* =============================
                                  PRICE
                              ============================= */}

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

                              {/* =============================
                                  VENDOR
                              ============================= */}

                              <td
                                className="
                                  min-w-[220px]

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
                      ) : (
                        /* ===================================
                            EMPTY
                        =================================== */

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
                                  grid
                                  h-12
                                  w-12

                                  place-items-center

                                  rounded-full

                                  bg-slate-100

                                  text-xl
                                "
                                aria-hidden="true"
                              >
                                {keyword
                                  ? "🔎"
                                  : "✅"}
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
                                  : "ไม่มีพัสดุใกล้หมดในหมวดนี้"}
                              </span>
                            </div>
                          </td>
                        </tr>
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