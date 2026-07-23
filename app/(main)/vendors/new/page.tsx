import Link from "next/link";
import VendorForm from "./VendorForm";

export default function NewVendorPage() {
  return (
    <div className="space-y-6">

      {/* Header */}

      <div
        className="
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
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
              เพิ่มผู้จำหน่าย
            </h1>


            <p className="mt-2 text-slate-600">
              เพิ่มข้อมูลผู้จำหน่ายสำหรับใช้ในระบบพัสดุ
            </p>

          </div>



          <Link
            href="/vendors"
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


      </div>




      {/* Form */}

      <div
        className="
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >

        <VendorForm />

      </div>


    </div>
  );
}