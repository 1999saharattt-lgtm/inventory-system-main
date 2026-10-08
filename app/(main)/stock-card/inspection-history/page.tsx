
import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    fiscalYear?: string;
  }>;
};

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

function getCurrentFiscalYearThai(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
  });

  const parts = formatter.formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  return (month >= 10 ? year + 1 : year) + 543;
}

function formatInspectionDate(value: Date | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getUTCDate();
  const month = thaiMonths[date.getUTCMonth()];
  const year = date.getUTCFullYear() + 543;

  return `${day} ${month} ${year}`;
}

function parseInspectorNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item ?? "").trim())
          .filter(Boolean);
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

const tableHeaders = [
  "ลำดับ",
  "ปีงบประมาณ",
  "วันที่เริ่มตรวจสอบ",
  "วันที่ตรวจสอบแล้วเสร็จ",
  "จำนวนรายการ",
  "จำนวนคณะกรรมการตรวจสอบ",
  "จัดการ",
];

const headerClassName = [
  "whitespace-nowrap",
  "border border-black",
  "bg-gradient-to-r from-slate-800 to-slate-700",
  "px-4 py-4",
  "text-center text-sm font-extrabold !text-white",
].join(" ");

const cellClassName = [
  "border border-black",
  "px-4 py-4",
  "text-center align-middle",
  "text-sm font-semibold !text-slate-700",
].join(" ");

export default async function StockCardInspectionHistoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const currentFiscalYear = getCurrentFiscalYearThai();

  const requestedFiscalYear = Number(params.fiscalYear);

  const selectedFiscalYear =
    params.fiscalYear &&
    Number.isInteger(requestedFiscalYear) &&
    requestedFiscalYear >= 2400 &&
    requestedFiscalYear <= 3000
      ? requestedFiscalYear
      : null;

  const inspections = await prisma.stockCardInspection.findMany({
    where:
      selectedFiscalYear !== null
        ? {
            fiscalYear: selectedFiscalYear,
          }
        : undefined,
    include: {
      _count: {
        select: {
          rows: true,
        },
      },
    },
    orderBy: [
      {
        fiscalYear: "desc",
      },
      {
        inspectionDate: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  const backFiscalYear =
    selectedFiscalYear ?? currentFiscalYear;

  const backHref =
    `/stock-card?fiscalYear=${backFiscalYear}`;

  const newInspectionHref =
    `/stock-card/inspection?fiscalYear=${backFiscalYear}`;

  const clearFilterHref =
    "/stock-card/inspection-history";

  const tableSubtitle =
    selectedFiscalYear !== null
      ? `ประวัติการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${selectedFiscalYear}`
      : "ประวัติการตรวจสอบบัญชีพัสดุประจำปีทั้งหมด";

  return (
    <AppPage>
      <AppPageHeader
        icon="🗂️"
        title="ประวัติการตรวจสอบบัญชีพัสดุประจำปี"
        subtitle="ตรวจสอบและเรียกดูผลการตรวจสอบบัญชีพัสดุที่บันทึกไว้"
        actions={
          <>
            <AppButton
              href={newInspectionHref}
              variant="primary"
              size="md"
            >
              🔎 ตรวจสอบบัญชีพัสดุประจำปี
            </AppButton>

            <AppButton
              href={backHref}
              variant="back"
              size="md"
            >
              ← กลับ
            </AppButton>
          </>
        }
      />

      <AppTableCard
        title="รายการประวัติการตรวจสอบ"
        subtitle={tableSubtitle}
        badge={`${inspections.length.toLocaleString("th-TH")} รายการ`}
        className="w-full min-w-0"
      >
        {selectedFiscalYear !== null && (
          <div className="mb-4 flex w-full min-w-0 flex-col gap-3 rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-extrabold !text-slate-900">
                กำลังแสดงปีงบประมาณ {selectedFiscalYear}
              </p>

              <p className="mt-1 text-xs font-semibold !text-slate-500">
                แสดงเฉพาะประวัติการตรวจสอบของปีงบประมาณที่เลือก
              </p>
            </div>

            <AppButton
              href={clearFilterHref}
              variant="secondary"
              size="sm"
            >
              แสดงประวัติทั้งหมด
            </AppButton>
          </div>
        )}

        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1100px] border-collapse bg-white text-sm">
            <thead>
              <tr>
                {tableHeaders.map((title) => (
                  <th
                    key={title}
                    scope="col"
                    className={headerClassName}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {inspections.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-black px-4 py-12 text-center text-base font-bold !text-slate-500"
                  >
                    {selectedFiscalYear !== null
                      ? `ยังไม่มีประวัติการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${selectedFiscalYear}`
                      : "ยังไม่มีประวัติการตรวจสอบบัญชีพัสดุ"}
                  </td>
                </tr>
              ) : (
                inspections.map((inspection, index) => {
                  const inspectorNames = parseInspectorNames(
                    inspection.inspectorNames
                  );

                  const detailHref =
                    `/stock-card/inspection-history/${inspection.fiscalYear}`;

                  return (
                    <tr
                      key={inspection.id}
                      className={`transition-colors duration-150 hover:bg-blue-50/70 ${
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/70"
                      }`}
                    >
                      <td className={cellClassName}>
                        {(index + 1).toLocaleString("th-TH")}
                      </td>

                      <td className={`${cellClassName} text-base font-extrabold !text-slate-900`}>
                        {inspection.fiscalYear}
                      </td>

                      <td className={`${cellClassName} whitespace-nowrap`}>
                        {formatInspectionDate(
                          inspection.inspectionDate
                        )}
                      </td>

                      <td className={`${cellClassName} whitespace-nowrap`}>
                        -
                      </td>

                      <td className={`${cellClassName} tabular-nums`}>
                        {inspection._count.rows.toLocaleString(
                          "th-TH"
                        )}{" "}
                        รายการ
                      </td>

                      <td className={cellClassName}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-extrabold !text-slate-900">
                            {inspectorNames.length.toLocaleString(
                              "th-TH"
                            )}{" "}
                            คน
                          </span>
                        </div>
                      </td>

                      <td className={`${cellClassName} whitespace-nowrap`}>
                        <div className="flex items-center justify-center gap-2">
                          <AppButton
                            href={detailHref}
                            variant="secondary"
                            size="sm"
                          >
                            แก้ไข
                          </AppButton>

                          <AppButton
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled
                          >
                            ลบ
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}
