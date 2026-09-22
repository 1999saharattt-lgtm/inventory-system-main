import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const categoryIcons: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
};

type LowStockPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function LowStockPage({
  searchParams,
}: LowStockPageProps) {
  const params = await searchParams;

  const search = (
    params.q ?? ""
  )
    .trim()
    .toLowerCase();

  /* =========================================================
     Load Low Stock Materials
     แสดงเฉพาะจำนวนคงเหลือน้อยกว่า 10
     ตั้งแต่ 0 - 9
  ========================================================= */

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

  /* =========================================================
     Prepare Data
  ========================================================= */

  const data = materials
    .map((material) => {
      const latestReceive =
        material.receiveItems[0];

      return {
        id: material.id,
        category: material.category,
        code: material.code,
        name: material.name,
        balance: Number(
          material.balance
        ),
        unit: material.unit,

        latestPrice: latestReceive
          ? Number(
              latestReceive.unitPrice
            )
          : null,

        latestVendor:
          latestReceive?.receive.vendor
            ?.name ?? "-",
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

  const totalLowStock = data.length;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="⚠️"
        title="รายการพัสดุใกล้หมด"
        subtitle="แสดงรายการพัสดุที่มีจำนวนคงเหลือน้อยกว่า 10"
        actions={
          <AppButton
            href="/"
            variant="secondary"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          Search
      ===================================================== */}

      <form
        method="GET"
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            relative
            overflow-hidden
            rounded-[24px]
            border
            border-slate-300
            bg-white/90
            p-4
            shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
            backdrop-blur-2xl
            sm:p-5
          "
        >
          {/* Ambient Background */}

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

            <div
              className="
                relative
                min-w-0
                flex-1
              "
            >
              <span
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
              </span>

              <input
                type="text"
                name="q"
                defaultValue={
                  params.q ?? ""
                }
                placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / หน่วย / ผู้จำหน่าย"
                className="
                  h-12
                  w-full
                  rounded-[16px]
                  border
                  border-black
                  bg-white
                  py-3
                  pl-12
                  pr-4
                  text-base
                  font-bold
                  !text-slate-900
                  shadow-sm
                  outline-none
                  transition-all
                  duration-200
                  placeholder:!text-slate-400
                  hover:bg-slate-50
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
              variant="primary"
              icon={<span>🔎</span>}
            >
              ค้นหา
            </AppButton>

            {/* Clear Search */}

            {search && (
              <AppButton
                href="/materials/low-stock"
                variant="secondary"
                icon={<span>✕</span>}
              >
                ล้างค้นหา
              </AppButton>
            )}

            {/* Result Count */}

            <div
              className="
                inline-flex
                h-11
                min-w-[124px]
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-[14px]
                border
                border-slate-300
                bg-slate-100
                px-5
                text-sm
                font-extrabold
                !text-slate-700
                shadow-sm
                sm:text-base
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
                  bg-white
                  px-2
                  text-xs
                  font-black
                  !text-slate-900
                  shadow-sm
                "
              >
                {totalLowStock}
              </span>

              <span>รายการ</span>
            </div>
          </div>
        </div>
      </form>

      {/* =====================================================
          Category Sections
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          space-y-6
        "
      >
        {categories.map((category) => {
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
            <section
              key={category}
              className="
                w-full
                min-w-0
                overflow-hidden
                rounded-[26px]
                border
                border-black
                bg-white
                shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
              "
            >
              {/* =============================================
                  Category Header
              ============================================= */}

              <div
                className="
                  flex
                  min-h-[76px]
                  items-center
                  justify-between
                  gap-3
                  bg-gradient-to-r
                  from-slate-950
                  via-slate-800
                  to-slate-700
                  px-4
                  py-4
                  sm:px-6
                "
              >
                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                  "
                >
                  <span
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-[16px]
                      bg-white/10
                      text-2xl
                      ring-1
                      ring-white/15
                    "
                  >
                    {
                      categoryIcons[
                        category
                      ]
                    }
                  </span>

                  <div className="min-w-0">
                    <h2
                      className="
                        break-words
                        text-xl
                        font-black
                        leading-tight
                        tracking-tight
                        !text-white
                        sm:text-2xl
                      "
                    >
                      {categoryName[
                        category
                      ] ?? category}
                    </h2>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-bold
                        !text-slate-300
                        sm:text-sm
                      "
                    >
                      รายการที่มีจำนวนคงเหลือน้อยกว่า
                      10
                    </p>
                  </div>
                </div>

                <span
                  className="
                    inline-flex
                    h-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/20
                    bg-white/10
                    px-4
                    text-sm
                    font-extrabold
                    !text-white
                  "
                >
                  {
                    categoryMaterials.length
                  }{" "}
                  รายการ
                </span>
              </div>

              {/* =============================================
                  Table
              ============================================= */}

              <div
                className="
                  w-full
                  min-w-0
                  max-w-full
                  overflow-x-auto
                  overscroll-x-contain
                "
              >
                <table
                  className="
                    w-full
                    min-w-[900px]
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
                    {categoryMaterials.map(
                      (
                        material,
                        index
                      ) => (
                        <tr
                          key={
                            material.id
                          }
                          className="
                            bg-white
                            !text-slate-900
                            transition-colors
                            duration-200
                            hover:bg-blue-50
                          "
                        >
                          {/* ลำดับ */}

                          <td
                            className="
                              whitespace-nowrap
                              border
                              border-black
                              px-4
                              py-3
                              text-center
                              font-bold
                              !text-slate-900
                            "
                          >
                            {index + 1}
                          </td>

                          {/* รหัสพัสดุ */}

                          <td
                            className="
                              whitespace-nowrap
                              border
                              border-black
                              px-4
                              py-3
                              text-center
                              font-bold
                              !text-slate-900
                            "
                          >
                            {material.code ||
                              "-"}
                          </td>

                          {/* รายการพัสดุ */}

                          <td
                            className="
                              border
                              border-black
                              px-4
                              py-3
                              font-bold
                              !text-slate-900
                            "
                          >
                            {material.name ||
                              "-"}
                          </td>

                          {/* จำนวน */}

                          <td
                            className="
                              whitespace-nowrap
                              border
                              border-black
                              bg-red-50
                              px-4
                              py-3
                              text-center
                              text-lg
                              font-extrabold
                              !text-red-700
                            "
                          >
                            {material.balance ??
                              0}
                          </td>

                          {/* หน่วย */}

                          <td
                            className="
                              whitespace-nowrap
                              border
                              border-black
                              px-4
                              py-3
                              text-center
                              font-semibold
                              !text-slate-900
                            "
                          >
                            {material.unit ||
                              "-"}
                          </td>

                          {/* ราคา */}

                          <td
                            className="
                              whitespace-nowrap
                              border
                              border-black
                              px-4
                              py-3
                              text-right
                              font-semibold
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

                          {/* ผู้จำหน่ายล่าสุด */}

                          <td
                            className="
                              border
                              border-black
                              px-4
                              py-3
                              font-semibold
                              !text-slate-900
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
            </section>
          );
        })}

        {/* ===================================================
            Empty State
        =================================================== */}

        {data.length === 0 && (
          <div
            className="
              rounded-[26px]
              border
              border-emerald-300
              bg-emerald-50
              p-8
              text-center
              shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
            "
          >
            <div className="text-5xl">
              ✅
            </div>

            <h2
              className="
                mt-4
                text-2xl
                font-extrabold
                !text-emerald-800
              "
            >
              {search
                ? "ไม่พบพัสดุที่ค้นหา"
                : "ไม่มีพัสดุใกล้หมด"}
            </h2>

            <p
              className="
                mt-2
                font-semibold
                !text-emerald-700
              "
            >
              {search
                ? "ลองค้นหาด้วยรหัสพัสดุ ชื่อพัสดุ หน่วย หรือผู้จำหน่ายอื่น"
                : "ขณะนี้พัสดุทุกรายการมีจำนวนคงเหลือตั้งแต่ 10 รายการขึ้นไป"}
            </p>
          </div>
        )}
      </div>
    </AppPage>
  );
}