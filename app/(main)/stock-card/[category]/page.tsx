import { prisma } from "@/lib/prisma";

import SearchStockCard from "./SearchStockCard";

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

type Props = {
  params: Promise<{
    category: string;
  }>;

  searchParams: Promise<{
    search?: string;
    fiscalYear?: string;
  }>;
};

type Category =
  | "OFFICE"
  | "COMPUTER"
  | "ELECTRIC"
  | "HOUSEHOLD"
  | "VEHICLE"
  | "PRINTING";

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
   CATEGORY
========================================================= */

const categoryNames: Record<
  string,
  string
> = {
  OFFICE:
    "วัสดุสำนักงาน",

  COMPUTER:
    "วัสดุคอมพิวเตอร์",

  ELECTRIC:
    "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",

  VEHICLE:
    "วัสดุยานพาหนะ",

  PRINTING:
    "วัสดุสื่อสิ่งพิมพ์",
};

const categoryIcons: Record<
  string,
  string
> = {
  OFFICE: "📄",

  COMPUTER: "💻",

  ELECTRIC: "⚡",

  HOUSEHOLD: "🏠",

  VEHICLE: "🚗",

  PRINTING: "📰",
};

/* =========================================================
   THAI MONTH
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

   ปีงบประมาณไทย:
   1 ต.ค. - 30 ก.ย.
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
   FISCAL YEAR RANGE

   ตัวอย่าง FY 2570

   start:
   1 ต.ค. 2569

   end exclusive:
   1 ต.ค. 2570
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai -
    543;

  /*
   * ใช้ date-only UTC
   *
   * ให้ตรงกับวันที่ Transaction /
   * Receive ที่ระบบใหม่กำลังใช้
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
   DISPLAY END DATE
========================================================= */

