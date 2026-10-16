import { prisma } from "@/lib/prisma";
import ComputerLotLabelsPdf from "./ComputerLotLabelsPdf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LotLabel = {
  receiveItemId: number;
  receiveId: number;
  materialId: number;
  code: string;
  name: string;
  unit: string;
  balance: number;
  manufacture: string | null;
  expiry: string | null;
  receiveDate: string | null;
  documentNo: string;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toThailandDateOnly(value: Date | null): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
}

function isPrinterConsumable(name: string, code: string): boolean {
  const searchText = `${normalizeSearchText(code)} ${normalizeSearchText(name)}`;
  const keywords = [
    "หมึก", "น้ำหมึก", "ตลับหมึก", "หมึกพิมพ์", "หมึกเครื่องพิมพ์",
    "โทนเนอร์", "ตลับโทนเนอร์", "ดรัม", "ชุดดรัม", "ตลับดรัม",
    "ink", "inkjet", "ink cartridge", "toner", "toner cartridge",
    "cartridge", "drum", "drum unit",
  ];
  if (keywords.some((keyword) => searchText.includes(keyword))) return true;
  return [
    /\bcli[\s-]?\d+[a-z]*\b/i,
    /\bpgi[\s-]?\d+[a-z]*\b/i,
    /\bpg[\s-]?\d+[a-z]*\b/i,
    /\bcl[\s-]?\d+[a-z]*\b/i,
    /\b(?:cf|ce|cc|q)[\s-]?\d+[a-z]*\b/i,
    /\bw[\s-]?\d{4,}[a-z]*\b/i,
    /\btn[\s-]?\d+[a-z]*\b/i,
    /\bdr[\s-]?\d+[a-z]*\b/i,
    /\blc[\s-]?\d+[a-z]*\b/i,
    /\bmlt[\s-]?[a-z0-9-]+\b/i,
    /\bt[a-z0-9]{3,}\b/i,
    /\bc13[a-z0-9-]+\b/i,
    /\bsp[\s-]?\d{3,}[a-z]*\b/i,
    /\bct[\s-]?\d{3,}[a-z]*\b/i,
    /\btk[\s-]?\d+[a-z]*\b/i,
  ].some((pattern) => pattern.test(searchText));
}

function currentThailandMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

type PageProps = {
  searchParams?: Promise<{ month?: string }> | { month?: string };
};

export default async function ComputerLotLabelsPdfPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedMonth = params?.month;
  const selectedMonth = requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
    ? requestedMonth
    : currentThailandMonth();

  // Read all materials independently from lots so headings do not disappear
  // when there are no receipts in the selected month.
  const materials = (await prisma.material.findMany({
    where: { category: { in: ["COMPUTER", "PRINTING"] } },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  }))
    .filter((item) => isPrinterConsumable(item.name, item.code))
    .map((item) => ({ materialId: item.id, code: item.code, name: item.name }));

  const allowedIds = new Set(materials.map((item) => item.materialId));

  // Preserve existing stock logic: ReceiveItem.balance, not original qty.
  const receiveItems = await prisma.receiveItem.findMany({
    where: {
      balance: { gt: 0 },
      material: { category: { in: ["COMPUTER", "PRINTING"] } },
    },
    select: {
      id: true, receiveId: true, materialId: true, balance: true,
      manufacture: true, expiry: true,
      material: { select: { code: true, name: true, unit: true } },
      receive: { select: { receiveDate: true, documentNo: true } },
    },
    orderBy: [{ materialId: "asc" }, { receiveId: "asc" }, { id: "asc" }],
  });

  const lots: LotLabel[] = receiveItems
    .filter((item) => {
      if (!allowedIds.has(item.materialId)) return false;
      const received = toThailandDateOnly(item.receive?.receiveDate ?? null);
      return received?.slice(0, 7) === selectedMonth;
    })
    .map((item) => ({
      receiveItemId: item.id,
      receiveId: item.receiveId,
      materialId: item.materialId,
      code: item.material.code,
      name: item.material.name,
      unit: item.material.unit,
      balance: Math.max(0, Math.floor(Number(item.balance ?? 0))),
      manufacture: toThailandDateOnly(item.manufacture),
      expiry: toThailandDateOnly(item.expiry),
      receiveDate: toThailandDateOnly(item.receive?.receiveDate ?? null),
      documentNo: item.receive?.documentNo ?? "",
    }));

  return <ComputerLotLabelsPdf lots={lots} materials={materials} />;
}
