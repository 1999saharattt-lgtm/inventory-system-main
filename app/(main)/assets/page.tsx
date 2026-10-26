
import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AssetsFiscalYearSelect from "./AssetsFiscalYearSelect";

/* =========================================================
   CONSTANTS
========================================================= */

const HIDDEN_DEPARTMENT_NAME =
  "ผู้บริหารสำนักอนามัยการเจริญพันธุ์";

const BASE_FISCAL_YEAR = 2569;
const MAX_FISCAL_YEAR = 3000;

/* =========================================================
   TYPES
========================================================= */

type AssetsPageProps = {
  searchParams: Promise<{
    fiscalYear?: string | string[];
  }>;
};

/* =========================================================
   THAILAND DATE
========================================================= */

function getCurrentFiscalYearThai(
  value: Date = new Date()
) {
  const formatter = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
    }
  );

  const parts = formatter.formatToParts(value);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const fiscalYearGregorian =
    month >= 10 ? year + 1 : year;

  return fiscalYearGregorian + 543;
}

/* =========================================================
   PAGE
========================================================= */

export default async function AssetsPage({
  searchParams,
}: AssetsPageProps) {
  /* =======================================================
     USER
  ======================================================= */

  const user = await requireLogin();

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const params = await searchParams;

  const fiscalYearParam = Array.isArray(
    params.fiscalYear
  )
    ? params.fiscalYear[0]
    : params.fiscalYear;

  const requestedFiscalYear = Number(
    fiscalYearParam
  );

  const selectedFiscalYear =
    fiscalYearParam !== undefined &&
    Number.isInteger(requestedFiscalYear) &&
    requestedFiscalYear >= BASE_FISCAL_YEAR &&
    requestedFiscalYear <= MAX_FISCAL_YEAR
      ? requestedFiscalYear
      : currentFiscalYear;

  const highestFiscalYear = Math.max(
    currentFiscalYear,
    selectedFiscalYear,
    BASE_FISCAL_YEAR
  );

  const availableFiscalYears: number[] = [];

  for (
    let fiscalYear = highestFiscalYear;
    fiscalYear >= BASE_FISCAL_YEAR;
    fiscalYear--
  ) {
    availableFiscalYears.push(fiscalYear);
  }

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
     ซ่อนเฉพาะการ์ดผู้บริหาร
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
          MAIN HEADER CARD
      ===================================================== */}

      <AppCard
        icon={
          <span aria-hidden="true">
            🗄️
          </span>
        }
        title="ทะเบียนคุมบัญชีครุภัณฑ์"
        subtitle="เลือกกลุ่มงานเพื่อดูข้อมูลและทะเบียนครุภัณฑ์"
        actions={
          <>
            {/* ===============================================
                ANNUAL INSPECTION
                ADMIN ONLY
                ไม่มีอิโมจิ
            =============================================== */}

            {user.role === "ADMIN" && (
              <AppButton
                href={`/assets/1/inspection?fiscalYear=${selectedFiscalYear}`}
                variant="primary"
                size="md"
              >
                ตรวจสอบรายการครุภัณฑ์ประจำปี
              </AppButton>
            )}
          </>
        }
        className="
          w-full
          min-w-0
          !overflow-visible
        "
      >
        {/* ===================================================
            FISCAL YEAR SELECT
            รูปแบบเดียวกับหน้า STOCK CARD
        =================================================== */}

        <div
          className="
            w-full
            min-w-0
            sm:max-w-[300px]
          "
        >
          <label
            htmlFor="fiscalYear"
            className="
              mb-2
              block
              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            ปีงบประมาณ
          </label>

          <div
            className="
              relative
              w-full
            "
          >
            <AssetsFiscalYearSelect
              selectedFiscalYear={selectedFiscalYear}
              availableFiscalYears={availableFiscalYears}
            />

            {/* SELECT ARROW */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                right-4
                flex
                items-center
                !text-slate-500
              "
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </AppCard>

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
                {/* ICON */}

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

                {/* INFORMATION */}

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

                {/* ACTION */}

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
                    href={`/assets/${department.id}?fiscalYear=${selectedFiscalYear}`}
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
          {/* ICON */}

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

          {/* INFORMATION */}

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
