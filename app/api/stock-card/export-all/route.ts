import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORY_ORDER = ["OFFICE", "COMPUTER", "ELECTRIC", "PRINTING", "HOUSEHOLD", "VEHICLE"];
type Lot = { id: number; qty: number; manufacture: Date | null; expiry: Date | null };
function sortLots(lots: Lot[]) {
  return [...lots].sort((a, b) => {
    if (!!a.expiry !== !!b.expiry) return a.expiry ? -1 : 1;
    if (a.expiry && b.expiry && +a.expiry !== +b.expiry) return +a.expiry - +b.expiry;
    if (!!a.manufacture !== !!b.manufacture) return a.manufacture ? -1 : 1;
    if (a.manufacture && b.manufacture && +a.manufacture !== +b.manufacture) return +a.manufacture - +b.manufacture;
    return a.id - b.id;
  });
}
function fiscalBounds(fy: number) {
  return {
    start: new Date(Date.UTC(fy - 544, 9, 1)),
    end: new Date(Date.UTC(fy - 543, 9, 1)),
  };
}
export async function GET(request: NextRequest) {
  try {
    const fiscalYear = Number(request.nextUrl.searchParams.get("fiscalYear"));
    if (!Number.isInteger(fiscalYear) || fiscalYear < 2569 || fiscalYear > 3000) {
      return NextResponse.json({ error: "ปีงบประมาณไม่ถูกต้อง" }, { status: 400 });
    }
    const { start, end } = fiscalBounds(fiscalYear);
    const materials = await prisma.material.findMany({
      include: {
        vendor: true,
        receiveItems: {
          where: { receive: { receiveDate: { lt: end } } },
          include: { receive: { include: { vendor: true } } },
          orderBy: [{ receive: { receiveDate: "asc" } }, { id: "asc" }],
        },
        issueItems: {
          where: { issue: { issueDate: { lt: end }, status: "APPROVED" } },
          include: { issue: { include: { department: true } } },
          orderBy: [{ issue: { issueDate: "asc" } }, { id: "asc" }],
        },
      },
      orderBy: { code: "asc" },
    });
    // เงื่อนไขการรวมบัญชีพัสดุเท่านั้น: ไม่เปลี่ยนข้อมูล Stock Card รายวัสดุ
    const includedMaterials = materials.filter((material) => {
      const name = material.name.trim();
      if (/\(\s*สสส\.\s*\)\s*$/u.test(name)) return false;
      if (material.category === "ELECTRIC" && material.code === "ELE-0003" && name === "ถ่านชาร์จ ขนาด AA (Rechargeable Battery)") return false;
      if (material.category === "ELECTRIC" && name.includes("ถ่านกระดุม")) return false;
      return true;
    });
    const output = includedMaterials.map((material) => {
      const events = [
        ...material.receiveItems.map((item) => ({ type: "RECEIVE" as const, date: item.receive.receiveDate, id: item.id, item })),
        ...material.issueItems.map((item) => ({ type: "ISSUE" as const, date: item.issue.issueDate, id: item.id, item })),
      ].sort((a, b) => +a.date - +b.date || (a.type === b.type ? a.id - b.id : a.type === "RECEIVE" ? -1 : 1));
      const lots: Lot[] = [];
      let balance = 0;
      let lastPrice = 0;
      let lastVendor = material.vendor?.name ?? "-";
      let openingBalance = 0;
      let openingPrice = 0;
      let openingVendor = "-";
      let captured = false;
      const rows: Array<{ date: string; documentNo: string; owner: string; unitPrice: number; receiveQty: number; issueQty: number; balance: number; manufacture: string | null; expiry: string | null; type: string }> = [];
      for (const event of events) {
        if (!captured && +event.date >= +start) {
          openingBalance = balance;
          openingPrice = lastPrice;
          openingVendor = lastVendor;
          captured = true;
        }
        if (event.type === "RECEIVE") {
          const item = event.item;
          const qty = Number(item.qty ?? 0);
          const price = Number(item.unitPrice ?? 0);
          balance += qty;
          lastPrice = price;
          lastVendor = item.receive.vendor?.name ?? lastVendor;
          lots.push({ id: item.id, qty, manufacture: item.manufacture, expiry: item.expiry });
          if (+event.date >= +start) rows.push({ date: event.date.toISOString(), documentNo: item.receive.documentNo, owner: item.receive.vendor?.name ?? "-", unitPrice: price, receiveQty: qty, issueQty: 0, balance, manufacture: item.manufacture?.toISOString() ?? null, expiry: item.expiry?.toISOString() ?? null, type: "RECEIVE" });
        } else {
          const item = event.item;
          const qty = item.issuedQty == null ? Number(item.qty ?? 0) : Number(item.issuedQty);
          let remaining = qty;
          let firstLot: Lot | null = null;
          for (const lot of sortLots(lots.filter((l) => l.qty > 0))) {
            if (remaining <= 0) break;
            const taken = Math.min(remaining, lot.qty);
            if (taken <= 0) continue;
            if (!firstLot) firstLot = lot;
            lot.qty -= taken;
            remaining -= taken;
          }
          balance -= qty;
          if (+event.date >= +start) rows.push({ date: event.date.toISOString(), documentNo: item.issue.documentNo, owner: item.issue.department?.name ?? "-", unitPrice: lastPrice, receiveQty: 0, issueQty: qty, balance, manufacture: (firstLot?.manufacture ?? item.manufacture)?.toISOString() ?? null, expiry: (firstLot?.expiry ?? item.expiry)?.toISOString() ?? null, type: "ISSUE" });
        }
      }
      if (!captured) { openingBalance = balance; openingPrice = lastPrice; openingVendor = lastVendor; }
      // FY 2569: retain all actual movement rows, never manufacture an opening row.
      // FY 2570+: use the same virtual opening row as the individual Stock Card.
      if (fiscalYear >= 2570 && openingBalance !== 0 && events.some((e) => +e.date < +start)) {
        rows.unshift({ date: start.toISOString(), documentNo: "ยอดยกเข้าระบบ", owner: openingVendor, unitPrice: openingPrice, receiveQty: openingBalance, issueQty: 0, balance: openingBalance, manufacture: null, expiry: null, type: "OPENING_BALANCE" });
      }
      const latestReceive = material.receiveItems.at(-1);
      return {
        id: material.id, code: material.code, name: material.name, category: material.category,
        unit: material.category === "ELECTRIC" && material.name.trim() === "ถ่านชาร์จ ขนาด AAA (Rechargeable Battery)" ? "แพ็ค" : material.unit,
        vendor: latestReceive?.receive.vendor?.name ?? material.vendor?.name ?? "-",
        latestPrice: latestReceive ? Number(latestReceive.unitPrice) : Number(material.latestPrice ?? 0),
        rows,
      };
    }).sort((a, b) => {
      const ca = CATEGORY_ORDER.indexOf(a.category);
      const cb = CATEGORY_ORDER.indexOf(b.category);
      return (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb) || a.code.localeCompare(b.code, "th") || a.id - b.id;
    });
    return NextResponse.json({ fiscalYear, materials: output });
  } catch (error) {
    console.error("Export all stock cards failed", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลบัญชีพัสดุได้" }, { status: 500 });
  }
}
