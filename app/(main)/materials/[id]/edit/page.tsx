import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import EditMaterialForm from "./EditMaterialForm";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMaterialPage({
  params,
}: Props) {
  const { id } = await params;

  /* =========================================================
     MATERIAL
  ========================================================= */

  const materialId = Number(id);

  if (
    !Number.isInteger(materialId) ||
    materialId <= 0
  ) {
    notFound();
  }

  const material =
    await prisma.material.findUnique({
      where: {
        id: materialId,
      },
    });

  if (!material) {
    notFound();
  }

  /* =========================================================
     VENDORS

     ส่งข้อมูลผู้จำหน่ายไปให้ EditMaterialForm
     เพื่อใช้ Dropdown แบบพิมพ์ค้นหาได้
  ========================================================= */

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

  /* =========================================================
     BACK URL

     กลับไปยังหมวดหมู่เดิมของพัสดุ
     เช่น OFFICE -> /materials/category/OFFICE
  ========================================================= */

  const backHref =
    `/materials/category/${material.category}`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
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
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          EDIT MATERIAL FORM
      ===================================================== */}

      <section
        className="
          flex
          w-full
          min-w-0
          justify-center
        "
      >
        <div
          className="
            w-full
            max-w-4xl
          "
        >
          <EditMaterialForm
            material={material}
            vendors={vendors}
          />
        </div>
      </section>
    </AppPage>
  );
}