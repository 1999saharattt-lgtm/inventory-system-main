import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";

/* =========================================================
   THAI MONTHS
========================================================= */

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

/* =========================================================
   DATE HELPERS
========================================================= */

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

function addMonths(
  date: Date,
  amount: number
) {
  const result = new Date(date);

  result.setMonth(
    result.getMonth() + amount
  );

  return result;
}

/* =========================================================
   SHARED UI
========================================================= */

const iosPressable = `
  transition-all
  duration-300
  ease-out

  hover:-translate-y-1

  active:translate-y-0
  active:scale-[0.985]
`;

const iosCard = `
  border
  border-white/70

  bg-white/75

  shadow-[0_18px_55px_-30px_rgba(15,23,42,0.35)]

  backdrop-blur-2xl

  ring-1
  ring-slate-900/[0.025]
`;

const iosInnerCard = `
  rounded-[22px]

  border
  border-white/80

  bg-white/70

  shadow-[0_14px_35px_-26px_rgba(15,23,42,0.45)]

  backdrop-blur-xl
`;

const panelHeaderClass = `
  border-b
  border-slate-200/60

  bg-white/35

  px-5
  py-5

  backdrop-blur-xl
`;

/* =========================================================
   PAGE
========================================================= */

export default async function Home() {
  const user =
    await getCurrentUser();

  /* =======================================================
     PERMISSION
  ======================================================= */

  const userRole = String(
    user?.role ?? ""
  )
    .trim()
    .toUpperCase();

  const isAdmin =
    userRole === "ADMIN";

  const issueDepartmentWhere =
    isAdmin
      ? {}
      : user?.departmentId
        ? {
            departmentId:
              user.departmentId,
          }
        : {
            departmentId: -1,
          };

  /* =======================================================
     DATE RANGE
  ======================================================= */

  const now = new Date();

  const todayStart =
    startOfDay(now);

  const tomorrowStart =
    new Date(todayStart);

  tomorrowStart.setDate(
    tomorrowStart.getDate() + 1
  );

  const currentMonthStart =
    startOfMonth(now);

  const nextMonthStart =
    addMonths(
      currentMonthStart,
      1
    );

  const sixMonthsAgoStart =
    startOfMonth(
      addMonths(
        now,
        -5
      )
    );

  /* =======================================================
     DASHBOARD DATA
  ======================================================= */

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

  /* =======================================================
     6 MONTH MOVEMENT DATA
  ======================================================= */

  const monthData =
    Array.from(
      {
        length: 6,
      },

      (_, index) => {
        const monthStart =
          startOfMonth(
            addMonths(
              now,
              index - 5
            )
          );

        const nextMonth =
          addMonths(
            monthStart,
            1
          );

        const receiveCount =
          receives6Months.filter(
            (receive) =>
              receive.receiveDate >=
                monthStart &&
              receive.receiveDate <
                nextMonth
          ).length;

        const issueCount =
          issues6Months.filter(
            (issue) =>
              issue.issueDate >=
                monthStart &&
              issue.issueDate <
                nextMonth
          ).length;

        return {
          label:
            thaiMonthsShort[
              monthStart.getMonth()
            ],

          year:
            monthStart.getFullYear() +
            543,

          receive:
            receiveCount,

          issue:
            issueCount,
        };
      }
    );

  const maxMovement =
    Math.max(
      1,

      ...monthData.flatMap(
        (item) => [
          item.receive,
          item.issue,
        ]
      )
    );

  const totalStockStatus =
    outOfStock +
    lowStock +
    normalStock;

  /* =======================================================
     DISPLAY DATE
  ======================================================= */

  const todayText =
    new Intl.DateTimeFormat(
      "th-TH",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(now);

  /* =======================================================
     ROLE LABEL
  ======================================================= */

  const roleText =
    userRole === "ADMIN"
      ? "ผู้ดูแลระบบ"
      : userRole === "STAFF"
        ? "เจ้าหน้าที่"
        : "ผู้ใช้งาน";

  /* =======================================================
     SUMMARY CARDS
  ======================================================= */

  const cards = [
    {
      title:
        "พัสดุทั้งหมด",

      value:
        totalMaterials,

      unit:
        "รายการ",

      icon:
        "📦",

      color:
        "blue",

      valueClass:
        "!text-blue-600",

      iconClass:
        "from-blue-500 to-sky-400",

      glowClass:
        "bg-blue-400/20",

      href:
        "/materials/summary",

      clickable:
        true,
    },

    {
      title:
        "รับเข้าวันนี้",

      value:
        receiveToday,

      unit:
        "ใบรับเข้า",

      icon:
        "📥",

      color:
        "emerald",

      valueClass:
        "!text-emerald-600",

      iconClass:
        "from-emerald-500 to-teal-400",

      glowClass:
        "bg-emerald-400/20",

      href:
        "/receive?date=today",

      clickable:
        isAdmin,
    },

    {
      title:
        "เบิกจ่ายวันนี้",

      value:
        issueToday,

      unit:
        "ใบเบิกจ่าย",

      icon:
        "📤",

      color:
        "amber",

      valueClass:
        "!text-amber-600",

      iconClass:
        "from-amber-400 to-orange-400",

      glowClass:
        "bg-amber-400/20",

      href:
        "/issue?date=today",

      clickable:
        true,
    },

    {
      title:
        "พัสดุที่ต้องตรวจสอบ",

      value:
        lowStock +
        outOfStock,

      unit:
        "รายการ",

      icon:
        "⚠️",

      color:
        "rose",

      valueClass:
        "!text-rose-600",

      iconClass:
        "from-rose-500 to-red-400",

      glowClass:
        "bg-rose-400/20",

      href:
        "/materials/low-stock",

      clickable:
        true,
    },
  ];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          IOS HERO
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden

          rounded-[32px]

          border
          border-white/80

          bg-gradient-to-br
          from-white/95
          via-white/80
          to-blue-50/70

          px-5
          py-6

          shadow-[0_25px_70px_-40px_rgba(15,23,42,0.45)]

          backdrop-blur-2xl

          sm:px-7
          sm:py-7

          lg:px-8
        "
      >
        {/* =================================================
            BACKGROUND GLOW
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-16
            -top-24

            h-72
            w-72

            rounded-full

            bg-blue-300/30

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-32
            left-1/4

            h-64
            w-64

            rounded-full

            bg-cyan-200/25

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-1/3
            top-8

            h-32
            w-32

            rounded-full

            bg-violet-200/20

            blur-3xl
          "
        />

        {/* =================================================
            HERO CONTENT
        ================================================= */}

        <div
          className="
            relative
            z-10

            flex
            flex-col
            gap-6

            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="min-w-0">
            <div
              className="
                mb-4

                inline-flex
                items-center
                gap-2

                rounded-full

                border
                border-white/80

                bg-white/65

                px-3
                py-1.5

                text-xs
                font-extrabold

                !text-slate-500

                shadow-sm

                backdrop-blur-xl
              "
            >
              <span
                className="
                  h-2
                  w-2

                  rounded-full

                  bg-emerald-500

                  shadow-[0_0_0_4px_rgba(16,185,129,0.10)]
                "
              />

              ระบบพร้อมใช้งาน
            </div>

            <h1
              className="
                text-3xl
                font-black
                tracking-tight
                !text-slate-950

                sm:text-4xl

                lg:text-5xl
              "
            >
              Dashboard
            </h1>

            <p
              className="
                mt-2

                text-base
                font-bold
                !text-slate-500

                sm:text-lg
              "
            >
              ภาพรวมระบบบริหารพัสดุ
            </p>

            <p
              className="
                mt-3

                text-sm
                font-semibold
                !text-slate-400
              "
            >
              {todayText}
            </p>
          </div>

          {/* =================================================
              USER STATUS
          ================================================= */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            <div
              className={`
                ${iosInnerCard}

                flex
                items-center
                gap-3

                px-4
                py-3
              `}
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-[15px]

                  bg-gradient-to-br
                  from-slate-800
                  to-slate-600

                  text-lg

                  shadow-md
                  shadow-slate-900/10
                "
              >
                👤
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold

                    !text-slate-400
                  "
                >
                  สิทธิ์การใช้งาน
                </p>

                <p
                  className="
                    mt-0.5

                    text-sm
                    font-black

                    !text-slate-800
                  "
                >
                  {roleText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TOP SUMMARY
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4

          sm:grid-cols-2

          xl:grid-cols-4
        "
      >
        {cards.map(
          (card) => {
            const cardContent = (
              <AppCard
                className={`
                  group
                  relative
                  min-h-[190px]
                  min-w-0
                  overflow-hidden

                  !rounded-[28px]

                  ${iosCard}

                  ${
                    card.clickable
                      ? `
                        cursor-pointer
                        ${iosPressable}
                      `
                      : "cursor-default"
                  }
                `}
              >
                {/* GLOW */}

                <div
                  aria-hidden="true"
                  className={`
                    pointer-events-none
                    absolute
                    -right-10
                    -top-12

                    h-36
                    w-36

                    rounded-full

                    ${card.glowClass}

                    blur-3xl

                    transition-transform
                    duration-500

                    group-hover:scale-125
                  `}
                />

                <div
                  className="
                    relative
                    z-10

                    flex
                    h-full
                    flex-col
                    justify-between
                  "
                >
                  {/* TOP */}

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    "
                  >
                    <p
                      className="
                        min-w-0

                        text-base
                        font-extrabold
                        leading-snug

                        !text-slate-600
                      "
                    >
                      {card.title}
                    </p>

                    <div
                      className={`
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center

                        rounded-[16px]

                        bg-gradient-to-br
                        ${card.iconClass}

                        text-xl

                        shadow-lg
                        shadow-slate-900/10

                        ring-1
                        ring-white/60

                        transition-transform
                        duration-300

                        group-hover:scale-110
                      `}
                    >
                      <span
                        aria-hidden="true"
                      >
                        {card.icon}
                      </span>
                    </div>
                  </div>

                  {/* VALUE */}

                  <div className="mt-6">
                    <div
                      className="
                        flex
                        items-end
                        gap-2
                      "
                    >
                      <p
                        className={`
                          text-4xl
                          font-black
                          leading-none
                          tracking-[-0.04em]
                          tabular-nums

                          sm:text-5xl

                          ${card.valueClass}
                        `}
                      >
                        {card.value.toLocaleString(
                          "th-TH"
                        )}
                      </p>

                      <p
                        className="
                          pb-1

                          text-sm
                          font-bold

                          !text-slate-400
                        "
                      >
                        {card.unit}
                      </p>
                    </div>

                    {card.clickable && (
                      <div
                        className="
                          mt-5

                          flex
                          items-center
                          justify-between

                          text-xs
                          font-extrabold

                          !text-slate-400
                        "
                      >
                        <span>
                          ดูรายละเอียด
                        </span>

                        <span
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center

                            rounded-full

                            bg-slate-100/90

                            !text-slate-500

                            transition-all

                            group-hover:translate-x-1
                            group-hover:bg-slate-200/80
                          "
                        >
                          →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </AppCard>
            );

            if (
              card.clickable
            ) {
              return (
                <Link
                  key={
                    card.title
                  }
                  href={
                    card.href
                  }
                  prefetch
                  className="
                    block
                    min-w-0
                  "
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={
                  card.title
                }
                className="min-w-0"
              >
                {cardContent}
              </div>
            );
          }
        )}
      </section>

      {/* =====================================================
          MONTH SUMMARY
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4

          lg:grid-cols-2
        "
      >
        {/* ===================================================
            RECEIVE MONTH
        =================================================== */}

        {isAdmin ? (
          <Link
            href="/receive?period=month"
            prefetch
            className="
              block
              min-w-0
            "
          >
            <AppCard
              className={`
                group
                relative
                min-h-[180px]
                min-w-0
                overflow-hidden

                !rounded-[28px]

                ${iosCard}
                ${iosPressable}
              `}
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -right-14
                  -top-16

                  h-48
                  w-48

                  rounded-full

                  bg-emerald-300/20

                  blur-3xl

                  transition-transform
                  duration-500

                  group-hover:scale-125
                "
              />

              <div
                className="
                  relative
                  z-10

                  flex
                  h-full
                  items-center
                  justify-between
                  gap-5
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
                    รับเข้าประจำเดือน
                  </p>

                  <div
                    className="
                      mt-3
                      flex
                      items-end
                      gap-2
                    "
                  >
                    <p
                      className="
                        text-5xl
                        font-black
                        leading-none
                        tracking-[-0.04em]
                        tabular-nums

                        !text-emerald-600

                        sm:text-6xl
                      "
                    >
                      {receiveThisMonth.toLocaleString(
                        "th-TH"
                      )}
                    </p>

                    <span
                      className="
                        pb-1
                        text-sm
                        font-bold

                        !text-slate-400
                      "
                    >
                      ใบ
                    </span>
                  </div>

                  <p
                    className="
                      mt-4

                      text-xs
                      font-extrabold

                      !text-slate-400
                    "
                  >
                    เปิดรายการรับเข้า →
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-20
                    w-20
                    shrink-0
                    items-center
                    justify-center

                    rounded-[24px]

                    bg-gradient-to-br
                    from-emerald-500
                    to-teal-400

                    text-3xl

                    shadow-xl
                    shadow-emerald-500/20

                    ring-1
                    ring-white/60

                    transition-transform
                    duration-300

                    group-hover:scale-110
                  "
                >
                  📥
                </div>
              </div>
            </AppCard>
          </Link>
        ) : (
          <AppCard
            className={`
              relative
              min-h-[180px]
              min-w-0
              overflow-hidden

              !rounded-[28px]

              ${iosCard}
            `}
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-14
                -top-16

                h-48
                w-48

                rounded-full

                bg-emerald-300/20

                blur-3xl
              "
            />

            <div
              className="
                relative
                z-10

                flex
                h-full
                items-center
                justify-between
                gap-5
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-extrabold

                    !text-slate-500
                  "
                >
                  รับเข้าประจำเดือน
                </p>

                <div
                  className="
                    mt-3
                    flex
                    items-end
                    gap-2
                  "
                >
                  <p
                    className="
                      text-5xl
                      font-black
                      leading-none
                      tracking-[-0.04em]
                      tabular-nums

                      !text-emerald-600

                      sm:text-6xl
                    "
                  >
                    {receiveThisMonth.toLocaleString(
                      "th-TH"
                    )}
                  </p>

                  <span
                    className="
                      pb-1
                      text-sm
                      font-bold

                      !text-slate-400
                    "
                  >
                    ใบ
                  </span>
                </div>
              </div>

              <div
                className="
                  flex
                  h-20
                  w-20
                  shrink-0
                  items-center
                  justify-center

                  rounded-[24px]

                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-400

                  text-3xl

                  shadow-xl
                  shadow-emerald-500/20

                  ring-1
                  ring-white/60
                "
              >
                📥
              </div>
            </div>
          </AppCard>
        )}

        {/* ===================================================
            ISSUE MONTH
        =================================================== */}

        <Link
          href="/issue?period=month"
          prefetch
          className="
            block
            min-w-0
          "
        >
          <AppCard
            className={`
              group
              relative
              min-h-[180px]
              min-w-0
              overflow-hidden

              !rounded-[28px]

              ${iosCard}
              ${iosPressable}
            `}
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-14
                -top-16

                h-48
                w-48

                rounded-full

                bg-amber-300/20

                blur-3xl

                transition-transform
                duration-500

                group-hover:scale-125
              "
            />

            <div
              className="
                relative
                z-10

                flex
                h-full
                items-center
                justify-between
                gap-5
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
                  เบิกจ่ายประจำเดือน
                </p>

                <div
                  className="
                    mt-3
                    flex
                    items-end
                    gap-2
                  "
                >
                  <p
                    className="
                      text-5xl
                      font-black
                      leading-none
                      tracking-[-0.04em]
                      tabular-nums

                      !text-amber-600

                      sm:text-6xl
                    "
                  >
                    {issueThisMonth.toLocaleString(
                      "th-TH"
                    )}
                  </p>

                  <span
                    className="
                      pb-1
                      text-sm
                      font-bold

                      !text-slate-400
                    "
                  >
                    ใบ
                  </span>
                </div>

                <p
                  className="
                    mt-4

                    text-xs
                    font-extrabold

                    !text-slate-400
                  "
                >
                  เปิดรายการเบิกจ่าย →
                </p>
              </div>

              <div
                className="
                  flex
                  h-20
                  w-20
                  shrink-0
                  items-center
                  justify-center

                  rounded-[24px]

                  bg-gradient-to-br
                  from-amber-400
                  to-orange-400

                  text-3xl

                  shadow-xl
                  shadow-amber-500/20

                  ring-1
                  ring-white/60

                  transition-transform
                  duration-300

                  group-hover:scale-110
                "
              >
                📤
              </div>
            </div>
          </AppCard>
        </Link>
      </section>

      {/* =====================================================
          ACTION / STOCK STATUS
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4

          xl:grid-cols-2
        "
      >
        {/* ===================================================
            ACTION REQUIRED
        =================================================== */}

        <AppCard
          className={`
            overflow-hidden
            !rounded-[30px]
            !p-0

            ${iosCard}
          `}
        >
          <div
            className={
              panelHeaderClass
            }
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    font-extrabold
                    uppercase
                    tracking-[0.14em]

                    !text-slate-400
                  "
                >
                  Action Center
                </p>

                <h2
                  className="
                    mt-1

                    text-xl
                    font-black

                    !text-slate-950

                    sm:text-2xl
                  "
                >
                  รายการที่ต้องดำเนินการ
                </h2>

                <p
                  className="
                    mt-1

                    text-sm
                    font-semibold

                    !text-slate-500
                  "
                >
                  รายการที่ควรตรวจสอบและดำเนินการ
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

                  rounded-[16px]

                  bg-red-500

                  px-3

                  text-base
                  font-black
                  tabular-nums

                  !text-white

                  shadow-lg
                  shadow-red-500/20
                "
              >
                {pendingIssues.toLocaleString(
                  "th-TH"
                )}
              </span>
            </div>
          </div>

          <div
            className="
              space-y-3
              p-4

              sm:p-5
            "
          >
            {/* PENDING */}

            <Link
              href="/notifications"
              prefetch
              className={`
                group

                flex
                items-center
                justify-between
                gap-4

                ${iosInnerCard}

                px-4
                py-4

                ${iosPressable}
              `}
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-4
                "
              >
                <span
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center

                    rounded-[16px]

                    bg-gradient-to-br
                    from-red-500
                    to-rose-400

                    text-lg

                    shadow-lg
                    shadow-red-500/15
                  "
                >
                  🔔
                </span>

                <div className="min-w-0">
                  <p
                    className="
                      text-base
                      font-black

                      !text-slate-900

                      sm:text-lg
                    "
                  >
                    ใบเบิกที่รอดำเนินการ
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-semibold

                      !text-slate-500
                    "
                  >
                    ตรวจสอบรายการที่ยังไม่ดำเนินการ
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  gap-3
                "
              >
                <span
                  className="
                    text-xl
                    font-black
                    tabular-nums

                    !text-red-500
                  "
                >
                  {pendingIssues.toLocaleString(
                    "th-TH"
                  )}
                </span>

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center

                    rounded-full

                    bg-slate-100

                    !text-slate-400

                    transition-transform

                    group-hover:translate-x-1
                  "
                >
                  ›
                </span>
              </div>
            </Link>

            {/* LOW STOCK */}

            <Link
              href="/materials/low-stock"
              prefetch
              className={`
                group

                flex
                items-center
                justify-between
                gap-4

                ${iosInnerCard}

                px-4
                py-4

                ${iosPressable}
              `}
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-4
                "
              >
                <span
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center

                    rounded-[16px]

                    bg-gradient-to-br
                    from-amber-400
                    to-orange-400

                    text-lg

                    shadow-lg
                    shadow-amber-500/15
                  "
                >
                  ⚠️
                </span>

                <div className="min-w-0">
                  <p
                    className="
                      text-base
                      font-black

                      !text-slate-900

                      sm:text-lg
                    "
                  >
                    พัสดุที่ต้องตรวจสอบ
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-semibold

                      !text-slate-500
                    "
                  >
                    พัสดุหมดและพัสดุใกล้หมด
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  gap-3
                "
              >
                <span
                  className="
                    text-xl
                    font-black
                    tabular-nums

                    !text-amber-600
                  "
                >
                  {(
                    lowStock +
                    outOfStock
                  ).toLocaleString(
                    "th-TH"
                  )}
                </span>

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center

                    rounded-full

                    bg-slate-100

                    !text-slate-400

                    transition-transform

                    group-hover:translate-x-1
                  "
                >
                  ›
                </span>
              </div>
            </Link>
          </div>
        </AppCard>

        {/* ===================================================
            STOCK STATUS
        =================================================== */}

        <AppCard
          className={`
            overflow-hidden
            !rounded-[30px]
            !p-0

            ${iosCard}
          `}
        >
          <div
            className={
              panelHeaderClass
            }
          >
            <p
              className="
                text-xs
                font-extrabold
                uppercase
                tracking-[0.14em]

                !text-slate-400
              "
            >
              Inventory
            </p>

            <h2
              className="
                mt-1

                text-xl
                font-black

                !text-slate-950

                sm:text-2xl
              "
            >
              สถานะพัสดุคงเหลือ
            </h2>

            <p
              className="
                mt-1

                text-sm
                font-semibold

                !text-slate-500
              "
            >
              ภาพรวมจำนวนคงเหลือปัจจุบัน
            </p>
          </div>

          <div
            className="
              space-y-5
              p-5
            "
          >
            {/* NORMAL */}

            <div
              className={`
                ${iosInnerCard}

                p-4
              `}
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <span
                    className="
                      h-3
                      w-3

                      rounded-full

                      bg-emerald-500

                      shadow-[0_0_0_5px_rgba(16,185,129,0.10)]
                    "
                  />

                  <span
                    className="
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    คงเหลือปกติ
                  </span>
                </div>

                <span
                  className="
                    text-lg
                    font-black
                    tabular-nums

                    !text-emerald-600
                  "
                >
                  {normalStock.toLocaleString(
                    "th-TH"
                  )}
                </span>
              </div>

              <div
                className="
                  mt-4
                  h-2.5
                  overflow-hidden

                  rounded-full

                  bg-slate-200/70
                "
              >
                <div
                  className="
                    h-full

                    rounded-full

                    bg-gradient-to-r
                    from-emerald-500
                    to-teal-400

                    shadow-sm
                  "
                  style={{
                    width: `${
                      totalStockStatus >
                      0
                        ? (normalStock /
                            totalStockStatus) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* LOW */}

            <div
              className={`
                ${iosInnerCard}

                p-4
              `}
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <span
                    className="
                      h-3
                      w-3

                      rounded-full

                      bg-amber-500

                      shadow-[0_0_0_5px_rgba(245,158,11,0.10)]
                    "
                  />

                  <span
                    className="
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    ใกล้หมด
                  </span>
                </div>

                <span
                  className="
                    text-lg
                    font-black
                    tabular-nums

                    !text-amber-600
                  "
                >
                  {lowStock.toLocaleString(
                    "th-TH"
                  )}
                </span>
              </div>

              <div
                className="
                  mt-4
                  h-2.5
                  overflow-hidden

                  rounded-full

                  bg-slate-200/70
                "
              >
                <div
                  className="
                    h-full

                    rounded-full

                    bg-gradient-to-r
                    from-amber-400
                    to-orange-400
                  "
                  style={{
                    width: `${
                      totalStockStatus >
                      0
                        ? (lowStock /
                            totalStockStatus) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* OUT */}

            <div
              className={`
                ${iosInnerCard}

                p-4
              `}
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <span
                    className="
                      h-3
                      w-3

                      rounded-full

                      bg-red-500

                      shadow-[0_0_0_5px_rgba(239,68,68,0.10)]
                    "
                  />

                  <span
                    className="
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    หมด
                  </span>
                </div>

                <span
                  className="
                    text-lg
                    font-black
                    tabular-nums

                    !text-red-600
                  "
                >
                  {outOfStock.toLocaleString(
                    "th-TH"
                  )}
                </span>
              </div>

              <div
                className="
                  mt-4
                  h-2.5
                  overflow-hidden

                  rounded-full

                  bg-slate-200/70
                "
              >
                <div
                  className="
                    h-full

                    rounded-full

                    bg-gradient-to-r
                    from-red-500
                    to-rose-400
                  "
                  style={{
                    width: `${
                      totalStockStatus >
                      0
                        ? (outOfStock /
                            totalStockStatus) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <AppButton
              href="/materials/summary"
              variant="primary"
              size="md"
              className="
                w-full
              "
            >
              <span>
                ดูรายการพัสดุทั้งหมด
              </span>

              <span>→</span>
            </AppButton>
          </div>
        </AppCard>
      </section>

      {/* =====================================================
          6 MONTH MOVEMENT
      ===================================================== */}

      <AppCard
        className={`
          overflow-hidden
          !rounded-[30px]
          !p-0

          ${iosCard}
        `}
      >
        <div
          className={
            panelHeaderClass
          }
        >
          <div
            className="
              flex
              flex-col
              gap-4

              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-xs
                  font-extrabold
                  uppercase
                  tracking-[0.14em]

                  !text-slate-400
                "
              >
                Activity
              </p>

              <h2
                className="
                  mt-1

                  text-xl
                  font-black

                  !text-slate-950

                  sm:text-2xl
                "
              >
                การเคลื่อนไหวพัสดุ
              </h2>

              <p
                className="
                  mt-1

                  text-sm
                  font-semibold

                  !text-slate-500
                "
              >
                เปรียบเทียบการรับเข้าและเบิกจ่ายย้อนหลัง 6 เดือน
              </p>
            </div>

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <span
                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  bg-emerald-50/90

                  px-3
                  py-1.5

                  text-xs
                  font-extrabold

                  !text-emerald-700

                  ring-1
                  ring-emerald-100
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-500
                  "
                />

                รับเข้า
              </span>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  bg-amber-50/90

                  px-3
                  py-1.5

                  text-xs
                  font-extrabold

                  !text-amber-700

                  ring-1
                  ring-amber-100
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-amber-500
                  "
                />

                เบิกจ่าย
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            overflow-x-auto

            p-4

            sm:p-6
          "
        >
          <div
            className="
              grid
              min-w-[680px]
              grid-cols-6
              gap-3

              sm:gap-4
            "
          >
            {monthData.map(
              (month) => {
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
                    className="
                      group
                      min-w-0

                      rounded-[22px]

                      border
                      border-transparent

                      px-2
                      py-3

                      transition-all
                      duration-300

                      hover:border-white/90
                      hover:bg-white/70
                      hover:shadow-[0_14px_32px_-28px_rgba(15,23,42,0.50)]
                    "
                  >
                    {/* CHART */}

                    <div
                      className="
                        mb-3

                        flex
                        h-36
                        items-end
                        justify-center
                        gap-2

                        border-b
                        border-slate-200/80

                        sm:h-48
                      "
                    >
                      {/* RECEIVE */}

                      <div
                        className="
                          flex
                          h-full
                          w-1/2
                          items-end
                          justify-center
                        "
                      >
                        <div
                          className="
                            w-full
                            max-w-8

                            rounded-t-[12px]

                            bg-gradient-to-t
                            from-emerald-500
                            via-emerald-400
                            to-emerald-300

                            shadow-[0_10px_25px_-12px_rgba(16,185,129,0.70)]

                            transition-all
                            duration-500

                            group-hover:brightness-105
                          "
                          style={{
                            height: `${receiveHeight}%`,
                          }}
                          title={`รับเข้า ${month.receive} ใบรับเข้า`}
                        />
                      </div>

                      {/* ISSUE */}

                      <div
                        className="
                          flex
                          h-full
                          w-1/2
                          items-end
                          justify-center
                        "
                      >
                        <div
                          className="
                            w-full
                            max-w-8

                            rounded-t-[12px]

                            bg-gradient-to-t
                            from-amber-500
                            via-amber-400
                            to-yellow-300

                            shadow-[0_10px_25px_-12px_rgba(245,158,11,0.70)]

                            transition-all
                            duration-500

                            group-hover:brightness-105
                          "
                          style={{
                            height: `${issueHeight}%`,
                          }}
                          title={`เบิกจ่าย ${month.issue} ใบเบิก`}
                        />
                      </div>
                    </div>

                    {/* MONTH */}

                    <p
                      className="
                        text-center

                        text-sm
                        font-black

                        !text-slate-800

                        sm:text-base
                      "
                    >
                      {month.label}
                    </p>

                    <p
                      className="
                        mt-0.5

                        text-center

                        text-xs
                        font-bold

                        !text-slate-400
                      "
                    >
                      {month.year}
                    </p>

                    {/* VALUES */}

                    <div
                      className="
                        mt-3

                        flex
                        items-center
                        justify-center
                        gap-2

                        text-xs
                        font-extrabold
                      "
                    >
                      <span
                        className="
                          rounded-full

                          bg-emerald-50

                          px-2
                          py-1

                          !text-emerald-700
                        "
                      >
                        {month.receive.toLocaleString(
                          "th-TH"
                        )}
                      </span>

                      <span
                        className="
                          rounded-full

                          bg-amber-50

                          px-2
                          py-1

                          !text-amber-700
                        "
                      >
                        {month.issue.toLocaleString(
                          "th-TH"
                        )}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </AppCard>
    </AppPage>
  );
}