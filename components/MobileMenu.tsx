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

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="
              absolute
              inset-0
              bg-black/50
            "
            onClick={() => setOpen(false)}
          />

          <aside
            className="
              absolute
              left-0
              top-0
              h-full
              w-[290px]
              overflow-y-auto
              bg-gradient-to-b
              from-slate-950
              via-slate-900
              to-slate-900
              shadow-2xl
            "
          >
            <div
              className="
                flex
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
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
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

                <div>
                  <div className="text-sm font-extrabold text-white">
                    ระบบบริหารคลังพัสดุ
                  </div>

                  <div className="text-xs font-semibold text-blue-400">
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

            <nav className="space-y-7 px-4 py-6">
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

                          <span className="text-[17px] font-extrabold">
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