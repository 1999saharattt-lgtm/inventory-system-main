import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import VendorForm from "./VendorForm";

/* =========================================================
   PAGE
========================================================= */

export default function NewVendorPage() {
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
        icon="🏢"
        title="เพิ่มข้อมูลผู้จำหน่าย"
        subtitle="เพิ่มรายละเอียดข้อมูลผู้จำหน่ายในระบบพัสดุ"
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

      <VendorForm />
    </AppPage>
  );
}