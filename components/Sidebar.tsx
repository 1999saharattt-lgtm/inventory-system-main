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
  PackageSearch,
  LibraryBig,
  Landmark,
  Info,
  ArrowRight,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

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
  icon: ElementType;
  items: MenuItem[];
  adminOnly?: boolean;
};

type SidebarProps = {
  role: UserRole;
};

/* =========================================================
   COMPONENT
========================================================= */

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

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

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

    const interval =
      window.setInterval(
        loadNotifications,
        30000
      );

    return () => {
      mounted = false;

      window.clearInterval(
        interval
      );
    };
  }, []);

  /* =======================================================
     CLOSE WHEN PATH CHANGES
  ======================================================= */

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  /* =======================================================
     CLOSE OUTSIDE / ESC
  ======================================================= */

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

  /* =======================================================
     MENUS
  ======================================================= */

  const menus: MenuGroup[] = [
    {
      title: "รายการพัสดุ",
      icon: PackageSearch,

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

    {
      title: "ทะเบียนคุมพัสดุ",
      icon: LibraryBig,

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

    {
      title: "หน่วยงาน",
      icon: Landmark,

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
      icon: Info,

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

  /* =======================================================
     ROLE FILTER
  ======================================================= */

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

  /* =======================================================
     ACTIVE GROUP
  ======================================================= */

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

  /* =======================================================
     SHARED STYLE
  ======================================================= */

  const mainItemBase = `
    group
    relative

    inline-flex

    h-[56px]
    min-w-0

    items-center
    justify-center

    gap-2.5

    overflow-hidden

    rounded-[18px]

    border

    px-3

    text-[14px]
    font-extrabold
    tracking-tight

    transition-all
    duration-300
    ease-out

    xl:h-[58px]
    xl:px-4
    xl:text-[15px]

    2xl:px-5
    2xl:text-base
  `;

  const inactiveMainItem = `
    border-transparent

    bg-transparent

    !text-slate-300

    hover:-translate-y-0.5

    hover:border-white/[0.1]

    hover:bg-white/[0.07]

    hover:!text-white

    hover:shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]

    active:translate-y-0
    active:scale-[0.98]
  `;

  const activeMainItem = `
    border-sky-300/20

    bg-[linear-gradient(135deg,#2563eb_0%,#0ea5e9_52%,#06b6d4_100%)]

    !text-white

    shadow-[0_15px_32px_-17px_rgba(14,165,233,0.85),inset_0_1px_0_rgba(255,255,255,0.2)]

    ring-1
    ring-white/[0.08]

    active:scale-[0.98]
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <aside
      className="
        relative
        z-40

        hidden
        w-full

        overflow-visible

        border-b
        border-white/[0.08]

        bg-[linear-gradient(115deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.97)_45%,rgba(30,41,59,0.96)_100%)]

        shadow-[0_18px_42px_-28px_rgba(2,6,23,0.95)]

        backdrop-blur-2xl

        lg:block
      "
    >
      {/* ===================================================
          TOP HIGHLIGHT
      =================================================== */}

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
          via-white/[0.18]
          to-transparent
        "
      />

      {/* ===================================================
          AMBIENT LIGHT
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[18%]
          top-0

          h-20
          w-60

          rounded-full

          bg-blue-500/[0.06]

          blur-[55px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-[16%]
          top-0

          h-20
          w-60

          rounded-full

          bg-cyan-400/[0.05]

          blur-[55px]
        "
      />

      {/* ===================================================
          NAVIGATION CONTAINER
      =================================================== */}

      <div
        ref={navigationRef}
        className="
          relative

          mx-auto

          flex
          min-h-[72px]

          w-full
          max-w-[1920px]

          items-center
          justify-center

          px-3
          py-2

          xl:min-h-[76px]
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

            gap-1.5

            xl:gap-2
          "
        >
          {/* =================================================
              HOME
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
            {/* Icon Tile */}

            <span
              className="
                relative

                flex
                h-8
                w-8
                shrink-0

                items-center
                justify-center

                rounded-[11px]

                bg-white/[0.07]

                ring-1
                ring-white/[0.07]

                transition-all
                duration-300

                group-hover:scale-105
                group-hover:bg-white/[0.12]
              "
            >
              <LayoutDashboard
                size={18}
                strokeWidth={2.4}
              />
            </span>

            <span className="whitespace-nowrap">
              หน้าแรก
            </span>
          </Link>

          {/* =================================================
              NOTIFICATIONS
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
            <span
              className="
                relative

                flex
                h-8
                w-8
                shrink-0

                items-center
                justify-center

                rounded-[11px]

                bg-white/[0.07]

                ring-1
                ring-white/[0.07]

                transition-all
                duration-300

                group-hover:scale-105
                group-hover:bg-white/[0.12]
              "
            >
              <Bell
                size={18}
                strokeWidth={2.4}
              />

              {notificationCount >
                0 && (
                <span
                  className="
                    absolute
                    -right-0.5
                    -top-0.5

                    h-2.5
                    w-2.5

                    rounded-full

                    border-2
                    border-slate-900

                    bg-rose-500

                    shadow-[0_0_9px_rgba(244,63,94,0.85)]
                  "
                />
              )}
            </span>

            <span className="whitespace-nowrap">
              การแจ้งเตือน
            </span>

            {notificationCount >
              0 && (
              <span
                className="
                  flex

                  h-[22px]
                  min-w-[22px]

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-white/[0.12]

                  bg-rose-500

                  px-1.5

                  text-[10px]
                  font-black

                  !text-white

                  shadow-[0_8px_18px_-10px_rgba(244,63,94,0.9)]
                "
              >
                {notificationCount > 99
                  ? "99+"
                  : notificationCount}
              </span>
            )}
          </Link>

          {/* =================================================
              DROPDOWN GROUPS
          ================================================= */}

          {visibleMenus.map(
            (group) => {
              const active =
                isGroupActive(group);

              const isOpen =
                openMenu ===
                group.title;

              const GroupIcon =
                group.icon;

              return (
                <div
                  key={group.title}
                  className="
                    relative
                    min-w-0
                    flex-1
                  "
                >
                  {/* =========================================
                      MAIN GROUP BUTTON
                  ========================================= */}

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
                    {/* Icon */}

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0

                        items-center
                        justify-center

                        rounded-[11px]

                        bg-white/[0.07]

                        ring-1
                        ring-white/[0.07]

                        transition-all
                        duration-300

                        group-hover:scale-105
                        group-hover:bg-white/[0.12]
                      "
                    >
                      <GroupIcon
                        size={18}
                        strokeWidth={2.35}
                      />
                    </span>

                    {/* Text */}

                    <span
                      className="
                        min-w-0
                        whitespace-nowrap
                      "
                    >
                      {group.title}
                    </span>

                    {/* Chevron */}

                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`
                        shrink-0

                        opacity-80

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

                    {/* Active Shine */}

                    {(active ||
                      isOpen) && (
                      <span
                        aria-hidden="true"
                        className="
                          pointer-events-none

                          absolute
                          inset-x-5
                          top-0

                          h-px

                          bg-gradient-to-r
                          from-transparent
                          via-white/50
                          to-transparent
                        "
                      />
                    )}
                  </button>

                  {/* =========================================
                      DROPDOWN PANEL
                  ========================================= */}

                  <div
                    className={`
                      absolute

                      left-1/2
                      top-full

                      z-[100]

                      mt-3

                      w-[320px]

                      -translate-x-1/2

                      overflow-hidden

                      rounded-[24px]

                      border
                      border-white/[0.12]

                      bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.97))]

                      p-2.5

                      shadow-[0_30px_80px_-28px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]

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
                            scale-[0.97]
                            opacity-0
                          `
                      }
                    `}
                  >
                    {/* Top Highlight */}

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
                        via-white/35
                        to-transparent
                      "
                    />

                    {/* Dropdown Title */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2

                        px-2.5
                        pb-2
                        pt-1.5
                      "
                    >
                      <GroupIcon
                        size={14}
                        strokeWidth={2.4}
                        className="text-sky-400"
                      />

                      <span
                        className="
                          text-[11px]
                          font-black
                          uppercase
                          tracking-[0.08em]

                          !text-slate-400
                        "
                      >
                        {group.title}
                      </span>
                    </div>

                    {/* Items */}

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

                                border

                                px-3
                                py-2.5

                                text-sm
                                font-extrabold

                                transition-all
                                duration-300
                                ease-out

                                active:scale-[0.985]

                                ${
                                  itemActive
                                    ? `
                                      border-sky-300/20

                                      bg-[linear-gradient(135deg,#2563eb,#0ea5e9,#06b6d4)]

                                      !text-white

                                      shadow-[0_12px_30px_-18px_rgba(14,165,233,0.9),inset_0_1px_0_rgba(255,255,255,0.16)]
                                    `
                                    : `
                                      border-transparent

                                      !text-slate-200

                                      hover:translate-x-0.5

                                      hover:border-white/[0.08]

                                      hover:bg-white/[0.07]

                                      hover:!text-white
                                    `
                                }
                              `}
                            >
                              {/* Item Icon */}

                              <span
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
                                        border-white/[0.18]
                                        bg-white/[0.16]
                                      `
                                      : `
                                        border-white/[0.08]
                                        bg-white/[0.05]

                                        group-hover/item:border-white/[0.12]
                                        group-hover/item:bg-white/[0.1]
                                      `
                                  }
                                `}
                              >
                                <Icon
                                  size={18}
                                  strokeWidth={2.3}
                                />
                              </span>

                              {/* Name */}

                              <span
                                className="
                                  min-w-0
                                  flex-1
                                  whitespace-nowrap
                                "
                              >
                                {item.name}
                              </span>

                              {/* Arrow */}

                              <ArrowRight
                                size={15}
                                strokeWidth={2.4}
                                className="
                                  shrink-0

                                  translate-x-0

                                  opacity-0

                                  transition-all
                                  duration-300

                                  group-hover/item:translate-x-0.5
                                  group-hover/item:opacity-100
                                "
                              />
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