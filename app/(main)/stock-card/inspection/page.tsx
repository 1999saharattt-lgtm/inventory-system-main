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
   * ยอดยกมา ณ 30 ก.ย. ของปีก่อน
   *
   * ใช้ logic เดียวกับ Stock Card:
   *
   * รับทั้งหมดก่อน 1 ต.ค.
   * -
   * จ่าย APPROVED ทั้งหมดก่อน 1 ต.ค.
   *
   * ตัวอย่าง FY2569:
   * ยอด ณ สิ้นวันที่ 30 ก.ย.2568
   *
   * Stock Card นำยอดนี้ไปสร้าง
   * virtual row วันที่ 01 ต.ค.2568
   * ชื่อ "ยอดยกเข้าระบบ"
   *
   * ไม่มีการอ่าน Transaction OPENING_BALANCE
   */
  openingBalance: number;

  /*
   * รับจริงใน FY ที่เลือก
   *
   * เช่น FY2569:
   * 01 ต.ค.2568 - 30 ก.ย.2569
   *
   * ไม่รวม opening ซ้ำ
   */
  receiveQty: number;

  /*
   * จ่ายจริงใน FY ที่เลือก
   *
   * เฉพาะ Issue ที่ APPROVED
   */
  issueQty: number;

  /*
   * คงเหลือปัจจุบัน
   *
   * opening
   * + รับตั้งแต่ต้น FY ถึงปัจจุบัน
   * - จ่าย APPROVED ตั้งแต่ต้น FY ถึงปัจจุบัน
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

   ใช้กติกาเดียวกับ Stock Card

   ถ้า issuedQty !== null / undefined
   ให้ใช้ issuedQty

   issuedQty = 0
   ถือว่าเป็น 0 จริง

   fallback ไป qty
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

  /*
   * ปัจจุบันแบบ end-exclusive
   *
   * ใช้สำหรับคำนวณ
   * "คงเหลือปัจจุบัน"
   *
   * แต่ต้องไม่เลยสิ้น FY ที่เลือก
   */
  const todayEndExclusive =
    getCurrentThailandEndExclusive();

  const currentEndExclusive =
    todayEndExclusive.getTime() <
    fiscalRange.endDate.getTime()
      ? todayEndExclusive
      : fiscalRange.endDate;

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

     สำคัญ:
     ใช้ข้อมูลต้นทางเดียวกับ Stock Card

     1. Materials

     2. Receive ก่อนเริ่ม FY
        ใช้หา opening

     3. Approved Issue ก่อนเริ่ม FY
        ใช้หา opening

     4. Receive ใน FY
        ใช้ช่อง "รับ"

     5. Approved Issue ใน FY
        ใช้ช่อง "จ่าย"

     6. Receive ตั้งแต่เริ่ม FY ถึงปัจจุบัน
        ใช้หา closing

     7. Approved Issue ตั้งแต่เริ่ม FY ถึงปัจจุบัน
        ใช้หา closing

     8. Officers
  ======================================================= */

  const [
    materials,

    historicalReceiveItems,
    historicalIssueItems,

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
         1. RECEIVE BEFORE FY

         Logic เดียวกับ Stock Card

         ตัวอย่าง FY2569:
         รับทั้งหมดก่อน 01 ต.ค.2568
      ================================================= */

      prisma.receiveItem.findMany({
        where: {
          receive: {
            receiveDate: {
              lt:
                fiscalRange.startDate,
            },
          },
        },

        select: {
          materialId: true,
          qty: true,
        },
      }),

      /* =================================================
         2. APPROVED ISSUE BEFORE FY

         ตัวอย่าง FY2569:
         จ่าย APPROVED ทั้งหมดก่อน 01 ต.ค.2568
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
         3. RECEIVE IN SELECTED FY

         รับจริงในปีงบประมาณ

         ไม่ต้องตัด "ยอดยกเข้าระบบ"
         ด้วย documentNo อีกแล้ว

         เพราะ Stock Card opening เป็น virtual row
         ไม่ใช่ ReceiveItem จริง
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
          },
        },

        select: {
          materialId: true,
          qty: true,
        },
      }),

      /* =================================================
         4. APPROVED ISSUE IN SELECTED FY
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
         5. RECEIVE FROM FY START -> CURRENT

         ใช้คำนวณคงเหลือปัจจุบัน
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
          },
        },

        select: {
          materialId: true,
          qty: true,
        },
      }),

      /* =================================================
         6. APPROVED ISSUE FROM FY START -> CURRENT

         ใช้คำนวณคงเหลือปัจจุบัน
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
     OPENING RECEIVE MAP

     รับทั้งหมดก่อนวันเริ่ม FY
  ======================================================= */

  const historicalReceiveMap =
    new Map<number, number>();

  for (
    const item of
      historicalReceiveItems
  ) {
    addMapValue(
      historicalReceiveMap,
      item.materialId,
      safeNumber(
        item.qty
      )
    );
  }

  /* =======================================================
     OPENING ISSUE MAP

     จ่าย APPROVED ทั้งหมดก่อนวันเริ่ม FY

     ใช้ issuedQty ก่อน
     fallback qty เฉพาะ null / undefined
  ======================================================= */

  const historicalIssueMap =
    new Map<number, number>();

  for (
    const item of
      historicalIssueItems
  ) {
    addMapValue(
      historicalIssueMap,
      item.materialId,
      getActualIssuedQty(
        item
      )
    );
  }

  /* =======================================================
     FISCAL RECEIVE MAP
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

             สูตรเดียวกับ Stock Card:

             RECEIVE ก่อน 1 ต.ค.
             -
             APPROVED ISSUE ก่อน 1 ต.ค.

             เช่น FY2569:
             ยอด ณ 30 ก.ย.2568

             Stock Card นำค่านี้ไปแสดงเป็น
             "ยอดยกเข้าระบบ"
             วันที่ 01 ต.ค.2568
          ============================================= */

          const historicalReceive =
            historicalReceiveMap.get(
              material.id
            ) ?? 0;

          const historicalIssue =
            historicalIssueMap.get(
              material.id
            ) ?? 0;

          const openingBalance =
            historicalReceive -
            historicalIssue;

          /* =============================================
             RECEIVE

             รับจริงเฉพาะใน FY
             ไม่รวม opening ซ้ำ
          ============================================= */

          const receiveQty =
            fiscalReceiveMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             ISSUE

             จ่ายจริงเฉพาะใน FY
             และเฉพาะ APPROVED
          ============================================= */

          const issueQty =
            fiscalIssueMap.get(
              material.id
            ) ?? 0;

          /* =============================================
             CURRENT MOVEMENT

             ตั้งแต่ต้น FY
             ถึงวันที่ปัจจุบัน
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

             opening
             + receive จริง
             - issue จริง

             opening ไม่ถูกนับซ้ำ
             เพราะ opening มาจากประวัติก่อน FY
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