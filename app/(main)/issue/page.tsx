import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";
import AppCard from "@/components/AppCard";

import DeleteButton from "./DeleteButton";

/* =========================================================
   FORCE FRESH DATA
========================================================= */

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/* =========================================================
   TYPES
========================================================= */

type Issue = {
  id: number;

  issueDate: Date;

  documentNo: string;

  remark: string | null;

  status: string;

  department: {
    name: string;
  };

  officer: {
    firstName: string;
    lastName: string;
  } | null;

  items: {
    id: number;

    qty: number;

    manufacture: Date | null;
    expiry: Date | null;

    material: {
      id: number;
      name: string;
      unit: string;
    };
  }[];
};

type IssuePageProps = {
  searchParams: Promise<{
    date?: string;
    period?: string;
    fiscalYear?: string;
  }>;
};

type ThailandDateParts = {
  year: number;
  month: number;
  day: number;
};

type FiscalYearRange = {
  fiscalYearThai: number;

  fiscalYearGregorian: number;

  startDate: Date;

  endDate: Date;
};

/* =========================================================
   THAI SHORT MONTHS
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/* =========================================================
   THAILAND DATE PARTS

   อ่านวันจริงตาม Asia/Bangkok

   ไม่อิง timezone ของ Vercel
========================================================= */

function getThailandDateParts(
  value: Date
): ThailandDateParts {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      value
    );

  const year =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "month"
      )?.value
    );

  const day =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "day"
      )?.value
    );

  return {
    year,
    month,
    day,
  };
}

/* =========================================================
   THAI SHORT DATE

   ตัวอย่าง:
   23 ก.ย. 69
========================================================= */

function formatThaiShortDate(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "-";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const parts =
    getThailandDateParts(
      date
    );

  const month =
    thaiShortMonths[
      parts.month -
        1
    ];

  const buddhistYear =
    String(
      parts.year +
        543
    ).slice(
      -2
    );

  return `${parts.day} ${month} ${buddhistYear}`;
}

/* =========================================================
   THAI FULL DATE

   ตัวอย่าง:
   1 ต.ค. 2569
========================================================= */

function formatThaiFullDate(
  value: Date
) {
  const parts =
    getThailandDateParts(
      value
    );

  const month =
    thaiShortMonths[
      parts.month -
        1
    ];

  const buddhistYear =
    parts.year +
    543;

  return `${parts.day} ${month} ${buddhistYear}`;
}

/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "PENDING":
      return "รอเบิกจ่าย";

    case "APPROVED":
      return "เสร็จสิ้นแล้ว";

    case "REJECTED":
      return "ไม่อนุมัติ";

    default:
      return (
        status ||
        "-"
      );
  }
}

/* =========================================================
   CURRENT FISCAL YEAR

   ปีงบประมาณไทย:

   1 ต.ค. - 30 ก.ย.

   ตัวอย่าง:

   30 ก.ย. 2569
   =>
   FY 2569

   1 ต.ค. 2569
   =>
   FY 2570
========================================================= */

function getCurrentFiscalYearThai(
  value: Date =
    new Date()
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalGregorianYear =
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return (
    fiscalGregorianYear +
    543
  );
}

/* =========================================================
   FISCAL YEAR FROM DATE
========================================================= */

function getFiscalYearThaiFromDate(
  value: Date
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalGregorianYear =
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return (
    fiscalGregorianYear +
    543
  );
}

/* =========================================================
   FISCAL YEAR RANGE

   FY 2570:

   start:
   1 ต.ค. 2569 00:00 ไทย

   end exclusive:
   1 ต.ค. 2570 00:00 ไทย

   ไทย UTC+7

   00:00 ไทย
   =
   17:00 UTC ของวันก่อนหน้า
========================================================= */

