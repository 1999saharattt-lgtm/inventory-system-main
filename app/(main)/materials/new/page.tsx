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
          from-blue-700
          via-blue-600
          to-cyan-500
          p-7
          text-white
          shadow-xl
        "
      >

        <div>

          <h1
            className="
              text-4xl
              font-extrabold
              tracking-tight
            "
          >
            ➕ เพิ่มรายการพัสดุ
          </h1>


          <p
            className="
              mt-2
              text-xl
              font-bold
              text-blue-100
            "
          >
            เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ
          </p>


        </div>



        <Link
          href="/materials"
          className="
            rounded-xl
            bg-white
            px-6
            py-3
            font-extrabold
            text-blue-700
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
          border-slate-200
          bg-white
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