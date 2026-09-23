import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

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
   THAI SHORT DATE
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
    await prisma.receive.findMany({
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
    });

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
            icon={<span>＋</span>}
          >
            เพิ่มรายการ
          </AppButton>
        }
      />

      {/* =====================================================
          TABLE CARD
          ใช้ Component กลางของระบบ
      ===================================================== */}

      <AppTableCard
        title="รายการเอกสารรับเข้า"
        subtitle={`เรียงจากวันที่รับเข้าล่าสุด • ทั้งหมด ${receives.length} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE
        =================================================== */}

        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[980px]
              border-collapse
              bg-white
              text-sm
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

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
                      key={tableTitle}
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

            {/* =================================================
                TABLE BODY
            ================================================= */}

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
                        transition-all
                        duration-200

                        ${
                          index % 2 ===
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
                          tabular-nums
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
                        {
                          receive.vendor
                            .name
                        }
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
                          min-w-[220px]
                          max-w-[360px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-semibold
                          leading-relaxed
                          !text-slate-700
                        "
                      >
                        <div
                          className="
                            line-clamp-2
                            break-words
                          "
                        >
                          {receive.remark ??
                            "-"}
                        </div>
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
                            icon={
                              <span>
                                ✏️
                              </span>
                            }
                          >
                            แก้ไข
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
                /* =============================================
                   EMPTY STATE
                ============================================= */

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
                        justify-center
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

                          border
                          border-slate-200/80

                          bg-white/90

                          text-3xl

                          shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]

                          ring-1
                          ring-black/[0.025]

                          backdrop-blur-xl
                        "
                      >
                        📥
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight
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
                          leading-relaxed
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
      </AppTableCard>
    </AppPage>
  );
}