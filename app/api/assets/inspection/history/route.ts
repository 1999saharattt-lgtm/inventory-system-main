import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  try {
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ ok: false, error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const url = new URL(request.url);
  const departmentIdText = url.searchParams.get("departmentId") ?? "";
  const yearText = url.searchParams.get("year") ?? "";
  if (!/^\d+$/.test(departmentIdText) || !/^\d{4}$/.test(yearText)) {
    return NextResponse.json({ ok: false, error: "ข้อมูลกลุ่มงานหรือปีงบประมาณไม่ถูกต้อง" }, { status: 400 });
  }
  const departmentId = Number(departmentIdText);
  const year = Number(yearText);
  if (!Number.isSafeInteger(departmentId) || departmentId <= 0 || !Number.isSafeInteger(year) || year < 1900 || year > 3000) {
    return NextResponse.json({ ok: false, error: "ข้อมูลกลุ่มงานหรือปีงบประมาณไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await prisma.assetInspection.deleteMany({
      where: { year, asset: { departmentId } },
    });
    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "ไม่พบประวัติการตรวจสอบที่ต้องการลบ" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deletedCount: result.count });
  } catch (error) {
    console.error("Delete asset inspection history error:", error);
    return NextResponse.json({ ok: false, error: "ไม่สามารถลบประวัติการตรวจสอบได้" }, { status: 500 });
  }
}
