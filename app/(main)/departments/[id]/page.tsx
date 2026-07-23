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
          rounded-xl
          border
          border-slate-300
          bg-white
        "
      >

        <div className="overflow-x-auto">


          <table className="
            min-w-full
            border-collapse
            text-xl
            font-bold
          ">


            <thead className="bg-slate-200">

              <tr className="
                text-xl
                font-extrabold
                text-slate-800
              ">


                <th className="
                  border
                  border-slate-300
                  px-4
                  py-3
                ">
                  ชื่อ - นามสกุล
                </th>


                <th className="
                  border
                  border-slate-300
                  px-4
                  py-3
                ">
                  ตำแหน่ง
                </th>


                <th className="
                  border
                  border-slate-300
                  px-4
                  py-3
                  text-center
                ">
                  ประเภทบุคลากร
                </th>


                <th className="
                  border
                  border-slate-300
                  px-4
                  py-3
                  text-center
                ">
                  จัดการ
                </th>


              </tr>

            </thead>




            <tbody>


              {sortOfficers(officers).map((officer) => (


                <tr
                  key={officer.id}
                  className="
                    odd:bg-white
                    even:bg-slate-50
                    hover:bg-emerald-50
                    transition
                  "
                >



                  <td className="
                    border
                    border-slate-300
                    px-4
                    py-3
                    text-xl
                    font-bold
                  ">
                    {officer.firstName} {officer.lastName}
                  </td>




                  <td className="
                    border
                    border-slate-300
                    px-4
                    py-3
                    text-xl
                    font-bold
                  ">
                    {officer.position}
                  </td>




                  <td className="
                    border
                    border-slate-300
                    px-4
                    py-3
                    text-center
                  ">


                    <span className="
                      inline-block
                      rounded-full
                      bg-emerald-100
                      px-4
                      py-1
                      text-xl
                      font-bold
                      text-emerald-700
                    ">
                      {officerTypeText(officer.type)}
                    </span>


                  </td>
                                    <td className="
                    border
                    border-slate-300
                    px-4
                    py-3
                    text-center
                  ">


                    <div className="
                      flex
                      justify-center
                      gap-2
                    ">


                      <Link
                        href={`/officers/${officer.id}/edit`}
                        className="
                          rounded-lg
                          bg-amber-500
                          px-4
                          py-2
                          text-xl
                          font-bold
                          text-white
                          hover:bg-amber-600
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
                          text-xl
                          font-bold
                          text-white
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

    <div className="space-y-8">



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


        <div className="flex items-center justify-between">


          <div>


            <h1
              className="
                text-4xl
                font-extrabold
                text-slate-800
              "
            >
              {department.name}
            </h1>


            <p className="
              mt-2
              text-xl
              font-bold
              text-slate-600
            ">
              รายละเอียดหน่วยงานและรายชื่อเจ้าหน้าที่
            </p>


          </div>



          <Link
            href="/departments"
            className="
              rounded-lg
              bg-slate-200
              px-5
              py-3
              text-xl
              font-bold
              text-slate-700
              hover:bg-slate-300
            "
          >
            ← กลับ
          </Link>


        </div>

      </div>



      {
        department.sections.length === 0 ? (


          <div
            className="
              rounded-xl
              border
              border-slate-300
              bg-slate-100
              p-6
            "
          >


            <div className="
              mb-6
              flex
              items-center
              justify-between
            ">


              <div>


                <h2
                  className="
                    text-2xl
                    font-extrabold
                    text-slate-800
                  "
                >
                  รายชื่อเจ้าหน้าที่
                </h2>


                <p className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-600
                ">
                  จำนวนเจ้าหน้าที่ {department.officers.length} คน
                </p>


              </div>



              <Link
                href={`/departments/${department.id}/officers/create`}
                className="
                  rounded-lg
                  bg-blue-700
                  px-5
                  py-3
                  text-xl
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-800
                "
              >
                + เพิ่มรายชื่อ
              </Link>


            </div>



            {
              department.officers.length === 0

              ?

              <div
                className="
                  rounded-lg
                  bg-white
                  p-8
                  text-center
                  text-xl
                  font-bold
                  text-slate-500
                "
              >
                ยังไม่มีเจ้าหน้าที่
              </div>

              :

              <OfficerTable
                officers={department.officers}
              />

            }


          </div>


        )


        :


        department.sections.map((section)=>(


          <div
            key={section.id}
            className="
              rounded-xl
              border
              border-slate-300
              bg-slate-100
              p-6
            "
          >


            <div className="
              mb-6
              flex
              items-center
              justify-between
            ">


              <div>


                <h2
                  className="
                    text-2xl
                    font-extrabold
                    text-slate-800
                  "
                >
                  {section.name}
                </h2>


                <p className="
                  text-xl
                  font-bold
                  text-slate-600
                ">
                  จำนวนเจ้าหน้าที่ {section.officers.length} คน
                </p>


              </div>



              <Link
                href={`/sections/${section.id}/officers/create`}
                className="
                  rounded-lg
                  bg-blue-700
                  px-5
                  py-3
                  text-xl
                  font-bold
                  text-white
                  hover:bg-blue-800
                "
              >
                + เพิ่มรายชื่อ
              </Link>


            </div>




            {
              section.officers.length === 0

              ?

              <div
                className="
                  rounded-lg
                  bg-white
                  p-8
                  text-center
                  text-xl
                  font-bold
                  text-slate-500
                "
              >
                ยังไม่มีเจ้าหน้าที่
              </div>

              :

              <OfficerTable
                officers={section.officers}
              />

            }


          </div>


        ))


      }



    </div>

  );

}