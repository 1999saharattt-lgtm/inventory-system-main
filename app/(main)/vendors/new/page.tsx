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
            🏢 เพิ่มผู้จำหน่าย
          </h1>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-slate-200
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
          max-w-xl
          rounded-3xl
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

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-8
            shadow-lg
          "
        >
          <VendorForm />
        </div>

      </div>

    </div>
  );
}
