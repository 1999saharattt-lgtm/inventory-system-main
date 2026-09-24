import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

export const dynamic = "force-dynamic";

/* =========================================================
   PAGE
========================================================= */

export default async function DepartmentsPage() {
  /* =======================================================
     DEPARTMENTS
  ======================================================= */

  const departments =
    await prisma.department.findMany({
      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title="หน่วยงาน"
        subtitle="เลือกหน่วยงานเพื่อดูข้อมูลเจ้าหน้าที่และรายการที่เกี่ยวข้อง"
      />

      {/* =====================================================
          DEPARTMENT LIST
      ===================================================== */}

      {departments.length > 0 ? (
        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-5

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
                  flex
                  min-h-[250px]
                  w-full
                  min-w-0
                  flex-col
                  overflow-hidden
                  !p-0
                "
              >
                {/* ===========================================
                    TOP BAR
                =========================================== */}

                <div
                  className="
                    h-2
                    w-full
                    shrink-0

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                  "
                />

                {/* ===========================================
                    CONTENT
                =========================================== */}

                <div
                  className="
                    flex
                    flex-1
                    flex-col
                    items-center
                    justify-between
                    gap-5

                    p-6
                    text-center
                  "
                >
                  {/* =========================================
                      INFORMATION
                  ========================================= */}

                  <div
                    className="
                      flex
                      w-full
                      min-w-0
                      flex-col
                      items-center
                    "
                  >
                    {/* ICON */}

                    <div
                      className="
                        grid
                        h-16
                        w-16
                        shrink-0
                        place-items-center

                        rounded-2xl

                        border
                        border-slate-200

                        bg-slate-50

                        text-4xl

                        shadow-sm

                        transition-transform
                        duration-200

                        group-hover:scale-105
                      "
                      aria-hidden="true"
                    >
                      🏢
                    </div>

                    {/* NAME */}

                    <h2
                      className="
                        mt-5
                        w-full
                        break-words

                        text-xl
                        font-extrabold
                        leading-relaxed
                        !text-slate-900
                      "
                    >
                      {department.name}
                    </h2>

                    {/* DESCRIPTION */}

                    <p
                      className="
                        mt-2

                        text-base
                        font-semibold
                        leading-relaxed
                        !text-slate-500
                      "
                    >
                      คลิกเพื่อดูรายชื่อเจ้าหน้าที่
                    </p>
                  </div>

                  {/* =========================================
                      ACTION
                  ========================================= */}

                  <div
                    className="
                      mt-auto
                      flex
                      w-full
                      justify-center
                      pt-2
                    "
                  >
                    <AppButton
                      href={`/departments/${department.id}`}
                      variant="primary"
                      size="md"
                    >
                      เปิด
                    </AppButton>
                  </div>
                </div>
              </AppCard>
            )
          )}
        </div>
      ) : (
        /* ===================================================
            EMPTY STATE
        =================================================== */

        <AppCard>
          <div
            className="
              flex
              min-h-[260px]
              w-full
              flex-col
              items-center
              justify-center

              px-6
              py-12

              text-center
            "
          >
            {/* ICON */}

            <div
              className="
                grid
                h-16
                w-16
                place-items-center

                rounded-2xl

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

            {/* TITLE */}

            <h2
              className="
                mt-4

                text-lg
                font-extrabold
                !text-slate-900
              "
            >
              ยังไม่มีข้อมูลหน่วยงาน
            </h2>

            {/* DESCRIPTION */}

            <p
              className="
                mt-2

                text-sm
                font-semibold
                leading-relaxed
                !text-slate-500
              "
            >
              เมื่อมีข้อมูลหน่วยงาน
              รายการจะแสดงในหน้านี้
            </p>
          </div>
        </AppCard>
      )}
    </AppPage>
  );
}