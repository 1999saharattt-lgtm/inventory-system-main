import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import EditMaterialForm from "./EditMaterialForm";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function EditMaterialPage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

  const materialId =
    Number(id);

  if (
    !Number.isInteger(
      materialId
    ) ||
    materialId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     MATERIAL
  ======================================================= */

  const material =
    await prisma.material.findUnique({
      where: {
        id: materialId,
      },
    });

  if (!material) {
    notFound();
  }

  /* =======================================================
     VENDORS
  ======================================================= */

  const vendors =
    await prisma.vendor.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  /* =======================================================
     BACK URL
  ======================================================= */

  const backHref =
    `/materials/category/${material.category}`;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ตัวกลาง AppPageHeader
      ===================================================== */}

      <AppPageHeader
        icon="✏️"
        title="แก้ไขข้อมูลพัสดุ"
        subtitle="แก้ไขรายละเอียดรายการพัสดุ"
        actions={
          <AppButton
            href={backHref}
            variant="back"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          EDIT MATERIAL FORM

          ไม่สร้าง Card / Container / max-width เอง
          ให้ EditMaterialForm ใช้ Component กลาง
          แบบเดียวกับ MaterialForm หน้าเพิ่ม
      ===================================================== */}

      <EditMaterialForm
        material={material}
        vendors={vendors}
        backHref={backHref}
      />
    </AppPage>
  );
}