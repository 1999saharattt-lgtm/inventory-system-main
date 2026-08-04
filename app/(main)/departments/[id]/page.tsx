import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

import { officerTypeText } from "@/lib/officerType";


type Props = {
  params: Promise<{
    id: string;
  }>;
};


const officerPriority = [
  "CIVIL_SERVANT",
  "GOVERNMENT_EMPLOYEE",
  "PERMANENT_EMPLOYEE",
  "OUTSOURCE",
];



export default async function DepartmentDetailPage({
  params,
}: Props) {


  const { id } = await params;



  const department = await prisma.department.findUnique({

    where: {
      id: Number(id),
    },


    include: {

      officers: {
        orderBy: {
          firstName: "asc",
        },
      },


      sections: {

        include: {

          officers: {

            orderBy: {
              firstName: "asc",
            },

          },

        },

      },

    },

  });



  if (!department) {

    notFound();

  }





  function sortOfficers(officers: any[]) {

    return [...officers].sort((a, b) => {


      const aHead =
        a.position.includes("หัวหน้ากลุ่ม")
          ? 0
          : 1;


      const bHead =
        b.position.includes("หัวหน้ากลุ่ม")
          ? 0
          : 1;



      if (aHead !== bHead) {

        return aHead - bHead;

      }





      const aType =
        officerPriority.indexOf(a.type);


      const bType =
        officerPriority.indexOf(b.type);



      if (aType !== bType) {

        return aType - bType;

      }



      return a.firstName.localeCompare(
        b.firstName,
        "th"
      );


    });

  }







  function OfficerTable({
  officers,
}: {
  officers: any[];
}) {

  return (

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

        <table
          className="
            min-w-full
            border-collapse
          "
        >

          <thead>

            <tr>

              {[
                "ชื่อ - นามสกุล",
                "ตำแหน่ง",
                "ประเภทบุคลากร",
                "จัดการ",
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


            {sortOfficers(officers).map(
              (officer:any)=>(


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



                <td
                  className="
                    px-5
                    py-3
                    text-center
                  "
                >

                  <span
                    className="
                      rounded-lg
                      bg-emerald-100
                      px-3
                      py-1
                      font-bold
                      text-emerald-700
                    "
                  >
                    {
                      officerTypeText(
                        officer.type
                      )
                    }
                  </span>

                </td>



                <td
                  className="
                    px-5
                    py-3
                  "
                >

                  <div
                    className="
                      flex
                      justify-center
                      gap-2
                    "
                  >

                    <Link
                      href={`/officers/${officer.id}/edit`}
                      className="
                        rounded-lg
                        bg-slate-800
                        px-4
                        py-2
                        font-extrabold
                        text-white
                        shadow
                        transition
                        hover:bg-slate-700
                      "
                    >
                      แก้ไข
                    </Link>



                    <Link
                      href={`/officers/${officer.id}/delete`}
                      className="
                        rounded-lg
                        bg-red-600
                        px-4
                        py-2
                        font-extrabold
                        text-white
                        shadow
                        transition
                        hover:bg-red-700
                      "
                    >
                      ลบ
                    </Link>


                  </div>

                </td>


              </tr>


            ))}


          </tbody>


        </table>


      </div>


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
            🏢 {department.name}
          </h1>


          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            รายละเอียดหน่วยงานและรายชื่อเจ้าหน้าที่
          </p>


        </div>




        <Link
          href="/departments"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            text-lg
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          ← กลับ
        </Link>



      </div>







      {department.sections.length === 0 ? (



        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-xl
          "
        >


          <div
            className="
              mb-6
              flex
              items-center
              justify-between
            "
          >


            <div>


              <h2
                className="
                  text-3xl
                  font-extrabold
                  text-slate-800
                "
              >
                รายชื่อเจ้าหน้าที่
              </h2>


              <p
                className="
                  mt-2
                  text-xl
                  font-semibold
                  text-slate-500
                "
              >
                จำนวนเจ้าหน้าที่ {department.officers.length} คน
              </p>


            </div>




            <Link
              href={`/departments/${department.id}/officers/create`}
              className="
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-5
                py-3
                text-lg
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-105
              "
            >
              + เพิ่มรายชื่อ
            </Link>


          </div>





          {department.officers.length === 0 ? (


            <div
              className="
                rounded-xl
                bg-slate-50
                p-10
                text-center
                text-xl
                font-bold
                text-slate-500
              "
            >
              ยังไม่มีเจ้าหน้าที่
            </div>



          ) : (


            <OfficerTable
              officers={department.officers}
            />


          )}



        </div>




      ) : (




        department.sections.map((section:any)=>(


          <div
            key={section.id}
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-xl
            "
          >



            <div
              className="
                mb-6
                flex
                items-center
                justify-between
              "
            >


              <div>


                <h2
                  className="
                    text-3xl
                    font-extrabold
                    text-slate-800
                  "
                >
                  {section.name}
                </h2>



                <p
                  className="
                    mt-2
                    text-xl
                    font-semibold
                    text-slate-500
                  "
                >
                  จำนวนเจ้าหน้าที่ {section.officers.length} คน
                </p>


              </div>





              <Link
                href={`/sections/${section.id}/officers/create`}
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-600
                  to-green-500
                  px-5
                  py-3
                  text-lg
                  font-extrabold
                  text-white
                  shadow-lg
                  transition
                  hover:scale-105
                "
              >
                + เพิ่มรายชื่อ
              </Link>



            </div>






            {section.officers.length === 0 ? (


              <div
                className="
                  rounded-xl
                  bg-slate-50
                  p-10
                  text-center
                  text-xl
                  font-bold
                  text-slate-500
                "
              >
                ยังไม่มีเจ้าหน้าที่
              </div>



            ) : (



              <OfficerTable
                officers={section.officers}
              />



            )}



          </div>



        ))



      )}



    </div>


  );

}