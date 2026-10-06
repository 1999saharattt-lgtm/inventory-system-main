import {
  prisma,
} from "@/lib/prisma";

import {
  redirect,
} from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "./InspectionForm";

/* =========================================================
   FORCE FRESH DATA

   หน้านี้อ่านข้อมูลเพื่อทำกระดาษตรวจสอบเท่านั้น
   ห้ามสร้าง / แก้ Transaction จาก GET
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

   ต.ค. - ธ.ค.
   = ปี ค.ศ. + 1 + 543

   ม.ค. - ก.ย.
   = ปี ค.ศ. + 543
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

   FY 2569
   =
   1 ต.ค. 2568
   ถึงก่อน
   1 ต.ค. 2569
========================================================= */

function getFiscalYearRange(
  fiscalYearThai: number
) {
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
    startDate,
    endDate,
  };
}

/* =========================================================
   SHORT BUDDHIST YEAR

   2568 -> 68
   2569 -> 69
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
   SAFE INTEGER
========================================================= */

function safeInteger(
  value: unknown
) {
  const number =
    Number(
      value ??
        0
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return Math.trunc(
    number
  );
}

/* =========================================================
   MATERIAL SORT

   1 OFFICE
   2 COMPUTER
   3 ELECTRIC
   4 HOUSEHOLD
   5 VEHICLE
   6 PRINTING

   แล้วเรียงรหัสภายในหมวด
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

  const {
    startDate,
    endDate,
  } =
    getFiscalYearRange(
      fiscalYear
    );

  /* =======================================================
     YEAR LABEL

     FY 2569
     start = 68
     end   = 69
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

     1 ปีงบประมาณ
     =
     1 รอบการตรวจ

     ถ้าบันทึกแล้ว
     ไม่เปิด Form ใหม่ซ้ำ
     ให้ไปดูประวัติของปีนั้น
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

     อ่านเท่านั้น
     ไม่มีการสร้าง OPENING_BALANCE
     ไม่มีการแก้ Material.balance
     ไม่มีการแก้ Transaction
  ======================================================= */

  const [
    materials,
    openingReceiveItems,
    fiscalReceiveItems,
    approvedIssueItems,
    officers,
  ] =
    await Promise.all([
      /* =================================================
         MATERIALS
      ================================================= */

      prisma.material.findMany(
        {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
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
         RECEIVE ก่อนเริ่มปีงบประมาณ

         ใช้คำนวณยอดยกมา
      ================================================= */

      prisma.receiveItem.findMany(
        {
          where: {
            receive: {
              receiveDate: {
                lt:
                  startDate,
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

      /* =================================================
         RECEIVE ในปีงบประมาณ
      ================================================= */

      prisma.receiveItem.findMany(
        {
          where: {
            receive: {
              receiveDate: {
                gte:
                  startDate,

                lt:
                  endDate,
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

      /* =================================================
         ISSUE ที่ APPROVED

         ดึงตั้งแต่อดีต
         จนก่อนสิ้นปีงบประมาณที่เลือก

         แล้วค่อยแบ่ง:
         - ก่อน FY = ใช้คำนวณ opening
         - ใน FY   = ใช้คำนวณ issue
      ================================================= */

      prisma.issueItem.findMany(
        {
          where: {
            issue: {
              status:
                "APPROVED",

              issueDate: {
                lt:
                  endDate,
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

         ใช้ Dropdown
         คณะกรรมการ 3 คน
      ================================================= */

      prisma.officer.findMany(
        {
          select: {
            id: true,

            firstName:
              true,

            lastName:
              true,

            position:
              true,

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
            id:
              "asc",
          },
        }
      ),
    ]);

  /* =======================================================
     MAPS
  ======================================================= */

  const openingMap =
    new Map<
      number,
      number
    >();

  const receiveMap =
    new Map<
      number,
      number
    >();

  const issueMap =
    new Map<
      number,
      number
    >();

  /* =======================================================
     OPENING RECEIVE

     ยอดรับสะสม
     ก่อนวันที่ 1 ต.ค.
  ======================================================= */

  for (
    const item of
      openingReceiveItems
  ) {
    addMapValue(
      openingMap,
      item.materialId,
      safeInteger(
        item.qty
      )
    );
  }

  /* =======================================================
     FISCAL RECEIVE
  ======================================================= */

  for (
    const item of
      fiscalReceiveItems
  ) {
    addMapValue(
      receiveMap,
      item.materialId,
      safeInteger(
        item.qty
      )
    );
  }

  /* =======================================================
     APPROVED ISSUE

     สำคัญ:
     ใช้ issuedQty ตามข้อมูลที่บันทึกจริง

     สำหรับข้อมูลปี 2569 เดิม
     ไม่ fallback issuedQty = 0 ไปใช้ qty
     เพราะจะเป็นการแก้ประวัติย้อนหลังโดยไม่ตั้งใจ
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

    const issuedQty =
      safeInteger(
        item.issuedQty
      );

    /* ===============================================
       ISSUE ก่อน FY

       หักออกจากยอดเปิด
    =============================================== */

    if (
      issueDate.getTime() <
      startDate.getTime()
    ) {
      addMapValue(
        openingMap,
        item.materialId,
        -issuedQty
      );

      continue;
    }

    /* ===============================================
       ISSUE ใน FY
    =============================================== */

    if (
      issueDate.getTime() >=
        startDate.getTime() &&
      issueDate.getTime() <
        endDate.getTime()
    ) {
      addMapValue(
        issueMap,
        item.materialId,
        issuedQty
      );
    }
  }

  /* =======================================================
     BUILD ROWS

     FY 2569:
     ใช้ข้อมูลเดิมตามเอกสารรับ/เบิกเดิม
     ไม่สร้างหรือซ่อมยอดย้อนหลัง

     FY 2570+:
     openingBalance คือยอดปิดสะสมก่อน 1 ต.ค.
     ซึ่งใช้เป็นยอดยกเข้าแบบ Virtual

     ไม่มีการเขียนข้อมูลใดกลับ DB
  ======================================================= */

  const rows =
    sortMaterialRows(
      materials.map(
        (
          material
        ): MaterialRow => {
          const openingBalance =
            openingMap.get(
              material.id
            ) ??
            0;

          const receiveQty =
            receiveMap.get(
              material.id
            ) ??
            0;

          const issueQty =
            issueMap.get(
              material.id
            ) ??
            0;

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
     URL
  ======================================================= */

  const backHref =
    `/stock-card?fiscalYear=${fiscalYear}`;

  const historyHref =
    `/stock-card/inspection-history?fiscalYear=${fiscalYear}`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🔎"
        title="ตรวจสอบบัญชีพัสดุประจำปี"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        actions={
          <>
            <AppButton
              href={
                historyHref
              }
              variant="secondary"
              size="md"
            >
              ประวัติการตรวจสอบ
            </AppButton>

            <AppButton
              href={
                backHref
              }
              variant="back"
              size="md"
            >
              ← กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          INSPECTION FORM

          Contract เดิม:
          - fiscalYear
          - startShortYear
          - endShortYear
          - materials
          - officers
      ===================================================== */}

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