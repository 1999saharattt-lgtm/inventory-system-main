import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditVendorForm from "./EditVendorForm";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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