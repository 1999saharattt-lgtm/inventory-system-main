import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditMaterialForm from "./EditMaterialForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMaterialPage({
  params,
}: Props) {
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!material) {
    notFound();
  }

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">

      {/* Header */}

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
        <div className="min-w-0">

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-5xl
            "
          >
            ✏️ แก้ไขข้อมูลพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-xl
            "
          >
            แก้ไขรายละเอียดรายการพัสดุ
          </p>

        </div>

        <Link
          href={`/materials/category/${material.category}`}
          className="
            shrink-0
            rounded-xl
            bg-white
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            text-slate-900
            shadow-lg
            transition
            hover:scale-105
            hover:bg-slate-100
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>

      </div>

      <EditMaterialForm
        material={material}
        vendors={vendors}
      />

    </div>
  );
}