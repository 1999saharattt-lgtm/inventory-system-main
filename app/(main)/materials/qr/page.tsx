import { prisma } from "@/lib/prisma";
import QRCodePdf from "./QRCodePdf";

export default async function MaterialsQrPage() {
  /* =========================================================
     Load Materials
  ========================================================= */

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

  /* =========================================================
     Render
  ========================================================= */

  return (
    <QRCodePdf
      materials={materials}
    />
  );
}