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

  const [
    openMenu,
    setOpenMenu,
  ] = useState<string | null>(
    null
  );

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadNotifications =
      async () => {
        try {
          const response =
            await fetch(
              "/api/notifications",
              {
                cache:
                  "no-store",
              }
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          if (mounted) {
            setNotificationCount(
              Number(
                data.count ??
                  0
              )
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
      if (
        event.key ===
        "Escape"
      ) {
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
            role ===
            "ADMIN"
              ? "/materials"
              : "/materials/summary",

          icon: Boxes,
        },

        {
          name:
            "รายการรับเข้า",

          href:
            "/receive",

          icon:
            PackagePlus,

          adminOnly: true,
        },

        {
          name:
            "รายการเบิกจ่าย",

          href:
            "/issue",

          icon:
            PackageMinus,
        },
      ],
    },

    {
      title:
        "ทะเบียนคุมพัสดุ",

      icon:
        LibraryBig,

      items: [
        {
          name:
            "ทะเบียนคุมบัญชีพัสดุ",

          href:
            "/stock-card",

          icon:
            ClipboardList,
        },

        {
          name:
            "ทะเบียนคุมบัญชีครุภัณฑ์",

          href:
            "/assets",

          icon:
            MonitorCog,
        },
      ],
    },

    {
      title:
        "หน่วยงาน",

      icon:
        Landmark,

      items: [
        {
          name:
            "ผู้จำหน่าย",

          href:
            "/vendors",

          icon:
            Truck,

          adminOnly:
            true,
        },

        {
          name:
            "กลุ่มงาน",

          href:
            "/departments",

          icon:
            Building2,
        },
      ],
    },

    {
      title:
        "เกี่ยวกับเรา",

      icon:
        Info,

      adminOnly:
        true,

      items: [
        {
          name:
            "ผู้ใช้งานระบบ",

          href:
            "/users",

          icon:
            Users,
        },
      ],
    },
  ];

  /* =======================================================
     ROLE FILTER
  ======================================================= */

  const visibleMenus =
    menus
      .filter(
        (group) =>
          !group.adminOnly ||
          role ===
            "ADMIN"
      )
      .map(
        (group) => ({
          ...group,

          items:
            group.items.filter(
              (item) =>
                !item.adminOnly ||
                role ===
                  "ADMIN"
            ),
        })
      )
      .filter(
        (group) =>
          group.items.length >
          0
      );

  /* =======================================================
     ACTIVE GROUP
  ======================================================= */

  const isGroupActive = (
    group: MenuGroup
  ) => {
    return group.items.some(
      (item) =>
        pathname ===
          item.href ||
        (item.href !==
          "/" &&
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

    h-[52px]
    min-w-0

    items-center
    justify-center

    gap-2.5

    overflow-hidden

    rounded-[17px]

    border

    px-3

    text-[14px]
    font-extrabold
    tracking-tight

    transition-all
    duration-300
    ease-out

    xl:h-[54px]
    xl:px-4
    xl:text-[15px]

    2xl:px-5
    2xl:text-base
  `;

  const inactiveMainItem = `
    border-transparent

    bg-transparent

    !text-slate-600

    hover:-translate-y-0.5

    hover:border-white/90

    hover:bg-white/75

    hover:!text-slate-900

    hover:shadow-[0_12px_30px_-22px_rgba(15,23,42,0.35)]

    active:translate-y-0
    active:scale-[0.98]
  `;

  const activeMainItem = `
    border-blue-400/20

    bg-gradient-to-br
    from-blue-500
    via-blue-600
    to-indigo-600

    !text-white

    shadow-[0_12px_28px_-14px_rgba(37,99,235,0.65)]

    ring-1
    ring-white/30

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

        bg-transparent

        px-2
        pb-2
        pt-1

        sm:px-3

        lg:block

        xl:px-4
      "
    >
      {/* ===================================================
          NAVIGATION GLASS
      =================================================== */}

      <div
        ref={
          navigationRef
        }
        className="
          relative

          mx-auto

          flex
          min-h-[68px]

          w-full
          max-w-[1920px]

          items-center
          justify-center

          overflow-visible

          rounded-[24px]

          border
          border-white/80

          bg-white/75

          px-2
          py-2

          shadow-[0_18px_50px_-32px_rgba(15,23,42,0.55)]

          backdrop-blur-2xl
          backdrop-saturate-150

          ring-1
          ring-slate-900/[0.025]

          xl:min-h-[72px]
          xl:px-3
        "
      >
        {/* =================================================
            AMBIENT LIGHT
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-[10%]
            top-0

            h-20
            w-64

            rounded-full

            bg-blue-300/20

            blur-[55px]
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-[12%]
            top-0

            h-20
            w-64

            rounded-full

            bg-cyan-200/20

            blur-[55px]
          "
        />

        {/* =================================================
            TOP LIGHT
        ================================================= */}

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
            via-white
            to-transparent
          "
        />

        {/* =================================================
            NAV
        ================================================= */}

        <nav
          className="
            relative
            z-10

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
              HOME
          ================================================= */}

          <Link
            href="/"
            prefetch
            onClick={() =>
              setOpenMenu(
                null
              )
            }
            className={`
              ${mainItemBase}

              flex-1

              ${
                pathname ===
                  "/" &&
                openMenu ===
                  null
                  ? activeMainItem
                  : inactiveMainItem
              }
            `}
          >
            {/* ===============================================
                ICON
            =============================================== */}

            <span
              className={`
                relative

                flex
                h-8
                w-8
                shrink-0

                items-center
                justify-center

                rounded-[11px]

                transition-all
                duration-300

                ${
                  pathname ===
                    "/" &&
                  openMenu ===
                    null
                    ? `
                      bg-white/15

                      ring-1
                      ring-white/20
                    `
                    : `
                      bg-slate-100/80

                      ring-1
                      ring-slate-200/70

                      group-hover:bg-white
                    `
                }

                group-hover:scale-105
              `}
            >
              <LayoutDashboard
                size={18}
                strokeWidth={
                  2.4
                }
              />
            </span>

            <span
              className="
                whitespace-nowrap
              "
            >
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
              setOpenMenu(
                null
              )
            }
            className={`
              ${mainItemBase}

              flex-1

              ${
                pathname ===
                  "/notifications" &&
                openMenu ===
                  null
                  ? activeMainItem
                  : inactiveMainItem
              }
            `}
          >
            {/* ===============================================
                ICON
            =============================================== */}

            <span
              className={`
                relative

                flex
                h-8
                w-8
                shrink-0

                items-center
                justify-center

                rounded-[11px]

                transition-all
                duration-300

                ${
                  pathname ===
                    "/notifications" &&
                  openMenu ===
                    null
                    ? `
                      bg-white/15

                      ring-1
                      ring-white/20
                    `
                    : `
                      bg-slate-100/80

                      ring-1
                      ring-slate-200/70

                      group-hover:bg-white
                    `
                }

                group-hover:scale-105
              `}
            >
              <Bell
                size={18}
                strokeWidth={
                  2.4
                }
              />

              {/* =============================================
                  NOTIFICATION DOT
              ============================================= */}

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
                    border-white

                    bg-red-500

                    shadow-[0_0_8px_rgba(239,68,68,0.55)]
                  "
                />
              )}
            </span>

            <span
              className="
                whitespace-nowrap
              "
            >
              การแจ้งเตือน
            </span>

            {/* ===============================================
                BADGE
            =============================================== */}

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

                  bg-red-500

                  px-1.5

                  text-[10px]
                  font-black

                  !text-white

                  shadow-[0_6px_16px_-8px_rgba(239,68,68,0.65)]

                  ring-1
                  ring-white/40
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
              DROPDOWN GROUPS
          ================================================= */}

          {visibleMenus.map(
            (group) => {
              const active =
                isGroupActive(
                  group
                );

              const isOpen =
                openMenu ===
                group.title;

              const GroupIcon =
                group.icon;

              return (
                <div
                  key={
                    group.title
                  }
                  className="
                    relative
                    min-w-0
                    flex-1
                  "
                >
                  {/* =========================================
                      MAIN BUTTON
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
                    {/* =======================================
                        ICON
                    ======================================= */}

                    <span
                      className={`
                        flex
                        h-8
                        w-8
                        shrink-0

                        items-center
                        justify-center

                        rounded-[11px]

                        transition-all
                        duration-300

                        ${
                          active ||
                          isOpen
                            ? `
                              bg-white/15

                              ring-1
                              ring-white/20
                            `
                            : `
                              bg-slate-100/80

                              ring-1
                              ring-slate-200/70

                              group-hover:bg-white
                            `
                        }

                        group-hover:scale-105
                      `}
                    >
                      <GroupIcon
                        size={18}
                        strokeWidth={
                          2.35
                        }
                      />
                    </span>

                    {/* =======================================
                        TEXT
                    ======================================= */}

                    <span
                      className="
                        min-w-0
                        whitespace-nowrap
                      "
                    >
                      {
                        group.title
                      }
                    </span>

                    {/* =======================================
                        CHEVRON
                    ======================================= */}

                    <ChevronDown
                      size={16}
                      strokeWidth={
                        2.5
                      }
                      className={`
                        shrink-0

                        opacity-70

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

                    {/* =======================================
                        IOS TOP SHINE
                    ======================================= */}

                    {(active ||
                      isOpen) && (
                      <span
                        aria-hidden="true"
                        className="
                          pointer-events-none

                          absolute
                          inset-x-5
                          top-px

                          h-px

                          bg-gradient-to-r
                          from-transparent
                          via-white/70
                          to-transparent
                        "
                      />
                    )}
                  </button>

                  {/* =========================================
                      DROPDOWN
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

                      rounded-[26px]

                      border
                      border-white/90

                      bg-white/90

                      p-2.5

                      shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)]

                      backdrop-blur-2xl
                      backdrop-saturate-150

                      ring-1
                      ring-slate-900/[0.035]

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
                    {/* =======================================
                        AMBIENT GLOW
                    ======================================= */}

                    <div
                      aria-hidden="true"
                      className="
                        pointer-events-none
                        absolute
                        -right-8
                        -top-10

                        h-32
                        w-32

                        rounded-full

                        bg-blue-300/20

                        blur-3xl
                      "
                    />

                    {/* =======================================
                        TOP LIGHT
                    ======================================= */}

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
                        via-white
                        to-transparent
                      "
                    />

                    {/* =======================================
                        TITLE
                    ======================================= */}

                    <div
                      className="
                        relative
                        z-10

                        flex
                        items-center
                        gap-2

                        px-3
                        pb-2
                        pt-2
                      "
                    >
                      <span
                        className="
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center

                          rounded-[9px]

                          bg-blue-50

                          !text-blue-600

                          ring-1
                          ring-blue-100
                        "
                      >
                        <GroupIcon
                          size={14}
                          strokeWidth={
                            2.4
                          }
                        />
                      </span>

                      <span
                        className="
                          text-[11px]
                          font-black
                          uppercase
                          tracking-[0.08em]

                          !text-slate-400
                        "
                      >
                        {
                          group.title
                        }
                      </span>
                    </div>

                    {/* =======================================
                        ITEMS
                    ======================================= */}

                    <div
                      className="
                        relative
                        z-10
                        space-y-1
                      "
                    >
                      {group.items.map(
                        (
                          item
                        ) => {
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
                                      border-blue-400/20

                                      bg-gradient-to-br
                                      from-blue-500
                                      via-blue-600
                                      to-indigo-600

                                      !text-white

                                      shadow-[0_12px_26px_-14px_rgba(37,99,235,0.55)]

                                      ring-1
                                      ring-white/25
                                    `
                                    : `
                                      border-transparent

                                      !text-slate-700

                                      hover:translate-x-0.5

                                      hover:border-slate-200/80

                                      hover:bg-slate-50/90

                                      hover:!text-slate-950

                                      hover:shadow-sm
                                    `
                                }
                              `}
                            >
                              {/* =================================
                                  ITEM ICON
                              ================================= */}

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
                                        border-white/20

                                        bg-white/15
                                      `
                                      : `
                                        border-slate-200/80

                                        bg-white

                                        !text-slate-500

                                        shadow-sm

                                        group-hover/item:border-blue-100
                                        group-hover/item:bg-blue-50
                                        group-hover/item:!text-blue-600
                                      `
                                  }
                                `}
                              >
                                <Icon
                                  size={18}
                                  strokeWidth={
                                    2.3
                                  }
                                />
                              </span>

                              {/* =================================
                                  NAME
                              ================================= */}

                              <span
                                className="
                                  min-w-0
                                  flex-1
                                  whitespace-nowrap
                                "
                              >
                                {
                                  item.name
                                }
                              </span>

                              {/* =================================
                                  ARROW
                              ================================= */}

                              <span
                                className={`
                                  flex
                                  h-7
                                  w-7
                                  shrink-0
                                  items-center
                                  justify-center

                                  rounded-full

                                  transition-all
                                  duration-300

                                  ${
                                    itemActive
                                      ? `
                                        bg-white/15

                                        !text-white
                                      `
                                      : `
                                        bg-slate-100

                                        !text-slate-400

                                        group-hover/item:bg-blue-100
                                        group-hover/item:!text-blue-600
                                      `
                                  }
                                `}
                              >
                                <ArrowRight
                                  size={
                                    14
                                  }
                                  strokeWidth={
                                    2.4
                                  }
                                  className="
                                    transition-transform
                                    duration-300

                                    group-hover/item:translate-x-0.5
                                  "
                                />
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