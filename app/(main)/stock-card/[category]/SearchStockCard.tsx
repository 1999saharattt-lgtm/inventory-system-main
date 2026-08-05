"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  category: string;
  defaultSearch?: string;
};

export default function SearchStockCard({
  category,
  defaultSearch = "",
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState(defaultSearch);

  function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const keyword = search.trim();

    if (keyword) {
      router.push(
        `/stock-card/${category}?search=${encodeURIComponent(keyword)}`
      );
    } else {
      router.push(`/stock-card/${category}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex
        gap-4
        rounded-2xl
        border
        border-slate-700
        bg-gradient-to-r
        from-slate-950
        via-slate-900
        to-slate-800
        p-5
        shadow-xl
      "
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
        className="
          flex-1
          rounded-xl
          border
          border-slate-600
          bg-slate-800
          px-4
          py-3
          text-base
          font-semibold
          text-white
          placeholder:text-slate-400
          outline-none
          transition
          focus:border-cyan-400
          focus:ring-4
          focus:ring-cyan-500/20
        "
      />

      <button
        type="submit"
        className="
          rounded-xl
          bg-gradient-to-r
          from-emerald-600
          to-green-500
          px-6
          py-3
          font-extrabold
          text-white
          shadow-lg
          transition
          hover:scale-105
          hover:shadow-xl
          active:scale-95
        "
      >
        ค้นหา
      </button>
    </form>
  );
}