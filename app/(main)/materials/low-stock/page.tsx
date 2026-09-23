import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const categoryIcons: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
};

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

/* =========================================================
   TYPES
========================================================= */

type LowStockPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function LowStockPage({
  searchParams,
}: LowStockPageProps) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params = await searchParams;

  const keyword =
    params.q?.trim() ?? "";

  const search =
    keyword.toLowerCase();

  /* =======================================================
     LOAD LOW STOCK MATERIALS

     แสดงพัสดุคงเหลือน้อยกว่า 10
     รวม:
     - หมด = 0 หรือต่ำกว่า
     - ใกล้หมด = 1 - 9
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      where: {
        balance: {
          lt: 10,
        },
      },

      orderBy: [
        {
          category: "asc",
        },
        {
          code: "asc",
        },
      ],

      include: {
        receiveItems: {
          orderBy: [
            {
              receive: {
                receiveDate: "desc",
              },
            },
            {
              id: "desc",
            },
          ],

          include: {
            receive: {
              include: {
                vendor: true,
              },
            },
          },
        },
      },
    });

  /* =======================================================
     PREPARE DATA
  ======================================================= */

  const data = materials
    .map((material) => {
      const latestReceive =
        material.receiveItems[0];

      return {
        id: material.id,

        category:
          material.category,

        code:
          material.code,

        name:
          material.name,

        balance: Number(
          material.balance
        ),

        unit:
          material.unit,

        latestPrice:
          latestReceive
            ? Number(
                latestReceive.unitPrice
              )
            : null,

        latestVendor:
          latestReceive?.receive
            .vendor?.name ?? "-",
      };
    })
    .filter((material) => {
      if (!search) {
        return true;
      }

      return (
        material.code
          .toLowerCase()
          .includes(search) ||
        material.name
          .toLowerCase()
          .includes(search) ||
        material.unit
          .toLowerCase()
          .includes(search) ||
        material.latestVendor
          .toLowerCase()
          .includes(search)
      );
    });

  /* =======================================================
     COUNT
  ======================================================= */

  const totalLowStock =
    data.length;

  const outOfStockCount =
    data.filter(
      (material) =>
        material.balance <= 0
    ).length;

  const lowStockCount =
    data.filter(
      (material) =>
        material.balance > 0 &&
        material.balance < 10
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="⚠️"
        title="รายการพัสดุใกล้หมด"
        subtitle="แสดงรายการพัสดุที่มีจำนวนคงเหลือน้อยกว่า 10"
        actions={
          <AppButton
            href="/"
            variant="back"
            size="md"
            icon={
              <span aria-hidden="true">
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          !p-2.5

          sm:!p-3
        "
      >
        <form
          method="GET"
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-2.5

            sm:flex-row
            sm:items-center
          "
        >
          {/* ===============================================
              SEARCH INPUT
          =============================================== */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <input
              type="text"
              name="q"
              defaultValue={keyword}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / หน่วย / ผู้จำหน่าย"
              autoComplete="off"
              className="
                h-10
                w-full
                min-w-0

                rounded-[12px]

                border
                border-slate-300

                bg-white

                px-3
                py-2

                text-sm
                font-bold
                !text-slate-900

                shadow-sm
                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:!text-slate-400

                hover:border-slate-400

                focus:border-blue-400
                focus:ring-3
                focus:ring-blue-100/80

                sm:h-11
                sm:text-base
              "
            />
          </div>

          {/* ===============================================
              SEARCH BUTTON
          =============================================== */}

          <AppButton
            type="submit"
            variant="primary"
            size="md"
            className="
              w-full
              shrink-0

              sm:w-auto
            "
          >
            ค้นหา
          </AppButton>

          {/* ===============================================
              CLEAR SEARCH
          =============================================== */}

          {keyword && (
            <AppButton
              href="/materials/low-stock"
              variant="outline"
              size="md"
              icon={
                <span aria-hidden="true">
                  ✕
                </span>
              }
              className="
                w-full
                shrink-0

                sm:w-auto
              "
            >
              ล้างการค้นหา
            </AppButton>
          )}

          {/* ===============================================
              RESULT COUNT
          =============================================== */}

          <div
            className="
              flex
              h-10
              w-full
              shrink-0
              items-center
              justify-center

              rounded-[12px]

              border
              border-slate-200

              bg-slate-50

              px-4

              text-sm
              font-extrabold
              !text-slate-700

              sm:h-11
              sm:w-auto
            "
          >
            {totalLowStock.toLocaleString(
              "th-TH"
            )}{" "}
            รายการ
          </div>
        </form>
      </AppCard>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-3

          sm:grid-cols-2
        "
      >
        {/* OUT OF STOCK */}

        <AppCard
          className="
            flex
            min-w-0
            items-center
            justify-between
            gap-4

            !p-4
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              พัสดุหมด
            </p>

            <p
              className="
                mt-1

                text-2xl
                font-black
                tabular-nums
                !text-red-600
              "
            >
              {outOfStockCount.toLocaleString(
                "th-TH"
              )}
            </p>
          </div>

          <div
            className="
              grid
              h-12
              w-12
              shrink-0
              place-items-center

              rounded-[16px]

              bg-red-50

              text-xl
            "
            aria-hidden="true"
          >
            🔴
          </div>
        </AppCard>

        {/* LOW STOCK */}

        <AppCard
          className="
            flex
            min-w-0
            items-center
            justify-between
            gap-4

            !p-4
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
              "
            >
              พัสดุใกล้หมด
            </p>

            <p
              className="
                mt-1

                text-2xl
                font-black
                tabular-nums
                !text-amber-600
              "
            >
              {lowStockCount.toLocaleString(
                "th-TH"
              )}
            </p>
          </div>

          <div
            className="
              grid
              h-12
              w-12
              shrink-0
              place-items-center

              rounded-[16px]

              bg-amber-50

              text-xl
            "
            aria-hidden="true"
          >
            🟠
          </div>
        </AppCard>
      </section>

      {/* =====================================================
          CATEGORY TABLES
      ===================================================== */}

      {categories.map(
        (category) => {
          const categoryMaterials =
            data.filter(
              (material) =>
                material.category ===
                category
            );

          if (
            categoryMaterials.length ===
            0
          ) {
            return null;
          }

          return (
            <AppTableCard
              key={category}
              title={
                categoryName[
                  category
                ] ?? category
              }
              subtitle="รายการพัสดุที่ต้องตรวจสอบ"
              badge={`${categoryMaterials.length.toLocaleString(
                "th-TH"
              )} รายการ`}
              className="
                w-full
                min-w-0
              "
            >
              {/* =============================================
                  TABLE SCROLL
              ============================================= */}

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

                    text-sm
                  "
                >
                  {/* =========================================
                      TABLE HEADER
                  ========================================= */}

                  <thead>
                    <tr>
                      {[
                        "ลำดับ",
                        "รหัสพัสดุ",
                        "รายการพัสดุ",
                        "จำนวน",
                        "หน่วย",
                        "ราคาล่าสุด",
                        "ผู้จำหน่ายล่าสุด",
                      ].map(
                        (
                          tableTitle
                        ) => (
                          <th
                            key={
                              tableTitle
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
                              text-base
                              font-extrabold
                              !text-white

                              sm:text-lg
                            "
                          >
                            {
                              tableTitle
                            }
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  {/* =========================================
                      TABLE BODY
                  ========================================= */}

                  <tbody>
                    {categoryMaterials.map(
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
                              font-extrabold
                              tabular-nums
                              !text-slate-900
                            "
                          >
                            {(
                              index +
                              1
                            ).toLocaleString(
                              "th-TH"
                            )}
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

                          {/* BALANCE */}

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
                                  ? "bg-red-50 !text-red-700"
                                  : "bg-amber-50 !text-amber-700"
                              }
                            `}
                          >
                            {material.balance.toLocaleString(
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
                            {material.latestPrice !==
                            null
                              ? material.latestPrice.toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "-"}
                          </td>

                          {/* VENDOR */}

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
                    )}
                  </tbody>
                </table>
              </div>
            </AppTableCard>
          );
        }
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {data.length === 0 && (
        <AppCard
          className="
            flex
            min-h-[230px]
            w-full
            min-w-0
            flex-col
            items-center
            justify-center
            text-center
          "
        >
          <div
            className="
              grid
              h-16
              w-16
              place-items-center

              text-3xl
            "
            aria-hidden="true"
          >
            {keyword
              ? "🔍"
              : "✅"}
          </div>

          <h2
            className="
              mt-4

              text-xl
              font-extrabold
              !text-slate-900
            "
          >
            {keyword
              ? "ไม่พบพัสดุที่ค้นหา"
              : "ไม่มีพัสดุใกล้หมด"}
          </h2>

          <p
            className="
              mt-2

              max-w-lg

              text-sm
              font-semibold
              leading-relaxed
              !text-slate-500
            "
          >
            {keyword
              ? "ลองค้นหาด้วยรหัสพัสดุ ชื่อพัสดุ หน่วย หรือผู้จำหน่ายอื่น"
              : "ขณะนี้พัสดุทุกรายการมีจำนวนคงเหลือตั้งแต่ 10 รายการขึ้นไป"}
          </p>

          {keyword && (
            <div className="mt-5">
              <AppButton
                href="/materials/low-stock"
                variant="primary"
                size="md"
              >
                แสดงรายการทั้งหมด
              </AppButton>
            </div>
          )}
        </AppCard>
      )}
    </AppPage>
  );
}