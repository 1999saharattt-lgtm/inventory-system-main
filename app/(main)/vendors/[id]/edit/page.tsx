import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import EditVendorForm from "./EditVendorForm";

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

export default async function EditVendorPage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

  const vendorId = Number(id);

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (
    !Number.isInteger(vendorId) ||
    vendorId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     VENDOR
  ======================================================= */

  const vendor =
    await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
    });

  if (!vendor) {
    notFound();
  }

  /* =======================================================
     ROUTES
  ======================================================= */

  const vendorsPath = "/vendors";

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
        title="แก้ไขข้อมูลผู้จำหน่าย"
        subtitle="แก้ไขรายละเอียดข้อมูลผู้จำหน่ายในระบบพัสดุ"
        actions={
          <AppButton
            href={vendorsPath}
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FORM
      ===================================================== */}

      <EditVendorForm
        vendor={vendor}
      />
    </AppPage>
  );
}