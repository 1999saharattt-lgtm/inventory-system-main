import { prisma } from "@/lib/prisma";
import MaterialForm from "./MaterialForm";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

export const dynamic = "force-dynamic";

export default async function NewMaterialPage() {
  /* =========================================================
     VENDORS
  ========================================================= */

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },

    select: {
      id: true,
      name: true,
    },
  });

  /* =========================================================
     MATERIAL MASTERS
  ========================================================= */

  const materialMasters =
    await prisma.materialMaster.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],

      select: {
        id: true,
        category: true,
        name: true,
        unit: true,
      },
    });

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ Component กลาง
      ===================================================== */}

      <AppPageHeader
        icon="➕"
        title="เพิ่มรายการพัสดุ"
        subtitle="เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ"
        actions={
          <AppButton
            href="/materials"
            variant="outline"
            size="md"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FORM AREA
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
        "
      >
        <MaterialForm
          vendors={vendors}
          materialMasters={materialMasters}
        />
      </section>
    </AppPage>
  );
}