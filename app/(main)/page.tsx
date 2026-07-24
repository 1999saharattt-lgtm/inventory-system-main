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
    <div className="space-y-4">

      {/* Hero */}
      <div
        className="
          overflow-hidden
          rounded-xl
          bg-gradient-to-r
          from-blue-700
          via-blue-600
          to-cyan-500
          p-4
          text-white
          shadow-md
        "
      >

        <h1 className="text-xl font-bold">
          👋 ยินดีต้อนรับ
        </h1>

        <p className="mt-1 text-lg font-bold">
          ระบบบริหารคลังพัสดุ
        </p>

        <p className="text-sm text-blue-100">
          สำนักอนามัยการเจริญพันธุ์
        </p>

      </div>



      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl-grid-cols-4">

        {cards.map((card) => (

          <div
            key={card.title}
            className={`
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-sm
              transition
              duration-300
              hover:-translate-y-1
              hover:shadow-md
              ${card.hover}
            `}
          >

            <div className={`h-1 ${card.color}`} />


            <div className="p-4">

              <div className="flex items-center justify-between">


                <div>

                  <p className="text-sm font-bold text-slate-600">
                    {card.title}
                  </p>


                  <p className="mt-1 text-3xl font-extrabold text-slate-900">
                    {card.value}
                  </p>


                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {card.unit}
                  </p>


                </div>



                <div
                  className={`
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-xl
                    border
                    text-2xl
                    ${card.bg}
                    ${card.border}
                  `}
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
            px-4
            py-2
          "
        >

          <h2 className="text-lg font-bold text-slate-800">
            ข้อมูลระบบ
          </h2>

        </div>


        <div
          className="
            space-y-1
            p-4
            text-sm
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