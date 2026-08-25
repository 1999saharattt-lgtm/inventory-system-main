import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditVendorForm from "./EditVendorForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditVendorPage({
  params,
}: Props) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!vendor) {
    notFound();
  }

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
          flex-col
          justify-center
          gap-4
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
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:gap-4
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              tracking-wide
              !text-white
              sm:text-5xl
            "
          >
            ✏️ แก้ไขข้อมูลผู้จำหน่าย
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-xl
            "
          >
            แก้ไขรายละเอียดข้อมูลผู้จำหน่ายในระบบพัสดุ
          </p>
        </div>

        <Link
          href="/vendors"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-0
          shadow-lg
        "
      >
        <EditVendorForm vendor={vendor} />
      </div>
    </div>
  );
}