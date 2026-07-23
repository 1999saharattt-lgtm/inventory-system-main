import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReceiveForm from "./ReceiveForm";


export default async function CreateReceivePage() {


  const materials = await prisma.material.findMany({

    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],

  });



  const vendors = await prisma.vendor.findMany({

    orderBy: {
      name: "asc",
    },

  });




  return (

    <div className="space-y-8">


      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
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
            บันทึกการรับเข้าพัสดุ
          </h1>


          <p className="mt-2 text-slate-600">
            เพิ่มรายการรับเข้าพัสดุเข้าสู่ระบบ
          </p>


        </div>




        <Link
          href="/receive"
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





      {/* Form */}

      <ReceiveForm
        vendors={vendors}
        materials={materials}
      />



    </div>

  );

}