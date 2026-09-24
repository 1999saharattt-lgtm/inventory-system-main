import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "../../../inspection/InspectionForm";

type PageProps = {
  params: Promise<{
    departmentId: string;
    year: string;
  }>;
};

/* =========================================================
   DATE ONLY

   แปลง Date เป็น YYYY-MM-DD
========================================================= */

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
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/* =========================================================
   INSPECTOR IDS

   แปลง inspectorIds จาก Prisma Json
========================================================= */

function parseInspectorIds(
  value: unknown
): string[] {
  if (!value) {
    return [];
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(String)
      .filter(Boolean);
  }

  if (
    typeof value ===
    "string"
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
          .map(String)
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(Boolean);
    }
  }

  return [];
}

/* =========================================================
   FISCAL YEAR

   แปลงปี ค.ศ. / พ.ศ. ให้เป็น พ.ศ.
========================================================= */

function normalizeFiscalYear(
  value:
    | string
    | number
) {
  const year =
    Number(
      value
    );

  if (
    !Number.isFinite(
      year
    )
  ) {
    return String(
      value
    );
  }

  return year < 2400
    ? String(
        year + 543
      )
    : String(
        year
      );
}

/* =========================================================
   DATABASE YEAR

   รองรับ URL:
   /2569
   /2026
========================================================= */

function getDatabaseYear(
  value: string
) {
  const year =
    Number(
      value
    );

  if (
    !Number.isInteger(
      year
    )
  ) {
    return null;
  }

  return year;
}

/* =========================================================
   FISCAL YEAR START

   ปีงบประมาณ 2569
   = 1 ตุลาคม 2568
========================================================= */

function getFiscalYearStartDate(
  fiscalYear: number
) {
  const buddhistYear =
    fiscalYear < 2400
      ? fiscalYear +
        543
      : fiscalYear;

  const startBuddhistYear =
    buddhistYear -
    1;

  const startChristianYear =
    startBuddhistYear -
    543;

  return `${startChristianYear}-10-01`;
}

/* =========================================================
   FISCAL YEAR END

   ปีงบประมาณ 2569
   = 30 กันยายน 2569
========================================================= */

function getFiscalYearEndDate(
  fiscalYear: number
) {
  const buddhistYear =
    fiscalYear < 2400
      ? fiscalYear +
        543
      : fiscalYear;

  const endChristianYear =
    buddhistYear -
    543;

  return `${endChristianYear}-09-30`;
}

/* =========================================================
   MOVEMENT FISCAL YEAR
========================================================= */

