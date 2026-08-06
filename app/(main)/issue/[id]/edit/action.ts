"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";


export async function updateIssue(
  formData: FormData
) {


  const issueId =
    Number(
      formData.get("issueId")
    );



  const issueDate =
    new Date(
      formData.get("issueDate") as string
    );



  const documentNo =
    formData.get("documentNo") as string;



  const departmentId =
    Number(
      formData.get("departmentId")
    );



  const remark =
    formData.get("remark") as string;






  const newItems:any[] = [];



  for(let i = 0; i < 15; i++){

  const materialId =
    Number(
      formData.get(
        `items[${i}].materialId`
      )
    );


  const qty =
    Number(
      formData.get(
        `items[${i}].qty`
      )
    );


  const receiveItemId =
    Number(
      formData.get(
        `items[${i}].receiveItemId`
      )
    );



    if(
      materialId &&
      qty > 0
    ){

      newItems.push({

  materialId,

  qty,

  receiveItemId:
    receiveItemId || null,

});

    }

  }






  await prisma.$transaction(
  async (tx: any) => {





      const oldIssue =
        await tx.issue.findUnique({

          where:{
            id:issueId,
          },

          include:{
            items:true,
          },

        });





      if(!oldIssue){

        throw new Error(
          "ไม่พบใบเบิก"
        );

      }








      // คืนสต็อกของเดิม

      for(
        const oldItem of oldIssue.items
      ){


        await tx.material.update({

          where:{
            id:oldItem.materialId,
          },

          data:{

            balance:{
              increment:oldItem.qty,
            },

          },

        });


      }








      // ลบรายการเดิม

      await tx.issueItem.deleteMany({

        where:{
          issueId,
        },

      });








      // แก้ไขข้อมูลหัวเอกสาร

      await tx.issue.update({

        where:{
          id:issueId,
        },

        data:{

          issueDate,

          documentNo,

          departmentId,

          remark,

        },

      });








      // เพิ่มรายการใหม่

      for(
        const item of newItems
      ){



        const material =
          await tx.material.findUnique({

            where:{
              id:item.materialId,
            },

          });






        if(!material){

          throw new Error(
            "ไม่พบพัสดุ"
          );

        }






        if(
          material.balance < item.qty
        ){

          throw new Error(
            `พัสดุ ${material.name} ไม่เพียงพอ`
          );

        }






        await tx.issueItem.create({

  data:{

    issueId,

    materialId:
      item.materialId,

    qty:
      item.qty,

    receiveItemId:
      item.receiveItemId,

  },

});







        await tx.material.update({

          where:{
            id:item.materialId,
          },

          data:{

            balance:{
              decrement:item.qty,
            },

          },

        });






        await tx.transaction.create({

          data:{

            materialId:
              item.materialId,

            type:"ISSUE_EDIT",

            documentNo,

            issueQty:
              item.qty,

            balance:
              material.balance - item.qty,

            department:
              String(departmentId),

            remark,

          },

        });




      }



    }

  );





  redirect("/issue");


}