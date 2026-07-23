import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";


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

  });



  if (!officer) {

    notFound();

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



    const sectionId =
      formData.get("sectionId") as string;



    await prisma.officer.update({

      where: {
        id: Number(id),
      },

      data: {

        firstName,

        lastName,

        position,

        type,

      },

    });



    redirect(
      `/departments/${sectionId}`
    );

  }





  return (

    <div className="max-w-xl p-6">


      <h1 className="mb-5 text-2xl font-bold">

        แก้ไขข้อมูลเจ้าหน้าที่

      </h1>




      <form

        action={updateOfficer}

        className="space-y-4"

      >


        <input

          type="hidden"

          name="sectionId"

          value={officer.sectionId ?? 0}

        />



        <div>

          <label>
            ชื่อ
          </label>

          <input

            name="firstName"

            defaultValue={officer.firstName}

            className="w-full rounded border p-2"

          />

        </div>





        <div>

          <label>
            นามสกุล
          </label>

          <input

            name="lastName"

            defaultValue={officer.lastName}

            className="w-full rounded border p-2"

          />

        </div>





        <div>

          <label>
            ตำแหน่ง
          </label>

          <input

            name="position"

            defaultValue={officer.position}

            className="w-full rounded border p-2"

          />

        </div>





        <div>

          <label>
            ระดับ
          </label>


          <select

            name="type"

            defaultValue={officer.type}

            className="w-full rounded border p-2"

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

          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"

        >

          บันทึกการแก้ไข

        </button>



      </form>



    </div>

  );

}