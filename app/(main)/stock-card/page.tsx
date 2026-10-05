import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
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
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
    icon: "📄",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
    icon: "💻",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
    icon: "⚡",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
    icon: "🏠",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
    icon: "🚗",
  },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
    icon: "📰",
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
   CURRENT FISCAL YEAR
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
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return (
    fiscalYearGregorian +
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

  const fiscalYearGregorian =
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return (
    fiscalYearGregorian +
    543
  );
}

/* =========================================================
   FISCAL YEAR RANGE

   FY 2570

   1 ต.ค. 2569
   ถึงก่อน
   1 ต.ค. 2570
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai -
    543;

  /*
   * เก็บ opening balance
   * เป็น date-only UTC 00:00
   *
   * เช่น FY 2570
   * =>
   * 2026-10-01T00:00:00.000Z
   */

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
   FORMAT THAI FULL DATE
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
      parts.month - 1
    ];

  return `${parts.day} ${month} ${
    parts.year + 543
  }`;
}

/* =========================================================
   DISPLAY END DATE

   endDate:
   1 ต.ค. ปีถัดไป

   แสดง:
   30 ก.ย.
========================================================= */

function getDisplayEndDate(
  range: FiscalYearRange
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
   ENSURE OPENING BALANCES

   ทุก Material ที่มียอดคงเหลือ
   ณ สิ้นวันที่ 30 ก.ย.

   จะต้องมี Transaction:

   date        = 1 ต.ค.
   type        = OPENING_BALANCE
   documentNo  = ยอดยกเข้าระบบ

   receiveQty  = opening balance
   issueQty    = 0
   balance     = opening balance

   สำคัญ:
   - ไม่แก้ Material.balance
   - ไม่แก้ ReceiveItem.balance
   - ไม่ถือเป็นการรับของใหม่จริง
========================================================= */

async function ensureFiscalYearOpeningBalances(
  fiscalYearThai: number
) {
  const range =
    getFiscalYearRange(
      fiscalYearThai
    );

  /* =======================================================
     MATERIALS

     ใช้ทุก Material ที่เคยมี transaction

     ไม่อาศัย Material.balance ปัจจุบัน
     เพราะถ้าเปิดระบบหลัง 1 ต.ค. หลายวัน
     current balance อาจเปลี่ยนไปแล้ว
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      select: {
        id: true,

        latestPrice:
          true,

        vendor: {
          select: {
            name:
              true,
          },
        },
      },

      orderBy: {
        id:
          "asc",
      },
    });

  /* =======================================================
     CREATE MISSING OPENING BALANCE
  ======================================================= */

  await prisma.$transaction(
    async (
      tx: any
    ) => {
      for (
        const material of
          materials
      ) {
        /* ===============================================
           ALREADY EXISTS?

           ป้องกันยอดยกซ้ำ
        =============================================== */

        const existingOpening =
          await tx.transaction.findFirst({
            where: {
              materialId:
                material.id,

              type:
                "OPENING_BALANCE",

              documentNo:
                "ยอดยกเข้าระบบ",

              date: {
                gte:
                  range.startDate,

                lt:
                  new Date(
                    range.startDate.getTime() +
                      24 *
                        60 *
                        60 *
                        1000
                  ),
              },
            },

            select: {
              id:
                true,
            },
          });

        if (
          existingOpening
        ) {
          continue;
        }

        /* ===============================================
           LAST STOCK CARD BEFORE NEW FY

           ยอดคงเหลือ ณ สิ้น 30 ก.ย.
           =
           balance ของ Transaction ล่าสุดก่อน 1 ต.ค.

           นี่สำคัญกว่า Material.balance ปัจจุบัน
        =============================================== */

        const lastTransaction =
          await tx.transaction.findFirst({
            where: {
              materialId:
                material.id,

              date: {
                lt:
                  range.startDate,
              },
            },

            orderBy: [
              {
                date:
                  "desc",
              },
              {
                id:
                  "desc",
              },
            ],

            select: {
              id:
                true,

              balance:
                true,

              unitPrice:
                true,

              vendor:
                true,
            },
          });

        /*
         * ไม่มีประวัติ Stock Card ก่อนปีนี้
         * จึงไม่มีฐานที่ปลอดภัยสำหรับยอดยกย้อนหลัง
         */

        if (
          !lastTransaction
        ) {
          continue;
        }

        const openingBalance =
          Math.max(
            0,
            Math.floor(
              Number(
                lastTransaction
                  .balance ??
                  0
              )
            )
          );

        /*
         * ไม่มีของคงเหลือ
         * ไม่ต้องสร้างยอดยก
         */

        if (
          openingBalance <=
          0
        ) {
          continue;
        }

        /* ===============================================
           LATEST PURCHASE BEFORE FY START

           หา:
           ReceiveItem
             -> Receive
             -> Vendor

           ของ Material นี้
           ก่อนวันที่ 1 ต.ค.

           ไม่จำกัดว่าซื้อในปีที่แล้วหรือไม่

           ถ้าไม่ได้ซื้อหลายปี
           ระบบย้อนหาร้านล่าสุดที่เคยซื้อ
        =============================================== */

        const latestPurchase =
          await tx.receiveItem.findFirst({
            where: {
              materialId:
                material.id,

              receive: {
                receiveDate: {
                  lt:
                    range.startDate,
                },
              },
            },

            orderBy: [
              {
                receive: {
                  receiveDate:
                    "desc",
                },
              },

              {
                id:
                  "desc",
              },
            ],

            select: {
              unitPrice:
                true,

              receive: {
                select: {
                  receiveDate:
                    true,

                  vendor: {
                    select: {
                      name:
                        true,
                    },
                  },
                },
              },
            },
          });

        /* ===============================================
           VENDOR

           ลำดับความสำคัญ:

           1. ร้านจากการซื้อครั้งล่าสุด
           2. vendor จาก Stock Card ล่าสุด
           3. vendor ใน Material
        =============================================== */

        const vendorName =
          latestPurchase
            ?.receive
            ?.vendor
            ?.name ??
          lastTransaction
            .vendor ??
          material
            .vendor
            ?.name ??
          null;

        /* ===============================================
           UNIT PRICE

           1. ราคาซื้อครั้งล่าสุด
           2. ราคาจาก Transaction ล่าสุด
           3. Material.latestPrice
        =============================================== */

        const unitPrice =
          Number(
            latestPurchase
              ?.unitPrice ??
              lastTransaction
                .unitPrice ??
              material
                .latestPrice ??
              0
          );

        /* ===============================================
           CREATE OPENING BALANCE

           ไม่แตะยอด stock จริง
        =============================================== */

        await tx.transaction.create({
          data: {
            materialId:
              material.id,

            date:
              range.startDate,

            type:
              "OPENING_BALANCE",

            documentNo:
              "ยอดยกเข้าระบบ",

            receiveQty:
              openingBalance,

            issueQty:
              0,

            balance:
              openingBalance,

            unitPrice,

            vendor:
              vendorName,

            department:
              null,

            remark:
              `ยอดยกเข้าปีงบประมาณ ${fiscalYearThai}`,
          },
        });
      }
    },
    {
      maxWait:
        30000,

      timeout:
        60000,
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardHome({
  searchParams,
}: StockCardHomeProps) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params =
    await searchParams;

  /* =======================================================
     CURRENT FY
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  /* =======================================================
     SELECTED FY
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
     ENSURE OPENING BALANCES

     เลือกปีไหน
     ระบบตรวจปีนั้นว่ามียอดยกครบหรือไม่

     ถ้ามีแล้ว:
     ไม่สร้างซ้ำ

     ถ้ายังไม่มี:
     สร้างเฉพาะรายการที่ขาด
  ======================================================= */

  await ensureFiscalYearOpeningBalances(
    selectedFiscalYear
  );

  /* =======================================================
     AVAILABLE YEARS

     ดึงจาก Transaction ที่มีอยู่จริง
  ======================================================= */

  const transactionDates =
    await prisma.transaction.findMany({
      select: {
        date:
          true,
      },

      orderBy: {
        date:
          "desc",
      },
    });

  const fiscalYearSet =
    new Set<number>();

  fiscalYearSet.add(
    currentFiscalYear
  );

  fiscalYearSet.add(
    selectedFiscalYear
  );

  for (
    const transaction of
      transactionDates
  ) {
    fiscalYearSet.add(
      getFiscalYearThaiFromDate(
        transaction.date
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
        b - a
    );

  const fiscalDisplayEndDate =
    getDisplayEndDate(
      fiscalRange
    );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📚"
        title="รายการบัญชีพัสดุ"
        subtitle={`เลือกหมวดหมู่เพื่อดูประวัติการเคลื่อนไหวพัสดุ • ปีงบประมาณ ${selectedFiscalYear}`}
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
          {/* =================================================
              SELECT FY
          ================================================= */}

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

          {/* =================================================
              FY INFORMATION
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
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          CATEGORY GRID
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
              {/* =============================================
                  ICON
              ============================================= */}

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

              {/* =============================================
                  INFORMATION
              ============================================= */}

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

              {/* =============================================
                  ACTION
              ============================================= */}

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