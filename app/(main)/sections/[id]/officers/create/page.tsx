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

  const departmentId = section.departmentId;

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

    redirect(
      `/departments/${departmentId}`
    );
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
            {section.department.name}
            {" / "}
            {section.name}
          </p>

        </div>

        <Link
          href={`/departments/${departmentId}`}
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
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-7
        "
      >
        <form
          action={createOfficer}
          className="space-y-6"
        >
          {/* ชื่อ + นามสกุล */}

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
                  text-base
                  font-extrabold
                  text-white
                  sm:text-lg
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
                  text-base
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-cyan-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-cyan-400/30
                  sm:text-lg
                "
              />
            </div>

            {/* นามสกุล */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-base
                  font-extrabold
                  text-white
                  sm:text-lg
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
                  text-base
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-cyan-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-cyan-400/30
                  sm:text-lg
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
                text-base
                font-extrabold
                text-white
                sm:text-lg
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
                text-base
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-cyan-400
                focus:outline-none
                focus:ring-2
                focus:ring-cyan-400/30
                sm:text-lg
              "
            />
          </div>

          {/* ประเภท */}

          <div>
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-white
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
                focus:border-cyan-400
                focus:outline-none
                focus:ring-2
                focus:ring-cyan-400/30
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

          {/* ปุ่ม */}

          <div className="pt-4">
            <button
              type="submit"
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
              💾 บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}