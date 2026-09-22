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

  // =====================================================
  // Receive
  // =====================================================

  const receive = await prisma.receive.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  // =====================================================
  // Not Found
  // =====================================================

  if (!receive) {
    return (
      <div
        className="
          flex
          min-h-[320px]
          w-full
          items-center
          justify-center
          px-4
        "
      >
        <div
          className="
            w-full
            max-w-lg
            rounded-[28px]
            border
            border-slate-200/80
            bg-white/90
            p-6
            text-center
            shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]
            backdrop-blur-2xl
            sm:p-8
          "
        >
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-[20px]
              bg-slate-100
              text-3xl
              shadow-sm
              ring-1
              ring-slate-200
            "
          >
            📦
          </div>

          <h1
            className="
              mt-5
              text-xl
              font-black
              !text-slate-900
              sm:text-2xl
            "
          >
            ไม่พบรายการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              text-sm
              font-semibold
              leading-relaxed
              !text-slate-500
              sm:text-base
            "
          >
            ไม่พบข้อมูลเอกสารรับเข้าที่ต้องการแก้ไข
          </p>

          <Link
            href="/receive"
            className="
              mt-6
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-[16px]
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
              text-sm
              font-extrabold
              !text-white
              shadow-[0_12px_28px_-16px_rgba(5,150,105,0.55)]
              transition-all
              duration-300
              ease-out
              hover:-translate-y-0.5
              hover:from-emerald-700
              hover:to-green-600
              hover:shadow-[0_18px_34px_-18px_rgba(5,150,105,0.6)]
              active:translate-y-0
              active:scale-[0.97]
              sm:text-base
            "
          >
            <span>←</span>
            <span>กลับ</span>
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // Materials
  // =====================================================

  const materials = await prisma.material.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],
  });

  // =====================================================
  // Vendors
  // =====================================================

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        {/* =================================================
            Title
        ================================================= */}

        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            ✏️ แก้ไขรายการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            แก้ไขรายละเอียดเอกสารและรายการพัสดุ
          </p>
        </div>

        {/* =================================================
            Back Button
            มาตรฐานเดียวกันทุกหน้า
        ================================================= */}

        <Link
          href="/receive"
          className="
            inline-flex
            h-11
            shrink-0
            items-center
            justify-center
            gap-2
            whitespace-nowrap
            rounded-[16px]
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            text-sm
            font-extrabold
            !text-white
            shadow-[0_12px_28px_-16px_rgba(5,150,105,0.55)]
            transition-all
            duration-300
            ease-out
            hover:-translate-y-0.5
            hover:from-emerald-700
            hover:to-green-600
            hover:shadow-[0_18px_34px_-18px_rgba(5,150,105,0.6)]
            active:translate-y-0
            active:scale-[0.97]
            sm:px-5
            sm:text-base
          "
        >
          <span
            className="
              transition-transform
              duration-300
              group-hover:-translate-x-0.5
            "
          >
            ←
          </span>

          <span>กลับ</span>
        </Link>
      </div>

      {/* =====================================================
          Form Section
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-white/80
          bg-white/80
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
        "
      >
        {/* =================================================
            Form Header
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
            border-b
            border-slate-200/80
            bg-white/70
            px-4
            py-4
            sm:px-6
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-[15px]
              bg-blue-50
              text-xl
              shadow-sm
              ring-1
              ring-blue-100
            "
          >
            📝
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                !text-slate-900
                sm:text-xl
              "
            >
              ข้อมูลการรับเข้าพัสดุ
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนบันทึก
            </p>
          </div>
        </div>

        {/* =================================================
            Edit Form
        ================================================= */}

        <div
          className="
            w-full
            min-w-0
            p-3
            sm:p-5
            lg:p-6
          "
        >
          <EditReceiveForm
            receive={receive}
            vendors={vendors}
            materials={materials}
          />
        </div>
      </section>
    </div>
  );
}