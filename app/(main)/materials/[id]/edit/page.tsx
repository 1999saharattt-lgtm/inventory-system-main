import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
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
    <div className="w-full min-w-0 overflow-x-hidden">
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
              sm:text-3xl
            "
          >
            ✏️ แก้ไขข้อมูลพัสดุ
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
            แก้ไขรายละเอียดรายการพัสดุ
          </p>
        </div>
      </div>

      {/* =====================================================
          Edit Material Form
      ===================================================== */}
      <div className="flex w-full justify-center py-4 sm:py-6">
        <div className="w-full max-w-4xl">
          <EditMaterialForm
            material={material}
            vendors={vendors}
          />
        </div>
      </div>
    </div>
  );
}