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

  const department = await prisma.department.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!department) {
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
        departmentId: Number(id),
      },
    });

    redirect(`/departments/${id}`);
  }

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">

      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-4
          py-5
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0 flex-1">

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-4xl
            "
          >
            👤 เพิ่มรายชื่อเจ้าหน้าที่
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-lg
            "
          >
            หน่วยงาน : {department.name}
          </p>

        </div>

        <Link
          href={`/departments/${id}`}
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <div
        className="
          w-full
          max-w-2xl
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <form
          action={createOfficer}
          className="space-y-6"
        >

          {[
            {
              label: "ชื่อ",
              name: "firstName",
            },
            {
              label: "นามสกุล",
              name: "lastName",
            },
            {
              label: "ตำแหน่ง",
              name: "position",
            },
          ].map((field) => (
            <div key={field.name}>

              <label
                className="
                  mb-2
                  block
                  text-base
                  font-bold
                  text-slate-700
                  sm:text-lg
                "
              >
                {field.label}
              </label>

              <input
                name={field.name}
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-base
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  sm:text-lg
                "
              />

            </div>
          ))}

          <div>

            <label
              className="
                mb-2
                block
                text-base
                font-bold
                text-slate-700
                sm:text-lg
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
                text-base
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
                sm:text-lg
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
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-8
              py-3
              text-base
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              sm:w-auto
              sm:text-lg
            "
          >
            บันทึกข้อมูล
          </button>

        </form>
      </div>

    </div>
  );
}