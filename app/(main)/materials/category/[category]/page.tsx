import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";

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

const categoryIcon: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
};

/* =========================================================
   TYPES
========================================================= */

type Category =
  | "OFFICE"
  | "COMPUTER"
  | "ELECTRIC"
  | "HOUSEHOLD"
  | "VEHICLE"
  | "PRINTING";

type Material = {
  id: number;
  code: string;
  name: string;
  balance: number;
  unit: string;

  latestPrice: {
    toLocaleString(
      locale?: string,
      options?: Intl.NumberFormatOptions
    ): string;
  };

  receiveItems: {
    manufacture: Date | null;
    expiry: Date | null;
  }[];
};

type Props = {
  params: Promise<{
    category: string;
  }>;

  searchParams: Promise<{
    search?: string;
  }>;
};

/* =========================================================
   THAI SHORT DATE
   ตัวอย่าง 01 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month =
    thaiShortMonths[
      date.getMonth()
    ];

  const buddhistYear = String(
    date.getFullYear() + 543
  ).slice(-2);

  return `${day} ${month} ${buddhistYear}`;
}

/* =========================================================
   PAGE
========================================================= */

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { category } =
    await params;

  const { search } =
    await searchParams;

  const keyword =
    search?.trim() ?? "";

  /* =======================================================
     DATA
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      where: {
        category:
          category as Category,

        ...(keyword
          ? {
              OR: [
                {
                  code: {
                    contains:
                      keyword,
                  },
                },
                {
                  name: {
                    contains:
                      keyword,
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        receiveItems: {
          orderBy: {
            id: "desc",
          },

          take: 1,
        },
      },

      orderBy: {
        code: "asc",
      },
    });

  /* =======================================================
     DISPLAY
  ======================================================= */

  const title =
    categoryName[category] ??
    "รายการพัสดุ";

  const icon =
    categoryIcon[category] ??
    "📦";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon={icon}
        title={title}
        subtitle={`รายการพัสดุในหมวดนี้ทั้งหมด ${materials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        actions={
          <>
            <AppButton
              href={`/materials/new?category=${category}`}
              variant="primary"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ＋
                </span>
              }
            >
              เพิ่มรายการ
            </AppButton>

            <AppButton
              href="/materials"
              variant="back"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ←
                </span>
              }
            >
              กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          SEARCH
          ใช้ AppCard กลาง
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          p-4

          sm:p-5
        "
      >
        <form
          method="GET"
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3

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
              name="search"
              defaultValue={
                keyword
              }
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              autoComplete="off"
              className="
                h-[52px]
                w-full
                min-w-0

                rounded-[16px]

                border
                border-slate-200

                bg-white

                px-4

                text-base
                font-bold
                !text-slate-900

                shadow-sm
                outline-none

                transition-all
                duration-200

                placeholder:!text-slate-400

                hover:border-slate-300
                hover:bg-slate-50

                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-100/70
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
            icon={
              <span
                aria-hidden="true"
              >
                🔎
              </span>
            }
          >
            ค้นหา
          </AppButton>

          {/* ===============================================
              CLEAR SEARCH
          =============================================== */}

          {keyword && (
            <AppButton
              href={`/materials/category/${category}`}
              variant="outline"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ✕
                </span>
              }
            >
              ล้างการค้นหา
            </AppButton>
          )}
        </form>
      </AppCard>

      {/* =====================================================
          TABLE
          ใช้ AppTableCard กลาง
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุ"
        subtitle={
          keyword
            ? `ผลการค้นหา “${keyword}”`
            : "ข้อมูลพัสดุทั้งหมดในหมวดนี้"
        }
        badge={`${materials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
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
              min-w-[1100px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =============================================
                TABLE HEADER
            ============================================= */}

            <thead>
              <tr>
                {[
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "จำนวน",
                  "หน่วย",
                  "ราคาล่าสุด",
                  "วันผลิต",
                  "วันหมดอายุ",
                  "จัดการ",
                ].map(
                  (tableTitle) => (
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
                      {tableTitle}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =============================================
                TABLE BODY
            ============================================= */}

            <tbody>
              {materials.length >
              0 ? (
                materials.map(
                  (
                    material: Material,
                    index
                  ) => {
                    const latestReceive =
                      material
                        .receiveItems[0];

                    return (
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
                        {/* ===================================
                            MATERIAL CODE
                        =================================== */}

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

                        {/* ===================================
                            MATERIAL NAME
                        =================================== */}

                        <td
                          className="
                            min-w-[240px]

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

                        {/* ===================================
                            BALANCE
                        =================================== */}

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
                          {Number(
                            material.balance
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        {/* ===================================
                            UNIT
                        =================================== */}

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

                        {/* ===================================
                            LATEST PRICE
                        =================================== */}

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
                          {material.latestPrice.toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        {/* ===================================
                            MANUFACTURE
                        =================================== */}

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
                          {formatThaiShortDate(
                            latestReceive?.manufacture
                          )}
                        </td>

                        {/* ===================================
                            EXPIRY
                        =================================== */}

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
                          {formatThaiShortDate(
                            latestReceive?.expiry
                          )}
                        </td>

                        {/* ===================================
                            ACTIONS
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >
                            <AppButton
                              href={`/materials/${material.id}/edit`}
                              variant="primary"
                              size="sm"
                              icon={
                                <span
                                  aria-hidden="true"
                                >
                                  ✏️
                                </span>
                              }
                            >
                              แก้ไข
                            </AppButton>

                            <DeleteButton
                              id={
                                material.id
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* ===========================================
                   EMPTY STATE
                =========================================== */

                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto

                        flex
                        max-w-md
                        flex-col
                        items-center
                      "
                    >
                      <div
                        className="
                          text-4xl
                        "
                      >
                        📦
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {keyword
                          ? "ไม่พบพัสดุที่ค้นหา"
                          : "ยังไม่มีพัสดุในหมวดนี้"}
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        {keyword
                          ? "ลองค้นหาด้วยรหัสหรือชื่อพัสดุอื่น"
                          : "เมื่อเพิ่มพัสดุ รายการจะแสดงในส่วนนี้"}
                      </p>

                      {keyword && (
                        <div className="mt-5">
                          <AppButton
                            href={`/materials/category/${category}`}
                            variant="primary"
                            size="md"
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}