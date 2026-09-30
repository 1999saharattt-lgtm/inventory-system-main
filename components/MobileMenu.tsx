"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  emoji: string;
  adminOnly?: boolean;
};

type MenuGroup = {
  title: string;
  emoji: string;
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
    emoji: "📦",

    items: [
      {
        name: "รายการพัสดุทั้งหมด",
        href: "/materials",
        emoji: "🗃️",
      },
      {
        name: "รายการรับเข้า",
        href: "/receive",
        emoji: "📥",
        adminOnly: true,
      },
      {
        name: "รายการเบิกจ่าย",
        href: "/issue",
        emoji: "📤",
      },
      {
        name: "บัญชีคุมพัสดุ",
        href: "/stock-card",
        emoji: "📒",
      },
      {
        name: "ทะเบียนคุมครุภัณฑ์",
        href: "/assets",
        emoji: "🖥️",
      },
    ],
  },

  {
    title: "หน่วยงาน",
    emoji: "🏢",

    items: [
      {
        name: "ผู้จำหน่าย",
        href: "/vendors",
        emoji: "🚚",
        adminOnly: true,
      },
      {
        name: "กลุ่มงาน",
        href: "/departments",
        emoji: "🏛️",
      },
    ],
  },

  {
    title: "เกี่ยวกับเรา",
    emoji: "ℹ️",
    adminOnly: true,

    items: [
      {
        name: "ผู้ใช้งานระบบ",
        href: "/users",
        emoji: "👥",
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

  const rootRef =
    useRef<HTMLDivElement | null>(
      null
    );

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
                    role === "ADMIN"
                ),
          })
        )
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

  function isGroupActive(
    group: MenuGroup
  ) {
    return group.items.some(
      (item) =>
        isActive(item.href)
    );
  }

  /* =======================================================
     ACTIVE GROUP
  ======================================================= */

  const activeGroup =
    visibleMenus.find(
      (group) =>
        group.title ===
        selectedGroup
    ) ?? null;

  /* =======================================================
     ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setSelectedGroup(null);
  }, [pathname]);

  /* =======================================================
     CLICK OUTSIDE + ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!selectedGroup) {
      return;
    }

    const handlePointerDown = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        rootRef.current &&
        !rootRef.current.contains(
          target
        )
      ) {
        setSelectedGroup(null);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        setSelectedGroup(null);
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
  }, [selectedGroup]);

  /* =======================================================
     MAIN EMOJI BUTTON

     ไม่มีกรอบพื้นหลังใหญ่ของเมนู
     Active/Open ใช้เขียวเหมือน Desktop
  ======================================================= */

  function emojiButtonClass(
    active: boolean,
    open = false
  ) {
    const highlighted =
      active || open;

    return `
      group
      relative

      flex
      h-11
      w-12
      shrink-0
      items-center
      justify-center

      rounded-[15px]

      border

      outline-none

      transition-all
      duration-200
      ease-out

      active:scale-[0.92]

      ${
        highlighted
          ? `
            border-emerald-500/30

            bg-gradient-to-r
            from-emerald-600
            via-green-600
            to-emerald-500

            shadow-[0_10px_24px_-14px_rgba(5,150,105,0.70)]

            ring-1
            ring-white/30
          `
          : `
            border-transparent

            bg-transparent

            hover:border-emerald-100/80
            hover:bg-emerald-50/70
          `
      }
    `;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      ref={rootRef}
      className="
        relative
        z-[70]

        w-full
        min-w-0
      "
    >
      {/* ===================================================
          MOBILE EMOJI MENU

          - อยู่ใต้ Header
          - ไม่มีพื้นหลังขาวใหญ่
          - แสดงเฉพาะ Emoji
      =================================================== */}

      <nav
        aria-label="เมนูสำหรับมือถือ"
        className="
          relative

          flex
          w-full
          min-w-0

          items-center
          justify-around
          gap-1

          overflow-x-auto
          overflow-y-visible

          px-1
          py-1

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
          title="หน้าแรก"
          aria-label="หน้าแรก"
          onClick={() =>
            setSelectedGroup(
              null
            )
          }
          className={emojiButtonClass(
            pathname === "/"
          )}
        >
          <span
            aria-hidden="true"
            className="
              text-[24px]
              leading-none

              transition-transform
              duration-200

              group-hover:scale-110
            "
          >
            🏠
          </span>
        </Link>

        {/* ===============================================
            NOTIFICATION
        =============================================== */}

        <Link
          href="/notifications"
          prefetch
          title="การแจ้งเตือน"
          aria-label="การแจ้งเตือน"
          onClick={() =>
            setSelectedGroup(
              null
            )
          }
          className={emojiButtonClass(
            isActive(
              "/notifications"
            )
          )}
        >
          <span
            className="
              relative
              inline-flex
            "
          >
            <span
              aria-hidden="true"
              className="
                text-[24px]
                leading-none

                transition-transform
                duration-200

                group-hover:scale-110
              "
            >
              🔔
            </span>

            {notificationCount >
              0 && (
                <span
                  className="
                    absolute
                    -right-3
                    -top-2.5

                    flex
                    h-4
                    min-w-4
                    items-center
                    justify-center

                    rounded-full

                    bg-red-500

                    px-1

                    text-[8px]
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
          </span>
        </Link>

        {/* ===============================================
            GROUP BUTTONS

            สำคัญ:
            ใช้ button เท่านั้น
            กดแล้วเปิด Popover ก่อน
            ไม่เปลี่ยนหน้า
        =============================================== */}

        {visibleMenus.map(
          (group) => {
            const groupActive =
              isGroupActive(
                group
              );

            const open =
              selectedGroup ===
                group.title;

            return (
              <button
                key={group.title}
                type="button"
                title={group.title}
                aria-label={
                  group.title
                }
                aria-expanded={
                  open
                }
                onClick={() => {
                  setSelectedGroup(
                    (
                      current
                    ) =>
                      current ===
                      group.title
                        ? null
                        : group.title
                  );
                }}
                className={emojiButtonClass(
                  groupActive,
                  open
                )}
              >
                <span
                  aria-hidden="true"
                  className="
                    relative

                    text-[24px]
                    leading-none

                    transition-transform
                    duration-200

                    group-hover:scale-110
                  "
                >
                  {group.emoji}

                  {groupActive &&
                    !open && (
                      <span
                        className="
                          absolute
                          -right-1
                          -top-1

                          h-2
                          w-2

                          rounded-full

                          bg-white

                          ring-2
                          ring-emerald-500
                        "
                      />
                    )}
                </span>
              </button>
            );
          }
        )}
      </nav>

      {/* ===================================================
          IOS SUB MENU POPOVER

          - กดหมวดก่อน แล้ว Popover เปิด
          - ไม่เปลี่ยนหน้าอัตโนมัติ
          - Popover เด้งขึ้นเล็กน้อยแบบ iOS
      =================================================== */}

      <div
        className={`
          absolute
          left-1/2
          top-[calc(100%+6px)]

          z-[80]

          w-[calc(100%-12px)]
          max-w-[520px]

          -translate-x-1/2

          origin-top

          transition-all
          duration-200
          ease-out

          ${
            activeGroup
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
        {activeGroup && (
          <div
            className="
              relative

              overflow-hidden

              rounded-[26px]

              border
              border-white/85

              bg-white/74

              p-2.5

              shadow-[0_26px_70px_-28px_rgba(15,23,42,0.46)]

              ring-1
              ring-slate-900/[0.04]

              backdrop-blur-3xl
              backdrop-saturate-150
            "
          >
            {/* AMBIENT */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                -right-14
                -top-14

                h-36
                w-36

                rounded-full

                bg-emerald-300/16

                blur-3xl
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                -bottom-14
                -left-14

                h-36
                w-36

                rounded-full

                bg-green-300/12

                blur-3xl
              "
            />

            {/* =============================================
                POPOVER HEADER
            ============================================= */}

            <div
              className="
                relative
                z-10

                mb-2

                flex
                items-center
                gap-2.5

                px-2
                py-1.5
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

                  bg-emerald-50/90

                  text-[21px]

                  ring-1
                  ring-emerald-100/80
                "
                aria-hidden="true"
              >
                {
                  activeGroup.emoji
                }
              </div>

              <div className="min-w-0">
                <h3
                  className="
                    truncate

                    text-sm
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

                    text-[10px]
                    font-semibold
                    !text-slate-500
                  "
                >
                  เลือกรายการที่ต้องการใช้งาน
                </p>
              </div>
            </div>

            {/* =============================================
                SUB MENU ITEMS
            ============================================= */}

            <div
              className="
                relative
                z-10

                grid
                grid-cols-2
                gap-2

                sm:grid-cols-3
              "
            >
              {activeGroup.items.map(
                (item) => {
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
                      onClick={() =>
                        setSelectedGroup(
                          null
                        )
                      }
                      className={`
                        group/item

                        flex
                        min-h-[78px]
                        min-w-0

                        flex-col
                        items-center
                        justify-center
                        gap-1.5

                        rounded-[18px]

                        border

                        px-2
                        py-2.5

                        text-center

                        transition-all
                        duration-200

                        hover:-translate-y-0.5

                        active:translate-y-0
                        active:scale-[0.96]

                        ${
                          active
                            ? `
                              border-emerald-500/30

                              bg-gradient-to-br
                              from-emerald-600
                              via-green-600
                              to-emerald-500

                              shadow-[0_12px_26px_-16px_rgba(5,150,105,0.62)]

                              ring-1
                              ring-white/30
                            `
                            : `
                              border-white/75

                              bg-white/52

                              shadow-[0_8px_22px_-20px_rgba(15,23,42,0.25)]

                              ring-1
                              ring-slate-900/[0.025]

                              hover:border-emerald-100
                              hover:bg-emerald-50/72
                            `
                        }
                      `}
                    >
                      <span
                        aria-hidden="true"
                        className="
                          text-[25px]
                          leading-none

                          transition-transform
                          duration-200

                          group-hover/item:scale-110
                        "
                      >
                        {
                          item.emoji
                        }
                      </span>

                      <span
                        className={`
                          max-w-full

                          overflow-hidden
                          text-ellipsis

                          text-[10px]
                          font-extrabold
                          leading-tight

                          ${
                            active
                              ? "!text-white"
                              : "!text-slate-700"
                          }
                        `}
                      >
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
    </div>
  );
}