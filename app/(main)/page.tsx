import Link from "next/link";
import { prisma } from "@/lib/prisma";

const thaiMonthsShort = [
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

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date) {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addMonths(date: Date, amount: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

export default async function Home() {
  const now = new Date();

  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const currentMonthStart = startOfMonth(now);
  const nextMonthStart = addMonths(currentMonthStart, 1);

  const sixMonthsAgo = startOfMonth(addMonths(now, -5));

  // =====================================================
  // Main dashboard data
  // =====================================================

  const [
    totalMaterials,
    lowStock,
    outOfStock,
    normalStock,
    receiveToday,
    issueToday,
    receiveThisMonth,
    issueThisMonth,
    pendingIssues,
  ] = await Promise.all([
    // จำนวนพัสดุทั้งหมด
    prisma.material.count(),

    // พัสดุใกล้หมด
    prisma.material.count({
      where: {
        balance: {
          gt: 0,
          lt: 10,
        },
      },
    }),

    // พัสดุหมด
    prisma.material.count({
      where: {
        balance: {
          lte: 0,
        },
      },
    }),

    // พัสดุคงเหลือปกติ
    prisma.material.count({
      where: {
        balance: {
          gte: 10,
        },
      },
    }),

    // รับเข้าวันนี้
    prisma.receive.count({
      where: {
        receiveDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),

    // เบิกจ่ายวันนี้
    prisma.issue.count({
      where: {
        issueDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),

    // รับเข้าประจำเดือนนี้
    prisma.receive.count({
      where: {
        receiveDate: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    // เบิกจ่ายประจำเดือนนี้
    prisma.issue.count({
      where: {
        issueDate: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    // ใบเบิกที่รอดำเนินการ
    prisma.issue.count({
      where: {
        status: "PENDING",
      },
    }),
  ]);

  // =====================================================
  // 6 Months Movement
  // =====================================================

  const monthData = await Promise.all(
    Array.from({ length: 6 }, async (_, index) => {
      const monthStart = startOfMonth(addMonths(now, index - 5));
      const nextMonth = addMonths(monthStart, 1);

      const [receiveCount, issueCount] = await Promise.all([
        prisma.receive.count({
          where: {
            receiveDate: {
              gte: monthStart,
              lt: nextMonth,
            },
          },
        }),

        prisma.issue.count({
          where: {
            issueDate: {
              gte: monthStart,
              lt: nextMonth,
            },
          },
        }),
      ]);

      return {
        label: thaiMonthsShort[monthStart.getMonth()],
        year: monthStart.getFullYear() + 543,
        receive: receiveCount,
        issue: issueCount,
      };
    })
  );

  const maxMovement = Math.max(
    1,
    ...monthData.flatMap((item) => [
      item.receive,
      item.issue,
    ])
  );

  const totalStockStatus =
    outOfStock + lowStock + normalStock;

  // =====================================================
  // Summary cards
  // =====================================================

  const cards = [
    {
      title: "จำนวนพัสดุทั้งหมด",
      value: totalMaterials,
      unit: "รายการ",
      icon: "📦",
      color: "bg-blue-600",
      hover: "hover:border-blue-300",
      href: "/materials/summary",
      detail: `รับเข้าเดือนนี้ ${receiveThisMonth} รายการ`,
    },
    {
      title: "รับเข้าวันนี้",
      value: receiveToday,
      unit: "ใบรับเข้า",
      icon: "📥",
      color: "bg-emerald-600",
      hover: "hover:border-emerald-300",
      href: "/receive/today",
      detail: `เดือนนี้ ${receiveThisMonth} รายการ`,
    },
    {
      title: "เบิกจ่ายวันนี้",
      value: issueToday,
      unit: "ใบเบิกจ่าย",
      icon: "📤",
      color: "bg-amber-600",
      hover: "hover:border-amber-300",
      href: "/issue/today",
      detail: `เดือนนี้ ${issueThisMonth} รายการ`,
    },
    {
      title: "พัสดุที่ต้องตรวจสอบ",
      value: lowStock + outOfStock,
      unit: "รายการ",
      icon: "⚠️",
      color: "bg-red-600",
      hover: "hover:border-red-300",
      href: "/materials/low-stock",
      detail: `หมด ${outOfStock} · ใกล้หมด ${lowStock}`,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* =====================================================
          Summary Cards
      ===================================================== */}

      <div
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-3
          sm:gap-4
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        {cards.map((card) => {
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`
                group
                min-w-0
                overflow-hidden
                rounded-2xl
                border
                border-slate-700
                bg-gradient-to-br
                from-slate-950
                via-slate-900
                to-slate-800
                text-white
                shadow-xl
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
                ${card.hover}
              `}
            >
              <div className={`h-1 ${card.color}`} />

              <div className="p-4 sm:p-5">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-xl font-extrabold leading-tight !text-white sm:text-2xl">
                      {card.title}
                    </p>

                    <p className="mt-1 text-4xl font-extrabold leading-none !text-white sm:text-5xl">
                      {card.value}
                    </p>

                    <p className="mt-1 text-base font-bold !text-slate-200 sm:text-lg">
                      {card.unit}
                    </p>

                    <p className="mt-2 break-words text-sm font-bold !text-slate-300 sm:text-base">
                      {card.detail}
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/20
                      bg-white/10
                      text-xl
                      backdrop-blur
                      sm:h-14
                      sm:w-14
                      sm:text-2xl
                    "
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* =====================================================
          Action + Stock Status
      ===================================================== */}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ===================================================
            Pending Actions
        =================================================== */}

        <div
          className="
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            text-white
            shadow-xl
          "
        >
          <div
            className="
              border-b
              border-slate-700
              bg-gradient-to-r
              from-slate-950
              via-slate-900
              to-slate-800
              px-4
              py-4
              sm:px-5
              sm:py-5
            "
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold leading-tight !text-white sm:text-3xl">
                  🔔 รายการที่ต้องดำเนินการ
                </h2>

                <p className="mt-1 text-base font-bold !text-slate-300">
                  รายการที่อยู่ระหว่างการดำเนินงาน
                </p>
              </div>

              <span
                className="
                  flex
                  h-12
                  min-w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-red-400/30
                  bg-red-500/15
                  px-3
                  text-xl
                  font-extrabold
                  !text-red-300
                "
              >
                {pendingIssues}
              </span>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <Link
              href="/issue"
              className="
                flex
                items-center
                justify-between
                gap-3
                rounded-xl
                border
                border-slate-700
                bg-slate-800/80
                px-4
                py-4
                transition-all
                hover:border-red-400/50
                hover:bg-slate-700
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">🔴</span>

                <div className="min-w-0">
                  <p className="text-lg font-extrabold !text-white">
                    ใบเบิกที่รอดำเนินการ
                  </p>

                  <p className="text-sm font-bold !text-slate-300 sm:text-base">
                    ตรวจสอบรายการเบิกจ่ายที่ยังไม่ดำเนินการ
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-lg font-extrabold !text-red-300">
                {pendingIssues}
              </span>
            </Link>

            <Link
              href="/materials/low-stock"
              className="
                flex
                items-center
                justify-between
                gap-3
                rounded-xl
                border
                border-slate-700
                bg-slate-800/80
                px-4
                py-4
                transition-all
                hover:border-amber-400/50
                hover:bg-slate-700
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">🟠</span>

                <div className="min-w-0">
                  <p className="text-lg font-extrabold !text-white">
                    พัสดุที่ต้องตรวจสอบ
                  </p>

                  <p className="text-sm font-bold !text-slate-300 sm:text-base">
                    พัสดุหมดและพัสดุใกล้หมด
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-lg font-extrabold !text-amber-300">
                {lowStock + outOfStock}
              </span>
            </Link>
          </div>
        </div>

        {/* ===================================================
            Stock Status
        =================================================== */}

        <div
          className="
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            text-white
            shadow-xl
          "
        >
          <div
            className="
              border-b
              border-slate-700
              bg-gradient-to-r
              from-slate-950
              via-slate-900
              to-slate-800
              px-4
              py-4
              sm:px-5
              sm:py-5
            "
          >
            <h2 className="text-2xl font-extrabold leading-tight !text-white sm:text-3xl">
              📊 สถานะพัสดุคงเหลือ
            </h2>

            <p className="mt-1 text-base font-bold !text-slate-300">
              สรุปจากจำนวนคงเหลือปัจจุบัน
            </p>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {/* Normal */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-lg font-extrabold !text-white">
                  🟢 คงเหลือปกติ
                </span>

                <span className="text-lg font-extrabold !text-emerald-300">
                  {normalStock}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${
                      totalStockStatus > 0
                        ? (normalStock / totalStockStatus) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Low */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-lg font-extrabold !text-white">
                  🟠 ใกล้หมด
                </span>

                <span className="text-lg font-extrabold !text-amber-300">
                  {lowStock}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${
                      totalStockStatus > 0
                        ? (lowStock / totalStockStatus) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Out */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-lg font-extrabold !text-white">
                  🔴 หมด
                </span>

                <span className="text-lg font-extrabold !text-red-300">
                  {outOfStock}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{
                    width: `${
                      totalStockStatus > 0
                        ? (outOfStock / totalStockStatus) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <Link
              href="/materials/summary"
              className="
                mt-2
                flex
                items-center
                justify-center
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                px-4
                py-3
                text-base
                font-extrabold
                !text-white
                transition-all
                hover:bg-slate-700
              "
            >
              ดูรายการพัสดุทั้งหมด →
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          6 Months Movement
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          text-white
          shadow-xl
        "
      >
        <div
          className="
            border-b
            border-slate-700
            bg-gradient-to-r
            from-slate-950
            via-slate-900
            to-slate-800
            px-4
            py-4
            sm:px-5
            sm:py-5
          "
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight !text-white sm:text-3xl">
                📈 การเคลื่อนไหวพัสดุ
              </h2>

              <p className="mt-1 text-base font-bold !text-slate-300">
                เปรียบเทียบการรับเข้าและเบิกจ่ายย้อนหลัง 6 เดือน
              </p>
            </div>

            <div className="flex gap-4 text-sm font-extrabold sm:text-base">
              <span className="!text-emerald-300">
                ● รับเข้า
              </span>

              <span className="!text-amber-300">
                ● เบิกจ่าย
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-6 gap-2 sm:gap-4">
            {monthData.map((month) => {
              const receiveHeight =
                month.receive > 0
                  ? Math.max(
                      8,
                      (month.receive / maxMovement) * 100
                    )
                  : 0;

              const issueHeight =
                month.issue > 0
                  ? Math.max(
                      8,
                      (month.issue / maxMovement) * 100
                    )
                  : 0;

              return (
                <div
                  key={`${month.label}-${month.year}`}
                  className="min-w-0"
                >
                  <div className="mb-2 flex h-40 items-end justify-center gap-1 border-b border-slate-700 sm:h-48 sm:gap-2">
                    <div className="flex h-full w-1/2 items-end justify-center">
                      <div
                        className="
                          w-full
                          max-w-8
                          rounded-t-lg
                          bg-emerald-500
                          transition-all
                          duration-300
                        "
                        style={{
                          height: `${receiveHeight}%`,
                        }}
                        title={`รับเข้า ${month.receive} รายการ`}
                      />
                    </div>

                    <div className="flex h-full w-1/2 items-end justify-center">
                      <div
                        className="
                          w-full
                          max-w-8
                          rounded-t-lg
                          bg-amber-500
                          transition-all
                          duration-300
                        "
                        style={{
                          height: `${issueHeight}%`,
                        }}
                        title={`เบิกจ่าย ${month.issue} รายการ`}
                      />
                    </div>
                  </div>

                  <p className="text-center text-sm font-extrabold !text-white sm:text-base">
                    {month.label}
                  </p>

                  <p className="text-center text-xs font-bold !text-slate-400 sm:text-sm">
                    {month.year}
                  </p>

                  <div className="mt-2 space-y-1 text-center text-xs font-bold sm:text-sm">
                    <p className="!text-emerald-300">
                      รับ {month.receive}
                    </p>

                    <p className="!text-amber-300">
                      เบิก {month.issue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================
          Monthly Summary
      ===================================================== */}

      <div
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4
          md:grid-cols-2
        "
      >
        <Link
          href="/receive"
          className="
            min-w-0
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            p-5
            text-white
            shadow-xl
            transition-all
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-extrabold !text-white sm:text-2xl">
                📥 รับเข้าประจำเดือน
              </p>

              <p className="mt-2 text-4xl font-extrabold !text-emerald-300 sm:text-5xl">
                {receiveThisMonth}
              </p>

              <p className="mt-1 text-base font-bold !text-slate-300">
                ใบรับเข้าในเดือนนี้
              </p>
            </div>

            <span className="text-4xl">📥</span>
          </div>
        </Link>

        <Link
          href="/issue"
          className="
            min-w-0
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            p-5
            text-white
            shadow-xl
            transition-all
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-extrabold !text-white sm:text-2xl">
                📤 เบิกจ่ายประจำเดือน
              </p>

              <p className="mt-2 text-4xl font-extrabold !text-amber-300 sm:text-5xl">
                {issueThisMonth}
              </p>

              <p className="mt-1 text-base font-bold !text-slate-300">
                ใบเบิกจ่ายในเดือนนี้
              </p>
            </div>

            <span className="text-4xl">📤</span>
          </div>
        </Link>
      </div>
    </div>
  );
}