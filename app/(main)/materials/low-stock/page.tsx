import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  OFFICE:
    "วัสดุสำนักงาน",

  COMPUTER:
    "วัสดุคอมพิวเตอร์",

  ELECTRIC:
    "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",

  VEHICLE:
    "วัสดุยานพาหนะ",

  PRINTING:
    "วัสดุสื่อสิ่งพิมพ์",
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
   PAGE
========================================================= */

export default async function LowStockPage({
  searchParams,
}: LowStockPageProps) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params =
    await searchParams;

  const keyword =
    params.q?.trim() ?? "";

  const search =
    keyword.toLowerCase();

  /* =======================================================
     LOAD LOW STOCK MATERIALS

     แสดงพัสดุคงเหลือน้อยกว่า 10

     - พัสดุหมด = 0 หรือต่ำกว่า
     - พัสดุใกล้หมด = 1 - 9
  ======================================================= */

  const materials =
    await prisma.material.findMany(
      {
        where: {
          balance: {
            lt: 10,
          },
        },

        orderBy: [
          {
            category:
              "asc",
          },
          {
            code:
              "asc",
          },
        ],

        include: {
          receiveItems: {
            orderBy: [
              {
                receive: {
                  receiveDate:
                    "desc",
                },
              },
              {
                id:
                  "desc",
              },
            ],

            include: {
              receive: {
                include: {
                  vendor:
                    true,
                },
              },
            },
          },
        },
      }
    );

  /* =======================================================
     PREPARE DATA
  ======================================================= */

  const data =
    materials
      .map(
        (material) => {
          const latestReceive =
            material.receiveItems[0];

          return {
            id:
              material.id,

            category:
              material.category,

            code:
              material.code,

            name:
              material.name,

            balance:
              Number(
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
              latestReceive
                ?.receive
                .vendor
                ?.name ??
              "-",
          };
        }
      )
      .filter(
        (material) => {
          if (!search) {
            return true;
          }

          return (
            material.code
              .toLowerCase()
              .includes(
                search
              ) ||
            material.name
              .toLowerCase()
              .includes(
                search
              ) ||
            material.unit
              .toLowerCase()
              .includes(
                search
              ) ||
            material.latestVendor
              .toLowerCase()
              .includes(
                search
              )
          );
        }
      );

  /* =======================================================
     COUNT
  ======================================================= */

  const totalLowStock =
    data.length;

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
        subtitle={`แสดงรายการพัสดุที่มีจำนวนคงเหลือน้อยกว่า 10 • ${totalLowStock.toLocaleString(
          "th-TH"
        )} รายการ`}
        actions={
          <AppButton
            href="/"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          SEARCH

          ใช้รูปแบบเดียวกับหน้ารายการพัสดุ
          และใช้ AppButton กลาง

          Search = Primary = เขียวกรมอนามัย
          Clear  = Primary = เขียวกรมอนามัย
      ===================================================== */}

      <AppCard
        className="
          relative
          w-full
          min-w-0
          overflow-hidden

          !rounded-[22px]
          !p-3

          sm:!p-4
        "
      >
        {/* =================================================
            TOP HIGHLIGHT
        ================================================= */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-6
            top-0

            h-px

            bg-gradient-to-r
            from-transparent
            via-white
            to-transparent
          "
        />

        {/* =================================================
            GREEN AMBIENT
        ================================================= */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-16
            -top-20

            h-40
            w-40

            rounded-full

            bg-emerald-400/[0.06]

            blur-[60px]
          "
        />

        <form
          action="/materials/low-stock"
          method="GET"
          className="
            relative
            z-10

            flex
            w-full
            min-w-0
            flex-col

            gap-3

            lg:flex-row
            lg:items-center
          "
        >
          {/* ===============================================
              SEARCH INPUT
          =============================================== */}

          <div
            className="
              group
              relative
              min-w-0
              flex-1
            "
          >
            {/* =============================================
                SEARCH ICON
            ============================================= */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                z-10

                flex
                -translate-y-1/2
                items-center
                justify-center

                text-lg
              "
            >
              🔎
            </div>

            {/* =============================================
                INPUT
            ============================================= */}

            <input
              type="search"
              name="q"
              defaultValue={
                keyword
              }
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ / หน่วย / ผู้จำหน่าย"
              autoComplete="off"
              className="
                min-h-[50px]
                w-full
                min-w-0

                rounded-[15px]

                border
                border-slate-300

                bg-slate-50/80

                py-3
                pl-12
                pr-4

                text-base
                font-bold

                !text-slate-900

                outline-none

                shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_1px_2px_rgba(255,255,255,0.8)]

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:!text-slate-400

                hover:border-slate-400
                hover:bg-white

                focus:border-emerald-500
                focus:bg-white

                focus:ring-4
                focus:ring-emerald-500/10
              "
            />
          </div>

          {/* ===============================================
              ACTIONS
          =============================================== */}

          <div
            className="
              flex
              w-full
              min-w-0
              flex-wrap
              items-center

              gap-2

              lg:w-auto
              lg:flex-nowrap
            "
          >
            {/* =============================================
                SEARCH BUTTON
            ============================================= */}

            <AppButton
              type="submit"
              variant="primary"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  🔎
                </span>
              }
              className="
                flex-1

                sm:flex-none
              "
            >
              ค้นหา
            </AppButton>

            {/* =============================================
                CLEAR SEARCH
            ============================================= */}

            {keyword && (
              <AppButton
                href="/materials/low-stock"
                variant="primary"
                size="md"
                icon={
                  <span
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                }
                className="
                  flex-1

                  sm:flex-none
                "
              >
                ล้าง
              </AppButton>
            )}

            {/* =============================================
                RESULT COUNT
            ============================================= */}

            <div
              className="
                flex
                min-h-[44px]
                flex-1
                items-center
                justify-center

                whitespace-nowrap

                rounded-[14px]

                border
                border-slate-200/80

                bg-slate-50/80

                px-4

                text-sm
                font-extrabold

                !text-slate-600

                shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]

                sm:flex-none
              "
            >
              {totalLowStock.toLocaleString(
                "th-TH"
              )}{" "}
              รายการ
            </div>
          </div>
        </form>
      </AppCard>

      {/* =====================================================
          CATEGORY TABLES

          ลบการ์ด
          - พัสดุหมด
          - พัสดุใกล้หมด

          ออกทั้งหมด

          ตารางเริ่มต่อจาก Search ทันที
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
              data.filter(
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
                        TABLE HEADER
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
                                text-lg
                                font-extrabold

                                !text-white
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

                    {/* =======================================
                        TABLE BODY
                    ======================================= */}

                    <tbody>
                      {categoryMaterials.length ===
                      0 ? (
                        /* ===================================
                            EMPTY CATEGORY
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
                                  flex
                                  h-12
                                  w-12

                                  items-center
                                  justify-center

                                  rounded-full

                                  bg-emerald-50

                                  text-xl
                                "
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
                                  ? "ไม่พบข้อมูลที่ค้นหาในหมวดนี้"
                                  : "ไม่มีพัสดุใกล้หมดในหมวดนี้"}
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

                                  0 หรือต่ำกว่า = แดง
                                  1 - 9 = ส้ม
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
                      )}
                    </tbody>
                  </table>
                </div>
              </AppTableCard>
            );
          }
        )}
      </div>

      {/* =====================================================
          GLOBAL EMPTY STATE

          กรณีค้นหาแล้วไม่พบสักรายการ
      ===================================================== */}

      {data.length ===
        0 &&
        keyword && (
          <AppCard
            className="
              flex
              min-h-[180px]
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
                flex
                h-14
                w-14

                items-center
                justify-center

                rounded-[18px]

                bg-emerald-50

                text-2xl
              "
              aria-hidden="true"
            >
              🔎
            </div>

            <h2
              className="
                mt-4

                text-xl
                font-black

                !text-slate-900
              "
            >
              ไม่พบพัสดุที่ค้นหา
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
              ลองค้นหาด้วยรหัสพัสดุ
              ชื่อพัสดุ หน่วย
              หรือผู้จำหน่ายอื่น
            </p>

            <div className="mt-5">
              <AppButton
                href="/materials/low-stock"
                variant="primary"
                size="md"
              >
                แสดงรายการทั้งหมด
              </AppButton>
            </div>
          </AppCard>
        )}
    </AppPage>
  );
}