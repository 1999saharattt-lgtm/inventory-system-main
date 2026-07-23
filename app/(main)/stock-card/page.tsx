import Link from "next/link";

const categories = [
  {
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
    icon: "📄",
    color: "bg-blue-700",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
    icon: "💻",
    color: "bg-violet-700",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
    icon: "⚡",
    color: "bg-amber-600",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
    icon: "🏠",
    color: "bg-emerald-700",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
    icon: "🚗",
    color: "bg-red-700",
   },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
    icon: "📰",
    color: "bg-emerald-700",
  },
];


export default function StockCardHome() {

  return (

    <div className="space-y-8">


      {/* Header */}

      <div className="
        rounded-xl
        border
        border-slate-300
        bg-slate-100
        p-6
        shadow-sm
      ">

        <h1 className="
          text-3xl
          font-bold
          tracking-tight
          text-slate-800
        ">
          รายการบัญชีพัสดุ
        </h1>


        <p className="mt-2 text-slate-600">
          เลือกหมวดหมู่เพื่อดูประวัติการเคลื่อนไหวพัสดุ
        </p>


      </div>



      {/* Category Cards */}

      <div className="
        grid
        gap-8
        md:grid-cols-3
      ">


        {categories.map((item)=>(


          <Link
            key={item.code}
            href={`/stock-card/${item.code}`}
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-300
              bg-slate-100
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-1
              hover:shadow-lg
              hover:border-blue-300
            "
          >


            {/* Top Color */}

            <div className="h-2 bg-emerald-500" />



            <div className="
              flex
              h-56
              flex-col
              justify-between
              p-8
            ">



              {/* Icon */}

              <div className="flex justify-center">

                <div className="
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                  shadow-sm
                  border
                  border-slate-200
                  text-5xl
                ">
                  {item.icon}
                </div>

              </div>




              {/* Title */}

<div className="text-center">

  <h2 className="
    text-xl
    font-bold
    text-slate-800
  ">
    {item.name}
  </h2>

</div>




              {/* Button */}

<div className="flex justify-center">

  <span
  className="
    rounded-lg
    bg-emerald-500
    px-4
    py-2
    text-sm
    font-medium
    text-white
    shadow-sm
    transition
    hover:bg-emerald-600
  "
>
    คลิกเพื่อดูรายการ
  </span>

</div>


            </div>


          </Link>


        ))}


      </div>


    </div>

  );
}