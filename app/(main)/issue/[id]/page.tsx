import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  verifySession,
  type SessionUser,
} from "@/lib/session";
import IssuePdf from "./IssuePdf";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type IssueItem = {
  id: number;
  qty: number;
  issuedQty: number;

  material: {
    code: string;
    name: string;
    unit: string;
    category: string;
    latestPrice: {
      toString(): string;
    };
  };
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const statusName: Record<string, string> = {
  PENDING: "รอเบิกจ่าย",
  APPROVED: "เสร็จสิ้นแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

const statusClass: Record<string, string> = {
  PENDING:
    "bg-amber-100 text-amber-800 border-amber-300",
  APPROVED:
    "bg-gradient-to-r from-emerald-600 to-green-500 text-white border-emerald-700",
  REJECTED:
    "bg-red-100 text-red-800 border-red-300",
};

// =====================================================
// เดือนภาษาไทย
// =====================================================

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

// =====================================================
// แปลงวันที่เป็น วัน เดือน ปี พ.ศ.
// =====================================================

function formatThaiDate(date: Date | string | null) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return `${parsedDate.getDate()} ${
    thaiMonths[parsedDate.getMonth()]
  } ${parsedDate.getFullYear() + 543}`;
}

export default async function IssueDetailPage({
  params,
}: Props) {
  const { id } = await params;

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
  // ถ้าไม่มี Session ให้กลับหน้า Login
  // =====================================================

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // ดึงข้อมูลใบเบิก
  // =====================================================

  const issue = await prisma.issue.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      department: true,

      officer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },

      approvedBy: {
        select: {
          id: true,
          fullname: true,
        },
      },

      items: {
        include: {
          material: true,
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  // =====================================================
  // สิทธิ์การเข้าดู
  // =====================================================

  if (
    session.role !== "ADMIN" &&
    (!session.departmentId ||
      issue.departmentId !== session.departmentId)
  ) {
    redirect("/issue");
  }

  // =====================================================
  // สรุปจำนวน
  // =====================================================

  const totalRequested = issue.items.reduce(
    (total, item) =>
      total + Number(item.qty),
    0
  );

  const totalIssued = issue.items.reduce(
    (total, item) =>
      total + Number(item.issuedQty),
    0
  );

  // =====================================================
  // ชื่อผู้ขอเบิก
  // =====================================================

  const requesterName = issue.officer
    ? `${issue.officer.firstName} ${issue.officer.lastName}`.trim()
    : "-";

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
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
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
              sm:text-3xl
            "
          >
            📤 รายละเอียดใบเบิกพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            รายละเอียดรายการเบิกจ่ายพัสดุ
          </p>
        </div>

        <Link
          href="/issue"
          className="
            shrink-0
            whitespace-nowrap
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            leading-tight
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          สถานะใบเบิก
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          !text-white
          shadow-xl
          sm:p-6
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
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-300
              "
            >
              สถานะใบเบิก
            </p>

            <div
              className={`
                mt-2
                inline-flex
                max-w-full
                items-center
                justify-center
                rounded-full
                border
                px-5
                py-2
                text-center
                text-base
                font-extrabold
                shadow-md
                ${
                  statusClass[issue.status] ??
                  "border-slate-600 bg-slate-700 text-white"
                }
              `}
            >
              {statusName[issue.status] ??
                issue.status}
            </div>
          </div>

          {/* เจ้าหน้าที่พัสดุดำเนินการ */}

          {session.role === "ADMIN" &&
            issue.status === "PENDING" && (
              <div className="w-full shrink-0 sm:w-auto">
                <Link
                  href={`/issue/${issue.id}/approve`}
                  className="
                    block
                    w-full
                    rounded-xl
                    bg-gradient-to-r
                    from-blue-600
                    to-indigo-600
                    px-6
                    py-3
                    text-center
                    text-base
                    font-extrabold
                    !text-white
                    shadow-lg
                    transition
                    hover:scale-[1.02]
                    hover:from-blue-700
                    hover:to-indigo-700
                    sm:w-auto
                  "
                >
                  📝 ลงจำนวนเบิกจ่ายจริง
                </Link>
              </div>
            )}

          {issue.status === "APPROVED" &&
            issue.approvedAt && (
              <div
                className="
                  min-w-0
                  text-left
                  sm:text-right
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    !text-slate-300
                  "
                >
                  วันที่ยืนยันการเบิกจ่าย
                </p>

                <p
                  className="
                    mt-1
                    font-extrabold
                    !text-white
                  "
                >
                  {formatThaiDate(
                    issue.approvedAt
                  )}
                </p>

                {issue.approvedBy && (
                  <p
                    className="
                      mt-1
                      break-words
                      text-sm
                      font-semibold
                      !text-slate-300
                    "
                  >
                    เจ้าหน้าที่พัสดุ:{" "}
                    {issue.approvedBy.fullname}
                  </p>
                )}
              </div>
            )}
        </div>

        {/* คำอธิบายสำหรับรายการรอเบิกจ่าย */}

        {session.role === "ADMIN" &&
          issue.status === "PENDING" && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-amber-300
                bg-amber-50
                px-4
                py-3
                text-black
              "
            >
              <p className="font-extrabold !text-black">
                ⚠️ ใบเบิกนี้ยังไม่ได้ตัดสต็อก
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-black
                "
              >
                กรุณาตรวจสอบรายการและลงจำนวนที่เบิกจ่ายจริงก่อน
                ระบบจึงจะตัดสต็อกและบันทึกลง Stock Card
              </p>
            </div>
          )}
      </div>

      {/* =====================================================
          ข้อมูลใบเบิก
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          !text-white
          shadow-xl
          sm:p-6
        "
      >
        {/* Header ของข้อมูลใบเบิก */}

        <div
          className="
            mb-5
            flex
            flex-col
            gap-3
            border-b
            border-slate-700
            pb-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-xl
                font-extrabold
                !text-white
                sm:text-2xl
              "
            >
              📋 ข้อมูลใบเบิก
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-300
                sm:text-base
              "
            >
              รายละเอียดเอกสารและข้อมูลการเบิกจ่าย
            </p>
          </div>

          <div
            className="
              w-full
              shrink-0
              sm:w-auto
            "
          >
            <IssuePdf
              issueId={issue.id}
              documentNo={issue.documentNo}
              issueDate={issue.issueDate}
              departmentName={issue.department.name}
              requesterName={requesterName}
              items={issue.items}
            />
          </div>
        </div>

        {/* ข้อมูลใบเบิก */}

        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
          "
        >
          <div className="min-w-0">
            <p className="font-extrabold !text-white">
              เลขที่เอกสาร
            </p>

            <p
              className="
                mt-1
                break-all
                text-lg
                font-semibold
                text-cyan-300
              "
            >
              {issue.documentNo}
            </p>
          </div>

          <div>
            <p className="font-extrabold !text-white">
              วันที่เบิก
            </p>

            <p className="mt-1 font-semibold !text-white">
              {formatThaiDate(
                issue.issueDate
              )}
            </p>
          </div>

          <div className="min-w-0">
            <p className="font-extrabold !text-white">
              หน่วยงาน / กลุ่มงาน
            </p>

            <p
              className="
                mt-1
                break-words
                font-semibold
                !text-white
              "
            >
              {issue.department.name}
            </p>
          </div>

          <div className="min-w-0">
            <p className="font-extrabold !text-white">
              ผู้ขอเบิก
            </p>

            <p
              className="
                mt-1
                break-words
                font-semibold
                !text-white
              "
            >
              {requesterName}
            </p>
          </div>

          <div>
            <p className="font-extrabold !text-white">
              จำนวนรายการ
            </p>

            <p className="mt-1 font-semibold !text-white">
              {issue.items.length} รายการ
            </p>
          </div>

          <div>
            <p className="font-extrabold !text-white">
              จำนวนรวมที่ขอเบิก
            </p>

            <p className="mt-1 font-semibold !text-white">
              {totalRequested} หน่วย
            </p>
          </div>

          <div>
            <p className="font-extrabold !text-white">
              จำนวนรวมที่เบิกจ่ายจริง
            </p>

            <p
              className={`
                mt-1
                font-extrabold
                ${
                  issue.status === "APPROVED"
                    ? "text-emerald-300"
                    : "text-slate-300"
                }
              `}
            >
              {issue.status === "APPROVED"
                ? `${totalIssued} หน่วย`
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ตารางรายการใบเบิก
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              border-collapse
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  หมวดหมู่
                </th>

                <th
                  className="
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  รายการพัสดุ
                </th>

                <th
                  className="
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  จำนวนที่ขอเบิก
                </th>

                <th
                  className="
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  จำนวนที่เบิกจ่ายจริง
                </th>

                <th
                  className="
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  หน่วย
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-900">
              {issue.items.map(
                (
                  item: IssueItem,
                  index: number
                ) => (
                  <tr
                    key={item.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                      "
                    >
                      {categoryName[
                        item.material.category
                      ] ??
                        item.material.category}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        font-semibold
                      "
                    >
                      <span className="font-extrabold">
                        {item.material.code}
                      </span>{" "}
                      - {item.material.name}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {issue.status === "PENDING" ? (
                        <span className="text-amber-600">
                          รอเจ้าหน้าที่พัสดุ
                        </span>
                      ) : issue.status === "REJECTED" ? (
                        <span className="text-red-600">
                          ไม่อนุมัติ
                        </span>
                      ) : (
                        <span className="text-emerald-700">
                          {item.issuedQty}
                        </span>
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {item.material.unit}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          สรุปเมื่อเสร็จสิ้นแล้ว
      ===================================================== */}

      {issue.status === "APPROVED" && (
        <div
          className="
            w-full
            min-w-0
            rounded-2xl
            border
            border-slate-900
            bg-gradient-to-r
            from-slate-950
            via-slate-800
            to-slate-700
            p-4
            !text-white
            shadow-xl
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-2
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <p className="text-lg font-extrabold !text-white">
                ✅ ดำเนินการเบิกจ่ายเสร็จสิ้นแล้ว
              </p>

              <p
                className="
                  mt-1
                  break-words
                  text-sm
                  font-semibold
                  !text-slate-200
                "
              >
                รายการเบิกจ่ายได้รับการยืนยันจากเจ้าหน้าที่พัสดุแล้ว
                และถูกตัดออกจากบัญชีพัสดุแล้ว
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p
                className="
                  text-sm
                  font-bold
                  !text-slate-300
                "
              >
                จำนวนรวมที่เบิกจ่ายจริง
              </p>

              <p className="text-2xl font-extrabold text-emerald-300">
                {totalIssued} หน่วย
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          สถานะไม่อนุมัติ
      ===================================================== */}

      {issue.status === "REJECTED" && (
        <div
          className="
            w-full
            min-w-0
            rounded-2xl
            border
            border-red-300
            bg-red-50
            p-4
            shadow-xl
            sm:p-6
          "
        >
          <p className="text-lg font-extrabold text-red-800">
            ❌ รายการเบิกนี้ไม่ได้รับการอนุมัติ
          </p>

          <p className="mt-1 text-sm font-semibold text-red-700">
            รายการนี้ไม่มีการตัดออกจากบัญชีพัสดุ
          </p>
        </div>
      )}
    </div>
  );
}