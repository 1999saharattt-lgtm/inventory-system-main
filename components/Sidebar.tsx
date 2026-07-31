"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";

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

export default function Sidebar() {
  const pathname = usePathname();

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

  return (
    <aside
      className="
        w-72
        shrink-0
        min-h-screen
        border-r
        border-slate-800
        bg-gradient-to-b
        from-slate-950
        via-slate-900
        to-slate-900
        shadow-2xl
      "
    >
      {/* Logo */}

      <div className="border-b border-slate-800 p-5">

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-xl
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                shadow-inner
              "
            >

              <img
                src="/images/dohl-logo.png"
                alt="กรมอนามัย"
                className="h-10 w-10 object-contain"
              />

            </div>

            <div className="min-w-0 flex-1">

              <h1
                className="
                  truncate
                  text-lg
                  font-extrabold
                  text-slate-800
                "
              >
                ระบบบริหารคลังพัสดุ
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-blue-600
                "
              >
                สำนักอนามัยการเจริญพันธุ์
              </p>

            </div>

          </div>

        </div>

      </div>

      <nav
        className="
          space-y-8
          px-4
          py-6
        "
      >
              {menus.map((group) => (
          <div key={group.title}>

            <div className="mb-3 px-3">

              <p
  className="
    text-base
    font-extrabold
    tracking-[0.15em]
    text-white
    mb-3
  "
>
  {group.title}
</p>

            </div>

            <div className="space-y-2">

              {group.items.map((item) => {

                const active =
                  pathname === item.href ||
                  (
                    item.href !== "/" &&
                    pathname.startsWith(item.href)
                  );

                const Icon = item.icon;

                return (

                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group
                      relative
                      flex
                      items-center
                      gap-3
                      overflow-hidden
                      rounded-2xl
                      px-4
                      py-3
                      transition-all
                      duration-300

                      ${
                        active
                          ? `
                            bg-gradient-to-r
                            from-blue-600
                            to-cyan-500
                            text-white
                            shadow-xl
                            shadow-blue-900/40
                          `
                          : `
                            text-slate-300
                            hover:bg-slate-800
                            hover:text-white
                            hover:translate-x-1
                          `
                      }
                    `}
                  >

                    {active && (
                      <div
                        className="
                          absolute
                          left-0
                          top-3
                          h-8
                          w-1
                          rounded-r-full
                          bg-white
                        "
                      />
                    )}

                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        transition-all

                        ${
                          active
                            ? "bg-white/20"
                            : "bg-slate-800 group-hover:bg-slate-700"
                        }
                      `}
                    >

                      <Icon
                        size={20}
                        strokeWidth={2.2}
                      />

                    </div>

                    <div className="flex flex-1 flex-col">
  <span
    className={`
      whitespace-nowrap
      text-[17px]
      font-extrabold
      leading-tight

      ${
        active
          ? "text-white"
          : "text-white"
      }
    `}
  >
    {item.name}
  </span>
</div>

                    <div
                      className={`
                        transition-all
                        duration-300

                        ${
                          active
                            ? "translate-x-0 opacity-100"
                            : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        }
                      `}
                    >

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>

                    </div>

                  </Link>

                );

              })}

            </div>

          </div>

        ))}
      </nav>
          </aside>
  );
}