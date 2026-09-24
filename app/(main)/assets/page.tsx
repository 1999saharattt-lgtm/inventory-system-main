import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

/* =========================================================
   CONSTANTS
========================================================= */

const HIDDEN_DEPARTMENT_NAME =
  "ผู้บริหารสำนักอนามัยการเจริญพันธุ์";

/* =========================================================
   PAGE
========================================================= */

export default async function AssetsPage() {
  /* =======================================================
     USER
  ======================================================= */

  const user = await requireLogin();

  /* =======================================================
     DEPARTMENTS

     โหลดข้อมูลกลุ่มงานตามเดิมทั้งหมด
  ======================================================= */

  const departments =
    await prisma.department.findMany({
      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     DISPLAY DEPARTMENTS

     ซ่อนเฉพาะการ์ด
     "ผู้บริหารสำนักอนามัยการเจริญพันธุ์"

     ไม่แก้ชื่อในฐานข้อมูล
     ไม่แก้ Query
     ไม่กระทบกลุ่มงานอื่น
  ======================================================= */

  const displayDepartments =
    departments.filter(
      (department) =>
        department.name.trim() !==
        HIDDEN_DEPARTMENT_NAME
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🗄️"
        title="ทะเบียนคุมครุภัณฑ์"
        subtitle="เลือกกลุ่มงานเพื่อดูข้อมูลและทะเบียนครุภัณฑ์"
        actions={
          <>
            {/* ===============================================
                INSPECTION HISTORY
                สีเขียวกรมอนามัย
            =============================================== */}

            <AppButton
              href="/assets/inspection-history"
              variant="primary"
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
                สีเขียวกรมอนามัย
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
          </>
        }
      />

      {/* =====================================================
          DEPARTMENT GRID
      ===================================================== */}

      {displayDepartments.length > 0 ? (
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
          {displayDepartments.map(
            (department) => (
              <AppCard
                key={department.id}
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
                    {department.name}
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
                    คลิกเพื่อดูทะเบียนครุภัณฑ์
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
                    href={`/assets/${department.id}`}
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
            w-full
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
                text-center
                text-xl
                font-extrabold
                !text-slate-900
              "
            >
              ยังไม่มีข้อมูลกลุ่มงาน
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
              เมื่อมีข้อมูลกลุ่มงาน
              รายการจะแสดงในส่วนนี้
            </p>
          </div>
        </AppCard>
      )}
    </AppPage>
  );
}