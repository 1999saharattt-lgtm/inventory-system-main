import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { category, name, unit } = body;

    if (!category || !name || !unit) {
      return NextResponse.json(
        {
          message: "กรอกข้อมูลไม่ครบ",
        },
        {
          status: 400,
        }
      );
    }

    const exists = await prisma.materialMaster.findFirst({
      where: {
        category,
        name,
      },
    });

    if (exists) {
      return NextResponse.json(
        {
          message: "รายการนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.materialMaster.create({
      data: {
        category,
        name,
        unit,
      },
    });

    return NextResponse.json({
      message: "บันทึกสำเร็จ",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาด",
      },
      {
        status: 500,
      }
    );
  }
}