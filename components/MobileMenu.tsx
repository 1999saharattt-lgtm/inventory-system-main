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
  ChevronRight,
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
        name:
          "รายการพัสดุทั้งหมด",

        href:
          "/materials",

        icon:
          Boxes,
      },

      {
        name:
          "รายการรับเข้า",

        href:
          "/receive",

        icon:
          PackagePlus,

        adminOnly:
          true,
      },

      {
        name:
          "รายการเบิกจ่าย",

        href:
          "/issue",

        icon:
          PackageMinus,
      },

      {
        name:
          "บัญชีคุมพัสดุ",

        href:
          "/stock-card",

        icon:
          ClipboardList,
      },

      {
        name:
          "ทะเบียนคุมครุภัณฑ์",

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
      Building,

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

/* =========================================================
   COMPONENT
========================================================= */

export default function MobileMenu({
  role,
}: MobileMenuProps) {
  const pathname =
    usePathname();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState<string | null>(
    null
  );

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
                cache:
                  "no-store",
              }
            );

          if (
            !response.ok
          ) {
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
     FILTER MENU BY ROLE
  ======================================================= */

  const visibleMenus =
    useMemo(() => {
      return menus
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
              group.items
                .map(
                  (item) => {
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
                  }
                )
                .filter(
                  (item) =>
                    !item.adminOnly ||
                    role ===
                      "ADMIN"
                ),
          })
        )
        .filter(
          (group) =>
            group.items
              .length > 0
        );
    }, [role]);

  /* =======================================================
     ACTIVE
  ======================================================= */

  function isActive(
    href: string
  ) {
    if (
      href === "/"
    ) {
      return (
        pathname === "/"
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  function isGroupActive(
    group: MenuGroup
  ) {
    return group.items.some(
      (item) =>
        isActive(
          item.href
        )
    );
  }

  /* =======================================================
     FIND CURRENT GROUP
  ======================================================= */

  const currentGroup =
    visibleMenus.find(
      (group) =>
        isGroupActive(
          group
        )
    );

  /* =======================================================
     OPEN MENU
  ======================================================= */

  function openMenu() {
    if (
      currentGroup
    ) {
      setSelectedGroup(
        currentGroup.title
      );
    } else if (
      visibleMenus.length >
      0
    ) {
      setSelectedGroup(
        visibleMenus[0]
          .title
      );
    }

    setMenuOpen(true);
  }

  /* =======================================================
     CLOSE
  ======================================================= */

  function closeMenu() {
    setMenuOpen(false);
  }

  /* =======================================================
     ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* =======================================================
     BODY SCROLL + ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!menuOpen) {
      document.body.style
        .overflow = "";

      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  /* =======================================================
     SELECTED MENU
  ======================================================= */

  const activeGroup =
    visibleMenus.find(
      (group) =>
        group.title ===
        selectedGroup
    ) ??
    visibleMenus[0] ??
    null;

  /* =======================================================
     TOP ICON STYLE
  ======================================================= */

  function topIconClass(
    active: boolean
  ) {
    return `
      group
      relative

      flex
      h-[54px]
      w-[54px]
      shrink-0

      items-center
      justify-center

      rounded-[18px]

      border

      outline-none

      transition-all
      duration-200
      ease-out

      active:scale-[0.92]

      ${
        active
          ? `
            border-emerald-400/30

            bg-gradient-to-br
            from-emerald-600
            via-green-600
            to-teal-600

            !text-white

            shadow-[0_10px_24px_-12px_rgba(5,150,105,0.60)]

            ring-1
            ring-white/30
          `
          : `
            border-slate-200/80

            bg-white/80

            !text-slate-600

            shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)]

            ring-1
            ring-white

            hover:bg-emerald-50
            hover:!text-emerald-700
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
        aria-expanded={
          menuOpen
        }
        aria-controls="mobile-system-menu"
        onClick={() => {
          if (
            menuOpen
          ) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
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

          rounded-[14px]

          border
          border-emerald-200/80

          bg-gradient-to-br
          from-emerald-50
          via-white
          to-green-100

          !text-emerald-700

          shadow-[0_8px_24px_-18px_rgba(5,150,105,0.50)]

          backdrop-blur-xl

          ring-1
          ring-white

          transition-all
          duration-200

          active:scale-[0.92]

          sm:h-11
          sm:w-11

          lg:hidden
        "
      >
        {menuOpen ? (
          <X
            size={21}
            strokeWidth={
              2.4
            }
          />
        ) : (
          <Menu
            size={22}
            strokeWidth={
              2.4
            }
          />
        )}

        {/* ===============================================
            NOTIFICATION DOT
        =============================================== */}

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

                bg-red-500

                ring-2
                ring-white
              "
            />
          )}
      </button>

      {/* ===================================================
          BACKDROP
      =================================================== */}

      <div
        aria-hidden="true"
        onClick={
          closeMenu
        }
        className={`
          fixed
          inset-0

          z-[90]

          bg-slate-900/25

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
          IOS MOBILE SHEET
      =================================================== */}

      <aside
        id="mobile-system-menu"
        aria-hidden={
          !menuOpen
        }
        className={`
          fixed

          inset-x-2
          bottom-2

          z-[100]

          mx-auto

          flex
          max-h-[82dvh]
          min-h-0
          w-auto
          max-w-[560px]

          flex-col

          overflow-hidden

          rounded-[30px]

          border
          border-white/90

          bg-white/90

          shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)]

          backdrop-blur-3xl
          backdrop-saturate-150

          ring-1
          ring-slate-900/[0.04]

          transition-all
          duration-300
          ease-out

          sm:bottom-3
          sm:inset-x-3

          lg:hidden

          ${
            menuOpen
              ? `
                visible

                translate-y-0
                scale-100

                opacity-100
              `
              : `
                invisible

                pointer-events-none

                translate-y-6
                scale-[0.97]

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
            -top-24

            h-52
            w-52

            rounded-full

            bg-emerald-300/20

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -right-20
            top-10

            h-48
            w-48

            rounded-full

            bg-teal-200/20

            blur-3xl
          "
        />

        {/* =================================================
            HANDLE
        ================================================= */}

        <div
          className="
            relative
            z-10

            flex
            shrink-0
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

              bg-slate-300/90
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

            flex
            shrink-0
            items-center
            justify-between
            gap-3

            px-4
            pb-3
            pt-1
          "
        >
          <div className="min-w-0">
            <h2
              className="
                whitespace-nowrap

                text-lg
                font-black

                !text-slate-900
              "
            >
              เมนูระบบ
            </h2>

            <p
              className="
                mt-0.5

                whitespace-nowrap

                text-xs
                font-semibold

                !text-slate-500
              "
            >
              เลือกหมวดเมนูที่ต้องการใช้งาน
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
              h-9
              w-9
              shrink-0

              items-center
              justify-center

              rounded-full

              border
              border-slate-200/80

              bg-white/80

              !text-slate-600

              shadow-sm

              transition-all
              duration-200

              active:scale-90
            "
          >
            <X
              size={18}
              strokeWidth={
                2.4
              }
            />
          </button>
        </div>

        {/* =================================================
            TOP ICON NAVIGATION
        ================================================= */}

        <div
          className="
            relative
            z-10

            shrink-0

            border-y
            border-slate-200/70

            bg-white/40

            px-3
            py-3

            backdrop-blur-xl
          "
        >
          <div
            className="
              flex
              w-full
              min-w-0

              items-start
              gap-2.5

              overflow-x-auto

              pb-1

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
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
              className="
                flex
                shrink-0
                flex-col
                items-center
                gap-1.5
              "
            >
              <div
                className={topIconClass(
                  pathname ===
                    "/"
                )}
              >
                <LayoutDashboard
                  size={22}
                  strokeWidth={
                    2.2
                  }
                />
              </div>

              <span
                className={`
                  max-w-[68px]

                  whitespace-nowrap

                  text-[11px]
                  font-extrabold

                  ${
                    pathname ===
                    "/"
                      ? "!text-emerald-700"
                      : "!text-slate-500"
                  }
                `}
              >
                หน้าแรก
              </span>
            </Link>

            {/* ===============================================
                NOTIFICATION
            =============================================== */}

            <Link
              href="/notifications"
              prefetch
              onClick={
                closeMenu
              }
              className="
                flex
                shrink-0
                flex-col
                items-center
                gap-1.5
              "
            >
              <div
                className={topIconClass(
                  isActive(
                    "/notifications"
                  )
                )}
              >
                <Bell
                  size={22}
                  strokeWidth={
                    2.2
                  }
                />

                {notificationCount >
                  0 && (
                    <span
                      className="
                        absolute
                        -right-1
                        -top-1

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
                        ring-white
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
                className={`
                  max-w-[68px]

                  whitespace-nowrap

                  text-[11px]
                  font-extrabold

                  ${
                    isActive(
                      "/notifications"
                    )
                      ? "!text-emerald-700"
                      : "!text-slate-500"
                  }
                `}
              >
                แจ้งเตือน
              </span>
            </Link>

            {/* ===============================================
                GROUP ICONS
            =============================================== */}

            {visibleMenus.map(
              (group) => {
                const GroupIcon =
                  group.icon;

                const active =
                  selectedGroup ===
                    group.title ||
                  isGroupActive(
                    group
                  );

                return (
                  <button
                    key={
                      group.title
                    }
                    type="button"
                    onClick={() =>
                      setSelectedGroup(
                        group.title
                      )
                    }
                    className="
                      flex
                      shrink-0
                      flex-col
                      items-center
                      gap-1.5
                    "
                  >
                    <div
                      className={topIconClass(
                        selectedGroup ===
                          group.title
                      )}
                    >
                      <GroupIcon
                        size={22}
                        strokeWidth={
                          2.2
                        }
                      />

                      {active &&
                        selectedGroup !==
                          group.title && (
                          <span
                            className="
                              absolute
                              -right-0.5
                              -top-0.5

                              h-2
                              w-2

                              rounded-full

                              bg-emerald-500

                              ring-2
                              ring-white
                            "
                          />
                        )}
                    </div>

                    <span
                      className={`
                        max-w-[78px]

                        overflow-hidden
                        text-ellipsis
                        whitespace-nowrap

                        text-[11px]
                        font-extrabold

                        ${
                          selectedGroup ===
                          group.title
                            ? "!text-emerald-700"
                            : "!text-slate-500"
                        }
                      `}
                    >
                      {
                        group.title
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            SELECTED GROUP
        ================================================= */}

        <div
          className="
            relative
            z-10

            min-h-0
            flex-1

            overflow-y-auto

            overscroll-contain

            px-3
            pb-[calc(14px+env(safe-area-inset-bottom))]
            pt-3

            [-webkit-overflow-scrolling:touch]
          "
        >
          {activeGroup && (
            <>
              {/* =============================================
                  GROUP TITLE
              ============================================= */}

              <div
                className="
                  mb-3

                  flex
                  items-center
                  gap-3

                  px-1
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

                    bg-emerald-50

                    !text-emerald-700

                    ring-1
                    ring-emerald-100
                  "
                >
                  <activeGroup.icon
                    size={18}
                    strokeWidth={
                      2.3
                    }
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className="
                      whitespace-nowrap

                      text-base
                      font-black

                      !text-slate-900
                    "
                  >
                    {
                      activeGroup.title
                    }
                  </h3>

                  <p
                    className="
                      mt-0.5

                      whitespace-nowrap

                      text-[11px]
                      font-semibold

                      !text-slate-500
                    "
                  >
                    เลือกรายการที่ต้องการใช้งาน
                  </p>
                </div>
              </div>

              {/* =============================================
                  GROUP ITEMS
              ============================================= */}

              <div
                className="
                  overflow-hidden

                  rounded-[22px]

                  border
                  border-white/90

                  bg-white/70

                  shadow-[0_12px_32px_-26px_rgba(15,23,42,0.40)]

                  ring-1
                  ring-slate-900/[0.03]

                  backdrop-blur-xl
                "
              >
                {activeGroup.items.map(
                  (
                    item,
                    index
                  ) => {
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
                          group/item

                          flex
                          min-h-[60px]
                          w-full
                          min-w-0

                          items-center
                          gap-3

                          px-3.5
                          py-2.5

                          transition-all
                          duration-200

                          active:scale-[0.985]

                          ${
                            index !==
                            activeGroup
                              .items
                              .length -
                              1
                              ? `
                                border-b
                                border-slate-200/70
                              `
                              : ""
                          }

                          ${
                            active
                              ? `
                                bg-gradient-to-r
                                from-emerald-50
                                to-green-50/70
                              `
                              : `
                                bg-white/30

                                hover:bg-emerald-50/60
                              `
                          }
                        `}
                      >
                        {/* ===================================
                            ICON
                        =================================== */}

                        <div
                          className={`
                            flex
                            h-10
                            w-10
                            shrink-0

                            items-center
                            justify-center

                            rounded-[13px]

                            border

                            transition-all
                            duration-200

                            ${
                              active
                                ? `
                                  border-emerald-200

                                  bg-gradient-to-br
                                  from-emerald-600
                                  to-green-600

                                  !text-white

                                  shadow-md
                                  shadow-emerald-500/15
                                `
                                : `
                                  border-slate-200/80

                                  bg-white

                                  !text-slate-600

                                  shadow-sm

                                  group-hover/item:border-emerald-200

                                  group-hover/item:bg-emerald-50

                                  group-hover/item:!text-emerald-700
                                `
                            }
                          `}
                        >
                          <Icon
                            size={19}
                            strokeWidth={
                              2.25
                            }
                          />
                        </div>

                        {/* ===================================
                            LABEL
                        =================================== */}

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <p
                            className={`
                              overflow-hidden
                              text-ellipsis
                              whitespace-nowrap

                              text-sm
                              font-extrabold

                              ${
                                active
                                  ? "!text-emerald-800"
                                  : "!text-slate-800"
                              }
                            `}
                          >
                            {
                              item.name
                            }
                          </p>
                        </div>

                        {/* ===================================
                            ARROW
                        =================================== */}

                        <div
                          className="
                            flex
                            h-7
                            w-7
                            shrink-0

                            items-center
                            justify-center

                            rounded-full

                            bg-slate-100

                            !text-slate-400

                            transition-all
                            duration-200

                            group-hover/item:bg-emerald-100

                            group-hover/item:!text-emerald-700
                          "
                        >
                          <ChevronRight
                            size={16}
                            strokeWidth={
                              2.5
                            }
                          />
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}