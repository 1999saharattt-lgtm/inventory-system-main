import { prisma } from "@/lib/prisma";

import SearchStockCard from "./SearchStockCard";

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
    fiscalYearThai,
    fiscalYearGregorian,
    startDate,
    endDate,
  };
}

/* =========================================================
   ACTUAL ISSUE QTY

   ใช้ Logic เดียวกับหน้า Stock Card จริง

   issuedQty มีค่า
   -> ใช้ issuedQty

   issuedQty = 0
   -> ถือเป็น 0 จริง

   fallback qty
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
   NUMBER
========================================================= */

function safeNumber(
  value: unknown
) {
  const number =
    Number(
      value ??
        0
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================================
   DISPLAY BALANCE
========================================================= */

function formatBalance(
  value: number
) {
  return value.toLocaleString(
    "th-TH"
  );
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

  const query =
    await searchParams;

  const keyword =
    query.search
      ?.trim() ??
    "";

  /* =======================================================
     SELECTED FISCAL YEAR

     ใช้สำหรับ:
     - URL
     - ผู้จำหน่ายล่าสุดของปีที่กำลังดู
     - กลับไปหน้าปีเดิม
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const requestedFiscalYear =
    Number(
      query.fiscalYear
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

  const selectedFiscalRange =
    getFiscalYearRange(
      selectedFiscalYear
    );

  /* =======================================================
     CURRENT STOCK CARD RANGE

     คงเหลือที่แสดงในหน้าหมวด
     ต้องเป็นคงเหลือ "ปัจจุบัน"

     ดังนั้นไม่ใช้ selectedFiscalYear

     เช่น:
     เปิดหน้าปี 2569
     แต่ปัจจุบันอยู่ FY2570

     ช่อง "คงเหลือ"
     ต้องเป็นยอดปัจจุบันของ Stock Card
  ======================================================= */

  const currentFiscalRange =
    getFiscalYearRange(
      currentFiscalYear
    );

  /* =======================================================
     MATERIALS

     receiveItems ตรงนี้ใช้เพื่อหา
     "ผู้จำหน่ายล่าสุด"
     ของปีงบประมาณที่กำลังเปิด
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
          where: {
            receive: {
              receiveDate: {
                lt:
                  selectedFiscalRange
                    .endDate,
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
     MATERIAL IDS

     คำนวณเฉพาะวัสดุที่กำลังอยู่ในหน้าหมวดนี้
  ======================================================= */

  const materialIds =
    materials.map(
      (
        material
      ) =>
        material.id
    );

  /* =======================================================
     CURRENT STOCK CARD DATA

     สูตรเดียวกับหน้า Stock Card:

       รับเข้า
       -
       เบิกจ่ายที่ APPROVED

     สำคัญ:
     - ไม่ใช้ Material.balance
     - ไม่ใช้ Transaction.balance
     - ใช้ issuedQty จริง
  ======================================================= */

  const [
    currentReceiveItems,
    currentIssueItems,
  ] =
    materialIds.length >
    0
      ? await Promise.all([
          /* =============================================
             RECEIVE

             โหลดตั้งแต่ประวัติแรก
             จนถึงสิ้น FY ปัจจุบัน

             เหมือนหน้า Stock Card
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

             เฉพาะ APPROVED
             เหมือนหน้า Stock Card
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
  ======================================================= */

  const receiveMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      currentReceiveItems
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

     ใช้ getActualIssuedQty()
     เหมือน Stock Card
  ======================================================= */

  const issueMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      currentIssueItems
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
     CURRENT BALANCE MAP

     current balance
     =
     total receive
     -
     total approved actual issue
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

    currentBalanceMap.set(
      material.id,
      totalReceive -
        totalIssue
    );
  }

  /* =======================================================
     CATEGORY
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

     กดกลับ
     ต้องกลับปีเดิมที่เลือก
  ======================================================= */

  const stockCardHomeHref =
    `/stock-card?fiscalYear=${selectedFiscalYear}`;

  const clearSearchHref =
    `/stock-card/${category}?fiscalYear=${selectedFiscalYear}`;

  /* =========================================================
     UI
  ========================================================= */

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
          >
            กลับ
          </AppButton>
        }
      />

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
              min-w-[900px]

              table-fixed
              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =================================================
                COLUMN WIDTH
            ================================================= */}

            <colgroup>
              <col
                className="w-[6%]"
              />

              <col
                className="w-[13%]"
              />

              <col
                className="w-[27%]"
              />

              <col
                className="w-[10%]"
              />

              <col
                className="w-[9%]"
              />

              <col
                className="w-[23%]"
              />

              <col
                className="w-[12%]"
              />
            </colgroup>

            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "คงเหลือ",
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
                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-2
                        py-3.5

                        text-center
                        text-sm
                        font-extrabold

                        !text-white

                        lg:text-base
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
              {materials.length >
              0 ? (
                materials.map(
                  (
                    material,
                    index
                  ) => {
                    /* =========================================
                       LATEST VENDOR
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

                    /* =========================================
                       CURRENT STOCK CARD BALANCE

                       สูตรเดียวกับ Stock Card
                    ========================================= */

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
                            border
                            border-black

                            px-2
                            py-3

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
                            break-words

                            border
                            border-black

                            px-2
                            py-3

                            text-center
                            text-sm
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
                            break-words

                            border
                            border-black

                            px-3
                            py-3

                            font-extrabold
                            leading-relaxed

                            !text-slate-900
                          "
                        >
                          {material.name ||
                            "-"}
                        </td>

                        {/* =====================================
                            CURRENT BALANCE
                        ===================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-2
                            py-3

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

                        {/* =====================================
                            UNIT
                        ===================================== */}

                        <td
                          className="
                            break-words

                            border
                            border-black

                            px-2
                            py-3

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
                            break-words

                            border
                            border-black

                            px-3
                            py-3

                            font-bold
                            leading-relaxed

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
                            border
                            border-black

                            px-2
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