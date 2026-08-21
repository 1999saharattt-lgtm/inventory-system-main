import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  verifySession,
  type SessionUser,
} from "@/lib/session";
import DeleteButton from "./DeleteButton";

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

function getStatusLabel(status: string) {
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

export default async function IssuePage() {
  // =====================================================
  // Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

  // =====================================================
  // กรองรายการตามกลุ่มงาน
  // =====================================================

  const where =
    session?.role === "ADMIN"
      ? {}
      : session?.departmentId
        ? {
            departmentId: session.departmentId,
          }
        : {
            departmentId: -1,
          };

  // =====================================================
  // ดึงรายการเบิก
  // =====================================================

  const issues = await prisma.issue.findMany({
    where,

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

  // =====================================================
  // จำนวนรายการที่รอเบิกจ่าย
  //
  // แสดงเฉพาะ Admin
  // =====================================================

  const pendingCount =
    session?.role === "ADMIN"
      ? issues.filter(
          (issue) => issue.status === "PENDING"
        ).length
      : 0;

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
          sm:py-5
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-4xl
            "
          >
            📤 รายการเบิกจ่ายพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              !text-slate-200
              sm:text-base
            "
          >
            แสดงรายการเอกสารเบิกจ่ายพัสดุของกลุ่มงาน
          </p>
        </div>

        <Link
          href="/issue/create"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-5
            sm:py-3
          "
        >
          + เพิ่มรายการเบิก
        </Link>
      </div>

      {/* =====================================================
          แจ้งเตือนรายการรอเบิกจ่าย
      ===================================================== */}

      {session?.role === "ADMIN" &&
        pendingCount > 0 && (
          <div
            className="
              flex
              flex-col
              gap-3
              rounded-2xl
              border
              border-amber-300
              bg-gradient-to-r
              from-amber-50
              to-yellow-50
              p-4
              shadow-lg
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-lg
                  font-extrabold
                  text-amber-900
                "
              >
                🔔 มีรายการรอเบิกจ่าย
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-amber-800
                  sm:text-base
                "
              >
                มีใบเบิกจำนวน {pendingCount} รายการ
                รอเจ้าหน้าที่พัสดุตรวจสอบและลงจำนวนเบิกจ่ายจริง
              </p>
            </div>

            <div
              className="
                shrink-0
                rounded-xl
                bg-amber-500
                px-5
                py-2.5
                text-center
                font-extrabold
                text-white
                shadow
              "
            >
              รอ {pendingCount} รายการ
            </div>
          </div>
        )}

      {/* =====================================================
          Table
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-x-auto
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >
        <table
          className="
            w-full
            min-w-[1100px]
            border-collapse
            border
            border-slate-900
          "
        >
          <thead>
            <tr>
              {/* ลำดับ */}

              <th
                className="
                  w-[5%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                ลำดับ
              </th>

              {/* วันที่ */}

              <th
                className="
                  w-[9%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                วันที่
              </th>

              {/* เลขที่เอกสาร */}

              <th
                className="
                  w-[11%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                เลขที่เอกสาร
              </th>

              {/* หน่วยงาน / กลุ่มงาน */}

              <th
                className="
                  w-[17%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                หน่วยงาน / กลุ่มงาน
              </th>

              {/* ผู้ขอเบิก */}

              <th
                className="
                  w-[13%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                ผู้ขอเบิก
              </th>

              {/* สถานะ */}

              <th
                className="
                  w-[12%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                สถานะ
              </th>

              {/* รายละเอียด */}

              <th
                className="
                  w-[15%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                รายละเอียด
              </th>

              {/* จัดการ */}

              <th
                className="
                  w-[18%]
                  border
                  border-slate-900
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  px-1
                  py-3
                  text-center
                  text-sm
                  font-extrabold
                  !text-white
                "
              >
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody>
            {issues.length > 0 ? (
              issues.map(
                (issue: Issue, index: number) => (
                  <tr
                    key={issue.id}
                    className="
                      border-b
                      border-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
                    {/* =================================================
                        ลำดับ
                    ================================================= */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

                    {/* =================================================
                        วันที่
                    ================================================= */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {issue.issueDate
                        ? new Date(
                            issue.issueDate
                          ).toLocaleDateString(
                            "th-TH"
                          )
                        : "-"}
                    </td>

                    {/* =================================================
                        เลขที่เอกสาร
                    ================================================= */}

                    <td
                      className="
                        break-words
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {issue.documentNo}
                    </td>

                    {/* =================================================
                        หน่วยงาน
                    ================================================= */}

                    <td
                      className="
                        break-words
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {issue.department?.name ?? "-"}
                    </td>

                    {/* =================================================
                        ผู้ขอเบิก
                    ================================================= */}

                    <td
                      className="
                        break-words
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {issue.officer
                        ? `${issue.officer.firstName} ${issue.officer.lastName}`
                        : "-"}
                    </td>

                    {/* =================================================
                        สถานะ
                    ================================================= */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                        text-xs
                        font-extrabold
                      "
                    >
                      {issue.status ===
                      "PENDING" ? (
                        <span
                          className="
                            inline-flex
                            max-w-full
                            items-center
                            justify-center
                            rounded-full
                            bg-amber-100
                            px-2
                            py-1.5
                            text-amber-800
                            shadow-sm
                          "
                        >
                          🔔 รอเบิกจ่าย
                        </span>
                      ) : issue.status ===
                        "APPROVED" ? (
                        <span
                          className="
                            inline-flex
                            max-w-full
                            items-center
                            justify-center
                            rounded-full
                            bg-emerald-100
                            px-2
                            py-1.5
                            text-emerald-800
                            shadow-sm
                          "
                        >
                          ✓ เสร็จสิ้นแล้ว
                        </span>
                      ) : issue.status ===
                        "REJECTED" ? (
                        <span
                          className="
                            inline-flex
                            max-w-full
                            items-center
                            justify-center
                            rounded-full
                            bg-red-100
                            px-2
                            py-1.5
                            text-red-800
                            shadow-sm
                          "
                        >
                          ✕ ไม่อนุมัติ
                        </span>
                      ) : (
                        <span
                          className="
                            inline-flex
                            max-w-full
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            px-2
                            py-1.5
                            text-slate-700
                          "
                        >
                          {getStatusLabel(
                            issue.status
                          )}
                        </span>
                      )}
                    </td>

                    {/* =================================================
                        รายละเอียด
                    ================================================= */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                      "
                    >
                      <Link
                        href={`/issue/${issue.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          whitespace-nowrap
                          rounded-lg
                          bg-slate-800
                          px-3
                          py-2
                          text-sm
                          font-extrabold
                          leading-none
                          text-white
                          shadow
                          transition
                          hover:bg-slate-700
                        "
                      >
                        {session?.role ===
                          "ADMIN" &&
                        issue.status ===
                          "PENDING"
                          ? "ตรวจสอบ / เบิกจ่าย"
                          : "ดูรายการ"}
                      </Link>
                    </td>

                    {/* =================================================
                        จัดการ
                    ================================================= */}

                    <td
                      className="
                        border
                        border-slate-900
                        px-1
                        py-3
                        text-center
                      "
                    >
                      <div
                        className="
                          flex
                          flex-wrap
                          justify-center
                          gap-1
                        "
                      >
                        <Link
                          href={`/issue/${issue.id}/edit`}
                          className="
                            inline-flex
                            items-center
                            justify-center
                            whitespace-nowrap
                            rounded-lg
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            font-extrabold
                            leading-none
                            text-white
                            shadow
                            transition
                            hover:bg-slate-700
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
                    border-slate-900
                    py-12
                    text-center
                    text-lg
                    font-extrabold
                    text-slate-500
                  "
                >
                  ยังไม่มีรายการเบิกจ่ายพัสดุ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}