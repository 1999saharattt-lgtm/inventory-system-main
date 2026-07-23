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
      <div className="p-6 text-white">
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

    <div className="space-y-6 p-6">


      <div className="flex items-center justify-between">

        <h1 className="text-3xl font-bold text-white">
          แก้ไขรายการรับเข้าพัสดุ
        </h1>


        <Link

          href="/receive"

          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"

        >

          ← กลับ

        </Link>


      </div>



      <EditReceiveForm

        receive={receive}

        vendors={vendors}

        materials={materials}

      />


    </div>

  );

}