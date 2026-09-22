"use client";

import { useState } from "react";

type Props = {
  id: number;
};

export default function DeleteButton({ id }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

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
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label="ลบพัสดุ"
      className="
        group
        inline-flex
        h-9
        min-w-[82px]
        items-center
        justify-center
        gap-1.5
        rounded-[12px]
        border
        border-red-200
        bg-red-50
        px-3.5
        text-sm
        font-extrabold
        !text-red-600
        shadow-sm
        transition-all
        duration-200
        ease-out
        hover:-translate-y-0.5
        hover:border-red-300
        hover:bg-red-500
        hover:!text-white
        hover:shadow-[0_10px_22px_-14px_rgba(239,68,68,0.65)]
        active:translate-y-0
        active:scale-[0.96]
        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
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
          <span
            className="
              transition-transform
              duration-200
              group-hover:scale-110
            "
          >
            🗑️
          </span>

          <span>ลบ</span>
        </>
      )}
    </button>
  );
}