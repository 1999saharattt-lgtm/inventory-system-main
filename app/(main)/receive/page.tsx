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

      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          rounded-3xl
          bg-gradient-to-r
          from-blue-700
          via-blue-600
          to-cyan-500
          p-8
          shadow-xl
          text-white
        "
      >
        <div>
          <h1 className="text-4xl font-extrabold">
            📥 รายการรับเข้าพัสดุ
          </h1>

          <p className="mt-2 text-lg text-blue-100">
            แสดงรายการเอกสารรับเข้าพัสดุทั้งหมด
          </p>
        </div>

        <Link
          href="/receive/create"
          className="
            rounded-2xl
            bg-white
            px-6
            py-3
            text-xl
            font-bold
            text-blue-700
            shadow-lg
            transition-all
            duration-200
            hover:-translate-y-1
            hover:bg-blue-50
          "
        >
          + เพิ่มรายการรับ
        </Link>
      </div>

      {/* Table */}
      <div
        className="
          overflow-hidden
          rounded-3xl
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

                <th className="w-20">
                  ลำดับ
                </th>

                <th>
                  วันที่รับเข้า
                </th>

                <th>
                  เลขที่เอกสาร
                </th>

                <th>
                  ผู้จำหน่าย
                </th>

                <th>
                  รายละเอียด
                </th>

                <th>
                  หมายเหตุ
                </th>

                <th className="w-60">
                  จัดการ
                </th>

              </tr>
            </thead>

            <tbody>

              {receives.length > 0 ? (

                receives.map((receive: Receive, index: number) => (

                  <tr key={receive.id}>

                    <td className="text-center">
                      {index + 1}
                    </td>

                    <td className="text-center">
                      {new Date(receive.receiveDate).toLocaleDateString("th-TH")}
                    </td>

                    <td className="text-center">

                      <span
                        className="
                          inline-block
                          rounded-xl
                          bg-slate-100
                          px-3
                          py-1
                          font-bold
                          text-slate-700
                        "
                      >
                        {receive.documentNo}
                      </span>

                    </td>

                    <td>
                      {receive.vendor.name}
                    </td>

                    <td className="text-center">

                      <Link
                        href={`/receive/${receive.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-xl
                          bg-sky-600
                          px-4
                          py-2
                          font-bold
                          text-white
                          transition-all
                          duration-200
                          hover:bg-sky-700
                          hover:-translate-y-0.5
                        "
                      >
                        แสดงรายการพัสดุ
                      </Link>

                    </td>

                    <td>

                      {receive.remark ? (
                        receive.remark
                      ) : (
                        <span className="italic text-slate-400">
                          -
                        </span>
                      )}

                    </td>

                    <td>

                      <div className="flex justify-center gap-2">

                        <Link
                          href={`/receive/${receive.id}/edit`}
                          className="
                            rounded-xl
                            bg-amber-500
                            px-4
                            py-2
                            font-bold
                            text-white
                            transition-all
                            duration-200
                            hover:-translate-y-0.5
                            hover:bg-amber-600
                          "
                        >
                          แก้ไข
                        </Link>

                        <DeleteButton id={receive.id} />

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={7}
                    className="py-16 text-center text-slate-500"
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