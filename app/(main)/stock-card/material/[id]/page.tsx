import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExportPdf from "./ExportPdf";
import ExportExcel from "./ExportExcel";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};


function formatDateAD(date: Date | string) {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}



export default async function StockCardPage({
  params,
}: Props) {


  const { id } = await params;


  const material = await prisma.material.findUnique({

    where:{
      id:Number(id),
    },

    include:{

      vendor:true,

      receiveItems:{
        include:{
          receive:{
            include:{
              vendor:true,
            },
          },
        },

        orderBy:{
          receive:{
            receiveDate:"asc",
          },
        },
      },


      issueItems:{
        include:{
          issue:{
            include:{
              department:true,
            },
          },
        },

        orderBy:{
          issue:{
            issueDate:"asc",
          },
        },
      },

    },

  });



  if(!material){

    return(
      <div className="
        p-10
        text-center
        text-lg
        font-bold
        text-slate-700
      ">
        ไม่พบข้อมูลพัสดุ
      </div>
    );

  }




  const rows = [

    ...material.receiveItems.map((item)=>({

      date:item.receive.receiveDate,

      documentNo:item.receive.documentNo,

      owner:item.receive.vendor?.name ?? "-",

      unitPrice:Number(item.unitPrice),

      receiveQty:item.qty,

      issueQty:0,

      manufacture:item.manufacture,

      expiry:item.expiry,

    })),


    ...material.issueItems.map((item)=>({

      date:item.issue.issueDate,

      documentNo:item.issue.documentNo,

      owner:item.issue.department?.name ?? "-",

      unitPrice:Number(material.latestPrice),

      receiveQty:0,

      issueQty:item.qty,

      manufacture:null,

      expiry:null,

    })),


  ].sort(

    (a,b)=>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()

  );



  let balance = 0;


  const stockRows = rows.map((row)=>{

    balance += row.receiveQty;

    balance -= row.issueQty;


    return{
      ...row,
      balance,
    };

  });




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
          text-white
          shadow-xl
        "
      >

        <div>

          <h1
            className="
              text-5xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            📒 บัญชีพัสดุ
          </h1>


          <p
            className="
              mt-2
              text-xl
              font-semibold
              text-slate-200
            "
          >
            {material.name}
          </p>


        </div>



        <div className="flex gap-3">


          <Link
            href={`/stock-card/${material.category}`}
            className="
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
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



          <ExportPdf
            material={material}
            rows={stockRows}
          />


          <ExportExcel
            material={material}
            rows={stockRows}
          />


        </div>


      </div>






      {/* Material Info */}


      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-xl
        "
      >


        <h2
          className="
            mb-6
            text-center
            text-4xl
            font-extrabold
            text-slate-900
          "
        >
          รายละเอียดพัสดุ
        </h2>



        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            text-lg
          "
        >

          <div>
            <b>รหัสพัสดุ :</b> {material.code}
          </div>


          <div>
            <b>รายการพัสดุ :</b> {material.name}
          </div>


          <div>
            <b>หมวดหมู่ :</b>{" "}
            {categoryName[material.category]}
          </div>


          <div>
            <b>หน่วย :</b> {material.unit}
          </div>


          <div>
            <b>ผู้จำหน่าย :</b>{" "}
            {material.vendor?.name ?? "-"}
          </div>


          <div>
            <b>ราคาล่าสุด :</b>{" "}
            {Number(material.latestPrice).toLocaleString(
              "th-TH",
              {
                minimumFractionDigits:2,
                maximumFractionDigits:2,
              }
            )}
            {" "}บาท
          </div>


        </div>


      </div>






      {/* Table */}


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


          <table className="min-w-full">


            <thead>


              <tr>


                {[
                  "วันที่",
                  "เลขที่เอกสาร",
                  "ผู้จำหน่าย / หน่วยงาน",
                  "ราคาล่าสุด",
                  "รับเข้า",
                  "เบิกจ่าย",
                  "คงเหลือ",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title)=>(


                  <th
                    key={title}
                    className="
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
                      py-4
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





            <tbody>


              {
                stockRows.length === 0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="
                        py-12
                        text-center
                        text-lg
                        font-bold
                        text-slate-500
                      "
                    >
                      ยังไม่มีข้อมูล
                    </td>

                  </tr>


                ) : (


                  <>


                  {stockRows.map((row,index)=>(


                    <tr
                      key={index}
                      className="
                        border-b
                        hover:bg-blue-50
                      "
                    >


                      <td className="px-4 py-3 text-center text-slate-700">
                        {formatDateAD(row.date)}
                      </td>


                      <td className="px-4 py-3 text-slate-700">
                        {row.documentNo}
                      </td>


                      <td className="px-4 py-3 text-slate-700">
                        {row.owner}
                      </td>


                      <td className="px-4 py-3 text-right text-slate-700">
                        {Number(row.unitPrice).toLocaleString(
                          "th-TH",
                          {
                            minimumFractionDigits:2,
                            maximumFractionDigits:2,
                          }
                        )}
                      </td>


                      <td className="px-4 py-3 text-center font-bold">
                        {row.receiveQty || "-"}
                      </td>


                      <td className="px-4 py-3 text-center font-bold">
                        {row.issueQty || "-"}
                      </td>


                      <td className="
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      ">
                        {row.balance}
                      </td>


                      <td className="px-4 py-3 text-center">
                        {row.manufacture
                          ? formatDateAD(row.manufacture)
                          : "-"
                        }
                      </td>


                      <td className="px-4 py-3 text-center">
                        {row.expiry
                          ? formatDateAD(row.expiry)
                          : "-"
                        }
                      </td>


                    </tr>


                  ))}


                  </>

                )
              }


            </tbody>


          </table>


        </div>


      </div>



    </div>

  );

}