import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AssetsPage() {
  const departments = await prisma.department.findMany({
    orderBy: {
      id: "asc",
    },
  });

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
            🗄️ ทะเบียนคุมครุภัณฑ์
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
            เลือกกลุ่มงานเพื่อดูข้อมูลและทะเบียนครุภัณฑ์
          </p>
        </div>
      </div>

      {/* =====================================================
          Department Cards
      ===================================================== */}

      <div
        className="
          grid
          gap-5
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {departments.map((department: any) => (
          <Link
            key={department.id}
            href={`/assets/${department.id}`}
            className="
              group
              overflow-hidden
              rounded-2xl
              border
              border-slate-300
              bg-white
              shadow-lg
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-2xl
            "
          >
            {/* Top Bar */}

            <div
              className="
                h-2
                bg-gradient-to-r
                from-slate-700
                to-slate-900
              "
            />

            <div
              className="
                flex
                min-h-[230px]
                flex-col
                items-center
                gap-5
                p-6
                text-center
              "
            >
              {/* Icon */}

              <div
                className="
                  flex
                  h-16
                  w-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-100
                  text-4xl
                  shadow-md
                  transition
                  duration-300
                  group-hover:scale-110
                "
              >
                🏢
              </div>

              {/* Name */}

              <div>
                <h2
                  className="
                    mt-3
                    text-xl
                    font-extrabold
                    text-slate-900
                  "
                >
                  {department.name}
                </h2>

                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                    text-slate-600
                  "
                >
                  คลิกเพื่อดูทะเบียนครุภัณฑ์
                </p>
              </div>

              {/* Button */}

              <span
                className="
                  mt-3
                  rounded-xl
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-950
                  px-8
                  py-3
                  text-lg
                  font-extrabold
                  text-white
                  shadow-lg
                  transition
                  group-hover:scale-105
                "
              >
                เปิด
              </span>
            </div>
          </Link>
        ))}

        {departments.length === 0 && (
          <div
            className="
              col-span-full
              rounded-2xl
              border
              border-slate-300
              bg-white
              p-12
              text-center
              text-xl
              font-semibold
              text-slate-500
              shadow-lg
            "
          >
            ยังไม่มีข้อมูลกลุ่มงาน
          </div>
        )}
      </div>
    </div>
  );
}