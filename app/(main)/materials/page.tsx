import Link from "next/link";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

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
          Header
      ===================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle="เลือกหมวดหมู่เพื่อดูและจัดการข้อมูลพัสดุ"
        actions={
          <>
            <Link
              href="/materials/qr"
              prefetch
              className="
                group
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
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
                hover:border-blue-200
                hover:bg-white
                hover:shadow-[0_16px_30px_-18px_rgba(59,130,246,0.35)]
                active:translate-y-0
                active:scale-[0.97]
                sm:px-5
              "
            >
              <span className="transition-transform duration-300 group-hover:scale-105">
                📱
              </span>
              <span>QR Code รวม</span>
            </Link>

            <Link
              href="/materials/export/pdf"
              target="_blank"
              className="
                group
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-[16px]
                border
                border-slate-200
                bg-slate-900
                px-4
                text-sm
                font-extrabold
                !text-white
                shadow-[0_12px_28px_-16px_rgba(15,23,42,0.55)]
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:bg-slate-800
                hover:shadow-[0_18px_34px_-18px_rgba(15,23,42,0.6)]
                active:translate-y-0
                active:scale-[0.97]
                sm:px-5
              "
            >
              <span className="transition-transform duration-300 group-hover:scale-105">
                📋
              </span>
              <span>รวมรายการพัสดุ</span>
            </Link>
          </>
        }
      />

      {/* =====================================================
          Category Cards
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
        {categories.map((cat) => (
          <Link
            key={cat.code}
            href={`/materials/category/${cat.code}`}
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
            {/* Accent */}

            <div
              className={`h-1.5 bg-gradient-to-r ${cat.color}`}
            />

            {/* Ambient Glow */}

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
                ${cat.color}
                opacity-[0.08]
                blur-3xl
                transition-all
                duration-500
                group-hover:scale-125
                group-hover:opacity-[0.14]
              `}
            />

            <div
              className="
                relative
                flex
                min-h-[205px]
                min-w-0
                flex-col
                p-5
                sm:min-h-[225px]
                sm:p-6
              "
            >
              {/* Icon */}

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
                  ${cat.color}
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
                {cat.icon}
              </div>

              {/* Text */}

              <div className="mt-5 min-w-0">
                <h2
                  className="
                    break-words
                    text-xl
                    font-black
                    leading-tight
                    tracking-tight
                    !text-slate-900
                    sm:text-2xl
                  "
                >
                  {cat.name}
                </h2>

                <p
                  className="
                    mt-2
                    break-words
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

              {/* Footer */}

              <div
                className="
                  mt-auto
                  flex
                  items-center
                  justify-between
                  gap-3
                  pt-5
                "
              >
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-slate-200
                    bg-white/80
                    px-3
                    py-1.5
                    text-xs
                    font-extrabold
                    !text-slate-500
                    shadow-sm
                  "
                >
                  หมวด {cat.code}
                </span>

                <span
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-[14px]
                    bg-slate-900
                    px-4
                    text-sm
                    font-extrabold
                    !text-white
                    shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)]
                    transition-all
                    duration-300
                    group-hover:bg-slate-800
                    group-active:scale-[0.96]
                  "
                >
                  <span>เปิด</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
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
