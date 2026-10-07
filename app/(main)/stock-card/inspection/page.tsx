import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "./InspectionForm";

/* =========================================================
   FORCE FRESH DATA
========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  /*
   * ยอดยกเข้าระบบ ณ วันที่ 1 ต.ค.
   *
   * FY2569
   * =
   * ยอดยกเข้าระบบ 01 ต.ค.2568
   *
   * แสดงในหัว:
   * คงเหลือยอดยกมาเมื่อ 30 ก.ย.68
   */
  openingBalance: number;

  /*
   * รับจริงเฉพาะ FY ที่เลือก
   * ไม่รวมยอดยกเข้าระบบ
   */
  receiveQty: number;

  /*
   * จ่ายจริง APPROVED
   * เฉพาะ FY ที่เลือก
   */
  issueQty: number;

  /*
   * ยอดคงเหลือ Stock Card ปัจจุบัน
   */
  closingBalance: number;
};

/* =========================================================
   CONSTANT
========================================================= */

const BASE_FISCAL_YEAR = 2569;
const MAX_FISCAL_YEAR = 3000;

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
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
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
          (part) =>
            part.type === "year"
        )?.value
      ),

    month:
      Number(
        parts.find(
          (part) =>
            part.type === "month"
        )?.value
      ),

    day:
      Number(
        parts.find(
          (part) =>
            part.type === "day"
        )?.value
      ),
  };
}

/* =========================================================
   CURRENT FISCAL YEAR
========================================================= */

function getCurrentFiscalYearThai(
  value: Date = new Date()
) {
  const parts =
    getThailandDateParts(
      value
    );

  const fiscalYearGregorian =
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return fiscalYearGregorian + 543;
}

/* =========================================================
   CURRENT DATE - END EXCLUSIVE

   วันนี้ตามเวลาไทย
   รวมรายการของวันนี้ด้วย
========================================================= */

