"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

type PopoverPosition = {
  left: number;
  top: number;
  width: number;
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
  const pathname = usePathname();

  const rootRef =
    useRef<HTMLDivElement | null>(null);

  const triggerRefs =
    useRef<
      Record<
        string,
        HTMLButtonElement | null
      >
    >({});

  const popoverRef =
    useRef<HTMLDivElement | null>(null);

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState<string | null>(null);

  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    popoverPosition,
    setPopoverPosition,
  ] = useState<PopoverPosition>({
    left: 8,
    top: 0,
    width: 320,
  });

  /* =======================================================
     MOUNTED
  ======================================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  useEffect(() => {
    let active = true;

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

          if (active) {
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
      active = false;

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
                    role === "ADMIN"
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
     POPOVER POSITION
  ======================================================= */

  function updatePopoverPosition(
    groupTitle: string
  ) {
    const trigger =
      triggerRefs.current[
        groupTitle
      ];

    if (!trigger) {
      return;
    }

    const rect =
      trigger.getBoundingClientRect();

    const viewportWidth =
      window.innerWidth;

    const horizontalMargin = 8;

    const desiredWidth =
      Math.min(
        420,
        viewportWidth -
          horizontalMargin * 2
      );

    let left =
      rect.left +
      rect.width / 2 -
      desiredWidth / 2;

    left = Math.max(
      horizontalMargin,
      Math.min(
        left,
        viewportWidth -
          desiredWidth -
          horizontalMargin
      )
    );

    setPopoverPosition({
      left,
      top: rect.bottom + 8,
      width: desiredWidth,
    });
  }

  /* =======================================================
     OPEN GROUP
  ======================================================= */

  function toggleGroup(
    groupTitle: string
  ) {
    setSelectedGroup(
      (current) => {
        if (
          current === groupTitle
        ) {
          return null;
        }

        window.requestAnimationFrame(
          () => {
            updatePopoverPosition(
              groupTitle
            );
          }
        );

        return groupTitle;
      }
    );
  }

  /* =======================================================
     ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setSelectedGroup(null);
  }, [pathname]);

  /* =======================================================
     KEEP POPOVER IN POSITION
  ======================================================= */

  useEffect(() => {
    if (!selectedGroup) {
      return;
    }

    const update = () => {
      updatePopoverPosition(
        selectedGroup
      );
    };

    update();

    window.addEventListener(
      "resize",
      update
    );

    window.addEventListener(
      "scroll",
      update,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        update
      );

      window.removeEventListener(
        "scroll",
        update,
        true
      );
    };
  }, [selectedGroup]);

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

      const clickedRoot =
        rootRef.current?.contains(
          target
        ) ?? false;

      const clickedPopover =
        popoverRef.current?.contains(
          target
        ) ?? false;

      if (
        !clickedRoot &&
        !clickedPopover
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
     IOS ICON BUTTON
  ======================================================= */

  function iconButtonClass(
    active: boolean,
    open = false
  ) {
    const highlighted =
      active || open;

    return `
      group
      relative

      flex
      h-12
      w-12
      shrink-0
      items-center
      justify-center

      rounded-[16px]

      border-0
      outline-none

      bg-transparent

      transition-all
      duration-200
      ease-out

      active:scale-[0.92]

      ${
        highlighted
          ? `
              bg-emerald-500/12

              shadow-[0_10px_24px_-18px_rgba(5,150,105,0.55)]

              ring-1
              ring-emerald-500/10
            `
          : `
              hover:bg-slate-900/[0.035]
            `
      }
    `;
  }

  /* =======================================================
     POPOVER
  ======================================================= */

  const popover =
    mounted &&
    activeGroup
      ? createPortal(
          <div
            ref={popoverRef}
            className="
              fixed
              z-[9999]

              origin-top

              animate-in
              fade-in
              slide-in-from-top-2
              zoom-in-[0.98]

              duration-200
            "
            style={{
              left:
                popoverPosition.left,
              top:
                popoverPosition.top,
              width:
                popoverPosition.width,
            }}
          >
            <div
              className="
                grid
                grid-cols-2
                gap-2

                rounded-[24px]

                border
                border-white/70

                bg-white/88

                p-2.5

                shadow-[0_24px_70px_-24px_rgba(15,23,42,0.42)]

                ring-1
                ring-slate-900/[0.05]

                backdrop-blur-2xl
                backdrop-saturate-150
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
                      key={item.href}
                      href={item.href}
                      prefetch
                      onClick={() =>
                        setSelectedGroup(
                          null
                        )
                      }
                      className={`
                        group/item

                        flex
                        min-h-[66px]
                        min-w-0

                        items-center
                        gap-3

                        rounded-[18px]

                        px-3
                        py-2.5

                        text-left

                        transition-all
                        duration-200
                        ease-out

                        active:scale-[0.97]

                        ${
                          active
                            ? `
                                bg-gradient-to-r
                                from-emerald-600
                                to-green-500

                                shadow-[0_12px_26px_-16px_rgba(5,150,105,0.58)]
                              `
                            : `
                                bg-white/46

                                ring-1
                                ring-slate-900/[0.035]

                                hover:bg-emerald-50/85
                              `
                        }
                      `}
                    >
                      <span
                        aria-hidden="true"
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center

                          text-[24px]
                          leading-none

                          transition-transform
                          duration-200

                          group-hover/item:scale-110
                        "
                      >
                        {item.emoji}
                      </span>

                      <span
                        className={`
                          min-w-0

                          break-words

                          text-[12px]
                          font-extrabold
                          leading-snug

                          ${
                            active
                              ? "!text-white"
                              : "!text-slate-700"
                          }
                        `}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                }
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div
        ref={rootRef}
        className="
          relative
          z-[80]

          w-full
          min-w-0
        "
      >
        {/* ===================================================
            MOBILE ICON BAR

            - อยู่ใต้ Header
            - รูปแบบเดียวกับ Desktop ในลักษณะ icon navigation
            - ไม่มีกรอบขาวรอบแถบ
            - ไม่มีพื้นหลังขาวหลัง icon
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

            bg-transparent

            px-1
            py-1.5

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
              setSelectedGroup(null)
            }
            className={iconButtonClass(
              pathname === "/"
            )}
          >
            <span
              aria-hidden="true"
              className="
                text-[25px]
                leading-none

                transition-transform
                duration-200

                group-hover:scale-110
              "
            >
              🏠
            </span>

            {pathname === "/" && (
              <span
                aria-hidden="true"
                className="
                  absolute
                  bottom-0.5
                  left-1/2

                  h-1
                  w-4

                  -translate-x-1/2

                  rounded-full

                  bg-emerald-500
                "
              />
            )}
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
              setSelectedGroup(null)
            }
            className={iconButtonClass(
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
                  text-[25px]
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

            {isActive(
              "/notifications"
            ) && (
              <span
                aria-hidden="true"
                className="
                  absolute
                  bottom-0.5
                  left-1/2

                  h-1
                  w-4

                  -translate-x-1/2

                  rounded-full

                  bg-emerald-500
                "
              />
            )}
          </Link>

          {/* ===============================================
              GROUP ICONS
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
                  ref={(element) => {
                    triggerRefs.current[
                      group.title
                    ] = element;
                  }}
                  type="button"
                  title={group.title}
                  aria-label={
                    group.title
                  }
                  aria-expanded={
                    open
                  }
                  onClick={() =>
                    toggleGroup(
                      group.title
                    )
                  }
                  className={iconButtonClass(
                    groupActive,
                    open
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="
                      text-[25px]
                      leading-none

                      transition-transform
                      duration-200

                      group-hover:scale-110
                    "
                  >
                    {group.emoji}
                  </span>

                  {(groupActive ||
                    open) && (
                    <span
                      aria-hidden="true"
                      className="
                        absolute
                        bottom-0.5
                        left-1/2

                        h-1
                        w-4

                        -translate-x-1/2

                        rounded-full

                        bg-emerald-500
                      "
                    />
                  )}
                </button>
              );
            }
          )}
        </nav>
      </div>

      {popover}
    </>
  );
}
