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

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [openMenu, setOpenMenu] = useState<string | null>(
    null
  );

  // =====================================================
  // โหลดจำนวนแจ้งเตือน
  // =====================================================

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
  // =====================================================

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

  // =====================================================
  // กรองเมนูตามสิทธิ์
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
  // ตรวจสอบว่าหัวข้อหลักใดเป็นหน้าปัจจุบัน
  // =====================================================

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some((item) => {
      return (
        pathname === item.href ||
        (item.href !== "/" &&
          pathname.startsWith(item.href))
      );
    });
  };

  return (
    <aside
      className="
        relative
        z-50
        w-full
        border-b
        border-slate-800
        bg-gradient-to-r
        from-slate-950
        via-slate-900
        to-slate-800
        shadow-2xl
      "
    >
      {/* =====================================================
          Logo / ชื่อระบบ
          ===================================================== */}

      <div
        className="
          border-b
          border-slate-800
          px-3
          py-3
          sm:px-6
          sm:py-4
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1800px]
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white
              shadow-lg
              sm:h-14
              sm:w-14
            "
          >
            <img
              src="/images/dohl-logo.png"
              alt="กรมอนามัย"
              className="
                h-9
                w-9
                object-contain
                sm:h-10
                sm:w-10
              "
            />
          </div>

          <div className="min-w-0">
            <h1
              className="
                truncate
                text-base
                font-extrabold
                text-white
                sm:text-xl
              "
            >
              ระบบบริหารคลังพัสดุ
            </h1>

            <p
              className="
                mt-0.5
                truncate
                text-xs
                font-semibold
                text-cyan-400
                sm:text-sm
              "
            >
              สำนักอนามัยการเจริญพันธุ์
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          Navigation
          ===================================================== */}

      <div
        className="
          mx-auto
          max-w-[1800px]
          px-3
          py-3
          sm:px-6
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
          {/* =================================================
              เมนูหลัก
              ================================================= */}

          <nav
            className="
              min-w-0
              flex-1
              overflow-x-auto
            "
          >
            <div
              className="
                flex
                min-w-max
                items-center
                gap-2
                sm:gap-3
              "
            >
              {visibleMenus.map((group) => {
                const activeGroup =
                  isGroupActive(group);

                const isOpen =
                  openMenu === group.title;

                return (
                  <div
                    key={group.title}
                    className="relative"
                  >
                    {/* หัวข้อใหญ่ */}

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
                        group
                        flex
                        min-w-[130px]
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        px-4
                        py-3
                        text-base
                        font-extrabold
                        transition-all
                        duration-200
                        sm:min-w-[155px]
                        sm:px-5
                        sm:text-lg

                        ${
                          activeGroup || isOpen
                            ? `
                              bg-gradient-to-r
                              from-blue-600
                              to-cyan-500
                              text-white
                              shadow-lg
                              shadow-blue-900/30
                            `
                            : `
                              text-slate-200
                              hover:bg-slate-800
                              hover:text-white
                            `
                        }
                      `}
                    >
                      <span>
                        {group.title}
                      </span>

                      <ChevronDown
                        size={18}
                        strokeWidth={2.5}
                        className={`
                          transition-transform
                          duration-200

                          ${
                            isOpen
                              ? "rotate-180"
                              : "rotate-0"
                          }
                        `}
                      />
                    </button>

                    {/* =================================================
                        เมนูย่อย
                        ================================================= */}

                    {isOpen && (
                      <div
                        className="
                          absolute
                          left-0
                          top-full
                          z-[100]
                          mt-2
                          w-[280px]
                          overflow-hidden
                          rounded-2xl
                          border
                          border-slate-700
                          bg-gradient-to-br
                          from-slate-950
                          to-slate-800
                          p-2
                          shadow-2xl
                        "
                      >
                        <div className="space-y-1">
                          {group.items.map(
                            (item) => {
                              const active =
                                pathname ===
                                  item.href ||
                                (item.href !== "/" &&
                                  pathname.startsWith(
                                    item.href
                                  ));

                              const Icon =
                                item.icon;

                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className={`
                                    group
                                    flex
                                    items-center
                                    gap-3
                                    rounded-xl
                                    px-3
                                    py-3
                                    transition-all
                                    duration-200

                                    ${
                                      active
                                        ? `
                                          bg-gradient-to-r
                                          from-blue-600
                                          to-cyan-500
                                          text-white
                                          shadow-lg
                                        `
                                        : `
                                          text-slate-200
                                          hover:bg-slate-800
                                          hover:text-white
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
                                        active
                                          ? "bg-white/20"
                                          : "bg-slate-800 group-hover:bg-slate-700"
                                      }
                                    `}
                                  >
                                    <Icon
                                      size={20}
                                      strokeWidth={
                                        2.2
                                      }
                                    />
                                  </div>

                                  <span
                                    className="
                                      min-w-0
                                      flex-1
                                      text-[16px]
                                      font-extrabold
                                    "
                                  >
                                    {item.name}
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
            </div>
          </nav>

          {/* =================================================
              การแจ้งเตือน
              แยกออกจากเมนูหลัก
              ================================================= */}

          <Link
            href="/notifications"
            className={`
              group
              flex
              shrink-0
              items-center
              gap-2
              rounded-xl
              px-3
              py-3
              font-extrabold
              transition-all
              duration-200
              sm:px-4

              ${
                pathname === "/notifications"
                  ? `
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-500
                    text-white
                    shadow-lg
                    shadow-blue-900/30
                  `
                  : `
                    bg-slate-800
                    text-slate-200
                    hover:bg-slate-700
                    hover:text-white
                  `
              }
            `}
          >
            <div className="relative">
              <Bell
                size={21}
                strokeWidth={2.4}
              />

              {notificationCount > 0 && (
                <span
                  className="
                    absolute
                    -right-3
                    -top-3
                    flex
                    min-h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[11px]
                    font-extrabold
                    text-white
                    shadow-lg
                    shadow-red-900/30
                  "
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </div>

            <span
              className="
                hidden
                whitespace-nowrap
                sm:inline
              "
            >
              การแจ้งเตือน
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}