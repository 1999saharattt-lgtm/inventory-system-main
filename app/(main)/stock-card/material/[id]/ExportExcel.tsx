"use client";

import AppButton from "@/components/AppButton";

/*
  TYPE และ LOGIC เดิมของ ExportPdf
  ให้คงไว้ทั้งหมด
*/

export default function ExportPdf({
  material,
  rows,
}: Props) {
  /*
    LOGIC สร้าง PDF เดิม
    ให้คงไว้ทั้งหมด
  */

  return (
    <AppButton
      type="button"
      variant="danger"
      size="md"
      onClick={handleExport}
      icon={
        <span aria-hidden="true">
          📄
        </span>
      }
    >
      ส่งออก PDF
    </AppButton>
  );
}