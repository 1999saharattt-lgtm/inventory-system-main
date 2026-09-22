import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/* =========================================================
   DATA TABLE
   iOS-Inspired Global Table Components

   ใช้เป็นมาตรฐานตารางทั้งระบบ เช่น

   - รายการพัสดุ
   - รายการรับเข้า
   - รายการเบิกจ่าย
   - บัญชีคุมพัสดุ
   - ทะเบียนครุภัณฑ์
   - รายการผู้จำหน่าย
   - รายการผู้ใช้งาน
   - ประวัติการตรวจสอบ

   IMPORTANT
   - UI Component เท่านั้น
   - ไม่แตะ Database
   - ไม่แตะ Prisma
   - ไม่แตะ API
   - ไม่เปลี่ยนข้อมูล
   - ไม่เปลี่ยน Business Logic

   GLOBAL RULE
   หัวตารางยังคงมาตรฐาน:
   bg-gradient-to-r
   from-slate-800
   to-slate-700
   text-white
========================================================= */

/* =========================================================
   HELPERS
========================================================= */

function mergeClassName(
  base: string,
  className?: string
) {
  return `${base} ${className ?? ""}`;
}

/* =========================================================
   DATA TABLE CONTAINER
========================================================= */

type DataTableContainerProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
  };

export function DataTableContainer({
  children,
  className,
  ...props
}: DataTableContainerProps) {
  return (
    <div
      {...props}
      className={mergeClassName(
        `
          relative
          isolate
          w-full
          min-w-0
          overflow-hidden
          rounded-[22px]
          border
          border-slate-200/90
          bg-white/95
          shadow-[0_12px_35px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)]
          backdrop-blur-2xl
          backdrop-saturate-150
        `,
        className
      )}
    >
      {/* iOS Highlight */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-6
          top-0
          z-20
          h-px
          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {children}
    </div>
  );
}

/* =========================================================
   TABLE SCROLL AREA
========================================================= */

type DataTableScrollProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
  };

