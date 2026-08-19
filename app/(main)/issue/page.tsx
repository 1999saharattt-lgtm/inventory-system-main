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
  //
  // ADMIN:
  //   เห็นรายการเบิกจ่ายทั้งหมด
  //
  // ผู้ใช้งานทั่วไป:
  //   เห็นเฉพาะรายการของ department ตัวเอง
  //
  // ถ้ายังไม่มี departmentId:
  //   ไม่แสดงรายการของกลุ่มอื่น
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
  // ดึงรายการเบิกจ่าย
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
          sm:min-h-[140px]
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:gap-4
          sm:px-8
          sm:py-6
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
              sm:text-5xl
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
              leading-tight
              !text-slate-200
              sm:text-xl
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
            sm:text-lg
          "
        >
          + เพิ่มรายการเบิก
        </Link>
      </div>

      {/* =====================================================
          Table
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >
        <div className="w-full overflow-x-auto">
          <table
            className="
              min-w-[1200px]
              border-collapse
              border
              border-slate-900
            "
          >
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "วันที่เบิกจ่าย",
                  "เลขที่เอกสาร",
                  "หน่วยงาน / กลุ่มงาน",
                  "ผู้ขอเบิก",
                  "รายละเอียด",
                  "หมายเหตุ",
                  "จัดการ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      !text-white
                    "
                  >
                    {title}
                  </th>
                ))}
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
                      {/* ลำดับ */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* วันที่เบิกจ่าย */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
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

                      {/* เลขที่เอกสาร */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {issue.documentNo}
                      </td>

                      {/* หน่วยงาน */}

                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {issue.department?.name ?? "-"}
                      </td>

                      {/* ผู้ขอเบิก */}

                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {issue.officer
                          ? `${issue.officer.firstName} ${issue.officer.lastName}`
                          : "-"}
                      </td>

                      {/* รายละเอียด */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        <Link
                          href={`/issue/${issue.id}`}
                          className="
                            inline-block
                            rounded-lg
                            bg-slate-800
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow
                            transition
                            hover:bg-slate-700
                          "
                        >
                          ดูรายการ
                        </Link>
                      </td>

                      {/* หมายเหตุ */}

                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {issue.remark || (
                          <span
                            className="
                              italic
                              text-slate-400
                            "
                          >
                            -
                          </span>
                        )}
                      </td>

                      {/* จัดการ */}

                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-extrabold
                          text-slate-900
                        "
                      >
                        <div
                          className="
                            flex
                            justify-center
                            gap-2
                          "
                        >
                          <Link
                            href={`/issue/${issue.id}/edit`}
                            className="
                              whitespace-nowrap
                              rounded-lg
                              bg-slate-800
                              px-4
                              py-2
                              font-extrabold
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
    </div>
  );
}