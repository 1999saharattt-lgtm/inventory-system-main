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

    const firstName =
      formData.get("firstName") as string;

    const lastName =
      formData.get("lastName") as string;

    const position =
      formData.get("position") as string;

    const type =
      formData.get("type") as any;

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
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            ✏️ แก้ไขข้อมูลเจ้าหน้าที่
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            ปรับปรุงข้อมูลรายชื่อและประเภทบุคลากร
          </p>
        </div>

        <Link
          href={`/departments/${sectionId}`}
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <div className="flex w-full justify-center py-2 sm:py-4">
        <div className="w-full max-w-4xl">
          <div
            className="
              w-full
              space-y-6
              rounded-3xl
              border
              border-slate-700
              bg-gradient-to-br
              from-slate-950
              via-slate-900
              to-slate-800
              p-6
              text-white
              shadow-2xl
              sm:p-8
            "
          >
            <form
              action={updateOfficer}
              className="space-y-6"
            >
              {/* =====================================================
                  ชื่อ + นามสกุล
              ===================================================== */}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-5
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
                      text-white
                    "
                  >
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
                      focus:outline-none
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
                      text-white
                    "
                  >
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
                      focus:outline-none
                    "
                  />
                </div>
              </div>

              {/* =====================================================
                  ตำแหน่ง
              ===================================================== */}

              <div>
                <label
                  className="
                    mb-2
                    block
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
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
                    focus:outline-none
                  "
                />
              </div>

              {/* =====================================================
                  ประเภทบุคลากร
              ===================================================== */}

              <div>
                <label
                  className="
                    mb-2
                    block
                    text-lg
                    font-extrabold
                    text-white
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
                    border-slate-600
                    bg-slate-800
                    p-3
                    font-bold
                    text-white
                    outline-none
                    transition
                    focus:border-cyan-400
                    focus:outline-none
                  "
                >
                  <option
                    value="CIVIL_SERVANT"
                    className="bg-slate-800 text-white"
                  >
                    ข้าราชการ
                  </option>

                  <option
                    value="GOVERNMENT_EMPLOYEE"
                    className="bg-slate-800 text-white"
                  >
                    พนักงานราชการ
                  </option>

                  <option
                    value="PERMANENT_EMPLOYEE"
                    className="bg-slate-800 text-white"
                  >
                    ลูกจ้างประจำ
                  </option>

                  <option
                    value="OUTSOURCE"
                    className="bg-slate-800 text-white"
                  >
                    จ้างเหมาบริการ
                  </option>
                </select>
              </div>

              {/* =====================================================
                  ปุ่ม
              ===================================================== */}

              <div
                className="
                  flex
                  justify-end
                  gap-3
                  border-t
                  border-slate-700
                  pt-5
                "
              >
                {/* ยกเลิก */}

                <Link
                  href={`/departments/${sectionId}`}
                  className="
                    rounded-xl
                    bg-slate-700
                    px-6
                    py-3
                    font-extrabold
                    text-white
                    shadow-lg
                    transition
                    hover:bg-slate-800
                  "
                >
                  ยกเลิก
                </Link>

                {/* บันทึก */}

                <button
                  type="submit"
                  className="
                    rounded-xl
                    bg-gradient-to-r
                    from-emerald-600
                    to-green-500
                    px-7
                    py-3
                    font-extrabold
                    text-white
                    shadow-lg
                    transition
                    hover:scale-105
                    hover:from-emerald-700
                    hover:to-green-600
                  "
                >
                  💾 บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}