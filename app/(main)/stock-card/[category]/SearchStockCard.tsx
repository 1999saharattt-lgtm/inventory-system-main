import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  category: string;

  defaultSearch?: string;

  fiscalYear: number;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function SearchStockCard({
  category,
  defaultSearch = "",
  fiscalYear,
}: Props) {
  /* =======================================================
     URL

     สำคัญ:
     ค้นหาแล้วต้องรักษาปีงบประมาณเดิมไว้
  ======================================================= */

  const clearHref =
    `/stock-card/${category}?fiscalYear=${fiscalYear}`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppCard
      className="
        w-full
        min-w-0

        !p-3

        sm:!p-4
      "
    >
      <form
        method="get"
        action={`/stock-card/${category}`}
        className="
          flex
          w-full
          min-w-0
          flex-col

          gap-2

          sm:flex-row
          sm:items-center
        "
      >
        {/* =================================================
            KEEP FISCAL YEAR

            ค้นหาแล้วปีงบประมาณต้องไม่หาย
        ================================================= */}

        <input
          type="hidden"
          name="fiscalYear"
          value={
            fiscalYear
          }
        />

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
          <span
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              left-3
              top-1/2

              -translate-y-1/2

              text-base
            "
          >
            🔎
          </span>

          <input
            type="search"
            name="search"
            defaultValue={
              defaultSearch
            }
            placeholder="ค้นหารหัสพัสดุ หรือชื่อรายการพัสดุ"
            autoComplete="off"
            className="
              h-[44px]
              w-full
              min-w-0

              rounded-[13px]

              border-2
              border-black

              bg-white

              pl-10
              pr-4

              text-sm
              font-semibold

              !text-slate-900

              shadow-sm

              outline-none

              transition-all
              duration-200

              placeholder:font-medium
              placeholder:!text-slate-400

              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
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
          <AppButton
            type="submit"
            variant="primary"
            size="sm"
          >
            ค้นหา
          </AppButton>

          {defaultSearch && (
            <AppButton
              href={
                clearHref
              }
              variant="secondary"
              size="sm"
            >
              ล้าง
            </AppButton>
          )}
        </div>
      </form>
    </AppCard>
  );
}