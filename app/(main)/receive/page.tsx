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
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
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
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-5xl
            "
          >
            📥 รายการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-semibold
              leading-tight
              !text-slate-200
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
            px-5
            py-3
            text-center
            text-base
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:text-lg
          "
        >
          + เพิ่มรายการรับ
        </Link>
      </div>

      {/* =====================================================
          Table
      ===================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              border-collapse
              border
              border-black
            "
          >
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
                      border
                      border-black
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-3
                      text-center
                      text-lg
                      font-extrabold
                      !text-white
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-slate-900">
              {receives.length > 0 ? (
                receives.map(
                  (receive: Receive, index: number) => (
                    <tr
                      key={receive.id}
                      className="
                        text-slate-900
                        transition
                        hover:bg-emerald-50
                      "
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                        "
                      >
                        {index + 1}
                      </td>

                      {/* วันที่รับเข้า */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        {new Date(
                          receive.receiveDate
                        ).toLocaleDateString("th-TH")}
                      </td>

                      {/* เลขที่เอกสาร */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        {receive.documentNo}
                      </td>

                      {/* ผู้จำหน่าย */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        {receive.vendor.name}
                      </td>

                      {/* รายละเอียด */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        <Link
                          href={`/receive/${receive.id}`}
                          className="
                            inline-block
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

                      {/* หมายเหตุ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        {receive.remark ?? "-"}
                      </td>

                      {/* จัดการ */}

                      <td
                        className="
                          border
                          border-black
                          px-3
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
                )
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      border
                      border-black
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