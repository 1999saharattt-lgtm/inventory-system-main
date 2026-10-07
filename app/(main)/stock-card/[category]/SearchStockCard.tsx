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
     CLEAR URL

     ต้องรักษาปีงบประมาณเดิมไว้

     เช่น:
     /stock-card/COMPUTER?fiscalYear=2569
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

            - ไม่มี Emoji
            - ไม่มี Icon
            - ไม่มีข้อความด้านล่าง
            - ความสูงแบบเดิม
        ================================================= */}

        <input
          type="search"
          name="search"
          defaultValue={
            defaultSearch
          }
          placeholder="ค้นหารหัสพัสดุ หรือชื่อรายการพัสดุ"
          autoComplete="off"
          className="
            h-[42px]
            min-w-0
            flex-1

            rounded-[12px]

            border-2
            border-black

            bg-white

            px-4

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

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            items-center

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

          <AppButton
            href={
              clearHref
            }
            variant="secondary"
            size="sm"
          >
            ล้าง
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
}