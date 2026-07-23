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
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-slate-800
              "
            >
              เพิ่มรายการพัสดุ
            </h1>

            <p className="mt-2 text-slate-600">
              เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ
            </p>
          </div>

          <Link
            href="/materials"
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

      {/* Form Card */}

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
        <MaterialForm
          vendors={vendors}
          materialMasters={materialMasters}
        />
      </div>
    </div>
  );
}