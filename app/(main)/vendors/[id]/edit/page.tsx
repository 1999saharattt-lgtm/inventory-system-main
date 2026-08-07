import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditVendorForm from "./EditVendorForm";


type Props = {
  params: Promise<{
    id:string;
  }>;
};



export default async function EditVendorPage({
  params,
}: Props) {


  const { id } = await params;



  const vendor = await prisma.vendor.findUnique({

    where:{
      id:Number(id),
    },

  });



  if(!vendor){

    notFound();

  }



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
          to-slate-700
          p-7
          text-white
          shadow-xl
        "

      >



        <div>


          <h1

            className="
              text-5xl
              font-extrabold
              !text-white
            "

          >

            ✏️ แก้ไขข้อมูลผู้จำหน่าย

          </h1>



          <p

            className="
              mt-2
              text-xl
              font-bold
              text-slate-200
            "

          >

            แก้ไขรายละเอียดข้อมูลผู้จำหน่ายในระบบพัสดุ

          </p>



        </div>







        <a

          href="/vendors"

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

        </a>



      </div>









      {/* Form */}

      <div

        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-xl
        "

      >



        <EditVendorForm

          vendor={vendor}

        />



      </div>





    </div>

  );

}