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
          DEPARTMENT GRID
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
                key={
                  department.id
                }
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
                {/* ===========================================
                    ICON
                =========================================== */}

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
                      🏢
                    </span>
                  </div>
                </div>

                {/* ===========================================
                    INFORMATION
                =========================================== */}

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
                      department.name
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
                    คลิกเพื่อดูรายชื่อเจ้าหน้าที่
                  </p>
                </div>

                {/* ===========================================
                    ACTION
                =========================================== */}

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
                    href={`/departments/${department.id}`}
                    variant="primary"
                    size="md"
                  >
                    เปิด
                  </AppButton>
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
            flex
            min-h-[230px]
            min-w-0
            flex-col
            items-center
            justify-center
            text-center
          "
        >
          {/* ===============================================
              ICON
          =============================================== */}

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
                🏢
              </span>
            </div>
          </div>

          {/* ===============================================
              INFORMATION
          =============================================== */}

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
              ยังไม่มีข้อมูลหน่วยงาน
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
              เมื่อมีข้อมูลหน่วยงาน
              รายการจะแสดงในหน้านี้
            </p>
          </div>
        </AppCard>
      )}
    </AppPage>
  );
}