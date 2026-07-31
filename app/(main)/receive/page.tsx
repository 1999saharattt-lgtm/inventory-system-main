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

      include: {
        vendor: true,
        items: true,
      },

      orderBy: {
        id: "desc",
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
          rounded-3xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-cyan-700
          p-6
          text-white
          shadow-xl
        "
      >


        <div>


          <h1
            className="
              text-3xl
              font-extrabold
            "
          >
            📥 รายการรับเข้าพัสดุ
          </h1>



          <p
            className="
              mt-2
              text-lg
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
            bg-white/10
            px-6
            py-3
            font-extrabold
            text-white
            backdrop-blur
            shadow-lg
            transition
            hover:bg-white/20
            hover:-translate-y-1
          "
        >
          + เพิ่มรายการรับ
        </Link>


      </div>
            {/* Table Card */}

      <div
        className="
          overflow-hidden
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          shadow-xl
        "
      >


        <div className="overflow-x-auto">


          <table
            className="
              min-w-full
              text-white
            "
          >


            <thead
              className="
                bg-slate-950
              "
            >

              <tr
                className="
                  text-lg
                  font-extrabold
                  text-white
                "
              >


                <th
                  className="
                    w-20
                    px-4
                    py-4
                    text-center
                  "
                >
                  ลำดับ
                </th>


                <th
                  className="
                    px-4
                    py-4
                  "
                >
                  วันที่รับเข้า
                </th>


                <th
                  className="
                    px-4
                    py-4
                  "
                >
                  เลขที่เอกสาร
                </th>


                <th
                  className="
                    px-4
                    py-4
                  "
                >
                  ผู้จำหน่าย
                </th>


                <th
                  className="
                    px-4
                    py-4
                  "
                >
                  รายละเอียด
                </th>


                <th
                  className="
                    px-4
                    py-4
                  "
                >
                  หมายเหตุ
                </th>


                <th
                  className="
                    w-60
                    px-4
                    py-4
                    text-center
                  "
                >
                  จัดการ
                </th>


              </tr>


            </thead>



            <tbody>
                            {receives.length > 0 ? (

                receives.map(
                  (receive: Receive, index: number) => (

                    <tr
                      key={receive.id}
                      className="
                        border-t
                        border-slate-700
                        transition
                        hover:bg-slate-800
                      "
                    >


                      <td
                        className="
                          px-4
                          py-4
                          text-center
                          font-bold
                        "
                      >
                        {index + 1}
                      </td>



                      <td
                        className="
                          px-4
                          py-4
                          text-center
                          font-semibold
                        "
                      >
                        {new Date(
                          receive.receiveDate
                        ).toLocaleDateString("th-TH")}
                      </td>



                      <td
                        className="
                          px-4
                          py-4
                          text-center
                        "
                      >

                        <span
                          className="
                            inline-flex
                            rounded-xl
                            bg-white/10
                            px-3
                            py-1
                            font-bold
                            text-cyan-300
                          "
                        >
                          {receive.documentNo}
                        </span>

                      </td>




                      <td
                        className="
                          px-4
                          py-4
                          font-semibold
                        "
                      >
                        {receive.vendor.name}
                      </td>




                      <td
                        className="
                          px-4
                          py-4
                          text-center
                        "
                      >

                        <Link
                          href={`/receive/${receive.id}`}
                          className="
                            inline-flex
                            rounded-xl
                            bg-cyan-600
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow-md
                            transition
                            hover:bg-cyan-700
                            hover:-translate-y-0.5
                          "
                        >
                          ดูรายการ
                        </Link>

                      </td>





                      <td
                        className="
                          px-4
                          py-4
                          font-semibold
                        "
                      >

                        {
                          receive.remark
                            ?
                              receive.remark
                            :
                              (
                                <span
                                  className="
                                    italic
                                    text-slate-400
                                  "
                                >
                                  -
                                </span>
                              )
                        }

                      </td>





                      <td
                        className="
                          px-4
                          py-4
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
                              rounded-xl
                              bg-amber-500
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow-md
                              transition
                              hover:bg-amber-600
                              hover:-translate-y-0.5
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
                )


              ) : (

                <tr>

                  <td
                    colSpan={7}
                    className="
                      px-4
                      py-16
                      text-center
                      text-lg
                      font-bold
                      text-slate-400
                    "
                  >
                    ยังไม่มีข้อมูลการรับเข้าพัสดุ
                  </td>

                </tr>

              )}


            </tbody>


          </table>


        </div>


      </div>


    </div>

  );

}