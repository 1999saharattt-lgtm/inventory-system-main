import {

  prisma,

} from "@/lib/prisma";

import {

  notFound,

} from "next/navigation";

import AppPage from "@/components/AppPage";

import AppPageHeader from "@/components/AppPageHeader";

import AppButton from "@/components/AppButton";

import EditInspectionForm from "./EditInspectionForm";

/* =========================================================

   DYNAMIC

\========================================================= */

export const dynamic =

  "force-dynamic";

export const revalidate =

  0;

/* =========================================================

   TYPES

\========================================================= */

type PageProps = {

  params: Promise<{

    fiscalYear: string;

  }>;

};

/* =========================================================

   CATEGORY ORDER

\========================================================= */

const categoryOrder = [

  "OFFICE",

  "COMPUTER",

  "ELECTRIC",

  "HOUSEHOLD",

  "VEHICLE",

  "PRINTING",

];

/* =========================================================

   DATE ONLY

   Database:

   2026-10-06T00:00:00.000Z

   Form:

   2026-10-06

\========================================================= */

function formatDateOnly(

  value:

    | Date

    | string

    | null

    | undefined

) {

  if (!value) {

    return "";

  }

  const date =

    value instanceof Date

      ? value

      : new Date(

          value

        );

  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return "";

  }

  const year =

    date.getUTCFullYear();

  const month =

    String(

      date.getUTCMonth() +

        1

    ).padStart(

      2,

      "0"

    );

  const day =

    String(

      date.getUTCDate()

    ).padStart(

      2,

      "0"

    );

  return `${year}-${month}-${day}`;

}

/* =========================================================

   PARSE INSPECTOR IDS

\========================================================= */

function parseInspectorIds(

  value: unknown

): string[] {

  if (

    Array.isArray(

      value

    )

  ) {

    return value

      .map(

        (

          item

        ) =>

          String(

            item ?? ""

          ).trim()

      )

      .filter(

        Boolean

      );

  }

  if (

    typeof value ===

      "string" &&

    value.trim()

  ) {

    try {

      const parsed =

        JSON.parse(

          value

        );

      if (

        Array.isArray(

          parsed

        )

      ) {

        return parsed

          .map(

            (

              item

            ) =>

              String(

                item ?? ""

              ).trim()

          )

          .filter(

            Boolean

          );

      }

    } catch {

      return value

        .split(

          ","

        )

        .map(

          (

            item

          ) =>

            item.trim()

        )

        .filter(

          Boolean

        );

    }

  }

  return [];

}

/* =========================================================

   FIELD VALUE

   null / undefined

   -> ""

   0

   -> "0"

   ใช้กับช่องแก้ไข เพื่อไม่ให้ 0 กลายเป็นค่าว่างโดยไม่ตั้งใจ

\========================================================= */

function toFieldValue(

  value:

    | number

    | null

    | undefined

) {

  if (

    value === null ||

    value === undefined

  ) {

    return "";

  }

  return String(

    value

  );

}

/* =========================================================

   FISCAL YEAR RANGE

   FY 2569

   1 ต.ค. 2568

   ถึงก่อน

   1 ต.ค. 2569

\========================================================= */

