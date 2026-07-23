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
        gap-3
        rounded-xl
        border
        border-slate-300
        bg-white
        p-4
        shadow-sm
      "
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
        className="
          flex-1
          rounded-lg
          border
          px-4
          py-3
          text-black
        "
      />

      <button
        type="submit"
        className="
          rounded-lg
          bg-blue-700
          px-6
          py-3
          font-semibold
          text-white
          hover:bg-blue-800
        "
      >
        ค้นหา
      </button>
    </form>
  );
}