import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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

const categoryName: Record<
  string,
  string
> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER:
    "เครื่องปรับอากาศ",
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

const categoryIcon: Record<
  string,
  string
> = {
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

  const { departmentId } =
    await params;

  const id = Number(
    departmentId
  );

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
      displayCategory ===
      "SHELF"
    ) {
      displayCategory =
        "CABINET";
    }

    if (
      displayCategory ===
      "MONITOR"
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
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title={department.name}
        subtitle="เลือกประเภทครุภัณฑ์เพื่อดูทะเบียนคุม"
        actions={
          <>
            {/* ===============================================
                ALL ASSETS AFTER INSPECTION
            =============================================== */}

            <AppButton
              href={`/assets/${department.id}/all`}
              variant="primary"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  📋
                </span>
              }
            >
              รายการครุภัณฑ์หลังการตรวจสอบ
            </AppButton>

            {/* ===============================================
                BACK
            =============================================== */}

            <AppButton
              href="/assets"
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
          CATEGORY GRID

          รูปแบบเดียวกับหน้า /assets
      ===================================================== */}

      {categoryOrder.length > 0 ? (
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
          {categoryOrder.map(
            (category) => {
              const count =
                categoryCounts.get(
                  category
                ) ?? 0;

              return (
                <AppCard
                  key={category}
                  className="
                    flex
                    min-h-[230px]
                    min-w-0
                    flex-col
                    items-center
                    justify-center
                    text-center
                  "
                >
                  {/* =========================================
                      ICON
                  ========================================= */}

                  <div
                    className="
                      flex
                      w-full
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
                        shrink-0
                        place-items-center
                        text-center
                      "
                      aria-hidden="true"
                    >
                      <span
                        className="
                          block
                          text-center
                          text-3xl
                          leading-none
                        "
                      >
                        {
                          categoryIcon[
                            category
                          ]
                        }
                      </span>
                    </div>
                  </div>

                  {/* =========================================
                      INFORMATION
                  ========================================= */}

                  <div
                    className="
                      mt-4
                      w-full
                      min-w-0
                      text-center
                    "
                  >
                    <h2
                      className="
                        w-full
                        break-words
                        text-center
                        text-xl
                        font-extrabold
                        !text-slate-900
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
                        w-full
                        break-words
                        text-center
                        text-sm
                        font-semibold
                        !text-slate-500
                      "
                    >
                      {count.toLocaleString(
                        "th-TH"
                      )}{" "}
                      รายการ
                    </p>
                  </div>

                  {/* =========================================
                      ACTION
                  ========================================= */}

                  <div
                    className="
                      mt-5
                      flex
                      w-full
                      items-center
                      justify-center
                    "
                  >
                    <AppButton
                      href={`/assets/${department.id}/${category.toLowerCase()}`}
                      variant="primary"
                      size="md"
                    >
                      เปิด
                    </AppButton>
                  </div>
                </AppCard>
              );
            }
          )}
        </section>
      ) : (
        /* ===================================================
           EMPTY STATE
        =================================================== */

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
              flex
              w-full
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
                shrink-0
                place-items-center
                text-center
              "
              aria-hidden="true"
            >
              <span
                className="
                  block
                  text-center
                  text-3xl
                  leading-none
                "
              >
                📦
              </span>
            </div>
          </div>

          <div
            className="
              mt-4
              w-full
              min-w-0
              text-center
            "
          >
            <h2
              className="
                w-full
                text-center
                text-xl
                font-extrabold
                !text-slate-900
              "
            >
              ยังไม่มีข้อมูลครุภัณฑ์
            </h2>

            <p
              className="
                mt-2
                w-full
                text-center
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              เมื่อมีข้อมูลครุภัณฑ์
              รายการจะแสดงในส่วนนี้
            </p>
          </div>
        </AppCard>
      )}
    </AppPage>
  );
}