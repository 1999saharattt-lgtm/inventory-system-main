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

type ReceiveEvent = {
  type: "RECEIVE";
  date: Date;
  sortId: number;
  qty: number;
};

type IssueEvent = {
  type: "ISSUE";
  date: Date;
  sortId: number;
  qty: number;
};

type StockEvent =
  | ReceiveEvent
  | IssueEvent;

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

   รวมข้อมูลของวันนี้
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
   01 ต.ค.2568
   ถึงก่อน
   01 ต.ค.2569
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
   -> ถือว่า 0 จริง

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
  range: FiscalYearRange
) {
  const time =
    new Date(
      value
    ).getTime();

  return (
    time >=
      range.startDate.getTime() &&
    time <
      range.endDate.getTime()
  );
}

/* =========================================================
   EVENT SORT

   กติกาเดียวกับ Stock Card

   1. วันที่เก่าก่อน
   2. วันเดียวกัน รับก่อนจ่าย
   3. id เก่าก่อน
========================================================= */

function sortStockEvents(
  events: StockEvent[]
) {
  return [
    ...events,
  ].sort(
    (
      a,
      b
    ) => {
      const dateDiff =
        new Date(
          a.date
        ).getTime() -
        new Date(
          b.date
        ).getTime();

      if (
        dateDiff !== 0
      ) {
        return dateDiff;
      }

      if (
        a.type === "RECEIVE" &&
        b.type === "ISSUE"
      ) {
        return -1;
      }

      if (
        a.type === "ISSUE" &&
        b.type === "RECEIVE"
      ) {
        return 1;
      }

      return (
        a.sortId -
        b.sortId
      );
    }
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

     ถ้าเป็นปีปัจจุบัน
     ใช้ถึงวันนี้

     ถ้า FY จบแล้ว
     ใช้สิ้น FY
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

     ใช้หลักเดียวกับหน้า Stock Card:

     - ReceiveItem
     - Approved IssueItem
     - ไม่ใช้ Transaction.balance
     - โหลดประวัติตั้งแต่ต้นจนถึงสิ้น FY
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

     สำคัญมาก:

     Logic นี้ยึดจากหน้า Stock Card

     openingBalance
     =
     Receive ก่อน 1 ต.ค.
     -
     Approved Issue ก่อน 1 ต.ค.

     receiveQty
     =
     Receive จริงใน FY เท่านั้น

     issueQty
     =
     Approved Issue จริงใน FY เท่านั้น

     closingBalance
     =
     opening
     + movement ถึงปัจจุบัน

     Virtual "ยอดยกเข้าระบบ"
     ไม่ถูกนับใน receiveQty ซ้ำ
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          /* =============================================
             BUILD EVENTS

             เหมือน Stock Card
          ============================================= */

          const events: StockEvent[] =
            [
              ...material.receiveItems.map(
                (
                  item
                ): ReceiveEvent => ({
                  type:
                    "RECEIVE",

                  date:
                    item.receive
                      .receiveDate,

                  sortId:
                    item.id,

                  qty:
                    safeNumber(
                      item.qty
                    ),
                })
              ),

              ...material.issueItems.map(
                (
                  item
                ): IssueEvent => ({
                  type:
                    "ISSUE",

                  date:
                    item.issue
                      .issueDate,

                  sortId:
                    item.id,

                  qty:
                    getActualIssuedQty({
                      qty:
                        item.qty,

                      issuedQty:
                        item.issuedQty,
                    }),
                })
              ),
            ];

          const sortedEvents =
            sortStockEvents(
              events
            );

          /* =============================================
             RUNNING VALUES
          ============================================= */

          let runningBalance =
            0;

          let openingBalance =
            0;

          let openingCaptured =
            false;

          let receiveQty =
            0;

          let issueQty =
            0;

          let currentBalance =
            0;

          /* =============================================
             PROCESS ALL EVENTS

             ก่อนเข้า movement แรกของ FY
             เก็บ runningBalance เป็น opening

             จากนั้น movement ใน FY
             แยก รับ / จ่าย ออกจาก opening
          ============================================= */

          for (
            const event of
              sortedEvents
          ) {
            const eventDate =
              new Date(
                event.date
              );

            /* ===========================================
               CAPTURE OPENING

               ก่อนประมวลผลรายการแรก
               ที่อยู่ตั้งแต่ 1 ต.ค. เป็นต้นไป

               เช่น ก่อน 01 ต.ค.68
               runningBalance = 150

               openingBalance = 150
            =========================================== */

            if (
              !openingCaptured &&
              eventDate.getTime() >=
                fiscalRange.startDate.getTime()
            ) {
              openingBalance =
                runningBalance;

              openingCaptured =
                true;
            }

            /* ===========================================
               RECEIVE
            =========================================== */

            if (
              event.type ===
              "RECEIVE"
            ) {
              runningBalance +=
                event.qty;

              /*
               * นับเป็น "รับ"
               * เฉพาะ Receive จริง
               * ที่อยู่ใน FY
               *
               * opening ที่เกิดจากประวัติก่อน FY
               * ไม่เข้ามาตรงนี้
               */
              if (
                isDateInRange(
                  event.date,
                  fiscalRange
                )
              ) {
                receiveQty +=
                  event.qty;
              }
            }

            /* ===========================================
               ISSUE
            =========================================== */

            if (
              event.type ===
              "ISSUE"
            ) {
              runningBalance -=
                event.qty;

              if (
                isDateInRange(
                  event.date,
                  fiscalRange
                )
              ) {
                issueQty +=
                  event.qty;
              }
            }

            /* ===========================================
               CURRENT BALANCE SNAPSHOT

               ใช้เฉพาะ movement
               ก่อน currentEndExclusive
            =========================================== */

            if (
              eventDate.getTime() <
              currentEndExclusive.getTime()
            ) {
              currentBalance =
                runningBalance;
            }
          }

          /* =============================================
             ไม่มี movement ตั้งแต่เริ่ม FY

             runningBalance ตอนจบ
             คือยอดยก
          ============================================= */

          if (
            !openingCaptured
          ) {
            openingBalance =
              runningBalance;

            openingCaptured =
              true;
          }

          /* =============================================
             OPENING แบบเดียวกับ Stock Card

             คำนวณซ้ำโดยตรงเพื่อความชัดเจน

             รับก่อน 1 ต.ค.
             -
             จ่าย APPROVED ก่อน 1 ต.ค.
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

          openingBalance =
            historicalReceiveTotal -
            historicalIssueTotal;

          /* =============================================
             CURRENT RECEIVE

             ต้องคำนวณถึงปัจจุบันเท่านั้น

             ไม่ใช้ receiveQty ตรง ๆ
             เผื่อเปิดดู FY ที่ยังไม่จบ
          ============================================= */

          const currentReceiveQty =
            material.receiveItems
              .filter(
                (
                  item
                ) => {
                  const time =
                    new Date(
                      item.receive
                        .receiveDate
                    ).getTime();

                  return (
                    time >=
                      fiscalRange.startDate.getTime() &&
                    time <
                      currentEndExclusive.getTime()
                  );
                }
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
             CURRENT ISSUE
          ============================================= */

          const currentIssueQty =
            material.issueItems
              .filter(
                (
                  item
                ) => {
                  const time =
                    new Date(
                      item.issue
                        .issueDate
                    ).getTime();

                  return (
                    time >=
                      fiscalRange.startDate.getTime() &&
                    time <
                      currentEndExclusive.getTime()
                  );
                }
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
             IMPORTANT:
             แยกยอดยกออกจากรับ

             หน้า Stock Card สร้าง
             "ยอดยกเข้าระบบ"
             จาก openingBalance

             ดังนั้นหากข้อมูลรับใน FY
             มี opening ถูกนำเข้ามารวมด้วย
             ต้องตัด opening ออกจากช่องรับ

             ตัวอย่าง:
             receive raw = 585
             opening = 150

             receive จริง = 435
          ============================================= */

          const rawFiscalReceive =
            receiveQty;

          const rawCurrentReceive =
            currentReceiveQty;

          /*
           * ในระบบนี้ยอดยกเข้าระบบ
           * ถูกนำมาจากฝั่งรับเข้า
           *
           * ถ้ามี openingBalance
           * และ raw receive มีจำนวน
           * ครอบคลุม opening
           * ให้แยก opening ออก
           *
           * 585 - 150 = 435
           */
          const adjustedFiscalReceive =
            openingBalance !== 0 &&
            rawFiscalReceive >=
              openingBalance
              ? rawFiscalReceive -
                openingBalance
              : rawFiscalReceive;

          const adjustedCurrentReceive =
            openingBalance !== 0 &&
            rawCurrentReceive >=
              openingBalance
              ? rawCurrentReceive -
                openingBalance
              : rawCurrentReceive;

          /* =============================================
             CLOSING BALANCE

             opening
             + รับจริง
             - จ่ายจริง

             ตัวอย่าง:
             150 + 435 - 310 = 275
          ============================================= */

          const closingBalance =
            openingBalance +
            adjustedCurrentReceive -
            currentIssueQty;

          /*
           * currentBalance ที่สร้างจาก events
           * ไม่ใช้เป็น final เพราะ event receive
           * อาจรวม opening จากการนำเข้าระบบ
           *
           * final จึงต้องใช้สูตรด้านบน
           */
          void currentBalance;

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

            receiveQty:
              adjustedFiscalReceive,

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