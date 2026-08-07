import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";


type Props = {
  params: Promise<{
    id:string;
  }>;
};



export default async function CreateOfficerPage({
  params,
}: Props) {


  const { id } = await params;



  const section = await prisma.section.findUnique({

    where:{
      id:Number(id),
    },

    include:{
      department:true,
    },

  });



  if(!section){

    redirect("/departments");

  }



  const departmentId = section.departmentId;






  async function createOfficer(
    formData:FormData
  ){

    "use server";



    const firstName =
      formData.get("firstName") as string;


    const lastName =
      formData.get("lastName") as string;


    const position =
      formData.get("position") as string;


    const type =
      formData.get("type") as any;




    await prisma.officer.create({

      data:{

        firstName,

        lastName,

        position,

        type,

        sectionId:Number(id),

      },

    });



    redirect(
      `/departments/${departmentId}`
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
              !text-white
              text-5xl
              font-extrabold
              leading-tight
            "
          >
            👤 เพิ่มรายชื่อเจ้าหน้าที่
          </h1>



          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >

            {section.department.name}
            {" / "}
            {section.name}

          </p>



        </div>






        <Link

          href={`/departments/${departmentId}`}

          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
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








      {/* Form */}

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



        <form

          action={createOfficer}

          className="space-y-6"

        >






          <div
            className="
              grid
              gap-6
              md:grid-cols-2
            "
          >



            {/* ชื่อ */}

            <div>


              <label

                className="
                  mb-2
                  block
                  text-lg
                  font-extrabold
                  text-slate-900
                "

              >

                ชื่อ

              </label>



              <input

                name="firstName"

                required


                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  font-bold
                  text-black
                  outline-none
                  transition
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-200
                "

              />


            </div>







            {/* นามสกุล */}

            <div>


              <label

                className="
                  mb-2
                  block
                  text-lg
                  font-extrabold
                  text-slate-900
                "

              >

                นามสกุล

              </label>



              <input

                name="lastName"

                required


                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  font-bold
                  text-black
                  outline-none
                  transition
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-200
                "

              />


            </div>



          </div>







          {/* ตำแหน่ง */}

          <div>


            <label

              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-900
              "

            >

              ตำแหน่ง

            </label>



            <input

              name="position"

              required


              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                font-bold
                text-black
                outline-none
                transition
                focus:border-emerald-500
                focus:ring-2
                focus:ring-emerald-200
              "

            />


          </div>







          {/* ประเภท */}

          <div>


            <label

              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-900
              "

            >

              ประเภทบุคลากร

            </label>




            <select

              name="type"


              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                font-bold
                text-black
                outline-none
                transition
                focus:border-emerald-500
                focus:ring-2
                focus:ring-emerald-200
              "

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







          <div className="pt-4">


            <button

              type="submit"

              className="
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-8
                py-3
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-105
              "

            >

              บันทึกข้อมูล

            </button>



          </div>





        </form>


      </div>





    </div>

  );

}