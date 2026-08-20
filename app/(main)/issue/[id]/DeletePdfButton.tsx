"use client";

import { useState } from "react";
import { deleteIssuePdf } from "../action";

type Props = {
  id: number;
};

export default function DeletePdfButton({
  id,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) {
      return;
    }

    const confirmDelete = window.confirm(
      "ต้องการลบไฟล์ PDF ใบเบิกนี้หรือไม่?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteIssuePdf(id);
    } catch (error) {
      console.error("Delete PDF error:", error);

      alert("ไม่สามารถลบไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง");

      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="
        rounded-lg
        bg-red-600
        px-4
        py-2
        text-center
        font-bold
        text-white
        shadow
        transition
        hover:bg-red-700
        disabled:cursor-not-allowed
        disabled:bg-red-300
      "
    >
      {deleting ? "กำลังลบ..." : "ลบไฟล์ PDF"}
    </button>
  );
}