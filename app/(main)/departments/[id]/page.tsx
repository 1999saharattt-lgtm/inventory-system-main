import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";


type Props = {
  params: Promise<{
    id: string;
  }>;
};



export default async function EditOfficerPage({
  params,
}: Props) {


  const { id } = await params;



  const officer = await prisma.officer.findUnique({

    where: {
      id: Number(id),
    },

    include: {
      department: true,
      section: true,
    },

  });



  if (!officer) {

    redirect("/departments");

  }




  async function updateOfficer(formData: FormData) {

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
        id:Number(id),
      },

      data:{

        firstName,

        lastName,

        position,

        type,

      },

    });



    if (!officer) {
  redirect("/departments");
}


if (officer.departmentId) {
  redirect(
    `/departments/${officer.departmentId}`
  );
}


    redirect("/departments");

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
            ✏️ แก้ไขข้อมูลเจ้าหน้าที่
          </h1>



          <p
            className="
              mt-2
              text-xl
              font-semibold
              !text-slate-200
            "
          >

            {
              officer.department?.name ??
              "-"
            }

            {
              officer.section &&
              ` / ${officer.section.name}`
            }

          </p>


        </div>




        <Link

          href={
            officer.departmentId
              ? `/departments/${officer.departmentId}`
              : "/departments"
          }

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








      {/* Form */}


      <div
        className="
          max-w-2xl
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-xl
        "
      >



        <form
          action={updateOfficer}
          className="space-y-6"
        >




          <div>


            <label
              className="
                mb-2
                block
                text-lg
                font-bold
                text-slate-700
              "
            >
              ชื่อ
            </label>


            <input

              name="firstName"

              defaultValue={officer.firstName}

              required

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "

            />


          </div>







          <div>


            <label
              className="
                mb-2
                block
                text-lg
                font-bold
                text-slate-700
              "
            >
              นามสกุล
            </label>



            <input

              name="lastName"

              defaultValue={officer.lastName}

              required

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "

            />


          </div>







          <div>


            <label
              className="
                mb-2
                block
                text-lg
                font-bold
                text-slate-700
              "
            >
              ตำแหน่ง
            </label>




            <input

              name="position"

              defaultValue={officer.position}

              required

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "

            />


          </div>








          <div>


            <label
              className="
                mb-2
                block
                text-lg
                font-bold
                text-slate-700
              "
            >
              ประเภทบุคลากร
            </label>




            <select

              name="type"

              defaultValue={officer.type}

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
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

            type="submit"

            className="
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-8
              py-3
              text-lg
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
            "

          >

            บันทึกการแก้ไข

          </button>




        </form>



      </div>



    </div>


  );

}