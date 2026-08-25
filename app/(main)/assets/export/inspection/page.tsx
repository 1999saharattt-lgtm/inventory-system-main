import { prisma } from "@/lib/prisma";
import ExportInspectionPdf from "./ExportInspectionPdf";

export const dynamic = "force-dynamic";

export default async function AssetsExportInspectionPage() {
  const [departments, inspections] = await Promise.all([
    prisma.department.findMany({
      orderBy: {
        id: "asc",
      },
    }),

    prisma.assetInspection.findMany({
      include: {
        asset: {
          include: {
            department: true,
            section: true,
            officer: true,
          },
        },
      },
      orderBy: [
        {
          year: "desc",
        },
        {
          quarter: "asc",
        },
        {
          asset: {
            departmentId: "asc",
          },
        },
        {
          assetId: "asc",
        },
      ],
    }),
  ]);

  const serializedInspections = inspections.map((inspection) => ({
    id: inspection.id,

    year: inspection.year,

    quarter: inspection.quarter,

    inspectionDate: inspection.inspectionDate.toISOString(),

    status: inspection.status,

    condition: inspection.condition,

    location: inspection.location,

    remark: inspection.remark,

    inspectorName: inspection.inspectorName,

    asset: {
      id: inspection.asset.id,

      name: inspection.asset.name,

      category: inspection.asset.category,

      brand: inspection.asset.brand,

      model: inspection.asset.model,

      serialNumber: inspection.asset.serialNumber,

      governmentAssetNo: inspection.asset.governmentAssetNo,

      officeAssetNo: inspection.asset.officeAssetNo,

      departmentId: inspection.asset.departmentId,

      departmentName: inspection.asset.department.name,

      sectionName: inspection.asset.section?.name ?? null,

      officerName: inspection.asset.officer
        ? `${inspection.asset.officer.firstName} ${inspection.asset.officer.lastName}`
        : null,
    },
  }));

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
      {/* =====================================================
          Header
      ===================================================== */}

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
            🔍 รายงานการตรวจสอบครุภัณฑ์
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
            เลือกรอบการตรวจสอบและหน่วยงานเพื่อจัดทำรายงาน PDF
          </p>
        </div>
      </div>

      {/* =====================================================
          Export Component
      ===================================================== */}

      <ExportInspectionPdf
        departments={departments.map((department) => ({
          id: department.id,
          name: department.name,
        }))}
        inspections={serializedInspections}
      />
    </div>
  );
}