function getFiscalDisplayEndDate(
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
   FORMAT THAI DATE

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
   PAGE
========================================================= */

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    category,
  } =
    await params;

  const searchParamsValue =
    await searchParams;

  const keyword =
    searchParamsValue
      .search
      ?.trim() ??
    "";

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const requestedFiscalYear =
    Number(
      searchParamsValue
        .fiscalYear
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

  const fiscalDisplayEndDate =
    getFiscalDisplayEndDate(
      fiscalRange
    );

  /* =======================================================
     DATA

     ผู้จำหน่ายล่าสุด:

     ต้องหา ReceiveItem ล่าสุด
     ก่อนสิ้นสุดปีงบประมาณที่เลือก

     เช่นเปิด FY 2569:

     ห้ามเอาร้านที่เพิ่งซื้อใน FY 2570
     มาแสดง

     ถ้า FY 2569 ไม่ได้ซื้อ:
     ให้ย้อนหาร้านล่าสุดในอดีตก่อน FY 2570
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      where: {
        category:
          category as Category,

        ...(keyword
          ? {
              OR: [
                {
                  code: {
                    contains:
                      keyword,
                  },
                },

                {
                  name: {
                    contains:
                      keyword,
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        receiveItems: {
          /*
           * ย้อนหารายการซื้อทั้งหมด
           * ที่เกิดก่อนสิ้นสุด FY ที่เลือก
           *
           * ไม่จำเป็นต้องซื้อภายใน FY นั้น
           *
           * เพราะผู้ใช้ต้องการ:
           * "รายการไหนไม่ได้ซื้อก็อิงจากของเดิมที่เคยซื้อ"
           */

          where: {
            receive: {
              receiveDate: {
                lt:
                  fiscalRange.endDate,
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

          take:
            1,

          include: {
            receive: {
              include: {
                vendor:
                  true,
              },
            },
          },
        },
      },

      orderBy: {
        code:
          "asc",
      },
    });

  /* =======================================================
     CATEGORY INFORMATION
  ======================================================= */

  const title =
    categoryNames[
      category
    ] ??
    "รายการบัญชีพัสดุ";

  const icon =
    categoryIcons[
      category
    ] ??
    "📚";

  /* =======================================================
     URL
  ======================================================= */

  const stockCardHomeHref =
    `/stock-card?fiscalYear=${selectedFiscalYear}`;

  const clearSearchHref =
    `/stock-card/${category}?fiscalYear=${selectedFiscalYear}`;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon={
          icon
        }
        title={
          title
        }
        subtitle={`รายการบัญชีพัสดุ จำนวน ${materials.length.toLocaleString(
          "th-TH"
        )} รายการ • ปีงบประมาณ ${selectedFiscalYear}`}
        actions={
          <AppButton
            href={
              stockCardHomeHref
            }
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
        }
      />

      {/* =====================================================
          FISCAL YEAR INFORMATION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          p-4

          sm:p-5
        "
      >
        <div
          className="
            flex
            min-w-0
            flex-col

            gap-2

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
                fiscalRange
                  .startDate
              )}{" "}
              -{" "}
              {formatThaiFullDate(
                fiscalDisplayEndDate
              )}
            </p>
          </div>

          <div
            className="
              rounded-full

              bg-slate-100

              px-4
              py-2

              text-sm
              font-extrabold

              !text-slate-700
            "
          >
            📚 บัญชีพัสดุ{" "}
            {
              selectedFiscalYear
            }
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <SearchStockCard
        category={category}
        defaultSearch={keyword}
        resultCount={materials.length}
        fiscalYear={selectedFiscalYear}
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการบัญชีพัสดุ"
        subtitle={
          keyword
            ? `ผลการค้นหา “${keyword}” • ปีงบประมาณ ${selectedFiscalYear}`
            : `ข้อมูลพัสดุทั้งหมดในหมวดนี้ • ปีงบประมาณ ${selectedFiscalYear}`
        }
        badge={`${materials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE SCROLL
        =================================================== */}

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
              min-w-[1000px]

              border-collapse

              bg-white
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "หน่วย",
                  "ผู้จำหน่ายล่าสุด",
                  "บัญชีพัสดุ",
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
              {materials.length >
              0 ? (
                materials.map(
                  (
                    material,
                    index
                  ) => {
                    /* =========================================
                       LATEST PURCHASE

                       เป็นการซื้อล่าสุด
                       ณ ปีงบประมาณที่กำลังดู
                    ========================================= */

                    const latestReceive =
                      material
                        .receiveItems[
                        0
                      ];

                    const latestVendor =
                      latestReceive
                        ?.receive
                        ?.vendor
                        ?.name ??
                      "-";

                    return (
                      <tr
                        key={
                          material.id
                        }
                        className={`
                          transition-colors
                          duration-200

                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* =====================================
                            ORDER
                        ===================================== */}

                        <td
                          className="
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
                          {(
                            index +
                            1
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        {/* =====================================
                            CODE
                        ===================================== */}

                        <td
                          className="
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
                          {material.code ||
                            "-"}
                        </td>

                        {/* =====================================
                            NAME
                        ===================================== */}

                        <td
                          className="
                            min-w-[280px]

                            border
                            border-black

                            px-4
                            py-3.5

                            font-extrabold

                            !text-slate-900
                          "
                        >
                          {material.name ||
                            "-"}
                        </td>

                        {/* =====================================
                            UNIT
                        ===================================== */}

                        <td
                          className="
                            min-w-[120px]
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-3.5

                            text-center
                            font-bold

                            !text-slate-700
                          "
                        >
                          {material.unit ||
                            "-"}
                        </td>

                        {/* =====================================
                            LATEST VENDOR
                        ===================================== */}

                        <td
                          className="
                            min-w-[240px]

                            border
                            border-black

                            px-4
                            py-3.5

                            font-bold

                            !text-slate-700
                          "
                        >
                          {
                            latestVendor
                          }
                        </td>

                        {/* =====================================
                            ACTION
                        ===================================== */}

                        <td
                          className="
                            min-w-[140px]
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
                              href={`/stock-card/material/${material.id}?fiscalYear=${selectedFiscalYear}`}
                              variant="primary"
                              size="sm"
                            >
                              เปิด
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* =============================================
                   EMPTY STATE
                ============================================= */

                <tr>
                  <td
                    colSpan={
                      6
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
                      "
                    >
                      <div
                        className="
                          flex
                          h-16
                          w-16

                          items-center
                          justify-center

                          rounded-[20px]

                          bg-slate-100

                          text-3xl

                          shadow-inner
                        "
                        aria-hidden="true"
                      >
                        📚
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold

                          !text-slate-900
                        "
                      >
                        {keyword
                          ? "ไม่พบพัสดุที่ค้นหา"
                          : "ยังไม่มีข้อมูลบัญชีพัสดุ"}
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold

                          !text-slate-500
                        "
                      >
                        {keyword
                          ? "ลองค้นหาด้วยรหัสหรือชื่อพัสดุอื่น"
                          : `ยังไม่มีข้อมูลพัสดุในหมวดนี้ ปีงบประมาณ ${selectedFiscalYear}`}
                      </p>

                      {keyword && (
                        <div
                          className="
                            mt-5
                          "
                        >
                          <AppButton
                            href={
                              clearSearchHref
                            }
                            variant="primary"
                            size="md"
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
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