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
          via-slate-900
          to-cyan-700
          p-8
          text-white
          shadow-2xl
        "
      >
        <div>
          <h1
            className="
              text-4xl
              font-extrabold
              tracking-tight
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
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-7
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
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          shadow-2xl
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
                "
              >

                {[
                  "ลำดับ",
                  "วันที่รับเข้า",
                  "เลขที่เอกสาร",
                  "ผู้จำหน่าย",
                  "รายละเอียด",
                  "หมายเหตุ",
                  "จัดการ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      px-4
                      py-4
                      text-center
                    "
                  >
                    {title}
                  </th>
                ))}

              </tr>

            </thead>


            <tbody>

              {receives.length > 0 ? (

                receives.map(
                  (
                    receive: Receive,
                    index: number
                  ) => (

                  <tr
                    key={receive.id}
                    className="
                      border-t
                      border-slate-700
                      transition
                      hover:bg-slate-800
                    "
                  >

                    <td className="px-4 py-4 text-center font-bold">
                      {index + 1}
                    </td>


                    <td className="px-4 py-4 text-center font-semibold">
                      {new Date(
                        receive.receiveDate
                      ).toLocaleDateString("th-TH")}
                    </td>


                    <td className="px-4 py-4 text-center">

                      <span
                        className="
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


                    <td className="px-4 py-4 font-semibold">
                      {receive.vendor.name}
                    </td>


                    <td className="px-4 py-4 text-center">

                      <Link
                        href={`/receive/${receive.id}`}
                        className="
                          rounded-xl
                          bg-cyan-600
                          px-4
                          py-2
                          font-extrabold
                          text-white
                          shadow-md
                          transition
                          hover:bg-cyan-700
                          hover:scale-105
                        "
                      >
                        ดูรายการ
                      </Link>

                    </td>


                    <td className="px-4 py-4 font-semibold">

                      {
                        receive.remark ??
                        <span className="italic text-slate-400">
                          -
                        </span>
                      }

                    </td>


                    <td className="px-4 py-4">

                      <div
                        className="
                          flex
                          justify-center
                          gap-3
                        "
                      >

                        <Link
                          href={`/receive/${receive.id}/edit`}
                          className="
                            rounded-xl
                            bg-gradient-to-r
                            from-amber-500
                            to-orange-500
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow-md
                            transition
                            hover:scale-105
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

                ))

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