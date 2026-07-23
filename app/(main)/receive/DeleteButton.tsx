"use client";

import { deleteReceive } from "./action";

export default function DeleteButton({
  id,
}: {
  id: number;
}) {

  return (
    <form
      action={deleteReceive}
    >

      <input
        type="hidden"
        name="id"
        value={id}
      />


      <button
        className="
          rounded-lg
          bg-red-600
          px-4
          py-2
          text-sm
          font-medium
          text-white
          shadow-sm
          transition
          hover:bg-red-700
        "
        onClick={(e) => {
          if (!confirm("ต้องการลบรายการรับเข้านี้ใช่หรือไม่?")) {
            e.preventDefault();
          }
        }}
      >
        ลบ
      </button>


    </form>
  );
}