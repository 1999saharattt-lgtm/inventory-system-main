import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditReceiveForm from "./EditReceiveForm";


interface Props {
  params: Promise<{
    id: string;
  }>;
}



export default async function EditReceivePage({
  params,
}: Props) {


  const { id } = await params;



  const receive = await prisma.receive.findUnique({

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



  if(!receive){

    return (

      <div
        className="
          rounded-2xl
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-6
          text-xl
          font-bold
          text-white
        "
      >

        ไม่พบรายการรับเข้าพัสดุ

      </div>

    );

  }




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





  const vendors = await prisma.vendor.findMany({

    orderBy:{
      name:"asc",
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
          shadow-xl
        "
      >


        <div>


          <h1
            className="
              text-4xl
              font-extrabold
              text-white
            "
          >

            ✏️ แก้ไขรายการรับเข้าพัสดุ

          </h1>



          <p
            className="
              mt-2
              text-lg
              font-semibold
              text-slate-200
            "
          >

            แก้ไขรายละเอียดเอกสารและรายการพัสดุ

          </p>



        </div>





        <Link

          href="/receive"

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


        <EditReceiveForm

          receive={receive}

          vendors={vendors}

          materials={materials}

        />


      </div>




    </div>

  );

}