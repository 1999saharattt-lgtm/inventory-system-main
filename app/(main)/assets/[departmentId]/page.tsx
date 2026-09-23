import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

/* =========================================================
   CATEGORY NAME

   SHELF
   -> รวมแสดงกับ CABINET

   MONITOR
   -> รวมแสดงกับ COMPUTER
========================================================= */

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  TELEPHONE: "เครื่องโทรศัพท์",
  CABINET: "ตู้และชั้นวาง",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

/* =========================================================
   CATEGORY ICON
========================================================= */

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "💺",
  AIR_CONDITIONER: "❄️",
  TELEPHONE: "☎️",
  CABINET: "🗄️",
  COMPUTER: "💻",
  PRINTER: "🖨️",
  OTHER: "📦",
  NO_SYSTEM: "❓",
};

/* =========================================================
   CATEGORY ORDER

   ไม่แสดง SHELF แยก
   ไม่แสดง MONITOR แยก

   SHELF
   -> CABINET

   MONITOR
   -> COMPUTER
========================================================= */

const categoryOrder = [
  "DESK",
  "CHAIR",
  "AIR_CONDITIONER",
  "TELEPHONE",
  "CABINET",
  "COMPUTER",
  "PRINTER",
  "OTHER",
  "NO_SYSTEM",
] as const;

/* =========================================================
   PAGE
========================================================= */

export default async function DepartmentAssetsPage({
  params,
}: Props) {
  /* =======================================================
     AUTH
  ======================================================= */

  await requireLogin();

  /* =======================================================
     PARAMS
  ======================================================= */

  const { departmentId } = await params;

  const id = Number(departmentId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    notFound();
  }

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

  if (!department) {
    notFound();
  }

  /* =======================================================
     ASSETS
  ======================================================= */

  const assets =
    await prisma.asset.findMany({
      where: {
        departmentId: id,
      },

      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        category: true,
      },
    });

  /* =======================================================
     CATEGORY COUNTS

     CABINET
     = CABINET + SHELF

     COMPUTER
     = COMPUTER + MONITOR
  ======================================================= */

  const categoryCounts =
    new Map<string, number>();

  for (const asset of assets) {
    let displayCategory =
      asset.category as string;

    if (
      displayCategory === "SHELF"
    ) {
      displayCategory = "CABINET";
    }

    if (
      displayCategory === "MONITOR"
    ) {
      displayCategory =
        "COMPUTER";
    }

    categoryCounts.set(
      displayCategory,
      (categoryCounts.get(
        displayCategory
      ) ?? 0) + 1
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title={department.name}
        subtitle="เลือกประเภทครุภัณฑ์เพื่อดูทะเบียนคุม"
        actions={
          <AppButton
            href="/assets"
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
          SUMMARY
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
          !p-4

          sm:!p-5
          lg:!p-6
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {/* ===============================================
              TOTAL
          =============================================== */}

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500

                sm:text-base
              "
            >
              ครุภัณฑ์ทั้งหมดของกลุ่มงาน
            </p>

            <div
              className="
                mt-2
                flex
                items-end
                gap-2
              "
            >
              <span
                className="
                  text-3xl
                  font-black
                  leading-none
                  tabular-nums
                  !text-slate-900

                  sm:text-4xl
                "
              >
                {department._count.assets.toLocaleString(
                  "th-TH"
                )}
              </span>

              <span
                className="
                  pb-0.5
                  text-sm
                  font-extrabold
                  !text-slate-500

                  sm:text-base
                "
              >
                รายการ
              </span>
            </div>
          </div>

          {/* ===============================================
              ALL ASSETS
          =============================================== */}

          <AppButton
            href={`/assets/${department.id}/all`}
            variant="primary"
            size="md"
            icon={
              <span aria-hidden="true">
                📋
              </span>
            }
            className="
              w-full
              shrink-0

              sm:w-auto
            "
          >
            รายการครุภัณฑ์หลังการตรวจสอบ
          </AppButton>
        </div>
      </AppCard>

      {/* =====================================================
          CATEGORY CARDS
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4

          sm:grid-cols-2

          xl:grid-cols-3
        "
      >
        {categoryOrder.map(
          (category) => {
            const count =
              categoryCounts.get(
                category
              ) ?? 0;

            return (
              <Link
                key={category}
                href={`/assets/${department.id}/${category.toLowerCase()}`}
                prefetch
                className="
                  group
                  block
                  min-w-0
                "
              >
                <AppCard
                  className="
                    relative
                    h-full
                    min-h-[210px]
                    w-full
                    min-w-0
                    overflow-hidden

                    !p-0

                    transition-all
                    duration-300

                    group-hover:-translate-y-1
                    group-hover:shadow-xl

                    group-active:translate-y-0
                    group-active:scale-[0.985]
                  "
                >
                  {/* =========================================
                      TOP ACCENT
                  ========================================= */}

                  <div
                    aria-hidden="true"
                    className="
                      h-1.5
                      w-full

                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                    "
                  />

                  {/* =========================================
                      CONTENT
                  ========================================= */}

                  <div
                    className="
                      flex
                      min-h-[208px]
                      w-full
                      min-w-0
                      flex-col

                      p-5

                      sm:p-6
                    "
                  >
                    {/* =======================================
                        TOP
                    ======================================= */}

                    <div
                      className="
                        flex
                        min-w-0
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      {/* ICON */}

                      <div
                        className="
                          grid
                          h-14
                          w-14
                          shrink-0
                          place-items-center

                          rounded-[18px]

                          border
                          border-slate-200

                          bg-slate-50

                          text-2xl

                          shadow-sm

                          transition-transform
                          duration-300

                          group-hover:scale-105
                        "
                        aria-hidden="true"
                      >
                        {
                          categoryIcon[
                            category
                          ]
                        }
                      </div>

                      {/* COUNT */}

                      <span
                        className="
                          inline-flex
                          shrink-0
                          items-center
                          justify-center

                          whitespace-nowrap

                          rounded-full

                          border
                          border-slate-200

                          bg-slate-50

                          px-3
                          py-1.5

                          text-xs
                          font-extrabold
                          tabular-nums
                          !text-slate-600

                          sm:text-sm
                        "
                      >
                        {count.toLocaleString(
                          "th-TH"
                        )}{" "}
                        รายการ
                      </span>
                    </div>

                    {/* =======================================
                        CATEGORY NAME
                    ======================================= */}

                    <div
                      className="
                        mt-5
                        min-w-0
                      "
                    >
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
                        {
                          categoryName[
                            category
                          ]
                        }
                      </h2>

                      <p
                        className="
                          mt-2

                          text-sm
                          font-semibold
                          leading-relaxed
                          !text-slate-500
                        "
                      >
                        ดูทะเบียนคุมครุภัณฑ์ในหมวดนี้
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
                        justify-end
                        pt-5
                      "
                    >
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-2

                          text-sm
                          font-extrabold
                          !text-slate-700

                          transition-all
                          duration-300

                          group-hover:!text-slate-950
                        "
                      >
                        <span>
                          เปิด
                        </span>

                        <span
                          aria-hidden="true"
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
                </AppCard>
              </Link>
            );
          }
        )}
      </section>
    </AppPage>
  );
}