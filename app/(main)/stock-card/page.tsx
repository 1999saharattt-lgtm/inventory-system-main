import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

/* =========================================================
   FORCE DYNAMIC
========================================================= */

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/* =========================================================
   TYPES
========================================================= */

type Category = {
  code: string;
  name: string;
  icon: string;
};

type StockCardHomeProps = {
  searchParams: Promise<{
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
   CATEGORIES
========================================================= */

const categories:
  Category[] = [
  {
    code:
      "OFFICE",

    name:
      "วัสดุสำนักงาน",

    icon:
      "📄",
  },

  {
    code:
      "COMPUTER",

    name:
      "วัสดุคอมพิวเตอร์",

    icon:
      "💻",
  },

  {
    code:
      "ELECTRIC",

    name:
      "วัสดุไฟฟ้าและวิทยุ",

    icon:
      "⚡",
  },

  {
    code:
      "HOUSEHOLD",

    name:
      "วัสดุงานบ้านและงานครัว",

    icon:
      "🏠",
  },

  {
    code:
      "VEHICLE",

    name:
      "วัสดุยานพาหนะ",

    icon:
      "🚗",
  },

  {
    code:
      "PRINTING",

    name:
      "วัสดุสื่อสิ่งพิมพ์",

    icon:
      "📰",
  },
];

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
   THAILAND DATE
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
        (
          part
        ) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (
          part
        ) =>
          part.type ===
          "month"
      )?.value
    );

  const day =
    Number(
      parts.find(
        (
          part
        ) =>
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
   CURRENT FY
========================================================= */

function getCurrentFiscalYearThai(
  value: Date =
    new Date()
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalYearGregorian =
    parts.month >=
    10
      ? parts.year +
        1
      : parts.year;

  return (
    fiscalYearGregorian +
    543
  );
}

/* =========================================================
   FY RANGE
========================================================= */

function getFiscalYearRange(
  fiscalYearThai:
    number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai -
    543;

  const startDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian -
          1,
        9,
        1,
        0,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian,
        9,
        1,
        0,
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
   DISPLAY END
========================================================= */

function getDisplayEndDate(
  range:
    FiscalYearRange
) {
  return new Date(
    range.endDate.getTime() -
      24 *
        60 *
        60 *
        1000
  );
}

/* =========================================================
   DATE DISPLAY
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

  return `${parts.day} ${month} ${
    parts.year +
    543
  }`;
}

/* =========================================================
   AVAILABLE YEARS
========================================================= */

function getAvailableFiscalYears(
  currentFiscalYear:
    number,

  selectedFiscalYear:
    number
) {
  const BASE_FISCAL_YEAR =
    2569;

  const highestFiscalYear =
    Math.max(
      currentFiscalYear,
      selectedFiscalYear,
      BASE_FISCAL_YEAR
    );

  const fiscalYears:
    number[] =
    [];

  for (
    let fiscalYear =
      highestFiscalYear;

    fiscalYear >=
    BASE_FISCAL_YEAR;

    fiscalYear--
  ) {
    fiscalYears.push(
      fiscalYear
    );
  }

  return fiscalYears;
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardHome({
  searchParams,
}: StockCardHomeProps) {
  const params =
    await searchParams;

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const requestedFiscalYear =
    Number(
      params.fiscalYear
    );

  const selectedFiscalYear =
    Number.isInteger(
      requestedFiscalYear
    ) &&
    requestedFiscalYear >=
      2569 &&
    requestedFiscalYear <=
      3000
      ? requestedFiscalYear
      : currentFiscalYear;

  const fiscalRange =
    getFiscalYearRange(
      selectedFiscalYear
    );

  const fiscalDisplayEndDate =
    getDisplayEndDate(
      fiscalRange
    );

  const availableFiscalYears =
    getAvailableFiscalYears(
      currentFiscalYear,
      selectedFiscalYear
    );

  const inspectionHref =
    `/stock-card/inspection?fiscalYear=${selectedFiscalYear}`;

  return (
    <AppPage>
      <AppPageHeader
        icon="📚"
        title="รายการบัญชีพัสดุ"
        subtitle={`เลือกหมวดหมู่เพื่อดูประวัติการเคลื่อนไหวพัสดุ • ปีงบประมาณ ${selectedFiscalYear}`}
        actions={
          <AppButton
            href={
              inspectionHref
            }
            variant="primary"
            size="md"
          >
            🔎 ตรวจสอบบัญชีพัสดุประจำปี
          </AppButton>
        }
      />

      {/* =====================================================
          FISCAL YEAR
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
          <form
            method="get"
            action="/stock-card"
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
                  h-[52px]
                  w-full
                  rounded-[16px]
                  border-2
                  !border-black
                  bg-white
                  px-4
                  text-base
                  font-extrabold
                  !text-slate-900
                  shadow-sm
                  outline-none
                  transition-all
                  duration-200
                  focus:ring-4
                  focus:ring-blue-100/70
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

            <AppButton
              type="submit"
              variant="primary"
              size="md"
            >
              แสดงข้อมูล
            </AppButton>
          </form>

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

            {selectedFiscalYear >=
            2570 ? (
              <p
                className="
                  mt-1
                  text-xs
                  font-semibold
                  !text-slate-400
                "
              >
                ยอดคงเหลือต้นปีจะแสดงเป็น
                “ยอดยกเข้าระบบ”
                ณ วันที่ 1 ตุลาคม
              </p>
            ) : (
              <p
                className="
                  mt-1
                  text-xs
                  font-semibold
                  !text-slate-400
                "
              >
                ข้อมูลปีงบประมาณ 2569
                แสดงตามข้อมูลเดิมของระบบ
              </p>
            )}
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          CATEGORY
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
        {categories.map(
          (
            category
          ) => (
            <AppCard
              key={
                category.code
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
                      category.icon
                    }
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
                    break-words
                    text-center
                    text-xl
                    font-extrabold
                    !text-slate-900
                  "
                >
                  {
                    category.name
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
                  คลิกเพื่อดูรายการบัญชีพัสดุ
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-bold
                    !text-slate-400
                  "
                >
                  ปีงบประมาณ{" "}
                  {
                    selectedFiscalYear
                  }
                </p>
              </div>

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
                  href={`/stock-card/${category.code}?fiscalYear=${selectedFiscalYear}`}
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
    </AppPage>
  );
}