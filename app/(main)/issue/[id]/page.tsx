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
    "border-amber-400 bg-amber-50 !text-amber-800",

  APPROVED:
    "border-emerald-500 bg-emerald-50 !text-emerald-800",

  REJECTED:
    "border-red-400 bg-red-50 !text-red-800",
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

  const parsedDate =
    new Date(date);

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
  const { id } =
    await params;

  // =====================================================
  // Session
  // =====================================================

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

  // =====================================================
  // ถ้าไม่มี Session ให้กลับหน้า Login
  // =====================================================

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // ตรวจสอบ ID
  // =====================================================

  const issueId =
    Number(id);

  if (
    !Number.isInteger(
      issueId
    ) ||
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
        total +
        Number(
          item.qty
        ),
      0
    );

  const totalIssued =
    issue.items.reduce(
      (total, item) =>
        total +
        Number(
          item.issuedQty
        ),
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
  // =====================================================

  const infoLabelClass = `
    text-xs
    font-extrabold
    uppercase
    tracking-wide
    !text-slate-500
    sm:text-sm
  `;

  const infoValueClass = `
    mt-1
    break-words
    text-base
    font-extrabold
    !text-slate-900
    sm:text-lg
  `;

  const infoCardClass = `
    min-w-0
    rounded-[18px]
    border
    border-black
    bg-slate-50
    px-4
    py-4
    shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]
    transition-all
    duration-200
    hover:bg-blue-50
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
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-black
          bg-slate-100/90
          p-5
          shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]
          backdrop-blur-2xl
          sm:p-6
        "
      >
        {/* Ambient */}

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
                font-extrabold
                !text-slate-600
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
                font-black
                shadow-sm
                ${
                  statusClass[
                    issue.status
                  ] ??
                  "border-black bg-slate-50 !text-slate-900"
                }
              `}
            >
              {
                statusName[
                  issue.status
                ] ??
                issue.status
              }
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
                  border-black
                  bg-emerald-50
                  px-4
                  py-3
                  sm:text-right
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    !text-slate-600
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

        {/* Pending Warning */}

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
                border-black
                bg-amber-50
                px-4
                py-4
                shadow-sm
              "
            >
              <p
                className="
                  font-extrabold
                  !text-slate-900
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
                  !text-slate-700
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
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-black
          bg-slate-100/90
          p-5
          shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]
          backdrop-blur-2xl
          sm:p-6
        "
      >
        {/* Ambient */}

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
            border-black
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
                !text-slate-600
                sm:text-base
              "
            >
              รายละเอียดเอกสารและข้อมูลการเบิกจ่าย
            </p>
          </div>

          {/* =================================================
              PDF

              ตัวปุ่มจริงอยู่ใน IssuePdf.tsx
              และใช้ AppButton ตัวกลาง
          ================================================= */}

          <div
            className="
              w-full
              shrink-0
              sm:w-auto
            "
          >
            <IssuePdf
              issueId={
                issue.id
              }
              documentNo={
                issue.documentNo
              }
              issueDate={
                issue.issueDate
              }
              departmentName={
                issue.department
                  .name
              }
              requesterName={
                requesterName
              }
              items={
                issue.items
              }
            />
          </div>
        </div>

        {/* =================================================
            ช่องข้อมูล
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
              bg-blue-50
            `}
          >
            <p
              className={
                infoLabelClass
              }
            >
              เลขที่เอกสาร
            </p>

            <p
              className={`
                ${infoValueClass}
                !text-blue-900
              `}
            >
              {issue.documentNo}
            </p>
          </div>

          {/* วันที่เบิก */}

          <div
            className={
              infoCardClass
            }
          >
            <p
              className={
                infoLabelClass
              }
            >
              วันที่เบิก
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {formatThaiDate(
                issue.issueDate
              )}
            </p>
          </div>

          {/* กลุ่มงาน */}

          <div
            className={`
              ${infoCardClass}
              bg-cyan-50
            `}
          >
            <p
              className={
                infoLabelClass
              }
            >
              หน่วยงาน / กลุ่มงาน
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {
                issue.department
                  .name
              }
            </p>
          </div>

          {/* ผู้ขอเบิก */}

          <div
            className={
              infoCardClass
            }
          >
            <p
              className={
                infoLabelClass
              }
            >
              ผู้ขอเบิก
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {requesterName}
            </p>
          </div>

          {/* จำนวนรายการ */}

          <div
            className={`
              ${infoCardClass}
              bg-indigo-50
            `}
          >
            <p
              className={
                infoLabelClass
              }
            >
              จำนวนรายการ
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {
                issue.items
                  .length
              }{" "}
              รายการ
            </p>
          </div>

          {/* จำนวนรวมที่ขอเบิก */}

          <div
            className={
              infoCardClass
            }
          >
            <p
              className={
                infoLabelClass
              }
            >
              จำนวนรวมที่ขอเบิก
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {totalRequested}{" "}
              หน่วย
            </p>
          </div>

          {/* จำนวนรวมที่เบิกจ่ายจริง */}

          <div
            className={`
              ${infoCardClass}
              ${
                issue.status ===
                "APPROVED"
                  ? "bg-emerald-50"
                  : "bg-slate-50"
              }
              sm:col-span-2
              xl:col-span-3
            `}
          >
            <p
              className={
                infoLabelClass
              }
            >
              จำนวนรวมที่เบิกจ่ายจริง
            </p>

            <p
              className={`
                ${infoValueClass}

                ${
                  issue.status ===
                  "APPROVED"
                    ? "!text-emerald-800"
                    : "!text-slate-500"
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
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-black
          bg-slate-50
          shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]
        "
      >
        {/* Table Header */}

        <div
          className="
            border-b
            border-black
            bg-slate-100
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
              !text-slate-600
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

            <tbody
              className="
                !text-slate-900
              "
            >
              {issue.items.map(
                (
                  item: IssueItem,
                  index: number
                ) => (
                  <tr
                    key={
                      item.id
                    }
                    className="
                      bg-white
                      transition-colors
                      duration-200
                      even:bg-slate-50
                      hover:bg-blue-50
                    "
                  >
                    {/* ลำดับ */}

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

                    {/* รายการพัสดุ */}

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
                      <div
                        className="
                          break-words
                        "
                      >
                        <span
                          className="
                            font-extrabold
                            !text-slate-950
                          "
                        >
                          {
                            item
                              .material
                              .code
                          }
                        </span>{" "}
                        -{" "}
                        {
                          item
                            .material
                            .name
                        }
                      </div>
                    </td>

                    {/* จำนวนที่ขอเบิก */}

                    <td
                      className="
                        border
                        border-black
                        bg-blue-50/50
                        px-3
                        py-4
                        text-center
                        font-extrabold
                        !text-slate-900
                      "
                    >
                      {item.qty}
                    </td>

                    {/* จำนวนที่เบิกจ่ายจริง */}

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
                        <span
                          className="
                            !text-amber-700
                          "
                        >
                          รอเจ้าหน้าที่พัสดุ
                        </span>
                      ) : issue.status ===
                        "REJECTED" ? (
                        <span
                          className="
                            !text-red-700
                          "
                        >
                          ไม่อนุมัติ
                        </span>
                      ) : (
                        <span
                          className="
                            !text-emerald-700
                          "
                        >
                          {
                            item.issuedQty
                          }
                        </span>
                      )}
                    </td>

                    {/* หน่วย */}

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
                      {
                        item
                          .material
                          .unit
                      }
                    </td>

                    {/* หมายเหตุ */}

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
          สรุปเมื่อเสร็จสิ้นแล้ว
      ===================================================== */}

      {issue.status ===
        "APPROVED" && (
        <section
          className="
            w-full
            min-w-0
            rounded-[28px]
            border
            border-black
            bg-emerald-50
            p-5
            shadow-[0_20px_50px_-32px_rgba(15,23,42,0.4)]
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
                border-black
                bg-white/70
                px-5
                py-3
                sm:text-right
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  !text-slate-600
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
                {totalIssued}{" "}
                หน่วย
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          สถานะไม่อนุมัติ
      ===================================================== */}

      {issue.status ===
        "REJECTED" && (
        <section
          className="
            w-full
            min-w-0
            rounded-[28px]
            border
            border-black
            bg-red-50
            p-5
            shadow-[0_20px_50px_-32px_rgba(15,23,42,0.4)]
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