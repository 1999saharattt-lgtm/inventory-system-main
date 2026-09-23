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
   THAI SHORT DATE
   ตัวอย่าง 23 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getDate();

  const month =
    thaiShortMonths[
      date.getMonth()
    ];

  const buddhistYear = String(
    date.getFullYear() + 543
  ).slice(-2);

  return `${day} ${month} ${buddhistYear}`;
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

  if (params.date === "today") {
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
     CURRENT MONTH
  ======================================================= */

  if (params.period === "month") {
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

    ...(startDate && endDate
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

     เรียง:
     1. วันที่ล่าสุดอยู่ด้านบน
     2. วันที่เก่าอยู่ด้านล่าง
     3. ถ้าวันเดียวกัน ID ใหม่กว่าอยู่ด้านบน
  ======================================================= */

  const issues =
    await prisma.issue.findMany({
      where: issueWhere,

      orderBy: [
        {
          issueDate: "desc",
        },
        {
          id: "desc",
        },
      ],

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
     FILTER DESCRIPTION
  ======================================================= */

  let filterText =
    "รายการเบิกจ่ายพัสดุทั้งหมด";

  if (params.date === "today") {
    filterText =
      "รายการเบิกจ่ายพัสดุวันนี้";
  } else if (
    params.period === "month"
  ) {
    filterText =
      "รายการเบิกจ่ายพัสดุประจำเดือนนี้";
  }

  /* =======================================================
     TABLE SUBTITLE
  ======================================================= */

  let tableSubtitle =
    "ข้อมูลการเบิกจ่ายพัสดุทั้งหมด";

  if (params.date === "today") {
    tableSubtitle =
      "ข้อมูลการเบิกจ่ายพัสดุของวันนี้";
  } else if (
    params.period === "month"
  ) {
    tableSubtitle =
      "ข้อมูลการเบิกจ่ายพัสดุประจำเดือนนี้";
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📤"
        title="รายการเบิกจ่ายพัสดุ"
        subtitle={filterText}
        actions={
          <>
            {/* ===============================================
                ADD ISSUE
            =============================================== */}

            <AppButton
              href="/issue/create"
              variant="primary"
              size="md"
              icon={
                <span aria-hidden="true">
                  ＋
                </span>
              }
            >
              เพิ่มรายการ
            </AppButton>

            {/* ===============================================
                BACK TO HOME
            =============================================== */}

            <AppButton
              href="/"
              variant="back"
              size="md"
              icon={
                <span aria-hidden="true">
                  ←
                </span>
              }
            >
              กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          PENDING ALERT
          ADMIN ONLY
      ===================================================== */}

      {session?.role === "ADMIN" &&
        pendingCount > 0 && (
          <div
            className="
              w-full
              min-w-0

              rounded-[24px]

              border
              border-amber-200

              bg-amber-50

              p-4

              shadow-[0_12px_30px_-22px_rgba(146,64,14,0.25)]

              sm:p-5
            "
          >
            <div
              className="
                flex
                min-w-0
                flex-col
                gap-3

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    text-base
                    font-extrabold
                    !text-amber-900

                    sm:text-lg
                  "
                >
                  🔔 มีรายการรอเบิกจ่าย
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
                  {pendingCount.toLocaleString(
                    "th-TH"
                  )}{" "}
                  รายการ
                  รอเจ้าหน้าที่พัสดุตรวจสอบและลงจำนวนเบิกจ่ายจริง
                </p>
              </div>

              <span
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center

                  whitespace-nowrap

                  rounded-full

                  border
                  border-amber-300

                  bg-white

                  px-4
                  py-2

                  text-sm
                  font-extrabold
                  !text-amber-900
                "
              >
                รอ{" "}
                {pendingCount.toLocaleString(
                  "th-TH"
                )}{" "}
                รายการ
              </span>
            </div>
          </div>
        )}

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <AppTableCard
        title="รายการเอกสารเบิกจ่าย"
        subtitle={tableSubtitle}
        badge={`${issues.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE SCROLL
        =================================================== */}

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
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "วันที่",
                  "เลขที่เอกสาร",
                  "หน่วยงาน / กลุ่มงาน",
                  "ผู้ขอเบิก",
                  "สถานะ",
                  "รายละเอียด",
                  "จัดการ",
                ].map(
                  (tableTitle) => (
                    <th
                      key={tableTitle}
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-4
                        py-4

                        text-center
                        text-base
                        font-extrabold
                        !text-white

                        sm:text-lg
                      "
                    >
                      {tableTitle}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {issues.length > 0 ? (
                issues.map(
                  (
                    issue: Issue,
                    index: number
                  ) => (
                    <tr
                      key={issue.id}
                      className={`
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ORDER
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {(
                          index + 1
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* =======================================
                          DATE
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          tabular-nums
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          issue.issueDate
                        )}
                      </td>

                      {/* =======================================
                          DOCUMENT NUMBER
                      ======================================= */}

                      <td
                        className="
                          min-w-[160px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {issue.documentNo ||
                          "-"}
                      </td>

                      {/* =======================================
                          DEPARTMENT
                      ======================================= */}

                      <td
                        className="
                          min-w-[220px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {issue.department
                          ?.name ?? "-"}
                      </td>

                      {/* =======================================
                          OFFICER
                      ======================================= */}

                      <td
                        className="
                          min-w-[190px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {issue.officer
                          ? `${issue.officer.firstName} ${issue.officer.lastName}`
                          : "-"}
                      </td>

                      {/* =======================================
                          STATUS
                      ======================================= */}

                      <td
                        className="
                          min-w-[150px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

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

                              whitespace-nowrap

                              rounded-full

                              bg-amber-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-amber-800
                            "
                          >
                            🔔 รอเบิกจ่าย
                          </span>
                        ) : issue.status ===
                          "APPROVED" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-emerald-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-emerald-800
                            "
                          >
                            ✓ เสร็จสิ้นแล้ว
                          </span>
                        ) : issue.status ===
                          "REJECTED" ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-red-100

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold
                              !text-red-800
                            "
                          >
                            ✕ ไม่อนุมัติ
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
                            "
                          >
                            {getStatusLabel(
                              issue.status
                            )}
                          </span>
                        )}
                      </td>

                      {/* =======================================
                          DETAILS
                      ======================================= */}

                      <td
                        className="
                          min-w-[130px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3

                          text-center
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <AppButton
                            href={`/issue/${issue.id}`}
                            variant="primary"
                            size="sm"
                          >
                            เปิด
                          </AppButton>
                        </div>
                      </td>

                      {/* =======================================
                          ACTIONS
                      ======================================= */}

                      <td
                        className="
                          min-w-[200px]
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          <AppButton
                            href={`/issue/${issue.id}/edit`}
                            variant="primary"
                            size="sm"
                            icon={
                              <span
                                aria-hidden="true"
                              >
                                ✏️
                              </span>
                            }
                          >
                            แก้ไข
                          </AppButton>

                          <DeleteButton
                            id={issue.id}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                /* =============================================
                   EMPTY STATE
                   ไม่มีปุ่มเพิ่มรายการด้านล่าง
                ============================================= */

                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-black

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
                      {/* ICON */}

                      <div
                        className="
                          grid
                          h-16
                          w-16
                          place-items-center

                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        📤
                      </div>

                      {/* TITLE */}

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight
                          !text-slate-900
                        "
                      >
                        {params.date ===
                        "today"
                          ? "วันนี้ยังไม่มีรายการเบิกจ่ายพัสดุ"
                          : params.period ===
                              "month"
                            ? "เดือนนี้ยังไม่มีรายการเบิกจ่ายพัสดุ"
                            : "ยังไม่มีรายการเบิกจ่ายพัสดุ"}
                      </p>

                      {/* DESCRIPTION */}

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed
                          !text-slate-500
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