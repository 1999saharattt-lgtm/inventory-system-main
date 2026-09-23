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
   ตัวอย่าง 23 ก.ย. 69
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

  const day = date.getDate();

  const month =
    thaiShortMonths[date.getMonth()];

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
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params = await searchParams;

  /* =======================================================
     DATE FILTER
  ======================================================= */

  const now = new Date();

  let startDate:
    | Date
    | undefined;

  let endDate:
    | Date
    | undefined;

  /* =======================================================
     TODAY
  ======================================================= */

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

  /* =======================================================
     CURRENT MONTH
  ======================================================= */

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

  /* =======================================================
     LOAD RECEIVE DATA

     เรียง:
     1. วันที่รับเข้าล่าสุดอยู่ด้านบน
     2. วันที่เก่าอยู่ด้านล่าง
     3. ถ้าวันที่ซ้ำกัน รายการที่บันทึกใหม่กว่าอยู่ด้านบน
  ======================================================= */

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

  /* =======================================================
     FILTER DESCRIPTION
  ======================================================= */

  let filterText =
    "รายการรับเข้าพัสดุทั้งหมด";

  if (params.date === "today") {
    filterText =
      "รายการรับเข้าพัสดุวันนี้";
  } else if (
    params.period === "month"
  ) {
    filterText =
      "รายการรับเข้าพัสดุประจำเดือนนี้";
  }

  /* =======================================================
     TABLE SUBTITLE
  ======================================================= */

  let tableSubtitle =
    "ข้อมูลการรับเข้าพัสดุทั้งหมด";

  if (params.date === "today") {
    tableSubtitle =
      "ข้อมูลการรับเข้าพัสดุของวันนี้";
  } else if (
    params.period === "month"
  ) {
    tableSubtitle =
      "ข้อมูลการรับเข้าพัสดุประจำเดือนนี้";
  }

  /* =======================================================
     UI
  ======================================================= */

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
            icon={
              <span aria-hidden="true">
                ＋
              </span>
            }
          >
            เพิ่มรายการ
          </AppButton>
        }
      />

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <AppTableCard
        title="รายการเอกสารรับเข้า"
        subtitle={tableSubtitle}
        badge={`${receives.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE SCROLL
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
              {receives.length > 0 ? (
                receives.map(
                  (
                    receive: Receive,
                    index: number
                  ) => (
                    <tr
                      key={receive.id}
                      className={`
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ORDER
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
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {(
                          index + 1
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* =======================================
                          RECEIVE DATE
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
                          DOCUMENT NUMBER
                      ======================================= */}

                      <td
                        className="
                          min-w-[160px]
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
                        {receive.documentNo ||
                          "-"}
                      </td>

                      {/* =======================================
                          VENDOR
                      ======================================= */}

                      <td
                        className="
                          min-w-[220px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {receive.vendor
                          ?.name || "-"}
                      </td>

                      {/* =======================================
                          DETAILS
                      ======================================= */}

                      <td
                        className="
                          min-w-[130px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3

                          text-center
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <AppButton
                            href={`/receive/${receive.id}`}
                            variant="primary"
                            size="sm"
                          >
                            เปิด
                          </AppButton>
                        </div>
                      </td>

                      {/* =======================================
                          REMARK
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
                          ACTIONS
                      ======================================= */}

                      <td
                        className="
                          min-w-[200px]
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
                              <span
                                aria-hidden="true"
                              >
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
                      {/* ICON */}

                      <div
                        className="
                          grid
                          h-16
                          w-16
                          place-items-center

                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        📥
                      </div>

                      {/* TITLE */}

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight
                          !text-slate-900
                        "
                      >
                        {params.date ===
                        "today"
                          ? "วันนี้ยังไม่มีรายการรับเข้าพัสดุ"
                          : params.period ===
                              "month"
                            ? "เดือนนี้ยังไม่มีรายการรับเข้าพัสดุ"
                            : "ยังไม่มีข้อมูลรับเข้าพัสดุ"}
                      </p>

                      {/* DESCRIPTION */}

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

                      {/* ACTION */}

                      <div className="mt-5">
                        <AppButton
                          href="/receive/create"
                          variant="primary"
                          size="md"
                          icon={
                            <span
                              aria-hidden="true"
                            >
                              ＋
                            </span>
                          }
                        >
                          เพิ่มรายการ
                        </AppButton>
                      </div>
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