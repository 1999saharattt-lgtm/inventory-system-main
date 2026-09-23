import { prisma } from "@/lib/prisma";
import {
  notFound,
  redirect,
} from "next/navigation";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import IssuePdf from "./IssuePdf";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   STATUS
========================================================= */

const statusName: Record<
  string,
  string
> = {
  PENDING: "รอเบิกจ่าย",
  APPROVED: "เสร็จสิ้นแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

const statusClass: Record<
  string,
  string
> = {
  PENDING:
    "border-amber-300 bg-amber-50/90 !text-amber-800",
  APPROVED:
    "border-emerald-300 bg-emerald-50/90 !text-emerald-800",
  REJECTED:
    "border-red-300 bg-red-50/90 !text-red-800",
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

/* =========================================================
   PAGE
========================================================= */

export default async function IssueDetailPage({
  params,
}: Props) {
  const { id } = await params;

  /* =======================================================
     SESSION
  ======================================================= */

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

  /* =======================================================
     VALIDATE ID
  ======================================================= */

  const issueId = Number(id);

  if (
    !Number.isInteger(issueId) ||
    issueId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     ISSUE
  ======================================================= */

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

  /* =======================================================
     ACCESS CONTROL
  ======================================================= */

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

  /* =======================================================
     SUMMARY
  ======================================================= */

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

  /* =======================================================
     REQUESTER
  ======================================================= */

  const requesterName =
    issue.officer
      ? `${issue.officer.firstName} ${issue.officer.lastName}`.trim()
      : "-";

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
        title="รายละเอียดใบเบิกพัสดุ"
        subtitle="รายละเอียดรายการเบิกจ่ายพัสดุ"
        actions={
          <AppButton
            href="/issue"
            variant="back"
            size="md"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          STATUS
      ===================================================== */}

      <AppCard
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          p-5
          sm:p-6
        "
      >
        {/* Decorative Background */}

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
          {/* Status */}

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
                  `
                    border-slate-200
                    bg-slate-100
                    !text-slate-800
                  `
                }
              `}
            >
              {statusName[
                issue.status
              ] ?? issue.status}
            </div>
          </div>

          {/* Admin Action */}

          {session.role ===
            "ADMIN" &&
            issue.status ===
              "PENDING" && (
              <AppButton
                href={`/issue/${issue.id}/approve`}
                variant="primary"
                size="md"
                icon={<span>📝</span>}
                className="
                  w-full
                  sm:w-auto
                "
              >
                ลงจำนวนเบิกจ่ายจริง
              </AppButton>
            )}

          {/* Approved Information */}

          {issue.status ===
            "APPROVED" &&
            issue.approvedAt && (
              <div
                className="
                  rounded-[18px]

                  border
                  border-emerald-200/80

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

        {/* ===================================================
            PENDING WARNING
        =================================================== */}

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
      </AppCard>

      {/* =====================================================
          ISSUE INFORMATION
      ===================================================== */}

      <AppCard
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          p-5
          sm:p-6
        "
      >
        {/* Decorative Background */}

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

        {/* ===================================================
            CARD HEADER
        =================================================== */}

        <div
          className="
            relative
            mb-5

            flex
            flex-col
            gap-4

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

        {/* ===================================================
            INFORMATION GRID
        =================================================== */}

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
          <AppInfoCard
            label="เลขที่เอกสาร"
            value={issue.documentNo}
          />

          <AppInfoCard
            label="วันที่เบิก"
            value={formatThaiDate(
              issue.issueDate
            )}
          />

          <AppInfoCard
            label="หน่วยงาน / กลุ่มงาน"
            value={
              issue.department.name
            }
          />

          <AppInfoCard
            label="ผู้ขอเบิก"
            value={requesterName}
          />

          <AppInfoCard
            label="จำนวนรายการ"
            value={`${issue.items.length.toLocaleString(
              "th-TH"
            )} รายการ`}
          />

          <AppInfoCard
            label="จำนวนรวมที่ขอเบิก"
            value={`${totalRequested.toLocaleString(
              "th-TH"
            )} หน่วย`}
          />

          <AppInfoCard
            label="จำนวนรวมที่เบิกจ่ายจริง"
            value={
              issue.status ===
              "APPROVED"
                ? `${totalIssued.toLocaleString(
                    "th-TH"
                  )} หน่วย`
                : "-"
            }
            className="
              sm:col-span-2
              xl:col-span-3
            "
          />
        </div>
      </AppCard>

      {/* =====================================================
          ISSUE ITEMS TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุที่ขอเบิก"
        subtitle="รายละเอียดจำนวนที่ขอเบิกและจำนวนที่เบิกจ่ายจริง"
        count={issue.items.length}
        className="
          w-full
          min-w-0
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
              min-w-[900px]
              table-fixed
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

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody
              className="
                bg-white
                !text-slate-900
              "
            >
              {issue.items.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="
                      border
                      border-black

                      bg-white

                      px-4
                      py-14

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
                        "
                      >
                        📦
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
                        ไม่พบรายการพัสดุ
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        ไม่มีรายการพัสดุในใบเบิกฉบับนี้
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                issue.items.map(
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

                        even:bg-slate-50/60

                        hover:!bg-blue-50/70
                      "
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          border
                          border-black

                          bg-inherit

                          px-3
                          py-4

                          text-center
                          font-extrabold
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

                          bg-inherit

                          px-4
                          py-4

                          align-middle

                          font-semibold
                          !text-slate-900
                        "
                      >
                        <div className="break-words">
                          <span className="font-extrabold">
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

                          bg-inherit

                          px-3
                          py-4

                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {Number(
                          item.qty
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* จำนวนที่เบิกจ่ายจริง */}

                      <td
                        className="
                          border
                          border-black

                          bg-inherit

                          px-3
                          py-4

                          text-center
                          font-extrabold
                          tabular-nums
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
                            {Number(
                              item.issuedQty
                            ).toLocaleString(
                              "th-TH"
                            )}
                          </span>
                        )}
                      </td>

                      {/* หน่วย */}

                      <td
                        className="
                          border
                          border-black

                          bg-inherit

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

                          bg-inherit

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
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>

      {/* =====================================================
          APPROVED SUMMARY
      ===================================================== */}

      {issue.status ===
        "APPROVED" && (
        <AppCard
          className="
            w-full
            min-w-0

            border-emerald-200/80
            bg-emerald-50/80

            p-5

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
                  tabular-nums

                  !text-emerald-800
                "
              >
                {totalIssued.toLocaleString(
                  "th-TH"
                )}{" "}
                หน่วย
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {/* =====================================================
          REJECTED
      ===================================================== */}

      {issue.status ===
        "REJECTED" && (
        <AppCard
          className="
            w-full
            min-w-0

            border-red-200
            bg-red-50/80

            p-5

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
        </AppCard>
      )}
    </AppPage>
  );
}