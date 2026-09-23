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

        !p-2.5

        sm:!p-3
      "
    >
      <form
        onSubmit={handleSubmit}
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-2.5

          sm:flex-row
          sm:items-center
        "
      >
        {/* =================================================
            SEARCH INPUT
        ================================================= */}

        <div
          className="
            relative
            min-w-0
            flex-1
          "
        >
          {/* Search Icon */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              inset-y-0
              left-4

              flex
              items-center
              justify-center

              text-base
            "
          >
            🔎
          </span>

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
              h-11
              w-full
              min-w-0

              rounded-[14px]

              border
              border-slate-300

              bg-white

              py-2
              pl-11
              pr-4

              text-sm
              font-bold
              !text-slate-900

              shadow-sm
              outline-none

              transition-all
              duration-200

              placeholder:font-semibold
              placeholder:!text-slate-400

              hover:border-slate-400

              focus:border-blue-400
              focus:ring-4
              focus:ring-blue-100/70

              sm:text-base
            "
          />
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="
            flex
            w-full
            shrink-0
            gap-2

            sm:w-auto
          "
        >
          {/* ===============================================
              SEARCH
          =============================================== */}

          <AppButton
            type="submit"
            variant="primary"
            size="md"
            icon={
              <span aria-hidden="true">
                🔎
              </span>
            }
            className="
              flex-1
              sm:flex-none
            "
          >
            ค้นหา
          </AppButton>

          {/* ===============================================
              CLEAR
          =============================================== */}

          {defaultSearch && (
            <AppButton
              type="button"
              variant="outline"
              size="md"
              icon={
                <span aria-hidden="true">
                  ✕
                </span>
              }
              onClick={handleClear}
              className="
                flex-1
                sm:flex-none
              "
            >
              ล้างการค้นหา
            </AppButton>
          )}
        </div>
      </form>
    </AppCard>
  );
}