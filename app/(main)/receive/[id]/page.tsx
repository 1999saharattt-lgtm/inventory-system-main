import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";


type Props = {
  params: Promise<{
    id:string;
  }>;
};

type ReceiveItem = {
  id: number;
  qty: number;
  unitPrice: number | string;
  manufacture: Date | null;
  expiry: Date | null;
  material: {
    category: string;
    code: string;
    name: string;
    unit: string;
  };
};

const categoryLabel:any = {

  OFFICE:"วัสดุสำนักงาน",

  COMPUTER:"วัสดุคอมพิวเตอร์",

  ELECTRIC:"วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:"วัสดุงานบ้านและงานครัว",

  VEHICLE:"วัสดุยานพาหนะ",

};



export default async function ReceiveDetailPage({
  params,
}:Props){


  const {id}=await params;



  const receive =
  await prisma.receive.findUnique({

    where:{
      id:Number(id),
    },

    include:{

      vendor:true,

      items:{

        include:{

          material:true,

        },

      },

    },

  });



  if(!receive){

    notFound();

  }



  return (

    <div className="space-y-6 p-6">


      <div className="flex items-center justify-between">


        <h1 className="text-3xl font-bold text-white">

          รายละเอียดเอกสารรับเข้า

        </h1>



        <Link

          href="/receive"

          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"

        >

          ← กลับ

        </Link>


      </div>
            <div className="rounded-xl bg-white p-6 shadow text-gray-900 space-y-3">


        <p>

          <strong>
            วันที่รับเข้า :
          </strong>{" "}

          {
            new Date(receive.receiveDate)
            .toLocaleDateString("th-TH")
          }

        </p>



        <p>

          <strong>
            เลขที่เอกสาร :
          </strong>{" "}

          {receive.documentNo}

        </p>



        <p>

          <strong>
            ผู้จำหน่าย :
          </strong>{" "}

          {receive.vendor.name}

        </p>



        <p>

          <strong>
            หมายเหตุ :
          </strong>{" "}

          {receive.remark || "-"}

        </p>


      </div>






      <div className="rounded-xl bg-white p-6 shadow">


        <h2 className="mb-4 text-xl font-bold text-gray-900">

          รายการพัสดุ

        </h2>



        <div className="overflow-x-auto">


          <table className="w-full border border-gray-300 text-sm">


            <thead className="bg-gray-100 text-gray-900">


              <tr>


                <th className="border p-2 text-center">
                  ลำดับ
                </th>


                <th className="border p-2">
                  หมวด
                </th>


                <th className="border p-2">
                  รหัสพัสดุ
                </th>


                <th className="border p-2">
                  ชื่อพัสดุ
                </th>


                <th className="border p-2 text-center">
                  หน่วย
                </th>


                <th className="border p-2 text-center">
                  จำนวน
                </th>


                <th className="border p-2 text-right">
                  ราคาต่อหน่วย
                </th>


                <th className="border p-2 text-center">
                  วันผลิต
                </th>


                <th className="border p-2 text-center">
                  วันหมดอายุ
                </th>


              </tr>


            </thead>




            <tbody className="text-gray-900">
                            {
                receive.items.map((item: ReceiveItem, index: number)=>(


                  <tr key={item.id}>


                    <td className="border p-2 text-center">

                      {index+1}

                    </td>



                    <td className="border p-2">

                      {
                        categoryLabel[
                          item.material.category
                        ]
                      }

                    </td>




                    <td className="border p-2">

                      {item.material.code}

                    </td>




                    <td className="border p-2">

                      {item.material.name}

                    </td>




                    <td className="border p-2 text-center">

                      {item.material.unit}

                    </td>




                    <td className="border p-2 text-center">

                      {item.qty}

                    </td>




                    <td className="border p-2 text-right">

                      {
                        Number(item.unitPrice)
                        .toFixed(2)
                      }

                    </td>




                    <td className="border p-2 text-center">

                      {
                        item.manufacture
                        ?
                        new Date(item.manufacture)
                        .toLocaleDateString("th-TH")
                        :
                        "-"
                      }

                    </td>




                    <td className="border p-2 text-center">

                      {
                        item.expiry
                        ?
                        new Date(item.expiry)
                        .toLocaleDateString("th-TH")
                        :
                        "-"
                      }

                    </td>



                  </tr>


                ))
              }


            </tbody>


          </table>


        </div>


      </div>



    </div>

  );

}