export function DataTableScroll({
  children,
  className,
  ...props
}: DataTableScrollProps) {
  return (
    <div
      {...props}
      className={mergeClassName(
        `
          w-full
          min-w-0
          overflow-x-auto
          overscroll-x-contain
        `,
        className
      )}
    >
      {children}
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

type DataTableProps =
  TableHTMLAttributes<HTMLTableElement> & {
    children: ReactNode;
  };

export function DataTable({
  children,
  className,
  ...props
}: DataTableProps) {
  return (
    <table
      {...props}
      className={mergeClassName(
        `
          w-full
          min-w-full
          border-separate
          border-spacing-0
          bg-white
          text-base
        `,
        className
      )}
    >
      {children}
    </table>
  );
}

/* =========================================================
   TABLE HEAD
========================================================= */

type DataTableHeadProps =
  HTMLAttributes<HTMLTableSectionElement> & {
    children: ReactNode;
  };

export function DataTableHead({
  children,
  className,
  ...props
}: DataTableHeadProps) {
  return (
    <thead
      {...props}
      className={mergeClassName(
        `
          bg-gradient-to-r
          from-slate-800
          to-slate-700
          !text-white
        `,
        className
      )}
    >
      {children}
    </thead>
  );
}

/* =========================================================
   HEADER CELL
========================================================= */

type DataTableHeaderCellProps =
  ThHTMLAttributes<HTMLTableCellElement> & {
    children?: ReactNode;
  };

export function DataTableHeaderCell({
  children,
  className,
  ...props
}: DataTableHeaderCellProps) {
  return (
    <th
      {...props}
      className={mergeClassName(
        `
          border-b
          border-r
          border-white/10

          bg-transparent

          px-4
          py-3.5

          text-center
          align-middle

          text-base
          font-extrabold
          leading-tight

          !text-white

          first:border-l-0
          last:border-r-0

          sm:px-5
          sm:py-4
          sm:text-lg
        `,
        className
      )}
    >
      {children}
    </th>
  );
}

/* =========================================================
   TABLE BODY
========================================================= */

type DataTableBodyProps =
  HTMLAttributes<HTMLTableSectionElement> & {
    children: ReactNode;
  };

export function DataTableBody({
  children,
  className,
  ...props
}: DataTableBodyProps) {
  return (
    <tbody
      {...props}
      className={mergeClassName(
        `
          divide-y
          divide-slate-100
          bg-white
        `,
        className
      )}
    >
      {children}
    </tbody>
  );
}

/* =========================================================
   TABLE ROW
========================================================= */

type DataTableRowProps =
  HTMLAttributes<HTMLTableRowElement> & {
    children: ReactNode;

    clickable?: boolean;

    selected?: boolean;
  };

export function DataTableRow({
  children,
  clickable = false,
  selected = false,
  className,
  ...props
}: DataTableRowProps) {
  return (
    <tr
      {...props}
      className={mergeClassName(
        `
          group
          transition-[background-color,box-shadow]
          duration-200
          ease-out

          ${
            selected
              ? `
                bg-blue-50/80
                shadow-[inset_3px_0_0_rgba(37,99,235,0.85)]
              `
              : `
                bg-white
                hover:bg-slate-50/90
              `
          }

          ${
            clickable
              ? `
                cursor-pointer
                active:bg-slate-100
              `
              : ""
          }
        `,
        className
      )}
    >
      {children}
    </tr>
  );
}

/* =========================================================
   TABLE CELL
========================================================= */

type DataTableCellProps =
  TdHTMLAttributes<HTMLTableCellElement> & {
    children?: ReactNode;
  };

export function DataTableCell({
  children,
  className,
  ...props
}: DataTableCellProps) {
  return (
    <td
      {...props}
      className={mergeClassName(
        `
          border-b
          border-slate-100

          px-4
          py-3.5

          align-middle

          text-base
          font-bold
          leading-snug

          !text-slate-700

          transition-colors
          duration-200

          group-last:border-b-0

          sm:px-5
          sm:py-4
          sm:text-lg
        `,
        className
      )}
    >
      {children}
    </td>
  );
}

/* =========================================================
   TABLE NUMBER CELL
========================================================= */

type DataTableNumberCellProps =
  TdHTMLAttributes<HTMLTableCellElement> & {
    children?: ReactNode;
  };

export function DataTableNumberCell({
  children,
  className,
  ...props
}: DataTableNumberCellProps) {
  return (
    <DataTableCell
      {...props}
      className={mergeClassName(
        `
          whitespace-nowrap
          text-center
          tabular-nums
        `,
        className
      )}
    >
      {children}
    </DataTableCell>
  );
}

/* =========================================================
   TABLE ACTION CELL
========================================================= */

type DataTableActionCellProps =
  TdHTMLAttributes<HTMLTableCellElement> & {
    children?: ReactNode;
  };

export function DataTableActionCell({
  children,
  className,
  ...props
}: DataTableActionCellProps) {
  return (
    <DataTableCell
      {...props}
      className={mergeClassName(
        `
          whitespace-nowrap
          text-center
        `,
        className
      )}
    >
      <div
        className="
          flex
          min-w-max
          items-center
          justify-center
          gap-2
        "
      >
        {children}
      </div>
    </DataTableCell>
  );
}

/* =========================================================
   TABLE EMPTY ROW
========================================================= */

type DataTableEmptyRowProps = {
  colSpan: number;

  title?: ReactNode;

  description?: ReactNode;

  icon?: ReactNode;

  className?: string;
};

export function DataTableEmptyRow({
  colSpan,
  title = "ไม่พบข้อมูล",
  description,
  icon = "📭",
  className = "",
}: DataTableEmptyRowProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`
          px-5
          py-12
          text-center
          ${className}
        `}
      >
        <div
          className="
            mx-auto
            flex
            max-w-md
            flex-col
            items-center
            justify-center
          "
        >
          <div
            className="
              relative
              flex
              h-14
              w-14
              items-center
              justify-center
              overflow-hidden
              rounded-[18px]
              border
              border-slate-200
              bg-gradient-to-b
              from-white
              to-slate-100
              text-2xl
              shadow-[0_6px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)]
            "
          >
            <span
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-x-2
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-white
                to-transparent
              "
            />

            <span className="relative z-10">
              {icon}
            </span>
          </div>

          <p
            className="
              mt-4
              text-lg
              font-extrabold
              !text-slate-800
              sm:text-xl
            "
          >
            {title}
          </p>

          {description !== undefined &&
            description !== null && (
              <p
                className="
                  mt-1.5
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                  sm:text-base
                "
              >
                {description}
              </p>
            )}
        </div>
      </td>
    </tr>
  );
}