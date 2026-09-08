import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InspectionForm from "../../../inspection/InspectionForm";

type PageProps = {
  params: Promise<{
    id: string;
    year: string;
  }>;
};

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
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

function normalizeFiscalYear(value: string) {
  const year = Number(value);

  if (!Number.isFinite(year)) return value;

  return year < 2400 ? String(year + 543) : String(year);
}

export default async function InspectionHistoryEditPage({
  params,
}: PageProps) {
  const { id, year } = await params;
  const departmentId = Number(id);

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    notFound();
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    notFound();
  }

  const inspections = await prisma.assetInspection.findMany({
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

  const officers = await prisma.officer.findMany({
    include: {
      department: true,
      section: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const firstInspection = inspections[0];

  const assets = inspections.map((inspection) => inspection.asset);

  const initialRows = inspections.map((inspection) => ({
    assetId: inspection.assetId,
    countedQty: String(inspection.countedQty ?? ""),
    accuracy: inspection.accuracy || "",
    status: inspection.status || "",
    remark: inspection.remark || "",
  }));

  const initialInspectorIds = parseInspectorIds(
    firstInspection.inspectorIds
  );

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
      String(
        firstInspection.movementFiscalYear ||
          firstInspection.year
      )
    ),
    rows: initialRows,
    inspectorIds: initialInspectorIds,
  };

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
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
        <h1 className="text-2xl font-extrabold !text-white sm:text-3xl">
          ✏️ แก้ไขข้อมูลการตรวจสอบครุภัณฑ์ประจำปี
        </h1>

        <p className="mt-2 text-sm font-semibold !text-slate-200 sm:text-base">
          {department.name} · ประจำปีงบประมาณ พ.ศ. {normalizeFiscalYear(year)}
        </p>
      </div>

      <InspectionForm
        department={department}
        assets={assets}
        officers={officers}
        initialData={initialData}
        submitUrl={`/api/assets/inspection?departmentId=${department.id}&year=${encodeURIComponent(
          year
        )}`}
        submitMethod="PUT"
        cancelHref={`/assets/${department.id}/inspection-history/${year}`}
        submitLabel="บันทึกการแก้ไข"
      />
    </div>
  );
}
