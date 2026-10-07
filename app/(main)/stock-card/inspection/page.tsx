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
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(value);

  return {
    year: Number(
      parts.find(
        (part) => part.type === "year"
      )?.value
    ),

    month: Number(
      parts.find(
        (part) => part.type === "month"
      )?.value
    ),

    day: Number(
      parts.find(
        (part) => part.type === "day"
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
    getThailandDateParts(value);

  const fiscalYearGregorian =
    parts.month >= 10
      ? parts.year + 1
      : parts.year;

  return fiscalYearGregorian + 543;
}

/* =========================================================
   THAILAND LOCAL DATE -> UTC

   สำคัญ:
   ประเทศไทย = UTC+7

   1 ต.ค. 2568 เวลา 00:00 ประเทศไทย
   =
   30 ก.ย. 2025 เวลา 17:00 UTC

   ใช้ boundary นี้เพื่อไม่ให้รายการวันที่ 30 ก.ย.
   ถูกจัดเข้า FY ใหม่ผิดปี
========================================================= */

function thailandMidnightToUtc(
  year: number,
  month: number,
  day: number
) {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      -7,
      0,
      0,
      0
    )
  );
}

/* =========================================================
   CURRENT DATE - END EXCLUSIVE

   รวมข้อมูลของวันนี้ตามเวลาไทย
========================================================= */

function getCurrentThailandEndExclusive() {
  const parts =
    getThailandDateParts(new Date());

  /*
   * วันพรุ่งนี้ 00:00 ประเทศไทย
   * ใช้เป็น exclusive end
   */
  const tomorrow = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day + 1,
      -7,
      0,
      0,
      0
    )
  );

  return tomorrow;
}

/* =========================================================
   FISCAL YEAR RANGE

   FY2569

   เริ่ม
   01 ต.ค. 2568 เวลา 00:00 ประเทศไทย

   ถึงก่อน
   01 ต.ค. 2569 เวลา 00:00 ประเทศไทย
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
): FiscalYearRange {
  const fiscalYearGregorian =
    fiscalYearThai - 543;

  return {
    startDate:
      thailandMidnightToUtc(
        fiscalYearGregorian - 1,
        10,
        1
      ),

    endDate:
      thailandMidnightToUtc(
        fiscalYearGregorian,
        10,
        1
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
    Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =========================================================
   ACTUAL ISSUE QTY

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
    new Date(value).getTime() <
    target.getTime()
  );
}

function isDateInRange(
  value: Date,
  startDate: Date,
  endDate: Date
) {
  const time =
    new Date(value).getTime();

  return (
    time >= startDate.getTime() &&
    time < endDate.getTime()
  );
}

/* =========================================================
   SORT MATERIAL
========================================================= */

function sortMaterialRows(
  rows: MaterialRow[]
) {
  return [...rows].sort(
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

  /* =======================================================
     CURRENT END

     ปีปัจจุบัน
     -> ถึงวันนี้

     ปีที่จบแล้ว
     -> ถึงสิ้น FY
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
    await prisma.stockCardInspection.findUnique({
      where: {
        fiscalYear,
      },

      select: {
        id: true,
      },
    });

  if (
    existingInspection
  ) {
    redirect(
      `/stock-card/inspection-history/${fiscalYear}`
    );
  }

  /* =======================================================
     LOAD DATA

     หลักเดียวกับ Stock Card

     1. ReceiveItem = รับ
     2. IssueItem APPROVED = จ่าย
     3. ไม่ใช้ Transaction.balance
     4. โหลดตั้งแต่ประวัติแรกจนถึงสิ้น FY
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

     สำคัญที่สุด

     openingBalance
     =
     รับทั้งหมด "ก่อน" เริ่ม FY
     -
     จ่าย APPROVED ทั้งหมด "ก่อน" เริ่ม FY

     receiveQty
     =
     รับจริงตั้งแต่เริ่ม FY
     ถึง currentEndExclusive

     issueQty
     =
     จ่ายจริงตั้งแต่เริ่ม FY
     ถึง currentEndExclusive

     closingBalance
     =
     opening + receive - issue

     ไม่มีการนำ opening
     ไปลบ receive ภายหลังอีก
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          /* =============================================
             OPENING RECEIVE

             รับก่อน 1 ต.ค.
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
             OPENING ISSUE

             จ่าย APPROVED ก่อน 1 ต.ค.
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
             OPENING BALANCE

             นี่คือยอดที่ Stock Card
             แสดงเป็น

             "ยอดยกเข้าระบบ"

             ตัวอย่าง = 150
          ============================================= */

          const openingBalance =
            historicalReceiveTotal -
            historicalIssueTotal;

          /* =============================================
             RECEIVE IN FY

             นับเฉพาะรับจริง
             ตั้งแต่ 1 ต.ค. เป็นต้นไป

             ไม่เอา opening มารวม
             และไม่ต้องลบ opening ทีหลัง

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
             ISSUE IN FY

             นับเฉพาะ APPROVED

             ใช้ issuedQty จริง
             ถ้ามีค่า

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
             CURRENT BALANCE

             opening
             +
             รับจริง
             -
             จ่ายจริง

             ตัวอย่าง

             150
             +
             435
             -
             310
             =
             275
          ============================================= */

          const closingBalance =
            openingBalance +
            receiveQty -
            issueQty;

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