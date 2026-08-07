import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
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
  });

  if (!officer) {
    notFound();
  }

  // เก็บไว้ใช้ภายหลัง
  const sectionId = officer.sectionId;

  async function updateOfficer(formData: FormData) {
    "use server";

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const position = formData.get("position") as string;
    const type = formData.get("type") as any;

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

    redirect(`/departments/${sectionId}`);
  }

  return (
  <div className="space-y-6">

    {/* Header */}
    <div
      className="
        flex
        items-center
        justify-between
        rounded-3xl
        bg-gradient-to-r
        from-slate-950
        via-slate-800
        to-slate-700
        p-7
        text-white
        shadow-xl
      "
    >

      <div>

        <h1
          className="
            text-5xl
            font-extrabold
            !text-white
          "
        >
          ✏️ แก้ไขข้อมูลเจ้าหน้าที่
        </h1>

        <p
          className="
            mt-2
            text-xl
            font-bold
            text-slate-200
          "
        >
          ปรับปรุงข้อมูลรายชื่อและประเภทบุคลากร
        </p>

      </div>


      <Link
        href={`/departments/${sectionId}`}
        className="
          rounded-xl
          bg-gradient-to-r
          from-emerald-600
          to-green-500
          px-6
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
        w-full
        rounded-3xl
        border
        border-slate-700
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-800
        p-8
        shadow-2xl
      "
    >


      <form
        action={updateOfficer}
        className="space-y-6"
      >


        <div
          className="
            grid
            gap-6
            md:grid-cols-2
          "
        >


          <div>

            <label className="mb-2 block text-lg font-extrabold text-white">
              ชื่อ
            </label>

            <input
              name="firstName"
              defaultValue={officer.firstName}
              className="
                w-full
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                p-3
                font-bold
                text-white
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-300
              "
            />

          </div>



          <div>

            <label className="mb-2 block text-lg font-extrabold text-white">
              นามสกุล
            </label>

            <input
              name="lastName"
              defaultValue={officer.lastName}
              className="
                w-full
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                p-3
                font-bold
                text-white
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-300
              "
            />

          </div>


        </div>




        <div>

          <label className="mb-2 block text-lg font-extrabold text-white">
            ตำแหน่ง
          </label>

          <input
            name="position"
            defaultValue={officer.position}
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-300
            "
          />

        </div>




        <div>

          <label className="mb-2 block text-lg font-extrabold text-white">
            ประเภทบุคลากร
          </label>

          <select
            name="type"
            defaultValue={officer.type}
            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-300
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
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          💾 บันทึกการแก้ไข
        </button>


      </form>


    </div>


  </div>
);