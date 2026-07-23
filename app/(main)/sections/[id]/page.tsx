import { prisma } from "@/lib/prisma";
import Link from "next/link";


type Props = {

  params: Promise<{

    id:string;

  }>;

};



export default async function SectionDetailPage({

  params,

}:Props){


  const {id}=await params;



  const section = await prisma.section.findUnique({

    where:{

      id:Number(id),

    },


    include:{


      officers:true,


      department:true,


    },


  });




  if(!section){

    return (

      <div>

        ไม่พบข้อมูล

      </div>

    );

  }




  return (

    <div className="p-6">


      <h1 className="text-2xl font-bold">

        {section.name}

      </h1>



      <p className="text-gray-600 mt-2">

        กลุ่ม:
        {" "}
        {section.department.name}

      </p>




      <hr className="my-5"/>





      <h2 className="text-xl font-semibold mb-3">

        เจ้าหน้าที่

      </h2>




      {section.officers.length === 0 ? (

        <p>

          ยังไม่มีเจ้าหน้าที่

        </p>


      ):(


        <div className="space-y-3">


          {section.officers.map((officer)=>(


            <div

              key={officer.id}

              className="border rounded p-4"

            >


              <div className="font-bold">

                {officer.name}

              </div>



              <div>

                ตำแหน่ง:
                {" "}
                {officer.position}

              </div>



            </div>


          ))}



        </div>


      )}





      <div className="mt-5">


        <Link

          href={`/departments/${section.departmentId}`}

          className="text-blue-600"

        >

          ← กลับไปกลุ่มงาน

        </Link>


      </div>



    </div>


  );


}