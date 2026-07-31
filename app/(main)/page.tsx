import { prisma } from "@/lib/prisma";

export default async function Home() {

  const totalMaterials = await prisma.material.count();


  const lowStock = await prisma.material
    .count({
      where: {
        balance: {
          lte: prisma.material.fields.minimumStock,
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
    },

    {
      title: "รับเข้าวันนี้",
      value: receiveToday,
      unit: "ใบรับพัสดุ",
      icon: "📥",
      color: "bg-emerald-600",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
      hover: "hover:border-emerald-300",
    },

    {
      title: "เบิกจ่ายวันนี้",
      value: issueToday,
      unit: "ใบเบิก",
      icon: "📤",
      color: "bg-amber-600",
      bg: "bg-amber-100",
      border: "border-amber-200",
      hover: "hover:border-amber-300",
    },

    {
      title: "พัสดุใกล้หมด",
      value: lowStock,
      unit: "รายการ",
      icon: "⚠️",
      color: "bg-red-600",
      bg: "bg-red-100",
      border: "border-red-200",
      hover: "hover:border-red-300",
    },
  ];
    return (
    <div className="space-y-5">


      {/* Hero */}

      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          px-6
          py-6
          text-center
          shadow-md
        "
      >

        <h1
          className="
            text-4xl
            font-extrabold
            text-slate-800
          "
        >
          👋 ยินดีต้อนรับ
        </h1>


        <p
          className="
            mt-2
            text-2xl
            font-extrabold
            text-blue-700
          "
        >
          สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
        </p>


      </div>
            {/* Summary */}

      <div
        className="
          grid
          gap-4
          md:grid-cols-2
          xl:grid-cols-4
        "
      >

        {cards.map((card) => (

          <div
  key={card.title}
  className={`
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
    ${card.hover}
  `}
>

            <div className={`h-1 ${card.color}`} />


            <div className="p-5">

              <div className="flex items-center justify-between">


                <div>

                  <p className="text-base font-bold text-slate-300">
                    {card.title}
                  </p>


                  <p className="mt-1 text-3xl font-extrabold text-white">
                    {card.value}
                  </p>


                  <p className="text-sm font-semibold text-slate-300">
                    {card.unit}
                  </p>

                </div>



                <div
  className="
    flex
    h-12
    w-12
    items-center
    justify-center
    rounded-xl
    border
    border-white/20
    bg-white/10
    text-xl
    backdrop-blur
  "
>
  {card.icon}
</div>


              </div>

            </div>


          </div>

        ))}

      </div>
            {/* Information */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        <div
          className="
            border-b
            border-slate-200
            bg-slate-50
            px-5
            py-3
          "
        >

          <h2
            className="
              text-xl
              font-extrabold
              text-slate-800
            "
          >
            ข้อมูลระบบ
          </h2>

        </div>



        <div
          className="
            space-y-1
            p-5
            text-base
            font-semibold
            text-slate-700
          "
        >

          <div>✅ รองรับการรับเข้าพัสดุ</div>
          <div>✅ รองรับการเบิกจ่ายพัสดุ</div>
          <div>✅ ตรวจสอบจำนวนคงเหลืออัตโนมัติ</div>
          <div>✅ รองรับบัญชีพัสดุ (Stock Card)</div>
          <div>✅ ตรวจสอบข้อมูลย้อนหลังได้</div>

        </div>


      </div>


    </div>
  );
}