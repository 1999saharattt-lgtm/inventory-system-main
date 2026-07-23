import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


// =========================
// UPDATE MATERIAL
// =========================

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {

  try {

    const { id } = await params;

    const materialId = Number(id);


    const body = await request.json();


    const updated = await prisma.material.update({

      where: {
        id: materialId,
      },


      data: {

        code: body.code,

        category: body.category,

        name: body.name,

        unit: body.unit,

        balance: Number(body.balance),

        latestPrice: Number(body.latestPrice),

        vendorId:
  body.vendorId === null
    ? null
    : Number(body.vendorId),

      },

    });



    return NextResponse.json({

      message: "บันทึกสำเร็จ",

      data: updated,

    });



  } catch (error) {


    console.error(
      "UPDATE MATERIAL ERROR:",
      error
    );


    return NextResponse.json(

      {
        message: "บันทึกไม่สำเร็จ",
      },

      {
        status: 500,
      }

    );

  }

}





// =========================
// DELETE MATERIAL
// =========================

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {

  try {


    const { id } = await params;

    const materialId = Number(id);



    const material = await prisma.material.findUnique({

      where: {
        id: materialId,
      },

    });



    if (!material) {

      return NextResponse.json(

        {
          message: "ไม่พบพัสดุ",
        },

        {
          status: 404,
        }

      );

    }



    // ลบ transaction ก่อน

    await prisma.transaction.deleteMany({

      where: {
        materialId,
      },

    });



    // ลบรายการเบิก

    await prisma.issueItem.deleteMany({

      where: {
        materialId,
      },

    });



    // ลบรายการรับ

    await prisma.receiveItem.deleteMany({

      where: {
        materialId,
      },

    });



    // ลบ material

    await prisma.material.delete({

      where: {
        id: materialId,
      },

    });



    return NextResponse.json({

      message: "ลบสำเร็จ",

    });



  } catch (error) {


    console.error(
      "DELETE MATERIAL ERROR:",
      error
    );



    return NextResponse.json(

      {
        message: "ลบไม่สำเร็จ",
      },

      {
        status: 500,
      }

    );

  }

}