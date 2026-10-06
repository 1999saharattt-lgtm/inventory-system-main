import {
  notFound,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireLogin,
} from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "./InspectionForm";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/* =========================================================
   TYPES
========================================================= */

type Props = {
  searchParams: Promise<{
    fiscalYear?: string;
  }>;
};

type FiscalYearRange = {
  fiscalYearThai: number;
  fiscalYearGregorian: number;

  startDate: Date;
  endDate: Date;
};

type ThailandDateParts = {
  year: number;
  month: number;
  day: number;
};

/* =========================================================
   CONSTANT
========================================================= */

const FIRST_FISCAL_YEAR =
  2569;

/* =========================================================
   THAILAND DATE
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
   1 ต.ค. 2568
   ถึงก่อน
   1 ต.ค. 2569
========================================================= */

function getFiscalYearRange(
  fiscalYearThai:
    number
): FiscalYearRange {
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
    fiscalYearThai,
    fiscalYearGregorian,
    startDate,
    endDate,
  };
}

/* =========================================================
   ISSUE QTY

   ใช้กติกาเดียวกับ Stock Card เดิม
========================================================= */

function getIssueQuantity(
  item: {
    qty: number;

    issuedQty:
      number | null;
  }
) {
  return Number(
    item.issuedQty ??
      item.qty ??
      0
  );
}

/* =========================================================
   SHORT THAI YEAR

   2568 -> 68
========================================================= */

function getShortThaiYear(
  buddhistYear: number
) {
  return String(
    buddhistYear
  ).slice(
    -2
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardInspectionPage({
  searchParams,
}: Props) {
  /* =======================================================
     USER
  ======================================================= */

  const user =
    await requireLogin();

  if (
    user.role !==
    "ADMIN"
  ) {
    notFound();
  }

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const query =
    await searchParams;

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
      FIRST_FISCAL_YEAR &&
    requestedFiscalYear <=
      3000
      ? requestedFiscalYear
      : currentFiscalYear;

  const fiscalRange =
    getFiscalYearRange(
      fiscalYear
    );

  const previousThaiYear =
    fiscalYear -
    1;

  const startShortYear =
    getShortThaiYear(
      previousThaiYear
    );

  const endShortYear =
    getShortThaiYear(
      fiscalYear
    );

  /* =======================================================
     OPENING DAY END

     1 ต.ค. เวลา 00:00
     ถึงก่อน
     2 ต.ค. เวลา 00:00
  ======================================================= */

  const openingEndDate =
    new Date(
      fiscalRange
        .startDate
        .getTime() +
        24 *
          60 *
          60 *
          1000
    );

  /* =======================================================
     BULK DATA

     สำคัญ:
     ไม่มี query ทีละ Material
  ======================================================= */

  const [
    materials,
    openingItems,
    receiveItems,
    issueItems,
    officers,
  ] =
    await Promise.all([
      /* ===================================================
         MATERIAL
      =================================================== */

      prisma.material.findMany({
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

        orderBy: [
          {
            category:
              "asc",
          },

          {
            code:
              "asc",
          },
        ],
      }),

      /* ===================================================
         OPENING

         ดึงจาก Stock Card:
         "ยอดยกเข้าระบบ"
         วันที่ 1 ต.ค. ของ FY

         FY 2569
         =
         1 ต.ค. 2568
      =================================================== */

      prisma.receiveItem.findMany({
        where: {
          receive: {
            documentNo:
              "ยอดยกเข้าระบบ",

            receiveDate: {
              gte:
                fiscalRange.startDate,

              lt:
                openingEndDate,
            },
          },
        },

        select: {
          materialId:
            true,

          qty:
            true,
        },
      }),

      /* ===================================================
         RECEIVE

         1 ต.ค. - 30 ก.ย.

         ไม่รวมยอดยก
      =================================================== */

      prisma.receiveItem.findMany({
        where: {
          receive: {
            receiveDate: {
              gte:
                fiscalRange.startDate,

              lt:
                fiscalRange.endDate,
            },

            NOT: {
              documentNo:
                "ยอดยกเข้าระบบ",
            },
          },
        },

        select: {
          materialId:
            true,

          qty:
            true,
        },
      }),

      /* ===================================================
         ISSUE

         APPROVED เท่านั้น
      =================================================== */

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
          materialId:
            true,

          qty:
            true,

          issuedQty:
            true,
        },
      }),

      /* ===================================================
         OFFICERS
      =================================================== */

      prisma.officer.findMany({
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

        orderBy: [
          {
            firstName:
              "asc",
          },

          {
            lastName:
              "asc",
          },
        ],
      }),
    ]);

  /* =======================================================
     OPENING MAP
  ======================================================= */

  const openingMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      openingItems
  ) {
    const current =
      openingMap.get(
        item.materialId
      ) ??
      0;

    openingMap.set(
      item.materialId,
      current +
        Number(
          item.qty ??
            0
        )
    );
  }

  /* =======================================================
     RECEIVE MAP
  ======================================================= */

  const receiveMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      receiveItems
  ) {
    const current =
      receiveMap.get(
        item.materialId
      ) ??
      0;

    receiveMap.set(
      item.materialId,
      current +
        Number(
          item.qty ??
            0
        )
    );
  }

  /* =======================================================
     ISSUE MAP
  ======================================================= */

  const issueMap =
    new Map<
      number,
      number
    >();

  for (
    const item of
      issueItems
  ) {
    const current =
      issueMap.get(
        item.materialId
      ) ??
      0;

    const qty =
      getIssueQuantity({
        qty:
          Number(
            item.qty ??
              0
          ),

        issuedQty:
          item.issuedQty,
      });

    issueMap.set(
      item.materialId,
      current +
        qty
    );
  }

  /* =======================================================
     ROWS
  ======================================================= */

  const rows =
    materials.map(
      (
        material
      ) => {
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
            material.category,

          openingBalance,

          receiveQty,

          issueQty,

          closingBalance,
        };
      }
    );

  /* =======================================================
     BACK
  ======================================================= */

  const backHref =
    `/stock-card?fiscalYear=${fiscalYear}`;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      <AppPageHeader
        icon="🔎"
        title="ตรวจสอบบัญชีพัสดุประจำปี"
        subtitle={`ตรวจสอบบัญชีพัสดุประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
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