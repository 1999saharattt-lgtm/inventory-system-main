"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  category: string;
  defaultSearch?: string;
  resultCount?: number;

  fiscalYear:
    number;
};

/* =========================================================
   SEARCH STOCK CARD
========================================================= */

export default function SearchStockCard({
  category,
  defaultSearch = "",
  resultCount,
  fiscalYear,
}: Props) {
  const router =
    useRouter();

  const [
    search,
    setSearch,
  ] =
    useState(
      defaultSearch
    );

  /* =======================================================
     SYNC DEFAULT SEARCH
  ======================================================= */

  useEffect(
    () => {
      setSearch(
        defaultSearch
      );
    },
    [
      defaultSearch,
    ]
  );

  /* =======================================================
     BASE URL

     ต้องรักษา fiscalYear ไว้เสมอ

     เช่น:
     /stock-card/COMPUTER?fiscalYear=2570
  ======================================================= */

  const baseUrl =
    `/stock-card/${category}?fiscalYear=${fiscalYear}`;

  /* =======================================================
     SUBMIT
  ======================================================= */

  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const keyword =
      search.trim();

    if (
      keyword
    ) {
      router.push(
        `${baseUrl}&search=${encodeURIComponent(
          keyword
        )}`
      );

      return;
    }

    router.push(
      baseUrl
    );
  }

  /* =======================================================
     CLEAR

     ล้างเฉพาะ search
     แต่ต้องคง fiscalYear เดิม
  ======================================================= */

  function handleClear() {
    setSearch(
      ""
    );

    router.push(
      baseUrl
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="
        w-full
        min-w-0
      "
    >
      {/* ===================================================
          SEARCH CARD
      =================================================== */}

      <div
        className="
          relative

          w-full
          min-w-0

          overflow-hidden

          rounded-[22px]

          border
          border-white/80

          bg-white/80

          p-3

          shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]

          backdrop-blur-2xl
        "
      >
        {/* =================================================
            AMBIENT BACKGROUND
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute

            -left-20
            -top-24

            h-44
            w-44

            rounded-full

            bg-blue-400/[0.08]

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute

            -bottom-24
            right-0

            h-44
            w-44

            rounded-full

            bg-cyan-400/[0.08]

            blur-3xl
          "
        />

        {/* =================================================
            SEARCH ROW
        ================================================= */}

        <div
          className="
            relative

            flex
            w-full
            min-w-0
            flex-col

            gap-2.5

            md:flex-row
            md:items-center
          "
        >
          {/* ===============================================
              SEARCH INPUT
          =============================================== */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <input
              id="stock-card-search"
              type="search"
              value={
                search
              }
              autoComplete="off"
              aria-label="ค้นหารหัสพัสดุหรือรายการพัสดุ"
              onChange={(
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              className="
                h-11
                w-full
                min-w-0

                rounded-[14px]

                border-2
                !border-black

                bg-white

                px-4

                text-sm
                font-bold

                !text-slate-900

                shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]

                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:!text-slate-400

                hover:border-slate-700

                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10

                sm:h-12
                sm:text-base
              "
            />
          </div>

          {/* ===============================================
              SEARCH BUTTON
          =============================================== */}

          <AppButton
            type="submit"
            variant="primary"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                🔎
              </span>
            }
            className="
              w-full
              shrink-0

              md:w-auto
            "
          >
            ค้นหา
          </AppButton>

          {/* ===============================================
              RESULT COUNT
          =============================================== */}

          {typeof resultCount ===
            "number" && (
            <div
              className="
                inline-flex

                h-11
                w-full
                shrink-0

                items-center
                justify-center

                gap-2

                rounded-[14px]

                border
                border-slate-300

                bg-slate-50

                px-3

                text-xs
                font-extrabold

                !text-slate-600

                shadow-sm

                sm:h-12
                sm:px-4
                sm:text-sm

                md:w-auto
              "
            >
              <span
                className="
                  inline-flex

                  h-7
                  min-w-7

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-slate-300

                  bg-white

                  px-2

                  text-[11px]
                  font-black
                  tabular-nums

                  !text-slate-800

                  shadow-sm
                "
              >
                {resultCount.toLocaleString(
                  "th-TH"
                )}
              </span>

              <span
                className="
                  whitespace-nowrap
                "
              >
                รายการ
              </span>
            </div>
          )}

          {/* ===============================================
              CLEAR BUTTON
          =============================================== */}

          {defaultSearch.trim() !==
            "" && (
            <AppButton
              type="button"
              variant="outline"
              size="md"
              onClick={
                handleClear
              }
              icon={
                <span
                  aria-hidden="true"
                >
                  ✕
                </span>
              }
              className="
                w-full
                shrink-0

                md:w-auto
              "
            >
              ล้าง
            </AppButton>
          )}
        </div>

        {/* =================================================
            CURRENT FISCAL YEAR
        ================================================= */}

        <div
          className="
            relative

            mt-3

            flex
            flex-wrap
            items-center

            gap-2

            border-t
            border-slate-200/80

            pt-3
          "
        >
          <span
            className="
              text-xs
              font-extrabold

              !text-slate-500

              sm:text-sm
            "
          >
            กำลังค้นหาใน:
          </span>

          <span
            className="
              inline-flex

              items-center
              justify-center

              rounded-full

              bg-slate-100

              px-3
              py-1.5

              text-xs
              font-extrabold

              !text-slate-700

              sm:text-sm
            "
          >
            ปีงบประมาณ{" "}
            {
              fiscalYear
            }
          </span>
        </div>
      </div>
    </form>
  );
}