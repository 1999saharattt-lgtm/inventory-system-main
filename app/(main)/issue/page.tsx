import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import DeleteButton from "./DeleteButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

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
   ตัวอย่าง:
   23 ก.ย. 69
   1 ม.ค. 70
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
  const params =
    await searchParams;

  /* =========================================================
     SESSION
  ========================================================= */

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

  /* =========================================================
     DEPARTMENT PERMISSION

     ADMIN
     - เห็นทุกกลุ่มงาน

     STAFF / VIEWER
     - เห็นเฉพาะกลุ่มงานของตัวเอง
  ========================================================= */

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

  /* =========================================================
     DATE FILTER
  ========================================================= */

  const now = new Date();

  let startDate:
    | Date
    | undefined;

  let endDate:
    | Date
    | undefined;

  /* =========================================================
     TODAY
  ========================================================= */

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

  /* =========================================================
     CURRENT MONTH
  ========================================================= */

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

  /* =========================================================
     WHERE
  ========================================================= */

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

  /* =========================================================
     LOAD ISSUE DATA

     เรียง:
     1. วันที่เบิกจ่ายล่าสุดอยู่ด้านบน
     2. วันที่เก่าอยู่ด้านล่าง
     3. ถ้าวันที่ซ้ำกัน รายการที่บันทึกใหม่กว่าอยู่ด้านบน
  ========================================================= */

  const issues =
    await prisma.issue.findMany({
      where: issueWhere,

      include: {
        department: true,
        officer: true,

        items: {
          include: {
            material: true,
          },
        },
      },

      orderBy: [
        {
          issueDate: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

  /* =========================================================
     PENDING COUNT
  ========================================================= */

  const pendingCount =
    session?.role === "ADMIN"
      ? issues.filter(
          (issue) =>
            issue.status ===
            "PENDING"
        ).length
      : 0;

  /* =========================================================
     FILTER DESCRIPTION
  ========================================================= */

  let filterText =
    "รายการเบิกจ่ายพัสดุทั้งหมด";

  if (
    params.date === "today"
  ) {
    filterText =
      "รายการเบิกจ่ายพัสดุวันนี้";
  } else if (
    params.period === "month"
  ) {
    filterText =
      "รายการเบิกจ่ายพัสดุประจำเดือนนี้";
  }

  /* =========================================================
     UI
  ========================================================= */

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
          <AppButton
            href="/issue/create"
            variant="primary"
            size="md"
            icon={<span>＋</span>}
          >
            เพิ่มรายการ
          </AppButton>
        }
      />

      {/* =====================================================
          PENDING ALERT
          เฉพาะ ADMIN
      ===================================================== */}

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
                รอ {pendingCount} รายการ
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          TABLE CARD
          ใช้ Component กลางของระบบ
      ===================================================== */}

      <AppTableCard
        title="รายการเอกสารเบิกจ่าย"
        subtitle={`เรียงจากวันที่เบิกจ่ายล่าสุด • ทั้งหมด ${issues.length} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE
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
                  "วันที่เบิกจ่าย",
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
              {issues.length >
              0 ? (
                issues.map(
                  (
                    issue: Issue,
                    index: number
                  ) => (
                    <tr
                      key={
                        issue.id
                      }
                      className={`
                        transition-all
                        duration-200

                        ${
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ลำดับ
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
                          !text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* =======================================
                          วันที่เบิกจ่าย
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
                          เลขที่เอกสาร
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
                          !text-slate-900
                        "
                      >
                        {issue.documentNo}
                      </td>

                      {/* =======================================
                          หน่วยงาน / กลุ่มงาน
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
                          ผู้ขอเบิก
                      ======================================= */}

                      <td
                        className="
                          min-w-[180px]

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
                          สถานะ
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
                          !text-slate-900
                        "
                      >
                        {getStatusLabel(
                          issue.status
                        )}
                      </td>

                      {/* =======================================
                          รายละเอียด
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3

                          text-center
                        "
                      >
                        <AppButton
                          href={`/issue/${issue.id}`}
                          variant="primary"
                          size="sm"
                        >
                          เปิด
                        </AppButton>
                      </td>

                      {/* =======================================
                          จัดการ
                      ======================================= */}

                      <td
                        className="
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
                              <span>
                                ✏️
                              </span>
                            }
                          >
                            แก้ไข
                          </AppButton>

                          <DeleteButton
                            id={
                              issue.id
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                /* =============================================
                   EMPTY STATE
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
                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center

                          rounded-[20px]

                          border
                          border-slate-200/80

                          bg-white/90

                          text-3xl

                          shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]

                          ring-1
                          ring-black/[0.025]

                          backdrop-blur-xl
                        "
                      >
                        📤
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight
                          !text-slate-900
                        "
                      >
                        ยังไม่มีข้อมูลเบิกจ่ายพัสดุ
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed
                          !text-slate-500
                        "
                      >
                        เมื่อมีการบันทึกเบิกจ่าย
                        รายการจะแสดงในตารางนี้
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