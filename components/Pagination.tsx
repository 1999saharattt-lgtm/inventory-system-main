import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type PaginationProps = {
  currentPage: number;
  totalPages: number;

  /**
   * Path หลักของหน้า
   *
   * ตัวอย่าง:
   * /materials
   * /issue
   * /receive
   */
  basePath: string;

  /**
   * Query params อื่นที่ต้องการเก็บไว้
   *
   * ตัวอย่าง:
   * {
   *   q: "กระดาษ",
   *   category: "OFFICE"
   * }
   */
  query?: Record<
    string,
    string | number | null | undefined
  >;

  /**
   * ชื่อ parameter ของเลขหน้า
   *
   * default = page
   */
  pageParam?: string;

  /**
   * จำนวนปุ่มเลขหน้าที่แสดงรอบหน้าปัจจุบัน
   */
  siblingCount?: number;

  /**
   * แสดงข้อความสรุปหน้า
   */
  showSummary?: boolean;

  className?: string;
};

/* =========================================================
   PAGE ITEM
========================================================= */

type PageItem = number | "ellipsis";

/* =========================================================
   BUILD URL
========================================================= */

function buildPageUrl(
  basePath: string,
  page: number,
  pageParam: string,
  query?: PaginationProps["query"]
) {
  const params = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          params.set(
            key,
            String(value)
          );
        }
      }
    );
  }

  /*
   * หน้า 1 ไม่จำเป็นต้องแสดง ?page=1
   * URL จะดูสะอาดกว่า
   */
  if (page > 1) {
    params.set(
      pageParam,
      String(page)
    );
  } else {
    params.delete(pageParam);
  }

  const queryString =
    params.toString();

  return queryString
    ? `${basePath}?${queryString}`
    : basePath;
}

/* =========================================================
   CREATE PAGE ITEMS
========================================================= */

function createPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageItem[] {
  /*
   * ถ้ามีหน้าไม่เยอะ
   * แสดงทั้งหมดได้เลย
   */

  const maxVisiblePages =
    siblingCount * 2 + 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const items: PageItem[] = [];

  const leftSibling = Math.max(
    currentPage - siblingCount,
    2
  );

  const rightSibling = Math.min(
    currentPage + siblingCount,
    totalPages - 1
  );

  const showLeftEllipsis =
    leftSibling > 2;

  const showRightEllipsis =
    rightSibling < totalPages - 1;

  /*
   * หน้าแรก
   */

  items.push(1);

  /*
   * ...
   */

  if (showLeftEllipsis) {
    items.push("ellipsis");
  } else {
    for (
      let page = 2;
      page < leftSibling;
      page++
    ) {
      items.push(page);
    }
  }

  /*
   * หน้าตรงกลาง
   */

  for (
    let page = leftSibling;
    page <= rightSibling;
    page++
  ) {
    items.push(page);
  }

  /*
   * ...
   */

  if (showRightEllipsis) {
    items.push("ellipsis");
  } else {
    for (
      let page = rightSibling + 1;
      page < totalPages;
      page++
    ) {
      items.push(page);
    }
  }

  /*
   * หน้าสุดท้าย
   */

  items.push(totalPages);

  return items;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  query,
  pageParam = "page",
  siblingCount = 1,
  showSummary = true,
  className = "",
}: PaginationProps) {
  /*
   * ป้องกันค่าผิด
   */

  const safeTotalPages =
    Math.max(1, totalPages);

  const safeCurrentPage =
    Math.min(
      Math.max(1, currentPage),
      safeTotalPages
    );

  /*
   * ถ้ามีหน้าเดียว
   * ไม่จำเป็นต้องแสดง Pagination
   */

  if (safeTotalPages <= 1) {
    return null;
  }

  const pages = createPageItems(
    safeCurrentPage,
    safeTotalPages,
    Math.max(0, siblingCount)
  );

  const previousPage =
    safeCurrentPage - 1;

  const nextPage =
    safeCurrentPage + 1;

  const hasPrevious =
    safeCurrentPage > 1;

  const hasNext =
    safeCurrentPage <
    safeTotalPages;

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

        px-3
        py-3

        shadow-[0_10px_35px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

        backdrop-blur-2xl
        backdrop-saturate-150

        sm:px-4
        sm:py-4

        ${className}
      `}
    >
      {/* =====================================================
          iOS TOP HIGHLIGHT
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-8
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-10

          flex
          w-full

          flex-col
          gap-3

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* =================================================
            SUMMARY
        ================================================= */}

        {showSummary && (
          <div
            className="
              text-center

              text-sm
              font-bold

              !text-slate-500

              sm:text-left
              sm:text-base
            "
          >
            หน้า{" "}
            <span
              className="
                font-extrabold
                !text-slate-900
              "
            >
              {safeCurrentPage}
            </span>

            {" "}จาก{" "}

            <span
              className="
                font-extrabold
                !text-slate-900
              "
            >
              {safeTotalPages}
            </span>
          </div>
        )}

        {/* =================================================
            PAGINATION BUTTONS
        ================================================= */}

        <nav
          aria-label="Pagination"
          className="
            flex
            min-w-0
            items-center
            justify-center
            gap-1.5

            sm:justify-end
          "
        >
          {/* ===============================================
              PREVIOUS
          =============================================== */}

          {hasPrevious ? (
            <Link
              href={buildPageUrl(
                basePath,
                previousPage,
                pageParam,
                query
              )}
              aria-label="หน้าก่อนหน้า"
              title="หน้าก่อนหน้า"
              className="
                group

                inline-flex
                h-10
                min-w-10
                items-center
                justify-center
                gap-1

                rounded-[13px]

                border
                border-slate-200

                bg-white/90

                px-3

                text-sm
                font-extrabold

                !text-slate-700

                shadow-[0_3px_10px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

                transition-all
                duration-200
                ease-out

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:bg-white

                active:translate-y-0
                active:scale-[0.94]

                sm:h-11
                sm:min-w-11
                sm:px-4
              "
            >
              <ChevronLeft
                size={18}
                strokeWidth={2.5}
                className="
                  transition-transform
                  duration-200

                  group-hover:-translate-x-0.5
                "
              />

              <span
                className="
                  hidden
                  whitespace-nowrap
                  lg:inline
                "
              >
                ก่อนหน้า
              </span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="
                inline-flex
                h-10
                min-w-10
                cursor-not-allowed
                items-center
                justify-center
                gap-1

                rounded-[13px]

                border
                border-slate-200/70

                bg-slate-100/70

                px-3

                text-sm
                font-extrabold

                !text-slate-300

                sm:h-11
                sm:min-w-11
                sm:px-4
              "
            >
              <ChevronLeft
                size={18}
                strokeWidth={2.5}
              />

              <span
                className="
                  hidden
                  whitespace-nowrap
                  lg:inline
                "
              >
                ก่อนหน้า
              </span>
            </span>
          )}

          {/* ===============================================
              PAGE NUMBERS
          =============================================== */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-1
            "
          >
            {pages.map(
              (page, index) => {
                /*
                 * Ellipsis
                 */

                if (
                  page === "ellipsis"
                ) {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="
                        flex
                        h-10
                        w-8
                        shrink-0
                        items-center
                        justify-center

                        !text-slate-400

                        sm:h-11
                      "
                    >
                      <MoreHorizontal
                        size={18}
                        strokeWidth={2.4}
                      />
                    </span>
                  );
                }

                /*
                 * Current Page
                 */

                if (
                  page ===
                  safeCurrentPage
                ) {
                  return (
                    <span
                      key={page}
                      aria-current="page"
                      className="
                        flex
                        h-10
                        min-w-10
                        shrink-0
                        items-center
                        justify-center

                        rounded-[13px]

                        border
                        border-blue-500/30

                        bg-gradient-to-b
                        from-blue-500
                        to-blue-600

                        px-2

                        text-sm
                        font-extrabold

                        !text-white

                        shadow-[0_6px_16px_rgba(37,99,235,0.24),inset_0_1px_0_rgba(255,255,255,0.25)]

                        sm:h-11
                        sm:min-w-11
                        sm:text-base
                      "
                    >
                      {page}
                    </span>
                  );
                }

                /*
                 * Normal Page
                 */

                return (
                  <Link
                    key={page}
                    href={buildPageUrl(
                      basePath,
                      page,
                      pageParam,
                      query
                    )}
                    aria-label={`ไปหน้า ${page}`}
                    className="
                      flex
                      h-10
                      min-w-10
                      shrink-0
                      items-center
                      justify-center

                      rounded-[13px]

                      border
                      border-slate-200

                      bg-white/90

                      px-2

                      text-sm
                      font-extrabold

                      !text-slate-700

                      shadow-[0_3px_10px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]

                      transition-all
                      duration-200

                      hover:-translate-y-0.5
                      hover:border-blue-300
                      hover:bg-blue-50
                      hover:!text-blue-600

                      active:translate-y-0
                      active:scale-[0.92]

                      sm:h-11
                      sm:min-w-11
                      sm:text-base
                    "
                  >
                    {page}
                  </Link>
                );
              }
            )}
          </div>

          {/* ===============================================
              NEXT
          =============================================== */}

          {hasNext ? (
            <Link
              href={buildPageUrl(
                basePath,
                nextPage,
                pageParam,
                query
              )}
              aria-label="หน้าถัดไป"
              title="หน้าถัดไป"
              className="
                group

                inline-flex
                h-10
                min-w-10
                items-center
                justify-center
                gap-1

                rounded-[13px]

                border
                border-slate-200

                bg-white/90

                px-3

                text-sm
                font-extrabold

                !text-slate-700

                shadow-[0_3px_10px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

                transition-all
                duration-200
                ease-out

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:bg-white

                active:translate-y-0
                active:scale-[0.94]

                sm:h-11
                sm:min-w-11
                sm:px-4
              "
            >
              <span
                className="
                  hidden
                  whitespace-nowrap
                  lg:inline
                "
              >
                ถัดไป
              </span>

              <ChevronRight
                size={18}
                strokeWidth={2.5}
                className="
                  transition-transform
                  duration-200

                  group-hover:translate-x-0.5
                "
              />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="
                inline-flex
                h-10
                min-w-10
                cursor-not-allowed
                items-center
                justify-center
                gap-1

                rounded-[13px]

                border
                border-slate-200/70

                bg-slate-100/70

                px-3

                text-sm
                font-extrabold

                !text-slate-300

                sm:h-11
                sm:min-w-11
                sm:px-4
              "
            >
              <span
                className="
                  hidden
                  whitespace-nowrap
                  lg:inline
                "
              >
                ถัดไป
              </span>

              <ChevronRight
                size={18}
                strokeWidth={2.5}
              />
            </span>
          )}
        </nav>
      </div>
    </div>
  );
}