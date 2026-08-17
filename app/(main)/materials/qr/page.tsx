import { prisma } from "@/lib/prisma";
import QRCodePdf from "./QRCodePdf";

export default async function MaterialsQrPage() {
  const materials = await prisma.material.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
    },
    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],
  });

  return <QRCodePdf materials={materials} />;
}