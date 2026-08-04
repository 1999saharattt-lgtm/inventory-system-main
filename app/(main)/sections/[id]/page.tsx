import { prisma } from "@/lib/prisma";
import Link from "next/link";


type Props = {
  params: Promise<{
    id: string;
  }>;
};



export default async function SectionDetailPage({
  params,
}: Props) {


  const { id } = await params;



  const section = await prisma.section.findUnique({

    where: {
      id: Number(id),
    },

    include: {

      officers: true,

      department: true,

    },

  });



  if (!section) {

    return (

      <div className="p-6 font-bold text-slate-600">
        ไม่พบข้อมูล
      </div>

    );

  }





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
            🏢 {section.name}
          </h1>



          <p
            className="
              mt-2
              text-xl
              font-semibold
              !text-slate-200
            "
          >
            กลุ่ม:
            {" "}
            {section.department?.name ?? "-"}
          </p>


        </div>



        <Link

          href={`/departments/${section.departmentId}`}

          className="
            rounded-xl
            bg-emerald-600
            px-5
            py-3
            text-lg
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:bg-emerald-700
          "

        >

          ← กลับ

        </Link>



      </div>







      {/* Officer Table */}


      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >


        <div className="overflow-x-auto">


          <table className="min-w-full">


            <thead>


              <tr>


                {[
                  "ชื่อ - นามสกุล",
                  "ตำแหน่ง",
                ].map((title)=>(


                  <th
                    key={title}
                    className="
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-5
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    {title}
                  </th>


                ))}


              </tr>


            </thead>





            <tbody>


              {section.officers.length === 0 ? (


                <tr>

                  <td
                    colSpan={2}
                    className="
                      py-12
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ยังไม่มีเจ้าหน้าที่
                  </td>


                </tr>



              ) : (


                section.officers.map((officer)=>(


                  <tr
                    key={officer.id}
                    className="
                      border-b
                      border-slate-200
                      hover:bg-blue-50
                      transition
                    "
                  >



                    <td
                      className="
                        px-5
                        py-3
                        font-bold
                        text-slate-800
                      "
                    >

                      {officer.firstName}{" "}
                      {officer.lastName}

                    </td>





                    <td
                      className="
                        px-5
                        py-3
                        font-bold
                        text-slate-800
                      "
                    >

                      {officer.position}

                    </td>



                  </tr>


                ))


              )}



            </tbody>


          </table>


        </div>


      </div>




    </div>


  );

}