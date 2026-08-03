"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";

export async function createIssue(formData: FormData) {

  const issueDate = new Date(
    formData.get("issueDate") as string
  );


  const documentNo =
    formData.get("documentNo") as string;


  const departmentId = Number(
    formData.get("departmentId")
  );


  const officerId = Number(
    formData.get("officerId")
  );


  const remark =
    (formData.get("remark") as string) || "";



  // =====================
  // Upload PDF
  // =====================

  let pdfPath: string | null = null;


  const file =
    formData.get("pdf") as File;



  if (file && file.size > 0) {

    const bytes =
      await file.arrayBuffer();


    const buffer =
      Buffer.from(bytes);



    const uploadDir =
      path.join(
        process.cwd(),
        "public/uploads/issue"
      );



    await fs.mkdir(
      uploadDir,
      {
        recursive: true,
      }
    );



    const filename =
      `${Date.now()}-${file.name}`;



    const filepath =
      path.join(
        uploadDir,
        filename
      );



    await fs.writeFile(
      filepath,
      buffer
    );



    pdfPath =
      `/uploads/issue/${filename}`;

  }




  // =====================
  // รายการพัสดุ
  // =====================


  const items: {
    materialId: number;
    qty: number;
    manufacture: Date | null;
    expiry: Date | null;
  }[] = [];



  for (
    let i = 0;
    i < 15;
    i++
  ) {


    const materialId =
      formData.get(
        `items[${i}].materialId`
      );



    const qty =
      formData.get(
        `items[${i}].qty`
      );



    const manufacture =
      formData.get(
        `items[${i}].manufacture`
      );



    const expiry =
      formData.get(
        `items[${i}].expiry`
      );




    if (
      materialId &&
      qty &&
      Number(qty) > 0
    ) {


      items.push({

        materialId:
          Number(materialId),


        qty:
          Number(qty),



        manufacture:
          manufacture
            ? new Date(
                manufacture as string
              )
            : null,



        expiry:
          expiry
            ? new Date(
                expiry as string
              )
            : null,

      });


    }


  }




  if (items.length === 0) {

    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );

  }





  // =====================
  // บันทึกข้อมูล
  // =====================


  await prisma.$transaction(
    async (tx: any) => {


      await tx.issue.create({

        data: {

          issueDate,

          documentNo,


          departmentId,


          officerId:
            officerId > 0
              ? officerId
              : null,


          remark,


          pdf:
            pdfPath,



          items: {

            create:
              items,

          },


        },


      });






      // =====================
      // ตัดสต็อก
      // =====================


      for (
        const item of items
      ) {


        await tx.material.update({

          where: {

            id:
              item.materialId,

          },


          data: {

            balance: {

              decrement:
                item.qty,

            },

          },


        });


      }



    }
  );



  redirect("/issue");

}