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
    <>
      <h1 className="mb-6 text-3xl font-bold text-white">
        แก้ไขผู้จำหน่าย
      </h1>

      <EditVendorForm vendor={vendor} />
    </>
  );
}