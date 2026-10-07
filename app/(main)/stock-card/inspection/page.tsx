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
   * ยอดยกเข้าระบบ วันที่ 01 ต.ค.
   *
   * FY2569
   * = ยอดยกเข้าระบบ 01 ต.ค.2568
   *
   * นำไปแสดงในช่อง
   * "คงเหลือยอดยกมาเมื่อ 30 ก.ย.68"
   *
   * ถ้าไม่มีรายการ OPENING_BALANCE
   * วันที่ 01 ต.ค.
   * ให้เป็น 0 เพื่อให้ PDF แสดง "-"
   */
  openingBalance: number;

  /*
   * รับจริงเฉพาะ FY ที่เลือก
   *
   * ไม่รวมยอดยกเข้าระบบ
   */
  receiveQty: number;

  /*
   * จ่ายจริงเฉพาะ APPROVED
   * ใน FY ที่เลือก
   */
  issueQty: number;

  /*
   * ยอดคงเหลือปัจจุบัน
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

   ถ้ามี issuedQty
   ให้ใช้ issuedQty

   แม้ issuedQty = 0
   ก็ต้องใช้ 0 จริง

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
   * วันถัดจาก 01 ต.ค.
   *
   * ใช้ค้นหา OPENING_BALANCE
   * เฉพาะวันที่ 01 ต.ค.
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
         1. OPENING BALANCE

         สำคัญ:
         ใช้เฉพาะ Transaction ที่เป็น

         type = OPENING_BALANCE
         documentNo = "ยอดยกเข้าระบบ"

         และเกิดในวันที่ 01 ต.ค.
         ของปีงบประมาณที่เลือก

         เช่น FY2569
         = 01 ต.ค.2568

         ถ้าวัสดุใดไม่มีรายการนี้
         openingBalance จะเป็น 0
         และ PDF จะแสดง "-"
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

        orderBy: [
          {
            materialId:
              "asc",
          },
          {
            id:
              "desc",
          },
        ],
      }),

      /* =================================================
         2. RECEIVE IN SELECTED FY

         รวมรายการรับจริงทั้งหมด
         ตั้งแต่ 01 ต.ค. ถึง 30 ก.ย.

         สำคัญ:
         ไม่รวม "ยอดยกเข้าระบบ"
         เพื่อไม่ให้ยอดถูกบวกซ้ำ
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
         3. ISSUE IN SELECTED FY

         รวมเฉพาะรายการจ่าย
         ที่ APPROVED
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
         4. RECEIVE FROM FY START -> CURRENT

         ใช้คำนวณยอดคงเหลือปัจจุบัน

         ไม่รวมยอดยกเข้าระบบ
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
         5. ISSUE FROM FY START -> CURRENT

         ใช้คำนวณยอดคงเหลือปัจจุบัน

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

     ใช้เฉพาะยอดยกเข้าระบบ
     วันที่ 01 ต.ค.

     ไม่มี fallback
  ======================================================= */

  const exactOpeningMap =
    new Map<number, number>();

  for (
    const transaction of
      openingTransactions
  ) {
    /*
     * transaction เรียง id desc
     *
     * หาก material เดียวกันมีมากกว่า 1 record
     * ใช้ record ล่าสุดเพียงรายการเดียว
     */
    if (
      exactOpeningMap.has(
        transaction.materialId
      )
    ) {
      continue;
    }

    /*
     * หลักการ:
     *
     * ถ้า transaction.balance มีค่า
     * ใช้ balance
     *
     * ถ้าไม่มี balance
     * จึง fallback ไป receiveQty
     *
     * fallback นี้อยู่ภายใน
     * OPENING_BALANCE record เดียวกันเท่านั้น
     *
     * ไม่ fallback ไป transaction เก่า
     * และไม่คำนวณจากรับ-จ่ายย้อนหลัง
     */
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
     FISCAL RECEIVE MAP

     รับจริงใน FY เท่านั้น

     ไม่มียอดยกเข้าระบบอยู่ในชุดข้อมูลนี้
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
     CURRENT RECEIVE MAP
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
     CURRENT ISSUE MAP
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
             OPENING BALANCE

             ใช้เฉพาะยอดยกเข้าระบบ
             วันที่ 01 ต.ค.

             ไม่มีรายการ
             = 0
             = PDF แสดง "-"
          ============================================= */

          const openingBalance =
            exactOpeningMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             RECEIVE

             รับจริงใน FY

             ไม่รวม opening
          ============================================= */

          const receiveQty =
            fiscalReceiveMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             ISSUE

             จ่ายจริงใน FY
             เฉพาะ APPROVED
          ============================================= */

          const issueQty =
            fiscalIssueMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             CURRENT MOVEMENT
          ============================================= */

          const currentReceive =
            currentReceiveMap.get(
              material.id
            ) ?? 0;

          const currentIssue =
            currentIssueMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             CURRENT BALANCE

             ยอดยกเข้าระบบ
             + รับจริง
             - จ่ายจริง

             โดยยอดยกเข้าระบบ
             ไม่ถูกนับซ้ำใน currentReceive
          ============================================= */

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