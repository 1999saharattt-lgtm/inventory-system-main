import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
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
  const user = await getCurrentUser();

  // =====================================================
  // ตรวจสอบสิทธิ์
  // ADMIN = เห็นข้อมูลทุกกลุ่ม
  // STAFF / VIEWER = เห็นเฉพาะกลุ่มของตัวเอง
  // =====================================================

  const userRole = String(user?.role ?? "")
    .trim()
    .toUpperCase();

  const isAdmin = userRole === "ADMIN";

  const departmentWhere =
    isAdmin
      ? {}
      : user?.departmentId
        ? {
            departmentId: user.departmentId,
          }
        : {
            departmentId: -1,
          };

  const now = new Date();

  const todayStart = startOfDay(now);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const currentMonthStart = startOfMonth(now);
  const nextMonthStart = addMonths(currentMonthStart, 1);

  const sixMonthsAgoStart = startOfMonth(
    addMonths(now, -5)
  );

  // =====================================================
  // ดึงข้อมูล Dashboard
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
    receives6Months,
    issues6Months,
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

    // พัสดุปกติ
    prisma.material.count({
      where: {
        balance: {
          gte: 10,
        },
      },
    }),

    // ===================================================
    // รับเข้าวันนี้
    // ADMIN = ทุกกลุ่ม
    // STAFF / VIEWER = กลุ่มตัวเอง
    // ===================================================

    prisma.receive.count({
      where: {
        ...departmentWhere,
        receiveDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),

    // ===================================================
    // เบิกจ่ายวันนี้
    // ADMIN = ทุกกลุ่ม
    // STAFF / VIEWER = กลุ่มตัวเอง
    // ===================================================

    prisma.issue.count({
      where: {
        ...departmentWhere,
        issueDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),

    // ===================================================
    // รับเข้าประจำเดือน
    // ===================================================

    prisma.receive.count({
      where: {
        ...departmentWhere,
        receiveDate: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    // ===================================================
    // เบิกจ่ายประจำเดือน
    // ===================================================

    prisma.issue.count({
      where: {
        ...departmentWhere,
        issueDate: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    // ===================================================
    // ใบเบิกที่รอดำเนินการ
    // ADMIN = ทุกกลุ่ม
    // STAFF / VIEWER = กลุ่มตัวเอง
    // ===================================================

    prisma.issue.count({
      where: {
        ...departmentWhere,
        status: "PENDING",
      },
    }),

    // ===================================================
    // รับเข้า 6 เดือนย้อนหลัง
    // ===================================================

    prisma.receive.findMany({
      where: {
        ...departmentWhere,
        receiveDate: {
          gte: sixMonthsAgoStart,
          lt: nextMonthStart,
        },
      },
      select: {
        receiveDate: true,
      },
    }),

    // ===================================================
    // เบิกจ่าย 6 เดือนย้อนหลัง
    // ===================================================

    prisma.issue.findMany({
      where: {
        ...departmentWhere,
        issueDate: {
          gte: sixMonthsAgoStart,
          lt: nextMonthStart,
        },
      },
      select: {
        issueDate: true,
      },
    }),
  ]);

  // =====================================================
  // สร้างข้อมูลกราฟย้อนหลัง 6 เดือน
  // =====================================================

  const monthData = Array.from(
    { length: 6 },
    (_, index) => {
      const monthStart = startOfMonth(
        addMonths(now, index - 5)
      );

      const nextMonth = addMonths(monthStart, 1);

      const receiveCount = receives6Months.filter(
        (receive) =>
          receive.receiveDate >= monthStart &&
          receive.receiveDate < nextMonth
      ).length;

      const issueCount = issues6Months.filter(
        (issue) =>
          issue.issueDate >= monthStart &&
          issue.issueDate < nextMonth
      ).length;

      return {
        label: thaiMonthsShort[monthStart.getMonth()],
        year: monthStart.getFullYear() + 543,
        receive: receiveCount,
        issue: issueCount,
      };
    }
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

  const cards = [
    {
      title: "จำนวนพัสดุทั้งหมด",
      value: totalMaterials,
      unit: "รายการ",
      icon: "📦",
      color: "bg-blue-600",
      hover: "hover:border-blue-300",
      href: "/materials/summary",
    },
    {
      title: "รับเข้าวันนี้",
      value: receiveToday,
      unit: "ใบรับเข้า",
      icon: "📥",
      color: "bg-emerald-600",
      hover: "hover:border-emerald-300",
      href: "/receive?date=today",
    },
    {
      title: "เบิกจ่ายวันนี้",
      value: issueToday,
      unit: "ใบเบิกจ่าย",
      icon: "📤",
      color: "bg-amber-600",
      hover: "hover:border-amber-300",
      href: "/issue?date=today",
    },
    {
      title: "รายการพัสดุที่ใกล้หมดทั้งหมด",
      value: lowStock + outOfStock,
      unit: "รายการ",
      icon: "⚠️",
      color: "bg-red-600",
      hover: "hover:border-red-300",
      href: "/materials/low-stock",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5">
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.hover}`}
          >
            <div className={`h-1 ${card.color}`} />

            <div className="p-4">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-lg font-extrabold leading-tight !text-white sm:text-xl">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-extrabold leading-none !text-white sm:text-4xl">
                    {card.value}
                  </p>

                  <p className="mt-1 text-sm font-bold !text-slate-200 sm:text-base">
                    {card.unit}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg backdrop-blur sm:h-12 sm:w-12 sm:text-xl">
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* =====================================================
          รับเข้า / เบิกจ่ายประจำเดือน
      ===================================================== */}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/receive?period=month"
          className="min-w-0 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-extrabold leading-tight !text-white sm:text-2xl">
                📥 รับเข้าประจำเดือน
              </p>

              <p className="mt-1 text-4xl font-extrabold leading-none !text-emerald-300 sm:text-5xl">
                {receiveThisMonth}
              </p>
            </div>

            <span className="shrink-0 text-3xl sm:text-4xl">
              📥
            </span>
          </div>
        </Link>

        <Link
          href="/issue?period=month"
          className="min-w-0 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-extrabold leading-tight !text-white sm:text-2xl">
                📤 เบิกจ่ายประจำเดือน
              </p>

              <p className="mt-1 text-4xl font-extrabold leading-none !text-amber-300 sm:text-5xl">
                {issueThisMonth}
              </p>
            </div>

            <span className="shrink-0 text-3xl sm:text-4xl">
              📤
            </span>
          </div>
        </Link>
      </div>

      {/* =====================================================
          รายการที่ต้องดำเนินการ / สถานะพัสดุ
      ===================================================== */}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
          <div className="border-b border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold leading-tight !text-white sm:text-2xl">
                  🔔 รายการที่ต้องดำเนินการ
                </h2>

                <p className="mt-1 text-sm font-bold !text-slate-300 sm:text-base">
                  รายการที่อยู่ระหว่างการดำเนินงาน
                </p>
              </div>

              <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 px-3 text-lg font-extrabold !text-red-300">
                {pendingIssues}
              </span>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <Link
              href="/notifications"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 transition-all hover:border-red-400 hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-xl">
                  🔴
                </span>

                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight !text-black">
                    ใบเบิกที่รอดำเนินการ
                  </p>

                  <p className="mt-1 text-sm font-bold !text-slate-700 sm:text-base">
                    ตรวจสอบรายการเบิกจ่ายที่ยังไม่ดำเนินการ
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-lg font-extrabold !text-red-500">
                {pendingIssues}
              </span>
            </Link>

            <Link
              href="/materials/low-stock"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 transition-all hover:border-amber-400 hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-xl">
                  🟠
                </span>

                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight !text-black">
                    พัสดุที่ต้องตรวจสอบ
                  </p>

                  <p className="mt-1 text-sm font-bold !text-slate-700 sm:text-base">
                    พัสดุหมดและพัสดุใกล้หมด
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-lg font-extrabold !text-amber-500">
                {lowStock + outOfStock}
              </span>
            </Link>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
          <div className="border-b border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-xl font-extrabold leading-tight !text-white sm:text-2xl">
              📊 สถานะพัสดุคงเหลือ
            </h2>

            <p className="mt-1 text-sm font-bold !text-slate-300 sm:text-base">
              สรุปจากจำนวนคงเหลือปัจจุบัน
            </p>
          </div>

          <div className="space-y-3 p-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-base font-extrabold !text-white sm:text-lg">
                  🟢 คงเหลือปกติ
                </span>

                <span className="text-base font-extrabold !text-emerald-300 sm:text-lg">
                  {normalStock}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
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

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-base font-extrabold !text-white sm:text-lg">
                  🟠 ใกล้หมด
                </span>

                <span className="text-base font-extrabold !text-amber-300 sm:text-lg">
                  {lowStock}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
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

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-base font-extrabold !text-white sm:text-lg">
                  🔴 หมด
                </span>

                <span className="text-base font-extrabold !text-red-300 sm:text-lg">
                  {outOfStock}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
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
              className="mt-1 flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-base font-extrabold !text-white transition-all hover:bg-slate-700"
            >
              ดูรายการพัสดุทั้งหมด →
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          การเคลื่อนไหวพัสดุย้อนหลัง 6 เดือน
      ===================================================== */}

      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
        <div className="border-b border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold leading-tight !text-white sm:text-2xl">
                📈 การเคลื่อนไหวพัสดุ
              </h2>

              <p className="mt-1 text-sm font-bold !text-slate-300 sm:text-base">
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

        <div className="p-4 sm:p-5">
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
                  <div className="mb-2 flex h-32 items-end justify-center gap-1 border-b border-slate-700 sm:h-40 sm:gap-2">
                    <div className="flex h-full w-1/2 items-end justify-center">
                      <div
                        className="w-full max-w-8 rounded-t-lg bg-emerald-500 transition-all duration-300"
                        style={{
                          height: `${receiveHeight}%`,
                        }}
                        title={`รับเข้า ${month.receive} ใบรับเข้า`}
                      />
                    </div>

                    <div className="flex h-full w-1/2 items-end justify-center">
                      <div
                        className="w-full max-w-8 rounded-t-lg bg-amber-500 transition-all duration-300"
                        style={{
                          height: `${issueHeight}%`,
                        }}
                        title={`เบิกจ่าย ${month.issue} ใบเบิก`}
                      />
                    </div>
                  </div>

                  <p className="text-center text-sm font-extrabold !text-white sm:text-base">
                    {month.label}
                  </p>

                  <p className="text-center text-xs font-bold !text-slate-400 sm:text-sm">
                    {month.year}
                  </p>

                  <div className="mt-1 space-y-0.5 text-center text-xs font-bold sm:text-sm">
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
    </div>
  );
}