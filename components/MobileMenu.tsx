"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ElementType } from "react";

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

const menus: MenuGroup[] = [
  {
    title: "หน้าแรก",
    items: [
      {
        name: "ภาพรวมระบบ",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "รายงานพัสดุ",
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

  // =====================================================
  // กลุ่มงาน
  //
  // ให้ STAFF / VIEWER เห็นโดยตรง
  // ไม่ซ้อนอยู่ใต้ผู้ดูแลระบบ
  // =====================================================

  {
    title: "หน่วยงาน",
    items: [
      {
        name: "กลุ่มงาน",
        href: "/departments",
        icon: Building2,
      },
    ],
  },

  // =====================================================
  // ผู้ดูแลระบบ
  //
  // เฉพาะ ADMIN
  // =====================================================

  {
    title: "ผู้ดูแลระบบ",
    adminOnly: true,
    items: [
      {
        name: "ผู้จำหน่าย",
        href: "/vendors",
        icon: Truck,
      },
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
  const [open, setOpen] = useState(false);

  const visibleMenus = menus
    .filter(
      (group) =>
        !group.adminOnly ||
        role === "ADMIN"
    )
    .map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.name === "รายการพัสดุทั้งหมด") {
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

  return (
    <>
      {/* Menu Button */}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-slate-900
          text-white
          shadow-md
          md:hidden
        "
        aria-label="เปิดเมนู"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Drawer */}

      {open && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            md:hidden
          "
        >
          {/* Overlay */}

          <div
            className="
              absolute
              inset-0
              bg-black/50
            "
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}

          <aside
            className="
              fixed
              left-0
              top-0
              z-[10000]
              flex
              h-[100dvh]
              w-[250px]
              max-w-[80vw]
              flex-col
              overflow-hidden
              bg-gradient-to-b
              from-slate-950
              via-slate-900
              to-slate-900
              shadow-2xl
            "
          >
            {/* Header */}

            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                border-b
                border-slate-800
                p-3
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
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
                    rounded-xl
                    bg-white
                  "
                >
                  <img
                    src="/images/dohl-logo.png"
                    alt="กรมอนามัย"
                    className="
                      h-7
                      w-7
                      object-contain
                    "
                  />
                </div>

                <div className="min-w-0">
                  <div
                    className="
                      truncate
                      text-xs
                      font-extrabold
                      text-white
                    "
                  >
                    ระบบบริหารคลังพัสดุ
                  </div>

                  <div
                    className="
                      truncate
                      text-[11px]
                      font-semibold
                      text-blue-400
                    "
                  >
                    สำนักอนามัยการเจริญพันธุ์
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-800
                  text-white
                "
                aria-label="ปิดเมนู"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu */}

            <nav
              className="
                flex-1
                space-y-5
                overflow-y-auto
                px-3
                py-4
              "
            >
              {visibleMenus.map((group) => (
                <div key={group.title}>
                  <p
                    className="
                      mb-2
                      px-2
                      text-base
                      font-black
                      tracking-[0.12em]
                      !text-white
                    "
                  >
                    {group.title}
                  </p>

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const active =
                        pathname ===
                          item.href ||
                        (item.href !== "/" &&
                          pathname.startsWith(
                            item.href
                          ));

                      const Icon =
                        item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() =>
                            setOpen(false)
                          }
                          className={`
                            flex
                            min-h-10
                            items-center
                            gap-2.5
                            rounded-xl
                            px-3
                            py-2

                            ${
                              active
                                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                                : "text-white hover:bg-slate-800"
                            }
                          `}
                        >
                          <div
                            className={`
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg

                              ${
                                active
                                  ? "bg-white/20"
                                  : "bg-slate-800"
                              }
                            `}
                          >
                            <Icon
                              size={18}
                              strokeWidth={2.2}
                            />
                          </div>

                          <span
                            className="
                              whitespace-nowrap
                              text-[15px]
                              font-extrabold
                              text-white
                            "
                          >
                            {item.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}