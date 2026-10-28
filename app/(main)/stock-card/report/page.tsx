import { prisma } from "@/lib/prisma";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import StockInventoryReportView from "./StockInventoryReportView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { searchParams: Promise<{ fiscalYear?: string }> };
const BASE_FISCAL_YEAR = 2569;
const MAX_FISCAL_YEAR = 3000;
const CATEGORY_ORDER = ["OFFICE", "COMPUTER", "ELECTRIC", "HOUSEHOLD", "VEHICLE", "PRINTING"];

function getThailandDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const part = (name: string) => Number(parts.find(item => item.type === name)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}
function getCurrentFiscalYearThai() {
  const { year, month } = getThailandDateParts(new Date());
  return year + 543 + (month >= 10 ? 1 : 0);
}
function getFiscalYearRange(fiscalYear: number) {
  const gregorian = fiscalYear - 543;
  return {
    startDate: new Date(Date.UTC(gregorian - 1, 9, 1)),
    endDate: new Date(Date.UTC(gregorian, 9, 1)),
  };
}
function getTodayEndExclusive() {
  const { year, month, day } = getThailandDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day + 1));
}
function normalizeDocumentNo(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, "");
}
function safeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
function getActualIssuedQty(item: { qty: number | null; issuedQty: number | null }) {
  return item.issuedQty == null ? safeNumber(item.qty) : safeNumber(item.issuedQty);
}
function isDateInRange(date: Date, start: Date, end: Date) {
  const time = new Date(date).getTime();
  return time >= start.getTime() && time < end.getTime();
}

export default async function StockCardReportPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const requestedYear = Number(query.fiscalYear);
  const fiscalYear = Number.isInteger(requestedYear) && requestedYear >= BASE_FISCAL_YEAR && requestedYear <= MAX_FISCAL_YEAR
    ? requestedYear : getCurrentFiscalYearThai();
  const { startDate, endDate } = getFiscalYearRange(fiscalYear);
  const todayEnd = getTodayEndExclusive();
  const currentEnd = todayEnd.getTime() < endDate.getTime() ? todayEnd : endDate;
  const materials = await prisma.material.findMany({
    select: {
      id: true, code: true, name: true, unit: true, category: true, latestPrice: true,
      receiveItems: {
        where: { receive: { receiveDate: { lt: endDate } } },
        select: { id: true, qty: true, unitPrice: true, receive: { select: { receiveDate: true, documentNo: true } } },
      },
      issueItems: {
        where: { issue: { status: "APPROVED", issueDate: { lt: endDate } } },
        select: { qty: true, issuedQty: true, issue: { select: { issueDate: true, documentNo: true } } },
      },
    },
    orderBy: { code: "asc" },
  });

  const rows = materials.filter(material => {
    const name = material.name.trim();
    if (/\(\s*สส\.?\s*\)\s*$/u.test(name)) return false;
    if (material.category === "ELECTRIC") {
      if (material.code === "ELE-0003") return false;
      if (name.includes("ถ่านกระดุม")) return false;
    }
    return true;
  }).map(material => {
    const initialBalance = material.receiveItems
      .filter(item => normalizeDocumentNo(item.receive.documentNo) === "ยอดยกเข้าระบบ")
      .reduce((sum, item) => sum + safeNumber(item.qty), 0);
    const receiveItems = material.receiveItems.filter(item => normalizeDocumentNo(item.receive.documentNo).startsWith("ร."));
    const issueItems = material.issueItems.filter(item => normalizeDocumentNo(item.issue.documentNo).startsWith("จ."));
    // ยอดยกมา ณ 1 ต.ค. ของปีที่เลือก = ยอดตั้งต้น + รับสะสมก่อนปี - จ่ายสะสมก่อนปี
    const previousReceive = receiveItems.filter(item => item.receive.receiveDate.getTime() < startDate.getTime())
      .reduce((sum, item) => sum + safeNumber(item.qty), 0);
    const previousIssue = issueItems.filter(item => item.issue.issueDate.getTime() < startDate.getTime())
      .reduce((sum, item) => sum + getActualIssuedQty(item), 0);
    const openingBalance = initialBalance + previousReceive - previousIssue;
    const receiveQty = receiveItems.filter(item => isDateInRange(item.receive.receiveDate, startDate, endDate))
      .reduce((sum, item) => sum + safeNumber(item.qty), 0);
    const issueQty = issueItems.filter(item => isDateInRange(item.issue.issueDate, startDate, endDate))
      .reduce((sum, item) => sum + getActualIssuedQty(item), 0);
    const currentReceive = receiveItems.filter(item => isDateInRange(item.receive.receiveDate, startDate, currentEnd))
      .reduce((sum, item) => sum + safeNumber(item.qty), 0);
    const currentIssue = issueItems.filter(item => isDateInRange(item.issue.issueDate, startDate, currentEnd))
      .reduce((sum, item) => sum + getActualIssuedQty(item), 0);
    return {
      materialId: material.id,
      code: material.code,
      name: material.name,
      unit: material.category === "ELECTRIC" && material.name.trim() === "ถ่านชาร์จ ขนาด AAA (Rechargeable Battery)"
        ? "แพ็ค" : material.unit.trim() === "ห่อ" ? "แพ็ค" : material.unit,
      category: String(material.category),
      latestPrice: (() => {
        const latestAsOfFiscalYear = material.receiveItems
          .filter(item => item.receive.receiveDate.getTime() < endDate.getTime())
          .sort((a, b) => b.receive.receiveDate.getTime() - a.receive.receiveDate.getTime() || b.id - a.id)[0];
        return latestAsOfFiscalYear ? safeNumber(latestAsOfFiscalYear.unitPrice) : null;
      })(),
      openingBalance,
      receiveQty,
      issueQty,
      closingBalance: openingBalance + currentReceive - currentIssue,
    };
  }).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    const orderA = ai >= 0 ? ai : Number.MAX_SAFE_INTEGER;
    const orderB = bi >= 0 ? bi : Number.MAX_SAFE_INTEGER;
    return orderA - orderB || a.code.localeCompare(b.code, "th", { numeric: true, sensitivity: "base" });
  });

  return (
    <AppPage>
      <AppPageHeader
        icon="📋"
        title="รายงานบัญชีพัสดุคงคลัง"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        actions={<AppButton href={`/stock-card?fiscalYear=${fiscalYear}`} variant="back" size="md">กลับ</AppButton>}
      />
      <StockInventoryReportView fiscalYear={fiscalYear}
        startShortYear={String((fiscalYear - 1) % 100).padStart(2, "0")}
        endShortYear={String(fiscalYear % 100).padStart(2, "0")}
        materials={rows} />
    </AppPage>
  );
}
