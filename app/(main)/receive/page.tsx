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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Header */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:gap-4
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              !text-white
              text-2xl
              font-extrabold
              leading-tight
              sm:text-5xl
            "
          >
            📥 รายการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              !text-slate-200
              text-base
              font-semibold
              leading-tight
              sm:mt-3
              sm:text-xl
            "
          >
            แสดงรายการเอกสารรับเข้าพัสดุทั้งหมด
          </p>
        </div>

        <Link
          href="/receive/create"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          + เพิ่มรายการรับ
        </Link>
      </div>

      {/* Table */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >
        <div className="w-full min-w-0 overflow-x-auto">
          <table
            className="
              min-w-[1100px]
              border
              border-slate-900
            "
          >
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
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap
                      border
                      border-slate-900
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
              {receives.length > 0 ? (
                receives.map(
                  (receive: Receive, index: number) => (
                    <tr
                      key={receive.id}
                      className="
                        border-b-2
                        border-slate-900
                        hover:bg-blue-50
                      "
                    >
                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {new Date(
                          receive.receiveDate
                        ).toLocaleDateString("th-TH")}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {receive.documentNo}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {receive.vendor.name}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        <Link
                          href={`/receive/${receive.id}`}
                          className="
                            inline-block
                            whitespace-nowrap
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
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {receive.remark ?? "-"}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
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
                              whitespace-nowrap
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
                )
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      border-b-2
                      border-slate-900
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}