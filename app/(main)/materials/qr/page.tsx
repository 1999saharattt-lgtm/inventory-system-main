import { prisma } from "@/lib/prisma";

import QRCodePdf from "./QRCodePdf";

/* =========================================================
   FORCE FRESH DATA
========================================================= */

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

/* =========================================================
   PAGE
========================================================= */

export default async function MaterialsQrPage() {
  /* =======================================================
     LOAD MATERIALS

     ไม่ให้ Prisma เป็นผู้กำหนดลำดับสุดท้ายของ PDF

     QRCodePdf จะ:
     1. แยกตามหมวด
     2. เรียงรหัสแบบ Natural Sort
     3. สร้างเลขลำดับใหม่ 1..n ภายในแต่ละหมวด
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
      },
    });

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <QRCodePdf
      materials={materials}
    />
  );
}