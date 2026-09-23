"use client";

import { useState } from "react";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  id: number;
};

/* =========================================================
   DELETE BUTTON
========================================================= */

export default function DeleteButton({
  id,
}: Props) {
  const [isDeleting, setIsDeleting] =
    useState(false);

  /* =========================================================
     DELETE MATERIAL
  ========================================================= */

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    const confirmed =
      window.confirm(
        "ต้องการลบพัสดุนี้ใช่หรือไม่?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      const response =
        await fetch(
          `/api/materials/${id}`,
          {
            method: "DELETE",
          }
        );

      /* =====================================================
         SUCCESS
      ===================================================== */

      if (response.ok) {
        window.alert(
          "ลบสำเร็จ"
        );

        window.location.reload();

        return;
      }

      /* =====================================================
         API ERROR
      ===================================================== */

      const data =
        await response
          .json()
          .catch(() => null);

      window.alert(
        data?.message ??
          "ลบไม่สำเร็จ"
      );
    } catch (error) {
      console.error(
        "เกิดข้อผิดพลาดในการลบพัสดุ:",
        error
      );

      window.alert(
        "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  /* =========================================================
     UI

     ใช้ AppButton ตัวกลางทั้งหมด
     - สี = danger
     - ขนาด = sm
     - disabled = AppButton จัดการ
     - ไม่กำหนด className ของปุ่มเอง
  ========================================================= */

  return (
    <AppButton
      type="button"
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      icon={
        isDeleting ? (
          <span
            aria-hidden="true"
            className="
              h-4
              w-4
              animate-spin
              rounded-full
              border-2
              border-current
              border-t-transparent
            "
          />
        ) : (
          <span aria-hidden="true">
            🗑️
          </span>
        )
      }
    >
      {isDeleting
        ? "กำลังลบ..."
        : "ลบ"}
    </AppButton>
  );
}