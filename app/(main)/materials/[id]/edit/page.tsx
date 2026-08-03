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
              text-white
            "
          >
            ✏️ แก้ไขข้อมูลพัสดุ
          </h1>

          <p
            className="
              mt-2
              text-xl
              font-semibold
              text-slate-200
            "
          >
            แก้ไขรายละเอียดข้อมูลพัสดุ
          </p>

        </div>

        <Link
          href="/materials"
          className="
            rounded-xl
            bg-gradient-to-r
            from-slate-800
            to-slate-700
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

      <EditMaterialForm
        material={material}
        vendors={vendors}
      />

    </div>
  );
}