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

  openingBalance: number;

  receiveQty: number;
  issueQty: number;

  closingBalance: number;
};

/* =========================================================
   CONSTANT
========================================================= */

const BASE_FISCAL_YEAR = 2569;
const MAX_FISCAL_YEAR = 3000;

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
    year: Number(
      parts.find(
        (part) =>
          part.type === "year"
      )?.value
    ),

    month: Number(
      parts.find(
        (part) =>
          part.type === "month"
      )?.value
    ),

    day: Number(
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
   CURRENT DATE END EXCLUSIVE

   วันนี้ในประเทศไทย
   ->
   วันพรุ่งนี้ 00:00 UTC แบบ date-only

   ใช้เพื่อไม่ดึงรายการลงวันที่ในอนาคต
   เข้ามาเป็น "คงเหลือปัจจุบัน"
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

   FY 2569
   =
   1 ต.ค. 2568 00:00
   ถึงก่อน
   1 ต.ค. 2569 00:00
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
   SHORT BUDDHIST YEAR
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

   ใช้กฎเดียวกับ Stock Card

   issuedQty มีค่า
   -> ใช้จำนวนจ่ายจริง

   issuedQty = 0
   -> ถือเป็น 0 จริง

   fallback qty
   -> เฉพาะ null / undefined
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
        categoryOrder.indexOf(
          a.category
        );

      const indexB =
        categoryOrder.indexOf(
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
        return (
          orderA - orderB
        );
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

  const selectedRange =
    getFiscalYearRange(
      fiscalYear
    );

  /*
   * คงเหลือปัจจุบัน
   * นับถึงวันนี้จริงเท่านั้น
   */
  const currentEndExclusive =
    getCurrentThailandEndExclusive();

  /*
   * Query ต้องครอบคลุม
   * - สิ้นปีงบประมาณที่กำลังตรวจ
   * - หรือวันนี้
   * แล้วแต่ว่าอันไหนไกลกว่า
   */
  const queryEndDate =
    selectedRange.endDate.getTime() >
    currentEndExclusive.getTime()
      ? selectedRange.endDate
      : currentEndExclusive;

  /* =======================================================
     YEAR LABEL
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
            id: true,
            code: true,
            name: true,
            unit: true,
            category: true,
          },

          orderBy: {
            code: "asc",
          },
        }
      ),

      /* =================================================
         RECEIVE

         รับจริงเท่านั้น
      ================================================= */

      prisma.receiveItem.findMany(
        {
          where: {
            receive: {
              receiveDate: {
                lt: queryEndDate,
              },
            },
          },

          select: {
            materialId: true,
            qty: true,

            receive: {
              select: {
                receiveDate: true,
              },
            },
          },
        }
      ),

      /* =================================================
         ISSUE

         เฉพาะ APPROVED
      ================================================= */

      prisma.issueItem.findMany(
        {
          where: {
            issue: {
              status:
                "APPROVED",

              issueDate: {
                lt: queryEndDate,
              },
            },
          },

          select: {
            materialId: true,

            qty: true,
            issuedQty: true,

            issue: {
              select: {
                issueDate: true,
              },
            },
          },
        }
      ),

      /* =================================================
         OFFICER
      ================================================= */

      prisma.officer.findMany(
        {
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
        }
      ),
    ]);

  /* =======================================================
     MAP
  ======================================================= */

  /*
   * ยอดยกเข้าระบบ ณ 1 ต.ค.
   *
   * =
   * รับทั้งหมดก่อน 1 ต.ค.
   * -
   * จ่ายจริง APPROVED ก่อน 1 ต.ค.
   */
  const openingBalanceMap =
    new Map<
      number,
      number
    >();

  /*
   * รับอย่างเดียว
   * ใน FY ที่กำลังตรวจ
   */
  const fiscalReceiveMap =
    new Map<
      number,
      number
    >();

  /*
   * จ่ายจริงอย่างเดียว
   * ใน FY ที่กำลังตรวจ
   */
  const fiscalIssueMap =
    new Map<
      number,
      number
    >();

  /*
   * รับจริงทั้งหมด
   * จนถึงวันนี้
   */
  const currentReceiveMap =
    new Map<
      number,
      number
    >();

  /*
   * จ่ายจริงทั้งหมด
   * จนถึงวันนี้
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
    const item of receiveItems
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
       ยอดยกเข้าระบบ

       ก่อน 1 ต.ค. ของ FY ที่เลือก
    =============================================== */

    if (
      receiveTime <
      selectedRange.startDate.getTime()
    ) {
      addMapValue(
        openingBalanceMap,
        item.materialId,
        qty
      );
    }

    /* ===============================================
       รับในปีงบประมาณ

       FY2569:
       1 ต.ค.68 - 30 ก.ย.69
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
       รับถึงปัจจุบัน
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
     ISSUE
  ======================================================= */

  for (
    const item of
      approvedIssueItems
  ) {
    const issueTime =
      new Date(
        item.issue.issueDate
      ).getTime();

    const issuedQty =
      getActualIssuedQty(
        item
      );

    /* ===============================================
       หักออกจากยอดยก
    =============================================== */

    if (
      issueTime <
      selectedRange.startDate.getTime()
    ) {
      addMapValue(
        openingBalanceMap,
        item.materialId,
        -issuedQty
      );
    }

    /* ===============================================
       จ่ายในปีงบประมาณ
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
        issuedQty
      );
    }

    /* ===============================================
       จ่ายถึงปัจจุบัน
    =============================================== */

    if (
      issueTime <
      currentEndExclusive.getTime()
    ) {
      addMapValue(
        currentIssueMap,
        item.materialId,
        issuedQty
      );
    }
  }

  /* =======================================================
     ROWS
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
            ) ?? 0;

          const receiveQty =
            fiscalReceiveMap.get(
              material.id
            ) ?? 0;

          const issueQty =
            fiscalIssueMap.get(
              material.id
            ) ?? 0;

          const currentReceive =
            currentReceiveMap.get(
              material.id
            ) ?? 0;

          const currentIssue =
            currentIssueMap.get(
              material.id
            ) ?? 0;

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

            /*
             * ยอดเดียวกับ
             * virtual "ยอดยกเข้าระบบ"
             * วันที่ 1 ต.ค.
             */
            openingBalance,

            /*
             * รับอย่างเดียว
             * ในปีที่เลือก
             */
            receiveQty,

            /*
             * จ่ายจริง APPROVED
             * ในปีที่เลือก
             */
            issueQty,

            /*
             * คงเหลือจริงถึงวันนี้
             */
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