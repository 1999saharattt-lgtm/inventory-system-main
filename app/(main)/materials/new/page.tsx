import Link from "next/link";
import MaterialForm from "./MaterialForm";
import { prisma } from "@/lib/prisma";

export default async function NewMaterialPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const materialMasters = await prisma.materialMaster.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      category: true,
      name: true,
      unit: true,
    },
  });

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Header */}

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
              sm:text-5xl
            "
          >
            ➕ เพิ่มรายการพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-xl
            "
          >
            เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ
          </p>
        </div>

        <Link
          href="/materials"
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
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* Form */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:rounded-3xl
          sm:p-8
        "
      >
        <MaterialForm
          vendors={vendors}
          materialMasters={materialMasters}
        />
      </div>
    </div>
  );
}