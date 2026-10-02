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
   MENU GROUPS

   🖥️ รายการพัสดุ
   - รายการพัสดุทั้งหมด
   - รายการรับเข้า
   - รายการเบิกจ่าย

   🏢 หน่วยงาน
   - ผู้จำหน่าย
   - กลุ่มงาน

   ℹ️ เกี่ยวกับเรา
   - ผู้ใช้งานระบบ
========================================================= */

const menus: MenuGroup[] = [
  {
    title: "รายการพัสดุ",
    emoji: "🖥️",

    items: [
      {
        name:
          "รายการพัสดุทั้งหมด",

        href:
          "/materials",

        emoji:
          "🗃️",
      },

      {
        name:
          "รายการรับเข้า",

        href:
          "/receive",

        emoji:
          "📥",

        adminOnly:
          true,
      },

      {
        name:
          "รายการเบิกจ่าย",

        href:
          "/issue",

        emoji:
          "📤",
      },
    ],
  },

  {
    title:
      "หน่วยงาน",

    emoji:
      "🏢",

    items: [
      {
        name:
          "ผู้จำหน่าย",

        href:
          "/vendors",

        emoji:
          "🚚",

        adminOnly:
          true,
      },

      {
        name:
          "กลุ่มงาน",

        href:
          "/departments",

        emoji:
          "🏛️",
      },
    ],
  },

  {
    title:
      "เกี่ยวกับเรา",

    emoji:
      "ℹ️",

    adminOnly:
      true,

    items: [
      {
        name:
          "ผู้ใช้งานระบบ",

        href:
          "/users",

        emoji:
          "👥",
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

  /* =======================================================
     REFS
  ======================================================= */

  const rootRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const triggerRefs =
    useRef<
      Record<
        string,
        HTMLButtonElement | null
      >
    >({});

  const popoverRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedGroup,
    setSelectedGroup,
  ] =
    useState<
      string | null
    >(null);

  const [
    notificationCount,
    setNotificationCount,
  ] =
    useState(0);

  const [
    mounted,
    setMounted,
  ] =
    useState(false);

  const [
    popoverPosition,
    setPopoverPosition,
  ] =
    useState<PopoverPosition>({
      left: 8,
      top: 0,
      width: 320,
    });

  /* =======================================================
     MOUNT
  ======================================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  useEffect(() => {
    let active =
      true;

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

          if (active) {
            setNotificationCount(
              Number(
                data.count ??
                  0
              )
            );
          }
        } catch (
          error
        ) {
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
      active =
        false;

      window.clearInterval(
        interval
      );
    };
  }, []);

  /* =======================================================
     ROLE FILTER
  ======================================================= */

  const visibleMenus =
    useMemo(
      () => {
        return menus
          .filter(
            (
              group
            ) =>
              !group.adminOnly ||
              role ===
                "ADMIN"
          )
          .map(
            (
              group
            ) => ({
              ...group,

              items:
                group.items
                  .map(
                    (
                      item
                    ) => {
                      /*
                       * USER / VIEWER
                       * รายการพัสดุทั้งหมด
                       * ให้ไปหน้า summary
                       */

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
                    (
                      item
                    ) =>
                      !item.adminOnly ||
                      role ===
                        "ADMIN"
                  ),
            })
          )
          .filter(
            (
              group
            ) =>
              group.items
                .length >
              0
          );
      },
      [
        role,
      ]
    );

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
        pathname ===
        "/"
      );
    }

    return (
      pathname ===
        href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  function isGroupActive(
    group: MenuGroup
  ) {
    return group.items.some(
      (
        item
      ) =>
        isActive(
          item.href
        )
    );
  }

  const activeGroup =
    visibleMenus.find(
      (
        group
      ) =>
        group.title ===
        selectedGroup
    ) ??
    null;

  /* =======================================================
     POPOVER POSITION
  ======================================================= */

  function updatePopoverPosition(
    groupTitle: string
  ) {
    const trigger =
      triggerRefs
        .current[
        groupTitle
      ];

    if (
      !trigger
    ) {
      return;
    }

    const rect =
      trigger.getBoundingClientRect();

    const viewportWidth =
      window.innerWidth;

    const margin =
      8;

    const width =
      Math.min(
        420,

        viewportWidth -
          margin *
            2
      );

    let left =
      rect.left +
      rect.width /
        2 -
      width /
        2;

    left =
      Math.max(
        margin,

        Math.min(
          left,

          viewportWidth -
            width -
            margin
        )
      );

    setPopoverPosition(
      {
        left,

        top:
          rect.bottom +
          8,

        width,
      }
    );
  }

  /* =======================================================
     TOGGLE GROUP
  ======================================================= */

  function toggleGroup(
    title: string
  ) {
    if (
      selectedGroup ===
      title
    ) {
      setSelectedGroup(
        null
      );

      return;
    }

    updatePopoverPosition(
      title
    );

    setSelectedGroup(
      title
    );
  }

  /* =======================================================
     CLOSE ON ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setSelectedGroup(
      null
    );
  }, [pathname]);

  /* =======================================================
     REPOSITION
  ======================================================= */

  useEffect(() => {
    if (
      !selectedGroup
    ) {
      return;
    }

    const update =
      () => {
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
  }, [
    selectedGroup,
  ]);

  /* =======================================================
     CLICK OUTSIDE / ESC
  ======================================================= */

  useEffect(() => {
    if (
      !selectedGroup
    ) {
      return;
    }

    const handlePointerDown =
      (
        event: MouseEvent
      ) => {
        const target =
          event.target as Node;

        const clickedRoot =
          rootRef.current
            ?.contains(
              target
            ) ??
          false;

        const clickedPopover =
          popoverRef.current
            ?.contains(
              target
            ) ??
          false;

        if (
          !clickedRoot &&
          !clickedPopover
        ) {
          setSelectedGroup(
            null
          );
        }
      };

    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          setSelectedGroup(
            null
          );
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
  }, [
    selectedGroup,
  ]);

  /* =======================================================
     ICON BUTTON CLASS
  ======================================================= */

  function iconButtonClass() {
    return `
      group
      relative

      flex
      h-11
      w-11
      shrink-0

      items-center
      justify-center

      rounded-[14px]

      border-0

      bg-transparent

      p-0

      outline-none

      transition-all
      duration-200
      ease-out

      hover:bg-white/55

      active:scale-[0.90]
      active:bg-white/65
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
            ref={
              popoverRef
            }
            className="
              fixed
              z-[99999]
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
                grid-cols-1
                gap-2

                rounded-[22px]

                border
                border-white/80

                bg-white/92

                p-2.5

                shadow-[0_24px_70px_-22px_rgba(15,23,42,0.48)]

                ring-1
                ring-slate-900/[0.05]

                backdrop-blur-2xl
                backdrop-saturate-150

                min-[390px]:grid-cols-2
              "
            >
              {activeGroup.items.map(
                (
                  item
                ) => {
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
                        min-h-[60px]
                        min-w-0

                        items-center
                        gap-2.5

                        rounded-[17px]

                        px-3
                        py-2.5

                        transition-all
                        duration-200

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
                                bg-transparent

                                hover:bg-emerald-50/80
                              `
                        }
                      `}
                    >
                      <span
                        aria-hidden="true"
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0

                          items-center
                          justify-center

                          text-[23px]
                          leading-none
                        "
                      >
                        {
                          item.emoji
                        }
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
                        {
                          item.name
                        }
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
        ref={
          rootRef
        }
        className="
          relative
          z-[5200]

          w-full
          min-w-0

          bg-transparent
        "
      >
        {/* =================================================
            GLASS MENU CONTAINER
        ================================================= */}

        <nav
          aria-label="เมนูสำหรับมือถือ"
          className="
            mx-auto

            flex
            w-full
            min-w-0
            max-w-[680px]

            items-center
            justify-around

            gap-1

            overflow-x-auto
            overflow-y-visible

            rounded-[20px]

            border
            border-white/80

            bg-white/72

            px-2
            py-1.5

            shadow-[0_14px_36px_-26px_rgba(15,23,42,0.42)]

            ring-1
            ring-slate-900/[0.025]

            backdrop-blur-2xl
            backdrop-saturate-150

            [scrollbar-width:none]

            [&::-webkit-scrollbar]:hidden
          "
        >
          {/* =================================================
              1. HOME
          ================================================= */}

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
            className={
              iconButtonClass()
            }
          >
            <span
              aria-hidden="true"
              className="
                text-[24px]
                leading-none
              "
            >
              🏠
            </span>

            {pathname ===
              "/" && (
              <span
                aria-hidden="true"
                className="
                  absolute
                  -bottom-0.5
                  left-1/2

                  h-[3px]
                  w-5

                  -translate-x-1/2

                  rounded-full

                  bg-emerald-500
                "
              />
            )}
          </Link>

          {/* =================================================
              2. NOTIFICATION
          ================================================= */}

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
            className={
              iconButtonClass()
            }
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
                  -bottom-0.5
                  left-1/2

                  h-[3px]
                  w-5

                  -translate-x-1/2

                  rounded-full

                  bg-emerald-500
                "
              />
            )}
          </Link>

          {/* =================================================
              3. MATERIALS

              🖥️
              รายการพัสดุทั้งหมด
              รายการรับเข้า
              รายการเบิกจ่าย
          ================================================= */}

          {visibleMenus
            .filter(
              (
                group
              ) =>
                group.title ===
                "รายการพัสดุ"
            )
            .map(
              (
                group
              ) => {
                const active =
                  isGroupActive(
                    group
                  );

                const open =
                  selectedGroup ===
                  group.title;

                return (
                  <button
                    key={
                      group.title
                    }
                    ref={(
                      element
                    ) => {
                      triggerRefs.current[
                        group.title
                      ] =
                        element;
                    }}
                    type="button"
                    title={
                      group.title
                    }
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
                    className={
                      iconButtonClass()
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="
                        text-[24px]
                        leading-none
                      "
                    >
                      🖥️
                    </span>

                    {(active ||
                      open) && (
                      <span
                        aria-hidden="true"
                        className="
                          absolute
                          -bottom-0.5
                          left-1/2

                          h-[3px]
                          w-5

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

          {/* =================================================
              4. STOCK CARD
          ================================================= */}

          <Link
            href="/stock-card"
            prefetch
            title="บัญชีคุมพัสดุ"
            aria-label="บัญชีคุมพัสดุ"
            onClick={() =>
              setSelectedGroup(
                null
              )
            }
            className={
              iconButtonClass()
            }
          >
            <span
              aria-hidden="true"
              className="
                text-[24px]
                leading-none
              "
            >
              📒
            </span>

            {isActive(
              "/stock-card"
            ) && (
              <span
                aria-hidden="true"
                className="
                  absolute
                  -bottom-0.5
                  left-1/2

                  h-[3px]
                  w-5

                  -translate-x-1/2

                  rounded-full

                  bg-emerald-500
                "
              />
            )}
          </Link>

          {/* =================================================
              5. DEPARTMENT
          ================================================= */}

          {visibleMenus
            .filter(
              (
                group
              ) =>
                group.title ===
                "หน่วยงาน"
            )
            .map(
              (
                group
              ) => {
                const active =
                  isGroupActive(
                    group
                  );

                const open =
                  selectedGroup ===
                  group.title;

                return (
                  <button
                    key={
                      group.title
                    }
                    ref={(
                      element
                    ) => {
                      triggerRefs.current[
                        group.title
                      ] =
                        element;
                    }}
                    type="button"
                    title={
                      group.title
                    }
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
                    className={
                      iconButtonClass()
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="
                        text-[24px]
                        leading-none
                      "
                    >
                      🏢
                    </span>

                    {(active ||
                      open) && (
                      <span
                        aria-hidden="true"
                        className="
                          absolute
                          -bottom-0.5
                          left-1/2

                          h-[3px]
                          w-5

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

          {/* =================================================
              6. ABOUT
          ================================================= */}

          {visibleMenus
            .filter(
              (
                group
              ) =>
                group.title ===
                "เกี่ยวกับเรา"
            )
            .map(
              (
                group
              ) => {
                const active =
                  isGroupActive(
                    group
                  );

                const open =
                  selectedGroup ===
                  group.title;

                return (
                  <button
                    key={
                      group.title
                    }
                    ref={(
                      element
                    ) => {
                      triggerRefs.current[
                        group.title
                      ] =
                        element;
                    }}
                    type="button"
                    title={
                      group.title
                    }
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
                    className={
                      iconButtonClass()
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="
                        text-[24px]
                        leading-none
                      "
                    >
                      ℹ️
                    </span>

                    {(active ||
                      open) && (
                      <span
                        aria-hidden="true"
                        className="
                          absolute
                          -bottom-0.5
                          left-1/2

                          h-[3px]
                          w-5

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