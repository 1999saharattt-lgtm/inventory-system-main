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
  flex
  items-center
  justify-between
  rounded-2xl
  bg-gradient-to-r
  from-slate-950
  via-slate-800
  to-slate-700
  px-8
  py-6
  min-h-[140px]
  text-white
  shadow-xl
"
>
  <div>
    <h1
      className="
  text-5xl
  font-extrabold
  leading-tight
  !text-white
"
    >
      📦 รายการพัสดุทั้งหมด
    </h1>

    <p
  className="
  mt-2
  text-xl
  font-semibold
  !text-slate-200
"
>
  เลือกหมวดหมู่เพื่อดูรายการพัสดุ
</p>

  </div>
</div>

{/* Category Cards */}
<div
  className="
    grid
    gap-5
    md:grid-cols-2
    xl:grid-cols-3
  "
>

        {categories.map((cat)=>(


          <Link
            key={cat.code}
            href={`/materials/category/${cat.code}`}
            className="
              group
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
                h-2
                bg-gradient-to-r
                from-slate-700
                to-slate-900
              "
            />


            <div
  className="
    flex
    min-h-[230px]
    flex-col
    items-center
    gap-5
    p-6
    text-center
  "
>
                          <div
  className="
    flex
    h-16
    w-16
    shrink-0
    items-center
    justify-center
    rounded-xl
    border
    border-slate-200
    bg-slate-100
    text-3xl
    shadow-md
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
                    mt-5
                    text-xl
                    font-extrabold
                    text-slate-900
                  "
                >

                  {cat.name}

                </h2>



                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                    text-slate-600
                  "
                >

                  คลิกเพื่อจัดการข้อมูลพัสดุ

                </p>


              </div>





              <span
                className="
                  mt-5
                  rounded-xl
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-950
                  px-8
                  py-3
                  text-lg
                  font-extrabold
                  text-white
                  shadow-lg
                  transition
                  group-hover:scale-105
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