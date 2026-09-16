import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import InspectionForm from "../../../inspection/InspectionForm";

type PageProps = {
  params: Promise<{
    departmentId: string;
    year: string;
  }>;
};

// =====================================================
// แปลง Date เป็น YYYY-MM-DD
// =====================================================

function formatDateOnly(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// แปลง inspectorIds จาก Prisma Json
// =====================================================

function parseInspectorIds(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

// =====================================================
// แปลงปี ค.ศ. / พ.ศ. ให้เป็น พ.ศ.
// =====================================================

function normalizeFiscalYear(
  value: string | number
) {
  const year = Number(value);

  if (!Number.isFinite(year)) {
    return String(value);
  }

  return year < 2400
    ? String(year + 543)
    : String(year);
}

// =====================================================
// แปลงปีที่อยู่ใน URL
//
// schema:
// year Int
//
// รองรับ URL:
// /2569
// /2026
// =====================================================

function getDatabaseYear(value: string) {
  const year = Number(value);

  if (!Number.isInteger(year)) {
    return null;
  }

  return year;
}

// =====================================================
// วันที่เริ่มต้นปีงบประมาณ
//
// ปีงบประมาณ 2569
// = 1 ตุลาคม 2568
// =====================================================

function getFiscalYearStartDate(
  fiscalYear: number
) {
  const buddhistYear =
    fiscalYear < 2400
      ? fiscalYear + 543
      : fiscalYear;

  const startBuddhistYear =
    buddhistYear - 1;

  const startChristianYear =
    startBuddhistYear - 543;

  return `${startChristianYear}-10-01`;
}

// =====================================================
// วันที่สิ้นสุดปีงบประมาณ
//
// ปีงบประมาณ 2569
// = 30 กันยายน 2569
// =====================================================

function getFiscalYearEndDate(
  fiscalYear: number
) {
  const buddhistYear =
    fiscalYear < 2400
      ? fiscalYear + 543
      : fiscalYear;

  const endChristianYear =
    buddhistYear - 543;

  return `${endChristianYear}-09-30`;
}

// =====================================================
// ปีงบประมาณสำหรับรายการเคลื่อนไหว
// =====================================================

function getMovementFiscalYear(
  fiscalYear: number
) {
  return normalizeFiscalYear(fiscalYear);
}

// =====================================================
// Page
// =====================================================

export default async function InspectionHistoryEditPage({
  params,
}: PageProps) {
  const {
    departmentId: departmentIdParam,
    year,
  } = await params;

  const departmentId =
    Number(departmentIdParam);

  const requestedYear =
    getDatabaseYear(year);

  // ===================================================
  // ตรวจสอบ parameter
  // ===================================================

  if (
    !Number.isInteger(departmentId) ||
    departmentId <= 0 ||
    requestedYear === null
  ) {
    notFound();
  }

  // ===================================================
  // กลุ่มงาน
  // ===================================================

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

  if (!department) {
    notFound();
  }

  // ===================================================
  // รองรับฐานข้อมูลที่ year อาจเก็บเป็น
  //
  // พ.ศ. 2569
  // หรือ
  // ค.ศ. 2026
  // ===================================================

  const buddhistYear =
    requestedYear < 2400
      ? requestedYear + 543
      : requestedYear;

  const christianYear =
    buddhistYear - 543;

  // ===================================================
  // ดึงประวัติการตรวจสอบ
  // ===================================================

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
            section: true,
            officer: true,
          },
        },
      },

      orderBy: {
        assetId: "asc",
      },
    });

  if (inspections.length === 0) {
    notFound();
  }

  // ===================================================
  // ใช้ปีจริงที่พบในฐานข้อมูล
  // ===================================================

  const databaseYear =
    inspections[0].year;

  const displayFiscalYear =
    normalizeFiscalYear(databaseYear);

  // ===================================================
  // รายชื่อเจ้าหน้าที่
  // ===================================================

  const officers =
    await prisma.officer.findMany({
      include: {
        department: true,
        section: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  // ===================================================
  // Inspection แรก
  // ===================================================

  const firstInspection =
    inspections[0];

  // ===================================================
  // Assets
  // ===================================================

  const assets = inspections.map(
    (inspection) => inspection.asset
  );

  // ===================================================
  // Rows เดิม
  // ===================================================

  const initialRows =
    inspections.map((inspection) => ({
      assetId:
        inspection.assetId,

      countedQty:
        String(
          inspection.countedQty ?? ""
        ),

      accuracy:
        inspection.accuracy || "",

      status:
        inspection.status || "",

      remark:
        inspection.remark || "",
    }));

  // ===================================================
  // ผู้ตรวจสอบเดิม
  // ===================================================

  const initialInspectorIds =
    parseInspectorIds(
      firstInspection.inspectorIds
    );

  // ===================================================
  // วันที่ตรวจ
  // ===================================================

  const inspectionStartDate =
    formatDateOnly(
      firstInspection.inspectionStartDate
    );

  const inspectionEndDate =
    formatDateOnly(
      firstInspection.inspectionEndDate
    );

  // ===================================================
  // schema AssetInspection ไม่มี:
  //
  // accountStartDate
  // accountEndDate
  // movementFiscalYear
  //
  // จึงคำนวณจากปีงบประมาณ
  // ===================================================

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

  // ===================================================
  // Initial Data สำหรับ InspectionForm
  // ===================================================

  const initialData = {
    inspectionStartDate,
    inspectionEndDate,

    accountStartDate,
    accountEndDate,

    movementFiscalYear,

    rows: initialRows,

    inspectorIds:
      initialInspectorIds,
  };

  // ===================================================
  // URL กลับไปหน้ารายละเอียด
  //
  // ใช้ปีจาก URL เดิม
  // เช่น /2570/edit -> กลับไป /2570
  // ===================================================

  const detailHref =
    `/assets/${department.id}/inspection-history/${year}`;

  // ===================================================
  // Render
  // ===================================================

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =================================================
          Header
      ================================================= */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        {/* ===============================================
            ชื่อหน้า
        =============================================== */}

        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            ✏️ แก้ไขข้อมูลการตรวจสอบครุภัณฑ์ประจำปี
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            {department.name}
            {" · "}
            ประจำปีงบประมาณ พ.ศ.{" "}
            {displayFiscalYear}
          </p>
        </div>

        {/* ===============================================
            ปุ่มกลับ
            รูปแบบเดียวกับหน้า Department
        =============================================== */}

        <Link
          href={detailHref}
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =================================================
          Inspection Form
      ================================================= */}

      <InspectionForm
        department={department}
        assets={assets}
        officers={officers}
        initialData={initialData}
        submitUrl={`/api/assets/inspection?departmentId=${department.id}&year=${databaseYear}`}
        submitMethod="PUT"
        cancelHref={detailHref}
        submitLabel="บันทึกการแก้ไข"
      />
    </div>
  );
}