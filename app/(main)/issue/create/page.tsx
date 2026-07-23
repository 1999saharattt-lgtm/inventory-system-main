import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IssueForm from "./IssueForm";


export default async function CreateIssuePage() {


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



  const departments = await prisma.department.findMany({

    orderBy: {
      name: "asc",
    },

  });



  const officers = await prisma.officer.findMany({

    include: {
      section: true,
    },

    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],

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
            บันทึกการเบิกจ่ายพัสดุ
          </h1>


          <p className="mt-2 text-slate-600">
            เพิ่มรายการเบิกจ่ายพัสดุออกจากระบบ
          </p>


        </div>




        <Link
          href="/issue"
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

      <IssueForm
        departments={departments}
        officers={officers}
        materials={materials}
      />



    </div>

  );

}