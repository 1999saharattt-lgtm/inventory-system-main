import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const totalMaterials = await prisma.material.count();

  const lowStock = await prisma.material
    .count({
      where: {
        balance: {
          lt: 10,
        },
      },
    })
    .catch(() => 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const receiveToday = await prisma.receive.count({
    where: {
      receiveDate: {
        gte: today,
      },
    },
  });

  const issueToday = await prisma.issue.count({
    where: {
      issueDate: {
        gte: today,
      },
    },
  });

  const cards = [
    {
      title: "จำนวนพัสดุทั้งหมด",
      value: totalMaterials,
      unit: "รายการ",
      icon: "📦",
      color: "bg-blue-600",
      bg: "bg-blue-100",
      border: "border-blue-200",
      hover: "hover:border-blue-300",
      href: "/materials/summary",
    },

    {
      title: "รับเข้าวันนี้",
      value: receiveToday,
      unit: "ใบรับเข้า",
      icon: "📥",
      color: "bg-emerald-600",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
      hover: "hover:border-emerald-300",
    },

    {
      title: "เบิกจ่ายวันนี้",
      value: issueToday,
      unit: "ใบเบิกจ่าย",
      icon: "📤",
      color: "bg-amber-600",
      bg: "bg-amber-100",
      border: "border-amber-200",
      hover: "hover:border-amber-300",
    },

    {
      title: "จำนวนพัสดุใกล้หมด",
      value: lowStock,
      unit: "รายการ",
      icon: "⚠️",
      color: "bg-red-600",
      bg: "bg-red-100",
      border: "border-red-200",
      hover: "hover:border-red-300",
      href: "/materials/low-stock",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* =====================================================
          Hero
      ===================================================== */}

      <div
        className="
          group
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-5
          text-center
          text-white
          shadow-xl
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-2xl
          sm:px-6
          sm:py-7
        "
      >
        <div
          className="
            mx-auto
            mb-3
            h-1
            w-20
            rounded-full
            bg-gradient-to-r
            from-blue-500
            to-cyan-400
            sm:mb-4
            sm:w-28
          "
        />

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
          👋 ยินดีต้อนรับ
        </h1>

        <p
          className="
            mt-2
            break-words
            text-base
            font-extrabold
            leading-tight
            !text-cyan-400
            sm:mt-3
            sm:text-2xl
          "
        >
          สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
        </p>
      </div>

      {/* =====================================================
          Summary
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
          const content = (
            <>
              <div className={`h-1 ${card.color}`} />

              <div className="p-3 sm:p-5">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-white sm:text-base">
                      {card.title}
                    </p>

                    <p className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                      {card.value}
                    </p>

                    <p className="text-xs font-semibold text-slate-200 sm:text-sm">
                      {card.unit}
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/20
                      bg-white/10
                      text-lg
                      backdrop-blur
                      sm:h-12
                      sm:w-12
                      sm:text-xl
                    "
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            </>
          );

          const className = `
            group
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-900
            via-slate-800
            to-slate-700
            text-white
            shadow-xl
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
            ${card.hover}
          `;

          if (card.href) {
            return (
              <Link
                key={card.title}
                href={card.href}
                className={className}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={card.title}
              className={className}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* =====================================================
          Information
      ===================================================== */}

      <div
        className="
          group
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-800
          to-slate-700
          text-white
          shadow-xl
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-2xl
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
            px-3
            py-3
            sm:px-5
            sm:py-4
          "
        >
          <h2
            className="
              text-lg
              font-extrabold
              !text-white
              sm:text-xl
            "
          >
            ข้อมูลระบบ
          </h2>
        </div>

        <div
          className="
            space-y-2
            p-3
            sm:space-y-2.5
            sm:p-5
          "
        >
          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900/70
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              sm:text-base
            "
          >
            ✅ รองรับการรับเข้าพัสดุ
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900/70
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              sm:text-base
            "
          >
            ✅ รองรับการเบิกจ่ายพัสดุ
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900/70
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              sm:text-base
            "
          >
            ✅ ตรวจสอบจำนวนคงเหลืออัตโนมัติ
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900/70
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              sm:text-base
            "
          >
            ✅ รองรับบัญชีพัสดุ (Stock Card)
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900/70
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              sm:text-base
            "
          >
            ✅ ตรวจสอบข้อมูลย้อนหลังได้
          </div>
        </div>
      </div>
    </div>
  );
}