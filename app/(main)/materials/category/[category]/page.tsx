import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   FORCE FRESH DATA
========================================================= */

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
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

const categoryIcon: Record<
  string,
  string
> = {
  OFFICE:
    "📄",

  COMPUTER:
    "💻",

  ELECTRIC:
    "⚡",

  HOUSEHOLD:
    "🏠",

  VEHICLE:
    "🚗",

  PRINTING:
    "📰",
};

/* =========================================================
   TYPES
========================================================= */

type Category =
  | "OFFICE"
  | "COMPUTER"
  | "ELECTRIC"
  | "HOUSEHOLD"
  | "VEHICLE"
  | "PRINTING";

type Material = {
  id: number;

  code: string;

  name: string;

  unit: string;

  latestPrice: number;

  receiveItems: {
    manufacture:
      | Date
      | null;

    expiry:
      | Date
      | null;
  }[];
};

type Props = {
  params: Promise<{
    category: string;
  }>;

  searchParams: Promise<{
    search?: string;
  }>;
};

type ThailandDateParts = {
  year: number;
  month: number;
  day: number;
};

type FiscalYearRange = {
  startDate: Date;
  endDate: Date;
};

/* =========================================================
   THAI SHORT DATE
   ตัวอย่าง 01 ก.ย. 69
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
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    thaiShortMonths[
      date.getMonth()
    ];

  const buddhistYear =
    String(
      date.getFullYear() +
        543
    ).slice(
      -2
    );

  return `${day} ${month} ${buddhistYear}`;
}

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
   FISCAL YEAR RANGE
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
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
    startDate,
    endDate,
  };
}

/* =========================================================
   ACTUAL ISSUE QTY

   ใช้ Logic เดียวกับ Stock Card

   ถ้ามี issuedQty
   ใช้จำนวนที่จ่ายจริง

   issuedQty = 0
   ถือว่าเป็น 0 จริง

   fallback ไป qty
   เฉพาะกรณี null / undefined
========================================================= */

function getActualIssuedQty(
  item: {
    qty:
      | number
      | null
      | undefined;

    issuedQty:
      | number
      | null
      | undefined;
  }
) {
  if (
    item.issuedQty !==
      null &&
    item.issuedQty !==
      undefined
  ) {
    return Number(
      item.issuedQty
    );
  }

  return Number(
    item.qty ??
      0
  );
}

/* =========================================================
   SAFE NUMBER
========================================================= */

