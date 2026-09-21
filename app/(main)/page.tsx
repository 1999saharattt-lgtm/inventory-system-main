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

const glassPanel =
  "overflow-hidden rounded-[30px] border border-white/80 bg-white/80 shadow-[0_22px_60px_-32px_rgba(15,23,42,0.38)] backdrop-blur-2xl";

const glassHeader =
  "border-b border-slate-200/80 bg-white/40 px-5 py-5";

const pressable =
  "transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.985]";

export default async function Home() {
  const user = await getCurrentUser();

  // =====================================================
  // ตรวจสอบสิทธิ์
  //
  // ADMIN
  // - เห็นข้อมูลเบิกจ่ายทุกกลุ่ม
  // - สามารถกดดูข้อมูลรับเข้าได้
  //
  // STAFF / VIEWER
  // - เห็นข้อมูลเบิกจ่ายเฉพาะกลุ่มตัวเอง
  // - รับเข้ายังแสดงยอดรวม แต่ไม่สามารถกดเข้าไปดูได้
  // =====================================================

  const userRole = String(user?.role ?? "")
    .trim()
    .toUpperCase();

  const isAdmin = userRole === "ADMIN";

  // ใช้เฉพาะกับ Issue เพราะ Issue มี departmentId
  const issueDepartmentWhere = isAdmin
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
    prisma.material.count(),

    prisma.material.count({
      where: {
        balance: {
          gt: 0,
          lt: 10,
        },
      },
    }),

    prisma.material.count({
      where: {
        balance: {
          lte: 0,
        },
      },
    }),

    prisma.material.count({
      where: {
        balance: {
          gte: 10,
        },
      },
    }),

    prisma.receive.count({
      where: {
        receiveDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),

    prisma.issue.count({
      where: {
        ...issueDepartmentWhere,
        issueDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),

    prisma.receive.count({
      where: {
        receiveDate: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    prisma.issue.count({
      where: {
        ...issueDepartmentWhere,
        issueDate: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    prisma.issue.count({
      where: {
        ...issueDepartmentWhere,
        status: "PENDING",
      },
    }),

    prisma.receive.findMany({
      where: {
        receiveDate: {
          gte: sixMonthsAgoStart,
          lt: nextMonthStart,
        },
      },
      select: {
        receiveDate: true,
      },
    }),

    prisma.issue.findMany({
      where: {
        ...issueDepartmentWhere,
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

  // =====================================================
  // การ์ดด้านบน
  // =====================================================

  const cards = [
    {
      title: "จำนวนพัสดุทั้งหมด",
      value: totalMaterials,
      unit: "รายการ",
      icon: "📦",
      accent: "from-blue-500 via-sky-400 to-cyan-400",
      iconBg: "from-blue-500/20 to-cyan-400/10",
      ring: "ring-blue-300/30",
      valueText: "!text-blue-700",
      hover:
        "hover:border-blue-300/80 hover:shadow-blue-500/10",
      href: "/materials/summary",
      clickable: true,
    },
    {
      title: "รับเข้าวันนี้",
      value: receiveToday,
      unit: "ใบรับเข้า",
      icon: "📥",
      accent:
        "from-emerald-500 via-teal-400 to-cyan-400",
      iconBg:
        "from-emerald-500/20 to-teal-400/10",
      ring: "ring-emerald-300/30",
      valueText: "!text-emerald-700",
      hover:
        "hover:border-emerald-300/80 hover:shadow-emerald-500/10",
      href: "/receive?date=today",
      clickable: isAdmin,
    },
    {
      title: "เบิกจ่ายวันนี้",
      value: issueToday,
      unit: "ใบเบิกจ่าย",
      icon: "📤",
      accent:
        "from-amber-400 via-orange-400 to-rose-400",
      iconBg:
        "from-amber-400/20 to-orange-400/10",
      ring: "ring-amber-300/30",
      valueText: "!text-amber-700",
      hover:
        "hover:border-amber-300/80 hover:shadow-amber-500/10",
      href: "/issue?date=today",
      clickable: true,
    },
    {
      title: "รายการพัสดุที่ใกล้หมดทั้งหมด",
      value: lowStock + outOfStock,
      unit: "รายการ",
      icon: "⚠️",
      accent:
        "from-rose-500 via-red-400 to-orange-400",
      iconBg:
        "from-rose-500/20 to-red-400/10",
      ring: "ring-rose-300/30",
      valueText: "!text-rose-700",
      hover:
        "hover:border-rose-300/80 hover:shadow-rose-500/10",
      href: "/materials/low-stock",
      clickable: true,
    },
  ];

  return (
    <div className="relative isolate w-full min-w-0 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_24%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)] p-3 sm:p-4 lg:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-40 -z-10 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl"
      />

      <div className="w-full min-w-0 space-y-4 sm:space-y-5">
        {/* =====================================================
            การ์ดสรุปด้านบน
        ===================================================== */}

        <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const cardClassName = `group relative min-w-0 overflow-hidden rounded-[26px] border border-white/80 bg-white/75 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl ${
              card.clickable
                ? `cursor-pointer ${pressable} hover:bg-white/95 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] ${card.hover}`
                : "cursor-default"
            }`;

            const content = (
              <>
                <div
                  className={`h-1.5 bg-gradient-to-r ${card.accent}`}
                />

                <div className="relative p-5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/60 to-transparent" />

                  <div className="relative flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="break-words text-base font-extrabold leading-tight !text-slate-700 sm:text-lg">
                        {card.title}
                      </p>

                      <p
                        className={`mt-4 text-4xl font-black leading-none tracking-tight sm:text-5xl ${card.valueText}`}
                      >
                        {card.value}
                      </p>

                      <p className="mt-2 text-sm font-bold !text-slate-500">
                        {card.unit}
                      </p>
                    </div>

                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${card.iconBg} text-2xl shadow-inner ring-1 ${card.ring} transition-transform duration-300 group-hover:scale-110 group-active:scale-95`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  {card.clickable && (
                    <div className="relative mt-4 flex items-center gap-2 text-xs font-extrabold !text-slate-400 transition-colors group-hover:!text-slate-600">
                      <span>แตะเพื่อดูรายละเอียด</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  )}
                </div>
              </>
            );

            if (card.clickable) {
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  prefetch
                  className={cardClassName}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={card.title}
                className={cardClassName}
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* =====================================================
            รับเข้า / เบิกจ่ายประจำเดือน
        ===================================================== */}

        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {isAdmin ? (
            <Link
              href="/receive?period=month"
              prefetch
              className={`group relative min-w-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl ${pressable} hover:border-emerald-300/80 hover:bg-white hover:shadow-[0_24px_60px_-28px_rgba(16,185,129,0.28)]`}
            >
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-300/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight !text-slate-700 sm:text-xl">
                    📥 รับเข้าประจำเดือน
                  </p>

                  <p className="mt-3 text-5xl font-black leading-none tracking-tight !text-emerald-700">
                    {receiveThisMonth}
                  </p>

                  <p className="mt-3 text-xs font-extrabold !text-slate-400">
                    แตะเพื่อดูรายการประจำเดือน →
                  </p>
                </div>

                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-500/20 to-teal-400/10 text-3xl shadow-inner ring-1 ring-emerald-300/30 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  📥
                </span>
              </div>
            </Link>
          ) : (
            <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-300/15 blur-2xl" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight !text-slate-700 sm:text-xl">
                    📥 รับเข้าประจำเดือน
                  </p>

                  <p className="mt-3 text-5xl font-black leading-none tracking-tight !text-emerald-700">
                    {receiveThisMonth}
                  </p>

                  <p className="mt-3 text-xs font-extrabold !text-slate-400">
                    แสดงยอดรวม
                  </p>
                </div>

                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-500/20 to-teal-400/10 text-3xl shadow-inner ring-1 ring-emerald-300/30">
                  📥
                </span>
              </div>
            </div>
          )}

          <Link
            href="/issue?period=month"
            prefetch
            className={`group relative min-w-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl ${pressable} hover:border-amber-300/80 hover:bg-white hover:shadow-[0_24px_60px_-28px_rgba(245,158,11,0.25)]`}
          >
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-tight !text-slate-700 sm:text-xl">
                  📤 เบิกจ่ายประจำเดือน
                </p>

                <p className="mt-3 text-5xl font-black leading-none tracking-tight !text-amber-700">
                  {issueThisMonth}
                </p>

                <p className="mt-3 text-xs font-extrabold !text-slate-400">
                  แตะเพื่อดูรายการประจำเดือน →
                </p>
              </div>

              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-amber-400/20 to-orange-400/10 text-3xl shadow-inner ring-1 ring-amber-300/30 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                📤
              </span>
            </div>
          </Link>
        </div>

        {/* =====================================================
            รายการที่ต้องดำเนินการ / สถานะพัสดุ
        ===================================================== */}

        <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={glassPanel}>
            <div className={glassHeader}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-black leading-tight !text-slate-900 sm:text-2xl">
                    🔔 รายการที่ต้องดำเนินการ
                  </h2>

                  <p className="mt-1 text-sm font-bold !text-slate-500">
                    รายการที่อยู่ระหว่างการดำเนินงาน
                  </p>
                </div>

                <span className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-[16px] border border-red-200 bg-red-50 px-3 text-base font-black !text-red-600 shadow-sm">
                  {pendingIssues}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <Link
                href="/notifications"
                prefetch
                className="group flex items-center justify-between gap-3 rounded-[22px] border border-slate-200/90 bg-white px-4 py-4 shadow-[0_12px_32px_-26px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[0_18px_38px_-26px_rgba(239,68,68,0.35)] active:translate-y-0 active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-red-50 text-xl ring-1 ring-red-100 transition-transform group-hover:scale-105">
                    🔴
                  </span>

                  <div className="min-w-0">
                    <p className="text-base font-black leading-tight !text-slate-900 sm:text-lg">
                      ใบเบิกที่รอดำเนินการ
                    </p>

                    <p className="mt-1 text-sm font-semibold !text-slate-500">
                      ตรวจสอบรายการเบิกจ่ายที่ยังไม่ดำเนินการ
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-lg font-black !text-red-500">
                    {pendingIssues}
                  </span>
                  <span className="text-slate-300 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>

              <Link
                href="/materials/low-stock"
                prefetch
                className="group flex items-center justify-between gap-3 rounded-[22px] border border-slate-200/90 bg-white px-4 py-4 shadow-[0_12px_32px_-26px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_18px_38px_-26px_rgba(245,158,11,0.30)] active:translate-y-0 active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-amber-50 text-xl ring-1 ring-amber-100 transition-transform group-hover:scale-105">
                    🟠
                  </span>

                  <div className="min-w-0">
                    <p className="text-base font-black leading-tight !text-slate-900 sm:text-lg">
                      พัสดุที่ต้องตรวจสอบ
                    </p>

                    <p className="mt-1 text-sm font-semibold !text-slate-500">
                      พัสดุหมดและพัสดุใกล้หมด
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-lg font-black !text-amber-600">
                    {lowStock + outOfStock}
                  </span>
                  <span className="text-slate-300 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <div className={glassPanel}>
            <div className={glassHeader}>
              <h2 className="text-xl font-black leading-tight !text-slate-900 sm:text-2xl">
                📊 สถานะพัสดุคงเหลือ
              </h2>

              <p className="mt-1 text-sm font-bold !text-slate-500">
                สรุปจากจำนวนคงเหลือปัจจุบัน
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-base font-black !text-slate-700">
                    🟢 คงเหลือปกติ
                  </span>

                  <span className="text-base font-black !text-emerald-700">
                    {normalStock}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 p-[2px] shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${
                        totalStockStatus > 0
                          ? (normalStock /
                              totalStockStatus) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-base font-black !text-slate-700">
                    🟠 ใกล้หมด
                  </span>

                  <span className="text-base font-black !text-amber-700">
                    {lowStock}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 p-[2px] shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${
                        totalStockStatus > 0
                          ? (lowStock /
                              totalStockStatus) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-base font-black !text-slate-700">
                    🔴 หมด
                  </span>

                  <span className="text-base font-black !text-red-700">
                    {outOfStock}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 p-[2px] shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 shadow-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${
                        totalStockStatus > 0
                          ? (outOfStock /
                              totalStockStatus) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <Link
                href="/materials/summary"
                prefetch
                className="group mt-2 flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-black !text-white shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.99]"
              >
                <span>ดูรายการพัสดุทั้งหมด</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* =====================================================
            การเคลื่อนไหวพัสดุย้อนหลัง 6 เดือน
        ===================================================== */}

        <div className={glassPanel}>
          <div className={glassHeader}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black leading-tight !text-slate-900 sm:text-2xl">
                  📈 การเคลื่อนไหวพัสดุ
                </h2>

                <p className="mt-1 text-sm font-bold !text-slate-500">
                  เปรียบเทียบการรับเข้าและเบิกจ่ายย้อนหลัง 6 เดือน
                </p>
              </div>

              <div className="flex gap-2 text-sm font-extrabold">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 !text-emerald-700 ring-1 ring-emerald-100">
                  ● รับเข้า
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-1.5 !text-amber-700 ring-1 ring-amber-100">
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
                        (month.receive /
                          maxMovement) *
                          100
                      )
                    : 0;

                const issueHeight =
                  month.issue > 0
                    ? Math.max(
                        8,
                        (month.issue /
                          maxMovement) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={`${month.label}-${month.year}`}
                    className="group min-w-0 rounded-[18px] px-1 py-2 transition-colors duration-300 hover:bg-slate-50/90 sm:px-2"
                  >
                    <div className="mb-2 flex h-32 items-end justify-center gap-1 border-b border-slate-200 sm:h-44 sm:gap-2">
                      <div className="flex h-full w-1/2 items-end justify-center">
                        <div
                          className="w-full max-w-8 rounded-t-[10px] bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_8px_18px_-10px_rgba(16,185,129,0.8)] transition-all duration-500 ease-out group-hover:brightness-105"
                          style={{
                            height: `${receiveHeight}%`,
                          }}
                          title={`รับเข้า ${month.receive} ใบรับเข้า`}
                        />
                      </div>

                      <div className="flex h-full w-1/2 items-end justify-center">
                        <div
                          className="w-full max-w-8 rounded-t-[10px] bg-gradient-to-t from-amber-500 to-yellow-300 shadow-[0_8px_18px_-10px_rgba(245,158,11,0.8)] transition-all duration-500 ease-out group-hover:brightness-105"
                          style={{
                            height: `${issueHeight}%`,
                          }}
                          title={`เบิกจ่าย ${month.issue} ใบเบิก`}
                        />
                      </div>
                    </div>

                    <p className="text-center text-sm font-black !text-slate-800 sm:text-base">
                      {month.label}
                    </p>

                    <p className="text-center text-xs font-bold !text-slate-400 sm:text-sm">
                      {month.year}
                    </p>

                    <div className="mt-1 space-y-0.5 text-center text-xs font-bold sm:text-sm">
                      <p className="!text-emerald-700">
                        รับ {month.receive}
                      </p>

                      <p className="!text-amber-700">
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
    </div>
  );
}
