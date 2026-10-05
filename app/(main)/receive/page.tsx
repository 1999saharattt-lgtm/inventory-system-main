import { prisma } from "@/lib/prisma";

import DeleteButton from "./DeleteButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";
import AppCard from "@/components/AppCard";

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

type Receive = {
  id: number;

  receiveDate:
    Date;

  documentNo:
    string;

  remark:
    string | null;

  vendor: {
    name:
      string;
  };

  items: {
    id:
      number;
  }[];
};

type ReceivePageProps = {
  searchParams: Promise<{
    date?:
      string;

    period?:
      string;

    fiscalYear?:
      string;
  }>;
};

type ThailandDateParts = {
  year:
    number;

  month:
    number;

  day:
    number;
};

type FiscalYearRange = {
  fiscalYearThai:
    number;

  fiscalYearGregorian:
    number;

  startDate:
    Date;

  endDate:
    Date;
};

/* =========================================================
   THAI MONTHS
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
   THAI DATE DISPLAY

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
   FULL THAI DATE

   ใช้แสดงช่วงปีงบประมาณ

   เช่น:
   1 ต.ค. 2569
========================================================= */

function formatThaiFullDate(
  value:
    Date
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
   CURRENT FISCAL YEAR

   ปีงบประมาณไทย:
   1 ต.ค. - 30 ก.ย.

   ตัวอย่าง:

   30 ก.ย. 2569
   => FY 2569

   1 ต.ค. 2569
   => FY 2570
========================================================= */

function getCurrentFiscalYearThai(
  value:
    Date =
      new Date()
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalGregorianYear =
    parts.month >=
    10
      ? parts.year +
        1
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
  value:
    Date
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalGregorianYear =
    parts.month >=
    10
      ? parts.year +
        1
      : parts.year;

  return (
    fiscalGregorianYear +
    543
  );
}

/* =========================================================
   FISCAL YEAR RANGE

   FY 2570:

   start
   1 ต.ค. 2569 00:00 Asia/Bangkok

   end exclusive
   1 ต.ค. 2570 00:00 Asia/Bangkok

   UTC:
   Bangkok 00:00
   =
   UTC วันก่อนหน้า 17:00
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
   END DATE FOR DISPLAY

   Query endDate เป็น:
   1 ต.ค. ปีถัดไป 00:00

   แต่ข้อความต้องแสดง:
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

   สร้าง boundary ตามเวลาไทย
========================================================= */

function getThailandTodayRange() {
  const parts =
    getThailandDateParts(
      new Date()
    );

  /*
   * วันนี้เวลา 00:00 ไทย
   * = วันก่อนหน้า 17:00 UTC
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
   * วันที่ 1 เวลา 00:00 ไทย
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

export default async function ReceivePage({
  searchParams,
}: ReceivePageProps) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params =
    await searchParams;

  /* =======================================================
     CURRENT FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  /* =======================================================
     REQUESTED FISCAL YEAR
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

     อ่านวันที่รับเข้าที่มีอยู่จริง
     เพื่อนำมาสร้างตัวเลือกย้อนหลัง

     ไม่แก้ข้อมูลเก่า
     ไม่ลบข้อมูลเก่า
  ======================================================= */

  const receiveDates =
    await prisma.receive.findMany({
      select: {
        receiveDate:
          true,
      },

      orderBy: {
        receiveDate:
          "desc",
      },
    });

  const fiscalYearSet =
    new Set<number>();

  /*
   * ต้องมีปีปัจจุบันเสมอ
   * แม้ยังไม่มีข้อมูลในปีนั้น
   */

  fiscalYearSet.add(
    currentFiscalYear
  );

  /*
   * ปีที่ผู้ใช้เปิดผ่าน URL
   * ต้องคงอยู่ในตัวเลือกด้วย
   */

  fiscalYearSet.add(
    selectedFiscalYear
  );

  for (
    const receive of
      receiveDates
  ) {
    fiscalYearSet.add(
      getFiscalYearThaiFromDate(
        receive.receiveDate
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
     ใช้ทั้งปีงบประมาณที่เลือก

     ถ้ามี today/month:
     ใช้ช่วงนั้น แต่ยัง intersect กับปีงบประมาณ
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

    /*
     * Intersect:
     * fiscal range
     * +
     * today
     */

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

     เช่น:
     เลือก FY เก่า
     แต่เลือก "วันนี้"

     วันนี้อาจไม่ได้อยู่ใน FY นั้น
     จึงต้องไม่ query ช่วงเวลาผิด
  ======================================================= */

  const hasValidDateRange =
    filterStartDate.getTime() <
    filterEndDate.getTime();

  /* =======================================================
     LOAD RECEIVE DATA

     ค่าเริ่มต้น:
     เฉพาะ FY ที่เลือก

     เรียง:
     1. วันที่ล่าสุด
     2. ID ล่าสุด
  ======================================================= */

  const receives:
    Receive[] =
    hasValidDateRange
      ? await prisma.receive.findMany({
          where: {
            receiveDate: {
              gte:
                filterStartDate,

              lt:
                filterEndDate,
            },
          },

          include: {
            vendor:
              true,

            items:
              true,
          },

          orderBy: [
            {
              receiveDate:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],
        })
      : [];

  /* =======================================================
     FILTER DESCRIPTION
  ======================================================= */

  let filterText =
    `รายการรับเข้าพัสดุ ปีงบประมาณ ${selectedFiscalYear}`;

  if (
    params.date ===
    "today"
  ) {
    filterText =
      selectedFiscalYear ===
      currentFiscalYear
        ? `รายการรับเข้าพัสดุวันนี้ • ปีงบประมาณ ${selectedFiscalYear}`
        : `รายการรับเข้าพัสดุวันนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  } else if (
    params.period ===
    "month"
  ) {
    filterText =
      `รายการรับเข้าพัสดุประจำเดือนนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
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
      `ข้อมูลรับเข้าของวันนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  } else if (
    params.period ===
    "month"
  ) {
    tableSubtitle =
      `ข้อมูลรับเข้าประจำเดือนนี้ • ปีงบประมาณ ${selectedFiscalYear}`;
  }

  /* =======================================================
     URL HELPERS
  ======================================================= */

  const allFiscalYearHref =
    `/receive?fiscalYear=${selectedFiscalYear}`;

  const todayHref =
    `/receive?fiscalYear=${selectedFiscalYear}&date=today`;

  const monthHref =
    `/receive?fiscalYear=${selectedFiscalYear}&period=month`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📥"
        title="รายการรับเข้าพัสดุ"
        subtitle={
          filterText
        }
        actions={
          <>
            <AppButton
              href="/receive/create"
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
            action="/receive"
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
                PRESERVE FILTER
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
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการเอกสารรับเข้า"
        subtitle={
          tableSubtitle
        }
        badge={`${receives.length.toLocaleString(
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
              min-w-[980px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "วันที่รับเข้า",
                  "เลขที่เอกสาร",
                  "ผู้จำหน่าย",
                  "รายละเอียด",
                  "หมายเหตุ",
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
                BODY
            ================================================= */}

            <tbody>
              {receives.length >
              0 ? (
                receives.map(
                  (
                    receive:
                      Receive,

                    index:
                      number
                  ) => (
                    <tr
                      key={
                        receive.id
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
                          receive.receiveDate
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
                        {receive.documentNo ||
                          "-"}
                      </td>

                      {/* =======================================
                          VENDOR
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
                        {receive
                          .vendor
                          ?.name ||
                          "-"}
                      </td>

                      {/* =======================================
                          DETAIL
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
                            href={`/receive/${receive.id}`}
                            variant="primary"
                            size="sm"
                          >
                            เปิด
                          </AppButton>
                        </div>
                      </td>

                      {/* =======================================
                          REMARK
                      ======================================= */}

                      <td
                        className="
                          min-w-[220px]
                          max-w-[360px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-semibold
                          leading-relaxed

                          !text-slate-700
                        "
                      >
                        <div
                          className="
                            line-clamp-2
                            break-words
                          "
                        >
                          {receive.remark ??
                            "-"}
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
                            href={`/receive/${receive.id}/edit`}
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
                              receive.id
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
                      7
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
                        📥
                      </div>

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
                            ? "วันนี้ยังไม่มีรายการรับเข้าพัสดุ"
                            : `วันนี้ไม่มีข้อมูลในปีงบประมาณ ${selectedFiscalYear}`
                          : params.period ===
                              "month"
                            ? selectedFiscalYear ===
                              currentFiscalYear
                              ? "เดือนนี้ยังไม่มีรายการรับเข้าพัสดุ"
                              : `เดือนนี้ไม่มีข้อมูลในปีงบประมาณ ${selectedFiscalYear}`
                            : `ยังไม่มีข้อมูลรับเข้าพัสดุในปีงบประมาณ ${selectedFiscalYear}`}
                      </p>

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