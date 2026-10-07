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

     ถ้ามีข้อมูลปีนี้แล้ว
     ไปหน้ารายละเอียดประวัติ
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
         RECEIVE BEFORE FY
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
         RECEIVE IN FY
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
         APPROVED ISSUE
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

         ส่งข้อมูลให้ครบตาม Officer ของ InspectionForm
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
     MAP
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
     RECEIVE IN FY
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
     ISSUE

     FY2569 เดิม:
     ใช้ issuedQty จริง
     ไม่ fallback qty
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
     MATERIAL ROWS
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
     BACK

     กลับหน้าบัญชีคุมพัสดุ
     ของปีงบประมาณเดิม
  ======================================================= */

  const backHref =
    `/stock-card?fiscalYear=${fiscalYear}`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER

          ลบปุ่ม:
          ประวัติการตรวจสอบ

          เหลือปุ่มกลับตัวกลางอย่างเดียว
      ===================================================== */}

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

      {/* =====================================================
          INSPECTION FORM
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