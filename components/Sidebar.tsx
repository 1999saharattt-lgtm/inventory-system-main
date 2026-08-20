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

  const menus: MenuGroup[] = [
    {
      title: "หน้าแรก",
      items: [
        {
          name: "ภาพรวมระบบ",
          href: "/",
          icon: LayoutDashboard,
        },
        {
          name: "การแจ้งเตือน",
          href: "/notifications",
          icon: Bell,
        },
      ],
    },

    {
      title: "รายงานพัสดุ",
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
      title: "ผู้ดูแลระบบ",
      adminOnly: true,
      items: [
        {
          name: "ผู้จำหน่าย",
          href: "/vendors",
          icon: Truck,
        },
        {
          name: "กลุ่มงาน",
          href: "/departments",
          icon: Building2,
        },
        {
          name: "ผู้ใช้งานระบบ",
          href: "/users",
          icon: Users,
        },
      ],
    },
  ];

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

  return (
    <aside
      className="
        hidden
        md:block
        w-72
        shrink-0
        min-h-screen
        border-r
        border-slate-800
        bg-gradient-to-b
        from-slate-950
        via-slate-900
        to-slate-900
        shadow-2xl
      "
    >
      {/* Logo */}

      <div className="border-b border-slate-800 p-5">
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-xl
          "
        >
          <div className="flex items-center gap-4">
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                shadow-inner
              "
            >
              <img
                src="/images/dohl-logo.png"
                alt="กรมอนามัย"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1
                className="
                  truncate
                  text-lg
                  font-extrabold
                  text-slate-800
                "
              >
                ระบบบริหารคลังพัสดุ
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-blue-600
                "
              >
                สำนักอนามัยการเจริญพันธุ์
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav
        className="
          space-y-8
          px-4
          py-6
        "
      >
        {visibleMenus.map((group) => (
          <div key={group.title}>
            <div className="mb-3 px-3">
              <p
                className="
                  sidebar-title
                  mb-3
                  text-lg
                  font-black
                  tracking-[0.15em]
                "
              >
                {group.title}
              </p>
            </div>

            <div className="space-y-2">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" &&
                    pathname.startsWith(item.href));

                const Icon = item.icon;

                const isNotification =
                  item.href === "/notifications";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group
                      relative
                      flex
                      items-center
                      gap-3
                      overflow-hidden
                      rounded-2xl
                      px-4
                      py-3
                      transition-all
                      duration-300

                      ${
                        active
                          ? `
                            bg-gradient-to-r
                            from-blue-600
                            to-cyan-500
                            text-white
                            shadow-xl
                            shadow-blue-900/40
                          `
                          : `
                            text-slate-300
                            hover:bg-slate-800
                            hover:text-white
                            hover:translate-x-1
                          `
                      }
                    `}
                  >
                    {active && (
                      <div
                        className="
                          absolute
                          left-0
                          top-3
                          h-8
                          w-1
                          rounded-r-full
                          bg-white
                        "
                      />
                    )}

                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        transition-all

                        ${
                          active
                            ? "bg-white/20"
                            : "bg-slate-800 group-hover:bg-slate-700"
                        }
                      `}
                    >
                      <Icon
                        size={20}
                        strokeWidth={2.2}
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <span
                        className="
                          whitespace-nowrap
                          text-[17px]
                          font-extrabold
                          leading-tight
                          text-white
                        "
                      >
                        {item.name}
                      </span>
                    </div>

                    {/* จำนวนแจ้งเตือน */}
                    {isNotification &&
                      notificationCount > 0 && (
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

                    <div
                      className={`
                        transition-all
                        duration-300

                        ${
                          active
                            ? "translate-x-0 opacity-100"
                            : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        }
                      `}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}