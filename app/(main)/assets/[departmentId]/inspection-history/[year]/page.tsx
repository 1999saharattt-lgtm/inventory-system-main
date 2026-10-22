import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "../../inspection/InspectionForm";

type PageProps = {
  params: Promise<{
    departmentId: string;
    year: string;
  }>;
  searchParams?: Promise<{
    fiscalYear?: string | string[];
  }>;
};

function formatDateOnly(value: Date | null): string {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInspectorIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function getSourceOrder(remark: string | null): number | null {
  const match = remark?.match(/SOURCE:DEPARTMENT_1:(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export default async function InspectionHistoryDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { departmentId: departmentIdParam, year: yearParam } = await params;
  const departmentId = Number(departmentIdParam);
  const requestedYear = Number(yearParam);

  if (
    !Number.isInteger(departmentId) ||
    departmentId <= 0 ||
    !Number.isInteger(requestedYear) ||
    requestedYear <= 0
  ) {
    notFound();
  }

  const buddhistYear = requestedYear < 2400 ? requestedYear + 543 : requestedYear;
  const christianYear = buddhistYear - 543;

  const query = searchParams ? await searchParams : {};
  const rawFiscalYear = Array.isArray(query.fiscalYear)
    ? query.fiscalYear[0]
    : query.fiscalYear;
  const selectedFiscalYear =
    rawFiscalYear && /^\d{4}$/.test(rawFiscalYear)
      ? Number(rawFiscalYear)
      : buddhistYear;
  const fiscalYearQuery = `?fiscalYear=${selectedFiscalYear}`;

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, name: true },
  });
  if (!department) notFound();

  const inspections = await prisma.assetInspection.findMany({
    where: {
      year: { in: [buddhistYear, christianYear] },
      asset: { departmentId },
    },
    include: {
      asset: {
        include: {
          section: { select: { id: true, name: true } },
          officer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
        },
      },
    },
    orderBy: { assetId: "asc" },
  });
  if (inspections.length === 0) notFound();

  const firstInspection = inspections[0];
  const rawInspectorIds = parseInspectorIds(firstInspection.inspectorIds);
  const inspectorIds = Array.from({ length: 5 }, (_, index) => rawInspectorIds[index] || "");

  // ใช้รายการที่บันทึกไว้ในประวัติปีนี้เท่านั้น ไม่ดึงครุภัณฑ์ใหม่เข้ามาปะปน
  const sortedInspections = [...inspections].sort((a, b) => {
    const aOrder = getSourceOrder(a.asset.remark);
    const bOrder = getSourceOrder(b.asset.remark);
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return a.assetId - b.assetId;
  });

  const assets = sortedInspections.map(({ asset }) => {
    const officerName = asset.officer
      ? [asset.officer.firstName, asset.officer.lastName]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

    return {
      id: asset.id,
      name: asset.name,
      category: asset.category,
      categoryDetail: asset.categoryDetail,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      governmentAssetNo: asset.governmentAssetNo,
      officeAssetNo: asset.officeAssetNo,
      quantity: asset.quantity,
      unit: asset.unit,
      responsibleName: officerName || asset.responsibleName?.trim() || null,
      departmentId: asset.departmentId,
      sectionId: asset.sectionId,
      officerId: asset.officerId,
      status: asset.status,
      purchaseDate: asset.purchaseDate,
      price: asset.price,
      location: department.name.trim(),
      remark: asset.remark,
      section: asset.section,
      officer: asset.officer,
    };
  });

  const rows = sortedInspections.map((inspection) => ({
    assetId: inspection.assetId,
    countedQty: inspection.countedQty == null ? "" : String(inspection.countedQty),
    accuracy: inspection.accuracy ?? "",
    status: inspection.status ?? "",
    remark: inspection.remark ?? "",
  }));

  // ให้ Dropdown ของคณะกรรมการในหน้า readOnly แสดงชื่อและตำแหน่งที่บันทึกไว้
  const officers = await prisma.officer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      type: true,
      departmentId: true,
      sectionId: true,
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  return (
    <AppPage>
      <AppPageHeader
        icon="📋"
        title="ข้อมูลการตรวจสอบครุภัณฑ์ประจำปี"
        subtitle={`${department.name} • ประจำปีงบประมาณ พ.ศ. ${buddhistYear}`}
        actions={
          <AppButton
            href={`/assets/inspection-history${fiscalYearQuery}`}
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      <InspectionForm
        key={`${department.id}-${buddhistYear}`}
        department={department}
        departments={departments}
        assets={assets}
        officers={officers}
        fiscalYear={String(buddhistYear)}
        initialData={{
          inspectionStartDate: formatDateOnly(firstInspection.inspectionStartDate),
          inspectionEndDate: formatDateOnly(firstInspection.inspectionEndDate),
          movementFiscalYear: String(buddhistYear),
          inspectorIds,
          rows,
        }}
        readOnly
        cancelHref={`/assets/inspection-history${fiscalYearQuery}`}
      />
    </AppPage>
  );
}
