import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeletePdfButton from "./DeletePdfButton";


type Props = {
  params: Promise<{
    id:string;
  }>;
};



export default async function IssueDetailPage({
  params,
}:Props){


  const { id } = await params;



  const issue =
    await prisma.issue.findUnique({

      where:{
        id:Number(id),
      },


      include:{

        department:true,


        items:{

          include:{

            material:true,

          },

        },


      },


    });





  if(!issue){

    notFound();

  }






  const categoryName:Record<string,string>={

    OFFICE:"วัสดุสำนักงาน",

    COMPUTER:"วัสดุคอมพิวเตอร์",

    ELECTRIC:"วัสดุไฟฟ้าและวิทยุ",

    HOUSEHOLD:"วัสดุงานบ้านและงานครัว",

    VEHICLE:"วัสดุยานพาหนะ",

  };







  return (


    <div className="space-y-6">





      <div className="flex items-center justify-between">


        <h1 className="text-3xl font-bold text-white">

          รายละเอียดใบเบิกพัสดุ

        </h1>



        <Link

          href="/issue"

          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"

        >

          ← กลับ

        </Link>


      </div>








      <div className="rounded-xl bg-white p-6 shadow text-black space-y-3">



        <p>

          <strong>
            เลขที่ใบเบิก :
          </strong>{" "}

          {issue.documentNo}

        </p>





        <p>

          <strong>
            วันที่เบิก :
          </strong>{" "}


          {
            new Date(
              issue.issueDate
            ).toLocaleDateString(
              "th-TH"
            )
          }


        </p>





        <p>

          <strong>
            หน่วยงาน :
          </strong>{" "}


          {issue.department.name}


        </p>





        <p>

          <strong>
            หมายเหตุ :
          </strong>{" "}


          {issue.remark ?? "-"}


        </p>







        <div className="flex items-center gap-3">


          <strong>
            เอกสารแนบ :
          </strong>



          {

            issue.pdf

            ?

            <>

              <a

                href={issue.pdf}

                target="_blank"

                className="text-blue-600 underline"

              >

                เปิดไฟล์ PDF

              </a>



              <DeletePdfButton

                id={issue.id}

              />


            </>


            :

            <span>
              -
            </span>


          }



        </div>




      </div>









      <div className="overflow-hidden rounded-xl bg-white shadow">



        <table className="w-full text-sm">


          <thead className="bg-gray-100 text-black">


            <tr>


              <th className="border p-3 text-center">

                ลำดับ

              </th>



              <th className="border p-3">

                หมวด

              </th>



              <th className="border p-3">

                รายการพัสดุ

              </th>



              <th className="border p-3 text-center">

                หน่วย

              </th>



              <th className="border p-3 text-center">

                จำนวน

              </th>



              <th className="border p-3 text-right">

                ราคาต่อหน่วย

              </th>



            </tr>


          </thead>






          <tbody className="text-black">


            {
              issue.items.map((item, index) => (


                <tr key={item.id}>


                  <td className="border p-3 text-center">

                    {index+1}

                  </td>





                  <td className="border p-3">

                    {
                      categoryName[
                        item.material.category
                      ]
                    }


                  </td>





                  <td className="border p-3">


                    {item.material.code}

                    {" - "}

                    {item.material.name}


                  </td>





                  <td className="border p-3 text-center">


                    {item.material.unit}


                  </td>





                  <td className="border p-3 text-center">


                    {item.qty}


                  </td>





                  <td className="border p-3 text-right">


                    {
                      Number(
                        item.material.latestPrice
                      ).toFixed(2)
                    }


                  </td>




                </tr>


              ))
            }



          </tbody>


        </table>


      </div>




    </div>


  );


}