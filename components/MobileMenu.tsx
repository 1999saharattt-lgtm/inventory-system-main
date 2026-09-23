"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
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

    void loadNotifications();

    const interval =
      window.setInterval(
        () => {
          void loadNotifications();
        },
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

    const previousOverflow =
      document.body.style.overflow;

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
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  /* =======================================================
     FILTER MENU BY ROLE
  ======================================================= */

  const visibleMenus =
    useMemo(() => {
      return menus
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
            group.items.length >
            0
        );
    }, [role]);

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
     MOBILE MENU CARD CLASS
  ======================================================= */

  function menuCardClass(
    active: boolean
  ) {
    return `
      group
      relative

      flex
      min-w-0
      min-h-[100px]

      flex-col
      items-center
      justify-center

      overflow-hidden

      rounded-[20px]

      border

      px-2
      py-3

      text-center

      outline-none

      transition-all
      duration-200

      active:scale-[0.96]

      min-[390px]:min-h-[108px]
      min-[390px]:rounded-[22px]

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
    `;
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
        aria-expanded={menuOpen}
        aria-controls="mobile-system-menu"
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
          h-10
          w-10
          shrink-0

          items-center
          justify-center

          overflow-hidden

          rounded-[13px]

          border
          border-white/20

          bg-white/10

          !text-white

          shadow-[0_10px_28px_-16px_rgba(0,0,0,0.8)]

          backdrop-blur-xl

          transition-all
          duration-200

          hover:bg-white/15

          active:scale-[0.92]

          sm:h-11
          sm:w-11
          sm:rounded-[15px]

          lg:hidden
        "
      >
        {/* GLASS HIGHLIGHT */}

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
            size={21}
            strokeWidth={2.4}
            className="
              relative
              z-10
            "
          />
        ) : (
          <Menu
            size={22}
            strokeWidth={2.4}
            className="
              relative
              z-10
            "
          />
        )}

        {/* NOTIFICATION DOT */}

        {notificationCount >
          0 &&
          !menuOpen && (
            <span
              aria-hidden="true"
              className="
                absolute
                right-[4px]
                top-[4px]

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

          bg-slate-950/60

          backdrop-blur-[5px]

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
        id="mobile-system-menu"
        aria-hidden={!menuOpen}
        className={`
          fixed
          inset-x-0
          bottom-0

          z-[100]

          flex
          max-h-[94dvh]
          min-h-0
          w-full
          min-w-0
          flex-col

          overflow-hidden

          rounded-t-[26px]

          border-t
          border-white/20

          bg-slate-950/[0.97]

          shadow-[0_-24px_80px_-30px_rgba(0,0,0,0.9)]

          backdrop-blur-3xl

          transition-all
          duration-300
          ease-out

          sm:inset-x-3
          sm:bottom-3
          sm:mx-auto
          sm:max-w-[620px]
          sm:rounded-[30px]
          sm:border

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
            -left-20
            -top-20

            h-60
            w-60

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
            -right-24
            top-40

            h-56
            w-56

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
            shrink-0

            flex
            justify-center

            pb-1
            pt-2.5
          "
        >
          <div
            className="
              h-1
              w-10

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
            z-10
            shrink-0

            flex
            min-w-0
            items-center
            justify-between
            gap-3

            border-b
            border-white/10

            px-4
            pb-3
            pt-1.5

            min-[390px]:px-5
            min-[390px]:pb-4
          "
        >
          <div className="min-w-0">
            <h2
              className="
                truncate

                text-base
                font-black
                tracking-tight

                !text-white

                min-[390px]:text-lg
              "
            >
              เมนูระบบ
            </h2>

            <p
              className="
                mt-0.5

                truncate

                text-[11px]
                font-semibold

                !text-slate-400

                min-[390px]:text-xs
              "
            >
              เลือกเมนูที่ต้องการใช้งาน
            </p>
          </div>

          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={closeMenu}
            className="
              inline-flex
              h-9
              w-9
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

              hover:bg-white/15

              active:scale-90

              min-[390px]:h-10
              min-[390px]:w-10
            "
          >
            <X
              size={19}
              strokeWidth={2.4}
            />
          </button>
        </div>

        {/* =================================================
            SCROLL CONTENT
        ================================================= */}

        <div
          className="
            relative
            z-10

            min-h-0
            flex-1

            overflow-x-hidden
            overflow-y-auto

            overscroll-contain

            [-webkit-overflow-scrolling:touch]

            px-3
            pt-3

            pb-[calc(16px+env(safe-area-inset-bottom))]

            min-[390px]:px-4
            min-[390px]:pt-4
            min-[390px]:pb-[calc(20px+env(safe-area-inset-bottom))]
          "
        >
          {/* =================================================
              QUICK MENU GRID
          ================================================= */}

          <div
            className="
              grid
              w-full
              min-w-0

              grid-cols-2

              gap-2.5

              min-[390px]:grid-cols-3
              min-[390px]:gap-3
            "
          >
            {/* ===============================================
                HOME
            =============================================== */}

            <Link
              href="/"
              prefetch
              onClick={closeMenu}
              className={menuCardClass(
                pathname === "/"
              )}
            >
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

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0

                  items-center
                  justify-center

                  rounded-[15px]

                  border
                  border-white/15

                  bg-white/10

                  !text-white

                  min-[390px]:h-12
                  min-[390px]:w-12
                  min-[390px]:rounded-[17px]
                "
              >
                <LayoutDashboard
                  size={22}
                  strokeWidth={2.2}
                />
              </div>

              <span
                className="
                  mt-2

                  w-full
                  min-w-0

                  truncate

                  text-[12px]
                  font-extrabold

                  !text-white

                  min-[390px]:text-[13px]
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
              onClick={closeMenu}
              className={menuCardClass(
                isActive(
                  "/notifications"
                )
              )}
            >
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

              <div
                className="
                  relative

                  flex
                  h-11
                  w-11
                  shrink-0

                  items-center
                  justify-center

                  rounded-[15px]

                  border
                  border-white/15

                  bg-white/10

                  !text-white

                  min-[390px]:h-12
                  min-[390px]:w-12
                  min-[390px]:rounded-[17px]
                "
              >
                <Bell
                  size={22}
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
                        h-5
                        min-w-5

                        items-center
                        justify-center

                        rounded-full

                        bg-red-500

                        px-1

                        text-[9px]
                        font-black

                        !text-white

                        ring-2
                        ring-slate-950

                        min-[390px]:h-6
                        min-[390px]:min-w-6
                        min-[390px]:px-1.5
                        min-[390px]:text-[10px]
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
                  min-w-0

                  truncate

                  text-[12px]
                  font-extrabold

                  !text-white

                  min-[390px]:text-[13px]
                "
              >
                แจ้งเตือน
              </span>
            </Link>

            {/* ===============================================
                NORMAL MENU ITEMS
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
                        className={menuCardClass(
                          active
                        )}
                      >
                        {/* TOP GLASS */}

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

                        {/* ICON */}

                        <div
                          className={`
                            flex
                            h-11
                            w-11
                            shrink-0

                            items-center
                            justify-center

                            rounded-[15px]

                            border

                            !text-white

                            transition-all
                            duration-200

                            min-[390px]:h-12
                            min-[390px]:w-12
                            min-[390px]:rounded-[17px]

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
                            size={22}
                            strokeWidth={2.2}
                          />
                        </div>

                        {/* LABEL */}

                        <span
                          className="
                            mt-2

                            line-clamp-2

                            w-full
                            min-w-0

                            break-words

                            text-[11px]
                            font-extrabold
                            leading-[1.1rem]

                            !text-white

                            min-[390px]:text-[12px]
                            min-[390px]:leading-[1.2rem]
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
              GROUP SUMMARY
          ================================================= */}

          <div
            className="
              mt-4

              space-y-2.5

              min-[390px]:mt-5
              min-[390px]:space-y-3
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
                      min-w-0
                      items-center
                      gap-3

                      rounded-[17px]

                      border
                      border-white/10

                      bg-white/[0.04]

                      px-3
                      py-2.5

                      min-[390px]:rounded-[20px]
                      min-[390px]:px-4
                      min-[390px]:py-3
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

                        rounded-[12px]

                        bg-white/10

                        !text-slate-300

                        min-[390px]:rounded-[13px]
                      "
                    >
                      <GroupIcon
                        size={18}
                        strokeWidth={2.2}
                      />
                    </div>

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <p
                        className="
                          truncate

                          text-[13px]
                          font-extrabold

                          !text-slate-200

                          min-[390px]:text-sm
                        "
                      >
                        {
                          group.title
                        }
                      </p>

                      <p
                        className="
                          mt-0.5

                          text-[10px]
                          font-semibold

                          !text-slate-500

                          min-[390px]:text-[11px]
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

          {/* =================================================
              BOTTOM SAFE SPACE
          ================================================= */}

          <div
            aria-hidden="true"
            className="
              h-2
              w-full
            "
          />
        </div>
      </aside>
    </>
  );
}