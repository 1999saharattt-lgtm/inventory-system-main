"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ElementType } from "react";

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

type SidebarProps = {
  role: UserRole;
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const [notificationCount, setNotificationCount] = useState(0);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // =====================================================
  // โหลดจำนวนแจ้งเตือน
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (mounted) {
          setNotificationCount(Number(data.count ?? 0));
        }
      } catch (error) {
        console.error(
          "ไม่สามารถโหลดจำนวนการแจ้งเตือนได้:",
          error
        );
      }
    };

    loadNotifications();

    // ตรวจสอบใหม่ทุก 30 วินาที
    const interval = window.setInterval(
      loadNotifications,
      30000
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  // =====================================================
  // เมนูหลัก
  //
  // หน้าแรก = เข้า Dashboard โดยตรง
  // การแจ้งเตือน = ต่อจากหน้าแรก
  // รายการพัสดุ / หน่วยงาน / เกี่ยวกับเรา = Dropdown
  // =====================================================

  const menus: MenuGroup[] = [
    {
      title: "รายการพัสดุ",
      items: [
        {
          name: "รายการพัสดุทั้งหมด",
          href:
            role === "ADMIN"
              ? "/materials"
              : "/materials/summary",
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

    // =====================================================
    // หน่วยงาน
    // =====================================================

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

    // =====================================================
    // เกี่ยวกับเรา
    //
    // เฉพาะ ADMIN
    // =====================================================

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

  // =====================================================
  // Filter Menu ตาม Role
  // =====================================================

  const visibleMenus = menus
    .filter(
      (group) =>
        !group.adminOnly || role === "ADMIN"
    )
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.adminOnly || role === "ADMIN"
      ),
    }))
    .filter(
      (group) => group.items.length > 0
    );

  // =====================================================
  // ตรวจสอบว่า Dropdown ไหน Active
  // =====================================================

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" &&
          pathname.startsWith(item.href))
    );
  };

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
      {/* =====================================================
          Main Navigation
      ===================================================== */}

      <div
        className="
          flex
          min-h-[76px]
          w-full
          items-center
          justify-center
          px-3
          py-2
          sm:min-h-[88px]
          sm:px-6
          sm:py-3
        "
      >
        <nav
          className="
            flex
            w-full
            items-center
            justify-center
            gap-1
            sm:gap-2
          "
        >
          {/* =================================================
              หน้าแรก
              กดแล้วเข้า Dashboard โดยตรง
          ================================================= */}

          <Link
            href="/"
            onClick={() => setOpenMenu(null)}
            className={`
              flex
              shrink-0
              items-center
              gap-2
              rounded-xl
              px-4
              py-3
              text-xl
              font-extrabold
              transition-all
              duration-200
              sm:px-5
              sm:py-4
              sm:text-2xl
              ${
                pathname === "/"
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
              size={24}
              strokeWidth={2.5}
            />

            <span className="whitespace-nowrap">
              หน้าแรก
            </span>
          </Link>

          {/* =================================================
              การแจ้งเตือน
              อยู่ต่อจากหน้าแรก
          ================================================= */}

          <Link
            href="/notifications"
            onClick={() => setOpenMenu(null)}
            className={`
              relative
              flex
              shrink-0
              items-center
              gap-2
              rounded-xl
              px-4
              py-3
              text-xl
              font-extrabold
              transition-all
              duration-200
              sm:px-5
              sm:py-4
              sm:text-2xl
              ${
                pathname === "/notifications"
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
              size={24}
              strokeWidth={2.5}
            />

            <span className="whitespace-nowrap">
              การแจ้งเตือน
            </span>

            {notificationCount > 0 && (
              <span
                className="
                  flex
                  min-w-6
                  h-6
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  px-1.5
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
            const active = isGroupActive(group);
            const isOpen =
              openMenu === group.title;

            return (
              <div
                key={group.title}
                className="relative shrink-0"
              >
                {/* Main Group Button */}

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
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    px-4
                    py-3
                    text-lg
                    font-extrabold
                    !text-white
                    transition-all
                    duration-200
                    sm:px-5
                    sm:py-4
                    sm:text-xl
                    ${
                      active || isOpen
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
                    size={21}
                    strokeWidth={2.5}
                    className={`
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
                    Dropdown
                ================================================= */}

                {isOpen && (
                  <div
                    className="
                      absolute
                      left-1/2
                      top-full
                      z-50
                      mt-2
                      w-[300px]
                      -translate-x-1/2
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-700
                      bg-slate-900
                      shadow-2xl
                    "
                  >
                    <div className="p-2">
                      {group.items.map((item) => {
                        const itemActive =
                          pathname === item.href ||
                          (item.href !== "/" &&
                            pathname.startsWith(
                              item.href
                            ));

                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() =>
                              setOpenMenu(null)
                            }
                            className={`
                              flex
                              items-center
                              gap-3
                              rounded-xl
                              px-4
                              py-3.5
                              text-lg
                              font-extrabold
                              transition-all
                              duration-200
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
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                ${
                                  itemActive
                                    ? "bg-white/20"
                                    : "bg-slate-800"
                                }
                              `}
                            >
                              <Icon
                                size={21}
                                strokeWidth={2.3}
                              />
                            </div>

                            <span className="whitespace-nowrap">
                              {item.name}
                            </span>
                          </Link>
                        );
                      })}
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