function safeNumber(
  value: unknown
) {
  const number =
    Number(
      value ??
        0
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return number;
}

/* =========================================================
   ADD MAP VALUE
========================================================= */

function addMapValue(
  map: Map<
    number,
    number
  >,
  materialId: number,
  value: number
) {
  map.set(
    materialId,
    (
      map.get(
        materialId
      ) ??
      0
    ) +
      value
  );
}

/* =========================================================
   FORMAT BALANCE
========================================================= */

function formatBalance(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  return value.toLocaleString(
    "th-TH"
  );
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

  const {
    search,
  } =
    await searchParams;

  const keyword =
    search?.trim() ??
    "";

  /* =======================================================
     CURRENT FISCAL YEAR

     ใช้ช่วงเดียวกับหน้า Stock Card ปัจจุบัน
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const currentFiscalRange =
    getFiscalYearRange(
      currentFiscalYear
    );

  /* =======================================================
     MATERIAL DATA
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
        /* ===============================================
           ใช้เฉพาะแสดงวันผลิต / วันหมดอายุล่าสุด
           คง Logic เดิม
        =============================================== */

        receiveItems: {
          orderBy: {
            id:
              "desc",
          },

          take:
            1,
        },
      },

      orderBy: {
        code:
          "asc",
      },
    });

  /* =======================================================
     MATERIAL IDS

     ใช้คำนวณ Stock Card เฉพาะรายการ
     ที่กำลังแสดงในหมวดนี้
  ======================================================= */

  const materialIds =
    materials.map(
      (
        material
      ) =>
        material.id
    );

  /* =======================================================
     STOCK CARD CURRENT MOVEMENTS

     ดึงข้อมูลตาม Logic หน้า Stock Card:

     RECEIVE
     +
     APPROVED ISSUE

     ไม่ใช้:
     - Material.balance
     - Transaction.balance

     เพื่อให้ตรงกับยอด Stock Card
  ======================================================= */

  const [
    stockReceiveItems,
    stockIssueItems,
  ] =
    materialIds.length >
    0
      ? await Promise.all([
          /* =============================================
             RECEIVE

             รับเข้าทั้งหมด
             ก่อนสิ้น FY ปัจจุบัน
          ============================================= */

          prisma.receiveItem.findMany(
            {
              where: {
                materialId: {
                  in:
                    materialIds,
                },

                receive: {
                  receiveDate: {
                    lt:
                      currentFiscalRange
                        .endDate,
                  },
                },
              },

              select: {
                materialId:
                  true,

                qty:
                  true,
              },
            }
          ),

          /* =============================================
             ISSUE

             ใช้เฉพาะ APPROVED
             ก่อนสิ้น FY ปัจจุบัน
          ============================================= */

          prisma.issueItem.findMany(
            {
              where: {
                materialId: {
                  in:
                    materialIds,
                },

                issue: {
                  status:
                    "APPROVED",

                  issueDate: {
                    lt:
                      currentFiscalRange
                        .endDate,
                  },
                },
              },

              select: {
                materialId:
                  true,

                qty:
                  true,

                issuedQty:
                  true,
              },
            }
          ),
        ])
      : [
          [],
          [],
        ];

  /* =======================================================
     RECEIVE MAP

     materialId -> รับเข้าทั้งหมด
  ======================================================= */

  const receiveMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      stockReceiveItems
  ) {
    addMapValue(
      receiveMap,
      item.materialId,
      safeNumber(
        item.qty
      )
    );
  }

  /* =======================================================
     ISSUE MAP

     materialId -> จ่ายจริงทั้งหมด
  ======================================================= */

  const issueMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      stockIssueItems
  ) {
    addMapValue(
      issueMap,
      item.materialId,
      getActualIssuedQty(
        {
          qty:
            item.qty,

          issuedQty:
            item.issuedQty,
        }
      )
    );
  }

  /* =======================================================
     CURRENT STOCK CARD BALANCE

     สำคัญ:

     ไม่ได้เอา "คงเหลือ" ของแต่ละแถวมาบวกกัน

     แต่สร้างยอดปลายทางล่าสุดของแต่ละ Material:

     รับเข้า
     -
     จ่ายจริงที่ APPROVED

     ผลลัพธ์นี้คือ
     "คงเหลือล่าสุด"
     ของ Stock Card
  ======================================================= */

  const currentBalanceMap =
    new Map<
      number,
      number
    >();

  for (
    const material of
      materials
  ) {
    const totalReceive =
      receiveMap.get(
        material.id
      ) ??
      0;

    const totalIssue =
      issueMap.get(
        material.id
      ) ??
      0;

    const currentBalance =
      totalReceive -
      totalIssue;

    currentBalanceMap.set(
      material.id,
      currentBalance
    );
  }

  /* =======================================================
     DISPLAY
  ======================================================= */

  const title =
    categoryName[
      category
    ] ??
    "รายการพัสดุ";

  const icon =
    categoryIcon[
      category
    ] ??
    "📦";

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
        subtitle={`รายการพัสดุในหมวดนี้ทั้งหมด ${materials.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        actions={
          <>
            <AppButton
              href={`/materials/new?category=${category}`}
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
              href="/materials"
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
          SEARCH
          รูปแบบเดิม
      ===================================================== */}

      <form
        method="GET"
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            relative
            w-full
            min-w-0
            overflow-hidden

            rounded-[22px]

            border
            border-white/80

            bg-white/80

            p-3

            shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]

            backdrop-blur-2xl
          "
        >
          {/* ===============================================
              AMBIENT BACKGROUND
          =============================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -left-20
              -top-24

              h-44
              w-44

              rounded-full

              bg-blue-400/[0.08]

              blur-3xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -bottom-24
              right-0

              h-44
              w-44

              rounded-full

              bg-cyan-400/[0.08]

              blur-3xl
            "
          />

          {/* ===============================================
              SEARCH ROW
          =============================================== */}

          <div
            className="
              relative

              flex
              w-full
              min-w-0

              flex-col

              gap-2.5

              md:flex-row
              md:items-center
            "
          >
            {/* =============================================
                SEARCH INPUT
            ============================================= */}

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <input
                type="search"
                name="search"
                defaultValue={
                  keyword
                }
                placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
                autoComplete="off"
                aria-label="ค้นหารหัสพัสดุหรือรายการพัสดุ"
                className="
                  h-11
                  w-full
                  min-w-0

                  rounded-[14px]

                  border
                  border-slate-300

                  bg-white

                  px-4

                  text-sm
                  font-bold

                  !text-slate-900

                  shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]

                  outline-none

                  transition-all
                  duration-200

                  placeholder:font-semibold
                  placeholder:!text-slate-400

                  hover:border-slate-400

                  focus:border-blue-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10

                  sm:h-12
                  sm:text-base
                "
              />
            </div>

            {/* =============================================
                ACTIONS
            ============================================= */}

            <div
              className="
                flex
                min-w-0
                flex-wrap
                items-center

                gap-2

                md:flex-nowrap
                md:shrink-0
              "
            >
              {/* ===========================================
                  SEARCH
              =========================================== */}

              <AppButton
                type="submit"
                variant="primary"
                size="md"
                icon={
                  <span
                    aria-hidden="true"
                  >
                    🔎
                  </span>
                }
                className="
                  flex-1

                  sm:flex-none
                "
              >
                ค้นหา
              </AppButton>

              {/* ===========================================
                  RESULT COUNT
              =========================================== */}

              <div
                className="
                  inline-flex
                  h-11
                  shrink-0

                  items-center
                  justify-center

                  gap-2

                  rounded-[14px]

                  border
                  border-slate-300

                  bg-slate-50

                  px-3

                  text-xs
                  font-extrabold

                  !text-slate-600

                  shadow-sm

                  sm:h-12
                  sm:px-4
                  sm:text-sm
                "
              >
                <span
                  className="
                    inline-flex

                    h-7
                    min-w-7

                    items-center
                    justify-center

                    rounded-full

                    border
                    border-slate-300

                    bg-white

                    px-2

                    text-[11px]
                    font-black
                    tabular-nums

                    !text-slate-800

                    shadow-sm
                  "
                >
                  {materials.length.toLocaleString(
                    "th-TH"
                  )}
                </span>

                <span
                  className="
                    whitespace-nowrap
                  "
                >
                  รายการ
                </span>
              </div>

              {/* ===========================================
                  CLEAR
              =========================================== */}

              {keyword && (
                <AppButton
                  href={`/materials/category/${category}`}
                  variant="outline"
                  size="md"
                  icon={
                    <span
                      aria-hidden="true"
                    >
                      ✕
                    </span>
                  }
                  className="
                    flex-1

                    sm:flex-none
                  "
                >
                  ล้าง
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุ"
        subtitle={
          keyword
            ? `ผลการค้นหา “${keyword}”`
            : "ข้อมูลพัสดุทั้งหมดในหมวดนี้"
        }
        badge={`${materials.length.toLocaleString(
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
              min-w-[1100px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =============================================
                TABLE HEADER

                จำนวน
                ->
                คงเหลือ
            ============================================= */}

            <thead>
              <tr>
                {[
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "คงเหลือ",
                  "หน่วย",
                  "ราคาล่าสุด",
                  "วันผลิต",
                  "วันหมดอายุ",
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

            {/* =============================================
                TABLE BODY
            ============================================= */}

            <tbody>
              {materials.length >
              0 ? (
                materials.map(
                  (
                    material:
                      Material,
                    index
                  ) => {
                    const latestReceive =
                      material
                        .receiveItems[
                        0
                      ];

                    /* =====================================
                       CURRENT BALANCE

                       เอายอดคงเหลือล่าสุดของ
                       Stock Card รายการนี้เพียงค่าเดียว
                    ===================================== */

                    const currentBalance =
                      currentBalanceMap.get(
                        material.id
                      ) ??
                      0;

                    return (
                      <tr
                        key={
                          material.id
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
                        {/* ===================================
                            MATERIAL CODE
                        =================================== */}

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

                        {/* ===================================
                            MATERIAL NAME
                        =================================== */}

                        <td
                          className="
                            min-w-[240px]

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

                        {/* ===================================
                            CURRENT STOCK CARD BALANCE
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-3.5

                            text-center
                            text-base
                            font-black
                            tabular-nums

                            !text-slate-900
                          "
                        >
                          {formatBalance(
                            currentBalance
                          )}
                        </td>

                        {/* ===================================
                            UNIT
                        =================================== */}

                        <td
                          className="
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

                        {/* ===================================
                            LATEST PRICE
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-3.5

                            text-right
                            font-extrabold
                            tabular-nums

                            !text-slate-900
                          "
                        >
                          {Number(
                            material.latestPrice
                          ).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits:
                                2,

                              maximumFractionDigits:
                                2,
                            }
                          )}
                        </td>

                        {/* ===================================
                            MANUFACTURE
                        =================================== */}

                        <td
                          className="
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
                          {formatThaiShortDate(
                            latestReceive
                              ?.manufacture
                          )}
                        </td>

                        {/* ===================================
                            EXPIRY
                        =================================== */}

                        <td
                          className="
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
                          {formatThaiShortDate(
                            latestReceive
                              ?.expiry
                          )}
                        </td>

                        {/* ===================================
                            ACTIONS
                        =================================== */}

                        <td
                          className="
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
                              href={`/materials/${material.id}/edit`}
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
                                material.id
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* ===========================================
                   EMPTY STATE
                =========================================== */

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
                      "
                    >
                      <div
                        className="
                          text-4xl
                        "
                      >
                        📦
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
                          : "ยังไม่มีพัสดุในหมวดนี้"}
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
                          : "เมื่อเพิ่มพัสดุ รายการจะแสดงในส่วนนี้"}
                      </p>

                      {keyword && (
                        <div
                          className="
                            mt-5
                          "
                        >
                          <AppButton
                            href={`/materials/category/${category}`}
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