function getFiscalYearRange(
  fiscalYearThai:
    number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai -
    543;

  const startGregorianYear =
    fiscalYearGregorian -
    1;

  const startDate =
    new Date(
      Date.UTC(
        startGregorianYear,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  return {
    fiscalYearThai,

    fiscalYearGregorian,

    startDate,

    endDate,
  };
}

/* =========================================================
   DISPLAY END DATE

   Query:
   < 1 ต.ค. ปีถัดไป

   แต่แสดง:
   30 ก.ย.
========================================================= */

function getFiscalDisplayEndDate(
  range:
    FiscalYearRange
) {
  return new Date(
    range.endDate.getTime() -
      1000
  );
}

/* =========================================================
   TODAY RANGE - THAILAND
========================================================= */

function getThailandTodayRange() {
  const parts =
    getThailandDateParts(
      new Date()
    );

  /*
   * วันนี้ 00:00 ไทย
   *
   * = วันก่อนหน้า
   *   17:00 UTC
   */

  const startDate =
    new Date(
      Date.UTC(
        parts.year,
        parts.month -
          1,
        parts.day -
          1,
        17,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      startDate.getTime() +
        24 *
          60 *
          60 *
          1000
    );

  return {
    startDate,
    endDate,
  };
}

/* =========================================================
   CURRENT MONTH RANGE - THAILAND
========================================================= */

function getThailandCurrentMonthRange() {
  const parts =
    getThailandDateParts(
      new Date()
    );

  /*
   * วันที่ 1 ของเดือนปัจจุบัน
   * เวลา 00:00 ไทย
   */

  const startDate =
    new Date(
      Date.UTC(
        parts.year,
        parts.month -
          1,
        0,
        17,
        0,
        0,
        0
      )
    );

  /*
   * วันที่ 1 ของเดือนถัดไป
   * เวลา 00:00 ไทย
   */

  const endDate =
    new Date(
      Date.UTC(
        parts.year,
        parts.month,
        0,
        17,
        0,
        0,
        0
      )
    );

  return {
    startDate,
    endDate,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function IssuePage({
  searchParams,
}: IssuePageProps) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params =
    await searchParams;

  /* =======================================================
     SESSION
  ======================================================= */

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "session"
    )?.value;

  let session:
    | SessionUser
    | null = null;

  if (token) {
    try {
      session =
        await verifySession(
          token
        );
    } catch {
      session =
        null;
    }
  }

  /* =======================================================
     DEPARTMENT PERMISSION

     ADMIN
     - ดูทุกหน่วยงาน

     USER
     - ดูเฉพาะหน่วยงานของตัวเอง
  ======================================================= */

  const issueDepartmentWhere =
    session?.role ===
    "ADMIN"
      ? {}
      : session
          ?.departmentId
        ? {
            departmentId:
              session.departmentId,
          }
        : {
            departmentId:
              -1,
          };

  /* =======================================================
     CURRENT FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  /* =======================================================
     SELECTED FISCAL YEAR
  ======================================================= */

  const requestedFiscalYear =
    Number(
      params.fiscalYear
    );

  const selectedFiscalYear =
    Number.isInteger(
      requestedFiscalYear
    ) &&
    requestedFiscalYear >=
      2400 &&
    requestedFiscalYear <=
      3000
      ? requestedFiscalYear
      : currentFiscalYear;

  const fiscalRange =
    getFiscalYearRange(
      selectedFiscalYear
    );

  /* =======================================================
     AVAILABLE FISCAL YEARS

     ใช้ Issue ที่ผู้ใช้มีสิทธิ์เห็น
     เพื่อสร้างรายการปีงบประมาณย้อนหลัง

     ADMIN:
     ทุกปีที่มีข้อมูล

     USER:
     เฉพาะปีที่หน่วยงานของตัวเองมีข้อมูล
  ======================================================= */

  const issueDates =
    await prisma.issue.findMany({
      where:
        issueDepartmentWhere,

      select: {
        issueDate:
          true,
      },

      orderBy: {
        issueDate:
          "desc",
      },
    });

  const fiscalYearSet =
    new Set<number>();

  /*
   * ต้องมีปีปัจจุบันเสมอ
   */

  fiscalYearSet.add(
    currentFiscalYear
  );

  /*
   * ถ้าเปิด URL ปีเก่าโดยตรง
   * ต้องให้ปีนั้นยังอยู่ในตัวเลือก
   */

  fiscalYearSet.add(
    selectedFiscalYear
  );

  for (
    const issue of
      issueDates
  ) {
    fiscalYearSet.add(
      getFiscalYearThaiFromDate(
        issue.issueDate
      )
    );
  }

  const availableFiscalYears =
    Array.from(
      fiscalYearSet
    ).sort(
      (
        a,
        b
      ) =>
        b -
        a
    );

  /* =======================================================
     DATE FILTER

     ค่าเริ่มต้น:
     ทั้งปีงบประมาณที่เลือก
  ======================================================= */

  let filterStartDate =
    fiscalRange.startDate;

  let filterEndDate =
    fiscalRange.endDate;

  /* =======================================================
     TODAY
  ======================================================= */

  if (
    params.date ===
    "today"
  ) {
    const today =
      getThailandTodayRange();

    filterStartDate =
      new Date(
        Math.max(
          fiscalRange
            .startDate
            .getTime(),

          today
            .startDate
            .getTime()
        )
      );

    filterEndDate =
      new Date(
        Math.min(
          fiscalRange
            .endDate
            .getTime(),

          today
            .endDate
            .getTime()
        )
      );
  }

  /* =======================================================
     CURRENT MONTH
  ======================================================= */

  if (
    params.period ===
    "month"
  ) {
    const monthRange =
      getThailandCurrentMonthRange();

    filterStartDate =
      new Date(
        Math.max(
          fiscalRange
            .startDate
            .getTime(),

          monthRange
            .startDate
            .getTime()
        )
      );

    filterEndDate =
      new Date(
        Math.min(
          fiscalRange
            .endDate
            .getTime(),

          monthRange
            .endDate
            .getTime()
        )
      );
  }

  /* =======================================================
     VALID RANGE

     ตัวอย่าง:
     เลือก FY 2569
     แต่กด "วันนี้" ซึ่งอยู่ FY 2570

     ต้องให้ผล = 0
     ไม่ใช่ query ช่วงวันที่กลับด้าน
  ======================================================= */

  const hasValidDateRange =
    filterStartDate.getTime() <
    filterEndDate.getTime();

  /* =======================================================
     WHERE
  ======================================================= */

  const issueWhere =
    hasValidDateRange
      ? {
          ...issueDepartmentWhere,

          issueDate: {
            gte:
              filterStartDate,

            lt:
              filterEndDate,
          },
        }
      : null;

  /* =======================================================
     LOAD ISSUES

     เรียง:
     1. วันที่ล่าสุดอยู่บน
     2. วันเดียวกัน ID ใหม่กว่าก่อน
  ======================================================= */

  const issues:
    Issue[] =
    issueWhere
      ? await prisma.issue.findMany({
          where:
            issueWhere,

          orderBy: [
            {
              issueDate:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],

          include: {
            department:
              true,

            officer:
              true,

            items: {
              include: {
                material:
                  true,
              },
            },
          },
        })
      : [];

  /* =======================================================
     PENDING COUNT

     นับเฉพาะข้อมูลในปีงบประมาณ /
     filter ที่กำลังเปิดดู

     ADMIN ONLY
  ======================================================= */

  const pendingCount =
    session?.role ===
    "ADMIN"
      ? issues.filter(
          (issue) =>
            issue.status ===
            "PENDING"
        ).length
      : 0;

  /* =======================================================
     FILTER DESCRIPTION
  ======================================================= */

  let filterText =
    `รายการเบิกจ่ายพัสดุ ปีงบประมาณ ${selectedFiscalYear}`;

  if (
    params.date ===
    "today"
  ) {
    filterText =
      `รายการเบิกจ่ายพัสดุวันนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  } else if (
    params.period ===
    "month"
  ) {
    filterText =
      `รายการเบิกจ่ายพัสดุประจำเดือนนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  }

  /* =======================================================
     TABLE SUBTITLE
  ======================================================= */

  const fiscalDisplayEndDate =
    getFiscalDisplayEndDate(
      fiscalRange
    );

  let tableSubtitle =
    `ข้อมูลปีงบประมาณ ${selectedFiscalYear} • ${formatThaiFullDate(
      fiscalRange.startDate
    )} - ${formatThaiFullDate(
      fiscalDisplayEndDate
    )}`;

  if (
    params.date ===
    "today"
  ) {
    tableSubtitle =
      `ข้อมูลเบิกจ่ายของวันนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  } else if (
    params.period ===
    "month"
  ) {
    tableSubtitle =
      `ข้อมูลเบิกจ่ายประจำเดือนนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  }

  /* =======================================================
     URL HELPERS
  ======================================================= */

  const allFiscalYearHref =
    `/issue?fiscalYear=${selectedFiscalYear}`;

  const todayHref =
    `/issue?fiscalYear=${selectedFiscalYear}&date=today`;

  const monthHref =
    `/issue?fiscalYear=${selectedFiscalYear}&period=month`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📤"
        title="รายการเบิกจ่ายพัสดุ"
        subtitle={
          filterText
        }
        actions={
          <>
            <AppButton
              href="/issue/create"
              variant="primary"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ＋
                </span>
              }
            >
              เพิ่มรายการ
            </AppButton>

            <AppButton
              href="/"
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
          FISCAL YEAR FILTER
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
        "
      >
        <div
          className="
            flex
            min-w-0
            flex-col

            gap-4

            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          {/* =================================================
              FISCAL YEAR SELECT
          ================================================= */}

          <form
            method="get"
            action="/issue"
            className="
              flex
              min-w-0
              flex-col

              gap-3

              sm:flex-row
              sm:items-end
            "
          >
            <div
              className="
                min-w-0

                sm:w-[260px]
              "
            >
              <label
                htmlFor="fiscalYear"
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold

                  !text-slate-800
                "
              >
                ปีงบประมาณ
              </label>

              <select
                id="fiscalYear"
                name="fiscalYear"
                defaultValue={
                  String(
                    selectedFiscalYear
                  )
                }
                className="
                  h-[48px]
                  w-full

                  rounded-[14px]

                  border-2
                  !border-black

                  bg-white

                  px-4

                  text-base
                  font-extrabold

                  !text-slate-900

                  outline-none

                  transition-all

                  focus:ring-4
                  focus:ring-blue-100
                "
              >
                {availableFiscalYears.map(
                  (
                    fiscalYear
                  ) => (
                    <option
                      key={
                        fiscalYear
                      }
                      value={
                        fiscalYear
                      }
                    >
                      ปีงบประมาณ{" "}
                      {
                        fiscalYear
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ===============================================
                PRESERVE CURRENT FILTER
            =============================================== */}

            {params.date ? (
              <input
                type="hidden"
                name="date"
                value={
                  params.date
                }
              />
            ) : null}

            {params.period ? (
              <input
                type="hidden"
                name="period"
                value={
                  params.period
                }
              />
            ) : null}

            <AppButton
              type="submit"
              variant="primary"
              size="md"
            >
              แสดงข้อมูล
            </AppButton>
          </form>

          {/* =================================================
              FISCAL YEAR INFORMATION
          ================================================= */}

          <div
            className="
              min-w-0

              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/80

              px-4
              py-3

              shadow-sm
            "
          >
            <p
              className="
                text-sm
                font-extrabold

                !text-slate-900
              "
            >
              ปีงบประมาณ{" "}
              {
                selectedFiscalYear
              }
            </p>

            <p
              className="
                mt-1

                text-sm
                font-semibold

                !text-slate-500
              "
            >
              {formatThaiFullDate(
                fiscalRange.startDate
              )}{" "}
              -{" "}
              {formatThaiFullDate(
                fiscalDisplayEndDate
              )}
            </p>
          </div>
        </div>

        {/* ===================================================
            QUICK FILTERS
        =================================================== */}

        <div
          className="
            mt-4

            flex
            flex-wrap
            items-center

            gap-2

            border-t
            border-slate-200

            pt-4
          "
        >
          <span
            className="
              mr-1

              text-sm
              font-extrabold

              !text-slate-600
            "
          >
            แสดง:
          </span>

          <AppButton
            href={
              allFiscalYearHref
            }
            variant={
              !params.date &&
              !params.period
                ? "primary"
                : "secondary"
            }
            size="sm"
          >
            ทั้งปีงบประมาณ
          </AppButton>

          <AppButton
            href={
              todayHref
            }
            variant={
              params.date ===
              "today"
                ? "primary"
                : "secondary"
            }
            size="sm"
          >
            วันนี้
          </AppButton>

          <AppButton
            href={
              monthHref
            }
            variant={
              params.period ===
              "month"
                ? "primary"
                : "secondary"
            }
            size="sm"
          >
            เดือนนี้
          </AppButton>
        </div>
      </AppCard>

      {/* =====================================================
          PENDING ALERT

          ADMIN ONLY
      ===================================================== */}

      {session?.role ===
        "ADMIN" &&
      pendingCount >
        0 ? (
        <div
          className="
            w-full
            min-w-0

            rounded-[24px]

            border
            border-amber-200

            bg-amber-50

            p-4

            shadow-[0_12px_30px_-22px_rgba(146,64,14,0.25)]

            sm:p-5
          "
        >
          <div
            className="
              flex
              min-w-0
              flex-col

              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  text-base
                  font-extrabold

                  !text-amber-900

                  sm:text-lg
                "
              >
                🔔 มีรายการรอเบิกจ่าย
              </p>

              <p
                className="
                  mt-1

                  text-sm
                  font-semibold
                  leading-relaxed

                  !text-amber-800
                "
              >
                มีใบเบิกจำนวน{" "}
                {pendingCount.toLocaleString(
                  "th-TH"
                )}{" "}
                รายการ ในปีงบประมาณ{" "}
                {
                  selectedFiscalYear
                }{" "}
                รอเจ้าหน้าที่พัสดุตรวจสอบและลงจำนวนเบิกจ่ายจริง
              </p>
            </div>

            <span
              className="
                inline-flex
                shrink-0
                items-center
                justify-center

                whitespace-nowrap

                rounded-full

                border
                border-amber-300

                bg-white

                px-4
                py-2

                text-sm
                font-extrabold

                !text-amber-900
              "
            >
              รอ{" "}
              {pendingCount.toLocaleString(
                "th-TH"
              )}{" "}
              รายการ
            </span>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <AppTableCard
        title="รายการเอกสารเบิกจ่าย"
        subtitle={
          tableSubtitle
        }
        badge={`${issues.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
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
              min-w-[1180px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "วันที่",
                  "เลขที่เอกสาร",
                  "หน่วยงาน / กลุ่มงาน",
                  "ผู้ขอเบิก",
                  "สถานะ",
                  "รายละเอียด",
                  "จัดการ",
                ].map(
                  (
                    tableTitle
                  ) => (
                    <th
                      key={
                        tableTitle
                      }
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
                      {
                        tableTitle
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {issues.length >
              0 ? (
                issues.map(
                  (
                    issue:
                      Issue,

                    index:
                      number
                  ) => (
                    <tr
                      key={
                        issue.id
                      }
                      className={`
                        ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ORDER
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          tabular-nums

                          !text-slate-900
                        "
                      >
                        {(
                          index +
                          1
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* =======================================
                          DATE
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          tabular-nums

                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          issue.issueDate
                        )}
                      </td>

                      {/* =======================================
                          DOCUMENT NUMBER
                      ======================================= */}

                      <td
                        className="
                          min-w-[160px]
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
                        {issue.documentNo ||
                          "-"}
                      </td>

                      {/* =======================================
                          DEPARTMENT
                      ======================================= */}

                      <td
                        className="
                          min-w-[220px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold

                          !text-slate-900
                        "
                      >
                        {issue
                          .department
                          ?.name ??
                          "-"}
                      </td>

                      {/* =======================================
                          OFFICER
                      ======================================= */}

                      <td
                        className="
                          min-w-[190px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold

                          !text-slate-900
                        "
                      >
                        {issue.officer
                          ? `${issue.officer.firstName} ${issue.officer.lastName}`
                          : "-"}
                      </td>

                      {/* =======================================
                          STATUS
                      ======================================= */}

                      <td
                        className="
                          min-w-[150px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                        "
                      >
                        {issue.status ===
                        "PENDING" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-amber-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold

                              !text-amber-800
                            "
                          >
                            🔔 รอเบิกจ่าย
                          </span>
                        ) : issue.status ===
                          "APPROVED" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-emerald-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold

                              !text-emerald-800
                            "
                          >
                            ✓ เสร็จสิ้นแล้ว
                          </span>
                        ) : issue.status ===
                          "REJECTED" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-red-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold

                              !text-red-800
                            "
                          >
                            ✕ ไม่อนุมัติ
                          </span>
                        ) : (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-slate-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold

                              !text-slate-700
                            "
                          >
                            {getStatusLabel(
                              issue.status
                            )}
                          </span>
                        )}
                      </td>

                      {/* =======================================
                          DETAILS
                      ======================================= */}

                      <td
                        className="
                          min-w-[130px]
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
                            href={`/issue/${issue.id}`}
                            variant="primary"
                            size="sm"
                          >
                            เปิด
                          </AppButton>
                        </div>
                      </td>

                      {/* =======================================
                          ACTIONS
                      ======================================= */}

                      <td
                        className="
                          min-w-[200px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center

                            gap-2
                          "
                        >
                          <AppButton
                            href={`/issue/${issue.id}/edit`}
                            variant="primary"
                            size="sm"
                            icon={
                              <span
                                aria-hidden="true"
                              >
                                ✏️
                              </span>
                            }
                          >
                            แก้ไข
                          </AppButton>

                          <DeleteButton
                            id={
                              issue.id
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={
                      8
                    }
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
                        justify-center
                      "
                    >
                      {/* ICON */}

                      <div
                        className="
                          grid
                          h-16
                          w-16

                          place-items-center

                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        📤
                      </div>

                      {/* TITLE */}

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight

                          !text-slate-900
                        "
                      >
                        {params.date ===
                        "today"
                          ? selectedFiscalYear ===
                            currentFiscalYear
                            ? "วันนี้ยังไม่มีรายการเบิกจ่ายพัสดุ"
                            : `วันนี้ไม่มีข้อมูลในปีงบประมาณ ${selectedFiscalYear}`
                          : params.period ===
                              "month"
                            ? selectedFiscalYear ===
                              currentFiscalYear
                              ? "เดือนนี้ยังไม่มีรายการเบิกจ่ายพัสดุ"
                              : `เดือนนี้ไม่มีข้อมูลในปีงบประมาณ ${selectedFiscalYear}`
                            : `ยังไม่มีรายการเบิกจ่ายพัสดุในปีงบประมาณ ${selectedFiscalYear}`}
                      </p>

                      {/* DESCRIPTION */}

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed

                          !text-slate-500
                        "
                      >
                        สามารถเลือกปีงบประมาณอื่นเพื่อดูข้อมูลย้อนหลังได้
                      </p>
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