function getFiscalYearRange(

  fiscalYearThai: number

) {

  const fiscalEndChristianYear =

    fiscalYearThai -

    543;

  const fiscalStartChristianYear =

    fiscalEndChristianYear -

    1;

  const startDate =

    new Date(

      Date.UTC(

        fiscalStartChristianYear,

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

        fiscalEndChristianYear,

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

   NUMBER

\========================================================= */

function safeInteger(

  value: unknown

) {

  const number =

    Number(

      value ?? 0

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

   PAGE

\========================================================= */

export default async function StockCardInspectionHistoryEditPage({

  params,

}: PageProps) {

  const {

    fiscalYear:

      fiscalYearParam,

  } = await params;

  /* =======================================================

     FISCAL YEAR

  ======================================================= */

  const fiscalYear =

    Number(

      fiscalYearParam

    );

  if (

    !Number.isInteger(

      fiscalYear

    ) ||

    fiscalYear < 2400 ||

    fiscalYear > 3000

  ) {

    notFound();

  }

  /* =======================================================

     INSPECTION

  ======================================================= */

  const inspection =

    await prisma.stockCardInspection.findUnique(

      {

        where: {

          fiscalYear,

        },

        include: {

          rows: {

            include: {

              material:

                true,

            },

          },

        },

      }

    );

  if (

    !inspection

  ) {

    notFound();

  }

  /* =======================================================

     MATERIAL IDS

     ใช้เฉพาะรายการที่อยู่ในประวัติรอบนี้

     ไม่ดึงพัสดุที่ถูกเพิ่มเข้าระบบภายหลังมาแทรก

  ======================================================= */

  const materialIds =

    inspection.rows.map(

      (

        row

      ) =>

        row.materialId

    );

  /* =======================================================

     FISCAL RANGE

  ======================================================= */

  const {

    startDate,

    endDate,

  } =

    getFiscalYearRange(

      fiscalYear

    );

  /* =======================================================

     TRANSACTIONS

     อ่านอย่างเดียว

     ไม่สร้าง OPENING_BALANCE

     ไม่แก้ยอด Stock

  ======================================================= */

  // Same source and document rules as the inspection detail page.
  const stockMaterials = materialIds.length
    ? await prisma.material.findMany({
        where: { id: { in: materialIds } },
        select: {
          id: true,
          receiveItems: {
            where: { receive: { receiveDate: { lt: endDate } } },
            select: { qty: true, receive: { select: { documentNo: true, receiveDate: true } } },
          },
          issueItems: {
            where: { issue: { status: "APPROVED", issueDate: { lt: endDate } } },
            select: { qty: true, issuedQty: true, issue: { select: { documentNo: true, issueDate: true } } },
          },
        },
      })
    : [];

  const stockMap = new Map(stockMaterials.map((material) => [material.id, material]));
  const normalizeDocumentNo = (value: string | null | undefined) =>
    String(value ?? "").trim().replace(/\s+/g, "");
  const isOpening = (value: string | null | undefined) =>
    normalizeDocumentNo(value) === "ยอดยกเข้าระบบ";
  const isReceive = (value: string | null | undefined) =>
    normalizeDocumentNo(value).startsWith("ร.");
  const isIssue = (value: string | null | undefined) =>
    normalizeDocumentNo(value).startsWith("จ.");
  const within = (date: Date, from: Date, until: Date) => date >= from && date < until;
  const issued = (item: { qty: number; issuedQty: number | null }) =>
    safeInteger(item.issuedQty === null || item.issuedQty === undefined ? item.qty : item.issuedQty);
  const today = new Date();
  const bangkok = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(today);
  const todayPart = (key: string) => Number(bangkok.find((p) => p.type === key)?.value);
  const todayEnd = new Date(Date.UTC(todayPart("year"), todayPart("month") - 1, todayPart("day") + 1));
  const currentEndExclusive = todayEnd < endDate ? todayEnd : endDate;

  const officers =

    await prisma.officer.findMany(

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

    );

  /* =======================================================

     SORT INSPECTION ROWS

     หมวดก่อน

     รหัสพัสดุภายในหมวด

  ======================================================= */

  const sortedInspectionRows =

    [

      ...inspection.rows,

    ].sort(

      (

        a,

        b

      ) => {

        const categoryA =

          categoryOrder.indexOf(

            a.material

              .category

          );

        const categoryB =

          categoryOrder.indexOf(

            b.material

              .category

          );

        const orderA =

          categoryA >= 0

            ? categoryA

            : Number.MAX_SAFE_INTEGER;

        const orderB =

          categoryB >= 0

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

        const codeCompare =

          a.material.code.localeCompare(

            b.material.code,

            "th",

            {

              numeric:

                true,

              sensitivity:

                "base",

            }

          );

        if (

          codeCompare !==

          0

        ) {

          return codeCompare;

        }

        return (

          a.materialId -

          b.materialId

        );

      }

    );

  /* =======================================================

     BUILD EDIT ROWS

  ======================================================= */

  const rows = sortedInspectionRows
    .filter(({ material }) => {
      const name = material.name.trim();
      if (/\(สสส\.\)\s*$/u.test(name)) return false;
      if (material.category === "ELECTRIC") {
        if (material.code === "ELE-0003") return false;
        if (name.includes("ถ่านกระดุม")) return false;
      }
      return true;
    })
    .map((inspectionRow) => {
      const material = inspectionRow.material;
      const stock = stockMap.get(material.id);
      const receives = stock?.receiveItems ?? [];
      const issues = stock?.issueItems ?? [];
      const openingQty = receives
        .filter((item) => isOpening(item.receive.documentNo))
        .reduce((sum, item) => sum + safeInteger(item.qty), 0);
      const receiveQty = receives
        .filter((item) => isReceive(item.receive.documentNo) &&
          within(item.receive.receiveDate, startDate, endDate))
        .reduce((sum, item) => sum + safeInteger(item.qty), 0);
      const issueQty = issues
        .filter((item) => isIssue(item.issue.documentNo) &&
          within(item.issue.issueDate, startDate, endDate))
        .reduce((sum, item) => sum + issued(item), 0);
      const currentReceiveQty = receives
        .filter((item) => isReceive(item.receive.documentNo) &&
          within(item.receive.receiveDate, startDate, currentEndExclusive))
        .reduce((sum, item) => sum + safeInteger(item.qty), 0);
      const currentIssueQty = issues
        .filter((item) => isIssue(item.issue.documentNo) &&
          within(item.issue.issueDate, startDate, currentEndExclusive))
        .reduce((sum, item) => sum + issued(item), 0);
      const closingQty = openingQty + currentReceiveQty - currentIssueQty;
      return {
        materialId: material.id,
        code: material.code,
        name: material.name,
        unit: material.category === "ELECTRIC" &&
          material.name.trim() === "ถ่านชาร์จ ขนาด AAA (Rechargeable Battery)"
          ? "แพ็ค" : material.unit,
        category: String(material.category),
        openingQty, receiveQty, issueQty, closingQty,
        accuracy: inspectionRow.accuracy ?? "",
        shortageQty: toFieldValue(inspectionRow.shortageQty),
        excessQty: toFieldValue(inspectionRow.excessQty),
        baht: toFieldValue(inspectionRow.baht),
        satang: toFieldValue(inspectionRow.satang),
        damagedQty: toFieldValue(inspectionRow.damagedQty),
        deterioratedQty: toFieldValue(inspectionRow.deterioratedQty),
        unnecessaryQty: toFieldValue(inspectionRow.unnecessaryQty),
        remark: inspectionRow.remark ?? "",
      };
    });

  const initialData = {

    fiscalYear:

      inspection.fiscalYear,

    inspectionDate:

      formatDateOnly(

        inspection.inspectionDate

      ),

    inspectionEndDate: formatDateOnly(inspection.inspectionEndDate),

    inspectorIds:

      parseInspectorIds(

        inspection.inspectorIds

      ),

    rows,

  };

  /* =======================================================

     URL

  ======================================================= */

  const detailHref =

    `/stock-card/inspection-history/${fiscalYear}`;

  const submitUrl =

    `/api/stock-card/inspection?fiscalYear=${fiscalYear}`;

  /* =========================================================

     UI

  ========================================================= */

  return (

    <AppPage>

      {/* =====================================================

          HEADER

      ===================================================== */}

      <AppPageHeader

        icon="✏️"

        title="แก้ไขการตรวจสอบบัญชีพัสดุประจำปี"

        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}

        actions={

          <AppButton

            href={

              detailHref

            }

            variant="back"

            size="md"

          >

            กลับ

          </AppButton>

        }

      />

      {/* =====================================================

          EDIT FORM

      ===================================================== */}

      <EditInspectionForm

        fiscalYear={

          fiscalYear

        }

        officers={

          officers

        }

        initialData={

          initialData

        }

        submitUrl={

          submitUrl

        }

        cancelHref={

          detailHref

        }

      />

    </AppPage>

  );

}
