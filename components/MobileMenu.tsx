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
  ChevronDown,
  Menu,
  X,
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

type MobileMenuProps = {
  role: UserRole;
};

/* =========================================================
   Menu Configuration
   ========================================================= */

const menus: MenuGroup[] = [
  {
    title: "รายการพัสดุ",
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

export default function MobileMenu({
  role,
}: MobileMenuProps) {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const [openMenu, setOpenMenu] = useState<string | null>(
    null
  );

  const [notificationCount, setNotificationCount] =
    useState(0);

  /* =========================================================
     โหลดจำนวนแจ้งเตือน
     ========================================================= */

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

    const interval = window.setInterval(
      loadNotifications,
      30000
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  /* =========================================================
     ปิดเมนูเมื่อเปลี่ยนหน้า
     ========================================================= */

  useEffect(() => {
    setMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  /* =========================================================
     ป้องกัน Background Scroll + Escape
     ========================================================= */

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  /* =========================================================
     Filter Menu ตาม Role
     ========================================================= */

  const visibleMenus = menus
    .filter(
      (group) =>
        !group.adminOnly ||
        role === "ADMIN"
    )
    .map((group) => ({
      ...group,

      items: group.items.map((item) => {
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
      }),
    }))
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

  /* =========================================================
     Active Menu
     ========================================================= */

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  function isGroupActive(group: MenuGroup) {
    return group.items.some((item) =>
      isActive(item.href)
    );
  }

  function closeMenu() {
    setMenuOpen(false);
    setOpenMenu(null);
  }

  return (
    <>
      {/* =====================================================
          Mobile Trigger
      ===================================================== */}

      <button
        type="button"
        aria-label={
          menuOpen
            ? "ปิดเมนู"
            : "เปิดเมนู"
        }
        aria-expanded={menuOpen}
        onClick={() =>
          setMenuOpen((current) => !current)
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
          border-white/15
          bg-white/10
          !text-white
          shadow-[0_10px_26px_-18px_rgba(0,0,0,0.75)]
          backdrop-blur-xl
          transition-all
          duration-300
          ease-out
          hover:bg-white/15
          active:scale-[0.94]
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-br
            from-white/10
            to-transparent
          "
        />

        {menuOpen ? (
          <X
            size={22}
            strokeWidth={2.5}
            className="
              relative
              transition-transform
              duration-300
              group-hover:rotate-6
            "
          />
        ) : (
          <Menu
            size={22}
            strokeWidth={2.5}
            className="
              relative
              transition-transform
              duration-300
              group-hover:scale-105
            "
          />
        )}

        {notificationCount > 0 && !menuOpen && (
          <span
            className="
              absolute
              right-1
              top-1
              h-2
              w-2
              rounded-full
              bg-red-400
              shadow-[0_0_10px_rgba(248,113,113,0.9)]
            "
          />
        )}
      </button>

      {/* =====================================================
          Backdrop
      ===================================================== */}

      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={`
          fixed
          inset-0
          z-[90]
          bg-slate-950/45
          backdrop-blur-sm
          transition-opacity
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

      {/* =====================================================
          iOS Mobile Sheet
      ===================================================== */}

      <aside
        aria-hidden={!menuOpen}
        className={`
          fixed
          inset-x-3
          top-3
          z-[100]
          max-h-[calc(100vh-24px)]
          overflow-hidden
          rounded-[30px]
          border
          border-white/20
          bg-slate-950/92
          shadow-[0_30px_90px_-28px_rgba(0,0,0,0.85)]
          backdrop-blur-3xl
          transition-all
          duration-300
          ease-out
          lg:hidden
          sm:inset-x-4
          sm:top-4
          sm:max-h-[calc(100vh-32px)]
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
                -translate-y-4
                scale-[0.97]
                opacity-0
              `
          }
        `}
      >
        {/* Ambient */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-14
            -top-16
            h-40
            w-40
            rounded-full
            bg-blue-400/15
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-12
            top-28
            h-36
            w-36
            rounded-full
            bg-emerald-400/10
            blur-3xl
          "
        />

        {/* Header */}

        <div
          className="
            relative
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-white/10
            px-4
            py-4
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-base
                font-black
                !text-white
              "
            >
              เมนูระบบ
            </p>

            <p
              className="
                mt-0.5
                text-xs
                font-semibold
                !text-slate-400
              "
            >
              เลือกรายการที่ต้องการใช้งาน
            </p>
          </div>

          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={closeMenu}
            className="
              inline-flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-[14px]
              border
              border-white/10
              bg-white/10
              !text-white
              transition-all
              duration-300
              hover:bg-white/15
              active:scale-[0.94]
            "
          >
            <X
              size={20}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Content */}

        <div
          className="
            relative
            max-h-[calc(100vh-105px)]
            overflow-y-auto
            overscroll-contain
            px-3
            py-3
          "
        >
          <div className="space-y-2">
            {/* ===============================================
                หน้าแรก
            =============================================== */}

            <Link
              href="/"
              prefetch
              onClick={closeMenu}
              className={`
                group
                flex
                min-h-[54px]
                items-center
                gap-3
                rounded-[18px]
                border
                px-3
                py-3
                text-sm
                font-extrabold
                transition-all
                duration-300
                active:scale-[0.985]
                ${
                  pathname === "/"
                    ? `
                      border-sky-300/20
                      bg-gradient-to-r
                      from-blue-600
                      to-cyan-500
                      !text-white
                      shadow-[0_12px_28px_-18px_rgba(14,165,233,0.9)]
                    `
                    : `
                      border-white/10
                      bg-white/5
                      !text-slate-100
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
                  ${
                    pathname === "/"
                      ? `
                        border-white/20
                        bg-white/20
                      `
                      : `
                        border-white/10
                        bg-white/5
                      `
                  }
                `}
              >
                <LayoutDashboard
                  size={19}
                  strokeWidth={2.4}
                />
              </div>

              <span className="flex-1">
                หน้าแรก
              </span>

              <span
                className="
                  text-slate-400
                  transition-transform
                  group-hover:translate-x-0.5
                "
              >
                →
              </span>
            </Link>

            {/* ===============================================
                การแจ้งเตือน
            =============================================== */}

            <Link
              href="/notifications"
              prefetch
              onClick={closeMenu}
              className={`
                group
                flex
                min-h-[54px]
                items-center
                gap-3
                rounded-[18px]
                border
                px-3
                py-3
                text-sm
                font-extrabold
                transition-all
                duration-300
                active:scale-[0.985]
                ${
                  pathname === "/notifications"
                    ? `
                      border-sky-300/20
                      bg-gradient-to-r
                      from-blue-600
                      to-cyan-500
                      !text-white
                      shadow-[0_12px_28px_-18px_rgba(14,165,233,0.9)]
                    `
                    : `
                      border-white/10
                      bg-white/5
                      !text-slate-100
                      hover:bg-white/10
                      hover:!text-white
                    `
                }
              `}
            >
              <div
                className={`
                  relative
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-[14px]
                  border
                  ${
                    pathname === "/notifications"
                      ? `
                        border-white/20
                        bg-white/20
                      `
                      : `
                        border-white/10
                        bg-white/5
                      `
                  }
                `}
              >
                <Bell
                  size={19}
                  strokeWidth={2.4}
                />

                {notificationCount > 0 && (
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

              <span className="flex-1">
                การแจ้งเตือน
              </span>

              {notificationCount > 0 && (
                <span
                  className="
                    flex
                    h-7
                    min-w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-2
                    text-[11px]
                    font-black
                    !text-white
                    shadow-[0_8px_18px_-10px_rgba(239,68,68,0.9)]
                  "
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </Link>

            {/* ===============================================
                Groups
            =============================================== */}

            {visibleMenus.map((group) => {
              const active =
                isGroupActive(group);

              const isOpen =
                openMenu === group.title;

              return (
                <div
                  key={group.title}
                  className="
                    overflow-hidden
                    rounded-[20px]
                    border
                    border-white/10
                    bg-white/[0.035]
                  "
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenMenu(
                        isOpen
                          ? null
                          : group.title
                      )
                    }
                    className={`
                      flex
                      min-h-[54px]
                      w-full
                      items-center
                      justify-between
                      gap-3
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-extrabold
                      transition-all
                      duration-300
                      active:scale-[0.99]
                      ${
                        active || isOpen
                          ? `
                            bg-white/10
                            !text-white
                          `
                          : `
                            bg-transparent
                            !text-slate-200
                            hover:bg-white/5
                            hover:!text-white
                          `
                      }
                    `}
                  >
                    <span className="whitespace-nowrap">
                      {group.title}
                    </span>

                    <ChevronDown
                      size={18}
                      strokeWidth={2.5}
                      className={`
                        shrink-0
                        transition-transform
                        duration-300
                        ${
                          isOpen
                            ? "rotate-180"
                            : ""
                        }
                      `}
                    />
                  </button>

                  <div
                    className={`
                      grid
                      transition-[grid-template-rows,opacity]
                      duration-300
                      ease-out
                      ${
                        isOpen
                          ? `
                            grid-rows-[1fr]
                            opacity-100
                          `
                          : `
                            grid-rows-[0fr]
                            opacity-0
                          `
                      }
                    `}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="
                          space-y-1
                          border-t
                          border-white/10
                          p-2
                        "
                      >
                        {group.items.map(
                          (item) => {
                            const itemActive =
                              isActive(
                                item.href
                              );

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
                                onClick={
                                  closeMenu
                                }
                                className={`
                                  group/item
                                  flex
                                  min-h-[50px]
                                  items-center
                                  gap-3
                                  rounded-[16px]
                                  px-3
                                  py-2.5
                                  text-sm
                                  font-extrabold
                                  transition-all
                                  duration-300
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
                                        hover:bg-white/10
                                        hover:!text-white
                                      `
                                  }
                                `}
                              >
                                <div
                                  className={`
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-[13px]
                                    border
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
                                    size={18}
                                    strokeWidth={
                                      2.3
                                    }
                                  />
                                </div>

                                <span
                                  className="
                                    min-w-0
                                    flex-1
                                  "
                                >
                                  {item.name}
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
                </div>
              );
            })}
          </div>

          {/* Bottom Safe Space */}

          <div className="h-2" />
        </div>
      </aside>
    </>
  );
}
