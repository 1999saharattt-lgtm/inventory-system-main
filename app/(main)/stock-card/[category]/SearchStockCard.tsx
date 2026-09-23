"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  category: string;
  defaultSearch?: string;
};

/* =========================================================
   SEARCH STOCK CARD
========================================================= */

export default function SearchStockCard({
  category,
  defaultSearch = "",
}: Props) {
  const router = useRouter();

  const [search, setSearch] =
    useState(defaultSearch);

  /* =======================================================
     SYNC DEFAULT SEARCH
  ======================================================= */

  useEffect(() => {
    setSearch(defaultSearch);
  }, [defaultSearch]);

  /* =======================================================
     SUBMIT
  ======================================================= */

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const keyword =
      search.trim();

    if (keyword) {
      router.push(
        `/stock-card/${category}?search=${encodeURIComponent(
          keyword
        )}`
      );

      return;
    }

    router.push(
      `/stock-card/${category}`
    );
  }

  /* =======================================================
     CLEAR
  ======================================================= */

  function handleClear() {
    setSearch("");

    router.push(
      `/stock-card/${category}`
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppCard
      className="
        w-full
        min-w-0

        p-4

        sm:p-5
      "
    >
      <form
        onSubmit={handleSubmit}
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3

          sm:flex-row
          sm:items-end
        "
      >
        {/* =================================================
            SEARCH INPUT
        ================================================= */}

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <label
            htmlFor="stock-card-search"
            className="
              mb-2
              block

              text-sm
              font-extrabold
              !text-slate-700

              sm:text-base
            "
          >
            ค้นหาพัสดุ
          </label>

          <input
            id="stock-card-search"
            type="text"
            value={search}
            autoComplete="off"
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
            className="
              min-h-[50px]
              w-full

              rounded-[16px]

              border
              border-slate-200

              bg-white

              px-4
              py-3

              text-base
              font-bold
              !text-slate-900

              shadow-sm
              outline-none

              transition-all
              duration-200

              placeholder:!text-slate-400

              hover:border-slate-300

              focus:border-slate-400
              focus:ring-4
              focus:ring-slate-900/5
            "
          />
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            gap-2
          "
        >
          {/* ===============================================
              CLEAR
          =============================================== */}

          {defaultSearch && (
            <AppButton
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClear}
              className="
                flex-1
                sm:flex-none
              "
            >
              ล้าง
            </AppButton>
          )}

          {/* ===============================================
              SEARCH
          =============================================== */}

          <AppButton
            type="submit"
            variant="primary"
            size="md"
            icon={
              <span aria-hidden="true">
                🔍
              </span>
            }
            className="
              flex-1
              sm:flex-none
            "
          >
            ค้นหา
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
}