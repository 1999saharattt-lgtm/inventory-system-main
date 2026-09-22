import Link from "next/link";
import {
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import type {
  FormHTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   SEARCH BAR
   iOS-Inspired Global Search Component

   ใช้สำหรับ:
   - ค้นหารายการพัสดุ
   - ค้นหารายการรับเข้า
   - ค้นหารายการเบิกจ่าย
   - ค้นหาครุภัณฑ์
   - ค้นหาผู้จำหน่าย
   - ค้นหาผู้ใช้งาน
   - ค้นหาหน่วยงาน

   รองรับ:
   - Server Form
   - GET Search
   - defaultValue
   - Clear Button
   - Filter Action
   - Extra Action
   - Responsive

   IMPORTANT
   - ไม่แตะ Database
   - ไม่แตะ Prisma
   - ไม่แตะ API
   - ไม่เปลี่ยน Search Logic
   - ไม่เปลี่ยน Permission
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type SearchBarProps = {
  /**
   * URL ที่ Form จะส่งไป
   */
  action?: string;

  /**
   * HTTP Method
   */
  method?: "get" | "post";

  /**
   * name ของ Search Parameter
   *
   * ค่าเริ่มต้น = q
   */
  name?: string;

  /**
   * ค่า Search ปัจจุบัน
   */
  defaultValue?: string;

  /**
   * Placeholder
   */
  placeholder?: string;

  /**
   * URL สำหรับล้าง Search
   */
  clearHref?: string;

  /**
   * แสดงปุ่มค้นหา
   */
  showSearchButton?: boolean;

  /**
   * ข้อความปุ่มค้นหา
   */
  searchButtonLabel?: string;

  /**
   * Action สำหรับ Filter
   *
   * เช่นปุ่มเปิด Filter
   */
  filterAction?: ReactNode;

  /**
   * Action เพิ่มเติมด้านขวา
   *
   * เช่น + เพิ่มข้อมูล
   */
  extraAction?: ReactNode;

  /**
   * Content เพิ่มเติมใต้ Search
   *
   * เช่น Filter Dropdown
   */
  children?: ReactNode;

  /**
   * className
   */
  className?: string;

  /**
   * Form props เพิ่มเติม
   */
  formProps?: Omit<
    FormHTMLAttributes<HTMLFormElement>,
    "action" | "method"
  >;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function SearchBar({
  action,
  method = "get",
  name = "q",
  defaultValue = "",
  placeholder = "ค้นหาข้อมูล...",
  clearHref,
  showSearchButton = true,
  searchButtonLabel = "ค้นหา",
  filterAction,
  extraAction,
  children,
  className = "",
  formProps,
}: SearchBarProps) {
  const hasSearchValue =
    defaultValue.trim().length > 0;

  return (
    <div
      className={`
        relative
        isolate

        w-full
        min-w-0

        overflow-hidden

        rounded-[22px]

        border
        border-slate-200/80

        bg-white/80

        p-3

        shadow-[0_10px_35px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

        backdrop-blur-2xl
        backdrop-saturate-150

        sm:p-4

        ${className}
      `}
    >
      {/* =====================================================
          iOS SPECULAR HIGHLIGHT
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-6
          top-0
          z-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -left-16
          -top-20
          z-0

          h-40
          w-40

          rounded-full

          bg-blue-400/[0.06]

          blur-[60px]
        "
      />

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        {...formProps}
        action={action}
        method={method}
        className="
          relative
          z-10

          flex
          w-full
          min-w-0

          flex-col

          gap-3

          lg:flex-row
          lg:items-center
        "
      >
        {/* =================================================
            SEARCH INPUT AREA
        ================================================= */}

        <div
          className="
            flex
            min-w-0
            flex-1
            items-center
            gap-2
          "
        >
          {/* ===============================================
              SEARCH INPUT
              ไม่มีไอคอนแว่นขยายภายในช่อง
          =============================================== */}

          <div
            className="
              group
              relative
              min-w-0
              flex-1
            "
          >
            <input
              type="search"
              name={name}
              defaultValue={defaultValue}
              placeholder={placeholder}
              autoComplete="off"
              className="
                min-h-[50px]
                w-full
                min-w-0

                rounded-[15px]

                border
                border-slate-200/90

                bg-slate-50/80

                py-3
                pl-4
                pr-11

                text-base
                font-bold

                !text-slate-900

                outline-none

                shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_1px_2px_rgba(255,255,255,0.8)]

                transition-[border-color,background-color,box-shadow]
                duration-200

                placeholder:!text-slate-400

                hover:border-slate-300

                focus:border-blue-500/70
                focus:bg-white

                focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10),0_4px_14px_rgba(15,23,42,0.05)]
              "
            />

            {/* ===============================================
                CLEAR SEARCH
            =============================================== */}

            {hasSearchValue && clearHref && (
              <Link
                href={clearHref}
                title="ล้างการค้นหา"
                aria-label="ล้างการค้นหา"
                className="
                  absolute
                  right-3
                  top-1/2
                  z-20

                  flex
                  h-7
                  w-7

                  -translate-y-1/2

                  items-center
                  justify-center

                  rounded-full

                  bg-slate-200/80

                  !text-slate-500

                  transition-all
                  duration-200

                  hover:bg-slate-300
                  hover:!text-slate-700

                  active:scale-90
                "
              >
                <X
                  size={15}
                  strokeWidth={2.5}
                />
              </Link>
            )}
          </div>

          {/* ===============================================
              MOBILE FILTER
          =============================================== */}

          {filterAction && (
            <div
              className="
                flex
                shrink-0
                lg:hidden
              "
            >
              {filterAction}
            </div>
          )}
        </div>

        {/* =================================================
            ACTION AREA
        ================================================= */}

        <div
          className="
            flex
            w-full
            shrink-0
            flex-wrap
            items-center
            gap-2

            lg:w-auto
            lg:flex-nowrap
          "
        >
          {/* ===============================================
              DESKTOP FILTER
          =============================================== */}

          {filterAction && (
            <div
              className="
                hidden
                shrink-0
                lg:flex
              "
            >
              {filterAction}
            </div>
          )}

          {/* ===============================================
              SEARCH BUTTON
              ไอคอนแว่นขยายตรงปุ่มยังคงไว้
          =============================================== */}

          {showSearchButton && (
            <button
              type="submit"
              className="
                inline-flex
                min-h-[46px]
                flex-1
                items-center
                justify-center
                gap-2

                rounded-[14px]

                border
                border-blue-500/30

                bg-gradient-to-b
                from-blue-500
                to-blue-600

                px-5
                py-2.5

                text-base
                font-extrabold

                !text-white

                shadow-[0_6px_16px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.25)]

                transition-all
                duration-200
                ease-out

                hover:-translate-y-0.5
                hover:from-blue-500
                hover:to-blue-700

                hover:shadow-[0_8px_20px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]

                active:translate-y-0
                active:scale-[0.97]

                sm:flex-none
              "
            >
              <Search
                size={18}
                strokeWidth={2.5}
              />

              <span className="whitespace-nowrap">
                {searchButtonLabel}
              </span>
            </button>
          )}

          {/* ===============================================
              EXTRA ACTION
          =============================================== */}

          {extraAction && (
            <div
              className="
                flex
                flex-1
                sm:flex-none
              "
            >
              {extraAction}
            </div>
          )}
        </div>
      </form>

      {/* =====================================================
          FILTER CONTENT
      ===================================================== */}

      {children && (
        <div
          className="
            relative
            z-10

            mt-3

            border-t
            border-slate-200/70

            pt-3
          "
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   OPTIONAL FILTER BUTTON

   ใช้กรณีหน้าต้องมีปุ่ม Filter
========================================================= */

type SearchFilterButtonProps = {
  children?: ReactNode;

  type?: "button" | "submit";

  className?: string;
};

export function SearchFilterButton({
  children = "ตัวกรอง",
  type = "button",
  className = "",
}: SearchFilterButtonProps) {
  return (
    <button
      type={type}
      className={`
        inline-flex
        min-h-[46px]
        items-center
        justify-center
        gap-2

        rounded-[14px]

        border
        border-slate-200

        bg-white/90

        px-4
        py-2.5

        text-base
        font-extrabold

        !text-slate-700

        shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

        backdrop-blur-xl

        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:border-slate-300
        hover:bg-white

        active:translate-y-0
        active:scale-[0.97]

        ${className}
      `}
    >
      <SlidersHorizontal
        size={18}
        strokeWidth={2.3}
      />

      <span className="whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}