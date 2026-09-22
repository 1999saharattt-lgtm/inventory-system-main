"use client";

import { deleteReceive } from "./action";

type Props = {
  id: number;
};

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

      <button
        type="submit"
        onClick={(e) => {
          const confirmed = window.confirm(
            "ต้องการลบรายการรับเข้านี้ใช่หรือไม่?"
          );

          if (!confirmed) {
            e.preventDefault();
          }
        }}
        className="
          inline-flex
          h-9
          min-w-[72px]
          items-center
          justify-center
          whitespace-nowrap
          rounded-[13px]
          border
          border-red-500/20
          bg-red-600
          px-4
          text-sm
          font-extrabold
          !text-white
          shadow-[0_8px_20px_-14px_rgba(220,38,38,0.65)]
          transition-all
          duration-300
          ease-out
          hover:-translate-y-0.5
          hover:bg-red-700
          hover:shadow-[0_12px_24px_-14px_rgba(220,38,38,0.7)]
          active:translate-y-0
          active:scale-[0.96]
          focus:outline-none
          focus:ring-4
          focus:ring-red-500/15
        "
      >
        ลบ
      </button>
    </form>
  );
}