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

type MenuItem = {
  name: string;
  href: string;
  icon: ElementType;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
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
    title: "ผู้ดูแลระบบ",
    items: [
      {
        name: "ผู้จำหน่าย",
        href: "/vendors",
        icon: Truck,
      },
      {
        name: "กลุ่มงาน",
        href: "/departments",
        icon: Building2,
      },
      {
        name: "ผู้ใช้งานระบบ",
        href: "/users",
        icon: Users,
      },
    ],
  },
];

export default function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
              w-[290px]
              max-w-[85vw]
              flex-col
              overflow-y-auto
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
                p-4
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
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
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <div
                    className="
                      truncate
                      text-sm
                      font-extrabold
                      text-white
                    "
                  >
                    ระบบบริหารคลังพัสดุ
                  </div>

                  <div
                    className="
                      truncate
                      text-xs
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
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-800
                  text-white
                "
                aria-label="ปิดเมนู"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu */}

            <nav
              className="
                flex-1
                space-y-7
                overflow-y-auto
                px-4
                py-6
              "
            >
              {menus.map((group) => (
                <div key={group.title}>
                  <p
                    className="
                      mb-3
                      px-3
                      text-lg
                      font-black
                      tracking-[0.15em]
                      text-white
                    "
                  >
                    {group.title}
                  </p>

                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/" &&
                          pathname.startsWith(item.href));

                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`
                            flex
                            min-h-12
                            items-center
                            gap-3
                            rounded-2xl
                            px-4
                            py-3
                            ${
                              active
                                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl"
                                : "text-white hover:bg-slate-800"
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
                              rounded-xl
                              ${
                                active
                                  ? "bg-white/20"
                                  : "bg-slate-800"
                              }
                            `}
                          >
                            <Icon
                              size={20}
                              strokeWidth={2.2}
                            />
                          </div>

                          <span
                            className="
                              whitespace-nowrap
                              text-[17px]
                              font-extrabold
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