import Link from "next/link";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

type Category = {
  code: string;
  name: string;
  icon: string;
  color: string;
};

const categories: Category[] = [
  {
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
    icon: "📄",
    color: "from-blue-500 to-blue-700",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
    icon: "💻",
    color: "from-violet-500 to-violet-700",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
    icon: "⚡",
    color: "from-amber-400 to-amber-600",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
    icon: "🏠",
    color: "from-emerald-500 to-emerald-700",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
    icon: "🚗",
    color: "from-red-500 to-red-700",
  },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
    icon: "📰",
    color: "from-cyan-500 to-cyan-700",
  },
];

export default function MaterialsPage() {
  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle="เลือกหมวดหมู่เพื่อดูและจัดการข้อมูลพัสดุ"
        actions={
          <>
            {/* ===============================================
                QR CODE รวม
                เปิด PDF โดยตรงในแท็บใหม่
            =============================================== */}

            <AppButton
              href="/materials/qr/pdf"
              variant="primary"
              size="md"
              target="_blank"
            >
              <span>📱</span>
              <span>QR Code รวม</span>
            </AppButton>

            {/* ===============================================
                รวมรายการพัสดุ
                เปิด PDF โดยตรงในแท็บใหม่
            =============================================== */}

            <AppButton
              href="/materials/export/pdf"
              variant="secondary"
              size="md"
              target="_blank"
            >
              <span>📋</span>
              <span>รวมรายการพัสดุ</span>
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          CATEGORY CARDS
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {categories.map((category) => (
          <Link
            key={category.code}
            href={`/materials/category/${category.code}`}
            prefetch
            className="
              group
              relative
              min-w-0
              overflow-hidden
              rounded-[28px]
              border
              border-white/80
              bg-white/80
              shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
              backdrop-blur-2xl
              transition-all
              duration-300
              ease-out

              hover:-translate-y-1
              hover:border-slate-200
              hover:bg-white/95
              hover:shadow-[0_26px_64px_-28px_rgba(15,23,42,0.45)]

              active:translate-y-0
              active:scale-[0.985]
            "
          >
            {/* =================================================
                ACCENT
            ================================================= */}

            <div
              className={`
                h-1.5
                bg-gradient-to-r
                ${category.color}
              `}
            />

            {/* =================================================
                AMBIENT GLOW
            ================================================= */}

            <div
              aria-hidden="true"
              className={`
                pointer-events-none
                absolute
                -right-12
                -top-12
                h-36
                w-36
                rounded-full
                bg-gradient-to-br
                ${category.color}
                opacity-[0.08]
                blur-3xl
                transition-all
                duration-500

                group-hover:scale-125
                group-hover:opacity-[0.14]
              `}
            />

            {/* =================================================
                CONTENT
            ================================================= */}

            <div
              className="
                relative
                flex
                min-h-[225px]
                min-w-0
                flex-col
                items-center
                justify-center
                px-5
                py-7
                text-center
                sm:min-h-[240px]
                sm:px-6
                sm:py-8
              "
            >
              {/* ===============================================
                  ICON
              =============================================== */}

              <div
                className={`
                  flex
                  h-16
                  w-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-[20px]
                  bg-gradient-to-br
                  ${category.color}
                  text-3xl
                  shadow-[0_16px_30px_-18px_rgba(15,23,42,0.5)]
                  ring-1
                  ring-white/30
                  transition-all
                  duration-300

                  group-hover:-translate-y-0.5
                  group-hover:scale-[1.06]

                  group-active:scale-[0.96]
                `}
              >
                {category.icon}
              </div>

              {/* ===============================================
                  TEXT
              =============================================== */}

              <div
                className="
                  mt-5
                  w-full
                  min-w-0
                  text-center
                "
              >
                <h2
                  className="
                    break-words
                    text-center
                    text-xl
                    font-black
                    leading-tight
                    tracking-tight
                    !text-slate-900
                    sm:text-2xl
                  "
                >
                  {category.name}
                </h2>

                <p
                  className="
                    mt-2
                    break-words
                    text-center
                    text-sm
                    font-semibold
                    leading-relaxed
                    !text-slate-500
                    sm:text-base
                  "
                >
                  คลิกเพื่อจัดการข้อมูลพัสดุในหมวดหมู่นี้
                </p>
              </div>

              {/* ===============================================
                  OPEN BUTTON
              =============================================== */}

              <div
                className="
                  mt-5
                  flex
                  w-full
                  items-center
                  justify-center
                "
              >
                <span
                  className="
                    relative
                    inline-flex
                    h-10
                    min-w-[104px]
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-[14px]
                    border
                    border-blue-400/35
                    bg-gradient-to-b
                    from-blue-500
                    via-blue-600
                    to-blue-700
                    px-4
                    text-sm
                    font-extrabold
                    leading-none
                    !text-white

                    shadow-[0_8px_20px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.28)]

                    transition-all
                    duration-200
                    ease-out

                    group-hover:-translate-y-[1px]
                    group-hover:shadow-[0_12px_28px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.32)]

                    group-active:translate-y-[1px]
                    group-active:scale-[0.97]
                  "
                >
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-2
                      top-0
                      h-px
                      bg-gradient-to-r
                      from-transparent
                      via-white/60
                      to-transparent
                    "
                  />

                  <span className="relative z-10">
                    เปิด
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AppPage>
  );
}