import { prisma } from "@/lib/prisma";
import SearchStockCard from "./SearchStockCard";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    category: string;
  }>;

  searchParams: Promise<{
    search?: string;
  }>;
};

type Category =
  | "OFFICE"
  | "COMPUTER"
  | "ELECTRIC"
  | "HOUSEHOLD"
  | "VEHICLE"
  | "PRINTING";

/* =========================================================
   CATEGORY
========================================================= */

const categoryNames: Record<string, string> = {
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

  const { category } = await params;

  const { search } = await searchParams;

  const keyword = search?.trim() ?? "";

  /* =======================================================
     DATA
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      where: {
        category: category as Category,

        ...(keyword
          ? {
              OR: [
                {
                  code: {
                    contains: keyword,
                  },
                },
                {
                  name: {
                    contains: keyword,
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        receiveItems: {
          orderBy: {
            receive: {
              receiveDate: "desc",
            },
          },

          take: 1,

          include: {
            receive: {
              include: {
                vendor: true,
              },
            },
          },
        },
      },

      orderBy: {
        code: "asc",
      },
    });

  /* =======================================================
     CATEGORY INFORMATION
  ======================================================= */

  const title =
    categoryNames[category] ??
    "รายการบัญชีพัสดุ";

  const icon =
    categoryIcons[category] ??
    "📚";

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
        subtitle={`รายการบัญชีพัสดุ จำนวน ${materials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        actions={
          <AppButton
            href="/stock-card"
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

      <SearchStockCard
        category={category}
        defaultSearch={keyword}
        resultCount={materials.length}
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการบัญชีพัสดุ"
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
        {/* ===================================================
            TABLE SCROLL
        =================================================== */}

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
              min-w-[1000px]
              border-collapse
              bg-white
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "หน่วย",
                  "ผู้จำหน่ายล่าสุด",
                  "บัญชีพัสดุ",
                ].map(
                  (tableTitle) => (
                    <th
                      key={tableTitle}
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

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {materials.length > 0 ? (
                materials.map(
                  (
                    material,
                    index
                  ) => {
                    const latestReceive =
                      material
                        .receiveItems[0];

                    const latestVendor =
                      latestReceive
                        ?.receive
                        .vendor
                        ?.name ?? "-";

                    return (
                      <tr
                        key={
                          material.id
                        }
                        className={`
                          transition-colors
                          duration-200

                          ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* =====================================
                            ORDER
                        ===================================== */}

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
                          {index + 1}
                        </td>

                        {/* =====================================
                            CODE
                        ===================================== */}

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

                        {/* =====================================
                            NAME
                        ===================================== */}

                        <td
                          className="
                            min-w-[280px]

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

                        {/* =====================================
                            UNIT
                        ===================================== */}

                        <td
                          className="
                            min-w-[120px]
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

                        {/* =====================================
                            LATEST VENDOR
                        ===================================== */}

                        <td
                          className="
                            min-w-[240px]

                            border
                            border-black

                            px-4
                            py-3.5

                            font-bold
                            !text-slate-700
                          "
                        >
                          {latestVendor}
                        </td>

                        {/* =====================================
                            ACTION
                        ===================================== */}

                        <td
                          className="
                            min-w-[140px]
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-3

                            text-center
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <AppButton
                              href={`/stock-card/material/${material.id}`}
                              variant="primary"
                              size="sm"
                            >
                              เปิด
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* =============================================
                    EMPTY STATE
                ============================================= */

                <tr>
                  <td
                    colSpan={6}
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
                          flex
                          h-16
                          w-16

                          items-center
                          justify-center

                          rounded-[20px]

                          bg-slate-100

                          text-3xl

                          shadow-inner
                        "
                        aria-hidden="true"
                      >
                        📚
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
                          : "ยังไม่มีข้อมูลบัญชีพัสดุ"}
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
                          : "เมื่อมีรายการพัสดุ ข้อมูลจะแสดงในส่วนนี้"}
                      </p>

                      {keyword && (
                        <div className="mt-5">
                          <AppButton
                            href={`/stock-card/${category}`}
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