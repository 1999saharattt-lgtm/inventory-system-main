"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


export default function Sidebar() {

  const pathname = usePathname();


  const menus = [
    {
      title: "หน้าหลัก",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: "🏠"
        }
      ]
    },


    {
      title: "จัดการพัสดุ",
      items: [
        {
          name: "รายการพัสดุทั้งหมด",
          href: "/materials",
          icon: "📦"
        },
        {
          name: "รับเข้า",
          href: "/receive",
          icon: "📥"
        },
        {
          name: "เบิกจ่าย",
          href: "/issue",
          icon: "📤"
        },
        {
          name: "บัญชีพัสดุ",
          href: "/stock-card",
          icon: "📋"
        },
        {
          name: "ทะเบียนครุภัณฑ์",
          href: "/assets",
          icon: "🖥️"
        },
      ]
    },


    {
      title: "ข้อมูลพื้นฐาน",
      items: [
        {
          name: "ผู้จำหน่าย",
          href: "/vendors",
          icon: "🚚"
        },
        {
          name: "กลุ่มงาน",
          href: "/departments",
          icon: "🏢"
        },
        {
          name: "ผู้ใช้งานระบบ",
          href: "/users",
          icon: "👤"
        },
      ]
    }
  ];



  return (

    <aside
      className="
        w-60
        min-h-screen
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950
        shadow-2xl
        border-r
        border-slate-800
        shrink-0
      "
    >


      {/* Header */}

      <div
        className="
          p-3
          border-b
          border-slate-800
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            bg-white/95
            rounded-xl
            p-3
            shadow-xl
            border
            border-slate-200
          "
        >

          <div
            className="
              w-10
              h-10
              rounded-full
              bg-white
              flex
              items-center
              justify-center
              shadow-lg
              overflow-hidden
              shrink-0
            "
          >

            <img
              src="/images/dohl-logo.png"
              alt="กรมอนามัย"
              className="
                w-8
                h-8
                object-contain
              "
            />

          </div>



          <div
            className="
              flex-1
              flex
              flex-col
              justify-center
              items-center
              text-center
              min-w-0
            "
          >

            <h1
              className="
                whitespace-nowrap
                text-base
                font-extrabold
                text-slate-800
                leading-tight
              "
            >
              ระบบบริหารคลังพัสดุ
            </h1>


            <p
              className="
                whitespace-nowrap
                text-sm
                text-blue-600
                mt-1
                font-bold
              "
            >
              สำนักอนามัยการเจริญพันธุ์
            </p>


          </div>


        </div>


      </div>





      {/* Menu */}

      <nav
        className="
          px-3
          py-3
          space-y-4
        "
      >

        {
          menus.map((group) => (

            <div
              key={group.title}
            >

              <div
                className="
                  px-3
                  mb-2
                "
              >

                <p
                  className="
                    text-sm
                    font-bold
                    !text-white
                    tracking-wide
                  "
                >
                  {group.title}
                </p>

              </div>


              <div
                className="
                  space-y-1
                "
              >

                {
                  group.items.map((item) => {

                    const active =
                      pathname === item.href ||
                      (
                        item.href !== "/" &&
                        pathname.startsWith(item.href)
                      );


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
                          px-3
                          py-2
                          rounded-xl
                          transition-all
                          duration-300
                          hover:translate-x-1


                          ${
                            active

                            ?

                            `
                              bg-blue-600
                              text-white
                              shadow-lg
                              shadow-blue-900/30

                              before:absolute
                              before:left-0
                              before:top-2
                              before:h-6
                              before:w-1
                              before:bg-blue-300
                              before:rounded-r-full
                            `


                            :

                            `
                              text-slate-300
                              hover:bg-slate-700/70
                              hover:text-white
                              hover:shadow-lg
                            `
                          }

                        `}

                      >

                        <span
                          className="
                            w-6
                            text-center
                            text-base
                            transition
                            group-hover:scale-110
                            shrink-0
                          "
                        >
                          {item.icon}
                        </span>



                        <span
                          className="
                            whitespace-nowrap
                            text-base
                            font-bold
                          "
                        >
                          {item.name}
                        </span>


                      </Link>


                    );


                  })
                }


              </div>


            </div>


          ))
        }


      </nav>


    </aside>

  );

}