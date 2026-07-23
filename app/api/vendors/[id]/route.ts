import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

// แก้ไขผู้จำหน่าย
export async function PUT(
  req: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await prisma.vendor.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
        taxId: body.taxId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขผู้จำหน่ายสำเร็จ",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "แก้ไขผู้จำหน่ายไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}

// ลบผู้จำหน่าย
export async function DELETE(
  req: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const vendorId = Number(id);

    // ตรวจสอบว่ามีพัสดุใช้ผู้จำหน่ายนี้หรือไม่
    const material = await prisma.material.findFirst({
      where: {
        vendorId,
      },
      select: {
        id: true,
      },
    });

    if (material) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถลบได้ เนื่องจากมีพัสดุที่อ้างอิงผู้จำหน่ายรายนี้",
        },
        {
          status: 400,
        }
      );
    }

    // ตรวจสอบว่ามีเอกสารรับเข้าที่ใช้ผู้จำหน่ายนี้หรือไม่
    const receive = await prisma.receive.findFirst({
      where: {
        vendorId,
      },
      select: {
        id: true,
      },
    });

    if (receive) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถลบได้ เนื่องจากมีเอกสารรับเข้าที่อ้างอิงผู้จำหน่ายรายนี้",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.vendor.delete({
      where: {
        id: vendorId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบผู้จำหน่ายสำเร็จ",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "ลบผู้จำหน่ายไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}