import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";


type Props = {
  params: Promise<{
    id: string;
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



const categoryLabel: Record<string,string> = {

  OFFICE:"วัสดุสำนักงาน",

  COMPUTER:"วัสดุคอมพิวเตอร์",

  ELECTRIC:"วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:"วัสดุงานบ้านและงานครัว",

  VEHICLE:"วัสดุยานพาหนะ",

  PRINTING:"วัสดุสื่อสิ่งพิมพ์",

};



export default async function ReceiveDetailPage({
  params,
}: Props) {


  const { id } = await params;



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

    <div className="space-y-6">



      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          shadow-xl
        "
      >


        <div>

          <h1
  className="
    text-4xl
    font-extrabold
    !text-white
  "
>
  📄 รายละเอียดเอกสารรับเข้า
</h1>


          <p
  className="
    mt-2
    text-lg
    font-semibold
    !text-slate-200
  "
>
  รายละเอียดรายการรับเข้าพัสดุ
</p>


        </div>



        <Link

          href="/receive"

          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "

        >

          ← กลับ

        </Link>



      </div>






      {/* ข้อมูลเอกสาร */}


      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-6
          shadow-xl
          text-white
          space-y-4
        "
      >


        <p>
          <span className="font-extrabold">
            วันที่รับเข้า :
          </span>{" "}

          {
            new Date(receive.receiveDate)
            .toLocaleDateString("th-TH")
          }

        </p>



        <p>

          <span className="font-extrabold">
            เลขที่เอกสาร :
          </span>{" "}

          {receive.documentNo}

        </p>



        <p>

          <span className="font-extrabold">
            ผู้จำหน่าย :
          </span>{" "}

          {receive.vendor.name}

        </p>



        <p>

          <span className="font-extrabold">
            หมายเหตุ :
          </span>{" "}

          {receive.remark || "-"}

        </p>


      </div>






      {/* ตารางรายการ */}


      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >

        <div className="overflow-x-auto">


          <table className="w-full border-collapse">


            <thead>

  <tr
    className="
      bg-gradient-to-r
      from-slate-800
      to-slate-700
    "
  >


                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "หน่วย",
                  "จำนวน",
                  "ราคาต่อหน่วย",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title)=>(

                  <th
  key={title}
  className="
    border
    border-slate-600
    px-3
    py-3
    text-center
    text-lg
    font-extrabold
    text-white
  "
>
                    {title}
                  </th>

                ))}


              </tr>


            </thead>




            <tbody className="text-slate-900">


              {
                receive.items.map(
                  (item:ReceiveItem,index:number)=>(


                    <tr
                      key={item.id}
                      className="
                        text-slate-900
                        hover:bg-emerald-50
                      "
                    >


                      <td className="border px-3 py-3 text-center font-bold">

                        {index+1}

                      </td>



                      <td className="border px-3 py-3">

                        {
                          categoryLabel[
                            item.material.category
                          ]
                        }

                      </td>



                      <td className="border px-3 py-3">

                        {item.material.code}

                      </td>



                      <td className="border px-3 py-3 font-semibold">

                        {item.material.name}

                      </td>



                      <td className="border px-3 py-3 text-center">

                        {item.material.unit}

                      </td>



                      <td className="border px-3 py-3 text-center">

                        {item.qty}

                      </td>



                      <td className="border px-3 py-3 text-right">

                        {
                          Number(item.unitPrice)
                          .toFixed(2)
                        }

                      </td>



                      <td className="border px-3 py-3 text-center">

                        {
                          item.manufacture
                          ?
                          new Date(item.manufacture)
                          .toLocaleDateString("th-TH")
                          :
                          "-"
                        }

                      </td>



                      <td className="border px-3 py-3 text-center">

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


                  )
                )
              }


            </tbody>


          </table>


        </div>


      </div>




    </div>

  );

}