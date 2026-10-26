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
  const token = cookieStore.get("session")?.value;

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

  const issue = await prisma.issue.findUnique({
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

  const totalRequested = issue.items.reduce(
    (total, item) => total + Number(item.qty),
    0
  );

  /* =======================================================
     APPROVE SERVER ACTION
  ======================================================= */

  const submitApprove = async (
    formData: FormData
  ) => {
    "use server";

    const issuedQty: Record<number, number> = {};

    for (const item of issue.items) {
      const fieldName = `issuedQty_${item.id}`;
      const rawValue = formData.get(fieldName);

      if (
        rawValue === null ||
        String(rawValue).trim() === ""
      ) {
        throw new Error(
          `กรุณาระบุจำนวนเบิกจ่ายจริงสำหรับ "${item.material.name}"`
        );
      }

      const value = Number(rawValue);

      if (
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 0
      ) {
        throw new Error(
          `จำนวนเบิกจ่ายของ "${item.material.name}" ไม่ถูกต้อง`
        );
      }

      if (value > Number(item.qty)) {
        throw new Error(
          `จำนวนเบิกจ่ายของ "${item.material.name}" มากกว่าจำนวนที่ขอเบิก`
        );
      }

      issuedQty[item.id] = value;
    }

    await approveIssue(
      issue.id,
      issuedQty
    );

    redirect(`/issue/${issue.id}`);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      <AppPageHeader
        icon="📝"
        title="ตรวจสอบและลงจำนวนเบิกจ่าย"
        subtitle="ตรวจสอบรายการและระบุจำนวนที่เบิกจ่ายจริง"
        actions={
          <AppButton href={`/issue/${issue.id}`} variant="back" size="md" icon={<span aria-hidden="true">←</span>}>
            กลับ
          </AppButton>
        }
      />

      {/* รูปแบบการ์ดหลักตรงกับหน้ารายละเอียดใบเบิก */}
      <AppCard className="relative z-0 w-full min-w-0 overflow-visible p-4 sm:p-5 lg:p-6">
        <div className="relative z-10 w-full min-w-0 space-y-6 overflow-visible">
          <div className="flex w-full justify-end">
            <div className="w-full max-w-[220px]">
              <label className="mb-1.5 block text-xs font-extrabold !text-slate-600">เลขที่เอกสาร</label>
              <div className="flex h-9 w-full items-center rounded-[11px] border border-slate-200 bg-slate-50 px-3 text-sm font-extrabold !text-slate-900 shadow-sm">
                {issue.documentNo}
              </div>
            </div>
          </div>

          <AppCard className="relative z-[5000] !mt-3 overflow-visible p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-blue-50/90 text-xl shadow-sm ring-1 ring-blue-100/80">🧾</div>
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight !text-slate-900 sm:text-xl">ข้อมูลการเบิก</h2>
                <p className="mt-0.5 text-sm font-semibold !text-slate-500">วันที่ กลุ่มงาน และผู้ขอเบิก</p>
              </div>
            </div>
            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              <AppInfoCard className="relative overflow-visible">
                <label className="mb-2 block text-base font-extrabold !text-slate-800">วันที่เบิก</label>
                <div className="flex h-[52px] w-full min-w-0 items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-base font-bold !text-slate-900 shadow-sm">
                  <span>{new Date(issue.issueDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span aria-hidden="true">📅</span>
                </div>
              </AppInfoCard>
              <AppInfoCard className="relative overflow-visible">
                <label className="mb-2 block text-base font-extrabold !text-slate-800">หน่วยงาน / กลุ่มงาน</label>
                <div className="flex min-h-[52px] w-full min-w-0 items-center rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-base font-bold !text-slate-900 shadow-sm">
                  {issue.department?.name ?? "-"}
                </div>
              </AppInfoCard>
              <AppInfoCard className="relative overflow-visible">
                <label className="mb-2 block text-base font-extrabold !text-slate-800">ผู้ขอเบิก</label>
                <div className="flex min-h-[52px] w-full min-w-0 items-center rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-base font-bold !text-slate-900 shadow-sm">
                  {issue.officer ? `${issue.officer.firstName} ${issue.officer.lastName}` : "-"}
                </div>
              </AppInfoCard>
            </div>
          </AppCard>

          {issue.remark && (
            <AppInfoCard className="min-w-0">
              <p className="text-sm font-bold !text-slate-500">หมายเหตุ</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base font-semibold leading-relaxed !text-slate-900">{issue.remark}</p>
            </AppInfoCard>
          )}

          <form action={submitApprove} className="w-full min-w-0 space-y-6">
            <AppTableCard
              title="รายการพัสดุที่ขอเบิก"
              subtitle={`หมวดหมู่ รายการ จำนวน และหมายเหตุ • ทั้งหมด ${issue.items.length} รายการ`}
              className="relative z-10 overflow-visible"
            >
              <div className="relative w-full overflow-x-auto overflow-y-visible">
                <table className="relative w-full min-w-[1400px] border-collapse bg-white text-sm">
                  <thead>
                    <tr>
                      {["ลำดับ", "หมวดหมู่", "รายการพัสดุ", "จำนวนที่ขอเบิก", "จำนวนที่เบิกจ่าย", "หน่วย", "หมายเหตุ"].map((heading) => (
                        <th key={heading} className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-4 text-center text-lg font-extrabold !text-white">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issue.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-black px-4 py-12 text-center font-bold !text-slate-500">ไม่พบรายการพัสดุ</td>
                      </tr>
                    ) : issue.items.map((item, index) => (
                      <tr key={item.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} transition-colors duration-200 hover:bg-blue-50/70`}>
                        <td className="whitespace-nowrap border border-black px-3 py-3 text-center font-extrabold !text-slate-800">{index + 1}</td>
                        <td className="min-w-[210px] border border-black px-3 py-3 align-top">
                          <div className="flex min-h-[52px] w-full items-center rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-base font-bold !text-slate-900 shadow-sm">
                            {categoryName[item.material.category] ?? item.material.category}
                          </div>
                        </td>
                        <td className="min-w-[330px] border border-black px-3 py-3 align-top">
                          <div className="flex min-h-[52px] w-full items-center rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-base font-bold !text-slate-900 shadow-sm">
                            {item.material.name}
                          </div>
                        </td>
                        <td className="min-w-[160px] border border-black px-3 py-3 align-top">
                          <div className="flex h-[46px] w-full items-center justify-center rounded-[12px] border border-slate-200 bg-white px-3 text-center font-bold tabular-nums !text-slate-900">
                            {Number(item.qty).toLocaleString("th-TH")}
                          </div>
                        </td>
                        <td className="min-w-[160px] border border-black px-3 py-3 align-top">
                          <input
                            type="number"
                            name={`issuedQty_${item.id}`}
                            min="0"
                            max={Number(item.qty)}
                            step="1"
                            placeholder="กรอกจำนวน"
                            required
                            className="h-[46px] w-full min-w-[120px] rounded-[12px] border-2 !border-black bg-white px-3 text-center text-base font-extrabold tabular-nums !text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:font-semibold placeholder:!text-slate-400 hover:bg-slate-50 focus:!border-emerald-600 focus:ring-4 focus:ring-emerald-100/70"
                          />
                        </td>
                        <td className="min-w-[120px] border border-black px-3 py-3 align-top">
                          <div className="flex h-[46px] w-full items-center justify-center rounded-[12px] border border-slate-200 bg-slate-100 px-2 text-center font-extrabold !text-slate-700">
                            {item.material.unit || "-"}
                          </div>
                        </td>
                        <td className="min-w-[240px] border border-black px-3 py-3 align-top">
                          <div className="flex min-h-[46px] w-full items-center rounded-[12px] border border-slate-200 bg-white px-3 font-bold !text-slate-900">
                            {item.remark?.trim() ? item.remark : "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AppTableCard>

            <AppCard className="p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-amber-50 text-lg ring-1 ring-amber-200">⚠️</div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-extrabold !text-slate-900 sm:text-lg">ตรวจสอบก่อนยืนยัน</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed !text-slate-600 sm:text-base">
                    กรุณาตรวจสอบจำนวนพัสดุที่สามารถเบิกจ่ายได้จริงก่อนยืนยันรายการ
                    ระบบจะใช้จำนวนเบิกจ่ายจริงในการตัดสต็อกและบันทึก Stock Card
                  </p>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-4 sm:p-5">
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold !text-slate-900">📦 จำนวนที่กำลังจะเบิกจ่าย</p>
                  <p className="mt-1 text-sm font-semibold !text-slate-500">กรุณากรอกจำนวนเบิกจ่ายจริงในแต่ละรายการ</p>
                </div>
                <AppInfoCard className="min-w-0">
                  <p className="text-center text-3xl font-black tabular-nums !text-slate-900">{totalRequested.toLocaleString("th-TH")}</p>
                  <p className="mt-1 text-center text-sm font-bold !text-slate-500">หน่วยที่ขอสูงสุด</p>
                </AppInfoCard>
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
                <AppButton href={`/issue/${issue.id}`} variant="secondary" size="md">ยกเลิก</AppButton>
                <AppButton type="submit" variant="success" size="md" icon={<span aria-hidden="true">✓</span>}>
                  ยืนยันการเบิกจ่ายและตัดสต็อก
                </AppButton>
              </div>
            </AppCard>
          </form>
        </div>
      </AppCard>
    </AppPage>
  );
}
