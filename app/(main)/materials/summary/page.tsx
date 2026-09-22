import { prisma } from "@/lib/prisma";
import MaterialsSummaryClient from "./MaterialsSummaryClient";
import { getCurrentUser } from "@/lib/auth";
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

const categoryColors: Record<string, string> = {
  OFFICE: "from-blue-500 to-blue-700",
  COMPUTER: "from-violet-500 to-violet-700",
  ELECTRIC: "from-amber-400 to-amber-600",
  HOUSEHOLD: "from-emerald-500 to-emerald-700",
  VEHICLE: "from-red-500 to-red-700",
  PRINTING: "from-cyan-500 to-cyan-700",
};

export default async function MaterialsSummaryPage() {
  /* =========================================================
     Session
  ========================================================= */

  const user = await getCurrentUser();
  const role = user?.role ?? "VIEWER";

  /* =========================================================
     ADMIN
     แสดงข้อมูลพัสดุทั้งหมด
  ========================================================= */

  if (role === "ADMIN") {
    const materials = await prisma.material.findMany({
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

    /* =======================================================
       Prepare Stock Card Data
    ======================================================= */

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

    return (
      <AppPage>
        {/* ===================================================
            Header
        =================================================== */}

        <AppPageHeader
          icon="📦"
          title="รายการพัสดุทั้งหมด"
          subtitle="แสดงข้อมูลล่าสุดจากบัญชี Stock Card"
          actions={
            <AppButton
              href="/"
              variant="back"
              size="md"
              icon={<span>←</span>}
            >
              กลับ
            </AppButton>
          }
        />

        {/* ===================================================
            Materials Summary
        =================================================== */}

        <MaterialsSummaryClient
          materials={data}
          categories={categories}
          categoryName={categoryName}
          role={role}
        />
      </AppPage>
    );
  }

  /* =========================================================
     STAFF / VIEWER
     แสดงหน้าเลือกหมวด
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle="เลือกหมวดหมู่เพื่อดูรายการพัสดุ"
        actions={
          <AppButton
            href="/"
            variant="back"
            size="md"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

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
          const color =
            categoryColors[category];

          return (
            <AppButton
              key={category}
              href={`/materials/summary/${category}`}
              variant="white"
              size="md"
              className="
                !h-auto
                !min-w-0
                !w-full
                !items-stretch
                !justify-start
                !overflow-hidden
                !whitespace-normal
                !rounded-[28px]
                !border-white/80
                !bg-white/80
                !p-0
                !text-left
                shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
                backdrop-blur-2xl
                transition-all
                duration-300
                ease-out
                hover:-translate-y-1
                hover:!border-slate-200
                hover:!bg-white/95
                hover:shadow-[0_26px_64px_-28px_rgba(15,23,42,0.45)]
                active:translate-y-0
                active:scale-[0.985]
              "
            >
              <div
                className="
                  group
                  relative
                  w-full
                  min-w-0
                  overflow-hidden
                "
              >
                {/* =============================================
                    Accent
                ============================================= */}

                <div
                  className={`
                    h-1.5
                    w-full
                    bg-gradient-to-r
                    ${color}
                  `}
                />

                {/* =============================================
                    Ambient Glow
                ============================================= */}

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
                    min-h-[205px]
                    min-w-0
                    flex-col
                    p-5
                    sm:min-h-[225px]
                    sm:p-6
                  "
                >
                  {/* ===========================================
                      Icon
                  =========================================== */}

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
                    {categoryIcons[category]}
                  </div>

                  {/* ===========================================
                      Content
                  =========================================== */}

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
                      {categoryName[category]}
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

                  {/* ===========================================
                      Footer
                  =========================================== */}

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
                        rounded-full
                        border
                        border-slate-200
                        bg-white/80
                        px-3
                        py-1.5
                        text-xs
                        font-extrabold
                        !text-slate-500
                        shadow-sm
                      "
                    >
                      หมวด {category}
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
              </div>
            </AppButton>
          );
        })}
      </section>
    </AppPage>
  );
}