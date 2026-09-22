import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

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

  /* =========================================================
     Date Filter
  ========================================================= */

  const now = new Date();

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  /* =========================================================
     Today
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
     Current Month
  ========================================================= */

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

  /* =========================================================
     Load Receive Data
  ========================================================= */

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

  /* =========================================================
     Filter Description
  ========================================================= */

  let filterText = "รายการรับเข้าพัสดุทั้งหมด";

  if (params.date === "today") {
    filterText = "รายการรับเข้าพัสดุวันนี้";
  } else if (params.period === "month") {
    filterText = "รายการรับเข้าพัสดุประจำเดือนนี้";
  }

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="📥"
        title="รายการรับเข้าพัสดุ"
        subtitle={filterText}
        actions={
          <>
            {/* เพิ่มรายการ */}

            <Link
              href="/receive/create"
              prefetch
              className="
                group
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-[16px]
                border
                border-emerald-500/20
                bg-emerald-600
                px-4
                text-sm
                font-extrabold
                !text-white
                shadow-[0_12px_28px_-16px_rgba(5,150,105,0.55)]
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:bg-emerald-700
                hover:shadow-[0_18px_34px_-18px_rgba(5,150,105,0.6)]
                active:translate-y-0
                active:scale-[0.97]
                sm:px-5
              "
            >
              <span
                className="
                  text-lg
                  leading-none
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              >
                +
              </span>

              <span>เพิ่มรายการ</span>
            </Link>

            {/* กลับ */}

            <Link
              href="/"
              prefetch
              className="
                group
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-[16px]
                border
                border-slate-200
                bg-white/90
                px-4
                text-sm
                font-extrabold
                !text-slate-800
                shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)]
                backdrop-blur-xl
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:border-slate-300
                hover:bg-white
                hover:shadow-[0_16px_30px_-18px_rgba(15,23,42,0.4)]
                active:translate-y-0
                active:scale-[0.97]
                sm:px-5
              "
            >
              <span
                className="
                  transition-transform
                  duration-300
                  group-hover:-translate-x-0.5
                "
              >
                ←
              </span>

              <span>กลับ</span>
            </Link>
          </>
        }
      />

      {/* =====================================================
          Summary
      ===================================================== */}

      <section
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3
          rounded-[22px]
          border
          border-white/80
          bg-white/75
          p-4
          shadow-[0_16px_45px_-28px_rgba(15,23,42,0.3)]
          backdrop-blur-2xl
          sm:flex-row
          sm:items-center
          sm:justify-between
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
            h-10
            shrink-0
            items-center
            justify-center
            rounded-[14px]
            border
            border-slate-200
            bg-slate-50
            px-4
            text-sm
            font-extrabold
            !text-slate-700
          "
        >
          {receives.length.toLocaleString("th-TH")} รายการ
        </div>
      </section>

      {/* =====================================================
          Table Card
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-white/80
          bg-white/85
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
        "
      >
        {/* Table Header */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-slate-200/80
            px-5
            py-4
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
              เรียงจากรายการล่าสุด
            </p>
          </div>

          <span
            className="
              shrink-0
              rounded-full
              border
              border-slate-200
              bg-slate-50
              px-3
              py-1.5
              text-xs
              font-extrabold
              !text-slate-600
            "
          >
            {receives.length.toLocaleString("th-TH")} รายการ
          </span>
        </div>

        {/* ===================================================
            Table
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
                      border-black
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

            <tbody className="text-slate-900">
              {receives.length > 0 ? (
                receives.map(
                  (
                    receive: Receive,
                    index: number
                  ) => (
                    <tr
                      key={receive.id}
                      className="
                        text-slate-900
                        transition-colors
                        duration-200
                        hover:bg-slate-50
                      "
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          !text-slate-700
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
                          px-4
                          py-3.5
                          text-center
                          font-bold
                          !text-slate-800
                        "
                      >
                        {new Date(
                          receive.receiveDate
                        ).toLocaleDateString(
                          "th-TH"
                        )}
                      </td>

                      {/* เลขที่เอกสาร */}

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

                      {/* ผู้จำหน่าย */}

                      <td
                        className="
                          border
                          border-black
                          px-4
                          py-3.5
                          font-bold
                          !text-slate-800
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
                          px-4
                          py-3.5
                          text-center
                        "
                      >
                        <Link
                          href={`/receive/${receive.id}`}
                          prefetch
                          className="
                            inline-flex
                            h-9
                            items-center
                            justify-center
                            whitespace-nowrap
                            rounded-[13px]
                            border
                            border-slate-200
                            bg-white
                            px-4
                            text-sm
                            font-extrabold
                            !text-slate-800
                            shadow-[0_8px_20px_-14px_rgba(15,23,42,0.45)]
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-slate-50
                            active:translate-y-0
                            active:scale-[0.97]
                          "
                        >
                          ดูรายการ
                        </Link>
                      </td>

                      {/* หมายเหตุ */}

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
                        {receive.remark ?? "-"}
                      </td>

                      {/* จัดการ */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
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
                          <Link
                            href={`/receive/${receive.id}/edit`}
                            prefetch
                            className="
                              inline-flex
                              h-9
                              min-w-[72px]
                              items-center
                              justify-center
                              rounded-[13px]
                              border
                              border-slate-700
                              bg-slate-900
                              px-4
                              text-sm
                              font-extrabold
                              !text-white
                              shadow-[0_8px_20px_-14px_rgba(15,23,42,0.6)]
                              transition-all
                              duration-300
                              hover:-translate-y-0.5
                              hover:bg-slate-800
                              active:translate-y-0
                              active:scale-[0.97]
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
                      px-4
                      py-16
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-sm
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
                          border-slate-200
                          bg-slate-50
                          text-3xl
                          shadow-sm
                        "
                      >
                        📥
                      </div>

                      <p
                        className="
                          mt-4
                          text-lg
                          font-black
                          !text-slate-800
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