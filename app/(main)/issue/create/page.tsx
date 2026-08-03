import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IssueForm from "./IssueForm";


export default async function CreateIssuePage() {


  const materials = await prisma.material.findMany({

    orderBy:[
      {
        category:"asc",
      },
      {
        code:"asc",
      },
    ],

  });




  const departments = await prisma.department.findMany({

    orderBy:{
      name:"asc",
    },

  });





  const officers = await prisma.officer.findMany({

    include:{
      section:true,
    },

    orderBy:[
      {
        firstName:"asc",
      },
      {
        lastName:"asc",
      },
    ],

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
          shadow-xl
        "
      >



        <div>


          <h1
            className="
              text-4xl
              font-extrabold
              !text-white
            "
          >
            📤 บันทึกการเบิกจ่ายพัสดุ
          </h1>




          <p
            className="
              mt-2
              text-lg
              font-semibold
              !text-slate-200
            "
          >
            เพิ่มรายการเบิกจ่ายพัสดุออกจากระบบ
          </p>



        </div>






        <Link
          href="/issue"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            via-green-500
            to-emerald-500
            px-6
            py-3
            text-lg
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
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-6
          shadow-xl
        "
      >


        <IssueForm

          departments={departments}

          officers={officers}

          materials={materials}

        />


      </div>





    </div>

  );

}