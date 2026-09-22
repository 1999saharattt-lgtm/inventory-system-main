import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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
     Material
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
     Vendors
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
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="✏️"
        title="แก้ไขข้อมูลพัสดุ"
        subtitle="แก้ไขรายละเอียดรายการพัสดุ"
        actions={
          <Link
            href={`/materials/category/${material.category}`}
            prefetch
            className="
              inline-flex
              shrink-0
            "
          >
            <AppButton
              type="button"
              variant="secondary"
            >
              <span>←</span>
              <span>กลับ</span>
            </AppButton>
          </Link>
        }
      />

      {/* =====================================================
          Edit Material Form
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