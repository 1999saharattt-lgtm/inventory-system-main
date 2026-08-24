"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ElementType } from "react";

import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  MonitorCog,
  Truck,
  Building2,
  Users,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

type UserRole = "ADMIN" | "STAFF" | "VIEWER";

type MenuItem = {
  name: string;
  href: string;
  icon: ElementType;
  adminOnly?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
  adminOnly?: boolean;
};

type MobileMenuProps = {
  role: UserRole;
};

/* =========================================================
   Menu Configuration
   ========================================================= */

const menus: MenuGroup[] = [
  {
    title: "หน้าแรก",
    items: [
      {
        name: "ภาพรวมระบบ",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "รายงานพัสดุ",
    items: [
      {
        name: "รายการพัสดุทั้งหมด",
        href: "/materials",
        icon: Boxes,
      },
      {
        name: "จำนวนพัสดุใกล้หมด",
        href: "/materials/low-stock",
        icon: AlertTriangle,
      },
      {
        name: "รายการรับเข้า",
        href: "/receive",
        icon: PackagePlus,
        adminOnly: true,
      },
      {
        name: "รายการเบิกจ่าย",
        href: "/issue",
        icon: PackageMinus,
      },
      {
        name: "บัญชีคุมพัสดุ",
        href: "/stock-card",
        icon: ClipboardList,
      },
      {
        name: "ทะเบียนคุมครุภัณฑ์",
        href: "/assets",
        icon: MonitorCog,
      },
    ],
  },

  {
    title: "หน่วยงาน",
    items: [
      {
        name: "กลุ่มงาน",
        href: "/departments",
        icon: Building2,
      },
      {
        name: "ผู้จำหน่าย",
        href: "/vendors",
        icon: Truck,
        adminOnly: true,
      },
    ],
  },

  {
    title: "ผู้ดูแลระบบ",
    adminOnly: true,
    items: [
      {
        name: "ผู้ใช้งานระบบ",
        href: "/users",
        icon: Users,
      },
    ],
  },
];

export default function MobileMenu({
  role,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* =========================================================
     Filter Menu ตาม Role
     ========================================================= */

  const visibleMenus = menus
    .filter(
      (group) =>
        !group.adminOnly ||
        role === "ADMIN"
    )
    .map((group) => ({
      ...group,

      items: group.items.map((item) => {
        /*
         * ADMIN
         *   /materials
         *
         * STAFF / VIEWER
         *   /materials/summary
         */

        if (
          item.name ===
          "รายการพัสดุทั้งหมด"
        ) {
          return {
            ...item,

            href:
              role === "ADMIN"
                ? "/materials"
                : "/materials/summary",
          };
        }

        return item;
      }),
    }))
    .map((group) => ({
      ...group,

      items: group.items.filter(
        (item) =>
          !item.adminOnly ||
          role === "ADMIN"
      ),
    }))
    .filter(
      (group) =>
        group.items.length > 0
    );

  /* =========================================================
     Active Menu
     ========================================================= */

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <>
      {/* =====================================================
          Mobile Menu Button
      ===================================================== */}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          !text-white
          shadow-lg
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:shadow-xl
          active:scale-95
          md:hidden
        "
        aria-label="เปิดเมนู"
      >
        <Menu
          size={22}
          strokeWidth={2.4}
        />
      </button>

      {/* =====================================================
          Mobile Drawer
      ===================================================== */}

      {open && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            md:hidden
          "
        >
          {/* =================================================
              Overlay
          ================================================= */}

          <div
            className="
              absolute
              inset-0
              bg-slate-950/60
              backdrop-blur-[2px]
            "
            onClick={() => setOpen(false)}
          />

          {/* =================================================
              Drawer
          ================================================= */}

          <aside
            className="
              fixed
              left-0
              top-0
              z-[10000]
              flex
              h-[100dvh]
              w-[256px]
              max-w-[86vw]
              flex-col
              overflow-hidden
              border-r
              border-slate-700
              bg-gradient-to-b
              from-slate-950
              via-slate-900
              to-slate-800
              text-white
              shadow-2xl
            "
          >
            {/* =================================================
                Header
            ================================================= */}

            <div
              className="
                shrink-0
                border-b
                border-slate-700
                bg-gradient-to-r
                from-slate-950
                via-slate-800
                to-slate-700
                px-3
                py-3
                shadow-lg
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-2
                "
              >
                {/* =============================================
                    Logo + System Name
                ============================================= */}

                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-2.5
                  "
                >
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      shadow-md
                    "
                  >
                    <img
                      src="/images/dohl-logo.png"
                      alt="กรมอนามัย"
                      className="
                        h-8
                        w-8
                        object-contain
                      "
                    />
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        truncate
                        text-[15px]
                        font-extrabold
                        leading-tight
                        !text-white
                      "
                    >
                      ระบบบริหารคลังพัสดุ
                    </div>

                    <div
                      className="
                        mt-0.5
                        truncate
                        text-xs
                        font-bold
                        !text-cyan-400
                      "
                    >
                      สำนักอนามัยการเจริญพันธุ์
                    </div>
                  </div>
                </div>

                {/* =============================================
                    Close Button
                ============================================= */}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-600
                    bg-slate-800
                    !text-white
                    shadow-md
                    transition-all
                    duration-200
                    hover:border-slate-500
                    hover:bg-slate-700
                    hover:shadow-lg
                    active:scale-95
                  "
                  aria-label="ปิดเมนู"
                >
                  <X
                    size={19}
                    strokeWidth={2.4}
                  />
                </button>
              </div>
            </div>

            {/* =================================================
                Menu
            ================================================= */}

            <nav
              className="
                flex-1
                space-y-4
                overflow-y-auto
                px-3
                py-4
              "
            >
              {visibleMenus.map((group) => (
                <div
                  key={group.title}
                >
                  {/* =========================================
                      Group Title
                  ========================================= */}

                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      gap-2
                      px-2
                    "
                  >
                    <div
                      className="
                        h-1
                        w-8
                        rounded-full
                        bg-gradient-to-r
                        from-blue-500
                        to-cyan-400
                      "
                    />

                    <p
                      className="
                        text-[15px]
                        font-black
                        tracking-wide
                        !text-slate-200
                      "
                    >
                      {group.title}
                    </p>
                  </div>

                  {/* =========================================
                      Group Items
                  ========================================= */}

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const active =
                        isActive(item.href);

                      const Icon =
                        item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() =>
                            setOpen(false)
                          }
                          className={`
                            group
                            flex
                            min-h-11
                            items-center
                            gap-2.5
                            rounded-xl
                            border
                            px-3
                            py-2
                            transition-all
                            duration-200

                            ${
                              active
                                ? `
                                  border-blue-400/40
                                  bg-gradient-to-r
                                  from-blue-600
                                  via-blue-500
                                  to-cyan-500
                                  !text-white
                                  shadow-lg
                                  shadow-blue-950/40
                                `
                                : `
                                  border-slate-700/50
                                  bg-slate-900/40
                                  !text-white
                                  hover:border-slate-600
                                  hover:bg-gradient-to-r
                                  hover:from-slate-800
                                  hover:to-slate-700
                                `
                            }
                          `}
                        >
                          {/* =================================
                              Icon
                          ================================= */}

                          <div
                            className={`
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              transition-all
                              duration-200

                              ${
                                active
                                  ? `
                                    bg-white/20
                                    shadow-sm
                                  `
                                  : `
                                    bg-slate-800
                                    group-hover:bg-slate-700
                                  `
                              }
                            `}
                          >
                            <Icon
                              size={18}
                              strokeWidth={2.2}
                            />
                          </div>

                          {/* =================================
                              Text
                          ================================= */}

                          <span
                            className="
                              min-w-0
                              whitespace-nowrap
                              text-[15px]
                              font-extrabold
                              leading-tight
                              !text-white
                            "
                          >
                            {item.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* =================================================
                Bottom Decoration
            ================================================= */}

            <div
              className="
                shrink-0
                border-t
                border-slate-700
                bg-gradient-to-r
                from-slate-950
                via-slate-900
                to-slate-800
                px-4
                py-3
              "
            >
              <div
                className="
                  text-center
                  text-xs
                  font-bold
                  !text-slate-300
                "
              >
                ระบบบริหารคลังพัสดุ
              </div>

              <div
                className="
                  mt-0.5
                  text-center
                  text-[11px]
                  font-semibold
                  !text-slate-500
                "
              >
                สำนักอนามัยการเจริญพันธุ์
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}