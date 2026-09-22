import { prisma } from "@/lib/prisma";
import MaterialForm from "./MaterialForm";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

export const dynamic = "force-dynamic";

/* =========================================================
   PAGE
========================================================= */

export default async function NewMaterialPage() {
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
     MATERIAL MASTERS
  ======================================================= */

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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ Header กลาง
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
          >
            <span>←</span>
            <span>กลับ</span>
          </AppButton>
        }
      />

      {/* =====================================================
          FORM AREA

          ไม่กำหนดสีพื้นหลัง / Gradient / ปุ่มเฉพาะหน้านี้
          ให้ MaterialForm และ Component กลางเป็นตัวควบคุม
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