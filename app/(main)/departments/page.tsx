import { prisma } from "@/lib/prisma";
import Link from "next/link";


export default async function DepartmentsPage() {


  const departments =
    await prisma.department.findMany({

      orderBy: {
        id: "asc",
      },

    });



  return (

    <div className="space-y-8">


      {/* Header */}

      <div
        className="
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >

        <h1
          className="
            text-3xl
            font-bold
            tracking-tight
            text-slate-800
          "
        >
          หน่วยงาน
        </h1>


        <p className="mt-2 text-slate-600">
          เลือกหน่วยงานเพื่อดูข้อมูลเจ้าหน้าที่และรายการที่เกี่ยวข้อง
        </p>


      </div>





      {/* Department Cards */}

      <div
        className="
          grid
          gap-8
          md:grid-cols-3
        "
      >


        {
          departments.map((department: any)=>(


            <Link

              key={department.id}

              href={`/departments/${department.id}`}

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




              <div
                className="
                  flex
                  h-56
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
                    "
                  >
                    🏢
                  </div>

                </div>





                {/* Title */}

                <div className="text-center">


                  <h2
                    className="
                      text-xl
                      font-bold
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
                    คลิกเพื่อดูรายชื่อ
                  </span>


                </div>


              </div>


            </Link>


          ))
        }





        {
          departments.length === 0 && (

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-slate-100
                p-6
                text-center
                text-slate-500
              "
            >
              ยังไม่มีข้อมูลหน่วยงาน
            </div>

          )
        }



      </div>


    </div>

  );

}