"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ElementType } from "react";

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
  Bell,
  Menu,
  X,
  ChevronDown,
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
    title: "รายการพัสดุ",
    items: [
      {
        name: "รายการพัสดุทั้งหมด",
        href: "/materials",
        icon: Boxes,
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
        name: "ผู้จำหน่าย",
        href: "/vendors",
        icon: Truck,
        adminOnly: true,
      },
      {
        name: "กลุ่มงาน",
        href: "/departments",
        icon: Building2,
      },
    ],
  },

  {
    title: "เกี่ยวกับเรา",
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
  const [openMenu, setOpenMenu] = useState<string | null>(
    null
  );

  const [notificationCount, setNotificationCount] =
    useState(0);

  /* =========================================================
     โหลดจำนวนแจ้งเตือน
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch(
          "/api/notifications",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (mounted) {
          setNotificationCount(
            Number(data.count ?? 0)
          );
        }
      } catch (error) {
        console.error(
          "ไม่สามารถโหลดจำนวนการแจ้งเตือนได้:",
          error
        );
      }
    };

    loadNotifications();

    const interval = window.setInterval(
      loadNotifications,
      30000
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

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

  function isGroupActive(group: MenuGroup) {
    return group.items.some((item) =>
      isActive(item.href)
    );
  }

  function closeMenu() {
    setOpen(false);
    setOpenMenu(null);
  }

  /* =========================================================
     Mobile Menu
     ========================================================= */

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
            onClick={closeMenu}
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
              w-[300px]
              max-w-[88vw]
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
                px-4
                py-3
                shadow-lg
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                {/* Logo + System Name */}

                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
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
                        h-9
                        w-9
                        object-contain
                      "
                    />
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        truncate
                        text-base
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

                {/* Close Button */}

                <button
                  type="button"
                  onClick={closeMenu}
                  className="
                    flex
                    h-10
                    w-10
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
                    size={20}
                    strokeWidth={2.4}
                  />
                </button>
              </div>
            </div>

            {/* =================================================
                Main Navigation
            ================================================= */}

            <nav
              className="
                flex-1
                overflow-y-auto
                px-3
                py-4
              "
            >
              <div className="space-y-2">

                {/* =================================================
                    หน้าแรก
                ================================================= */}

                <Link
                  href="/"
                  onClick={closeMenu}
                  className={`
                    flex
                    min-h-[58px]
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    border
                    px-4
                    py-3
                    text-lg
                    font-extrabold
                    transition-all
                    duration-200

                    ${
                      isActive("/") &&
                      openMenu === null
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
                          hover:bg-slate-800
                        `
                    }
                  `}
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
                      bg-white/10
                    "
                  >
                    <LayoutDashboard
                      size={21}
                      strokeWidth={2.4}
                    />
                  </div>

                  <span>
                    หน้าแรก
                  </span>
                </Link>

                {/* =================================================
                    การแจ้งเตือน
                ================================================= */}

                <Link
                  href="/notifications"
                  onClick={closeMenu}
                  className={`
                    relative
                    flex
                    min-h-[58px]
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    border
                    px-4
                    py-3
                    text-lg
                    font-extrabold
                    transition-all
                    duration-200

                    ${
                      isActive(
                        "/notifications"
                      ) &&
                      openMenu === null
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
                          hover:bg-slate-800
                        `
                    }
                  `}
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
                      bg-white/10
                    "
                  >
                    <Bell
                      size={21}
                      strokeWidth={2.4}
                    />
                  </div>

                  <span className="flex-1">
                    การแจ้งเตือน
                  </span>

                  {notificationCount > 0 && (
                    <span
                      className="
                        flex
                        min-w-7
                        h-7
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        px-2
                        text-sm
                        font-extrabold
                        !text-white
                        shadow-lg
                        shadow-red-900/40
                      "
                    >
                      {notificationCount > 99
                        ? "99+"
                        : notificationCount}
                    </span>
                  )}
                </Link>

                {/* =================================================
                    Dropdown Menus
                ================================================= */}

                {visibleMenus.map((group) => {
                  const active =
                    isGroupActive(group);

                  const isOpen =
                    openMenu ===
                    group.title;

                  return (
                    <div
                      key={group.title}
                      className="
                        w-full
                      "
                    >
                      {/* =================================================
                          Group Button
                      ================================================= */}

                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            isOpen
                              ? null
                              : group.title
                          )
                        }
                        className={`
                          flex
                          min-h-[58px]
                          w-full
                          items-center
                          justify-between
                          gap-3
                          rounded-xl
                          border
                          px-4
                          py-3
                          text-lg
                          font-extrabold
                          !text-white
                          transition-all
                          duration-200

                          ${
                            (active &&
                              openMenu === null) ||
                            isOpen
                              ? `
                                border-blue-400/40
                                bg-gradient-to-r
                                from-blue-600
                                via-blue-500
                                to-cyan-500
                                shadow-lg
                                shadow-blue-950/40
                              `
                              : `
                                border-slate-700/50
                                bg-slate-900/40
                                hover:border-slate-600
                                hover:bg-slate-800
                              `
                          }
                        `}
                      >
                        <span>
                          {group.title}
                        </span>

                        <ChevronDown
                          size={23}
                          strokeWidth={2.5}
                          className={`
                            shrink-0
                            transition-transform
                            duration-200
                            ${
                              isOpen
                                ? "rotate-180"
                                : ""
                            }
                          `}
                        />
                      </button>

                      {/* =================================================
                          Dropdown Items
                      ================================================= */}

                      {isOpen && (
                        <div
                          className="
                            mt-2
                            space-y-1.5
                            rounded-2xl
                            border
                            border-slate-700
                            bg-slate-950/70
                            p-2
                            shadow-xl
                          "
                        >
                          {group.items.map(
                            (item) => {
                              const itemActive =
                                isActive(
                                  item.href
                                );

                              const Icon =
                                item.icon;

                              return (
                                <Link
                                  key={
                                    item.href
                                  }
                                  href={
                                    item.href
                                  }
                                  onClick={
                                    closeMenu
                                  }
                                  className={`
                                    flex
                                    min-h-[52px]
                                    w-full
                                    items-center
                                    gap-3
                                    rounded-xl
                                    px-3
                                    py-2.5
                                    text-base
                                    font-extrabold
                                    transition-all
                                    duration-200

                                    ${
                                      itemActive
                                        ? `
                                          bg-gradient-to-r
                                          from-blue-600
                                          via-blue-500
                                          to-cyan-500
                                          !text-white
                                          shadow-lg
                                          shadow-blue-950/30
                                        `
                                        : `
                                          !text-slate-100
                                          hover:bg-slate-800
                                          hover:!text-white
                                        `
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      flex
                                      h-9
                                      w-9
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-lg

                                      ${
                                        itemActive
                                          ? "bg-white/20"
                                          : "bg-slate-800"
                                      }
                                    `}
                                  >
                                    <Icon
                                      size={
                                        19
                                      }
                                      strokeWidth={
                                        2.3
                                      }
                                    />
                                  </div>

                                  <span className="whitespace-nowrap">
                                    {
                                      item.name
                                    }
                                  </span>
                                </Link>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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