import Link from "next/link";

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

export default function StockCardHome() {
  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">

      {/* Header */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-5xl
            "
          >
            📚 รายการบัญชีพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-xl
            "
          >
            เลือกหมวดหมู่เพื่อดูประวัติการเคลื่อนไหวพัสดุ
          </p>

        </div>
      </div>

      {/* Category Cards */}

      <div
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-3
          sm:gap-5
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {categories.map((cat) => (

          <Link
            key={cat.code}
            href={`/stock-card/${cat.code}`}
            className="
              group
              min-w-0
              overflow-hidden
              rounded-2xl
              border
              border-slate-300
              bg-white
              shadow-lg
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-2xl
            "
          >

            <div
              className="
                h-1.5
                bg-gradient-to-r
                from-slate-700
                to-slate-900
                sm:h-2
              "
            />

            <div
              className="
                flex
                min-h-[170px]
                min-w-0
                flex-col
                items-center
                gap-2
                p-3
                text-center
                sm:min-h-[230px]
                sm:gap-5
                sm:p-6
              "
            >

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-100
                  text-xl
                  shadow-md
                  transition
                  duration-300
                  group-hover:scale-110
                  sm:h-16
                  sm:w-16
                  sm:text-3xl
                "
              >
                {cat.icon}
              </div>

              <div className="min-w-0 max-w-full">

                <h2
                  className="
                    mt-1
                    break-words
                    text-base
                    font-extrabold
                    leading-tight
                    text-slate-900
                    sm:mt-5
                    sm:text-xl
                  "
                >
                  {cat.name}
                </h2>

                <p
                  className="
                    mt-1
                    break-words
                    text-xs
                    font-semibold
                    leading-tight
                    text-slate-600
                    sm:mt-2
                    sm:text-lg
                  "
                >
                  คลิกเพื่อดูรายการบัญชีพัสดุ
                </p>

              </div>

              <span
                className="
                  mt-1
                  rounded-xl
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-950
                  px-5
                  py-2
                  text-sm
                  font-extrabold
                  text-white
                  shadow-lg
                  transition
                  group-hover:scale-105
                  sm:mt-5
                  sm:px-8
                  sm:py-3
                  sm:text-lg
                "
              >
                เปิด
              </span>

            </div>

          </Link>

        ))}

      </div>

    </div>
  );
}