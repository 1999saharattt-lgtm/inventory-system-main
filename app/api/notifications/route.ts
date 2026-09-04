import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function GET() {
  try {
    // =====================================================
    // Session
    // =====================================================

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({
        count: 0,
      });
    }

    let session;

    try {
      session = await verifySession(token);
    } catch {
      return NextResponse.json({
        count: 0,
      });
    }

    // =====================================================
    // ADMIN
    //
    // ADMIN เห็นการแจ้งเตือนใบเบิกที่รอดำเนินการ
    // จากทุกกลุ่มงาน
    // =====================================================

    if (session.role === "ADMIN") {
      const count = await prisma.issue.count({
        where: {
          status: "PENDING",
        },
      });

      return NextResponse.json({
        count,
      });
    }

    // =====================================================
    // STAFF / VIEWER
    //
    // แต่ละกลุ่มเห็นเฉพาะการแจ้งเตือนของกลุ่มตัวเอง
    // ที่ ADMIN เป็นผู้ดำเนินการแล้ว
    // =====================================================

    if (!session.departmentId) {
      return NextResponse.json({
        count: 0,
      });
    }

    const issues = await prisma.issue.findMany({
      where: {
        departmentId: session.departmentId,
        status: "APPROVED",
        approvedAt: {
          not: null,
        },
        approvedById: {
          not: null,
        },
      },
      select: {
        approvedBy: {
          select: {
            role: true,
          },
        },
      },
    });

    const count = issues.filter(
      (issue) => issue.approvedBy?.role === "ADMIN"
    ).length;

    return NextResponse.json({
      count,
    });
  } catch (error) {
    console.error(
      "ไม่สามารถโหลดจำนวนการแจ้งเตือนได้:",
      error
    );

    return NextResponse.json(
      {
        count: 0,
      },
      {
        status: 500,
      }
    );
  }
}