"use client";

import { useState } from "react";
import AppButton from "@/components/AppButton";

type Props = {
  id: number;
};

export default function DeleteButton({ id }: Props) {
  const [isDeleting, setIsDeleting] =
    useState(false);

  async function handleDelete() {
    if (isDeleting) return;

    const ok = confirm(
      "ต้องการลบพัสดุนี้ใช่หรือไม่?"
    );

    if (!ok) return;

    try {
      setIsDeleting(true);

      const res = await fetch(
        `/api/materials/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        alert("ลบสำเร็จ");
        window.location.reload();
        return;
      }

      const data = await res
        .json()
        .catch(() => null);

      alert(
        data?.message ??
          "ลบไม่สำเร็จ"
      );
    } catch (error) {
      console.error(
        "เกิดข้อผิดพลาดในการลบพัสดุ:",
        error
      );

      alert(
        "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppButton
      type="button"
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label="ลบพัสดุ"
    >
      {isDeleting ? (
        <>
          <span
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
          <span>🗑️</span>
          <span>ลบ</span>
        </>
      )}
    </AppButton>
  );
}