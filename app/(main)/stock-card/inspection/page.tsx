import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "./InspectionForm";

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

type PageProps = {
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
  startDate: Date;
  endDate: Date;
};

type MaterialRow = {
  materialId: number;

  code: string;
  name: string;
  unit: string;
  category: string;

  openingBalance: number;

  receiveQty: number;
  issueQty: number;

  closingBalance: number;
};

/* =========================================================
   CONSTANT
========================================================= */

const BASE_FISCAL_YEAR =
  2569;

const MAX_FISCAL_YEAR =
  3000;

const CATEGORY_ORDER = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
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

  return {
    year:
      Number(
        parts.find(
          (
            part
          ) =>
            part.type ===
            "year"
        )?.value
      ),

    month:
      Number(
        parts.find(
          (
            part
          ) =>
            part.type ===
            "month"
        )?.value
      ),

    day:
      Number(
        parts.find(
          (
            part
          ) =>
            part.type ===
            "day"
        )?.value
      ),
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
   CURRENT THAILAND DATE
   END EXCLUSIVE
========================================================= */

function getCurrentThailandEndExclusive() {
  const parts =
    getThailandDateParts(
      new Date()
    );

  return new Date(
    Date.UTC(
      parts.year,
      parts.month -
        1,
      parts.day +
        1,
      0,
      0,
      0,
      0
    )
  );
}

/* =========================================================
   FISCAL YEAR RANGE

   FY2569
   =
   01 ต.ค. 2568
   ถึงก่อน
   01 ต.ค. 2569
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai -
    543;

  return {
    startDate:
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
      ),

    endDate:
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
      ),
  };
}

/* =========================================================
   SHORT YEAR
========================================================= */

function getShortYear(
  buddhistYear: number
) {
  return String(
    buddhistYear %
      100
  ).padStart(
    2,
    "0"
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

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================================
   ACTUAL ISSUE QTY

   issuedQty = 0
   ถือเป็น 0 จริง

   fallback qty
   เฉพาะ null / undefined
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
    return safeNumber(
      item.issuedQty
    );
  }

  return safeNumber(
    item.qty
  );
}

/* =========================================================
   ADD MAP
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
   SORT
========================================================= */

function sortMaterialRows(
  rows: MaterialRow[]
) {
  return [
    ...rows,
  ].sort(
    (
      a,
      b
    ) => {
      const categoryA =
        CATEGORY_ORDER.indexOf(
          a.category
        );

      const categoryB =
        CATEGORY_ORDER.indexOf(
          b.category
        );

      const orderA =
        categoryA >=
        0
          ? categoryA
          : Number.MAX_SAFE_INTEGER;

      const orderB =
        categoryB >=
        0
          ? categoryB
          : Number.MAX_SAFE_INTEGER;

      if (
        orderA !==
        orderB
      ) {
        return (
          orderA -
          orderB
        );
      }

      return a.code.localeCompare(
        b.code,
        "th",
        {
          numeric:
            true,

          sensitivity:
            "base",
        }
      );
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardInspectionPage({
  searchParams,
}: PageProps) {
  const query =
    await searchParams;

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const requestedFiscalYear =
    Number(
      query.fiscalYear
    );

  const fiscalYear =
    Number.isInteger(
      requestedFiscalYear
    ) &&
    requestedFiscalYear >=
      BASE_FISCAL_YEAR &&
    requestedFiscalYear <=
      MAX_FISCAL_YEAR
      ? requestedFiscalYear
      : currentFiscalYear;

  const selectedRange =
    getFiscalYearRange(
      fiscalYear
    );

  const currentEndExclusive =
    getCurrentThailandEndExclusive();

  const queryEndDate =
    selectedRange.endDate.getTime() >
    currentEndExclusive.getTime()
      ? selectedRange.endDate
      : currentEndExclusive;

  /* =======================================================
     OPENING DAY

     FY2569
     =
     01 ต.ค. 2568

     หา Transaction
     "ยอดยกเข้าระบบ"
     เฉพาะวันนี้
  ======================================================= */

  const openingDayEnd =
    new Date(
      selectedRange.startDate.getTime() +
        24 *
          60 *
          60 *
          1000
    );

  /* =======================================================
     YEAR LABEL
  ======================================================= */

  const startShortYear =
    getShortYear(
      fiscalYear -
        1
    );

  const endShortYear =
    getShortYear(
      fiscalYear
    );

  /* =======================================================
     EXISTING INSPECTION
  ======================================================= */

  const existingInspection =
    await prisma.stockCardInspection.findUnique(
      {
        where: {
          fiscalYear,
        },

        select: {
          id:
            true,
        },
      }
    );

  if (
    existingInspection
  ) {
    redirect(
      `/stock-card/inspection-history/${fiscalYear}`
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const [
    materials,
    receiveItems,
    approvedIssueItems,
    openingTransactions,
    officers,
  ] =
    await Promise.all([
      /* =================================================
         MATERIALS
      ================================================= */

      prisma.material.findMany(
        {
          select: {
            id:
              true,

            code:
              true,

            name:
              true,

            unit:
              true,

            category:
              true,
          },

          orderBy: {
            code:
              "asc",
          },
        }
      ),

      /* =================================================
         RECEIVE ITEMS

         รับจริงเท่านั้น

         ไม่มี OPENING_BALANCE อยู่ใน query นี้
      ================================================= */

      prisma.receiveItem.findMany(
        {
          where: {
            receive: {
              receiveDate: {
                lt:
                  queryEndDate,
              },
            },
          },

          select: {
            materialId:
              true,

            qty:
              true,

            receive: {
              select: {
                receiveDate:
                  true,
              },
            },
          },
        }
      ),

      /* =================================================
         APPROVED ISSUE
      ================================================= */

      prisma.issueItem.findMany(
        {
          where: {
            issue: {
              status:
                "APPROVED",

              issueDate: {
                lt:
                  queryEndDate,
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

            issue: {
              select: {
                issueDate:
                  true,
              },
            },
          },
        }
      ),

      /* =================================================
         EXACT OPENING TRANSACTION

         ดึงแถว "ยอดยกเข้าระบบ"
         วันที่ 1 ต.ค. ของ FY ที่เลือกโดยตรง

         FY2569
         =
         01 ต.ค.2568
      ================================================= */

      prisma.transaction.findMany(
        {
          where: {
            type:
              "OPENING_BALANCE",

            documentNo:
              "ยอดยกเข้าระบบ",

            date: {
              gte:
                selectedRange.startDate,

              lt:
                openingDayEnd,
            },
          },

          select: {
            id:
              true,

            materialId:
              true,

            receiveQty:
              true,

            balance:
              true,
          },

          orderBy: {
            id:
              "asc",
          },
        }
      ),

      /* =================================================
         OFFICERS
      ================================================= */

      prisma.officer.findMany(
        {
          select: {
            id:
              true,

            firstName:
              true,

            lastName:
              true,

            position:
              true,

            type:
              true,

            departmentId:
              true,

            sectionId:
              true,

            department: {
              select: {
                id:
                  true,

                name:
                  true,
              },
            },

            section: {
              select: {
                id:
                  true,

                name:
                  true,
              },
            },
          },

          orderBy: {
            id:
              "asc",
          },
        }
      ),
    ]);

  /* =======================================================
     EXACT OPENING MAP

     materialId
     ->
     ยอดยกเข้าระบบของวันที่ 1 ต.ค.

     ถ้ามีมากกว่า 1 record
     ใช้ record id ล่าสุด
  ======================================================= */

  const exactOpeningMap =
    new Map<
      number,
      number
    >();

  for (
    const transaction of
      openingTransactions
  ) {
    const openingValue =
      transaction.balance !==
        null &&
      transaction.balance !==
        undefined
        ? safeNumber(
            transaction.balance
          )
        : safeNumber(
            transaction.receiveQty
          );

    exactOpeningMap.set(
      transaction.materialId,
      openingValue
    );
  }

  /* =======================================================
     VIRTUAL OPENING FALLBACK

     ใช้เฉพาะกรณีไม่มี
     Transaction "ยอดยกเข้าระบบ"

     Logic เดียวกับ Stock Card READ ONLY:

     รับก่อน 1 ต.ค.
     -
     APPROVED Issue ก่อน 1 ต.ค.
  ======================================================= */

  const virtualOpeningMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     FY RECEIVE
  ======================================================= */

  const fiscalReceiveMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     FY ISSUE
  ======================================================= */

  const fiscalIssueMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     CURRENT RECEIVE
  ======================================================= */

  const currentReceiveMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     CURRENT ISSUE
  ======================================================= */

  const currentIssueMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     RECEIVE LOOP

     สำคัญ:
     opening balance ไม่ได้อยู่ใน receiveItems
     ดังนั้นรับจะไม่รวมยอดยกเข้าระบบ
  ======================================================= */

  for (
    const item of
      receiveItems
  ) {
    const receiveTime =
      new Date(
        item.receive.receiveDate
      ).getTime();

    const qty =
      safeNumber(
        item.qty
      );

    /* ===============================================
       VIRTUAL OPENING FALLBACK
    =============================================== */

    if (
      receiveTime <
      selectedRange.startDate.getTime()
    ) {
      addMapValue(
        virtualOpeningMap,
        item.materialId,
        qty
      );
    }

    /* ===============================================
       RECEIVE IN SELECTED FY ONLY

       FY2569:
       01 ต.ค.68 - 30 ก.ย.69

       ไม่รวมยอดยก
    =============================================== */

    if (
      receiveTime >=
        selectedRange.startDate.getTime() &&
      receiveTime <
        selectedRange.endDate.getTime()
    ) {
      addMapValue(
        fiscalReceiveMap,
        item.materialId,
        qty
      );
    }

    /* ===============================================
       RECEIVE CURRENT
    =============================================== */

    if (
      receiveTime <
      currentEndExclusive.getTime()
    ) {
      addMapValue(
        currentReceiveMap,
        item.materialId,
        qty
      );
    }
  }

  /* =======================================================
     ISSUE LOOP
  ======================================================= */

  for (
    const item of
      approvedIssueItems
  ) {
    const issueTime =
      new Date(
        item.issue.issueDate
      ).getTime();

    const actualIssueQty =
      getActualIssuedQty(
        item
      );

    /* ===============================================
       VIRTUAL OPENING FALLBACK
    =============================================== */

    if (
      issueTime <
      selectedRange.startDate.getTime()
    ) {
      addMapValue(
        virtualOpeningMap,
        item.materialId,
        -actualIssueQty
      );
    }

    /* ===============================================
       ISSUE IN SELECTED FY ONLY
    =============================================== */

    if (
      issueTime >=
        selectedRange.startDate.getTime() &&
      issueTime <
        selectedRange.endDate.getTime()
    ) {
      addMapValue(
        fiscalIssueMap,
        item.materialId,
        actualIssueQty
      );
    }

    /* ===============================================
       ISSUE CURRENT
    =============================================== */

    if (
      issueTime <
      currentEndExclusive.getTime()
    ) {
      addMapValue(
        currentIssueMap,
        item.materialId,
        actualIssueQty
      );
    }
  }

  /* =======================================================
     FINAL MATERIAL ROWS
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          /* =============================================
             OPENING BALANCE

             ลำดับความสำคัญ:

             1. Transaction "ยอดยกเข้าระบบ"
                วันที่ 1 ต.ค.

             2. fallback virtual opening
                จาก Stock Card
          ============================================= */

          const openingBalance =
            exactOpeningMap.has(
              material.id
            )
              ? exactOpeningMap.get(
                  material.id
                ) ??
                0
              : virtualOpeningMap.get(
                  material.id
                ) ??
                0;

          /* =============================================
             RECEIVE

             รับจริงใน FY เท่านั้น
             ไม่บวก openingBalance
          ============================================= */

          const receiveQty =
            fiscalReceiveMap.get(
              material.id
            ) ??
            0;

          /* =============================================
             ISSUE

             จ่ายจริง APPROVED
             ใน FY เท่านั้น
          ============================================= */

          const issueQty =
            fiscalIssueMap.get(
              material.id
            ) ??
            0;

          /* =============================================
             CURRENT BALANCE
          ============================================= */

          const currentReceive =
            currentReceiveMap.get(
              material.id
            ) ??
            0;

          const currentIssue =
            currentIssueMap.get(
              material.id
            ) ??
            0;

          const closingBalance =
            currentReceive -
            currentIssue;

          return {
            materialId:
              material.id,

            code:
              material.code,

            name:
              material.name,

            unit:
              material.unit,

            category:
              String(
                material.category
              ),

            openingBalance,

            receiveQty,

            issueQty,

            closingBalance,
          };
        }
      )
    );

  /* =======================================================
     BACK
  ======================================================= */

  const backHref =
    `/stock-card?fiscalYear=${fiscalYear}`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      <AppPageHeader
        icon="🔎"
        title="ตรวจสอบบัญชีพัสดุประจำปี"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        actions={
          <AppButton
            href={
              backHref
            }
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      <InspectionForm
        fiscalYear={
          fiscalYear
        }
        startShortYear={
          startShortYear
        }
        endShortYear={
          endShortYear
        }
        materials={
          rows
        }
        officers={
          officers
        }
      />
    </AppPage>
  );
}