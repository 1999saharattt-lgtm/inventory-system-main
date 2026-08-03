import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

type Receive = {
  id: number;
  receiveDate: Date;
  documentNo: string;
  remark: string | null;

  vendor: {
    name: string;
  };

  items: {
    id: number;
  }[];
};


export default async function ReceivePage() {

  const receives =
    await prisma.receive.findMany({

      include:{
        vendor:true,
        items:true,
      },

      orderBy:{
        id:"desc",
      },

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
              !text-white
              text-5xl
              font-extrabold
              leading-tight
            "
          >
            📥 รายการรับเข้าพัสดุ
          </h1>


          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            แสดงรายการเอกสารรับเข้าพัสดุทั้งหมด
          </p>

        </div>



        <Link
          href="/receive/create"
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
          + เพิ่มรายการรับ
        </Link>


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
                  "ลำดับ",
                  "วันที่รับเข้า",
                  "เลขที่เอกสาร",
                  "ผู้จำหน่าย",
                  "รายละเอียด",
                  "หมายเหตุ",
                  "จัดการ",
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
                receives.length > 0 ? (

                  receives.map(
                    (
                      receive:Receive,
                      index:number
                    )=>(

                    <tr
                      key={receive.id}
                      className="
                        border-b
                        hover:bg-blue-50
                      "
                    >


                      <td
                        className="
                          px-4
                          py-3
                          text-center
                          font-bold
                          text-slate-700
                        "
                      >
                        {index+1}
                      </td>



                      <td
                        className="
                          px-4
                          py-3
                          text-center
                          font-semibold
                          text-slate-700
                        "
                      >
                        {
                          new Date(
                            receive.receiveDate
                          ).toLocaleDateString("th-TH")
                        }
                      </td>



                      <td
                        className="
                          px-4
                          py-3
                          text-center
                          font-bold
                          text-slate-800
                        "
                      >
                        {receive.documentNo}
                      </td>



                      <td
                        className="
                          px-4
                          py-3
                          font-bold
                          text-slate-800
                        "
                      >
                        {receive.vendor.name}
                      </td>



                      <td
                        className="
                          px-4
                          py-3
                          text-center
                        "
                      >

                        <Link
                          href={`/receive/${receive.id}`}
                          className="
                            rounded-lg
                            bg-slate-800
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow
                            transition
                            hover:bg-slate-700
                          "
                        >
                          ดูรายการ
                        </Link>

                      </td>



                      <td
                        className="
                          px-4
                          py-3
                          text-slate-700
                        "
                      >
                        {
                          receive.remark ?? "-"
                        }
                      </td>




                      <td
                        className="
                          px-4
                          py-3
                        "
                      >

                        <div
                          className="
                            flex
                            justify-center
                            gap-2
                          "
                        >

                          <Link
                            href={`/receive/${receive.id}/edit`}
                            className="
                              rounded-lg
                              bg-slate-800
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow
                              transition
                              hover:bg-slate-700
                            "
                          >
                            แก้ไข
                          </Link>


                          <DeleteButton
                            id={receive.id}
                          />


                        </div>

                      </td>


                    </tr>

                  )

                ) : (

                  <tr>

                    <td
                      colSpan={7}
                      className="
                        py-12
                        text-center
                        text-lg
                        font-bold
                        text-slate-500
                      "
                    >
                      ยังไม่มีข้อมูลรับเข้าพัสดุ
                    </td>

                  </tr>

                )
              }


            </tbody>


          </table>


        </div>


      </div>


    </div>

  );
}