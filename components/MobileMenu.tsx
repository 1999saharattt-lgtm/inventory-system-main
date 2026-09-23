"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type ElementType,
} from "react";

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
  Package,
  Building,
  Info,
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

type MobileMenuProps = {
  role: UserRole;
};

/* =========================================================
   MENU CONFIGURATION
========================================================= */

const menus: MenuGroup[] = [
  {
    title: "รายการพัสดุ",
    icon: Package,

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
    icon: Building,

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
        name: "ผู้ใช้งานระบบ",
        href: "/users",
        icon: Users,
      },
    ],
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function MobileMenu({
  role,
}: MobileMenuProps) {
  const pathname = usePathname();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);

  /* =======================================================
     NOTIFICATIONS
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
              Number(
                data.count ?? 0
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
     CLOSE WHEN ROUTE CHANGES
  ======================================================= */

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* =======================================================
     BODY SCROLL + ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow =
        "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        "";

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  /* =======================================================
     FILTER MENU BY ROLE
  ======================================================= */

  const visibleMenus = menus
    .filter(
      (group) =>
        !group.adminOnly ||
        role === "ADMIN"
    )
    .map((group) => ({
      ...group,

      items: group.items
        .map((item) => {
          if (
            item.name ===
            "รายการพัสดุทั้งหมด"
          ) {
            return {
              ...item,

              href:
                role ===
                "ADMIN"
                  ? "/materials"
                  : "/materials/summary",
            };
          }

          return item;
        })
        .filter(
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
     ACTIVE
  ======================================================= */

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  /* =======================================================
     CLOSE
  ======================================================= */

  function closeMenu() {
    setMenuOpen(false);
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* ===================================================
          MOBILE TRIGGER
      =================================================== */}

      <button
        type="button"
        aria-label={
          menuOpen
            ? "ปิดเมนู"
            : "เปิดเมนู"
        }
        aria-expanded={
          menuOpen
        }
        onClick={() =>
          setMenuOpen(
            (current) =>
              !current
          )
        }
        className="
          group
          relative

          inline-flex
          h-11
          w-11
          shrink-0

          items-center
          justify-center

          overflow-hidden

          rounded-[15px]

          border
          border-white/20

          bg-white/10

          !text-white

          shadow-[0_10px_28px_-16px_rgba(0,0,0,0.8)]

          backdrop-blur-xl

          transition-all
          duration-300

          hover:bg-white/15

          active:scale-[0.92]
        "
      >
        {/* Glass highlight */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-1
            top-0

            h-px

            bg-gradient-to-r
            from-transparent
            via-white/60
            to-transparent
          "
        />

        {menuOpen ? (
          <X
            size={22}
            strokeWidth={2.4}
            className="
              relative
              z-10
            "
          />
        ) : (
          <Menu
            size={23}
            strokeWidth={2.4}
            className="
              relative
              z-10
            "
          />
        )}

        {/* Notification Dot */}

        {notificationCount >
          0 &&
          !menuOpen && (
            <span
              className="
                absolute
                right-[5px]
                top-[5px]

                h-2
                w-2

                rounded-full

                bg-red-400

                ring-2
                ring-slate-900

                shadow-[0_0_10px_rgba(248,113,113,0.95)]
              "
            />
          )}
      </button>

      {/* ===================================================
          BACKDROP
      =================================================== */}

      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={`
          fixed
          inset-0
          z-[90]

          bg-slate-950/55

          backdrop-blur-[6px]

          transition-all
          duration-300

          lg:hidden

          ${
            menuOpen
              ? `
                visible
                opacity-100
              `
              : `
                invisible
                pointer-events-none
                opacity-0
              `
          }
        `}
      />

      {/* ===================================================
          MOBILE BOTTOM SHEET
      =================================================== */}

      <aside
        aria-hidden={
          !menuOpen
        }
        className={`
          fixed

          inset-x-0
          bottom-0

          z-[100]

          max-h-[92dvh]

          overflow-hidden

          rounded-t-[32px]

          border-t
          border-white/20

          bg-slate-950/95

          shadow-[0_-24px_80px_-30px_rgba(0,0,0,0.9)]

          backdrop-blur-3xl

          transition-all
          duration-300
          ease-out

          lg:hidden

          ${
            menuOpen
              ? `
                visible
                translate-y-0
                opacity-100
              `
              : `
                invisible
                pointer-events-none
                translate-y-full
                opacity-0
              `
          }
        `}
      >
        {/* =================================================
            AMBIENT LIGHT
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -left-16
            -top-16

            h-56
            w-56

            rounded-full

            bg-blue-500/15

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -right-20
            top-40

            h-52
            w-52

            rounded-full

            bg-cyan-400/10

            blur-3xl
          "
        />

        {/* =================================================
            HANDLE
        ================================================= */}

        <div
          className="
            relative

            flex
            justify-center

            pb-1
            pt-2.5
          "
        >
          <div
            className="
              h-1.5
              w-11

              rounded-full

              bg-white/25
            "
          />
        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            relative

            flex
            items-center
            justify-between
            gap-3

            border-b
            border-white/10

            px-5
            pb-4
            pt-2
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight

                !text-white
              "
            >
              เมนูระบบ
            </h2>

            <p
              className="
                mt-0.5

                text-xs
                font-semibold

                !text-slate-400
              "
            >
              เลือกเมนูที่ต้องการใช้งาน
            </p>
          </div>

          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={
              closeMenu
            }
            className="
              inline-flex
              h-10
              w-10
              shrink-0

              items-center
              justify-center

              rounded-full

              border
              border-white/10

              bg-white/10

              !text-white

              backdrop-blur-xl

              transition-all
              duration-200

              active:scale-90
            "
          >
            <X
              size={20}
              strokeWidth={2.4}
            />
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div
          className="
            relative

            max-h-[calc(92dvh-92px)]

            overflow-y-auto
            overscroll-contain

            px-4
            pb-[calc(24px+env(safe-area-inset-bottom))]
            pt-4
          "
        >
          {/* =================================================
              QUICK MENU
          ================================================= */}

          <div
            className="
              grid
              grid-cols-3
              gap-3
            "
          >
            {/* ===============================================
                HOME
            =============================================== */}

            <Link
              href="/"
              prefetch
              onClick={
                closeMenu
              }
              className={`
                group
                relative

                flex
                min-h-[112px]
                min-w-0

                flex-col
                items-center
                justify-center

                overflow-hidden

                rounded-[24px]

                border

                px-2
                py-3

                text-center

                transition-all
                duration-200

                active:scale-[0.94]

                ${
                  pathname === "/"
                    ? `
                      border-blue-300/30

                      bg-gradient-to-br
                      from-blue-600
                      via-blue-500
                      to-cyan-500

                      shadow-[0_14px_32px_-18px_rgba(14,165,233,0.9)]
                    `
                    : `
                      border-white/10

                      bg-white/[0.07]

                      shadow-[0_12px_28px_-22px_rgba(0,0,0,0.8)]
                    `
                }
              `}
            >
              <div
                className="
                  flex
                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-[17px]

                  border
                  border-white/15

                  bg-white/10

                  !text-white

                  shadow-inner
                "
              >
                <LayoutDashboard
                  size={24}
                  strokeWidth={2.2}
                />
              </div>

              <span
                className="
                  mt-2

                  w-full

                  truncate

                  text-[13px]
                  font-extrabold

                  !text-white
                "
              >
                หน้าแรก
              </span>
            </Link>

            {/* ===============================================
                NOTIFICATIONS
            =============================================== */}

            <Link
              href="/notifications"
              prefetch
              onClick={
                closeMenu
              }
              className={`
                group
                relative

                flex
                min-h-[112px]
                min-w-0

                flex-col
                items-center
                justify-center

                overflow-hidden

                rounded-[24px]

                border

                px-2
                py-3

                text-center

                transition-all
                duration-200

                active:scale-[0.94]

                ${
                  isActive(
                    "/notifications"
                  )
                    ? `
                      border-blue-300/30

                      bg-gradient-to-br
                      from-blue-600
                      via-blue-500
                      to-cyan-500

                      shadow-[0_14px_32px_-18px_rgba(14,165,233,0.9)]
                    `
                    : `
                      border-white/10

                      bg-white/[0.07]

                      shadow-[0_12px_28px_-22px_rgba(0,0,0,0.8)]
                    `
                }
              `}
            >
              <div
                className="
                  relative

                  flex
                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-[17px]

                  border
                  border-white/15

                  bg-white/10

                  !text-white
                "
              >
                <Bell
                  size={24}
                  strokeWidth={2.2}
                />

                {notificationCount >
                  0 && (
                    <span
                      className="
                        absolute
                        -right-2
                        -top-2

                        flex
                        h-6
                        min-w-6

                        items-center
                        justify-center

                        rounded-full

                        bg-red-500

                        px-1.5

                        text-[10px]
                        font-black

                        !text-white

                        ring-2
                        ring-slate-950

                        shadow-lg
                      "
                    >
                      {notificationCount >
                      99
                        ? "99+"
                        : notificationCount}
                    </span>
                  )}
              </div>

              <span
                className="
                  mt-2

                  w-full

                  truncate

                  text-[13px]
                  font-extrabold

                  !text-white
                "
              >
                แจ้งเตือน
              </span>
            </Link>

            {/* ===============================================
                ALL NORMAL MENU ITEMS
            =============================================== */}

            {visibleMenus.flatMap(
              (group) =>
                group.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const active =
                      isActive(
                        item.href
                      );

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        prefetch
                        onClick={
                          closeMenu
                        }
                        className={`
                          group
                          relative

                          flex
                          min-h-[112px]
                          min-w-0

                          flex-col
                          items-center
                          justify-center

                          overflow-hidden

                          rounded-[24px]

                          border

                          px-2
                          py-3

                          text-center

                          transition-all
                          duration-200

                          active:scale-[0.94]

                          ${
                            active
                              ? `
                                border-blue-300/30

                                bg-gradient-to-br
                                from-blue-600
                                via-blue-500
                                to-cyan-500

                                shadow-[0_14px_32px_-18px_rgba(14,165,233,0.9)]
                              `
                              : `
                                border-white/10

                                bg-white/[0.07]

                                shadow-[0_12px_28px_-22px_rgba(0,0,0,0.8)]
                              `
                          }
                        `}
                      >
                        {/* Top glass */}

                        <div
                          aria-hidden="true"
                          className="
                            pointer-events-none
                            absolute
                            inset-x-3
                            top-0

                            h-px

                            bg-gradient-to-r
                            from-transparent
                            via-white/25
                            to-transparent
                          "
                        />

                        {/* Icon */}

                        <div
                          className={`
                            flex
                            h-12
                            w-12
                            shrink-0

                            items-center
                            justify-center

                            rounded-[17px]

                            border

                            !text-white

                            transition-all
                            duration-200

                            ${
                              active
                                ? `
                                  border-white/25
                                  bg-white/20
                                `
                                : `
                                  border-white/10
                                  bg-white/10
                                `
                            }
                          `}
                        >
                          <Icon
                            size={24}
                            strokeWidth={2.2}
                          />
                        </div>

                        {/* Label */}

                        <span
                          className="
                            mt-2

                            line-clamp-2
                            w-full

                            text-[12px]
                            font-extrabold
                            leading-[1.25rem]

                            !text-white
                          "
                        >
                          {
                            item.name
                          }
                        </span>
                      </Link>
                    );
                  }
                )
            )}
          </div>

          {/* =================================================
              MENU GROUP SUMMARY
          ================================================= */}

          <div
            className="
              mt-5

              space-y-3
            "
          >
            {visibleMenus.map(
              (group) => {
                const GroupIcon =
                  group.icon;

                return (
                  <div
                    key={
                      group.title
                    }
                    className="
                      flex
                      items-center
                      gap-3

                      rounded-[20px]

                      border
                      border-white/10

                      bg-white/[0.04]

                      px-4
                      py-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0

                        items-center
                        justify-center

                        rounded-[13px]

                        bg-white/10

                        !text-slate-300
                      "
                    >
                      <GroupIcon
                        size={18}
                        strokeWidth={
                          2.2
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          text-sm
                          font-extrabold

                          !text-slate-200
                        "
                      >
                        {
                          group.title
                        }
                      </p>

                      <p
                        className="
                          mt-0.5

                          text-[11px]
                          font-semibold

                          !text-slate-500
                        "
                      >
                        {group.items.length.toLocaleString(
                          "th-TH"
                        )}{" "}
                        เมนู
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </aside>
    </>
  );
}