"use client";

import { deleteReceive } from "./action";

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
  return (
    <form action={deleteReceive}>
      <input
        type="hidden"
        name="id"
        value={id}
      />

      <AppButton
        type="submit"
        variant="danger"
        size="sm"
        icon={<span>🗑️</span>}
        onClick={(event) => {
          const confirmed =
            window.confirm(
              "ต้องการลบรายการรับเข้านี้ใช่หรือไม่?"
            );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        ลบ
      </AppButton>
    </form>
  );
}