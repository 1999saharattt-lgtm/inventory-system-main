import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";


type Props = {
  params: Promise<{
    id:string;
  }>;
};



export default async function EditOfficerPage({
  params,
}:Props){


  const {id} = await params;



  const officer = await prisma.officer.findUnique({

    where:{
      id:Number(id)
    }

  });




  if(!officer){

    notFound();

  }






  async function updateOfficer(formData:FormData){


    "use server";



    const firstName =
      formData.get("firstName") as string;


    const lastName =
      formData.get("lastName") as string;



    const position =
      formData.get("position") as string;



    const type =
      formData.get("type") as any;





    await prisma.officer.update({


      where:{
        id:Number(id)
      },


      data:{


        firstName,

        lastName,

        position,

        type,


      }


    });





    redirect(
      `/departments/${officer.sectionId}`
    );


  }





  return (

    <div className="p-6 max-w-xl">


      <h1 className="text-2xl font-bold mb-5">

        แก้ไขข้อมูลเจ้าหน้าที่

      </h1>




      <form
      action={updateOfficer}
      className="space-y-4"
      >




        <div>

          <label>
            ชื่อ
          </label>


          <input

          name="firstName"

          defaultValue={officer.firstName}

          className="border p-2 w-full rounded"

          />

        </div>





        <div>

          <label>
            นามสกุล
          </label>


          <input

          name="lastName"

          defaultValue={officer.lastName}

          className="border p-2 w-full rounded"

          />

        </div>





        <div>

          <label>
            ตำแหน่ง
          </label>


          <input

          name="position"

          defaultValue={officer.position}

          className="border p-2 w-full rounded"

          />

        </div>






        <div>

          <label>
            ระดับ
          </label>


          <select

          name="type"

          defaultValue={officer.type}

          className="border p-2 w-full rounded"

          >


            <option value="CIVIL_SERVANT">
              ข้าราชการ
            </option>


            <option value="GOVERNMENT_EMPLOYEE">
              พนักงานราชการ
            </option>


            <option value="PERMANENT_EMPLOYEE">
              ลูกจ้างประจำ
            </option>


            <option value="OUTSOURCE">
              จ้างเหมาบริการ
            </option>


          </select>


        </div>





        <button

        className="bg-green-600 text-white px-4 py-2 rounded"

        >

          บันทึกการแก้ไข

        </button>



      </form>



    </div>

  );


}