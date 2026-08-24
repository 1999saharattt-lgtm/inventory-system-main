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
    q?: string;
  }>;
};

export default async function ReceivePage({
  searchParams,
}: ReceivePageProps) {
  // =====================================================
  // Search Params
  // =====================================================

  const params = await searchParams;

  const isToday = params.date === "today";
  const search = params.q?.trim() ?? "";

  // =====================================================
  // วันที่วันนี้
  // =====================================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // =====================================================
  // Where
  // =====================================================

  const where = {
    ...(isToday
      ? {
          receiveDate: {
            gte: today,
            lt: tomorrow,
          },
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              documentNo: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              vendor: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  // =====================================================
  // ดึงรายการรับ
  // =====================================================

  const receives = await prisma.receive.findMany({
    where,

    include: {
      vendor: true,
      items: true,
    },

    orderBy: {
      id: "desc",
    },
  });

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-4
          rounded-3xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-5
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-7
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-3xl
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
              font-bold
              !text-slate-200
              sm:text-xl
            "
          >
            {isToday
              ? "แสดงรายการเอกสารรับเข้าพัสดุของวันนี้"
              : "แสดงรายการเอกสารรับเข้าพัสดุทั้งหมด"}
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
          Search
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-lg
          sm:p-5
        "
      >
        <form
          method="GET"
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3
            sm:flex-row
            sm:items-end
          "
        >
          {isToday && (
            <input
              type="hidden"
              name="date"
              value="today"
            />
          )}

          <div className="min-w-0 flex-1">
            <label
              htmlFor="receive-search"
              className="
                mb-2
                block
                text-sm
                font-extrabold
                text-slate-800
                sm:text-base
              "
            >
              🔎 ค้นหารายการรับเข้า
            </label>

            <input
              id="receive-search"
              type="text"
              name="q"
              defaultValue={search}
              placeholder="ค้นหาเลขที่เอกสาร หรือชื่อผู้จำหน่าย..."
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-sm
                font-semibold
                text-slate-900
                outline-none
                shadow-sm
                transition
                placeholder:text-slate-400
                focus:border-slate-500
                focus:ring-2
                focus:ring-slate-200
                sm:text-base
              "
            />
          </div>

          <button
            type="submit"
            className="
              w-full
              shrink-0
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-950
              px-6
              py-3
              text-sm
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
              sm:w-auto
              sm:text-base
            "
          >
            🔍 ค้นหา
          </button>

          {(search || isToday) && (
            <Link
              href="/receive"
              className="
                w-full
                shrink-0
                rounded-xl
                border
                border-slate-300
                bg-white
                px-6
                py-3
                text-center
                text-sm
                font-extrabold
                text-slate-800
                shadow-sm
                transition
                hover:bg-slate-100
                sm:w-auto
                sm:text-base
              "
            >
              ล้างการค้นหา
            </Link>
          )}
        </form>
      </div>

      {/* =====================================================
          Result Information
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-2
          rounded-2xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          shadow-lg
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-5
        "
      >
        <p
          className="
            break-words
            text-sm
            font-extrabold
            text-slate-800
            sm:text-base
          "
        >
          {isToday
            ? "📅 รายการรับเข้าของวันนี้"
            : "📋 รายการรับเข้าพัสดุทั้งหมด"}
          {search && (
            <span className="font-semibold text-slate-500">
              {" "}
              • ค้นหา: "{search}"
            </span>
          )}
        </p>

        <p
          className="
            shrink-0
            text-sm
            font-extrabold
            text-slate-600
            sm:text-base
          "
        >
          พบ {receives.length} รายการ
        </p>
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
              min-w-[1100px]
              w-full
              border-collapse
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
                      !text-white
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
                        border-b
                        border-slate-900
                        transition
                        hover:bg-blue-50
                      "
                    >
                      {/* =================================================
                          ลำดับ
                      ================================================= */}

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

                      {/* =================================================
                          วันที่รับเข้า
                      ================================================= */}

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
                        ).toLocaleDateString(
                          "th-TH"
                        )}
                      </td>

                      {/* =================================================
                          เลขที่เอกสาร
                      ================================================= */}

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

                      {/* =================================================
                          ผู้จำหน่าย
                      ================================================= */}

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

                      {/* =================================================
                          รายละเอียด
                      ================================================= */}

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
                            bg-gradient-to-r
                            from-slate-800
                            to-slate-950
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow-lg
                            transition
                            hover:scale-105
                          "
                        >
                          ดูรายการ
                        </Link>
                      </td>

                      {/* =================================================
                          หมายเหตุ
                      ================================================= */}

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

                      {/* =================================================
                          จัดการ
                      ================================================= */}

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
                              bg-gradient-to-r
                              from-slate-800
                              to-slate-950
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow-lg
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
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      border
                      border-slate-900
                      py-12
                      text-center
                      text-lg
                      font-extrabold
                      text-slate-500
                    "
                  >
                    {isToday
                      ? "วันนี้ยังไม่มีรายการรับเข้าพัสดุ"
                      : search
                        ? "ไม่พบรายการรับเข้าพัสดุที่ค้นหา"
                        : "ยังไม่มีข้อมูลรับเข้าพัสดุ"}
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