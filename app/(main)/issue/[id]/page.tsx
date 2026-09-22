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
    "border-amber-200 bg-amber-50 !text-amber-800",
  APPROVED:
    "border-emerald-200 bg-emerald-50 !text-emerald-700",
  REJECTED:
    "border-red-200 bg-red-50 !text-red-700",
};

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

  /* =========================================================
     Session
  ========================================================= */

  const cookieStore = await cookies();
  const token =
    cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

  if (!session) {
    redirect("/login");
  }

  /* =========================================================
     Validate ID
  ========================================================= */

  const issueId = Number(id);

  if (
    !Number.isInteger(issueId) ||
    issueId <= 0
  ) {
    notFound();
  }

  /* =========================================================
     Load Issue
  ========================================================= */

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

  /* =========================================================
     Permission
  ========================================================= */

  if (
    session.role !== "ADMIN" &&
    (!session.departmentId ||
      issue.departmentId !==
        session.departmentId)
  ) {
    redirect("/issue");
  }

  /* =========================================================
     Summary
  ========================================================= */

  const totalRequested =
    issue.items.reduce(
      (total, item) =>
        total + Number(item.qty),
      0
    );

  const totalIssued =
    issue.items.reduce(
      (total, item) =>
        total + Number(item.issuedQty),
      0
    );

  const requesterName = issue.officer
    ? `${issue.officer.firstName} ${issue.officer.lastName}`.trim()
    : "-";

  /* =========================================================
     UI
  ========================================================= */

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
            className="inline-flex shrink-0"
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
          Status
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-white/80
          bg-white/85
          p-5
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
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
            h-52
            w-52
            rounded-full
            bg-blue-400/10
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
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-500
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
                px-4
                py-2
                text-sm
                font-extrabold
                shadow-sm
                ${statusClass[issue.status] ??
                "border-slate-200 bg-slate-100 !text-slate-700"}
              `}
            >
              {statusName[issue.status] ??
                issue.status}
            </div>
          </div>

          {session.role === "ADMIN" &&
            issue.status === "PENDING" && (
              <Link
                href={`/issue/${issue.id}/approve`}
                prefetch
                className="
                  inline-flex
                  w-full
                  shrink-0
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

          {issue.status === "APPROVED" &&
            issue.approvedAt && (
              <div
                className="
                  min-w-0
                  sm:text-right
                "
              >
                <p
                  className="
                    text-sm
                    font-extrabold
                    !text-slate-500
                  "
                >
                  วันที่ยืนยันการเบิกจ่าย
                </p>

                <p
                  className="
                    mt-1
                    font-black
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
                      break-words
                      text-sm
                      font-semibold
                      !text-slate-500
                    "
                  >
                    เจ้าหน้าที่พัสดุ:{" "}
                    {issue.approvedBy.fullname}
                  </p>
                )}
              </div>
            )}
        </div>

        {session.role === "ADMIN" &&
          issue.status === "PENDING" && (
            <div
              className="
                relative
                mt-5
                rounded-[18px]
                border
                border-amber-200
                bg-amber-50/90
                px-4
                py-3.5
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
                ระบบจึงจะตัดสต็อกและบันทึกลง
                Stock Card
              </p>
            </div>
          )}
      </section>

      {/* =====================================================
          Issue Information
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-white/80
          bg-white/85
          p-5
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-20
            h-52
            w-52
            rounded-full
            bg-cyan-400/10
            blur-3xl
          "
        />

        {/* Header */}

        <div
          className="
            relative
            mb-6
            flex
            flex-col
            gap-4
            border-b
            border-slate-200
            pb-5
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-[16px]
                bg-slate-900
                text-xl
                shadow-[0_12px_28px_-16px_rgba(15,23,42,0.6)]
              "
            >
              📋
            </div>

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
                ข้อมูลใบเบิก
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                รายละเอียดเอกสารและข้อมูลการเบิกจ่าย
              </p>
            </div>
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
              issueDate={issue.issueDate}
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

        {/* Information Grid */}

        <div
          className="
            relative
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          <InfoCard
            label="เลขที่เอกสาร"
            value={issue.documentNo}
            highlight
          />

          <InfoCard
            label="วันที่เบิก"
            value={formatThaiDate(
              issue.issueDate
            )}
          />

          <InfoCard
            label="หน่วยงาน / กลุ่มงาน"
            value={issue.department.name}
          />

          <InfoCard
            label="ผู้ขอเบิก"
            value={requesterName}
          />

          <InfoCard
            label="จำนวนรายการ"
            value={`${issue.items.length} รายการ`}
          />

          <InfoCard
            label="จำนวนรวมที่ขอเบิก"
            value={`${totalRequested} หน่วย`}
          />

          <InfoCard
            label="จำนวนรวมที่เบิกจ่ายจริง"
            value={
              issue.status === "APPROVED"
                ? `${totalIssued} หน่วย`
                : "-"
            }
            success={
              issue.status === "APPROVED"
            }
          />
        </div>
      </section>

      {/* =====================================================
          Items Table
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-[26px]
          border
          border-slate-200
          bg-white/90
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            border-b
            border-slate-200
            bg-white/90
            px-5
            py-4
            sm:px-6
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
              bg-slate-900
              text-lg
              shadow-sm
            "
          >
            📦
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                !text-slate-900
                sm:text-xl
              "
            >
              รายการพัสดุ
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ทั้งหมด {issue.items.length} รายการ
            </p>
          </div>
        </div>

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
              min-w-[900px]
              table-fixed
              border-collapse
              !rounded-none
              !border-0
              !shadow-none
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    w-[7%]
                    border
                    border-slate-600
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
                    border-slate-600
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
                    border-slate-600
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
                    border-slate-600
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
                    border-slate-600
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
                    border-slate-600
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

            <tbody>
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
                      hover:bg-slate-50
                    "
                  >
                    <td
                      className="
                        border
                        border-slate-200
                        px-3
                        py-3.5
                        text-center
                        font-bold
                        !text-slate-700
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-slate-200
                        px-4
                        py-3.5
                        align-middle
                      "
                    >
                      <div
                        className="
                          break-words
                          font-bold
                          !text-slate-900
                        "
                      >
                        <span
                          className="
                            mr-1
                            inline-flex
                            rounded-lg
                            bg-slate-100
                            px-2
                            py-0.5
                            font-extrabold
                            !text-slate-800
                          "
                        >
                          {item.material.code}
                        </span>

                        <span>
                          {item.material.name}
                        </span>
                      </div>
                    </td>

                    <td
                      className="
                        border
                        border-slate-200
                        px-3
                        py-3.5
                        text-center
                        font-extrabold
                        !text-slate-800
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        border
                        border-slate-200
                        px-3
                        py-3.5
                        text-center
                        font-extrabold
                      "
                    >
                      {issue.status ===
                      "PENDING" ? (
                        <span
                          className="
                            inline-flex
                            rounded-full
                            bg-amber-50
                            px-3
                            py-1
                            text-sm
                            !text-amber-700
                          "
                        >
                          รอเจ้าหน้าที่พัสดุ
                        </span>
                      ) : issue.status ===
                        "REJECTED" ? (
                        <span
                          className="
                            inline-flex
                            rounded-full
                            bg-red-50
                            px-3
                            py-1
                            text-sm
                            !text-red-700
                          "
                        >
                          ไม่อนุมัติ
                        </span>
                      ) : (
                        <span
                          className="
                            inline-flex
                            min-w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-emerald-50
                            px-3
                            py-1
                            !text-emerald-700
                          "
                        >
                          {item.issuedQty}
                        </span>
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-slate-200
                        px-3
                        py-3.5
                        text-center
                        font-bold
                        !text-slate-600
                      "
                    >
                      {item.material.unit}
                    </td>

                    <td
                      className="
                        border
                        border-slate-200
                        px-4
                        py-3.5
                        align-middle
                        text-left
                        font-semibold
                        !text-slate-700
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
          Approved Summary
      ===================================================== */}

      {issue.status === "APPROVED" && (
        <section
          className="
            relative
            w-full
            min-w-0
            overflow-hidden
            rounded-[24px]
            border
            border-emerald-200
            bg-emerald-50/90
            p-5
            shadow-[0_18px_45px_-30px_rgba(5,150,105,0.4)]
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
                  break-words
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-emerald-700
                "
              >
                รายการเบิกจ่ายได้รับการยืนยันจากเจ้าหน้าที่พัสดุแล้ว
                และถูกตัดออกจากบัญชีพัสดุแล้ว
              </p>
            </div>

            <div
              className="
                shrink-0
                sm:text-right
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  !text-emerald-700
                "
              >
                จำนวนรวมที่เบิกจ่ายจริง
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-black
                  !text-emerald-900
                "
              >
                {totalIssued} หน่วย
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          Rejected Summary
      ===================================================== */}

      {issue.status === "REJECTED" && (
        <section
          className="
            w-full
            min-w-0
            rounded-[24px]
            border
            border-red-200
            bg-red-50/90
            p-5
            shadow-[0_18px_45px_-30px_rgba(220,38,38,0.35)]
            backdrop-blur-xl
            sm:p-6
          "
        >
          <p
            className="
              text-lg
              font-black
              !text-red-900
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

/* =========================================================
   Information Card
========================================================= */

function InfoCard({
  label,
  value,
  highlight = false,
  success = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-[18px]
        border
        border-slate-200
        bg-slate-50/80
        px-4
        py-4
        shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]
      "
    >
      <p
        className="
          text-sm
          font-extrabold
          !text-slate-500
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          break-words
          text-base
          font-extrabold
          ${
            success
              ? "!text-emerald-700"
              : highlight
                ? "!text-blue-700"
                : "!text-slate-900"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}