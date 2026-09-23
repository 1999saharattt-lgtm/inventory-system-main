import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

/* =========================================================
   PAGE
========================================================= */

export default async function AssetsPage() {
  /* =======================================================
     USER
  ======================================================= */

  const user =
    await requireLogin();

  /* =======================================================
     DEPARTMENTS
  ======================================================= */

  const departments =
    await prisma.department.findMany({
      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ตัวกลางของระบบ
      ===================================================== */}

      <AppPageHeader
        icon="🗄️"
        title="ทะเบียนคุมครุภัณฑ์"
        subtitle="เลือกกลุ่มงานเพื่อดูข้อมูลและทะเบียนครุภัณฑ์"
        actions={
          <>
            {/* ===============================================
                INSPECTION HISTORY
            =============================================== */}

            <AppButton
              href="/assets/inspection-history"
              variant="secondary"
              size="md"
              icon={
                <span aria-hidden="true">
                  📋
                </span>
              }
            >
              ประวัติการตรวจสอบครุภัณฑ์ประจำปี
            </AppButton>

            {/* ===============================================
                ANNUAL INSPECTION
                ADMIN ONLY
            =============================================== */}

            {user.role === "ADMIN" && (
              <AppButton
                href="/assets/1/inspection"
                variant="primary"
                size="md"
                icon={
                  <span aria-hidden="true">
                    🔎
                  </span>
                }
              >
                ตรวจสอบรายการครุภัณฑ์ประจำปี
              </AppButton>
            )}

            {/* ===============================================
                BACK
            =============================================== */}

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
          </>
        }
      />

      {/* =====================================================
          DEPARTMENT CARDS
      ===================================================== */}

      {departments.length > 0 ? (
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
          {departments.map(
            (department) => (
              <AppCard
                key={department.id}
                className="
                  group
                  relative

                  min-w-0
                  overflow-hidden

                  !p-0

                  transition-all
                  duration-300
                  ease-out

                  hover:-translate-y-1
                  hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.4)]
                "
              >
                {/* ===========================================
                    TOP ACCENT
                =========================================== */}

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

                {/* ===========================================
                    AMBIENT
                =========================================== */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute
                    -right-16
                    -top-16

                    h-40
                    w-40

                    rounded-full

                    bg-blue-400/[0.08]

                    blur-3xl

                    transition-all
                    duration-500

                    group-hover:scale-125
                    group-hover:bg-blue-400/[0.12]
                  "
                />

                {/* ===========================================
                    CONTENT
                =========================================== */}

                <div
                  className="
                    relative

                    flex
                    min-h-[220px]
                    min-w-0
                    flex-col

                    p-5

                    sm:min-h-[230px]
                    sm:p-6
                  "
                >
                  {/* =========================================
                      ICON
                  ========================================= */}

                  <div
                    className="
                      flex
                      h-16
                      w-16
                      shrink-0

                      items-center
                      justify-center

                      rounded-[20px]

                      bg-gradient-to-br
                      from-slate-800
                      to-slate-700

                      text-3xl

                      shadow-[0_16px_30px_-18px_rgba(15,23,42,0.5)]

                      ring-1
                      ring-white/30

                      transition-all
                      duration-300

                      group-hover:-translate-y-0.5
                      group-hover:scale-[1.06]
                    "
                    aria-hidden="true"
                  >
                    🏢
                  </div>

                  {/* =========================================
                      TEXT
                  ========================================= */}

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
                      {department.name}
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
                      คลิกเพื่อดูทะเบียนครุภัณฑ์ของกลุ่มงาน
                    </p>
                  </div>

                  {/* =========================================
                      ACTION
                  ========================================= */}

                  <div
                    className="
                      mt-auto

                      flex
                      items-center
                      justify-end

                      pt-5
                    "
                  >
                    <AppButton
                      href={`/assets/${department.id}`}
                      variant="primary"
                      size="md"
                      icon={
                        <span aria-hidden="true">
                          →
                        </span>
                      }
                    >
                      เปิด
                    </AppButton>
                  </div>
                </div>
              </AppCard>
            )
          )}
        </section>
      ) : (
        /* ===================================================
            EMPTY STATE
        =================================================== */

        <AppCard
          className="
            w-full
            min-w-0

            px-6
            py-14

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
              justify-center
            "
          >
            {/* ===============================================
                ICON
            =============================================== */}

            <div
              className="
                flex
                h-16
                w-16

                items-center
                justify-center

                rounded-[20px]

                border
                border-slate-200

                bg-slate-50

                text-3xl

                shadow-sm
              "
              aria-hidden="true"
            >
              🏢
            </div>

            {/* ===============================================
                TITLE
            =============================================== */}

            <h2
              className="
                mt-5

                text-xl
                font-black
                tracking-tight
                !text-slate-900

                sm:text-2xl
              "
            >
              ยังไม่มีข้อมูลกลุ่มงาน
            </h2>

            {/* ===============================================
                DESCRIPTION
            =============================================== */}

            <p
              className="
                mt-2

                text-sm
                font-semibold
                leading-relaxed
                !text-slate-500

                sm:text-base
              "
            >
              เมื่อมีการเพิ่มข้อมูลกลุ่มงาน
              รายการจะแสดงในส่วนนี้
            </p>
          </div>
        </AppCard>
      )}
    </AppPage>
  );
}