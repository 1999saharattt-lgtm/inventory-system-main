import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

import DeleteButton from "./DeleteButton";

/* =========================================================
   TYPES
========================================================= */

type Issue = {
  id: number;
  issueDate: Date;
  documentNo: string;
  remark: string | null;
  status: string;

  department: {
    name: string;
  };

  officer: {
    firstName: string;
    lastName: string;
  } | null;

  items: {
    id: number;
    qty: number;
    manufacture: Date | null;
    expiry: Date | null;

    material: {
      id: number;
      name: string;
      unit: string;
    };
  }[];
};

type IssuePageProps = {
  searchParams: Promise<{
    date?: string;
    period?: string;
  }>;
};

/* =========================================================
   THAI DATE
========================================================= */

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiDate(
  date: Date | string | null
) {
  if (!date) {
    return "-";
  }

  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return `${parsedDate.getDate()} ${
    thaiMonths[
      parsedDate.getMonth()
    ]
  } ${
    parsedDate.getFullYear() + 543
  }`;
}

/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "PENDING":
      return "รอเบิกจ่าย";

    case "APPROVED":
      return "เสร็จสิ้นแล้ว";

    case "REJECTED":
      return "ไม่อนุมัติ";

    default:
      return status || "-";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function IssuePage({
  searchParams,
}: IssuePageProps) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const params =
    await searchParams;

  /* =======================================================
     SESSION
  ======================================================= */

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "session"
    )?.value;

  let session:
    | SessionUser
    | null = null;

  if (token) {
    try {
      session =
        await verifySession(
          token
        );
    } catch {
      session = null;
    }
  }

  /* =======================================================
     DEPARTMENT PERMISSION
  ======================================================= */

  const issueDepartmentWhere =
    session?.role === "ADMIN"
      ? {}
      : session?.departmentId
        ? {
            departmentId:
              session.departmentId,
          }
        : {
            departmentId: -1,
          };

  /* =======================================================
     DATE FILTER
  ======================================================= */

  const now = new Date();

  let startDate:
    | Date
    | undefined;

  let endDate:
    | Date
    | undefined;

  /* =======================================================
     TODAY
  ======================================================= */

  if (
    params.date === "today"
  ) {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
  }

  /* =======================================================
     THIS MONTH
  ======================================================= */

  if (
    params.period === "month"
  ) {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );
  }

  /* =======================================================
     WHERE
  ======================================================= */

  const issueWhere = {
    ...issueDepartmentWhere,

    ...(startDate &&
    endDate
      ? {
          issueDate: {
            gte: startDate,
            lt: endDate,
          },
        }
      : {}),
  };

  /* =======================================================
     LOAD ISSUES
  ======================================================= */

  const issues =
    await prisma.issue.findMany({
      where: issueWhere,

      orderBy: {
        issueDate: "desc",
      },

      include: {
        department: true,
        officer: true,

        items: {
          include: {
            material: true,
          },
        },
      },
    });

  /* =======================================================
     PENDING COUNT
  ======================================================= */

  const pendingCount =
    session?.role === "ADMIN"
      ? issues.filter(
          (issue) =>
            issue.status ===
            "PENDING"
        ).length
      : 0;

  /* =======================================================
     ACTIVE FILTER LABEL
  ======================================================= */

  const filterLabel =
    params.date === "today"
      ? "รายการเบิกจ่ายวันนี้"
      : params.period ===
          "month"
        ? "รายการเบิกจ่ายประจำเดือนนี้"
        : "รายการเบิกจ่ายทั้งหมด";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* ===================================================
          HEADER
      =================================================== */}

      <AppPageHeader
        icon="📤"
        title="รายการเบิกจ่ายพัสดุ"
        subtitle="แสดงรายการเอกสารเบิกจ่ายพัสดุของกลุ่มงาน"
        actions={
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-end
              gap-3
            "
          >
            <AppButton
              href="/issue/create"
              variant="success"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ＋
                </span>
              }
            >
              เพิ่มรายการ
            </AppButton>

            <AppButton
              href="/"
              variant="back"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ←
                </span>
              }
            >
              กลับ
            </AppButton>
          </div>
        }
      />

      {/* ===================================================
          PENDING ALERT
      =================================================== */}

      {session?.role ===
        "ADMIN" &&
        pendingCount > 0 && (
          <div
            className="
              relative
              overflow-hidden

              rounded-[24px]

              border
              border-amber-200

              bg-gradient-to-r
              from-amber-50
              via-yellow-50
              to-white

              p-4
              sm:p-5

              shadow-[0_14px_40px_-24px_rgba(120,53,15,0.35)]
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-start
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

                    rounded-[15px]

                    bg-amber-100

                    text-xl

                    shadow-sm

                    ring-1
                    ring-amber-200
                  "
                >
                  🔔
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-base
                      font-black
                      !text-amber-900

                      sm:text-lg
                    "
                  >
                    มีรายการรอเบิกจ่าย
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-semibold
                      leading-relaxed
                      !text-amber-800
                    "
                  >
                    มีใบเบิกจำนวน{" "}
                    {pendingCount}{" "}
                    รายการ
                    รอเจ้าหน้าที่พัสดุตรวจสอบและลงจำนวนเบิกจ่ายจริง
                  </p>
                </div>
              </div>

              <div
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  bg-amber-500

                  px-4
                  py-2

                  text-sm
                  font-extrabold
                  !text-white

                  shadow-sm
                "
              >
                รอ {pendingCount}{" "}
                รายการ
              </div>
            </div>
          </div>
        )}

      {/* ===================================================
          TABLE CARD
      =================================================== */}

      <AppTableCard
        title="รายการเบิกจ่ายพัสดุ"
        subtitle={filterLabel}
        badge={`${issues.length} รายการ`}
        className="
          relative
          overflow-hidden
        "
      >
        <div
          className="
            w-full
            min-w-0

            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1180px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =============================================
                TABLE HEADER
            ============================================= */}

            <thead>
              <tr>
                <th
                  className="
                    w-[70px]

                    whitespace-nowrap

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    min-w-[160px]

                    whitespace-nowrap

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  วันที่
                </th>

                <th
                  className="
                    min-w-[150px]

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  เลขที่เอกสาร
                </th>

                <th
                  className="
                    min-w-[220px]

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  หน่วยงาน / กลุ่มงาน
                </th>

                <th
                  className="
                    min-w-[180px]

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  ผู้ขอเบิก
                </th>

                <th
                  className="
                    min-w-[150px]

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  สถานะ
                </th>

                <th
                  className="
                    min-w-[120px]

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  รายละเอียด
                </th>

                <th
                  className="
                    min-w-[190px]

                    border
                    border-slate-700

                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700

                    px-3
                    py-4

                    text-center
                    text-base
                    font-extrabold
                    !text-white
                  "
                >
                  จัดการ
                </th>
              </tr>
            </thead>

            {/* =============================================
                TABLE BODY
            ============================================= */}

            <tbody>
              {issues.length >
              0 ? (
                issues.map(
                  (
                    issue: Issue,
                    index: number
                  ) => (
                    <tr
                      key={issue.id}
                      className={`
                        ${
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* ===================================
                          ลำดับ
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* ===================================
                          วันที่
                      =================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-bold
                          !text-slate-800
                        "
                      >
                        {formatThaiDate(
                          issue.issueDate
                        )}
                      </td>

                      {/* ===================================
                          เลขที่เอกสาร
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-bold
                          !text-slate-900
                        "
                      >
                        <span className="break-words">
                          {issue.documentNo}
                        </span>
                      </td>

                      {/* ===================================
                          หน่วยงาน / กลุ่มงาน
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-bold
                          !text-slate-800
                        "
                      >
                        <span className="break-words">
                          {issue.department
                            ?.name ?? "-"}
                        </span>
                      </td>

                      {/* ===================================
                          ผู้ขอเบิก
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-bold
                          !text-slate-800
                        "
                      >
                        <span className="break-words">
                          {issue.officer
                            ? `${issue.officer.firstName} ${issue.officer.lastName}`
                            : "-"}
                        </span>
                      </td>

                      {/* ===================================
                          STATUS
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                        "
                      >
                        {issue.status ===
                        "PENDING" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-1.5

                              whitespace-nowrap

                              rounded-full

                              bg-amber-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-amber-800

                              ring-1
                              ring-amber-200/80
                            "
                          >
                            <span>
                              🔔
                            </span>

                            รอเบิกจ่าย
                          </span>
                        ) : issue.status ===
                          "APPROVED" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-1.5

                              whitespace-nowrap

                              rounded-full

                              bg-emerald-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-emerald-800

                              ring-1
                              ring-emerald-200/80
                            "
                          >
                            <span>
                              ✓
                            </span>

                            เสร็จสิ้นแล้ว
                          </span>
                        ) : issue.status ===
                          "REJECTED" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-1.5

                              whitespace-nowrap

                              rounded-full

                              bg-red-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-red-800

                              ring-1
                              ring-red-200/80
                            "
                          >
                            <span>
                              ✕
                            </span>

                            ไม่อนุมัติ
                          </span>
                        ) : (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-slate-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-slate-700

                              ring-1
                              ring-slate-200
                            "
                          >
                            {getStatusLabel(
                              issue.status
                            )}
                          </span>
                        )}
                      </td>

                      {/* ===================================
                          รายละเอียด
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                        "
                      >
                        <Link
                          href={`/issue/${issue.id}`}
                          className="
                            inline-flex
                            min-h-[38px]
                            items-center
                            justify-center

                            whitespace-nowrap

                            rounded-[10px]

                            bg-slate-800

                            px-4
                            py-2

                            text-sm
                            font-extrabold
                            leading-none
                            !text-white

                            shadow-sm

                            transition-all
                            duration-200

                            hover:bg-slate-700
                            hover:shadow-md

                            active:scale-[0.97]

                            focus:outline-none
                            focus:ring-4
                            focus:ring-slate-900/10
                          "
                        >
                          เปิด
                        </Link>
                      </td>

                      {/* ===================================
                          จัดการ
                      =================================== */}

                      <td
                        className="
                          border
                          border-slate-200

                          px-3
                          py-3

                          text-center
                        "
                      >
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          <Link
                            href={`/issue/${issue.id}/edit`}
                            className="
                              inline-flex
                              min-h-[38px]
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-[10px]

                              bg-amber-500

                              px-4
                              py-2

                              text-sm
                              font-extrabold
                              leading-none
                              !text-white

                              shadow-sm

                              transition-all
                              duration-200

                              hover:bg-amber-600
                              hover:shadow-md

                              active:scale-[0.97]

                              focus:outline-none
                              focus:ring-4
                              focus:ring-amber-500/20
                            "
                          >
                            แก้ไข
                          </Link>

                          <DeleteButton
                            id={issue.id}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-slate-200

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
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
                          flex
                          h-14
                          w-14
                          items-center
                          justify-center

                          rounded-2xl

                          bg-slate-100

                          text-2xl

                          shadow-inner
                        "
                      >
                        📤
                      </div>

                      <p
                        className="
                          mt-4

                          text-base
                          font-extrabold
                          !text-slate-700
                        "
                      >
                        ยังไม่มีรายการเบิกจ่ายพัสดุ
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          !text-slate-400
                        "
                      >
                        เมื่อมีการบันทึกรายการเบิกจ่าย
                        ข้อมูลจะแสดงในตารางนี้
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}