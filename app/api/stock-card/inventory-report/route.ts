import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object") return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const data = payload as { fiscalYear?: unknown; rows?: unknown };
    const fiscalYear = Number(data.fiscalYear);
    if (!Number.isInteger(fiscalYear) || fiscalYear < 2569 || fiscalYear > 3000 || !Array.isArray(data.rows) || data.rows.length > 10000) {
      return NextResponse.json({ error: "ปีงบประมาณหรือรายการไม่ถูกต้อง" }, { status: 400 });
    }
    const allowedAccuracy = [null, "CORRECT", "INCORRECT"];
    const allowedStatus = [null, "IN_USE", "DAMAGED", "DETERIORATED", "UNNECESSARY"];
    const materialIds = new Set<number>();
    for (const raw of data.rows) {
      if (!raw || typeof raw !== "object") return NextResponse.json({ error: "รายการไม่ถูกต้อง" }, { status: 400 });
      const row = raw as Record<string, unknown>;
      const id = Number(row.materialId);
      if (!Number.isInteger(id) || id <= 0 || materialIds.has(id) || !(row.accuracy == null || (typeof row.accuracy === "string" && allowedAccuracy.includes(row.accuracy))) || !(row.status == null || (typeof row.status === "string" && allowedStatus.includes(row.status)))) {
        return NextResponse.json({ error: "ข้อมูลรายการไม่ถูกต้อง" }, { status: 400 });
      }
      materialIds.add(id);
    }
    const saved = await prisma.stockInventoryReportHistory.create({
      data: { fiscalYear, rows: JSON.parse(JSON.stringify(data.rows)) },
      select: { id: true },
    });
    return NextResponse.json({ id: saved.id });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลได้" }, { status: 500 });
  }
}
