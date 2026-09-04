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
    setOpenMenu(null);
  }

  /* =========================================================
     Responsive Horizontal Navigation
     ========================================================= */

  return (
    <aside
      className="
        relative
        z-40
        w-full
        border-b
        border-slate-700
        bg-gradient-to-r
        from-slate-950
        via-slate-900
        to-slate-800
        shadow-2xl
      "
    >
      <div
        className="
          w-full
          overflow-x-auto
          overflow-y-visible
          scrollbar-thin
          scrollbar-track-slate-900
          scrollbar-thumb-slate-600
        "
      >
        <nav
          className="
            flex
            min-w-max
            items-center
            justify-start
            gap-1
            px-2
            py-1.5
            sm:justify-center
            sm:gap-2
            sm:px-4
            sm:py-2
          "
        >
          {/* =================================================
              หน้าแรก
          ================================================= */}

          <Link
            href="/"
            onClick={closeMenu}
            className={`
              flex
              h-11
              shrink-0
              items-center
              justify-center
              gap-1.5
              rounded-lg
              px-3
              text-base
              font-extrabold
              transition-all
              duration-200
              sm:h-12
              sm:gap-2
              sm:rounded-xl
              sm:px-4
              sm:text-xl

              ${
                pathname === "/" &&
                openMenu === null
                  ? `
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-500
                    !text-white
                    shadow-lg
                  `
                  : `
                    !text-white
                    hover:bg-slate-800
                  `
              }
            `}
          >
            <LayoutDashboard
              size={20}
              strokeWidth={2.5}
              className="sm:h-[23px] sm:w-[23px]"
            />

            <span className="whitespace-nowrap">
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
              h-11
              shrink-0
              items-center
              justify-center
              gap-1.5
              rounded-lg
              px-3
              text-base
              font-extrabold
              transition-all
              duration-200
              sm:h-12
              sm:gap-2
              sm:rounded-xl
              sm:px-4
              sm:text-xl

              ${
                pathname === "/notifications" &&
                openMenu === null
                  ? `
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-500
                    !text-white
                    shadow-lg
                  `
                  : `
                    !text-white
                    hover:bg-slate-800
                  `
              }
            `}
          >
            <Bell
              size={20}
              strokeWidth={2.5}
              className="sm:h-[23px] sm:w-[23px]"
            />

            <span className="whitespace-nowrap">
              การแจ้งเตือน
            </span>

            {notificationCount > 0 && (
              <span
                className="
                  flex
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  px-1.5
                  text-[10px]
                  font-extrabold
                  !text-white
                  shadow-lg
                  sm:h-6
                  sm:min-w-6
                  sm:text-xs
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
              openMenu === group.title;

            return (
              <div
                key={group.title}
                className="
                  relative
                  shrink-0
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
                    h-11
                    shrink-0
                    items-center
                    justify-center
                    gap-1
                    rounded-lg
                    px-3
                    text-base
                    font-extrabold
                    !text-white
                    transition-all
                    duration-200
                    sm:h-12
                    sm:gap-1.5
                    sm:rounded-xl
                    sm:px-4
                    sm:text-xl

                    ${
                      (active &&
                        openMenu === null) ||
                      isOpen
                        ? `
                          bg-gradient-to-r
                          from-blue-600
                          to-cyan-500
                          shadow-lg
                        `
                        : `
                          bg-transparent
                          hover:bg-slate-800
                        `
                    }
                  `}
                >
                  <span className="whitespace-nowrap">
                    {group.title}
                  </span>

                  <ChevronDown
                    size={18}
                    strokeWidth={2.5}
                    className={`
                      shrink-0
                      transition-transform
                      duration-200
                      sm:h-5
                      sm:w-5
                      ${
                        isOpen
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                {/* =================================================
                    Dropdown
                ================================================= */}

                {isOpen && (
                  <div
                    className="
                      absolute
                      left-1/2
                      top-full
                      z-[100]
                      mt-1.5
                      w-[260px]
                      -translate-x-1/2
                      overflow-hidden
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-900
                      shadow-2xl
                      sm:mt-2
                      sm:w-[300px]
                      sm:rounded-2xl
                    "
                  >
                    <div className="p-1.5 sm:p-2">
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
                                min-h-[44px]
                                items-center
                                gap-2
                                rounded-lg
                                px-3
                                py-2
                                text-sm
                                font-extrabold
                                transition-all
                                duration-200
                                sm:min-h-[48px]
                                sm:gap-3
                                sm:rounded-xl
                                sm:px-4
                                sm:py-2.5
                                sm:text-base

                                ${
                                  itemActive
                                    ? `
                                      bg-gradient-to-r
                                      from-blue-600
                                      to-cyan-500
                                      !text-white
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
                                  h-8
                                  w-8
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-lg
                                  sm:h-9
                                  sm:w-9

                                  ${
                                    itemActive
                                      ? "bg-white/20"
                                      : "bg-slate-800"
                                  }
                                `}
                              >
                                <Icon
                                  size={17}
                                  strokeWidth={
                                    2.3
                                  }
                                  className="sm:h-[19px] sm:w-[19px]"
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
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}