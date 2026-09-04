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

type ReceivePageProps = {
  searchParams: Promise<{
    date?: string;
    period?: string;
  }>;
};

export default async function ReceivePage({
  searchParams,
}: ReceivePageProps) {
  const params = await searchParams;

  // =====================================================
  // กำหนดช่วงวันที่สำหรับการกรอง
  // =====================================================

  const now = new Date();

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  // รับเข้าวันนี้
  if (params.date === "today") {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
  }

  // รับเข้าประจำเดือน
  if (params.period === "month") {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );
  }

  const receives = await prisma.receive.findMany({
    where:
      startDate && endDate
        ? {
            receiveDate: {
              gte: startDate,
              lt: endDate,
            },
          }
        : undefined,

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
              sm:text-3xl
            "
          >
            📥 รายการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            แสดงรายการเอกสารรับเข้าพัสดุทั้งหมด
          </p>
        </div>

        <Link
          href="/receive/create"
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:px-5
            sm:py-3
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
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-300
          bg-white
          shadow-lg
        "
      >
        <div className="w-full min-w-0 overflow-x-auto">
          <table
            className="
              w-full
              min-w-[900px]
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
                      whitespace-nowrap
                      border
                      border-black
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-3
                      text-center
                      text-base
                      font-extrabold
                      !text-white
                      sm:px-4
                      sm:py-4
                      sm:text-lg
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
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                          sm:px-4
                        "
                      >
                        {index + 1}
                      </td>

                      {/* วันที่รับเข้า */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          sm:px-4
                        "
                      >
                        {new Date(
                          receive.receiveDate
                        ).toLocaleDateString("th-TH")}
                      </td>

                      {/* เลขที่เอกสาร */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          sm:px-4
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
                          sm:px-4
                        "
                      >
                        {receive.vendor.name}
                      </td>

                      {/* รายละเอียด */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          sm:px-4
                        "
                      >
                        <Link
                          href={`/receive/${receive.id}`}
                          className="
                            inline-block
                            rounded-lg
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            font-extrabold
                            text-white
                            shadow
                            transition
                            hover:bg-slate-700
                            sm:px-4
                            sm:text-base
                          "
                        >
                          ดูรายการ
                        </Link>
                      </td>

                      {/* หมายเหตุ */}

                      <td
                        className="
                          min-w-[180px]
                          border
                          border-black
                          px-3
                          py-3
                          sm:px-4
                        "
                      >
                        {receive.remark ?? "-"}
                      </td>

                      {/* จัดการ */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          sm:px-4
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
                              px-3
                              py-2
                              text-sm
                              font-extrabold
                              text-white
                              shadow
                              transition
                              hover:bg-slate-700
                              sm:px-4
                              sm:text-base
                            "
                          >
                            แก้ไข
                          </Link>

                          <DeleteButton id={receive.id} />
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