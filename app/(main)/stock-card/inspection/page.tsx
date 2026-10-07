import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "./InspectionForm";

/* =========================================================
   FORCE FRESH DATA

   หน้านี้เป็น READ ONLY
   ไม่สร้าง / ไม่แก้ Transaction
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

const categoryOrder = [
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
    parts.month >=
    10
      ? parts.year + 1
      : parts.year;

  return (
    fiscalYearGregorian +
    543
  );
}

/* =========================================================
   FISCAL YEAR RANGE

   FY 2569
   =
   1 ต.ค. 2568
   ถึงก่อน
   1 ต.ค. 2569
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
   SHORT BUDDHIST YEAR
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

   ต้องเหมือน Stock Card

   issuedQty = 0
   ถือว่าเป็น 0 จริง

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
   MATERIAL SORT
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
        categoryOrder.indexOf(
          a.category
        );

      const categoryB =
        categoryOrder.indexOf(
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
     SELECTED FY
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

  /* =======================================================
     CURRENT FY

     ใช้สำหรับคำนวณ
     "คงเหลือปัจจุบัน"

     ไม่ว่ากำลังเปิด FY2569 หรือปีเก่า
     ยกไปต้องเป็นยอด Stock Card ปัจจุบัน
  ======================================================= */

  const currentRange =
    getFiscalYearRange(
      currentFiscalYear
    );

  /* =======================================================
     QUERY END DATE

     ต้องครอบคลุมทั้ง:
     - ปีที่เลือก
     - ปีปัจจุบัน
  ======================================================= */

  const queryEndDate =
    selectedRange.endDate.getTime() >
    currentRange.endDate.getTime()
      ? selectedRange.endDate
      : currentRange.endDate;

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
    officers,
  ] =
    await Promise.all([
      /* =================================================
         MATERIAL
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
         RECEIVE

         โหลดครั้งเดียวตั้งแต่อดีต
         จนถึงสิ้น FY ที่จำเป็น

         แล้วค่อยแยก:
         - ยอดยก
         - รับใน FY
         - current balance
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

         ใช้เฉพาะรายการที่อนุมัติแล้ว
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
     MAPS
  ======================================================= */

  /*
   * ยอดยกมาระบบ
   *
   * =
   * รับทั้งหมดก่อน 1 ต.ค.
   * -
   * จ่ายจริง APPROVED ทั้งหมดก่อน 1 ต.ค.
   */
  const openingBalanceMap =
    new Map<
      number,
      number
    >();

  /*
   * รับทั้งหมดภายใน FY ที่เลือก
   */
  const fiscalReceiveMap =
    new Map<
      number,
      number
    >();

  /*
   * จ่ายจริง APPROVED
   * ภายใน FY ที่เลือก
   */
  const fiscalIssueMap =
    new Map<
      number,
      number
    >();

  /*
   * รับทั้งหมดจนถึง Stock Card ปัจจุบัน
   */
  const currentReceiveMap =
    new Map<
      number,
      number
    >();

  /*
   * จ่ายจริง APPROVED ทั้งหมด
   * จนถึง Stock Card ปัจจุบัน
   */
  const currentIssueMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     RECEIVE
  ======================================================= */

  for (
    const item of
      receiveItems
  ) {
    const receiveDate =
      new Date(
        item.receive
          .receiveDate
      );

    const qty =
      safeNumber(
        item.qty
      );

    const receiveTime =
      receiveDate.getTime();

    /* ===============================================
       OPENING BALANCE

       รับก่อน 1 ต.ค. ของ FY ที่เลือก
    =============================================== */

    if (
      receiveTime <
      selectedRange
        .startDate
        .getTime()
    ) {
      addMapValue(
        openingBalanceMap,
        item.materialId,
        qty
      );
    }

    /* ===============================================
       RECEIVE DURING SELECTED FY

       FY2569:
       01 ต.ค. 68 - 30 ก.ย. 69
    =============================================== */

    if (
      receiveTime >=
        selectedRange
          .startDate
          .getTime() &&
      receiveTime <
        selectedRange
          .endDate
          .getTime()
    ) {
      addMapValue(
        fiscalReceiveMap,
        item.materialId,
        qty
      );
    }

    /* ===============================================
       CURRENT STOCK CARD

       ใช้ช่วงเดียวกับ Stock Card ปีปัจจุบัน
    =============================================== */

    if (
      receiveTime <
      currentRange
        .endDate
        .getTime()
    ) {
      addMapValue(
        currentReceiveMap,
        item.materialId,
        qty
      );
    }
  }

  /* =======================================================
     ISSUE
  ======================================================= */

  for (
    const item of
      approvedIssueItems
  ) {
    const issueDate =
      new Date(
        item.issue
          .issueDate
      );

    const issueTime =
      issueDate.getTime();

    const actualIssuedQty =
      getActualIssuedQty(
        {
          qty:
            item.qty,

          issuedQty:
            item.issuedQty,
        }
      );

    /* ===============================================
       OPENING BALANCE

       หักจ่ายก่อน 1 ต.ค.
    =============================================== */

    if (
      issueTime <
      selectedRange
        .startDate
        .getTime()
    ) {
      addMapValue(
        openingBalanceMap,
        item.materialId,
        -actualIssuedQty
      );
    }

    /* ===============================================
       ISSUE DURING SELECTED FY
    =============================================== */

    if (
      issueTime >=
        selectedRange
          .startDate
          .getTime() &&
      issueTime <
        selectedRange
          .endDate
          .getTime()
    ) {
      addMapValue(
        fiscalIssueMap,
        item.materialId,
        actualIssuedQty
      );
    }

    /* ===============================================
       CURRENT STOCK CARD
    =============================================== */

    if (
      issueTime <
      currentRange
        .endDate
        .getTime()
    ) {
      addMapValue(
        currentIssueMap,
        item.materialId,
        actualIssuedQty
      );
    }
  }

  /* =======================================================
     MATERIAL ROWS

     openingBalance
     =
     ยอดยกมาระบบ

     receiveQty
     =
     รับรวม FY

     issueQty
     =
     จ่ายรวม FY

     closingBalance
     =
     คงเหลือปัจจุบันของ Stock Card
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          const openingBalance =
            openingBalanceMap.get(
              material.id
            ) ??
            0;

          const receiveQty =
            fiscalReceiveMap.get(
              material.id
            ) ??
            0;

          const issueQty =
            fiscalIssueMap.get(
              material.id
            ) ??
            0;

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

          /*
           * สำคัญ:
           *
           * ไม่ใช้
           * opening + receive - issue
           *
           * เพราะผู้ใช้ต้องการ
           * "คงเหลือปัจจุบัน"
           *
           * แม้เปิด FY2569
           * ก็ต้องเห็นยอด Stock Card ปัจจุบัน
           */
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