function getMovementFiscalYear(
  fiscalYear: number
) {
  return normalizeFiscalYear(
    fiscalYear
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function InspectionHistoryEditPage({
  params,
}: PageProps) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId:
      departmentIdParam,

    year,
  } = await params;

  const departmentId =
    Number(
      departmentIdParam
    );

  const requestedYear =
    getDatabaseYear(
      year
    );

  /* =======================================================
     VALIDATE PARAMS
  ======================================================= */

  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0 ||
    requestedYear ===
      null
  ) {
    notFound();
  }

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id:
          departmentId,
      },
    });

  if (!department) {
    notFound();
  }

  /* =======================================================
     YEAR

     รองรับฐานข้อมูลที่เก็บ:
     พ.ศ. 2569
     หรือ
     ค.ศ. 2026
  ======================================================= */

  const buddhistYear =
    requestedYear < 2400
      ? requestedYear +
        543
      : requestedYear;

  const christianYear =
    buddhistYear -
    543;

  /* =======================================================
     INSPECTIONS
  ======================================================= */

  const inspections =
    await prisma.assetInspection.findMany({
      where: {
        year: {
          in: [
            buddhistYear,
            christianYear,
          ],
        },

        asset: {
          departmentId,
        },
      },

      include: {
        asset: {
          include: {
            section:
              true,

            officer:
              true,
          },
        },
      },

      orderBy: {
        assetId:
          "asc",
      },
    });

  if (
    inspections.length ===
    0
  ) {
    notFound();
  }

  /* =======================================================
     DATABASE YEAR
  ======================================================= */

  const databaseYear =
    inspections[0].year;

  const displayFiscalYear =
    normalizeFiscalYear(
      databaseYear
    );

  /* =======================================================
     OFFICERS

     ดึงทั้งหมดเหมือนหน้า Inspection
     เพื่อให้ Dropdown ผู้ตรวจสอบค้นหาได้ครบ
  ======================================================= */

  const officers =
    await prisma.officer.findMany({
      include: {
        department:
          true,

        section:
          true,
      },

      orderBy: {
        id:
          "asc",
      },
    });

  /* =======================================================
     FIRST INSPECTION
  ======================================================= */

  const firstInspection =
    inspections[0];

  /* =======================================================
     ASSETS
  ======================================================= */

  const assets =
    inspections.map(
      (
        inspection
      ) =>
        inspection.asset
    );

  /* =======================================================
     INITIAL ROWS
  ======================================================= */

  const initialRows =
    inspections.map(
      (
        inspection
      ) => ({
        assetId:
          inspection.assetId,

        countedQty:
          String(
            inspection.countedQty ??
              ""
          ),

        accuracy:
          inspection.accuracy ||
          "",

        status:
          inspection.status ||
          "",

        remark:
          inspection.remark ||
          "",
      })
    );

  /* =======================================================
     INITIAL INSPECTORS
  ======================================================= */

  const initialInspectorIds =
    parseInspectorIds(
      firstInspection.inspectorIds
    );

  /* =======================================================
     INSPECTION DATE
  ======================================================= */

  const inspectionStartDate =
    formatDateOnly(
      firstInspection.inspectionStartDate
    );

  const inspectionEndDate =
    formatDateOnly(
      firstInspection.inspectionEndDate
    );

  /* =======================================================
     ACCOUNT DATE

     schema AssetInspection ไม่มี:
     - accountStartDate
     - accountEndDate
     - movementFiscalYear

     จึงคำนวณจากปีงบประมาณ
  ======================================================= */

  const accountStartDate =
    getFiscalYearStartDate(
      databaseYear
    );

  const accountEndDate =
    getFiscalYearEndDate(
      databaseYear
    );

  const movementFiscalYear =
    getMovementFiscalYear(
      databaseYear
    );

  /* =======================================================
     INITIAL DATA
  ======================================================= */

  const initialData = {
    inspectionStartDate,

    inspectionEndDate,

    accountStartDate,

    accountEndDate,

    movementFiscalYear,

    rows:
      initialRows,

    inspectorIds:
      initialInspectorIds,
  };

  /* =======================================================
     HISTORY ROUTE

     กลับ / ยกเลิก / บันทึกสำเร็จ
     กลับหน้ารวมประวัติ
  ======================================================= */

  const historyHref =
    "/assets/inspection-history";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER

          ใช้ AppPageHeader ตัวกลาง
          เหมือน /assets/1/inspection
      ===================================================== */}

      <AppPageHeader
        icon="✏️"
        title="แก้ไขข้อมูลการตรวจสอบครุภัณฑ์ประจำปี"
        subtitle={`${department.name} • ประจำปีงบประมาณ พ.ศ. ${displayFiscalYear}`}
        actions={
          <AppButton
            href={
              historyHref
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

          ตัว InspectionForm ปัจจุบันใช้ตัวกลาง:
          - AppCard
          - AppSearchInput
          - AppTableCard
          - AppButton
          - Dropdown
          - Calendar

          จึงไม่เขียน Card/Button ซ้ำในหน้านี้
      ===================================================== */}

      <InspectionForm
        department={
          department
        }
        assets={
          assets
        }
        officers={
          officers
        }
        initialData={
          initialData
        }
        submitUrl={`/api/assets/inspection?departmentId=${department.id}&year=${databaseYear}`}
        submitMethod="PUT"
        cancelHref={
          historyHref
        }
        submitLabel="บันทึกการแก้ไข"
      />
    </AppPage>
  );
}