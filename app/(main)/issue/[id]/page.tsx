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
    "border-amber-300 bg-amber-50 !text-amber-800",
  APPROVED:
    "border-emerald-300 bg-emerald-50 !text-emerald-800",
  REJECTED:
    "border-red-300 bg-red-50 !text-red-800",
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
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
    parsedDate.getFullYear() +
    543
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

  if (!session) {
    redirect("/login");
  }

  /* =======================================================
     VALIDATE ID
  ======================================================= */

  const issueId = Number(id);

  if (
    !Number.isInteger(
      issueId
    ) ||
    issueId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     ISSUE
  ======================================================= */

  const issue =
    await prisma.issue.findUnique(
      {
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
      }
    );

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
     REQUESTER
  ======================================================= */

  const requesterName =
    issue.officer
      ? `${issue.officer.firstName} ${issue.officer.lastName}`.trim()
      : "-";

  /* =======================================================
     TOTAL
  ======================================================= */

  const totalIssued =
    issue.items.reduce(
      (total, item) =>
        total +
        Number(
          item.issuedQty
        ),
      0
    );

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
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-end
              gap-3
            "
          >
            {/* ===============================================
                PDF
            =============================================== */}

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
              items={
                issue.items
              }
            />

            {/* ===============================================
                BACK
            =============================================== */}

            <AppButton
              href="/issue"
              variant="back"
              size="md"
              icon={
                <span>←</span>
              }
            >
              กลับ
            </AppButton>
          </div>
        }
      />

      {/* =====================================================
          MAIN CARD
          รูปแบบเดียวกับ /issue/create
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
          lg:p-6
        "
      >
        <div
          className="
            relative
            z-10

            w-full
            min-w-0

            space-y-6

            overflow-visible

            bg-white
          "
        >
          {/* =================================================
              DOCUMENT NUMBER
          ================================================= */}

          <div
            className="
              flex
              w-full
              justify-end
            "
          >
            <div
              className="
                w-full
                max-w-[260px]
              "
            >
              <label
                className="
                  mb-1.5
                  block

                  text-sm
                  font-extrabold

                  !text-slate-700
                "
              >
                เลขที่เอกสาร
              </label>

              <div
                className="
                  flex
                  h-10
                  w-full

                  items-center

                  rounded-xl

                  border
                  border-slate-300

                  bg-slate-50

                  px-3

                  text-sm
                  font-extrabold

                  !text-slate-900
                "
              >
                {issue.documentNo}
              </div>
            </div>
          </div>

          {/* =================================================
              FORM TITLE
          ================================================= */}

          <div
            className="
              border-b
              border-slate-200

              pb-5

              text-center
            "
          >
            <div
              className="
                text-2xl
                font-extrabold

                !text-slate-900
              "
            >
              พอ.101
            </div>

            <h2
              className="
                mt-1

                text-2xl
                font-extrabold

                !text-slate-900
              "
            >
              ใบเบิกพัสดุ
            </h2>
          </div>

          {/* =================================================
              STATUS / ACTION
          ================================================= */}

          <div
            className="
              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              <span
                className="
                  text-sm
                  font-extrabold

                  !text-slate-700
                "
              >
                สถานะ
              </span>

              <span
                className={`
                  inline-flex
                  h-9
                  items-center
                  justify-center

                  rounded-full

                  border

                  px-4

                  text-sm
                  font-extrabold

                  ${
                    statusClass[
                      issue.status
                    ] ??
                    `
                      border-slate-300
                      bg-slate-100
                      !text-slate-700
                    `
                  }
                `}
              >
                {statusName[
                  issue.status
                ] ??
                  issue.status}
              </span>
            </div>

            {session.role ===
              "ADMIN" &&
              issue.status ===
                "PENDING" && (
                <AppButton
                  href={`/issue/${issue.id}/approve`}
                  variant="primary"
                  size="md"
                  icon={
                    <span>
                      📝
                    </span>
                  }
                >
                  ลงจำนวนเบิกจ่ายจริง
                </AppButton>
              )}
          </div>

          {/* =================================================
              DOCUMENT INFORMATION
              รูปแบบเดียวกับ /issue/create
          ================================================= */}

          <div
            className="
              grid
              gap-4

              md:grid-cols-3
            "
          >
            {/* ===============================================
                ISSUE DATE
            =============================================== */}

            <div>
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold

                  !text-slate-800
                "
              >
                วันที่เบิก
              </label>

              <div
                className="
                  flex
                  h-11
                  w-full

                  items-center
                  justify-between

                  rounded-xl

                  border
                  border-slate-300

                  bg-slate-50

                  px-3

                  text-sm
                  font-bold

                  !text-slate-900
                "
              >
                <span>
                  {formatThaiDate(
                    issue.issueDate
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className="
                    shrink-0
                    text-lg
                  "
                >
                  📅
                </span>
              </div>
            </div>

            {/* ===============================================
                DEPARTMENT
            =============================================== */}

            <div>
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold

                  !text-slate-800
                "
              >
                หน่วยงาน / กลุ่มงาน
              </label>

              <div
                className="
                  flex
                  h-11
                  w-full

                  items-center

                  rounded-xl

                  border
                  border-slate-300

                  bg-slate-100

                  px-3

                  text-sm
                  font-bold

                  !text-slate-700
                "
              >
                {
                  issue
                    .department
                    .name
                }
              </div>
            </div>

            {/* ===============================================
                REQUESTER
            =============================================== */}

            <div>
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold

                  !text-slate-800
                "
              >
                ผู้ขอเบิก
              </label>

              <div
                className="
                  flex
                  h-11
                  w-full

                  items-center

                  rounded-xl

                  border
                  border-slate-300

                  bg-slate-100

                  px-3

                  text-sm
                  font-bold

                  !text-slate-700
                "
              >
                {requesterName}
              </div>
            </div>
          </div>

          {/* =================================================
              APPROVED INFORMATION
          ================================================= */}

          {issue.status ===
            "APPROVED" &&
            issue.approvedAt && (
              <div
                className="
                  grid
                  gap-4

                  rounded-xl

                  border
                  border-emerald-200

                  bg-emerald-50/70

                  p-4

                  md:grid-cols-2
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-bold

                      !text-emerald-700
                    "
                  >
                    วันที่ยืนยันการเบิกจ่าย
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-extrabold

                      !text-slate-900
                    "
                  >
                    {formatThaiDate(
                      issue.approvedAt
                    )}
                  </p>
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      font-bold

                      !text-emerald-700
                    "
                  >
                    เจ้าหน้าที่พัสดุ
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-extrabold

                      !text-slate-900
                    "
                  >
                    {issue
                      .approvedBy
                      ?.fullname ??
                      "-"}
                  </p>
                </div>
              </div>
            )}

          {/* =================================================
              PENDING WARNING
          ================================================= */}

          {session.role ===
            "ADMIN" &&
            issue.status ===
              "PENDING" && (
              <div
                className="
                  rounded-xl

                  border
                  border-amber-200

                  bg-amber-50

                  px-4
                  py-3
                "
              >
                <p
                  className="
                    font-extrabold

                    !text-amber-900
                  "
                >
                  ⚠️
                  ใบเบิกนี้ยังไม่ได้ตัดสต็อก
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

          {/* =================================================
              TABLE
              รูปแบบเดียวกับ /issue/create
          ================================================= */}

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
                min-w-[1250px]

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
                  {[
                    "ลำดับ",
                    "หมวดหมู่",
                    "รายการพัสดุ",
                    "จำนวนที่ขอเบิก",
                    "จำนวนที่เบิกจ่าย",
                    "หน่วย",
                    "หมายเหตุ",
                  ].map(
                    (
                      tableTitle
                    ) => (
                      <th
                        key={
                          tableTitle
                        }
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
                        "
                      >
                        {
                          tableTitle
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              {/* =============================================
                  TABLE BODY
              ============================================= */}

              <tbody>
                {issue.items.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="
                        border
                        border-black

                        px-4
                        py-12

                        text-center
                        font-bold

                        !text-slate-500
                      "
                    >
                      ไม่พบรายการพัสดุ
                    </td>
                  </tr>
                ) : (
                  issue.items.map(
                    (
                      item: IssueItem,
                      index: number
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                        className={`
                          transition-colors
                          duration-200

                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* =================================
                            NUMBER
                        ================================= */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3

                            text-center
                            font-extrabold

                            !text-slate-900
                          "
                        >
                          {index +
                            1}
                        </td>

                        {/* =================================
                            CATEGORY
                        ================================= */}

                        <td
                          className="
                            min-w-[190px]

                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full

                              items-center

                              rounded-xl

                              border
                              border-slate-300

                              bg-slate-50

                              px-3

                              font-semibold

                              !text-slate-900
                            "
                          >
                            {categoryName[
                              item
                                .material
                                .category
                            ] ??
                              item
                                .material
                                .category}
                          </div>
                        </td>

                        {/* =================================
                            MATERIAL
                        ================================= */}

                        <td
                          className="
                            min-w-[300px]

                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full

                              items-center

                              rounded-xl

                              border
                              border-slate-300

                              bg-slate-50

                              px-3

                              font-semibold

                              !text-slate-900
                            "
                          >
                            {
                              item
                                .material
                                .name
                            }
                          </div>
                        </td>

                        {/* =================================
                            REQUEST QTY
                        ================================= */}

                        <td
                          className="
                            min-w-[150px]

                            border
                            border-black

                            px-3
                            py-3

                            text-center
                          "
                        >
                          <div
                            className="
                              flex
                              h-10
                              w-full

                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-300

                              bg-slate-50

                              px-3

                              text-center
                              font-bold
                              tabular-nums

                              !text-slate-900
                            "
                          >
                            {Number(
                              item.qty
                            ).toLocaleString(
                              "th-TH"
                            )}
                          </div>
                        </td>

                        {/* =================================
                            ISSUED QTY
                        ================================= */}

                        <td
                          className="
                            min-w-[150px]

                            border
                            border-black

                            px-3
                            py-3

                            text-center
                          "
                        >
                          <div
                            className="
                              flex
                              h-10
                              w-full

                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-300

                              bg-slate-100

                              px-3

                              text-center
                              text-sm
                              font-bold
                              tabular-nums

                              !text-slate-700
                            "
                          >
                            {issue.status ===
                            "PENDING"
                              ? "-"
                              : issue.status ===
                                  "REJECTED"
                                ? "-"
                                : Number(
                                    item.issuedQty
                                  ).toLocaleString(
                                    "th-TH"
                                  )}
                          </div>
                        </td>

                        {/* =================================
                            UNIT
                        ================================= */}

                        <td
                          className="
                            min-w-[120px]

                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              h-10
                              w-full

                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-300

                              bg-slate-50

                              px-3

                              text-center
                              font-bold

                              !text-slate-700
                            "
                          >
                            {
                              item
                                .material
                                .unit
                            }
                          </div>
                        </td>

                        {/* =================================
                            REMARK
                        ================================= */}

                        <td
                          className="
                            min-w-[220px]

                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full

                              items-center

                              rounded-xl

                              border
                              border-slate-300

                              bg-slate-50

                              px-3

                              font-semibold

                              !text-slate-900
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

          {/* =================================================
              FOOTER STATUS
          ================================================= */}

          {issue.status ===
            "APPROVED" && (
              <div
                className="
                  flex
                  flex-col
                  gap-3

                  border-t
                  border-slate-200

                  pt-5

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      font-extrabold

                      !text-emerald-800
                    "
                  >
                    ✓
                    ดำเนินการเบิกจ่ายเสร็จสิ้นแล้ว
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-semibold

                      !text-slate-500
                    "
                  >
                    รายการได้รับการยืนยันและตัดออกจากบัญชีพัสดุแล้ว
                  </p>
                </div>

                <div
                  className="
                    text-left

                    sm:text-right
                  "
                >
                  <p
                    className="
                      text-xs
                      font-bold

                      !text-slate-500
                    "
                  >
                    จำนวนรวมที่เบิกจ่ายจริง
                  </p>

                  <p
                    className="
                      mt-1

                      text-xl
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
            )}

          {issue.status ===
            "REJECTED" && (
              <div
                className="
                  border-t
                  border-slate-200

                  pt-5
                "
              >
                <div
                  className="
                    rounded-xl

                    border
                    border-red-200

                    bg-red-50

                    px-4
                    py-3
                  "
                >
                  <p
                    className="
                      font-extrabold

                      !text-red-800
                    "
                  >
                    ❌
                    รายการเบิกนี้ไม่ได้รับการอนุมัติ
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
                </div>
              </div>
            )}
        </div>
      </AppCard>
    </AppPage>
  );
}