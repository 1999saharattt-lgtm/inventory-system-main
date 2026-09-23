"use client";

import { deleteIssue } from "./action";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  id: number;
};

/* =========================================================
   DELETE BUTTON
   ใช้ AppButton ตัวกลางของระบบ
========================================================= */

export default function DeleteButton({
  id,
}: Props) {
  async function handleDelete() {
    const confirmDelete =
      window.confirm(
        "ต้องการลบใบเบิกนี้หรือไม่?"
      );

    if (!confirmDelete) {
      return;
    }

    await deleteIssue(id);
  }

  return (
    <AppButton
      type="button"
      variant="danger"
      size="sm"
      icon={
        <span aria-hidden="true">
          🗑️
        </span>
      }
      onClick={handleDelete}
    >
      ลบ
    </AppButton>
  );
}