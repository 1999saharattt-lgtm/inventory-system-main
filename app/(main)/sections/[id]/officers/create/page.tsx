import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";


type Props = {
  params: Promise<{
    id: string;
  }>;
};



export default async function CreateOfficerPage({
  params,
}: Props) {


  const { id } = await params;



  const section = await prisma.section.findUnique({

    where: {
      id: Number(id),
    },

    include: {
      department: true,
    },

  });




  if (!section) {

    redirect("/departments");

  }




  async function createOfficer(formData: FormData) {

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

      data: {

        firstName,

        lastName,

        position,

        type,

        sectionId: Number(id),

      },

    });



    redirect(`/departments/${section.departmentId}`);

  }





  return (

    <div className="space-y-6">


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


        <div className="flex items-center justify-between">


          <div>


            <h1
              className="
                text-3xl
                font-bold
                text-slate-800
              "
            >
              เพิ่มรายชื่อเจ้าหน้าที่
            </h1>


            <p className="mt-2 text-slate-600">

              {section.department.name}
              {" / "}
              {section.name}

            </p>


          </div>



          <Link

            href={`/departments/${section.departmentId}`}

            className="
              rounded-lg
              bg-slate-200
              px-5
              py-3
              font-semibold
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-300
            "

          >

            ← กลับ

          </Link>



        </div>


      </div>





      {/* Form */}

      <div
        className="
          max-w-xl
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >



        <form
          action={createOfficer}
          className="space-y-5"
        >



          <div>


            <label className="mb-1 block font-medium text-slate-700">

              ชื่อ

            </label>


            <input

              name="firstName"

              required

              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-slate-900
                outline-none
                focus:border-blue-500
              "

            />


          </div>






          <div>


            <label className="mb-1 block font-medium text-slate-700">

              นามสกุล

            </label>


            <input

              name="lastName"

              required

              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-slate-900
                outline-none
                focus:border-blue-500
              "

            />


          </div>







          <div>


            <label className="mb-1 block font-medium text-slate-700">

              ตำแหน่ง

            </label>


            <input

              name="position"

              required

              placeholder=""

              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-slate-900
                outline-none
                focus:border-blue-500
              "

            />


          </div>







          <div>


            <label className="mb-1 block font-medium text-slate-700">

              ประเภทบุคลากร

            </label>



            <select

              name="type"

              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-slate-900
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






          <button

            className="
              rounded-lg
              bg-green-700
              px-6
              py-3
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-green-800
            "

          >

            บันทึกข้อมูล

          </button>





        </form>


      </div>


    </div>

  );

}