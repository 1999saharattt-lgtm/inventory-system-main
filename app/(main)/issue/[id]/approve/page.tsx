import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import { approveIssue } from "./action";

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

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   PAGE
========================================================= */

export default async function ApproveIssuePage({
  params,
}: Props) {
  const { id } = await params;

  /* =======================================================
     SESSION
  ======================================================= */

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

  /* =======================================================
     LOGIN
  ======================================================= */

  if (!session) {
    redirect("/login");
  }

  /* =======================================================
     ADMIN ONLY
  ======================================================= */

  if (session.role !== "ADMIN") {
    redirect("/issue");
  }

  /* =======================================================
     ISSUE
  ======================================================= */

  const issue =
    await prisma.issue.findUnique({
      where: {
        id: Number(id),
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

  if (!issue) {
    notFound();
  }

  /* =======================================================
     PENDING ONLY
  ======================================================= */

  if (issue.status !== "PENDING") {
    redirect(`/issue/${issue.id}`);
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

  /* =======================================================
     APPROVE SERVER ACTION
  ======================================================= */

  const submitApprove = async (
    formData: FormData
  ) => {
    "use server";

    const issuedQty: Record<
      number,
      number
    > = {};

    for (const item of issue.items) {
      const fieldName =
        `issuedQty_${item.id}`;

      const rawValue =
        formData.get(fieldName);

      if (
        rawValue === null ||
        String(rawValue).trim() === ""
      ) {
        throw new Error(
          `กรุณาระบุจำนวนเบิกจ่ายจริงสำหรับ "${item.material.name}"`
        );
      }

      const value =
        Number(rawValue);

      if (
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 0
      ) {
        throw new Error(
          `จำนวนเบิกจ่ายของ "${item.material.name}" ไม่ถูกต้อง`
        );
      }

      if (
        value >
        Number(item.qty)
      ) {
        throw new Error(
          `จำนวนเบิกจ่ายของ "${item.material.name}" มากกว่าจำนวนที่ขอเบิก`
        );
      }

      issuedQty[item.id] =
        value;
    }

    await approveIssue(
      issue.id,
      issuedQty
    );

    redirect(
      `/issue/${issue.id}`
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📝"
        title="ตรวจสอบและลงจำนวนเบิกจ่าย"
        subtitle="ตรวจสอบรายการและระบุจำนวนที่เบิกจ่ายจริง"
        actions={
          <AppButton
            href={`/issue/${issue.id}`}
            variant="back"
            size="md"
          >
            กลับรายละเอียด
          </AppButton>
        }
      />

      {/* =====================================================
          ISSUE INFORMATION
      ===================================================== */}

      <AppCard className="p-4 sm:p-5">
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
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

              bg-blue-50/90

              text-xl

              shadow-sm

              ring-1
              ring-blue-100/80
            "
          >
            📄
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900

                sm:text-xl
              "
            >
              ข้อมูลใบเบิก
            </h2>

            <p
              className="
                mt-0.5

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              รายละเอียดเอกสารและผู้ขอเบิก
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-4

            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              เลขที่ใบเบิก
            </p>

            <p
              className="
                mt-2
                break-words

                text-base
                font-extrabold
                !text-slate-900
              "
            >
              {issue.documentNo}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              วันที่เบิก
            </p>

            <p
              className="
                mt-2

                text-base
                font-extrabold
                !text-slate-900
              "
            >
              {new Date(
                issue.issueDate
              ).toLocaleDateString(
                "th-TH"
              )}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              หน่วยงาน / กลุ่มงาน
            </p>

            <p
              className="
                mt-2
                break-words

                text-base
                font-extrabold
                !text-slate-900
              "
            >
              {issue.department?.name ??
                "-"}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              ผู้ขอเบิก
            </p>

            <p
              className="
                mt-2
                break-words

                text-base
                font-extrabold
                !text-slate-900
              "
            >
              {issue.officer
                ? `${issue.officer.firstName} ${issue.officer.lastName}`
                : "-"}
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              จำนวนรายการ
            </p>

            <p
              className="
                mt-2

                text-base
                font-extrabold
                !text-slate-900
              "
            >
              {issue.items.length.toLocaleString(
                "th-TH"
              )}{" "}
              รายการ
            </p>
          </AppInfoCard>

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              จำนวนรวมที่ขอเบิก
            </p>

            <p
              className="
                mt-2

                text-base
                font-extrabold
                !text-slate-900
              "
            >
              {totalRequested.toLocaleString(
                "th-TH"
              )}{" "}
              หน่วย
            </p>
          </AppInfoCard>
        </div>

        {issue.remark && (
          <div className="mt-4">
            <AppInfoCard>
              <p
                className="
                  text-sm
                  font-bold
                  !text-slate-500
                "
              >
                หมายเหตุ
              </p>

              <p
                className="
                  mt-2
                  whitespace-pre-wrap
                  break-words

                  text-base
                  font-semibold
                  leading-relaxed
                  !text-slate-900
                "
              >
                {issue.remark}
              </p>
            </AppInfoCard>
          </div>
        )}
      </AppCard>

      {/* =====================================================
          WARNING
      ===================================================== */}

      <AppCard className="p-4 sm:p-5">
        <AppInfoCard>
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-[13px]

                bg-amber-50

                text-lg

                ring-1
                ring-amber-200
              "
            >
              ⚠️
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-base
                  font-extrabold
                  !text-slate-900

                  sm:text-lg
                "
              >
                ตรวจสอบก่อนยืนยัน
              </p>

              <p
                className="
                  mt-1

                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-slate-600

                  sm:text-base
                "
              >
                กรุณาตรวจสอบจำนวนพัสดุที่สามารถเบิกจ่ายได้จริงก่อนยืนยันรายการ
                ระบบจะใช้จำนวนเบิกจ่ายจริงในการตัดสต็อกและบันทึก Stock Card
              </p>
            </div>
          </div>
        </AppInfoCard>
      </AppCard>

      {/* =====================================================
          APPROVE FORM
      ===================================================== */}

      <form
        action={submitApprove}
        className="
          w-full
          min-w-0
          space-y-4
        "
      >
        {/* ===================================================
            TABLE
        =================================================== */}

        <AppTableCard
          title="รายการพัสดุที่ขอเบิก"
          subtitle={`ทั้งหมด ${issue.items.length.toLocaleString(
            "th-TH"
          )} รายการ • จำนวนที่ขอรวม ${totalRequested.toLocaleString(
            "th-TH"
          )} หน่วย`}
        >
          <div
            className="
              w-full
              overflow-x-auto
            "
          >
            <table
              className="
                w-full
                min-w-[900px]

                border-collapse

                bg-white

                text-sm
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
                      font-extrabold
                      !text-white
                    "
                  >
                    ลำดับ
                  </th>

                  <th
                    className="
                      w-[18%]

                      border
                      border-black

                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700

                      px-3
                      py-4

                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    หมวดหมู่
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
                      font-extrabold
                      !text-white
                    "
                  >
                    รายการพัสดุ
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
                      font-extrabold
                      !text-white
                    "
                  >
                    จำนวนที่ขอ
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
                      font-extrabold
                      !text-white
                    "
                  >
                    จำนวนเบิกจ่ายจริง
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
                      font-extrabold
                      !text-white
                    "
                  >
                    หน่วย
                  </th>
                </tr>
              </thead>

              <tbody>
                {issue.items.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={item.id}
                      className={`
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/50"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* NUMBER */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          text-center
                          font-extrabold
                          !text-slate-800
                        "
                      >
                        {index + 1}
                      </td>

                      {/* CATEGORY */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          font-bold
                          !text-slate-900
                        "
                      >
                        {categoryName[
                          item.material
                            .category
                        ] ??
                          item.material
                            .category}
                      </td>

                      {/* MATERIAL */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          font-bold
                          !text-slate-900
                        "
                      >
                        <div
                          className="
                            flex
                            min-w-0
                            flex-col
                            gap-0.5
                          "
                        >
                          <span
                            className="
                              text-xs
                              font-extrabold
                              !text-slate-500
                            "
                          >
                            {item.material
                              .code || "-"}
                          </span>

                          <span
                            className="
                              break-words
                              !text-slate-900
                            "
                          >
                            {item.material
                              .name || "-"}
                          </span>
                        </div>
                      </td>

                      {/* REQUESTED QTY */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

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

                      {/* ISSUED QTY */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          text-center
                        "
                      >
                        <input
                          type="number"
                          name={`issuedQty_${item.id}`}
                          min="0"
                          max={Number(
                            item.qty
                          )}
                          step="1"
                          placeholder="กรอกจำนวน"
                          required
                          className="
                            h-11
                            w-full

                            rounded-[14px]

                            border-2
                            !border-black

                            bg-white

                            px-3

                            text-center
                            text-base
                            font-extrabold
                            tabular-nums
                            !text-slate-900

                            shadow-sm
                            outline-none

                            transition-all
                            duration-200

                            placeholder:font-semibold
                            placeholder:!text-slate-400

                            hover:bg-slate-50

                            focus:!border-emerald-600
                            focus:bg-white
                            focus:ring-4
                            focus:ring-emerald-100/70
                          "
                        />
                      </td>

                      {/* UNIT */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3

                          text-center
                          font-extrabold
                          !text-slate-700
                        "
                      >
                        {item.material
                          .unit || "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </AppTableCard>

        {/* ===================================================
            CONFIRM SUMMARY
        =================================================== */}

        <AppCard className="p-4 sm:p-5">
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
                  font-extrabold
                  !text-slate-900
                "
              >
                📦 จำนวนที่กำลังจะเบิกจ่าย
              </p>

              <p
                className="
                  mt-1

                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                กรุณากรอกจำนวนเบิกจ่ายจริงในแต่ละรายการ
              </p>
            </div>

            <AppInfoCard className="shrink-0 sm:min-w-[180px]">
              <p
                className="
                  text-right
                  text-3xl
                  font-black
                  tabular-nums
                  !text-slate-900
                "
              >
                {totalRequested.toLocaleString(
                  "th-TH"
                )}
              </p>

              <p
                className="
                  mt-1
                  text-right
                  text-sm
                  font-bold
                  !text-slate-500
                "
              >
                หน่วยที่ขอสูงสุด
              </p>
            </AppInfoCard>
          </div>

          {/* ===============================================
              ACTIONS
          =============================================== */}

          <div
            className="
              mt-5

              flex
              flex-col
              gap-2

              border-t
              border-slate-200

              pt-4

              sm:flex-row
              sm:justify-end
            "
          >
            <AppButton
              href={`/issue/${issue.id}`}
              variant="secondary"
              size="md"
            >
              ยกเลิก
            </AppButton>

            <AppButton
              type="submit"
              variant="success"
              size="md"
              icon={
                <span aria-hidden="true">
                  ✓
                </span>
              }
            >
              ยืนยันการเบิกจ่ายและตัดสต็อก
            </AppButton>
          </div>
        </AppCard>
      </form>
    </AppPage>
  );
}
