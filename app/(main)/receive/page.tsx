import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

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

/* =========================================================
   วันที่ไทยแบบย่อ
   ตัวอย่าง 01 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month =
    thaiShortMonths[
      date.getMonth()
    ];

  const buddhistYear = String(
    date.getFullYear() + 543
  ).slice(-2);

  return `${day} ${month} ${buddhistYear}`;
}

/* =========================================================
   PAGE
========================================================= */

export default async function ReceivePage({
  searchParams,
}: ReceivePageProps) {
  const params =
    await searchParams;

  /* =========================================================
     DATE FILTER
  ========================================================= */

  const now = new Date();

  let startDate:
    | Date
    | undefined;

  let endDate:
    | Date
    | undefined;

  /* =========================================================
     TODAY
  ========================================================= */

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

  /* =========================================================
     CURRENT MONTH
  ========================================================= */

  if (
    params.period === "month"
  ) {
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

  /* =========================================================
     LOAD RECEIVE DATA

     เรียง:
     1. วันที่รับเข้าล่าสุดอยู่ด้านบน
     2. วันที่เก่าอยู่ด้านล่าง
     3. ถ้าวันที่ซ้ำกัน รายการที่บันทึกใหม่กว่าอยู่ด้านบน
  ========================================================= */

  const receives =
    await prisma.receive.findMany(
      {
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

        orderBy: [
          {
            receiveDate: "desc",
          },
          {
            id: "desc",
          },
        ],
      }
    );

  /* =========================================================
     FILTER DESCRIPTION
  ========================================================= */

  let filterText =
    "รายการรับเข้าพัสดุทั้งหมด";

  if (
    params.date === "today"
  ) {
    filterText =
      "รายการรับเข้าพัสดุวันนี้";
  } else if (
    params.period === "month"
  ) {
    filterText =
      "รายการรับเข้าพัสดุประจำเดือนนี้";
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📥"
        title="รายการรับเข้าพัสดุ"
        subtitle={filterText}
        actions={
          <AppButton
            href="/receive/create"
            variant="primary"
            size="md"
          >
            <span>＋</span>
            <span>
              เพิ่มรายการ
            </span>
          </AppButton>
        }
      />

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3

          rounded-[24px]

          border
          border-slate-200

          bg-white/80

          p-4

          shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]

          backdrop-blur-2xl

          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-5
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-sm
              font-extrabold
              !text-slate-500
            "
          >
            สรุปรายการรับเข้า
          </p>

          <p
            className="
              mt-0.5
              text-lg
              font-black
              !text-slate-900
            "
          >
            {filterText}
          </p>
        </div>

        <div
          className="
            inline-flex
            w-fit
            items-center
            gap-2

            rounded-full

            border
            border-slate-300

            bg-slate-100/80

            px-3
            py-1.5

            text-sm
            font-extrabold
            !text-slate-700
          "
        >
          <span>ทั้งหมด</span>

          <span
            className="
              inline-flex
              min-w-6
              items-center
              justify-center

              rounded-full

              bg-white

              px-2
              py-0.5

              !text-slate-900

              shadow-sm
            "
          >
            {receives.length.toLocaleString(
              "th-TH"
            )}
          </span>
        </div>
      </section>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden

          rounded-[28px]

          border
          border-slate-300

          bg-white/85

          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            TABLE CARD HEADER
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2

            border-b
            border-black

            bg-white/70

            px-5
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900

                sm:text-xl
              "
            >
              รายการเอกสารรับเข้า
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              เรียงจากวันที่รับเข้าล่าสุด
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2

              rounded-full

              border
              border-slate-300

              bg-slate-100/80

              px-3
              py-1.5

              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            <span>ทั้งหมด</span>

            <span
              className="
                inline-flex
                min-w-6
                items-center
                justify-center

                rounded-full

                bg-white

                px-2
                py-0.5

                !text-slate-900

                shadow-sm
              "
            >
              {receives.length.toLocaleString(
                "th-TH"
              )}
            </span>
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div
          className="
            w-full
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[980px]

              border-collapse

              border
              border-black

              bg-white
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
                ].map(
                  (tableTitle) => (
                    <th
                      key={
                        tableTitle
                      }
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-4
                        py-4

                        text-center
                        text-base
                        font-extrabold
                        !text-white

                        sm:text-lg
                      "
                    >
                      {tableTitle}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {receives.length >
              0 ? (
                receives.map(
                  (
                    receive: Receive,
                    index: number
                  ) => (
                    <tr
                      key={
                        receive.id
                      }
                      className={`
                        transition-colors
                        duration-200

                        ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ลำดับ
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* =======================================
                          วันที่รับเข้า
                          ไทยแบบย่อ เช่น 22 ก.ย. 69
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          receive.receiveDate
                        )}
                      </td>

                      {/* =======================================
                          เลขที่เอกสาร
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {receive.documentNo}
                      </td>

                      {/* =======================================
                          ผู้จำหน่าย
                      ======================================= */}

                      <td
                        className="
                          min-w-[200px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {receive.vendor.name}
                      </td>

                      {/* =======================================
                          รายละเอียด
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3

                          text-center
                        "
                      >
                        <AppButton
                          href={`/receive/${receive.id}`}
                          variant="primary"
                          size="sm"
                        >
                          เปิด
                        </AppButton>
                      </td>

                      {/* =======================================
                          หมายเหตุ
                      ======================================= */}

                      <td
                        className="
                          min-w-[190px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-semibold
                          !text-slate-700
                        "
                      >
                        {receive.remark ??
                          "-"}
                      </td>

                      {/* =======================================
                          จัดการ
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          <AppButton
                            href={`/receive/${receive.id}/edit`}
                            variant="primary"
                            size="sm"
                          >
                            <span>
                              ✏️
                            </span>

                            <span>
                              แก้ไข
                            </span>
                          </AppButton>

                          <DeleteButton
                            id={
                              receive.id
                            }
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

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                      "
                    >
                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center

                          rounded-[20px]

                          bg-slate-100

                          text-3xl

                          shadow-inner
                        "
                      >
                        📥
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        ยังไม่มีข้อมูลรับเข้าพัสดุ
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        เมื่อมีการบันทึกรับเข้า
                        รายการจะแสดงในตารางนี้
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppPage>
  );
}