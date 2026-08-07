import Link from "next/link";
import VendorForm from "./VendorForm";

export default function NewVendorPage() {
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
          px-8
          py-6
          min-h-[140px]
          text-white
          shadow-xl
        "
      >


        <div>


          <h1
            className="
              text-5xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            🏢 เพิ่มผู้จำหน่าย
          </h1>



          <p
            className="
              mt-2
              text-xl
              font-semibold
              !text-slate-200
            "
          >
            เพิ่มข้อมูลผู้จำหน่ายสำหรับใช้ในระบบพัสดุ
          </p>


        </div>




        <Link
          href="/vendors"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
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
          max-w-xl
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-xl
        "
      >

        <VendorForm />

      </div>



    </div>
  );
}