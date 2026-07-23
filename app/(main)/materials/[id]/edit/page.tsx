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
    <>
      <h1 className="mb-6 text-3xl font-bold text-white">
        แก้ไขข้อมูลพัสดุ
      </h1>

      <EditMaterialForm
        material={material}
        vendors={vendors}
      />
    </>
  );
}