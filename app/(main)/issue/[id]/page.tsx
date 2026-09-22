import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import IssuePdf from "./IssuePdf";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

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
  remark: string | null;

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

const statusName: Record<string, string> = {
  PENDING: "รอเบิกจ่าย",
  APPROVED: "เสร็จสิ้นแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

const statusClass: Record<string, string> = {
  PENDING:
    "border-amber-300 bg-amber-50/90 !text-amber-800",
  APPROVED:
    "border-emerald-300 bg-emerald-50/90 !text-emerald-800",
  REJECTED:
    "border-red-300 bg-red-50/90 !text-red-800",
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

function formatThaiDate(
  date: Date | string | null
) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

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

export default async function IssueDetailPage({
  params,
}: Props) {
  const { id } = await params;

  // =====================================================
  // Session
  // =====================================================

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get("session")?.value;

  let session:
    | SessionUser
    | null = null;

  if (token) {
    try {
      session =
        await verifySession(token);
    } catch {
      session = null;
    }
  }

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // ตรวจสอบ ID
  // =====================================================

  const issueId = Number(id);

  if (
    !Number.isInteger(issueId) ||
    issueId <= 0
  ) {
    notFound();
  }

  // =====================================================
  // ดึงข้อมูลใบเบิก
  // =====================================================

  const issue =
    await prisma.issue.findUnique({
      where: {
        id: issueId,
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
    (
      !session.departmentId ||
      issue.departmentId !==
        session.departmentId
    )
  ) {
    redirect("/issue");
  }

  // =====================================================
  // สรุปจำนวน
  // =====================================================

  const totalRequested =
    issue.items.reduce(
      (total, item) =>
        total + Number(item.qty),
      0
    );

  const totalIssued =
    issue.items.reduce(
      (total, item) =>
        total +
        Number(item.issuedQty),
      0
    );

  // =====================================================
  // ชื่อผู้ขอเบิก
  // =====================================================

  const requesterName =
    issue.officer
      ? `${issue.officer.firstName} ${issue.officer.lastName}`.trim()
      : "-";

  // =====================================================
  // Shared UI
  // เฉพาะ "ช่องข้อมูล" เท่านั้นที่ใช้กรอบดำ
  // =====================================================

  const infoLabelClass = `
    text-xs
    font-bold
    !text-slate-500
    sm:text-sm
  `;

  const infoValueClass = `
    mt-2
    break-words
    text-base
    font-bold
    !text-slate-800
  `;

  const infoCardClass = `
    min-w-0
    rounded-[18px]
    border
    border-black
    bg-slate-50/90
    px-4
    py-4
    shadow-[0_8px_22px_-18px_rgba(15,23,42,0.35)]
    transition-all
    duration-300
    hover:-translate-y-[1px]
    hover:bg-white
    hover:shadow-[0_12px_28px_-18px_rgba(15,23,42,0.35)]
  `;

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="📤"
        title="รายละเอียดใบเบิกพัสดุ"
        subtitle="รายละเอียดรายการเบิกจ่ายพัสดุ"
        actions={
          <Link
            href="/issue"
            prefetch
            className="
              inline-flex
              shrink-0
            "
          >
            <AppButton
              type="button"
              variant="secondary"
            >
              <span>←</span>
              <span>กลับ</span>
            </AppButton>
          </Link>
        }
      />

      {/* =====================================================
          สถานะใบเบิก
          คง iOS - ไม่ใช้กรอบดำรอบการ์ด
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[30px]
          border
          border-white/80
          bg-white/75
          p-5
          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]
          backdrop-blur-2xl
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-56
            w-56
            rounded-full
            bg-blue-400/10
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-20
            h-56
            w-56
            rounded-full
            bg-cyan-400/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              สถานะใบเบิก
            </p>

            <div
              className={`
                mt-2
                inline-flex
                items-center
                justify-center
                rounded-full
                border
                px-5
                py-2
                text-base
                font-extrabold
                shadow-sm
                ${
                  statusClass[
                    issue.status
                  ] ??
                  "border-slate-200 bg-slate-100 !text-slate-800"
                }
              `}
            >
              {statusName[
                issue.status
              ] ?? issue.status}
            </div>
          </div>

          {session.role ===
            "ADMIN" &&
            issue.status ===
              "PENDING" && (
              <Link
                href={`/issue/${issue.id}/approve`}
                className="
                  inline-flex
                  w-full
                  sm:w-auto
                "
              >
                <AppButton
                  type="button"
                  variant="primary"
                  className="
                    w-full
                    sm:w-auto
                  "
                >
                  <span>📝</span>

                  <span>
                    ลงจำนวนเบิกจ่ายจริง
                  </span>
                </AppButton>
              </Link>
            )}

          {issue.status ===
            "APPROVED" &&
            issue.approvedAt && (
              <div
                className="
                  rounded-[18px]
                  border
                  border-slate-200/80
                  bg-emerald-50/80
                  px-4
                  py-3
                  shadow-sm
                  sm:text-right
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    !text-slate-500
                  "
                >
                  วันที่ยืนยันการเบิกจ่าย
                </p>

                <p
                  className="
                    mt-1
                    font-extrabold
                    !text-slate-900
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
                      text-sm
                      font-semibold
                      !text-slate-600
                    "
                  >
                    เจ้าหน้าที่พัสดุ:{" "}
                    {
                      issue
                        .approvedBy
                        .fullname
                    }
                  </p>
                )}
              </div>
            )}
        </div>

        {session.role ===
          "ADMIN" &&
          issue.status ===
            "PENDING" && (
            <div
              className="
                relative
                mt-5
                rounded-[18px]
                border
                border-amber-200
                bg-amber-50/90
                px-4
                py-4
                shadow-sm
              "
            >
              <p
                className="
                  font-extrabold
                  !text-amber-900
                "
              >
                ⚠️ ใบเบิกนี้ยังไม่ได้ตัดสต็อก
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
                กรุณาตรวจสอบรายการและลงจำนวนที่เบิกจ่ายจริงก่อน
                ระบบจึงจะตัดสต็อกและบันทึกลง Stock Card
              </p>
            </div>
          )}
      </section>

      {/* =====================================================
          ข้อมูลใบเบิก
          การ์ดใหญ่คง iOS
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[30px]
          border
          border-white/80
          bg-white/75
          p-5
          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]
          backdrop-blur-2xl
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-56
            w-56
            rounded-full
            bg-blue-400/10
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-20
            h-56
            w-56
            rounded-full
            bg-cyan-400/10
            blur-3xl
          "
        />

        {/* Header */}

        <div
          className="
            relative
            mb-5
            flex
            flex-col
            gap-4
            border-b
            border-slate-200
            pb-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-xl
                font-black
                tracking-tight
                !text-slate-900
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
                !text-slate-500
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
              documentNo={
                issue.documentNo
              }
              issueDate={
                issue.issueDate
              }
              departmentName={
                issue.department.name
              }
              requesterName={
                requesterName
              }
              items={issue.items}
            />
          </div>
        </div>

        {/* =================================================
            ช่องข้อมูล
            เฉพาะส่วนนี้ใช้กรอบดำ
        ================================================= */}

        <div
          className="
            relative
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          {/* เลขที่เอกสาร */}

          <div
            className={`
              ${infoCardClass}
              bg-slate-50/90
            `}
          >
            <p className={infoLabelClass}>
              เลขที่เอกสาร
            </p>

            <p className={infoValueClass}>
              {issue.documentNo}
            </p>
          </div>

          {/* วันที่เบิก */}

          <div
            className={`
              ${infoCardClass}
              bg-blue-50/70
            `}
          >
            <p className={infoLabelClass}>
              วันที่เบิก
            </p>

            <p className={infoValueClass}>
              {formatThaiDate(
                issue.issueDate
              )}
            </p>
          </div>

          {/* หน่วยงาน */}

          <div
            className={`
              ${infoCardClass}
              bg-slate-50/90
            `}
          >
            <p className={infoLabelClass}>
              หน่วยงาน / กลุ่มงาน
            </p>

            <p className={infoValueClass}>
              {issue.department.name}
            </p>
          </div>

          {/* ผู้ขอเบิก */}

          <div
            className={`
              ${infoCardClass}
              bg-slate-50/90
            `}
          >
            <p className={infoLabelClass}>
              ผู้ขอเบิก
            </p>

            <p className={infoValueClass}>
              {requesterName}
            </p>
          </div>

          {/* จำนวนรายการ */}

          <div
            className={`
              ${infoCardClass}
              bg-blue-50/70
            `}
          >
            <p className={infoLabelClass}>
              จำนวนรายการ
            </p>

            <p className={infoValueClass}>
              {issue.items.length} รายการ
            </p>
          </div>

          {/* จำนวนรวมที่ขอเบิก */}

          <div
            className={`
              ${infoCardClass}
              bg-slate-50/90
            `}
          >
            <p className={infoLabelClass}>
              จำนวนรวมที่ขอเบิก
            </p>

            <p className={infoValueClass}>
              {totalRequested} หน่วย
            </p>
          </div>

          {/* จำนวนรวมที่เบิกจ่ายจริง */}

          <div
            className={`
              ${infoCardClass}
              ${
                issue.status ===
                "APPROVED"
                  ? "bg-emerald-50/80"
                  : "bg-slate-50/90"
              }
              sm:col-span-2
              xl:col-span-3
            `}
          >
            <p className={infoLabelClass}>
              จำนวนรวมที่เบิกจ่ายจริง
            </p>

            <p
              className={`
                ${infoValueClass}
                ${
                  issue.status ===
                  "APPROVED"
                    ? "!text-emerald-800"
                    : "!text-slate-600"
                }
              `}
            >
              {issue.status ===
              "APPROVED"
                ? `${totalIssued} หน่วย`
                : "-"}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          ตารางรายการใบเบิก
          เส้นตารางดำ แต่ wrapper คง iOS
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-[30px]
          border
          border-white/80
          bg-white/80
          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]
          backdrop-blur-2xl
        "
      >
        <div
          className="
            border-b
            border-slate-200
            bg-slate-50/80
            px-5
            py-4
          "
        >
          <h2
            className="
              text-lg
              font-black
              !text-slate-900
              sm:text-xl
            "
          >
            📦 รายการพัสดุที่ขอเบิก
          </h2>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              !text-slate-500
            "
          >
            รายละเอียดจำนวนที่ขอเบิกและจำนวนที่เบิกจ่ายจริง
          </p>
        </div>

        <div
          className="
            w-full
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[900px]
              table-fixed
              border-collapse
              bg-white
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    w-[7%]
                    border
                    border-black
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
                    w-[35%]
                    border
                    border-black
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
                  รายการพัสดุ
                </th>

                <th
                  className="
                    w-[13%]
                    border
                    border-black
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
                  จำนวนที่ขอเบิก
                </th>

                <th
                  className="
                    w-[15%]
                    border
                    border-black
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
                  จำนวนที่เบิกจ่ายจริง
                </th>

                <th
                  className="
                    w-[10%]
                    border
                    border-black
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
                  หน่วย
                </th>

                <th
                  className="
                    w-[20%]
                    border
                    border-black
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
                  หมายเหตุ
                </th>
              </tr>
            </thead>

            <tbody className="!text-slate-900">
              {issue.items.map(
                (
                  item: IssueItem,
                  index: number
                ) => (
                  <tr
                    key={item.id}
                    className="
                      bg-white
                      transition-colors
                      duration-200
                      even:bg-slate-50
                      hover:bg-blue-50
                    "
                  >
                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                        !text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-4
                        py-4
                        align-middle
                        font-semibold
                        !text-slate-900
                      "
                    >
                      <div className="break-words">
                        <span className="font-extrabold">
                          {item.material.code}
                        </span>{" "}
                        - {item.material.name}
                      </div>
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-extrabold
                        !text-slate-900
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-extrabold
                      "
                    >
                      {issue.status ===
                      "PENDING" ? (
                        <span className="!text-amber-700">
                          รอเจ้าหน้าที่พัสดุ
                        </span>
                      ) : issue.status ===
                        "REJECTED" ? (
                        <span className="!text-red-700">
                          ไม่อนุมัติ
                        </span>
                      ) : (
                        <span className="!text-emerald-700">
                          {item.issuedQty}
                        </span>
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                        !text-slate-900
                      "
                    >
                      {item.material.unit}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-4
                        py-4
                        align-middle
                        text-left
                        font-semibold
                        !text-slate-900
                      "
                    >
                      <div
                        className="
                          whitespace-pre-wrap
                          break-words
                        "
                      >
                        {item.remark?.trim()
                          ? item.remark
                          : "-"}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          สรุปเมื่อเสร็จสิ้น
          คง iOS ไม่ใช้กรอบดำ
      ===================================================== */}

      {issue.status ===
        "APPROVED" && (
        <section
          className="
            w-full
            min-w-0
            rounded-[30px]
            border
            border-emerald-200/80
            bg-emerald-50/80
            p-5
            shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)]
            backdrop-blur-xl
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
                  text-lg
                  font-black
                  !text-emerald-900
                "
              >
                ✅ ดำเนินการเบิกจ่ายเสร็จสิ้นแล้ว
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-emerald-800
                "
              >
                รายการเบิกจ่ายได้รับการยืนยันจากเจ้าหน้าที่พัสดุแล้ว
                และถูกตัดออกจากบัญชีพัสดุแล้ว
              </p>
            </div>

            <div
              className="
                shrink-0
                rounded-[18px]
                border
                border-emerald-200
                bg-white/70
                px-5
                py-3
                shadow-sm
                sm:text-right
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  !text-slate-500
                "
              >
                จำนวนรวมที่เบิกจ่ายจริง
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-black
                  !text-emerald-800
                "
              >
                {totalIssued} หน่วย
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          ไม่อนุมัติ
      ===================================================== */}

      {issue.status ===
        "REJECTED" && (
        <section
          className="
            w-full
            min-w-0
            rounded-[30px]
            border
            border-red-200
            bg-red-50/80
            p-5
            shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)]
            backdrop-blur-xl
            sm:p-6
          "
        >
          <p
            className="
              text-lg
              font-black
              !text-red-800
            "
          >
            ❌ รายการเบิกนี้ไม่ได้รับการอนุมัติ
          </p>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              !text-red-700
            "
          >
            รายการนี้ไม่มีการตัดออกจากบัญชีพัสดุ
          </p>
        </section>
      )}
    </AppPage>
  );
}