import Link from "next/link";
import { notFound } from "next/navigation";
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

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

type Category =
  | "OFFICE"
  | "COMPUTER"
  | "ELECTRIC"
  | "HOUSEHOLD"
  | "VEHICLE"
  | "PRINTING";

type PageProps = {
  params: Promise<{
    category: string;
  }>;

  searchParams: Promise<{
    search?: string;
  }>;
};

/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   PAGE
========================================================= */

export default async function MaterialsSummaryCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { category } = await params;
  const { search } = await searchParams;

  const categoryCode = category.toUpperCase();

  if (!categories.includes(categoryCode)) {
    notFound();
  }

  const keyword = search?.trim() ?? "";

  /* =========================================================
     Load Materials
  ========================================================= */

  const materials = await prisma.material.findMany({
    where: {
      category: categoryCode as Category,

      ...(keyword
        ? {
            OR: [
              {
                code: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },

    orderBy: {
      code: "asc",
    },

    include: {
      receiveItems: {
        orderBy: {
          receive: {
            receiveDate: "desc",
          },
        },

        include: {
          receive: {
            include: {
              vendor: true,
            },
          },
        },
      },

      issueItems: true,
    },
  });

  /* =========================================================
     Calculate Stock
  ========================================================= */

  const data = materials.map((material) => {
    const latestReceive =
      material.receiveItems[0];

    const totalReceive =
      material.receiveItems.reduce(
        (sum, item) => sum + item.qty,
        0
      );

    const totalIssue =
      material.issueItems.reduce(
        (sum, item) => sum + item.qty,
        0
      );

    const balance =
      totalReceive - totalIssue;

    return {
      id: material.id,
      category: material.category,
      code: material.code,
      name: material.name,
      balance,
      unit: material.unit,

      latestPrice: latestReceive
        ? Number(latestReceive.unitPrice)
        : null,

      latestVendor:
        latestReceive?.receive.vendor?.name ??
        "-",
    };
  });

  const accentColor =
    categoryColor[categoryCode] ??
    "from-slate-600 to-slate-800";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon={categoryIcon[categoryCode] ?? "📦"}
        title={categoryName[categoryCode]}
        subtitle="รายการพัสดุทั้งหมดในหมวดนี้"
        actions={
          <AppButton
            href="/materials/summary"
            variant="success"
            size="md"
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
          relative
          w-full
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
        {/* Ambient */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-20
            -top-20
            h-44
            w-44
            rounded-full
            bg-blue-400/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            w-full
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
          "
        >
          {/* Search Input */}

          <div className="relative min-w-0 flex-1">
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
              name="search"
              defaultValue={keyword}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
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
                hover:bg-white
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

          {/* Clear */}

          {keyword && (
            <AppButton
              href={`/materials/summary/${categoryCode}`}
              variant="outline"
              size="lg"
              icon={<span>✕</span>}
            >
              ล้าง
            </AppButton>
          )}
        </div>
      </form>

      {/* =====================================================
          Summary Card
      ===================================================== */}

      <section
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
        {/* ===================================================
            Category Header
        =================================================== */}

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
              ${accentColor}
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
                ${accentColor}
                text-2xl
                shadow-[0_12px_24px_-14px_rgba(15,23,42,0.5)]
                ring-1
                ring-white/30
              `}
            >
              {categoryIcon[categoryCode] ??
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
                {categoryName[categoryCode]}
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
                สรุปรายการพัสดุในหมวดนี้
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
            {data.length} รายการ
          </span>
        </div>

        {/* ===================================================
            Table
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
                      text-base
                      font-extrabold
                      !text-white
                      sm:text-lg
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
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
                data.map(
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
                      {/* ลำดับ */}

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

                      {/* รหัส */}

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

                      {/* รายการ */}

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
                        {material.name || "-"}
                      </td>

                      {/* จำนวน */}

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

                      {/* หน่วย */}

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
                        {material.unit || "-"}
                      </td>

                      {/* ราคา */}

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

                      {/* Vendor */}

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
    </AppPage>
  );
}