import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

import {
  CheckCircle2,
  Clock,
  PackageMinus,
} from "lucide-react";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

/* =========================================================
   DATE FORMAT
========================================================= */

function formatThaiDateTime(
  date: Date | string | null | undefined
) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(parsedDate);
}

/* =========================================================
   PAGE
========================================================= */

export default async function NotificationsPage() {
  /* =======================================================
     SESSION
  ======================================================= */

  const cookieStore = await cookies();

  const token =
    cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  let session;

  try {
    session = await verifySession(token);
  } catch {
    return null;
  }

  const isAdmin =
    session.role === "ADMIN";

  /* =======================================================
     ADMIN
  ======================================================= */

  if (isAdmin) {
    const pendingIssues =
      await prisma.issue.findMany({
        where: {
          status: "PENDING",
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

        orderBy: {
          createdAt: "desc",
        },
      });

    return (
      <AppPage>
        {/* =================================================
            HEADER
        ================================================= */}

        <AppPageHeader
          icon="🔔"
          title="การแจ้งเตือน"
          subtitle="ใบเบิกใหม่ที่รอเจ้าหน้าที่พัสดุตรวจสอบและดำเนินการ"
        />

        {/* =================================================
            SUMMARY
        ================================================= */}

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
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-16
              -top-20
              h-52
              w-52
              rounded-full
              bg-orange-300/10
              blur-3xl
            "
          />

          <div
            className="
              relative
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
                items-center
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-[18px]
                  border
                  border-orange-200
                  bg-orange-50
                  !text-orange-600
                  shadow-sm
                "
              >
                <PackageMinus
                  size={27}
                  strokeWidth={2.2}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-extrabold
                    !text-slate-500
                    sm:text-base
                  "
                >
                  ใบเบิกที่รอดำเนินการ
                </p>

                <div
                  className="
                    mt-1
                    flex
                    items-end
                    gap-2
                  "
                >
                  <p
                    className="
                      text-3xl
                      font-black
                      tracking-tight
                      !text-slate-900
                      sm:text-4xl
                    "
                  >
                    {pendingIssues.length}
                  </p>

                  <span
                    className="
                      pb-1
                      text-sm
                      font-bold
                      !text-slate-500
                    "
                  >
                    ใบเบิก
                  </span>
                </div>
              </div>
            </div>

            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-orange-300
                bg-orange-50
                px-4
                py-2
                text-sm
                font-extrabold
                !text-orange-700
                shadow-sm
              "
            >
              <span
                className="
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-orange-500
                "
              />

              รอตรวจสอบ
            </div>
          </div>
        </AppCard>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <section
          className="
            w-full
            min-w-0
            space-y-4
          "
        >
          {pendingIssues.length === 0 ? (
            <AppCard
              className="
                px-6
                py-10
                text-center
                sm:py-12
              "
            >
              <p
                className="
                  text-base
                  font-extrabold
                  !text-slate-500
                  sm:text-lg
                "
              >
                ขณะนี้ไม่มีใบเบิกที่รอการดำเนินการ
              </p>
            </AppCard>
          ) : (
            pendingIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issue/${issue.id}`}
                className="
                  group
                  block
                  w-full
                  min-w-0
                  outline-none
                "
              >
                <AppCard
                  className="
                    relative
                    min-w-0
                    overflow-hidden
                    p-5
                    transition-all
                    duration-300
                    group-hover:-translate-y-[2px]
                    group-hover:border-orange-300
                    group-hover:bg-white
                    group-hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)]
                    group-active:translate-y-0
                    group-active:scale-[0.995]
                    sm:p-6
                  "
                >
                  {/* Accent */}

                  <div
                    className="
                      absolute
                      inset-y-0
                      left-0
                      w-[4px]
                      bg-gradient-to-b
                      from-orange-400
                      to-amber-500
                    "
                  />

                  <div
                    className="
                      relative
                      flex
                      min-w-0
                      items-start
                      gap-4
                    "
                  >
                    {/* Icon */}

                    <div
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-[16px]
                        border
                        border-orange-200
                        bg-orange-50
                        !text-orange-600
                        shadow-sm
                      "
                    >
                      <PackageMinus
                        size={24}
                        strokeWidth={2.2}
                      />
                    </div>

                    {/* Content */}

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
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
                          มีใบเบิกใหม่
                        </h2>

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            border-orange-200
                            bg-orange-50
                            px-3
                            py-1
                            text-xs
                            font-extrabold
                            !text-orange-700
                          "
                        >
                          <span
                            className="
                              h-1.5
                              w-1.5
                              rounded-full
                              bg-orange-500
                            "
                          />

                          รอดำเนินการ
                        </span>
                      </div>

                      {/* =====================================
                          INFORMATION
                      ===================================== */}

                      <div
                        className="
                          mt-4
                          grid
                          grid-cols-1
                          gap-3
                          sm:grid-cols-2
                        "
                      >
                        <AppInfoCard
                          label="เลขที่ใบเบิก"
                          value={issue.documentNo}
                        />

                        <AppInfoCard
                          label="กลุ่มงาน"
                          value={issue.department.name}
                        />

                        {issue.officer && (
                          <AppInfoCard
                            label="ผู้ขอเบิก"
                            value={`${issue.officer.firstName} ${issue.officer.lastName}`}
                          />
                        )}

                        <AppInfoCard
                          label="จำนวนรายการ"
                          value={`${issue.items.length.toLocaleString(
                            "th-TH"
                          )} รายการ`}
                        />
                      </div>

                      {/* Time */}

                      <div
                        className="
                          mt-4
                          flex
                          items-center
                          gap-2
                          border-t
                          border-slate-200
                          pt-4
                          text-sm
                          font-bold
                          !text-slate-500
                        "
                      >
                        <Clock
                          size={16}
                          className="shrink-0"
                        />

                        <span>
                          ส่งใบเบิกเมื่อ{" "}
                          {formatThaiDateTime(
                            issue.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}

                    <div
                      className="
                        hidden
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-slate-200
                        bg-white
                        font-black
                        !text-slate-500
                        shadow-sm
                        transition-all
                        duration-300
                        group-hover:translate-x-1
                        group-hover:border-orange-300
                        group-hover:!text-orange-600
                        sm:flex
                      "
                    >
                      →
                    </div>
                  </div>
                </AppCard>
              </Link>
            ))
          )}
        </section>
      </AppPage>
    );
  }

  /* =======================================================
     STAFF / VIEWER
     NO DEPARTMENT
  ======================================================= */

  if (!session.departmentId) {
    return (
      <AppPage>
        <AppPageHeader
          icon="🔔"
          title="การแจ้งเตือน"
          subtitle="ไม่พบข้อมูลกลุ่มงานของผู้ใช้งาน"
        />

        <AppCard
          className="
            px-6
            py-12
            text-center
          "
        >
          <div
            className="
              mx-auto
              max-w-md
            "
          >
            <h2
              className="
                text-xl
                font-black
                tracking-tight
                !text-slate-900
                sm:text-2xl
              "
            >
              ไม่สามารถแสดงการแจ้งเตือนได้
            </h2>

            <p
              className="
                mt-2
                font-semibold
                !text-slate-500
              "
            >
              บัญชีผู้ใช้งานยังไม่ได้กำหนดกลุ่มงาน
            </p>
          </div>
        </AppCard>
      </AppPage>
    );
  }

  /* =======================================================
     STAFF / VIEWER
     COMPLETED ISSUES
  ======================================================= */

  const completedIssues =
    await prisma.issue.findMany({
      where: {
        departmentId:
          session.departmentId,

        status: "APPROVED",

        approvedAt: {
          not: null,
        },

        approvedById: {
          not: null,
        },
      },

      include: {
        department: true,
        officer: true,

        approvedBy: {
          select: {
            fullname: true,
            role: true,
          },
        },

        items: {
          include: {
            material: true,
          },
        },
      },

      orderBy: {
        approvedAt: "desc",
      },
    });

  /* =======================================================
     ADMIN COMPLETED ONLY
  ======================================================= */

  const adminCompletedIssues =
    completedIssues.filter(
      (issue) =>
        issue.approvedBy?.role ===
        "ADMIN"
    );

  const totalIssuedItems =
    adminCompletedIssues.reduce(
      (total, issue) =>
        total +
        issue.items.reduce(
          (itemTotal, item) =>
            itemTotal +
            item.issuedQty,
          0
        ),
      0
    );

  /* =======================================================
     STAFF / VIEWER UI
  ======================================================= */

  return (
    <AppPage>
      {/* =================================================
          HEADER
      ================================================= */}

      <AppPageHeader
        icon="🔔"
        title="การแจ้งเตือน"
        subtitle="ผลการดำเนินการใบเบิกของกลุ่มงาน"
      />

      {/* =================================================
          SUMMARY
      ================================================= */}

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
            bg-emerald-300/10
            blur-3xl
          "
        />

        <div
          className="
            relative
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
              items-center
              gap-4
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-[18px]
                border
                border-emerald-200
                bg-emerald-50
                !text-emerald-600
                shadow-sm
              "
            >
              <CheckCircle2
                size={27}
                strokeWidth={2.2}
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-500
                  sm:text-base
                "
              >
                ใบเบิกที่ดำเนินการแล้ว
              </p>

              <div
                className="
                  mt-1
                  flex
                  items-end
                  gap-2
                "
              >
                <p
                  className="
                    text-3xl
                    font-black
                    tracking-tight
                    !text-slate-900
                    sm:text-4xl
                  "
                >
                  {adminCompletedIssues.length}
                </p>

                <span
                  className="
                    pb-1
                    text-sm
                    font-bold
                    !text-slate-500
                  "
                >
                  ใบเบิก
                </span>
              </div>

              <p
                className="
                  mt-1
                  text-sm
                  font-bold
                  !text-slate-500
                "
              >
                เบิกจ่ายรวม{" "}
                {totalIssuedItems.toLocaleString(
                  "th-TH"
                )}{" "}
                หน่วย
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              border
              border-emerald-300
              bg-emerald-50
              px-4
              py-2
              text-sm
              font-extrabold
              !text-emerald-700
              shadow-sm
            "
          >
            <CheckCircle2 size={16} />

            ดำเนินการแล้ว
          </div>
        </div>
      </AppCard>

      {/* =================================================
          NOTIFICATIONS
      ================================================= */}

      <section
        className="
          w-full
          min-w-0
          space-y-4
        "
      >
        {adminCompletedIssues.length === 0 ? (
          <AppCard
            className="
              px-6
              py-10
              text-center
              sm:py-12
            "
          >
            <p
              className="
                font-semibold
                leading-relaxed
                !text-slate-500
              "
            >
              เมื่อเจ้าหน้าที่พัสดุดำเนินการใบเบิกแล้ว
              จะแสดงผลที่หน้านี้
            </p>
          </AppCard>
        ) : (
          adminCompletedIssues.map(
            (issue) => {
              const requestedTotal =
                issue.items.reduce(
                  (total, item) =>
                    total + item.qty,
                  0
                );

              const issuedTotal =
                issue.items.reduce(
                  (total, item) =>
                    total +
                    item.issuedQty,
                  0
                );

              return (
                <Link
                  key={issue.id}
                  href={`/issue/${issue.id}`}
                  className="
                    group
                    block
                    w-full
                    min-w-0
                    outline-none
                  "
                >
                  <AppCard
                    className="
                      relative
                      min-w-0
                      overflow-hidden
                      p-5
                      transition-all
                      duration-300
                      group-hover:-translate-y-[2px]
                      group-hover:border-emerald-300
                      group-hover:bg-white
                      group-hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)]
                      group-active:translate-y-0
                      group-active:scale-[0.995]
                      sm:p-6
                    "
                  >
                    {/* Accent */}

                    <div
                      className="
                        absolute
                        inset-y-0
                        left-0
                        w-[4px]
                        bg-gradient-to-b
                        from-emerald-400
                        to-teal-500
                      "
                    />

                    <div
                      className="
                        relative
                        flex
                        min-w-0
                        items-start
                        gap-4
                      "
                    >
                      {/* Icon */}

                      <div
                        className="
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-[16px]
                          border
                          border-emerald-200
                          bg-emerald-50
                          !text-emerald-600
                          shadow-sm
                        "
                      >
                        <CheckCircle2
                          size={24}
                          strokeWidth={2.2}
                        />
                      </div>

                      {/* Content */}

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
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
                            เจ้าหน้าที่พัสดุดำเนินการใบเบิกแล้ว
                          </h2>

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              border
                              border-emerald-200
                              bg-emerald-50
                              px-3
                              py-1
                              text-xs
                              font-extrabold
                              !text-emerald-700
                            "
                          >
                            <CheckCircle2
                              size={12}
                            />

                            ดำเนินการแล้ว
                          </span>
                        </div>

                        {/* =====================================
                            INFORMATION
                        ===================================== */}

                        <div
                          className="
                            mt-4
                            grid
                            grid-cols-1
                            gap-3
                            sm:grid-cols-2
                          "
                        >
                          <AppInfoCard
                            label="เลขที่ใบเบิก"
                            value={issue.documentNo}
                          />

                          <AppInfoCard
                            label="กลุ่มงาน"
                            value={issue.department.name}
                          />

                          {issue.officer && (
                            <AppInfoCard
                              label="ผู้ขอเบิก"
                              value={`${issue.officer.firstName} ${issue.officer.lastName}`}
                            />
                          )}

                          <AppInfoCard
                            label="จำนวนที่ขอเบิก"
                            value={`${requestedTotal.toLocaleString(
                              "th-TH"
                            )} หน่วย`}
                          />

                          <AppInfoCard
                            label="จำนวนที่เบิกจ่ายจริง"
                            value={`${issuedTotal.toLocaleString(
                              "th-TH"
                            )} หน่วย`}
                          />

                          {issue.approvedBy && (
                            <AppInfoCard
                              label="ดำเนินการโดย"
                              value={
                                issue.approvedBy
                                  .fullname
                              }
                            />
                          )}
                        </div>

                        {/* Time */}

                        <div
                          className="
                            mt-4
                            flex
                            items-center
                            gap-2
                            border-t
                            border-slate-200
                            pt-4
                            text-sm
                            font-bold
                            !text-slate-500
                          "
                        >
                          <Clock
                            size={16}
                            className="shrink-0"
                          />

                          <span>
                            ดำเนินการเมื่อ{" "}
                            {formatThaiDateTime(
                              issue.approvedAt
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}

                      <div
                        className="
                          hidden
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-slate-200
                          bg-white
                          font-black
                          !text-slate-500
                          shadow-sm
                          transition-all
                          duration-300
                          group-hover:translate-x-1
                          group-hover:border-emerald-300
                          group-hover:!text-emerald-600
                          sm:flex
                        "
                      >
                        →
                      </div>
                    </div>
                  </AppCard>
                </Link>
              );
            }
          )
        )}
      </section>
    </AppPage>
  );
}