import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = (await cookies()).get("session")?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const fiscalYear = Number(new URL(request.url).searchParams.get("fiscalYear"));
  if (!Number.isInteger(fiscalYear) || fiscalYear < 2569 || fiscalYear > 3000) {
    return NextResponse.json({ error: "ปีงบประมาณไม่ถูกต้อง" }, { status: 400 });
  }

  const from = new Date(Date.UTC(fiscalYear - 544, 8, 30, 17)); // 1 ต.ค. 00:00 น. ประเทศไทย
  const to = new Date(Date.UTC(fiscalYear - 543, 8, 30, 17));

  try {
    const materials = await prisma.material.findMany({
      include: {
        vendor: { select: { name: true } },
        transactions: {
          where: { date: { lt: to } },
          orderBy: [{ date: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ category: "asc" }, { code: "asc" }],
    });

    const result = materials
      .filter((material) => {
        const name = material.name.trim();
        if (/\(สสส\.\)\s*$/u.test(name)) return false;
        if (material.category === "ELECTRIC" && /ถ่านกระดุม/u.test(name)) return false;
        return true;
      })
      .map((material) => {
        const before = material.transactions.filter((row) => row.date < from);
        const within = material.transactions.filter((row) => row.date >= from);
        const openingBalance = before.length ? before[before.length - 1].balance : 0;
        return {
          id: material.id,
          code: material.code,
          name: material.name,
          category: material.category,
          unit: material.unit,
          vendor: material.vendor?.name ?? "",
          latestPrice: material.latestPrice,
          openingBalance,
          rows: within.map((row) => ({
            date: row.date.toISOString(),
            documentNo: row.documentNo,
            owner: row.vendor || row.department || "",
            unitPrice: row.unitPrice,
            receiveQty: row.receiveQty,
            issueQty: row.issueQty,
            balance: row.balance,
          })),
        };
      });
    return NextResponse.json({ materials: result });
  } catch (error) {
    console.error("Export all stock cards failed:", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลบัญชีพัสดุได้" }, { status: 500 });
  }
}
