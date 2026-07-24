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

export default function MaterialsPage() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div
        className="
          rounded-3xl
          bg-gradient-to-r
          from-blue-700
          via-blue-600
          to-cyan-500
          p-8
          text-white
          shadow-xl
        "
      >

        <h1 className="text-4xl font-extrabold">
          📦 รายการพัสดุทั้งหมด
        </h1>

        <p className="mt-3 text-xl text-blue-100">
          เลือกหมวดหมู่เพื่อดูรายการพัสดุในระบบ
        </p>

      </div>

      {/* Category */}

      <div className="grid gap-8 md:grid-cols-3">

        {categories.map((cat) => (

          <Link
            key={cat.code}
            href={`/materials/category/${cat.code}`}
            className="
              group
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-white
              shadow-md
              transition-all
              duration-300
              hover:-translate-y-2
              hover:shadow-2xl
            "
          >

            <div
              className={`h-3 bg-gradient-to-r ${cat.color}`}
            />

            <div className="flex h-72 flex-col justify-between p-8">

              <div className="flex justify-center">

                <div
                  className="
                    flex
                    h-24
                    w-24
                    items-center
                    justify-center
                    rounded-3xl
                    bg-slate-50
                    text-6xl
                    shadow-md
                    transition
                    duration-300
                    group-hover:scale-110
                  "
                >
                  {cat.icon}
                </div>

              </div>

              <div className="space-y-3 text-center">

                <h2 className="text-2xl font-extrabold text-slate-800">
                  {cat.name}
                </h2>

                <p className="text-slate-500">
                  คลิกเพื่อจัดการข้อมูลพัสดุ
                </p>

              </div>

              <div className="flex justify-center">

                <span
                  className={`
                    rounded-xl
                    bg-gradient-to-r
                    ${cat.color}
                    px-6
                    py-3
                    font-bold
                    text-white
                    shadow-md
                    transition
                    group-hover:scale-105
                  `}
                >
                  เปิดหมวดหมู่ →
                </span>

              </div>

            </div>

          </Link>

        ))}

      </div>

    </div>
  );
}