import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { requireLogin } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireLogin();

  return (
    <div
      className="
        relative
        isolate
        min-h-screen
        overflow-x-hidden
        bg-slate-100
        text-slate-900
      "
    >
      {/* ===================================================
          PREMIUM AMBIENT BACKGROUND
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          -z-30

          bg-[radial-gradient(circle_at_8%_4%,rgba(59,130,246,0.18),transparent_27%),radial-gradient(circle_at_92%_12%,rgba(16,185,129,0.12),transparent_25%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.08),transparent_35%),linear-gradient(to_bottom,#f8fafc_0%,#f1f5f9_45%,#eef2f7_100%)]
        "
      />

      {/* ===================================================
          LEFT BLUE GLOW
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          -left-32
          top-24
          -z-20

          h-[420px]
          w-[420px]

          rounded-full

          bg-blue-400/15

          blur-[110px]
        "
      />

      {/* ===================================================
          RIGHT GREEN GLOW
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          -right-32
          top-56
          -z-20

          h-[480px]
          w-[480px]

          rounded-full

          bg-emerald-300/10

          blur-[120px]
        "
      />

      {/* ===================================================
          CENTER CYAN GLOW
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-1/2
          top-[420px]
          -z-20

          h-[420px]
          w-[700px]

          -translate-x-1/2

          rounded-full

          bg-cyan-300/[0.06]

          blur-[130px]
        "
      />

      {/* ===================================================
          STICKY TOP AREA
          HEADER + SIDEBAR

          - Header ไม่เลื่อน
          - Sidebar ไม่เลื่อน
          - ทั้งสองส่วนติดด้านบนพร้อมกัน
          - Content ด้านล่างเลื่อนตามปกติ
      =================================================== */}

      <header
        className="
          sticky
          top-0
          z-[100]

          w-full

          bg-slate-950
          shadow-[0_10px_30px_-20px_rgba(15,23,42,0.55)]
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            relative
            z-[110]
            w-full
          "
        >
          <Header />
        </div>

        {/* =================================================
            SIDEBAR / NAVIGATION
        ================================================= */}

        <div
          className="
            relative
            z-[100]
            w-full
          "
        >
          <Sidebar role={user.role} />
        </div>
      </header>

      {/* ===================================================
          CONTENT

          เลื่อนเฉพาะเนื้อหาส่วนนี้
          Header + Sidebar จะค้างอยู่ด้านบน
      =================================================== */}

      <main
        className="
          relative
          z-10

          min-h-screen
          min-w-0

          overflow-x-hidden

          bg-transparent

          px-2
          py-3

          sm:px-3
          sm:py-4

          lg:px-4
          lg:py-5
        "
      >
        <div
          className="
            mx-auto

            w-full
            min-w-0
            max-w-[1920px]

            transition-[opacity,transform]
            duration-300
            ease-out
          "
        >
          {children}
        </div>
      </main>
    </div>
  );
}