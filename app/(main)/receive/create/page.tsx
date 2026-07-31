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
          to-cyan-700
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
            📥 บันทึกการรับเข้าพัสดุ
          </h1>



          <p
            className="
              mt-2
              text-lg
              font-semibold
              text-slate-200
            "
          >
            เพิ่มรายการรับเข้าพัสดุเข้าสู่ระบบ
          </p>


        </div>





        <Link
          href="/receive"
          className="
            rounded-xl
            bg-white/10
            px-6
            py-3
            font-extrabold
            text-white
            backdrop-blur
            shadow-lg
            transition
            hover:bg-white/20
            hover:-translate-y-1
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
          p-6
          shadow-xl
        "
      >


        <ReceiveForm
          vendors={vendors}
          materials={materials}
        />


      </div>



    </div>

  );

}