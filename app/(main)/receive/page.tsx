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
};


export default async function ReceivePage() {

  const receives = await prisma.receive.findMany({
    include: {
      vendor: true,
      items: true,
    },
    orderBy: {
      id: "desc",
    },
  });


  return (
    <div className="space-y-8">


      <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-6 shadow-sm">

        <div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            รายการรับเข้าพัสดุ
          </h1>

          <p className="mt-2 text-slate-600">
            แสดงรายการเอกสารรับเข้าพัสดุทั้งหมด
          </p>

        </div>


        <Link
          href="/receive/create"
          className="
            rounded-lg
            bg-blue-700
            px-5
            py-3
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-blue-800
          "
        >
          + เพิ่มรายการรับ
        </Link>


      </div>




      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">


        <div className="overflow-x-auto">


          <table className="min-w-full border-collapse">


            <thead className="bg-slate-200">

              <tr className="text-sm text-slate-800">


                <th className="w-16 border border-slate-300 px-4 py-3 text-center font-semibold">
                  ลำดับ
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center font-semibold">
                  วันที่รับเข้า
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center font-semibold">
                  เลขที่เอกสาร
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center font-semibold">
                  ผู้จำหน่าย
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center font-semibold">
                  รายละเอียด
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center font-semibold">
                  หมายเหตุ
                </th>


                <th className="w-56 border border-slate-300 px-4 py-3 text-center font-semibold">
                  จัดการ
                </th>


              </tr>

            </thead>





            <tbody>


              {receives.length > 0 ? (

                receives.map((receive: Receive, index: number) => (


                  <tr
                    key={receive.id}
                    className="
                      odd:bg-white
                      even:bg-slate-50
                      hover:bg-blue-50
                      transition-colors
                    "
                  >


                    <td className="border border-slate-300 px-4 py-3 text-center font-medium text-slate-700">
                      {index + 1}
                    </td>



                    <td className="border border-slate-300 px-4 py-3 text-center text-slate-700">
                      {new Date(receive.receiveDate).toLocaleDateString("th-TH")}
                    </td>



                    <td className="border border-slate-300 px-4 py-3 text-center">

                      <span className="
                        inline-block
                        rounded-md
                        bg-slate-200
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-slate-800
                      ">
                        {receive.documentNo}
                      </span>

                    </td>



                    <td className="border border-slate-300 px-4 py-3 text-slate-700">
                      {receive.vendor.name}
                    </td>



                    <td className="border border-slate-300 px-4 py-3 text-center">

                      <Link
                        href={`/receive/${receive.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-sky-600
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-white
                          shadow-sm
                          transition
                          hover:bg-sky-700
                        "
                      >
                        แสดงรายการพัสดุ
                      </Link>

                    </td>




                    <td className="border border-slate-300 px-4 py-3 text-slate-700">

                      {receive.remark ? (
                        receive.remark
                      ) : (
                        <span className="italic text-slate-400">
                          -
                        </span>
                      )}

                    </td>





                    <td className="border border-slate-300 px-4 py-3">


                      <div className="flex justify-center gap-2">


                        <Link
                          href={`/receive/${receive.id}/edit`}
                          className="
                            rounded-lg
                            bg-amber-500
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            shadow-sm
                            transition
                            hover:bg-amber-600
                          "
                        >
                          แก้ไข
                        </Link>



                        <DeleteButton id={receive.id}/>



                      </div>


                    </td>



                  </tr>


                ))


              ) : (


                <tr>

                  <td
                    colSpan={7}
                    className="bg-white py-12 text-center text-slate-500"
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