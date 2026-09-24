import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import VendorForm from "./VendorForm";

/* =========================================================
   PAGE
========================================================= */

export default function NewVendorPage() {
  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title="เพิ่มผู้จำหน่าย"
        subtitle="เพิ่มข้อมูลผู้จำหน่ายสำหรับใช้ในระบบพัสดุ"
        actions={
          <AppButton
            href="/vendors"
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