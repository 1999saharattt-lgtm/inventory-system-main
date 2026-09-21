export default function Loading() {
  return (
    <div
      className="
        relative
        isolate
        w-full
        min-w-0
        overflow-hidden
        rounded-[32px]
        bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_24%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]
        p-3
        sm:p-4
        lg:p-5
      "
      aria-busy="true"
      aria-live="polite"
    >
      {/* =====================================================
          Ambient Background
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-24
          top-8
          -z-10
          h-72
          w-72
          rounded-full
          bg-blue-300/20
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          top-40
          -z-10
          h-80
          w-80
          rounded-full
          bg-emerald-300/15
          blur-3xl
        "
      />

      <div className="w-full min-w-0 space-y-4 sm:space-y-5">
        {/* =====================================================
            Top Summary Cards
        ===================================================== */}

        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-3
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="
                relative
                min-h-[170px]
                min-w-0
                overflow-hidden
                rounded-[26px]
                border
                border-white/80
                bg-white/75
                p-5
                shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
                backdrop-blur-2xl
              "
            >
              <div
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-1.5
                  animate-pulse
                  bg-gradient-to-r
                  from-slate-200
                  via-slate-100
                  to-slate-200
                "
              />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-5 w-32 max-w-full animate-pulse rounded-full bg-slate-200" />

                  <div className="h-11 w-20 animate-pulse rounded-[14px] bg-slate-200" />

                  <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
                </div>

                <div
                  className="
                    h-14
                    w-14
                    shrink-0
                    animate-pulse
                    rounded-[18px]
                    bg-slate-100
                    ring-1
                    ring-slate-200
                  "
                />
              </div>

              <div className="mt-5 h-3 w-28 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>

        {/* =====================================================
            Monthly Cards
        ===================================================== */}

        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-4
            md:grid-cols-2
          "
        >
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="
                min-h-[150px]
                min-w-0
                overflow-hidden
                rounded-[28px]
                border
                border-white/80
                bg-white/80
                p-5
                shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
                backdrop-blur-2xl
              "
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-5 w-40 max-w-full animate-pulse rounded-full bg-slate-200" />

                  <div className="h-12 w-16 animate-pulse rounded-[14px] bg-slate-200" />

                  <div className="h-3 w-32 animate-pulse rounded-full bg-slate-100" />
                </div>

                <div
                  className="
                    h-16
                    w-16
                    shrink-0
                    animate-pulse
                    rounded-[20px]
                    bg-slate-100
                    ring-1
                    ring-slate-200
                  "
                />
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            Main Panels
        ===================================================== */}

        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-4
            lg:grid-cols-2
          "
        >
          {Array.from({ length: 2 }).map((_, panelIndex) => (
            <div
              key={panelIndex}
              className="
                min-w-0
                overflow-hidden
                rounded-[30px]
                border
                border-white/80
                bg-white/80
                shadow-[0_22px_60px_-32px_rgba(15,23,42,0.38)]
                backdrop-blur-2xl
              "
            >
              <div
                className="
                  border-b
                  border-slate-200/80
                  bg-white/40
                  px-5
                  py-5
                "
              >
                <div className="h-6 w-48 max-w-full animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-56 max-w-full animate-pulse rounded-full bg-slate-100" />
              </div>

              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-[22px]
                      border
                      border-slate-200/90
                      bg-white
                      px-4
                      py-4
                    "
                  >
                    <div
                      className="
                        h-11
                        w-11
                        shrink-0
                        animate-pulse
                        rounded-[15px]
                        bg-slate-100
                      "
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-40 max-w-full animate-pulse rounded-full bg-slate-200" />
                      <div className="h-3 w-56 max-w-full animate-pulse rounded-full bg-slate-100" />
                    </div>

                    <div className="h-5 w-8 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            Chart Skeleton
        ===================================================== */}

        <div
          className="
            w-full
            min-w-0
            overflow-hidden
            rounded-[30px]
            border
            border-white/80
            bg-white/80
            shadow-[0_22px_60px_-32px_rgba(15,23,42,0.38)]
            backdrop-blur-2xl
          "
        >
          <div
            className="
              border-b
              border-slate-200/80
              bg-white/40
              px-5
              py-5
            "
          >
            <div className="h-6 w-52 max-w-full animate-pulse rounded-full bg-slate-200" />
            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-6 gap-2 sm:gap-4">
              {Array.from({ length: 6 }).map((_, index) => {
                const heights = [
                  "h-16",
                  "h-24",
                  "h-20",
                  "h-28",
                  "h-32",
                  "h-24",
                ];

                return (
                  <div
                    key={index}
                    className="
                      flex
                      min-w-0
                      flex-col
                      items-center
                    "
                  >
                    <div
                      className="
                        flex
                        h-32
                        w-full
                        items-end
                        justify-center
                        border-b
                        border-slate-200
                        sm:h-44
                      "
                    >
                      <div
                        className={`
                          w-6
                          animate-pulse
                          rounded-t-[10px]
                          bg-slate-200
                          sm:w-8
                          ${heights[index]}
                        `}
                      />
                    </div>

                    <div className="mt-3 h-4 w-10 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-2 h-3 w-8 animate-pulse rounded-full bg-slate-100" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          Screen-reader text
      ===================================================== */}

      <span className="sr-only">
        กำลังโหลดข้อมูล กรุณารอสักครู่
      </span>
    </div>
  );
}
