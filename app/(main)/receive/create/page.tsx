```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReceiveForm from "./ReceiveForm";



function getThaiYear() {

  return String(
    new Date().getFullYear() + 543
  ).slice(-2);

}



async function generateReceiveNo() {

  const year = getThaiYear();

  const receives =
    await prisma.receive.findMany({

      where: {

        documentNo: {

          startsWith: "ร.",

        },

      },

      select: {

        documentNo: true,

      },

    });



  let running = 1;



  for (const receive of receives) {

    const match =

      receive.documentNo.match(

        /ร\.(\d+)\/(\d+)/

      );



    if(match){

      const lastNumber =

        Number(match[1]);



      const lastYear =

        match[2];



      if(lastYear === year){

        if(lastNumber >= running){

          running = lastNumber + 1;

        }

      }

    }

  }



  return (

    `ร.${String(running).padStart(2,"0")}/${year}`

  );

}



export default async function CreateReceivePage(){



  const [

    materials,

    vendors,

    documentNo,

  ] = await Promise.all([



    prisma.material.findMany({

      orderBy:[

        {

          category:"asc",

        },

        {

          code:"asc",

        },

      ],

    }),



    prisma.vendor.findMany({

      orderBy:{

        name:"asc",

      },

    }),



    generateReceiveNo(),

  ]);



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
              leading-tight
              tracking-wide
              !text-white
            "
          >

            📥 บันทึกการรับเข้าพัสดุ

          </h1>



          <p
            className="
              mt-3
              text-xl
              font-semibold
              !text-slate-200
            "
          >

            เพิ่มรายการรับเข้าพัสดุเข้าสู่ระบบ

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

        <ReceiveForm

          vendors={vendors}

          materials={materials}

          documentNo={documentNo}

        />

      </div>



    </div>

  );

}
