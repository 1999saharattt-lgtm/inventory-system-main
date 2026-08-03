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
          p-8
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
            ➕ เพิ่มรายการพัสดุ
          </h1>

          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ
          </p>
        </div>

        <Link
          href="/materials"
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
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-8
          shadow-xl
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