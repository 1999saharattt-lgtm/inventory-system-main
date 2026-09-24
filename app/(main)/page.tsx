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

  hover:-translate-y-0.5

  active:translate-y-0
  active:scale-[0.985]
`;

const iosCard = `
  border
  border-white/70

  bg-white/75

  shadow-[0_14px_40px_-28px_rgba(15,23,42,0.35)]

  backdrop-blur-xl

  ring-1
  ring-slate-900/[0.025]
`;

const iosInnerCard = `
  rounded-[18px]

  border
  border-white/80

  bg-white/70

  shadow-[0_10px_28px_-24px_rgba(15,23,42,0.40)]

  backdrop-blur-xl
`;

const panelHeaderClass = `
  border-b
  border-slate-200/60

  bg-white/35

  px-5
  py-4

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

  /*
    Issue มี departmentId

    ADMIN
    - เห็นทุกกลุ่มงาน

    STAFF / VIEWER
    - เห็นเฉพาะกลุ่มงานของตัวเอง
  */

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
     SUMMARY CARDS
  ======================================================= */

  const cards = [
    {
      title:
        "จำนวนพัสดุทั้งหมด",

      value:
        totalMaterials,

      unit:
        "รายการ",

      icon:
        "📦",

      valueClass:
        "!text-blue-600",

      iconClass:
        "from-blue-500 to-sky-400",

      glowClass:
        "bg-blue-400/16",

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

      valueClass:
        "!text-emerald-600",

      iconClass:
        "from-emerald-500 to-teal-400",

      glowClass:
        "bg-emerald-400/16",

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

      valueClass:
        "!text-amber-600",

      iconClass:
        "from-amber-400 to-orange-400",

      glowClass:
        "bg-amber-400/16",

      href:
        "/issue?date=today",

      clickable:
        true,
    },

    {
      title:
        "รายการพัสดุที่ใกล้หมดทั้งหมด",

      value:
        lowStock +
        outOfStock,

      unit:
        "รายการ",

      icon:
        "⚠️",

      valueClass:
        "!text-rose-600",

      iconClass:
        "from-rose-500 to-red-400",

      glowClass:
        "bg-rose-400/16",

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
          TOP SUMMARY CARDS
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4

          md:grid-cols-2

          xl:grid-cols-4
        "
      >
        {cards.map(
          (card) => {
            const content = (
              <AppCard
                className={`
                  group
                  relative

                  min-h-[138px]
                  min-w-0

                  overflow-hidden

                  !rounded-[22px]
                  !p-5

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
                {/* ===========================================
                    GLOW
                =========================================== */}

                <div
                  aria-hidden="true"
                  className={`
                    pointer-events-none

                    absolute
                    -right-10
                    -top-12

                    h-28
                    w-28

                    rounded-full

                    ${card.glowClass}

                    blur-3xl
                  `}
                />

                {/* ===========================================
                    CONTENT
                =========================================== */}

                <div
                  className="
                    relative
                    z-10

                    flex
                    h-full
                    min-w-0
                    flex-col
                    justify-between
                  "
                >
                  {/* =========================================
                      TITLE / ICON
                  ========================================= */}

                  <div
                    className="
                      flex
                      min-w-0
                      items-start
                      justify-between
                      gap-3
                    "
                  >
                    <p
                      className="
                        min-w-0
                        flex-1

                        whitespace-nowrap

                        text-base
                        font-extrabold
                        leading-tight

                        !text-slate-700

                        sm:text-lg
                      "
                    >
                      {
                        card.title
                      }
                    </p>

                    <div
                      className={`
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center

                        rounded-[15px]

                        bg-gradient-to-br
                        ${card.iconClass}

                        text-xl

                        shadow-md
                        shadow-slate-900/10

                        ring-1
                        ring-white/50

                        transition-transform
                        duration-300

                        group-hover:scale-105
                      `}
                      aria-hidden="true"
                    >
                      {
                        card.icon
                      }
                    </div>
                  </div>

                  {/* =========================================
                      VALUE
                  ========================================= */}

                  <div
                    className="
                      mt-4

                      flex
                      min-w-0
                      items-end
                      gap-2
                    "
                  >
                    <p
                      className={`
                        shrink-0

                        text-4xl
                        font-black
                        leading-none
                        tracking-tight
                        tabular-nums

                        ${card.valueClass}
                      `}
                    >
                      {card.value.toLocaleString(
                        "th-TH"
                      )}
                    </p>

                    <p
                      className="
                        whitespace-nowrap

                        pb-0.5

                        text-sm
                        font-bold

                        !text-slate-500
                      "
                    >
                      {
                        card.unit
                      }
                    </p>
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
                  {
                    content
                  }
                </Link>
              );
            }

            return (
              <div
                key={
                  card.title
                }
                className="
                  min-w-0
                "
              >
                {
                  content
                }
              </div>
            );
          }
        )}
      </section>

      {/* =====================================================
          MONTHLY RECEIVE / ISSUE
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4

          md:grid-cols-2
        "
      >
        {/* ===================================================
            RECEIVE
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

                min-h-[125px]
                min-w-0

                overflow-hidden

                !rounded-[22px]
                !p-5

                ${iosCard}
                ${iosPressable}
              `}
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none

                  absolute
                  -right-10
                  -top-12

                  h-32
                  w-32

                  rounded-full

                  bg-emerald-300/16

                  blur-3xl
                "
              />

              <div
                className="
                  relative
                  z-10

                  flex
                  h-full
                  min-w-0
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div className="min-w-0">
                  <p
                    className="
                      whitespace-nowrap

                      text-lg
                      font-extrabold
                      leading-tight

                      !text-slate-700

                      sm:text-xl
                    "
                  >
                    รับเข้าประจำเดือน
                  </p>

                  <div
                    className="
                      mt-3

                      flex
                      min-w-0
                      items-end
                      gap-2
                    "
                  >
                    <p
                      className="
                        shrink-0

                        text-4xl
                        font-black
                        leading-none
                        tracking-tight
                        tabular-nums

                        !text-emerald-600

                        sm:text-5xl
                      "
                    >
                      {receiveThisMonth.toLocaleString(
                        "th-TH"
                      )}
                    </p>

                    <span
                      className="
                        whitespace-nowrap

                        pb-0.5

                        text-sm
                        font-bold

                        !text-slate-500
                      "
                    >
                      ใบรับเข้า
                    </span>
                  </div>
                </div>

                <div
                  className="
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center

                    rounded-[18px]

                    bg-gradient-to-br
                    from-emerald-500
                    to-teal-400

                    text-2xl

                    shadow-lg
                    shadow-emerald-500/15

                    ring-1
                    ring-white/50

                    transition-transform
                    duration-300

                    group-hover:scale-105
                  "
                  aria-hidden="true"
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

              min-h-[125px]
              min-w-0

              overflow-hidden

              !rounded-[22px]
              !p-5

              ${iosCard}
            `}
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                -right-10
                -top-12

                h-32
                w-32

                rounded-full

                bg-emerald-300/16

                blur-3xl
              "
            />

            <div
              className="
                relative
                z-10

                flex
                h-full
                min-w-0
                items-center
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    whitespace-nowrap

                    text-lg
                    font-extrabold
                    leading-tight

                    !text-slate-700

                    sm:text-xl
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
                      text-4xl
                      font-black
                      leading-none
                      tracking-tight
                      tabular-nums

                      !text-emerald-600

                      sm:text-5xl
                    "
                  >
                    {receiveThisMonth.toLocaleString(
                      "th-TH"
                    )}
                  </p>

                  <span
                    className="
                      whitespace-nowrap

                      pb-0.5

                      text-sm
                      font-bold

                      !text-slate-500
                    "
                  >
                    ใบรับเข้า
                  </span>
                </div>
              </div>

              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center

                  rounded-[18px]

                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-400

                  text-2xl

                  shadow-lg
                  shadow-emerald-500/15

                  ring-1
                  ring-white/50
                "
                aria-hidden="true"
              >
                📥
              </div>
            </div>
          </AppCard>
        )}

        {/* ===================================================
            ISSUE
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

              min-h-[125px]
              min-w-0

              overflow-hidden

              !rounded-[22px]
              !p-5

              ${iosCard}
              ${iosPressable}
            `}
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                -right-10
                -top-12

                h-32
                w-32

                rounded-full

                bg-amber-300/16

                blur-3xl
              "
            />

            <div
              className="
                relative
                z-10

                flex
                h-full
                min-w-0
                items-center
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    whitespace-nowrap

                    text-lg
                    font-extrabold
                    leading-tight

                    !text-slate-700

                    sm:text-xl
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
                      shrink-0

                      text-4xl
                      font-black
                      leading-none
                      tracking-tight
                      tabular-nums

                      !text-amber-600

                      sm:text-5xl
                    "
                  >
                    {issueThisMonth.toLocaleString(
                      "th-TH"
                    )}
                  </p>

                  <span
                    className="
                      whitespace-nowrap

                      pb-0.5

                      text-sm
                      font-bold

                      !text-slate-500
                    "
                  >
                    ใบเบิกจ่าย
                  </span>
                </div>
              </div>

              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center

                  rounded-[18px]

                  bg-gradient-to-br
                  from-amber-400
                  to-orange-400

                  text-2xl

                  shadow-lg
                  shadow-amber-500/15

                  ring-1
                  ring-white/50

                  transition-transform
                  duration-300

                  group-hover:scale-105
                "
                aria-hidden="true"
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

          lg:grid-cols-2
        "
      >
        {/* ===================================================
            ACTION REQUIRED
        =================================================== */}

        <AppCard
          className={`
            overflow-hidden

            !rounded-[24px]
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
                min-w-0
                items-center
                justify-between
                gap-3
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    whitespace-nowrap

                    text-xl
                    font-black
                    leading-tight

                    !text-slate-900

                    sm:text-2xl
                  "
                >
                  🔔 รายการที่ต้องดำเนินการ
                </h2>

                <p
                  className="
                    mt-1

                    whitespace-nowrap

                    text-sm
                    font-semibold

                    !text-slate-500
                  "
                >
                  รายการที่อยู่ระหว่างการดำเนินงาน
                </p>
              </div>

              <span
                className="
                  flex
                  h-11
                  min-w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-[14px]

                  bg-red-500

                  px-3

                  text-base
                  font-black
                  tabular-nums

                  !text-white

                  shadow-md
                  shadow-red-500/15
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
            "
          >
            {/* ===============================================
                PENDING ISSUE
            =============================================== */}

            <Link
              href="/notifications"
              prefetch
              className={`
                group

                flex
                min-w-0
                items-center
                justify-between
                gap-3

                ${iosInnerCard}

                px-4
                py-3.5

                ${iosPressable}
              `}
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                "
              >
                <span
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center

                    rounded-[14px]

                    bg-gradient-to-br
                    from-red-500
                    to-rose-400

                    text-lg

                    shadow-md
                    shadow-red-500/15
                  "
                  aria-hidden="true"
                >
                  🔔
                </span>

                <div className="min-w-0">
                  <p
                    className="
                      whitespace-nowrap

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
                      mt-0.5

                      whitespace-nowrap

                      text-sm
                      font-semibold

                      !text-slate-500
                    "
                  >
                    ตรวจสอบรายการเบิกจ่ายที่ยังไม่ดำเนินการ
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    text-lg
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
                    h-7
                    w-7
                    items-center
                    justify-center

                    rounded-full

                    bg-slate-100

                    !text-slate-400
                  "
                >
                  ›
                </span>
              </div>
            </Link>

            {/* ===============================================
                LOW STOCK
            =============================================== */}

            <Link
              href="/materials/low-stock"
              prefetch
              className={`
                group

                flex
                min-w-0
                items-center
                justify-between
                gap-3

                ${iosInnerCard}

                px-4
                py-3.5

                ${iosPressable}
              `}
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                "
              >
                <span
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center

                    rounded-[14px]

                    bg-gradient-to-br
                    from-amber-400
                    to-orange-400

                    text-lg

                    shadow-md
                    shadow-amber-500/15
                  "
                  aria-hidden="true"
                >
                  ⚠️
                </span>

                <div className="min-w-0">
                  <p
                    className="
                      whitespace-nowrap

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
                      mt-0.5

                      whitespace-nowrap

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
                  gap-2
                "
              >
                <span
                  className="
                    text-lg
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
                    h-7
                    w-7
                    items-center
                    justify-center

                    rounded-full

                    bg-slate-100

                    !text-slate-400
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

            !rounded-[24px]
            !p-0

            ${iosCard}
          `}
        >
          <div
            className={
              panelHeaderClass
            }
          >
            <h2
              className="
                whitespace-nowrap

                text-xl
                font-black
                leading-tight

                !text-slate-900

                sm:text-2xl
              "
            >
              📊 สถานะพัสดุคงเหลือ
            </h2>

            <p
              className="
                mt-1

                whitespace-nowrap

                text-sm
                font-semibold

                !text-slate-500
              "
            >
              สรุปจากจำนวนคงเหลือปัจจุบัน
            </p>
          </div>

          <div
            className="
              space-y-3

              p-4
            "
          >
            {/* ===============================================
                NORMAL
            =============================================== */}

            <div
              className={`
                ${iosInnerCard}

                p-3.5
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
                    min-w-0
                    items-center
                    gap-2.5
                  "
                >
                  <span
                    className="
                      h-3
                      w-3
                      shrink-0

                      rounded-full

                      bg-emerald-500
                    "
                  />

                  <span
                    className="
                      whitespace-nowrap

                      text-base
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    คงเหลือปกติ
                  </span>
                </div>

                <span
                  className="
                    shrink-0

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
                  mt-3

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

            {/* ===============================================
                LOW
            =============================================== */}

            <div
              className={`
                ${iosInnerCard}

                p-3.5
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
                    min-w-0
                    items-center
                    gap-2.5
                  "
                >
                  <span
                    className="
                      h-3
                      w-3
                      shrink-0

                      rounded-full

                      bg-amber-500
                    "
                  />

                  <span
                    className="
                      whitespace-nowrap

                      text-base
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    ใกล้หมด
                  </span>
                </div>

                <span
                  className="
                    shrink-0

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
                  mt-3

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

            {/* ===============================================
                OUT
            =============================================== */}

            <div
              className={`
                ${iosInnerCard}

                p-3.5
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
                    min-w-0
                    items-center
                    gap-2.5
                  "
                >
                  <span
                    className="
                      h-3
                      w-3
                      shrink-0

                      rounded-full

                      bg-red-500
                    "
                  />

                  <span
                    className="
                      whitespace-nowrap

                      text-base
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    หมด
                  </span>
                </div>

                <span
                  className="
                    shrink-0

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
                  mt-3

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
              <span
                className="
                  whitespace-nowrap
                "
              >
                ดูรายการพัสดุทั้งหมด
              </span>
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

          !rounded-[24px]
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
              min-w-0
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  whitespace-nowrap

                  text-xl
                  font-black
                  leading-tight

                  !text-slate-900

                  sm:text-2xl
                "
              >
                📈 การเคลื่อนไหวพัสดุ
              </h2>

              <p
                className="
                  mt-1

                  whitespace-nowrap

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
                shrink-0
                flex-wrap
                gap-2
              "
            >
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5

                  whitespace-nowrap

                  rounded-full

                  bg-emerald-50

                  px-3
                  py-1.5

                  text-sm
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
                  gap-1.5

                  whitespace-nowrap

                  rounded-full

                  bg-amber-50

                  px-3
                  py-1.5

                  text-sm
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

            sm:p-5
          "
        >
          <div
            className="
              grid
              min-w-[620px]
              grid-cols-6
              gap-2

              sm:gap-3
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

                      rounded-[16px]

                      px-1.5
                      py-2

                      transition-colors
                      duration-300

                      hover:bg-white/60
                    "
                  >
                    {/* =======================================
                        CHART
                    ======================================= */}

                    <div
                      className="
                        mb-2

                        flex
                        h-28
                        items-end
                        justify-center
                        gap-1

                        border-b
                        border-slate-200/80

                        sm:h-36
                        sm:gap-1.5
                      "
                    >
                      {/* =====================================
                          RECEIVE
                      ===================================== */}

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
                            max-w-7

                            rounded-t-[8px]

                            bg-gradient-to-t
                            from-emerald-500
                            to-emerald-300

                            shadow-[0_7px_16px_-10px_rgba(16,185,129,0.7)]

                            transition-all
                            duration-500
                          "
                          style={{
                            height: `${receiveHeight}%`,
                          }}
                          title={`รับเข้า ${month.receive} ใบรับเข้า`}
                        />
                      </div>

                      {/* =====================================
                          ISSUE
                      ===================================== */}

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
                            max-w-7

                            rounded-t-[8px]

                            bg-gradient-to-t
                            from-amber-500
                            to-yellow-300

                            shadow-[0_7px_16px_-10px_rgba(245,158,11,0.7)]

                            transition-all
                            duration-500
                          "
                          style={{
                            height: `${issueHeight}%`,
                          }}
                          title={`เบิกจ่าย ${month.issue} ใบเบิก`}
                        />
                      </div>
                    </div>

                    {/* =======================================
                        MONTH
                    ======================================= */}

                    <p
                      className="
                        whitespace-nowrap

                        text-center

                        text-base
                        font-black

                        !text-slate-800
                      "
                    >
                      {
                        month.label
                      }
                    </p>

                    <p
                      className="
                        mt-0.5

                        whitespace-nowrap

                        text-center

                        text-sm
                        font-bold

                        !text-slate-400
                      "
                    >
                      {
                        month.year
                      }
                    </p>

                    {/* =======================================
                        VALUES
                    ======================================= */}

                    <div
                      className="
                        mt-2

                        flex
                        items-center
                        justify-center
                        gap-1.5
                      "
                    >
                      <span
                        className="
                          whitespace-nowrap

                          rounded-full

                          bg-emerald-50

                          px-2.5
                          py-1

                          text-xs
                          font-extrabold

                          !text-emerald-700
                        "
                      >
                        รับ{" "}
                        {month.receive.toLocaleString(
                          "th-TH"
                        )}
                      </span>

                      <span
                        className="
                          whitespace-nowrap

                          rounded-full

                          bg-amber-50

                          px-2.5
                          py-1

                          text-xs
                          font-extrabold

                          !text-amber-700
                        "
                      >
                        เบิก{" "}
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