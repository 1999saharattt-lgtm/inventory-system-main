"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";
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

type UserRole =
  | "ADMIN"
  | "STAFF"
  | "VIEWER";

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

export default function Sidebar({
  role,
}: SidebarProps) {
  const pathname = usePathname();

  const navigationRef =
    useRef<HTMLDivElement | null>(null);

  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);

  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  // =====================================================
  // โหลดจำนวนแจ้งเตือน
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadNotifications =
      async () => {
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

          const data =
            await response.json();

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
    const interval =
      window.setInterval(
        loadNotifications,
        30000
      );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  // =====================================================
  // เมื่อเปลี่ยนหน้า
  // ปิด Dropdown อัตโนมัติ
  // =====================================================

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  // =====================================================
  // ปิด Dropdown เมื่อคลิกด้านนอก
  // หรือกด Escape
  // =====================================================

  useEffect(() => {
    const handlePointerDown = (
      event: MouseEvent
    ) => {
      if (
        navigationRef.current &&
        !navigationRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // =====================================================
  // เมนูหลัก
  //
  // หน้าแรก = เข้า Dashboard โดยตรง
  // การแจ้งเตือน = ต่อจากหน้าแรก
  // รายการพัสดุ / ทะเบียนคุมพัสดุ / หน่วยงาน / เกี่ยวกับเรา
  // = Dropdown
  // =====================================================

  const menus: MenuGroup[] = [
    {
      title: "รายการพัสดุ",
      items: [
        {
          name:
            "รายการพัสดุทั้งหมด",
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
          name:
            "รายการเบิกจ่าย",
          href: "/issue",
          icon: PackageMinus,
        },
      ],
    },

    // =====================================================
    // ทะเบียนคุมพัสดุ
    // =====================================================

    {
      title: "ทะเบียนคุมพัสดุ",
      items: [
        {
          name:
            "ทะเบียนคุมบัญชีพัสดุ",
          href: "/stock-card",
          icon: ClipboardList,
        },
        {
          name:
            "ทะเบียนคุมบัญชีครุภัณฑ์",
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
    // =====================================================

    {
      title: "เกี่ยวกับเรา",
      adminOnly: true,
      items: [
        {
          name:
            "ผู้ใช้งานระบบ",
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
        !group.adminOnly ||
        role === "ADMIN"
    )
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

  // =====================================================
  // ตรวจสอบว่า Dropdown ไหน Active
  // =====================================================

  const isGroupActive = (
    group: MenuGroup
  ) => {
    return group.items.some(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" &&
          pathname.startsWith(
            item.href
          ))
    );
  };

  // =====================================================
  // Shared style
  // =====================================================

  const mainItemBase = `
    group
    relative
    inline-flex
    h-[54px]
    min-w-0
    items-center
    justify-center
    gap-2
    rounded-[17px]
    border
    px-4
    text-[15px]
    font-extrabold
    tracking-tight
    transition-all
    duration-300
    ease-out
    xl:h-[58px]
    xl:px-5
    xl:text-base
    2xl:text-[17px]
  `;

  const inactiveMainItem = `
    border-transparent
    bg-transparent
    !text-slate-200
    hover:-translate-y-0.5
    hover:border-white/10
    hover:bg-white/10
    hover:!text-white
    hover:shadow-[0_10px_28px_-18px_rgba(0,0,0,0.65)]
    active:translate-y-0
    active:scale-[0.97]
  `;

  const activeMainItem = `
    border-sky-300/20
    bg-gradient-to-r
    from-blue-600
    via-sky-500
    to-cyan-500
    !text-white
    shadow-[0_14px_32px_-18px_rgba(14,165,233,0.8)]
    ring-1
    ring-white/10
    active:scale-[0.97]
  `;

  return (
    <aside
      className="
        relative
        z-40
        hidden
        w-full
        border-b
        border-white/10
        bg-gradient-to-r
        from-slate-950/95
        via-slate-900/95
        to-slate-800/95
        shadow-[0_16px_38px_-26px_rgba(15,23,42,0.9)]
        backdrop-blur-2xl
        lg:block
      "
    >
      {/* =====================================================
          Ambient Light
      ===================================================== */}

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
          via-white/20
          to-transparent
        "
      />

      {/* =====================================================
          Main Navigation
      ===================================================== */}

      <div
        ref={navigationRef}
        className="
          relative
          mx-auto
          flex
          min-h-[68px]
          w-full
          max-w-[1920px]
          items-center
          justify-center
          px-3
          py-2
          xl:min-h-[72px]
          xl:px-5
        "
      >
        <nav
          className="
            flex
            w-full
            min-w-0
            items-center
            justify-center
            gap-1
            xl:gap-1.5
          "
        >
          {/* =================================================
              หน้าแรก
          ================================================= */}

          <Link
            href="/"
            prefetch
            onClick={() =>
              setOpenMenu(null)
            }
            className={`
              ${mainItemBase}
              flex-1
              ${
                pathname === "/" &&
                openMenu === null
                  ? activeMainItem
                  : inactiveMainItem
              }
            `}
          >
            <LayoutDashboard
              size={20}
              strokeWidth={2.4}
              className="
                shrink-0
                transition-transform
                duration-300
                group-hover:scale-105
              "
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
            prefetch
            onClick={() =>
              setOpenMenu(null)
            }
            className={`
              ${mainItemBase}
              flex-1
              ${
                pathname ===
                  "/notifications" &&
                openMenu === null
                  ? activeMainItem
                  : inactiveMainItem
              }
            `}
          >
            <div className="relative shrink-0">
              <Bell
                size={20}
                strokeWidth={2.4}
                className="
                  transition-transform
                  duration-300
                  group-hover:scale-105
                "
              />

              {notificationCount >
                0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    h-2
                    w-2
                    rounded-full
                    bg-red-400
                    shadow-[0_0_10px_rgba(248,113,113,0.9)]
                  "
                />
              )}
            </div>

            <span className="whitespace-nowrap">
              การแจ้งเตือน
            </span>

            {notificationCount >
              0 && (
              <span
                className="
                  flex
                  h-6
                  min-w-6
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-red-300/20
                  bg-red-500
                  px-1.5
                  text-[11px]
                  font-black
                  !text-white
                  shadow-[0_8px_18px_-10px_rgba(239,68,68,0.9)]
                "
              >
                {notificationCount >
                99
                  ? "99+"
                  : notificationCount}
              </span>
            )}
          </Link>

          {/* =================================================
              Dropdown Menus
          ================================================= */}

          {visibleMenus.map(
            (group) => {
              const active =
                isGroupActive(group);

              const isOpen =
                openMenu ===
                group.title;

              return (
                <div
                  key={group.title}
                  className="
                    relative
                    min-w-0
                    flex-1
                  "
                >
                  {/* Main Group Button */}

                  <button
                    type="button"
                    aria-expanded={
                      isOpen
                    }
                    onClick={() =>
                      setOpenMenu(
                        isOpen
                          ? null
                          : group.title
                      )
                    }
                    className={`
                      ${mainItemBase}
                      w-full
                      ${
                        active ||
                        isOpen
                          ? activeMainItem
                          : inactiveMainItem
                      }
                    `}
                  >
                    <span className="whitespace-nowrap">
                      {group.title}
                    </span>

                    <ChevronDown
                      size={17}
                      strokeWidth={
                        2.5
                      }
                      className={`
                        shrink-0
                        transition-transform
                        duration-300
                        ease-out
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

                  <div
                    className={`
                      absolute
                      left-1/2
                      top-full
                      z-50
                      mt-3
                      w-[310px]
                      -translate-x-1/2
                      overflow-hidden
                      rounded-[24px]
                      border
                      border-white/15
                      bg-slate-950/92
                      p-2
                      shadow-[0_24px_70px_-26px_rgba(0,0,0,0.75)]
                      backdrop-blur-2xl
                      transition-all
                      duration-300
                      ease-out
                      ${
                        isOpen
                          ? `
                            visible
                            translate-y-0
                            scale-100
                            opacity-100
                          `
                          : `
                            invisible
                            pointer-events-none
                            -translate-y-2
                            scale-[0.98]
                            opacity-0
                          `
                      }
                    `}
                  >
                    <div
                      aria-hidden="true"
                      className="
                        pointer-events-none
                        absolute
                        inset-x-8
                        top-0
                        h-px
                        bg-gradient-to-r
                        from-transparent
                        via-white/30
                        to-transparent
                      "
                    />

                    <div className="space-y-1">
                      {group.items.map(
                        (item) => {
                          const itemActive =
                            pathname ===
                              item.href ||
                            (item.href !==
                              "/" &&
                              pathname.startsWith(
                                item.href
                              ));

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
                              prefetch
                              onClick={() =>
                                setOpenMenu(
                                  null
                                )
                              }
                              className={`
                                group/item
                                flex
                                items-center
                                gap-3
                                rounded-[18px]
                                px-3
                                py-3
                                text-sm
                                font-extrabold
                                transition-all
                                duration-250
                                ease-out
                                active:scale-[0.985]
                                ${
                                  itemActive
                                    ? `
                                      bg-gradient-to-r
                                      from-blue-600
                                      to-cyan-500
                                      !text-white
                                      shadow-[0_12px_28px_-18px_rgba(14,165,233,0.9)]
                                    `
                                    : `
                                      !text-slate-100
                                      hover:translate-x-0.5
                                      hover:bg-white/10
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
                                  rounded-[14px]
                                  border
                                  transition-all
                                  duration-300
                                  ${
                                    itemActive
                                      ? `
                                        border-white/20
                                        bg-white/20
                                      `
                                      : `
                                        border-white/10
                                        bg-white/5
                                        group-hover/item:bg-white/10
                                      `
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

                              <span className="min-w-0 flex-1 whitespace-nowrap">
                                {
                                  item.name
                                }
                              </span>

                              <span
                                className="
                                  translate-x-0
                                  text-slate-400
                                  opacity-0
                                  transition-all
                                  duration-300
                                  group-hover/item:translate-x-0.5
                                  group-hover/item:opacity-100
                                "
                              >
                                →
                              </span>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </nav>
      </div>
    </aside>
  );
}
