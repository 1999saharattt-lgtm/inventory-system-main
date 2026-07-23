import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ดึงผู้จำหน่ายทั้งหมด
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(vendors);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูลผู้จำหน่ายได้",
      },
      {
        status: 500,
      }
    );
  }
}

// เพิ่มผู้จำหน่าย
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const vendor = await prisma.vendor.create({
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
        taxId: body.taxId || null,
      },
    });

    return NextResponse.json(vendor);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "เพิ่มผู้จำหน่ายไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}