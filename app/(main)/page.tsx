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
      href: "/receive/today",
    },
    {
      title: "เบิกจ่ายวันนี้",
      value: issueToday,
      unit: "ใบเบิกจ่าย",
      icon: "📤",
      color: "bg-amber-600",
      hover: "hover:border-amber-300",
      href: "/issue/today",
    },
    {
      title: "จำนวนพัสดุใกล้หมด",
      value: lowStock,
      unit: "รายการ",
      icon: "⚠️",
      color: "bg-red-600",
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
        {/* เส้นสีฟ้าเต็มกรอบ */}

        <div
          className="
            mb-4
            h-1
            w-full
            rounded-full
            bg-gradient-to-r
            from-blue-500
            via-cyan-400
            to-blue-500
            shadow-sm
            sm:mb-5
          "
        />

        <h1
          className="
            break-words
            text-2xl
            font-extrabold
            leading-tight
            !text-white
          "
        >
          👋 ยินดีต้อนรับ
        </h1>

        <p
          className="
            mt-2
            break-words
            text-2xl
            font-extrabold
            leading-tight
            !text-cyan-400
            sm:mt-3
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

          return (
            <Link
              key={card.title}
              href={card.href}
              className={className}
            >
              {content}
            </Link>
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
        {/* Header */}

        <div
          className="
            border-b
            border-slate-700
            bg-gradient-to-r
            from-slate-950
            via-slate-900
            to-slate-800
            px-3
            py-4
            sm:px-5
            sm:py-5
          "
        >
          <h2
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            ข้อมูลระบบ
          </h2>

          {/* เส้นสีฟ้าเต็มกรอบ */}

          <div
            className="
              mt-3
              h-1
              w-full
              rounded-full
              bg-gradient-to-r
              from-blue-500
              via-cyan-400
              to-blue-500
              shadow-sm
            "
          />
        </div>

        {/* Information Items */}

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
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
              sm:text-base
            "
          >
            ✅ รองรับการรับเข้าพัสดุ
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
              sm:text-base
            "
          >
            ✅ รองรับการเบิกจ่ายพัสดุ
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
              sm:text-base
            "
          >
            ✅ ตรวจสอบจำนวนคงเหลืออัตโนมัติ
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
              sm:text-base
            "
          >
            ✅ รองรับบัญชีพัสดุ (Stock Card)
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
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