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

  return (
    fiscalYearGregorian +
    543
  );
}

/* =========================================================
   CURRENT DATE - END EXCLUSIVE

   ใช้รูปแบบเดียวกับระบบเดิม
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

   สำคัญ:
   ต้องใช้ boundary แบบเดียวกับหน้า Stock Card

   FY2569
   01 ต.ค.2568
   ถึงก่อน
   01 ต.ค.2569

   ห้ามปรับ -7 ชั่วโมงตรงนี้
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

   ใช้ logic เดียวกับ Stock Card

   issuedQty มีค่า
   -> ใช้ issuedQty

   issuedQty = 0
   -> ใช้ 0 จริง

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
   DATE CHECK
========================================================= */

function isBeforeDate(
  value: Date,
  target: Date
) {
  return (
    new Date(
      value
    ).getTime() <
    target.getTime()
  );
}

function isDateInRange(
  value: Date,
  startDate: Date,
  endDate: Date
) {
  const time =
    new Date(
      value
    ).getTime();

  return (
    time >=
      startDate.getTime() &&
    time <
      endDate.getTime()
  );
}

/* =========================================================
   SORT MATERIAL
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
        return (
          orderA -
          orderB
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

  const fiscalRange =
    getFiscalYearRange(
      fiscalYear
    );

  /* =======================================================
     CURRENT END
  ======================================================= */

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

     ใช้แหล่งข้อมูลเดียวกับ Stock Card

     RECEIVE
     = ReceiveItem

     ISSUE
     = IssueItem ที่ APPROVED

     ไม่ใช้ Transaction.balance
  ======================================================= */

  const [
    materials,
    officers,
  ] =
    await Promise.all([
      prisma.material.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          category: true,

          receiveItems: {
            where: {
              receive: {
                receiveDate: {
                  lt:
                    fiscalRange.endDate,
                },
              },
            },

            select: {
              id: true,
              qty: true,

              receive: {
                select: {
                  receiveDate:
                    true,
                },
              },
            },

            orderBy: [
              {
                receive: {
                  receiveDate:
                    "asc",
                },
              },
              {
                id:
                  "asc",
              },
            ],
          },

          issueItems: {
            where: {
              issue: {
                status:
                  "APPROVED",

                issueDate: {
                  lt:
                    fiscalRange.endDate,
                },
              },
            },

            select: {
              id: true,
              qty: true,
              issuedQty: true,

              issue: {
                select: {
                  issueDate:
                    true,
                },
              },
            },

            orderBy: [
              {
                issue: {
                  issueDate:
                    "asc",
                },
              },
              {
                id:
                  "asc",
              },
            ],
          },
        },

        orderBy: {
          code: "asc",
        },
      }),

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
     BUILD INSPECTION ROWS

     หลักการเดียวกับ Stock Card

     1. openingBalance
        =
        รับทั้งหมดก่อน 1 ต.ค.
        -
        จ่าย APPROVED ทั้งหมดก่อน 1 ต.ค.

     2. receiveQty
        =
        Receive ตั้งแต่ 1 ต.ค. ถึงสิ้น FY

     3. issueQty
        =
        Approved Issue ตั้งแต่ 1 ต.ค. ถึงสิ้น FY

     4. closingBalance
        =
        opening
        + รับถึงปัจจุบัน
        - จ่ายถึงปัจจุบัน

     สำคัญ:
     ไม่มีการลบ openingBalance
     ออกจาก receiveQty อีกครั้ง
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          /* =============================================
             1. OPENING RECEIVE

             รับทั้งหมดก่อนเริ่ม FY
          ============================================= */

          const historicalReceiveTotal =
            material.receiveItems
              .filter(
                (
                  item
                ) =>
                  isBeforeDate(
                    item.receive
                      .receiveDate,
                    fiscalRange.startDate
                  )
              )
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  safeNumber(
                    item.qty
                  ),
                0
              );

          /* =============================================
             2. OPENING ISSUE

             จ่าย APPROVED ทั้งหมดก่อนเริ่ม FY
          ============================================= */

          const historicalIssueTotal =
            material.issueItems
              .filter(
                (
                  item
                ) =>
                  isBeforeDate(
                    item.issue
                      .issueDate,
                    fiscalRange.startDate
                  )
              )
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  getActualIssuedQty({
                    qty:
                      item.qty,

                    issuedQty:
                      item.issuedQty,
                  }),
                0
              );

          /* =============================================
             3. OPENING BALANCE

             นี่คือค่าที่หน้า Stock Card
             นำไปสร้าง Virtual Row

             "ยอดยกเข้าระบบ"

             ในตัวอย่าง = 150
          ============================================= */

          const openingBalance =
            historicalReceiveTotal -
            historicalIssueTotal;

          /* =============================================
             4. RECEIVE IN FULL FISCAL YEAR

             รับจริงตั้งแต่ 1 ต.ค.
             ถึงก่อน 1 ต.ค. ปีถัดไป

             opening ไม่เข้ามาตรงนี้
             เพราะ opening มาจากข้อมูลก่อน startDate

             ตัวอย่าง = 435
          ============================================= */

          const receiveQty =
            material.receiveItems
              .filter(
                (
                  item
                ) =>
                  isDateInRange(
                    item.receive
                      .receiveDate,
                    fiscalRange.startDate,
                    fiscalRange.endDate
                  )
              )
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  safeNumber(
                    item.qty
                  ),
                0
              );

          /* =============================================
             5. ISSUE IN FULL FISCAL YEAR

             เฉพาะ APPROVED

             ตัวอย่าง = 310
          ============================================= */

          const issueQty =
            material.issueItems
              .filter(
                (
                  item
                ) =>
                  isDateInRange(
                    item.issue
                      .issueDate,
                    fiscalRange.startDate,
                    fiscalRange.endDate
                  )
              )
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  getActualIssuedQty({
                    qty:
                      item.qty,

                    issuedQty:
                      item.issuedQty,
                  }),
                0
              );

          /* =============================================
             6. RECEIVE UNTIL CURRENT DATE

             ใช้เฉพาะคำนวณคงเหลือปัจจุบัน
          ============================================= */

          const currentReceiveQty =
            material.receiveItems
              .filter(
                (
                  item
                ) =>
                  isDateInRange(
                    item.receive
                      .receiveDate,
                    fiscalRange.startDate,
                    currentEndExclusive
                  )
              )
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  safeNumber(
                    item.qty
                  ),
                0
              );

          /* =============================================
             7. ISSUE UNTIL CURRENT DATE
          ============================================= */

          const currentIssueQty =
            material.issueItems
              .filter(
                (
                  item
                ) =>
                  isDateInRange(
                    item.issue
                      .issueDate,
                    fiscalRange.startDate,
                    currentEndExclusive
                  )
              )
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  getActualIssuedQty({
                    qty:
                      item.qty,

                    issuedQty:
                      item.issuedQty,
                  }),
                0
              );

          /* =============================================
             8. CURRENT BALANCE

             150 + 435 - 310
             =
             275

             ห้ามลบ opening จาก receive ซ้ำ
          ============================================= */

          const closingBalance =
            openingBalance +
            currentReceiveQty -
            currentIssueQty;

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