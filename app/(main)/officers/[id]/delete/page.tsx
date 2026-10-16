import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DeleteOfficerPage({ params, searchParams }: Props) {
  const user = await requireLogin();
  const { id } = await params;
  const { error } = await searchParams;
  const officerId = Number(id);
  if (!Number.isSafeInteger(officerId) || officerId <= 0) notFound();

  const officer = await prisma.officer.findUnique({
    where: { id: officerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      departmentId: true,
      section: { select: { departmentId: true } },
      _count: { select: { issues: true, assets: true } },
    },
  });
  if (!officer) notFound();

  const departmentId = officer.departmentId ?? officer.section?.departmentId;
  const backHref = departmentId ? `/departments/${departmentId}` : "/departments";
  const canDelete = user.role === "ADMIN";
  const hasIssues = officer._count.issues > 0;

  async function deleteOfficer() {
    "use server";
    const currentUser = await requireLogin();
    if (currentUser.role !== "ADMIN") {
      throw new Error("ไม่มีสิทธิ์ลบรายชื่อเจ้าหน้าที่");
    }

    // ตรวจซ้ำใน Server Action เพื่อป้องกันการลบจากข้อมูลหน้าจอที่เก่าแล้ว
    const current = await prisma.officer.findUnique({
      where: { id: officerId },
      select: {
        id: true,
        departmentId: true,
        section: { select: { departmentId: true } },
        _count: { select: { issues: true } },
      },
    });
    if (!current) redirect(backHref);
    if (current._count.issues > 0) {
      redirect(`/officers/${officerId}/delete?error=has-issues`);
    }

    // Asset.officerId มี onDelete: SetNull อยู่แล้ว จึงไม่ลบรายการครุภัณฑ์
    // หากมีใบเบิกเกิดขึ้นระหว่างตรวจสอบ DB จะปฏิเสธการลบ (ไม่ลบใบเบิก)
    try {
      await prisma.officer.delete({ where: { id: officerId } });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2003") {
        redirect(`/officers/${officerId}/delete?error=has-issues`);
      }
      if (code === "P2025") redirect(backHref);
      throw err;
    }
    redirect(backHref);
  }

  return (
    <AppPage>
      <AppPageHeader
        icon="🗑️"
        title="ลบรายชื่อเจ้าหน้าที่"
        subtitle="ตรวจสอบข้อมูลก่อนยืนยันการลบ"
        actions={<AppButton href={backHref} variant="back" size="md">กลับ</AppButton>}
      />
      <AppCard className="w-full max-w-2xl">
        <h2 className="text-xl font-extrabold !text-slate-900">ยืนยันการลบรายชื่อ</h2>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-lg font-extrabold !text-slate-900">
            {officer.firstName} {officer.lastName}
          </p>
          <p className="mt-1 font-semibold !text-slate-600">{officer.position || "ไม่ระบุตำแหน่ง"}</p>
        </div>

        {!canDelete ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 font-semibold !text-amber-900">
            บัญชีนี้ไม่มีสิทธิ์ลบเจ้าหน้าที่ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        ) : hasIssues || error === "has-issues" ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 font-semibold !text-amber-900">
            ไม่สามารถลบเจ้าหน้าที่รายนี้ได้ เนื่องจากมีประวัติใบเบิกพัสดุอ้างอิงอยู่
            ({officer._count.issues.toLocaleString("th-TH")} รายการ) เพื่อรักษาประวัติการเบิกพัสดุ
          </p>
        ) : (
          <>
            <p className="mt-5 font-semibold !text-slate-700">
              การลบนี้ไม่สามารถย้อนกลับได้ และครุภัณฑ์ที่อ้างอิงเจ้าหน้าที่รายนี้
              ({officer._count.assets.toLocaleString("th-TH")} รายการ)
              จะยังคงอยู่ในระบบ แต่ช่องผู้รับผิดชอบที่เชื่อมโยงกับเจ้าหน้าที่จะถูกยกเลิกการเชื่อมโยง
            </p>
            <form action={deleteOfficer} className="mt-5 space-y-5">
              <label className="flex items-start gap-3 font-semibold !text-slate-800">
                <input type="checkbox" required className="mt-1 h-5 w-5 accent-red-600" />
                <span>ฉันตรวจสอบข้อมูลแล้ว และยืนยันว่าต้องการลบรายชื่อเจ้าหน้าที่นี้</span>
              </label>
              <div className="flex flex-wrap justify-end gap-3">
                <AppButton href={backHref} variant="secondary" size="md">ยกเลิก</AppButton>
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
                >
                  🗑️ ยืนยันลบ
                </button>
              </div>
            </form>
          </>
        )}
        {(hasIssues || !canDelete) && (
          <div className="mt-5 flex justify-end">
            <AppButton href={backHref} variant="secondary" size="md">กลับไปหน้าหน่วยงาน</AppButton>
          </div>
        )}
      </AppCard>
    </AppPage>
  );
}
