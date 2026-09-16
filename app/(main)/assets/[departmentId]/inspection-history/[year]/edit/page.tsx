import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InspectionForm from "../../../inspection/InspectionForm";

type PageProps = {
  params: Promise<{
    id: string;
    year: string;
  }>;
};

function formatDateOnly(
  value: Date | string | null | undefined
) {
  if (!value) return "";

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseInspectorIds(value: unknown): string[] {
  if (!value) return [];

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

function normalizeFiscalYear(
  value: string | number
): string {
  const numericYear = Number(value);

  if (!Number.isFinite(numericYear)) {
    return String(value);
  }

  return numericYear < 2400
    ? String(numericYear + 543)
    : String(numericYear);
}

export default async function InspectionHistoryEditPage({
  params,
}: PageProps) {
  // =====================================================
  // Params
  // =====================================================

  const {
    id: departmentIdParam,
    year: yearParam,
  } = await params;

  const departmentId = Number(departmentIdParam);
  const year = Number(yearParam);

  if (
    !Number.isInteger(departmentId) ||
    departmentId <= 0 ||
    !Number.isInteger(year) ||
    year <= 0
  ) {
    notFound();
  }

  // =====================================================
  // Department
  // =====================================================

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

  if (!department) {
    notFound();
  }

  // =====================================================
  // Inspection History
  //
  // IMPORTANT:
  // AssetInspection.year ใน Prisma เป็น Int
  // ดังนั้นต้องใช้ year ที่แปลงเป็น Number แล้ว
  // =====================================================

  const inspections =
    await prisma.assetInspection.findMany({
      where: {
        year,
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

  // =====================================================
  // Officers
  // =====================================================

  const officers = await prisma.officer.findMany({
    include: {
      department: true,
      section: true,
    },

    orderBy: {
      id: "asc",
    },
  });

  // =====================================================
  // Existing inspection data
  // =====================================================

  const firstInspection = inspections[0];

  const assets = inspections.map(
    (inspection) => inspection.asset
  );

  const initialRows = inspections.map(
    (inspection) => ({
      assetId: inspection.assetId,

      countedQty: String(
        inspection.countedQty ?? ""
      ),

      accuracy: inspection.accuracy || "",

      status: inspection.status || "",

      remark: inspection.remark || "",
    })
  );

  // =====================================================
  // Inspector IDs
  // =====================================================

  const parsedInspectorIds = parseInspectorIds(
    firstInspection.inspectorIds
  );

  /*
   * InspectionForm เดิมใช้ผู้ตรวจสอบ 5 คน
   * จึงทำให้ array มี 5 ช่องเสมอ
   */
  const initialInspectorIds = Array.from(
    { length: 5 },
    (_, index) => parsedInspectorIds[index] || ""
  );

  // =====================================================
  // Initial Data
  // =====================================================

  const initialData = {
    inspectionStartDate: formatDateOnly(
      firstInspection.inspectionStartDate
    ),

    inspectionEndDate: formatDateOnly(
      firstInspection.inspectionEndDate
    ),

    accountStartDate: formatDateOnly(
      firstInspection.accountStartDate
    ),

    accountEndDate: formatDateOnly(
      firstInspection.accountEndDate
    ),

    movementFiscalYear: normalizeFiscalYear(
      firstInspection.movementFiscalYear ??
        firstInspection.year
    ),

    rows: initialRows,

    inspectorIds: initialInspectorIds,
  };

  // =====================================================
  // Render
  // =====================================================

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
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-4
          py-5
          text-white
          shadow-xl
          sm:px-8
          sm:py-6
        "
      >
        <h1
          className="
            text-2xl
            font-extrabold
            !text-white
            sm:text-3xl
          "
        >
          ✏️ แก้ไขข้อมูลการตรวจสอบครุภัณฑ์ประจำปี
        </h1>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            !text-slate-200
            sm:text-base
          "
        >
          {department.name}
          {" · "}
          ประจำปีงบประมาณ พ.ศ.{" "}
          {normalizeFiscalYear(year)}
        </p>
      </div>

      {/* =================================================
          Inspection Form
      ================================================= */}

      <InspectionForm
        department={department}
        assets={assets}
        officers={officers}
        initialData={initialData}
        submitUrl={`/api/assets/inspection?departmentId=${
          department.id
        }&year=${encodeURIComponent(
          String(year)
        )}`}
        submitMethod="PUT"
        cancelHref={`/assets/${
          department.id
        }/inspection-history/${year}`}
        submitLabel="บันทึกการแก้ไข"
      />
    </div>
  );
}