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
    <div className="space-y-6">


      {/* Header */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          text-white
          shadow-xl
        "
      >

        <h1
          className="
            text-3xl
            font-extrabold
          "
        >
          📦 รายการพัสดุทั้งหมด
        </h1>


        <p
          className="
            mt-2
            text-lg
            font-semibold
            text-slate-300
          "
        >
          เลือกหมวดหมู่เพื่อดูรายการพัสดุในระบบ
        </p>

      </div>



      {/* Category */}

      <div
        className="
          grid
          gap-5
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {categories.map((cat) => (

          <Link
            key={cat.code}
            href={`/materials/category/${cat.code}`}
            className="
              group
              overflow-hidden
              rounded-2xl
              border
              border-slate-700
              bg-gradient-to-br
              from-slate-900
              via-slate-800
              to-slate-700
              shadow-xl
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-2xl
            "
          >


            <div
              className={`
                h-2
                bg-gradient-to-r
                ${cat.color}
              `}
            />



            <div
              className="
                flex
                min-h-[230px]
                flex-col
                items-center
                justify-between
                p-6
                text-center
              "
            >


              <div
                className="
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/20
                  bg-white/10
                  text-5xl
                  shadow-lg
                  backdrop-blur
                  transition
                  duration-300
                  group-hover:scale-110
                "
              >
                {cat.icon}
              </div>



              <div>

                <h2
                  className="
                    mt-4
                    text-2xl
                    font-extrabold
                    text-white
                  "
                >
                  {cat.name}
                </h2>


                <p
                  className="
                    mt-2
                    text-base
                    font-semibold
                    text-slate-300
                  "
                >
                  คลิกเพื่อจัดการข้อมูลพัสดุ
                </p>

              </div>



              <span
                className={`
                  mt-5
                  rounded-xl
                  bg-gradient-to-r
                  ${cat.color}
                  px-6
                  py-2
                  text-base
                  font-extrabold
                  text-white
                  shadow-lg
                  transition
                  group-hover:scale-105
                `}
              >
                เปิดหมวดหมู่ →
              </span>


            </div>


          </Link>

        ))}


      </div>


    </div>
  );
}