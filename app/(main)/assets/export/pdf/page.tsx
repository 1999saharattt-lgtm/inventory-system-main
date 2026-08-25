import { prisma } from "@/lib/prisma";
import ExportAssetsPdf from "./ExportAssetsPdf";

export const dynamic = "force-dynamic";

export default async function AssetsExportPdfPage() {
  const [departments, assets] = await Promise.all([
    prisma.department.findMany({
      orderBy: {
        id: "asc",
      },
    }),

    prisma.asset.findMany({
      include: {
        department: true,
        section: true,
        officer: true,
      },
      orderBy: [
        {
          departmentId: "asc",
        },
        {
          category: "asc",
        },
        {
          id: "asc",
        },
      ],
    }),
  ]);

  const serializedAssets = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    category: asset.category,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    governmentAssetNo: asset.governmentAssetNo,
    officeAssetNo: asset.officeAssetNo,
    departmentId: asset.departmentId,
    departmentName: asset.department.name,
    sectionName: asset.section?.name ?? null,
    officerName: asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`
      : null,
    status: asset.status,
    purchaseDate: asset.purchaseDate
      ? asset.purchaseDate.toISOString()
      : null,
    price: asset.price,
    location: asset.location,
    remark: asset.remark,
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
            📋 ส่งออกทะเบียนคุมครุภัณฑ์
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
            เลือกรายการครุภัณฑ์และจัดทำรายงานสำหรับส่งออก PDF
          </p>
        </div>
      </div>

      {/* =====================================================
          PDF Export Component
      ===================================================== */}

      <ExportAssetsPdf
        departments={departments.map((department) => ({
          id: department.id,
          name: department.name,
        }))}
        assets={serializedAssets}
      />
    </div>
  );
}