import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import {
  Bell,
  CheckCircle2,
  Clock,
  PackageMinus,
} from "lucide-react";

export default async function NotificationsPage() {
  // =====================================================
  // Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  let session;

  try {
    session = await verifySession(token);
  } catch {
    return null;
  }

  const isAdmin = session.role === "ADMIN";

  // =====================================================
  // ADMIN
  //
  // เห็นใบเบิกที่รอเจ้าหน้าที่พัสดุตรวจสอบ
  // ของทุกกลุ่มงาน
  // =====================================================

  if (isAdmin) {
    const pendingIssues = await prisma.issue.findMany({
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
      <div className="space-y-6">
        {/* Header + Summary */}
        <div
          className="
            rounded-2xl
            border border-slate-700
            bg-slate-800
            p-5
            shadow-lg
          "
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-12 w-12 shrink-0
                  items-center justify-center
                  rounded-2xl
                  bg-blue-500/15
                  !text-blue-400
                "
              >
                <Bell size={26} strokeWidth={2.2} />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold !text-white">
                  การแจ้งเตือน
                </h1>

                <p className="mt-1 text-base font-semibold !text-white">
                  ใบเบิกใหม่ที่รอเจ้าหน้าที่พัสดุตรวจสอบและดำเนินการ
                </p>
              </div>
            </div>

            {/* Summary */}
            <div
              className="
                flex items-center justify-between gap-5
                rounded-2xl
                border border-orange-500/30
                bg-slate-700/60
                px-5 py-4
                sm:min-w-[230px]
              "
            >
              <div>
                <p className="text-sm font-bold !text-white">
                  ใบเบิกที่รอดำเนินการ
                </p>

                <p className="mt-1 text-3xl font-extrabold !text-white">
                  {pendingIssues.length}
                </p>
              </div>

              <div
                className="
                  flex h-14 w-14 shrink-0
                  items-center justify-center
                  rounded-2xl
                  bg-orange-500/15
                  !text-orange-400
                "
              >
                <PackageMinus size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          {pendingIssues.length === 0 ? (
            <div
              className="
                rounded-2xl
                border border-slate-700
                bg-slate-800
                px-6 py-12
                text-center
                shadow-lg
              "
            >
              <div
                className="
                  mx-auto flex h-16 w-16
                  items-center justify-center
                  rounded-full
                  bg-slate-700
                  !text-white
                "
              >
                <Bell size={30} />
              </div>

              <h2 className="mt-4 text-xl font-extrabold !text-white">
                ไม่มีการแจ้งเตือน
              </h2>

              <p className="mt-1 font-semibold !text-white">
                ขณะนี้ไม่มีใบเบิกที่รอการดำเนินการ
              </p>
            </div>
          ) : (
            pendingIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issue/${issue.id}`}
                className="
                  group block rounded-2xl
                  border border-orange-500/30
                  bg-slate-800
                  p-5
                  shadow-lg
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-orange-400/70
                  hover:bg-slate-700
                  hover:shadow-xl
                "
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="
                      flex h-12 w-12 shrink-0
                      items-center justify-center
                      rounded-xl
                      bg-orange-500/15
                      !text-orange-400
                    "
                  >
                    <PackageMinus size={24} strokeWidth={2.2} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 !text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold !text-white">
                        มีใบเบิกใหม่รอดำเนินการ
                      </h2>

                      <span
                        className="
                          rounded-full
                          bg-orange-500/15
                          px-3 py-1
                          text-xs font-extrabold
                          !text-white
                        "
                      >
                        รอดำเนินการ
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm font-semibold !text-white">
                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          เลขที่ใบเบิก:
                        </span>{" "}
                        {issue.documentNo}
                      </p>

                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          กลุ่มงาน:
                        </span>{" "}
                        {issue.department.name}
                      </p>

                      {issue.officer && (
                        <p className="!text-white">
                          <span className="font-extrabold !text-white">
                            ผู้ขอเบิก:
                          </span>{" "}
                          {issue.officer.firstName}{" "}
                          {issue.officer.lastName}
                        </p>
                      )}

                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          จำนวนรายการ:
                        </span>{" "}
                        {issue.items.length} รายการ
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold !text-white">
                      <Clock size={16} />

                      <span className="!text-white">
                        ส่งใบเบิกเมื่อ{" "}
                        {new Date(issue.createdAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div
                    className="
                      hidden shrink-0
                      !text-white
                      transition-transform
                      group-hover:translate-x-1
                      group-hover:text-orange-400
                      sm:block
                    "
                  >
                    →
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // STAFF / VIEWER / กลุ่มงาน
  // =====================================================

  if (!session.departmentId) {
    return (
      <div className="space-y-6">
        {/* Header + Message */}
        <div
          className="
            rounded-2xl
            border border-slate-700
            bg-slate-800
            p-5
            shadow-lg
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-2xl
                bg-blue-500/15
                !text-blue-400
              "
            >
              <Bell size={26} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold !text-white">
                การแจ้งเตือน
              </h1>

              <p className="mt-1 text-base font-semibold !text-white">
                ไม่พบข้อมูลกลุ่มงานของผู้ใช้งาน
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border border-slate-700
            bg-slate-800
            px-6 py-12
            text-center
            shadow-lg
          "
        >
          <div
            className="
              mx-auto flex h-16 w-16
              items-center justify-center
              rounded-full
              bg-slate-700
              !text-white
            "
          >
            <Bell size={30} />
          </div>

          <h2 className="mt-4 text-xl font-extrabold !text-white">
            ไม่สามารถแสดงการแจ้งเตือนได้
          </h2>

          <p className="mt-1 font-semibold !text-white">
            บัญชีผู้ใช้งานยังไม่ได้กำหนดกลุ่มงาน
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ใบเบิกที่ ADMIN ดำเนินการแล้ว
  // =====================================================

  const completedIssues = await prisma.issue.findMany({
    where: {
      departmentId: session.departmentId,
      status: "APPROVED",
      approvedAt: {
        not: null,
      },
    },
    include: {
      department: true,
      officer: true,
      approvedBy: {
        select: {
          fullname: true,
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

  const totalIssuedItems = completedIssues.reduce(
    (total, issue) =>
      total +
      issue.items.reduce(
        (itemTotal, item) => itemTotal + item.issuedQty,
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header + Summary */}
      <div
        className="
          rounded-2xl
          border border-slate-700
          bg-slate-800
          p-5
          shadow-lg
        "
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-2xl
                bg-emerald-500/15
                !text-emerald-400
              "
            >
              <Bell size={26} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold !text-white">
                การแจ้งเตือน
              </h1>

              <p className="mt-1 text-base font-semibold !text-white">
                ผลการดำเนินการใบเบิกของกลุ่มงาน
              </p>
            </div>
          </div>

          {/* Summary */}
          <div
            className="
              flex items-center justify-between gap-5
              rounded-2xl
              border border-emerald-500/30
              bg-slate-700/60
              px-5 py-4
              sm:min-w-[230px]
            "
          >
            <div>
              <p className="text-sm font-bold !text-white">
                ใบเบิกที่ดำเนินการแล้ว
              </p>

              <p className="mt-1 text-3xl font-extrabold !text-white">
                {completedIssues.length}
              </p>

              <p className="mt-1 text-sm font-semibold !text-white">
                เบิกจ่ายรวม {totalIssuedItems} หน่วย
              </p>
            </div>

            <div
              className="
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-2xl
                bg-emerald-500/15
                !text-emerald-400
              "
            >
              <CheckCircle2 size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        {completedIssues.length === 0 ? (
          <div
            className="
              rounded-2xl
              border border-slate-700
              bg-slate-800
              px-6 py-12
              text-center
              shadow-lg
            "
          >
            <div
              className="
                mx-auto flex h-16 w-16
                items-center justify-center
                rounded-full
                bg-slate-700
                !text-white
              "
            >
              <Bell size={30} />
            </div>

            <h2 className="mt-4 text-xl font-extrabold !text-white">
              ยังไม่มีการแจ้งเตือน
            </h2>

            <p className="mt-1 font-semibold !text-white">
              เมื่อเจ้าหน้าที่พัสดุดำเนินการใบเบิกแล้ว
              จะแสดงผลที่หน้านี้
            </p>
          </div>
        ) : (
          completedIssues.map((issue) => {
            const requestedTotal = issue.items.reduce(
              (total, item) => total + item.qty,
              0
            );

            const issuedTotal = issue.items.reduce(
              (total, item) => total + item.issuedQty,
              0
            );

            return (
              <Link
                key={issue.id}
                href={`/issue/${issue.id}`}
                className="
                  group block rounded-2xl
                  border border-emerald-500/30
                  bg-slate-800
                  p-5
                  shadow-lg
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-emerald-400/70
                  hover:bg-slate-700
                  hover:shadow-xl
                "
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="
                      flex h-12 w-12 shrink-0
                      items-center justify-center
                      rounded-xl
                      bg-emerald-500/15
                      !text-emerald-400
                    "
                  >
                    <CheckCircle2 size={24} strokeWidth={2.2} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 !text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold !text-white">
                        เจ้าหน้าที่พัสดุดำเนินการใบเบิกแล้ว
                      </h2>

                      <span
                        className="
                          rounded-full
                          bg-emerald-500/15
                          px-3 py-1
                          text-xs font-extrabold
                          !text-white
                        "
                      >
                        ดำเนินการแล้ว
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm font-semibold !text-white">
                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          เลขที่ใบเบิก:
                        </span>{" "}
                        {issue.documentNo}
                      </p>

                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          กลุ่มงาน:
                        </span>{" "}
                        {issue.department.name}
                      </p>

                      {issue.officer && (
                        <p className="!text-white">
                          <span className="font-extrabold !text-white">
                            ผู้ขอเบิก:
                          </span>{" "}
                          {issue.officer.firstName}{" "}
                          {issue.officer.lastName}
                        </p>
                      )}

                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          จำนวนที่ขอเบิก:
                        </span>{" "}
                        {requestedTotal} หน่วย
                      </p>

                      <p className="!text-white">
                        <span className="font-extrabold !text-white">
                          จำนวนที่เบิกจ่ายจริง:
                        </span>{" "}
                        <span className="font-extrabold !text-white">
                          {issuedTotal} หน่วย
                        </span>
                      </p>

                      {issue.approvedBy && (
                        <p className="!text-white">
                          <span className="font-extrabold !text-white">
                            ดำเนินการโดย:
                          </span>{" "}
                          {issue.approvedBy.fullname}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold !text-white">
                      <Clock size={16} />

                      <span className="!text-white">
                        ดำเนินการเมื่อ{" "}
                        {issue.approvedAt
                          ? new Date(
                              issue.approvedAt
                            ).toLocaleString("th-TH")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div
                    className="
                      hidden shrink-0
                      !text-white
                      transition-transform
                      group-hover:translate-x-1
                      group-hover:text-emerald-400
                      sm:block
                    "
                  >
                    →
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}