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
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          text-white
          shadow-xl
        "
      >

        <div>

          <h1
            className="
              text-3xl
              font-extrabold
            "
          >
            ➕ เพิ่มรายการพัสดุ
          </h1>


          <p
            className="
              mt-2
              text-lg
              font-semibold
              text-slate-300
            "
          >
            เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ
          </p>


        </div>



        <Link
          href="/materials"
          className="
            rounded-xl
            bg-white/10
            px-5
            py-3
            font-extrabold
            text-white
            backdrop-blur
            shadow-lg
            transition
            hover:bg-white/20
          "
        >
          ← กลับ
        </Link>


      </div>




      {/* Form */}

      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          via-slate-800
          to-slate-700
          p-6
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