import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
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
    <div className="space-y-6">

      {/* Header */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-4
          py-5
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0 text-white">

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-4xl
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
              !text-white
              sm:text-lg
            "
          >
            แก้ไขรายละเอียดข้อมูลผู้จำหน่ายในระบบพัสดุ
          </p>

        </div>

        <a
          href="/vendors"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </a>
      </div>

      {/* Form */}

      <EditVendorForm
        vendor={vendor}
      />

    </div>
  );
}