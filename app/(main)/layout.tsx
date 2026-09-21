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
          Ambient Background
          พื้นหลังโทน iOS / Glass
          =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          -z-20
          bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          -left-24
          top-28
          -z-10
          h-80
          w-80
          rounded-full
          bg-blue-300/20
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          -right-24
          top-72
          -z-10
          h-96
          w-96
          rounded-full
          bg-emerald-300/15
          blur-3xl
        "
      />

      {/* ===================================================
          Header
          โลโก้ + ชื่อระบบ
          =================================================== */}

      <div
        className="
          relative
          z-50
          w-full
        "
      >
        <Header />
      </div>

      {/* ===================================================
          Navigation
          เมนูหลักติดกับ Header
          =================================================== */}

      <div
        className="
          relative
          z-40
          w-full
        "
      >
        <Sidebar role={user.role} />
      </div>

      {/* ===================================================
          Content
          =================================================== */}

      <main
        className="
          relative
          z-10
          min-h-[calc(100vh-1px)]
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
