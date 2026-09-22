import { prisma } from "@/lib/prisma";
import MaterialForm from "./MaterialForm";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

export const dynamic = "force-dynamic";

export default async function NewMaterialPage() {
  /* =========================================================
     Vendors
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
     Material Masters
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
          Header
      ===================================================== */}

      <AppPageHeader
        icon="➕"
        title="เพิ่มรายการพัสดุ"
        subtitle="เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ"
        actions={
          <AppButton
            href="/materials"
            variant="success"
            size="md"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          Form Area
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
        "
      >
        {/* Ambient Background */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            -top-10
            -z-10
            mx-auto
            h-52
            max-w-5xl
            rounded-full
            bg-gradient-to-r
            from-blue-100/40
            via-slate-100/30
            to-cyan-100/40
            blur-3xl
          "
        />

        <MaterialForm
          vendors={vendors}
          materialMasters={materialMasters}
        />
      </section>
    </AppPage>
  );
}