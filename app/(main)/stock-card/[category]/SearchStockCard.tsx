import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  category: string;

  defaultSearch?: string;

  resultCount: number;

  fiscalYear: number;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function SearchStockCard({
  category,
  defaultSearch = "",
  resultCount,
  fiscalYear,
}: Props) {
  /* =======================================================
     CLEAR URL

     ต้องรักษาปีงบประมาณเดิมไว้

     ตัวอย่าง:
     /stock-card/COMPUTER?fiscalYear=2569
  ======================================================= */

  const clearHref =
    `/stock-card/${category}?fiscalYear=${fiscalYear}`;

  /* =========================================================
     UI

     รูปแบบเดียวกับหน้า:
     /materials/category/OFFICE

     - การ์ดเตี้ย
     - ไม่มีข้อความใต้การ์ด
     - ไม่มี Emoji ในช่องค้นหา
     - ปุ่มค้นหาใช้ AppButton ตัวกลาง
     - แสดงจำนวนรายการด้านขวา
  ========================================================= */

  return (
    <form
      method="GET"
      action={`/stock-card/${category}`}
      className="
        w-full
        min-w-0
      "
    >
      {/* =====================================================
          KEEP FISCAL YEAR

          ค้นหาแล้วปีงบประมาณที่เลือกต้องไม่หาย
      ===================================================== */}

      <input
        type="hidden"
        name="fiscalYear"
        value={fiscalYear}
      />

      {/* =====================================================
          SEARCH CARD
      ===================================================== */}

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
        {/* ===================================================
            AMBIENT BACKGROUND
        =================================================== */}

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

        {/* ===================================================
            SEARCH ROW
        =================================================== */}

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
          {/* =================================================
              SEARCH INPUT

              ไม่มี Icon / Emoji ในช่อง
          ================================================= */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <input
              type="search"
              name="search"
              defaultValue={defaultSearch}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              autoComplete="off"
              aria-label="ค้นหารหัสพัสดุหรือรายการพัสดุ"
              className="
                h-11
                w-full
                min-w-0

                rounded-[14px]

                border
                border-slate-300

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

                hover:border-slate-400

                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10

                sm:h-12
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
              min-w-0
              flex-wrap
              items-center

              gap-2

              md:flex-nowrap
              md:shrink-0
            "
          >
            {/* ===============================================
                SEARCH BUTTON
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
                RESULT COUNT
            =============================================== */}

            <div
              className="
                inline-flex
                h-11
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

            {/* ===============================================
                CLEAR SEARCH
            =============================================== */}

            {defaultSearch && (
              <AppButton
                href={clearHref}
                variant="outline"
                size="md"
                icon={
                  <span aria-hidden="true">
                    ✕
                  </span>
                }
                className="
                  flex-1

                  sm:flex-none
                "
              >
                ล้าง
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}