import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditIssueForm from "./EditIssueForm";


type Props = {
  params: Promise<{
    id: string;
  }>;
};



export default async function EditIssuePage({
  params,
}: Props) {


  const { id } = await params;



  const issue = await prisma.issue.findUnique({

    where:{
      id:Number(id),
    },

    include:{
      items:{
        include:{
          material:true,
        },
      },
    },

  });





  if(!issue){

    return (

      <div className="p-6 text-white">

        ไม่พบรายการเบิกจ่าย

      </div>

    );

  }





  const departments =
    await prisma.department.findMany({

      orderBy:{
        name:"asc",
      },

    });





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





  // ดึงล็อตที่ยังเหลืออยู่
  // เรียงวันหมดอายุใกล้หมดก่อน (FEFO)

  const receiveItems =
    await prisma.receiveItem.findMany({

      where:{
        qty:{
          gt:0,
        },
      },

      include:{
        material:true,
      },

      orderBy:[
        {
          expiry:"asc",
        },
      ],

    });





  return (

    <div className="space-y-6 p-6">


      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-900
          to-slate-700
          p-6
          shadow-xl
        "
      >


        <div>


          <div
            className="
              text-lg
              font-extrabold
              text-white
            "
          >
            🖊️ แก้ไขรายการเบิกพัสดุ
          </div>



          <div
            className="
              mt-2
              text-white
              font-bold
            "
          >
            แก้ไขรายละเอียดเอกสารและรายการพัสดุ
          </div>


        </div>




        <Link

          href="/issue"

          className="
            rounded-xl
            bg-emerald-500
            px-6
            py-3
            font-extrab-bold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "

        >

          ← กลับ

        </Link>



      </div>





      <EditIssueForm

        issue={issue}

        departments={departments}

        materials={materials}

        receiveItems={receiveItems}

      />



    </div>

  );

}