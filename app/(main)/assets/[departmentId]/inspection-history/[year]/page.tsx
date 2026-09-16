import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${
    date.getFullYear() + 543
  }`;
}

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getOneYearBefore(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  date.setFullYear(date.getFullYear() - 1);

  return formatDateOnly(date);
}

function getOneDayBefore(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() - 1);

  return formatDateOnly(date);
}

function getFiscalYear(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return String(month >= 10 ? year + 1 + 543 : year + 543);
}

function getCategoryUnit(category: string) {
  const categoryUnit: Record<string, string> = {
    COMPUTER: "เครื่อง",
    DESKTOP: "เครื่อง",
    LAPTOP: "เครื่อง",
    PRINTER: "เครื่อง",
    TELEPHONE: "เครื่อง",
    AIR_CONDITIONER: "เครื่อง",
    FAN: "เครื่อง",
    CHAIR: "ตัว",
    DESK: "ตัว",
    CABINET: "ตู้",
    TABLE: "ตัว",
    OTHER: "รายการ",
  };

  return categoryUnit[category] || "รายการ";
}

function parseInspectorIds(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
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

function normalizeFiscalYear(value: number | string) {
  const year = Number(value);

  if (!Number.isFinite(year)) {
    return String(value);
  }

  return year < 2400 ? String(year + 543) : String(year);
}

type PageProps = {
  params: Promise<{
    departmentId: string;
    year: string;
  }>;
};

export default async function InspectionHistoryDetailPage({
  params,
}: PageProps) {
  const { departmentId: departmentIdParam, year: yearParam } =
    await params;

  const departmentId = Number(departmentIdParam);
  const requestedYear = Number(yearParam);

  if (
    !Number.isInteger(departmentId) ||
    departmentId <= 0 ||
    !Number.isInteger(requestedYear)
  ) {
    notFound();
  }

  /*
   * รองรับ URL ได้ทั้ง
   * /2569  -> แปลงเป็น 2026 สำหรับค้นฐานข้อมูล
   * /2026  -> ใช้ 2026 ได้โดยตรง
   */
  const databaseYear =
    requestedYear >= 2400
      ? requestedYear - 543
      : requestedYear;

  const displayFiscalYear = normalizeFiscalYear(databaseYear);

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
      year: databaseYear,
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

  const firstInspection = inspections[0];

  /*
   * ใน Prisma schema ปัจจุบัน AssetInspection ไม่มี
   * accountStartDate
   * accountEndDate
   * movementFiscalYear
   *
   * จึงคำนวณจากวันที่ตรวจสอบตาม logic ของ InspectionForm
   */
  const inspectionStartDate = formatDateOnly(
    firstInspection.inspectionStartDate
  );

  const inspectionEndDate = formatDateOnly(
    firstInspection.inspectionEndDate
  );

  const accountStartDate = getOneYearBefore(
    firstInspection.inspectionStartDate
  );

  const accountEndDate = getOneDayBefore(
    firstInspection.inspectionEndDate
  );

  const movementFiscalYear =
    getFiscalYear(firstInspection.inspectionStartDate) ||
    displayFiscalYear;

  const rawInspectorIds = parseInspectorIds(
    firstInspection.inspectorIds
  );

  const inspectorIds = Array.from(
    { length: 5 },
    (_, index) => rawInspectorIds[index] || ""
  );

  const numericInspectorIds = rawInspectorIds
    .map(Number)
    .filter((value) => Number.isInteger(value));

  const officers = numericInspectorIds.length
    ? await prisma.officer.findMany({
        where: {
          id: {
            in: numericInspectorIds,
          },
        },
        include: {
          department: true,
          section: true,
        },
      })
    : [];

  const officerMap = new Map(
    officers.map((officer) => [String(officer.id), officer])
  );

  const assets = inspections.map(
    (inspection) => inspection.asset
  );

  const rows = inspections.map((inspection) => ({
    assetId: inspection.assetId,
    countedQty: String(inspection.countedQty ?? ""),
    accuracy: inspection.accuracy || "",
    status: inspection.status || "",
    remark: inspection.remark || "",
  }));

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* =====================================================
          ข้อมูลการตรวจสอบ
      ===================================================== */}

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold !text-white">
              ข้อมูลการตรวจสอบ
            </h1>

            <p className="mt-1 text-base font-semibold !text-slate-200">
              {department.name} · ประจำปีงบประมาณ พ.ศ.{" "}
              {displayFiscalYear}
            </p>
          </div>

          <ExportInspectionPdf
            department={department}
            assets={assets}
            rows={rows}
            inspectorIds={inspectorIds}
            inspectionStartDate={inspectionStartDate}
            inspectionEndDate={inspectionEndDate}
            accountStartDate={accountStartDate}
            accountEndDate={accountEndDate}
            movementFiscalYear={movementFiscalYear}
            officers={officers}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-lg font-extrabold !text-white">
              เริ่มดำเนินการตรวจสอบวันที่
            </div>

            <div className="min-h-[46px] rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
              {formatThaiDate(
                firstInspection.inspectionStartDate
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-lg font-extrabold !text-white">
              ตรวจสอบแล้วเสร็จวันที่
            </div>

            <div className="min-h-[46px] rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
              {formatThaiDate(
                firstInspection.inspectionEndDate
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ตารางรายละเอียด
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2300px] border-collapse text-[13px] leading-tight">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รายการ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="whitespace-nowrap">
                    ณ วันที่ {formatThaiDate(accountStartDate)}
                  </div>
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    รายการเคลื่อนไหวระหว่าง
                  </div>

                  <div className="whitespace-nowrap">
                    ปีงบประมาณ พ.ศ. {movementFiscalYear}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="whitespace-nowrap">
                    ณ วันที่ {formatThaiDate(accountEndDate)}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  จำนวนที่ตรวจนับได้
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ผลการตรวจนับถูกต้องตรงกับ
                  </div>

                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>
                </th>

                <th
                  colSpan={4}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  สภาพครุภัณฑ์ที่ตรวจนับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <th className="border border-black px-2 py-2 text-center align-middle font-extrabold !text-white">
                  รับ
                </th>

                <th className="border border-black px-2 py-2 text-center align-middle font-extrabold !text-white">
                  จ่าย
                </th>

                <th className="border border-black px-2 py-2 text-center align-middle font-extrabold !text-white">
                  ถูกต้อง
                </th>

                <th className="border border-black px-2 py-2 text-center align-middle font-extrabold !text-white">
                  ไม่ถูกต้อง
                </th>

                <th className="min-w-[105px] border border-black px-2 py-2 text-center align-middle font-extrabold !text-white whitespace-nowrap">
                  ใช้งานปกติ
                </th>

                <th className="min-w-[70px] border border-black px-2 py-2 text-center align-middle font-extrabold !text-white whitespace-nowrap">
                  ชำรุด
                </th>

                <th className="min-w-[95px] border border-black px-2 py-2 text-center align-middle font-extrabold !text-white whitespace-nowrap">
                  เสื่อมสภาพ
                </th>

                <th className="min-w-[125px] border border-black px-2 py-2 text-center align-middle font-extrabold !text-white whitespace-nowrap">
                  ไม่จำเป็นต้องใช้
                </th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection, index) => {
                const asset = inspection.asset;

                const responsible = asset.officer
                  ? `${asset.officer.firstName} ${asset.officer.lastName}`
                  : "-";

                return (
                  <tr
                    key={inspection.id}
                    className="bg-white text-sm font-medium text-slate-900"
                  >
                    <td className="border border-black px-2 py-3 text-center align-middle">
                      {index + 1}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      {asset.governmentAssetNo || "-"}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      {asset.officeAssetNo || "-"}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      {responsible}
                    </td>

                    <td className="border border-black px-2 py-3 text-left align-middle">
                      {asset.name}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      {getCategoryUnit(asset.category)}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      1
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      -
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      -
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle">
                      1
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle font-semibold">
                      {inspection.countedQty ?? "-"}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                      {inspection.accuracy === "CORRECT"
                        ? "✓"
                        : ""}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                      {inspection.accuracy === "INCORRECT"
                        ? "✓"
                        : ""}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                      {inspection.status === "IN_USE"
                        ? "✓"
                        : ""}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                      {inspection.status === "DAMAGED"
                        ? "✓"
                        : ""}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                      {inspection.status === "DETERIORATED"
                        ? "✓"
                        : ""}
                    </td>

                    <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                      {inspection.status === "UNUSABLE"
                        ? "✓"
                        : ""}
                    </td>

                    <td className="border border-black px-2 py-3 text-left align-middle">
                      {inspection.remark || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          รายชื่อผู้ตรวจสอบ
      ===================================================== */}

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <h2 className="mb-6 text-2xl font-extrabold !text-white">
          รายชื่อผู้ตรวจสอบ
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {inspectorIds.map((inspectorId, index) => {
            const officer = officerMap.get(inspectorId);

            return (
              <div key={index}>
                <div className="mb-2 text-lg font-extrabold !text-white">
                  ผู้ตรวจสอบคนที่ {index + 1}
                </div>

                <div className="min-h-[46px] rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900">
                  {officer
                    ? `${officer.firstName} ${officer.lastName}`
                    : "-"}
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-300">
                  ตำแหน่ง: {officer?.position || "-"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          Actions
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/assets/inspection-history"
          className="rounded-xl bg-slate-200 px-4 py-2.5 text-base font-extrabold text-slate-800 shadow-lg transition hover:scale-[1.02] hover:bg-slate-300"
        >
          กลับ
        </Link>

        <Link
          href={`/assets/${department.id}/inspection-history/${databaseYear}/edit`}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-base font-extrabold !text-white shadow-lg transition hover:scale-[1.02] hover:from-amber-600 hover:to-orange-600"
        >
          แก้ไข
        </Link>

        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-4 py-2.5 text-base font-extrabold !text-white shadow-lg transition hover:scale-[1.02] hover:from-red-800 hover:to-red-600"
          title="ขั้นถัดไปจะเชื่อมการลบพร้อมกล่องยืนยัน"
        >
          ลบ
        </button>
      </div>
    </div>
  );
}