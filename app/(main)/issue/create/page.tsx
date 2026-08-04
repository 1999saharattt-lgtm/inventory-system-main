import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IssueForm from "./IssueForm";



function getThaiYear() {

  return (
    new Date().getFullYear() + 543
  )
    .toString()
    .slice(-2);

}




async function generateIssueNo() {


  const year = getThaiYear();



  const lastIssue =
    await prisma.issue.findFirst({

      where: {

        documentNo: {

          startsWith: "จ.",

        },

      },


      orderBy: {

        id: "desc",

      },

    });




  let running = 1;





  if(lastIssue?.documentNo){


    const match =
      lastIssue.documentNo.match(
        /จ\.(\d+)\/(\d+)/
      );



    if(match){


      const lastNumber =
        Number(match[1]);


      const lastYear =
        match[2];



      if(lastYear === year){


        running =
          lastNumber + 1;


      }


    }


  }




  return (
    `จ.${running
      .toString()
      .padStart(2,"0")}/${year}`
  );


}







export default async function CreateIssuePage() {



  const materials =
    await prisma.material.findMany({


      orderBy:[

        {
          category:"asc",
        },

        {
          code:"asc",
        },

      ],


    });







  const departments =
    await prisma.department.findMany({


      orderBy:{

        name:"asc",

      },


    });








  const officers =
    await prisma.officer.findMany({


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






  const documentNo =
    await generateIssueNo();








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
          to-cyan-700
          p-6
          shadow-xl
        "
      >





        <div>


          <h1
            className="
              text-5xl
              font-extrabold
              tracking-wide
              !text-white
            "
          >
            📤 บันทึกการเบิกจ่ายพัสดุ
          </h1>





          <p
            className="
              mt-3
              text-xl
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
            to-green-500
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
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
          via-slate-900
          to-slate-800
          p-6
          shadow-xl
        "
      >




        <IssueForm

          departments={departments}

          officers={officers}

          materials={materials}

          documentNo={documentNo}

        />





      </div>







    </div>


  );


}