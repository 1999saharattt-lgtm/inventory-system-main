"use client";

import { useState } from "react";

import AppButton from "@/components/AppButton";

type Props = {
  id: number;
};

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

    const confirmed = window.confirm(
      "ต้องการลบพัสดุนี้ใช่หรือไม่?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(
        `/api/materials/${id}`,
        {
          method: "DELETE",
        }
      );

      /* =====================================================
         SUCCESS
      ===================================================== */

      if (response.ok) {
        window.alert("ลบสำเร็จ");

        window.location.reload();

        return;
      }

      /* =====================================================
         API ERROR
      ===================================================== */

      const data = await response
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
     RENDER

     สำคัญ:
     - สีปุ่มใช้ AppButton ตัวกลาง
     - ปุ่มลบใช้ variant="danger"
     - ไม่กำหนดสีเฉพาะใน Component นี้
  ========================================================= */

  return (
    <AppButton
      type="button"
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={
        isDeleting
          ? "กำลังลบพัสดุ"
          : "ลบพัสดุ"
      }
    >
      {isDeleting ? (
        <>
          <span
            aria-hidden="true"
            className="
              h-3.5
              w-3.5
              animate-spin
              rounded-full
              border-2
              border-current
              border-t-transparent
            "
          />

          <span>กำลังลบ...</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">
            🗑️
          </span>

          <span>ลบ</span>
        </>
      )}
    </AppButton>
  );
}