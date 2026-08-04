import { prisma } from "@/lib/prisma";
import Link from "next/link";


export default async function DepartmentsPage() {


  const departments = await prisma.department.findMany({

    orderBy: {
      id: "asc",
    },

  });



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
          p-6
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
            🏢 หน่วยงาน
          </h1>


          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            เลือกหน่วยงานเพื่อดูข้อมูลเจ้าหน้าที่และรายการที่เกี่ยวข้อง
          </p>


        </div>


      </div>





      {/* Cards */}

      <div
        className="
          grid
          gap-6
          md:grid-cols-3
        "
      >

        {departments.map((department: any) => (

          <Link

            key={department.id}

            href={`/departments/${department.id}`}

            className="
              group
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-xl
              transition
              duration-300
              hover:-translate-y-2
              hover:border-emerald-300
            "

          >


            {/* Top Bar */}

            <div
              className="
                h-2
                bg-gradient-to-r
                from-emerald-600
                to-green-500
              "
            />



            <div
              className="
                flex
                h-64
                flex-col
                justify-between
                p-8
              "
            >



              {/* Icon */}

              <div className="flex justify-center">

                <div
                  className="
                    flex
                    h-24
                    w-24
                    items-center
                    justify-center
                    rounded-3xl
                    bg-emerald-100
                    text-6xl
                    transition
                    duration-300
                    group-hover:scale-110
                  "
                >
                  🏢
                </div>


              </div>





              {/* Name */}

              <div className="text-center">


                <h2
                  className="
                    text-2xl
                    font-extrabold
                    text-slate-800
                  "
                >
                  {department.name}
                </h2>


              </div>






              {/* Button */}

              <div className="flex justify-center">


                <span
                  className="
                    rounded-xl
                    bg-gradient-to-r
                    from-emerald-600
                    to-green-500
                    px-6
                    py-3
                    text-lg
                    font-extrabold
                    text-white
                    shadow-lg
                    transition
                    group-hover:scale-105
                  "
                >

                  ดูรายชื่อเจ้าหน้าที่

                </span>


              </div>



            </div>


          </Link>


        ))}




        {departments.length === 0 && (

          <div
            className="
              col-span-full
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-12
              text-center
              text-xl
              font-semibold
              text-slate-500
              shadow-xl
            "
          >

            ยังไม่มีข้อมูลหน่วยงาน

          </div>

        )}



      </div>



    </div>

  );

}