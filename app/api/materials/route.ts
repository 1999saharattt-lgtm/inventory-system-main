import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMaterialCode } from "@/lib/materialCode";
import { Category } from "@prisma/client";

// ======================
// ดึงรายการพัสดุทั้งหมด
// ======================
export async function GET() {
  try {
    const materials = await prisma.material.findMany({
      include: {
        vendor: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูลพัสดุได้",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================
// เพิ่มพัสดุ
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Object.values(Category).includes(body.category)) {
      return NextResponse.json(
        {
          success: false,
          message: "หมวดพัสดุไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const code = await generateMaterialCode(body.category);

    // ถ้ายังไม่มีใน MaterialMaster ให้เพิ่มอัตโนมัติ
    const exists = await prisma.materialMaster.findFirst({
      where: {
        category: body.category,
        name: body.name,
      },
    });

    if (!exists) {
      await prisma.materialMaster.create({
        data: {
          category: body.category,
          name: body.name,
          unit: body.unit,
        },
      });
    }

    // เพิ่มรายการพัสดุ
    const material = await prisma.material.create({
      data: {
        code,
        category: body.category,
        name: body.name,
        unit: body.unit,
        balance: Number(body.balance ?? 0),
        latestPrice: Number(body.latestPrice ?? 0),
        vendorId: body.vendorId ?? null,
      },
      include: {
        vendor: true,
      },
    });

    return NextResponse.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "เพิ่มพัสดุไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}