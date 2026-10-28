import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

export const dynamic = "force-dynamic";
type Row = { materialId: number; name: string; unit: string; latestPrice: number | null; closingBalance: number; accuracy: string | null; status: string | null };
const statusLabel: Record<string, string> = { IN_USE: "ใช้การได้", DAMAGED: "ชำรุด", DETERIORATED: "เสื่อมสภาพ", UNNECESSARY: "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงาน" };
export default async function InventoryReportHistoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) notFound();
  const report = await prisma.stockInventoryReportHistory.findUnique({ where: { id: reportId } });
  if (!report) notFound();
  const rows = report.rows as unknown as Row[];
  return <AppPage>
    <AppPageHeader icon="📋" title="ประวัติรายงานบัญชีพัสดุคงคลัง" subtitle={`ประจำปีงบประมาณ พ.ศ. ${report.fiscalYear}`} actions={<AppButton href={`/stock-card/inspection-history/materials?fiscalYear=${report.fiscalYear}&type=inventory`} variant="back" size="md">กลับ</AppButton>} />
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead className="bg-slate-800 text-white"><tr>{["ลำดับ", "ชื่อหรือชนิดวัสดุ", "หน่วยนับ", "ราคาต่อหน่วย", "คงเหลือ", "ผลการตรวจสอบ", "สถานะการใช้งาน"].map(label => <th key={label} className="border border-black p-3 text-center">{label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row.materialId}-${index}`} className="even:bg-slate-50">
          <td className="border border-black p-2 text-center">{index + 1}</td><td className="border border-black p-2">{row.name}</td><td className="border border-black p-2 text-center">{row.unit}</td><td className="border border-black p-2 text-center">{row.latestPrice == null ? "-" : Number(row.latestPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td><td className="border border-black p-2 text-center">{row.closingBalance}</td><td className="border border-black p-2 text-center">{row.accuracy === "CORRECT" ? "ถูกต้อง" : row.accuracy === "INCORRECT" ? "ไม่ถูกต้อง" : ""}</td><td className="border border-black p-2 text-center">{row.status ? statusLabel[row.status] || "" : ""}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </AppPage>;
}
