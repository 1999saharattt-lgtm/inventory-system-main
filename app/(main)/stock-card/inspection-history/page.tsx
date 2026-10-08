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

function getCurrentFiscalYearThai(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return (month >= 10 ? year + 1 : year) + 543;
}

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
        ? { fiscalYear: selectedFiscalYear }
        : undefined,
    include: {
      _count: { select: { rows: true } },
    },
    orderBy: [
      { fiscalYear: "desc" },
      { inspectionDate: "desc" },
      { id: "desc" },
    ],
  });

  const backFiscalYear = selectedFiscalYear ?? currentFiscalYear;
  const backHref = `/stock-card?fiscalYear=${backFiscalYear}`;
  const newInspectionHref = `/stock-card/inspection?fiscalYear=${backFiscalYear}`;
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
            <AppButton href={newInspectionHref} variant="primary" size="md">
              🔎 ตรวจสอบบัญชีพัสดุประจำปี
            </AppButton>
            <AppButton href={backHref} variant="back" size="md">
              กลับ
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
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[560px] border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th scope="col" className={headerClassName}>ปีงบประมาณ</th>
                <th scope="col" className={headerClassName}>รายละเอียดข้อมูล</th>
                <th scope="col" className={headerClassName}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="border border-black px-4 py-12 text-center text-base font-bold !text-slate-500">
                    {selectedFiscalYear !== null
                      ? `ยังไม่มีประวัติการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${selectedFiscalYear}`
                      : "ยังไม่มีประวัติการตรวจสอบบัญชีพัสดุ"}
                  </td>
                </tr>
              ) : (
                inspections.map((inspection, index) => {
                  const detailHref = `/stock-card/inspection-history/${inspection.fiscalYear}`;
                  return (
                    <tr
                      key={inspection.id}
                      className={`transition-colors duration-150 hover:bg-blue-50/70 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}
                    >
                      <td className={`${cellClassName} text-base font-extrabold !text-slate-900`}>
                        {inspection.fiscalYear}
                      </td>
                      <td className={cellClassName}>
                        <div className="flex justify-center">
                          <AppButton href={detailHref} variant="success" size="sm">
                            เปิด
                          </AppButton>
                        </div>
                      </td>
                      <td className={cellClassName}>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <AppButton href={detailHref} variant="success" size="sm">
                            แก้ไข
                          </AppButton>
                          <AppButton type="button" variant="danger" size="sm" disabled>
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
