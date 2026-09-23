import { login } from "./action";

/* =========================================================
   ICONS
   ใช้ SVG แทน Emoji เพื่อไม่ให้ตำแหน่งเพี้ยนบน Windows
========================================================= */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="3"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[22px] w-[22px]"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="3"
      />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
      <path d="M12 14v3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m15 8 4 4-4 4" />
    </svg>
  );
}

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  return (
    <main
      className="
        relative
        flex
        min-h-screen
        w-full
        items-center
        justify-center
        overflow-hidden

        bg-[#f2f6fb]

        px-4
        py-5

        sm:px-6
        sm:py-7

        lg:px-8
      "
    >
      {/* ===================================================
          iOS STYLE BACKGROUND
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0

          bg-[radial-gradient(circle_at_8%_15%,rgba(0,122,255,0.18),transparent_28%),radial-gradient(circle_at_91%_16%,rgba(52,199,89,0.13),transparent_27%),radial-gradient(circle_at_75%_85%,rgba(90,200,250,0.13),transparent_32%),radial-gradient(circle_at_20%_88%,rgba(175,82,222,0.06),transparent_28%),linear-gradient(145deg,#f7faff_0%,#f4f7fb_42%,#eef5f5_100%)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          top-[5%]

          h-[520px]
          w-[520px]

          rounded-full
          bg-[#0A84FF]/10
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-44
          top-[20%]

          h-[560px]
          w-[560px]

          rounded-full
          bg-[#30D158]/10
          blur-[130px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-72
          left-1/2

          h-[520px]
          w-[900px]

          -translate-x-1/2

          rounded-full
          bg-[#64D2FF]/10
          blur-[140px]
        "
      />

      {/* ===================================================
          OUTER GLASS
      =================================================== */}

      <div
        className="
          relative
          z-10

          w-full
          max-w-[1180px]

          rounded-[38px]

          border
          border-white/80

          bg-white/40

          p-[1px]

          shadow-[0_35px_100px_-42px_rgba(15,23,42,0.42)]

          backdrop-blur-[36px]
        "
      >
        {/* =================================================
            LOGIN CONTAINER
        ================================================= */}

        <div
          className="
            grid
            w-full
            min-w-0
            overflow-hidden

            rounded-[37px]

            border
            border-white/50

            bg-white/65

            lg:grid-cols-[1.04fr_0.96fr]
          "
        >
          {/* =================================================
              LEFT BRAND PANEL
          ================================================= */}

          <section
            className="
              relative

              flex
              min-h-[320px]
              items-center
              justify-center

              overflow-hidden

              bg-[linear-gradient(145deg,#071326_0%,#0b1729_48%,#10283a_100%)]

              px-6
              py-10

              text-center

              sm:min-h-[370px]
              sm:px-10

              lg:min-h-[660px]
              lg:px-14
              lg:py-14
            "
          >
            {/* LIGHT */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -left-32
                -top-36

                h-[420px]
                w-[420px]

                rounded-full
                bg-[#0A84FF]/20
                blur-[110px]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-40
                -right-32

                h-[460px]
                w-[460px]

                rounded-full
                bg-[#64D2FF]/15
                blur-[120px]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-x-0
                top-0

                h-px

                bg-gradient-to-r
                from-transparent
                via-white/30
                to-transparent
              "
            />

            {/* DECORATIVE GLASS */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                left-[10%]
                top-[12%]

                h-24
                w-24

                rounded-full

                border
                border-white/[0.04]

                bg-white/[0.02]

                backdrop-blur-2xl
              "
            />

            {/* CONTENT */}

            <div
              className="
                relative
                z-10

                mx-auto
                w-full
                max-w-[500px]
              "
            >
              {/* =============================================
                  LOGO GLASS
              ============================================= */}

              <div className="flex justify-center">
                <div
                  className="
                    relative

                    flex
                    h-[142px]
                    w-[142px]
                    items-center
                    justify-center

                    rounded-[34px]

                    border
                    border-white/60

                    bg-white/95

                    p-3.5

                    shadow-[0_28px_70px_-24px_rgba(0,0,0,0.72)]

                    ring-1
                    ring-white/20

                    sm:h-[154px]
                    sm:w-[154px]

                    lg:h-[164px]
                    lg:w-[164px]
                  "
                >
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-4
                      top-2

                      h-px

                      bg-gradient-to-r
                      from-transparent
                      via-white
                      to-transparent
                    "
                  />

                  <img
                    src="/images/dohl-logo.png"
                    alt="โลโก้กรมอนามัย"
                    className="
                      h-full
                      w-full
                      object-contain
                    "
                  />
                </div>
              </div>

              {/* =============================================
                  BRAND TEXT
              ============================================= */}

              <div className="mt-8">
                <h1
                  className="
                    text-[28px]
                    font-black
                    leading-tight
                    tracking-[-0.02em]
                    !text-white

                    sm:text-[32px]

                    lg:text-[35px]
                  "
                >
                  ระบบบริหารคลังพัสดุ
                </h1>

                <p
                  className="
                    mt-5

                    text-lg
                    font-bold
                    !text-slate-200

                    sm:text-xl
                  "
                >
                  สำนักอนามัยการเจริญพันธุ์
                </p>

                <p
                  className="
                    mt-1.5

                    text-sm
                    font-semibold
                    !text-slate-400

                    sm:text-[15px]
                  "
                >
                  กรมอนามัย กระทรวงสาธารณสุข
                </p>
              </div>

              {/* DIVIDER */}

              <div
                className="
                  mx-auto
                  my-8

                  h-px
                  w-32

                  bg-gradient-to-r
                  from-transparent
                  via-white/20
                  to-transparent
                "
              />

              <p
                className="
                  text-[13px]
                  font-medium
                  leading-relaxed
                  tracking-[0.02em]
                  !text-slate-400

                  sm:text-sm
                "
              >
                Reproductive Health Inventory Management System
              </p>
            </div>
          </section>

          {/* =================================================
              RIGHT LOGIN
          ================================================= */}

          <section
            className="
              relative

              flex
              items-center
              justify-center

              overflow-hidden

              bg-white/72

              px-5
              py-9

              backdrop-blur-[40px]

              sm:px-10
              sm:py-11

              lg:px-12
              lg:py-14

              xl:px-16
            "
          >
            {/* TOP LIGHT */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20

                h-64
                w-64

                rounded-full
                bg-[#0A84FF]/[0.07]
                blur-[80px]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-28
                -left-16

                h-64
                w-64

                rounded-full
                bg-[#64D2FF]/[0.06]
                blur-[90px]
              "
            />

            {/* LOGIN CONTENT */}

            <div
              className="
                relative
                z-10

                mx-auto
                w-full
                max-w-[430px]
              "
            >
              {/* =============================================
                  LOGIN ICON
              ============================================= */}

              <div
                className="
                  flex
                  h-[58px]
                  w-[58px]
                  items-center
                  justify-center

                  rounded-[19px]

                  border
                  border-white

                  bg-white/80

                  text-[#007AFF]

                  shadow-[0_12px_35px_-18px_rgba(15,23,42,0.35)]

                  ring-1
                  ring-slate-900/[0.04]

                  backdrop-blur-2xl
                "
              >
                <LoginIcon />
              </div>

              {/* =============================================
                  HEADING
              ============================================= */}

              <div className="mb-8 mt-6">
                <h2
                  className="
                    text-[32px]
                    font-black
                    leading-tight
                    tracking-[-0.025em]
                    !text-[#111827]

                    sm:text-[38px]
                  "
                >
                  เข้าสู่ระบบ
                </h2>

                <p
                  className="
                    mt-2.5

                    text-sm
                    font-medium
                    leading-relaxed
                    !text-slate-500

                    sm:text-[15px]
                  "
                >
                  กรุณากรอกข้อมูลบัญชีผู้ใช้งานของคุณ
                </p>
              </div>

              {/* =============================================
                  FORM
              ============================================= */}

              <form
                action={login}
                className="space-y-5"
              >
                {/* ===========================================
                    USERNAME
                =========================================== */}

                <div>
                  <label
                    htmlFor="username"
                    className="
                      mb-2.5
                      block

                      text-[13px]
                      font-bold
                      !text-slate-600

                      sm:text-sm
                    "
                  >
                    รหัสผู้ใช้งาน
                  </label>

                  <div
                    className="
                      group
                      relative
                    "
                  >
                    {/* ICON BOX */}

                    <div
                      className="
                        pointer-events-none

                        absolute
                        left-3
                        top-1/2
                        z-10

                        flex
                        h-9
                        w-9
                        -translate-y-1/2
                        items-center
                        justify-center

                        rounded-[11px]

                        bg-slate-100/90

                        !text-slate-500

                        transition-all
                        duration-200

                        group-focus-within:bg-blue-50
                        group-focus-within:!text-[#007AFF]
                      "
                    >
                      <UserIcon />
                    </div>

                    <input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="กรอกรหัสผู้ใช้งาน"
                      autoComplete="username"
                      required
                      className="
                        h-[58px]
                        w-full

                        rounded-[17px]

                        border
                        border-slate-200

                        bg-[#f5f7fa]/90

                        py-3
                        pl-[60px]
                        pr-4

                        text-[15px]
                        font-semibold
                        !text-slate-900

                        shadow-[inset_0_1px_2px_rgba(15,23,42,0.035)]

                        outline-none

                        transition-all
                        duration-200

                        placeholder:font-medium
                        placeholder:!text-slate-400

                        hover:border-slate-300
                        hover:bg-white

                        focus:border-[#0A84FF]/60
                        focus:bg-white
                        focus:shadow-[0_0_0_4px_rgba(10,132,255,0.10),inset_0_1px_2px_rgba(15,23,42,0.03)]
                      "
                    />
                  </div>
                </div>

                {/* ===========================================
                    PASSWORD
                =========================================== */}

                <div>
                  <label
                    htmlFor="password"
                    className="
                      mb-2.5
                      block

                      text-[13px]
                      font-bold
                      !text-slate-600

                      sm:text-sm
                    "
                  >
                    รหัสผ่าน
                  </label>

                  <div
                    className="
                      group
                      relative
                    "
                  >
                    {/* ICON BOX */}

                    <div
                      className="
                        pointer-events-none

                        absolute
                        left-3
                        top-1/2
                        z-10

                        flex
                        h-9
                        w-9
                        -translate-y-1/2
                        items-center
                        justify-center

                        rounded-[11px]

                        bg-slate-100/90

                        !text-slate-500

                        transition-all
                        duration-200

                        group-focus-within:bg-blue-50
                        group-focus-within:!text-[#007AFF]
                      "
                    >
                      <LockIcon />
                    </div>

                    <input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="กรอกรหัสผ่าน"
                      autoComplete="current-password"
                      required
                      className="
                        h-[58px]
                        w-full

                        rounded-[17px]

                        border
                        border-slate-200

                        bg-[#f5f7fa]/90

                        py-3
                        pl-[60px]
                        pr-4

                        text-[15px]
                        font-semibold
                        !text-slate-900

                        shadow-[inset_0_1px_2px_rgba(15,23,42,0.035)]

                        outline-none

                        transition-all
                        duration-200

                        placeholder:font-medium
                        placeholder:!text-slate-400

                        hover:border-slate-300
                        hover:bg-white

                        focus:border-[#0A84FF]/60
                        focus:bg-white
                        focus:shadow-[0_0_0_4px_rgba(10,132,255,0.10),inset_0_1px_2px_rgba(15,23,42,0.03)]
                      "
                    />
                  </div>
                </div>

                {/* ===========================================
                    LOGIN BUTTON
                =========================================== */}

                <button
                  type="submit"
                  className="
                    group

                    mt-2

                    flex
                    h-[58px]
                    w-full
                    items-center
                    justify-center
                    gap-2.5

                    rounded-[17px]

                    border
                    border-[#007AFF]/30

                    bg-[linear-gradient(180deg,#1687ff_0%,#007AFF_100%)]

                    px-5

                    text-[15px]
                    font-extrabold
                    !text-white

                    shadow-[0_14px_30px_-14px_rgba(0,122,255,0.62),inset_0_1px_0_rgba(255,255,255,0.25)]

                    transition-all
                    duration-200

                    hover:-translate-y-[1px]
                    hover:brightness-[1.04]
                    hover:shadow-[0_18px_36px_-14px_rgba(0,122,255,0.68),inset_0_1px_0_rgba(255,255,255,0.28)]

                    active:translate-y-0
                    active:scale-[0.985]
                    active:brightness-[0.98]

                    sm:text-base
                  "
                >
                  <span>
                    เข้าสู่ระบบ
                  </span>

                  <span
                    className="
                      flex
                      items-center
                      justify-center

                      transition-transform
                      duration-200

                      group-hover:translate-x-0.5
                    "
                  >
                    <ArrowIcon />
                  </span>
                </button>
              </form>

              {/* =============================================
                  SECURITY / SYSTEM INFO
              ============================================= */}

              <div
                className="
                  mt-6

                  flex
                  items-center
                  justify-center
                  gap-2

                  text-xs
                  font-medium
                  !text-slate-400
                "
              >
                <span
                  className="
                    inline-block
                    h-1.5
                    w-1.5

                    rounded-full
                    bg-emerald-500
                  "
                />

                <span>
                  ระบบสำหรับบุคลากรที่ได้รับอนุญาต
                </span>
              </div>

              {/* =============================================
                  FOOTER
              ============================================= */}

              <div
                className="
                  mt-8

                  border-t
                  border-slate-200/80

                  pt-5

                  text-center
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    !text-slate-400

                    sm:text-[13px]
                  "
                >
                  © {new Date().getFullYear()} ระบบบริหารคลังพัสดุ
                </p>

                <p
                  className="
                    mt-1.5

                    text-[11px]
                    font-medium
                    !text-slate-400

                    sm:text-xs
                  "
                >
                  กลุ่มอำนวยการ (งานพัสดุ)
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}