function getCurrentThailandEndExclusive() {
  const parts =
    getThailandDateParts(
      new Date()
    );

  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day + 1,
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
   01 ต.ค.2568 00:00
   ถึงก่อน
   01 ต.ค.2569 00:00
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai - 543;

  return {
    startDate:
      new Date(
        Date.UTC(
          fiscalYearGregorian - 1,
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
    buddhistYear % 100
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
      value ?? 0
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================================
   ACTUAL ISSUE QTY

   กติกาเดียวกับ Stock Card

   issuedQty = 0
   ต้องเป็น 0 จริง

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
    item.issuedQty !== null &&
    item.issuedQty !== undefined
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
  map: Map<number, number>,
  materialId: number,
  value: number
) {
  map.set(
    materialId,
    (
      map.get(
        materialId
      ) ?? 0
    ) + value
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
      const indexA =
        CATEGORY_ORDER.indexOf(
          a.category
        );

      const indexB =
        CATEGORY_ORDER.indexOf(
          b.category
        );

      const orderA =
        indexA >= 0
          ? indexA
          : Number.MAX_SAFE_INTEGER;

      const orderB =
        indexB >= 0
          ? indexB
          : Number.MAX_SAFE_INTEGER;

      if (
        orderA !== orderB
      ) {
        return orderA - orderB;
      }

      return a.code.localeCompare(
        b.code,
        "th",
        {
          numeric: true,
          sensitivity: "base",
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

  const fiscalRange =
    getFiscalYearRange(
      fiscalYear
    );

  const currentEndExclusive =
    getCurrentThailandEndExclusive();

  /*
   * วันถัดจาก 1 ต.ค.
   *
   * ใช้หา Opening Balance
   * เฉพาะวันที่ 1 ต.ค. ของปีที่เลือก
   */
  const openingDayEnd =
    new Date(
      fiscalRange.startDate.getTime() +
        24 *
          60 *
          60 *
          1000
    );

  /* =======================================================
     LABEL
  ======================================================= */

  const startShortYear =
    getShortYear(
      fiscalYear - 1
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
          id: true,
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
     LOAD DATA
  ======================================================= */

  const [
    materials,

    openingTransactions,
    transactionsBeforeFiscalYear,

    receiveBeforeFiscalYear,
    issueBeforeFiscalYear,

    fiscalReceiveItems,
    fiscalIssueItems,

    currentReceiveItems,
    currentIssueItems,

    officers,
  ] =
    await Promise.all([
      /* =================================================
         MATERIAL
      ================================================= */

      prisma.material.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          category: true,
        },

        orderBy: {
          code: "asc",
        },
      }),

      /* =================================================
         1. EXACT OPENING BALANCE

         ดึง "ยอดยกเข้าระบบ"
         วันที่ 01 ต.ค. ของ FY โดยตรง

         ตัวอย่าง FY2569:
         01 ต.ค.2568
      ================================================= */

      prisma.transaction.findMany({
        where: {
          type:
            "OPENING_BALANCE",

          documentNo:
            "ยอดยกเข้าระบบ",

          date: {
            gte:
              fiscalRange.startDate,

            lt:
              openingDayEnd,
          },
        },

        select: {
          id: true,
          materialId: true,
          receiveQty: true,
          balance: true,
        },

        orderBy: {
          id: "desc",
        },
      }),

      /* =================================================
         2. LAST OLD TRANSACTION

         fallback ถ้ารายการนั้นไม่มี
         OPENING_BALANCE วันที่ 1 ต.ค.

         ใช้ยอด balance ล่าสุด
         ก่อนเริ่ม FY
      ================================================= */

      prisma.transaction.findMany({
        where: {
          date: {
            lt:
              fiscalRange.startDate,
          },
        },

        select: {
          id: true,
          materialId: true,
          balance: true,
        },

        orderBy: [
          {
            date: "desc",
          },
          {
            id: "desc",
          },
        ],
      }),

      /* =================================================
         3. HISTORICAL RECEIVE

         fallback ชั้นสุดท้าย
         สำหรับข้อมูลเก่าที่ไม่มี Transaction
      ================================================= */

      prisma.receiveItem.findMany({
        where: {
          receive: {
            receiveDate: {
              lt:
                fiscalRange.startDate,
            },

            documentNo: {
              not:
                "ยอดยกเข้าระบบ",
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
        },
      }),

      /* =================================================
         4. HISTORICAL ISSUE
      ================================================= */

      prisma.issueItem.findMany({
        where: {
          issue: {
            status:
              "APPROVED",

            issueDate: {
              lt:
                fiscalRange.startDate,
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
          issuedQty: true,
        },
      }),

      /* =================================================
         5. RECEIVE IN SELECTED FY

         สำคัญ:
         นับ "รับจริง" เท่านั้น

         ไม่รวมยอดยกเข้าระบบ

         FY2569:
         01 ต.ค.68 - 30 ก.ย.69
      ================================================= */

      prisma.receiveItem.findMany({
        where: {
          receive: {
            receiveDate: {
              gte:
                fiscalRange.startDate,

              lt:
                fiscalRange.endDate,
            },

            documentNo: {
              not:
                "ยอดยกเข้าระบบ",
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
        },
      }),

      /* =================================================
         6. ISSUE IN SELECTED FY

         เฉพาะ APPROVED
      ================================================= */

      prisma.issueItem.findMany({
        where: {
          issue: {
            status:
              "APPROVED",

            issueDate: {
              gte:
                fiscalRange.startDate,

              lt:
                fiscalRange.endDate,
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
          issuedQty: true,
        },
      }),

      /* =================================================
         7. RECEIVE FROM FY START -> CURRENT

         ใช้หาคงเหลือปัจจุบัน

         ไม่รวมยอดยก
      ================================================= */

      prisma.receiveItem.findMany({
        where: {
          receive: {
            receiveDate: {
              gte:
                fiscalRange.startDate,

              lt:
                currentEndExclusive,
            },

            documentNo: {
              not:
                "ยอดยกเข้าระบบ",
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
        },
      }),

      /* =================================================
         8. ISSUE FROM FY START -> CURRENT
      ================================================= */

      prisma.issueItem.findMany({
        where: {
          issue: {
            status:
              "APPROVED",

            issueDate: {
              gte:
                fiscalRange.startDate,

              lt:
                currentEndExclusive,
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
          issuedQty: true,
        },
      }),

      /* =================================================
         OFFICER
      ================================================= */

      prisma.officer.findMany({
        select: {
          id: true,

          firstName: true,
          lastName: true,
          position: true,

          type: true,

          departmentId: true,
          sectionId: true,

          department: {
            select: {
              id: true,
              name: true,
            },
          },

          section: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          id: "asc",
        },
      }),
    ]);

  /* =======================================================
     EXACT OPENING MAP

     ตัวอย่าง:
     กระดาษ A4
     =
     150
  ======================================================= */

  const exactOpeningMap =
    new Map<number, number>();

  for (
    const transaction of
      openingTransactions
  ) {
    /*
     * orderBy id desc
     *
     * ดังนั้น record แรกของ material
     * คือ record ล่าสุด
     */
    if (
      exactOpeningMap.has(
        transaction.materialId
      )
    ) {
      continue;
    }

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
     LAST TRANSACTION BEFORE FY MAP
  ======================================================= */

  const previousBalanceMap =
    new Map<number, number>();

  for (
    const transaction of
      transactionsBeforeFiscalYear
  ) {
    if (
      previousBalanceMap.has(
        transaction.materialId
      )
    ) {
      continue;
    }

    previousBalanceMap.set(
      transaction.materialId,
      safeNumber(
        transaction.balance
      )
    );
  }

  /* =======================================================
     HISTORICAL FALLBACK MAP

     รับก่อน FY - จ่ายก่อน FY
  ======================================================= */

  const historicalFallbackMap =
    new Map<number, number>();

  for (
    const item of
      receiveBeforeFiscalYear
  ) {
    addMapValue(
      historicalFallbackMap,
      item.materialId,
      safeNumber(
        item.qty
      )
    );
  }

  for (
    const item of
      issueBeforeFiscalYear
  ) {
    addMapValue(
      historicalFallbackMap,
      item.materialId,
      -getActualIssuedQty(
        item
      )
    );
  }

  /* =======================================================
     FISCAL RECEIVE MAP

     รับจริง FY เท่านั้น
  ======================================================= */

  const fiscalReceiveMap =
    new Map<number, number>();

  for (
    const item of
      fiscalReceiveItems
  ) {
    addMapValue(
      fiscalReceiveMap,
      item.materialId,
      safeNumber(
        item.qty
      )
    );
  }

  /* =======================================================
     FISCAL ISSUE MAP
  ======================================================= */

  const fiscalIssueMap =
    new Map<number, number>();

  for (
    const item of
      fiscalIssueItems
  ) {
    addMapValue(
      fiscalIssueMap,
      item.materialId,
      getActualIssuedQty(
        item
      )
    );
  }

  /* =======================================================
     CURRENT RECEIVE FROM SELECTED FY START
  ======================================================= */

  const currentReceiveMap =
    new Map<number, number>();

  for (
    const item of
      currentReceiveItems
  ) {
    addMapValue(
      currentReceiveMap,
      item.materialId,
      safeNumber(
        item.qty
      )
    );
  }

  /* =======================================================
     CURRENT ISSUE FROM SELECTED FY START
  ======================================================= */

  const currentIssueMap =
    new Map<number, number>();

  for (
    const item of
      currentIssueItems
  ) {
    addMapValue(
      currentIssueMap,
      item.materialId,
      getActualIssuedQty(
        item
      )
    );
  }

  /* =======================================================
     FINAL ROWS
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          /* =============================================
             OPENING

             ลำดับข้อมูล:
             1. ยอดยกเข้าระบบ 1 ต.ค.
             2. balance ล่าสุดก่อน FY
             3. historical Receive - Issue
          ============================================= */

          let openingBalance =
            0;

          if (
            exactOpeningMap.has(
              material.id
            )
          ) {
            openingBalance =
              exactOpeningMap.get(
                material.id
              ) ?? 0;
          } else if (
            previousBalanceMap.has(
              material.id
            )
          ) {
            openingBalance =
              previousBalanceMap.get(
                material.id
              ) ?? 0;
          } else {
            openingBalance =
              historicalFallbackMap.get(
                material.id
              ) ?? 0;
          }

          /* =============================================
             RECEIVE

             รับจริงเฉพาะ FY
             ไม่บวก opening
          ============================================= */

          const receiveQty =
            fiscalReceiveMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             ISSUE
          ============================================= */

          const issueQty =
            fiscalIssueMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             CURRENT BALANCE

             สำคัญ:

             เริ่มจากยอดยกจริง
             +
             รับจริงตั้งแต่ FY start ถึงปัจจุบัน
             -
             จ่ายจริงตั้งแต่ FY start ถึงปัจจุบัน

             ตัวอย่าง A4:
             150 + 435 - 310
             =
             275

             แต่ช่อง "รับ FY2569"
             ยังคงเป็น 185 เท่านั้น
          ============================================= */

          const currentReceive =
            currentReceiveMap.get(
              material.id
            ) ?? 0;

          const currentIssue =
            currentIssueMap.get(
              material.id
            ) ?? 0;

          const closingBalance =
            openingBalance +
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
            href={backHref}
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      <InspectionForm
        fiscalYear={fiscalYear}
        startShortYear={startShortYear}
        endShortYear={endShortYear}
        materials={rows}
        officers={officers}
      />
    </AppPage>
  );
}