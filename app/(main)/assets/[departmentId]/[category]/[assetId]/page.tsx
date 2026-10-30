import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ departmentId: string; category: string; assetId: string }>;
  searchParams?: Promise<{ from?: string | string[]; fiscalYear?: string | string[] }>;
};

const categoryNames: Record<string, string> = {
  DESK: "โต๊ะ", CHAIR: "เก้าอี้", AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้", SHELF: "ชั้น", COMPUTER: "คอมพิวเตอร์", MONITOR: "จอภาพ",
  PRINTER: "เครื่องพิมพ์", TELEPHONE: "เครื่องโทรศัพท์", UPS: "เครื่องสำรองไฟฟ้า",
  OTHER: "ทั่วไป", NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const statusNames: Record<string, string> = {
  IN_USE: "ใช้งานปกติ", ACTIVE: "ใช้งานปกติ", DAMAGED: "ชำรุด",
  DETERIORATED: "เสื่อมสภาพ", UNNECESSARY: "ไม่จำเป็นต้องใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย", DISPOSED: "จำหน่ายแล้ว",
  INACTIVE: "ไม่ใช้งาน", LOST: "สูญหาย",
};

const defaultCategoryDetail: Record<string, string> = {
  CHAIR: "เก้าอี้, เก้าอี้สำนักงานพนักพิงสูง, เก้าอี้สำหรับห้องประชุม",
  AIR_CONDITIONER: "เครื่องปรับอากาศแบบติดผนัง, เครื่องปรับอากาศแบบแขวนฝ้าเพดาน",
  TELEPHONE: "เครื่องโทรศัพท์ ชนิด IP PHONE ไร้สาย",
  SHELF: "ชั้น",
  CABINET: "ตู้, ตู้ใส่เอกสาร 2 บานเปิด, ตู้เก็บเอกสารบานสไลด์, ตู้เอกสาร",
  DESK: "โต๊ะ, โต๊ะทำงาน, โต๊ะสำหรับวางคอมพิวเตอร์, โต๊ะวางของอเนกประสงค์",
  COMPUTER: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
  MONITOR: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
  PRINTER: "เครื่องพิมพ์คอมพิวเตอร์, เครื่องพิมพ์เลเซอร์ขาวดำ ชนิด Network แบบที่ 1, เครื่องพิมพ์เลเซอร์ LED สี ชนิด Network แบบที่ 2",
  UPS: "เครื่องสำรองไฟฟ้า, เครื่องสำรองไฟฟ้า ชนิด True Online UPS",
};

const labelClass = "mb-2 block text-sm font-extrabold !text-slate-700 sm:text-base";
const valueClass = "flex min-h-[50px] w-full items-center rounded-[14px] border border-slate-300 bg-slate-100 px-4 py-3 text-base font-bold !text-slate-900 shadow-sm whitespace-pre-wrap break-words";

function ReadonlyField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <AppInfoCard>
      <p className={labelClass}>{label}</p>
      <div className={valueClass} aria-label={label}>{value === null || value === undefined || value === "" ? "-" : value}</div>
    </AppInfoCard>
  );
}

export default async function AssetDetailPage({ params, searchParams }: Props) {
  const { departmentId, category, assetId } = await params;
  const query = searchParams ? await searchParams : {};
  const from = (Array.isArray(query.from) ? query.from[0] : query.from)?.trim().toLowerCase() ?? "";
  const rawFiscalYear = Array.isArray(query.fiscalYear) ? query.fiscalYear[0] : query.fiscalYear;
  const fiscalYear = rawFiscalYear && /^\d{4}$/.test(rawFiscalYear) && Number(rawFiscalYear) >= 2400 && Number(rawFiscalYear) <= 3000 ? rawFiscalYear : "";
  const fiscalYearQuery = fiscalYear ? `?fiscalYear=${encodeURIComponent(fiscalYear)}` : "";
  const departmentIdNumber = Number(departmentId);
  const assetIdNumber = Number(assetId);
  const pageCategory = decodeURIComponent(category).trim().toUpperCase();
  if (!Number.isInteger(departmentIdNumber) || departmentIdNumber <= 0 || !Number.isInteger(assetIdNumber) || assetIdNumber <= 0 || !Object.prototype.hasOwnProperty.call(categoryNames, pageCategory)) notFound();

  // ใช้รหัสรายการและหน่วยงานตรวจสอบ เพื่อรองรับหมวดเสมือน เช่น UPS ที่เก็บใน OTHER
  const [asset, ownerHistory] = await Promise.all([
    prisma.asset.findFirst({
    where: { id: assetIdNumber, departmentId: departmentIdNumber },
    include: { department: true, section: true, officer: true },
  }),
    prisma.assetOwnerHistory.findMany({
      where: { assetId: assetIdNumber }, orderBy: { changedAt: "desc" }, take: 50,
    }),
  ]);
  if (!asset) notFound();
  if (asset.category !== pageCategory && !(
    (pageCategory === "UPS" || pageCategory === "SHELF") && asset.category === "OTHER"
  ) && !(pageCategory === "COMPUTER" && asset.category === "MONITOR")) notFound();

  const categoryPath = `/assets/${departmentIdNumber}/${pageCategory.toLowerCase()}`;
  const backPath = (from === "all" ? `/assets/${departmentIdNumber}/all` : categoryPath) + fiscalYearQuery;
  const remarkLines = (asset.remark ?? "").split("\n");
  const firstRemarkLine = remarkLines[0]?.trim() ?? "";
  const legacyCategoryType = firstRemarkLine.startsWith("หมวด/ชนิด:") ? firstRemarkLine.slice("หมวด/ชนิด:".length).trim() : "";
  const cleanRemark = firstRemarkLine.startsWith("หมวด/ชนิด:") ? remarkLines.slice(1).join("\n") : asset.remark ?? "";
  const categoryType = asset.categoryDetail?.trim() || legacyCategoryType || (
    pageCategory === "OTHER"
      ? /เครื่องสำรองไฟฟ้า|\bUPS\b/i.test(asset.name) ? defaultCategoryDetail.UPS
        : /เครื่องเล่นเทปคาสเซ็ท/i.test(asset.name) ? "เครื่องเล่นเทปคาสเซ็ท"
        : /รถเข็น/i.test(asset.name) ? "รถเข็น" : "ทั่วไป"
      : defaultCategoryDetail[pageCategory] || categoryNames[pageCategory] || "ทั่วไป"
  );
  const officerName = asset.officer ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim() : asset.responsibleName?.trim() || "-";
  const brandAndModel = [asset.brand, asset.model].filter(Boolean).join(" / ");

  return (
    <AppPage>
      <AppPageHeader
        icon="📋"
        title="รายละเอียดครุภัณฑ์"
        subtitle={`${asset.name} — ${asset.department.name}`}
        actions={<AppButton href={backPath} variant="back" size="md" icon={<span aria-hidden="true">←</span>}>กลับ</AppButton>}
      />

      <AppCard className="relative w-full !overflow-visible">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold !text-slate-900">ข้อมูลครุภัณฑ์</h2>
          <p className="mt-1 text-sm font-semibold !text-slate-500">แสดงรายละเอียดข้อมูลครุภัณฑ์ (ไม่สามารถแก้ไขได้)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadonlyField label="ชื่อเรียก/คุณลักษณะครุภัณฑ์" value={asset.name} />
          <ReadonlyField label="สถานะการใช้งาน" value={statusNames[asset.status] ?? asset.status} />
          <ReadonlyField label="หมวด/ชนิด" value={categoryType} />
          <ReadonlyField label="ยี่ห้อ/รุ่น" value={brandAndModel} />
          <ReadonlyField label="จำนวน" value={asset.quantity.toLocaleString("th-TH")} />
          <ReadonlyField label="ราคาต่อหน่วย (บาท)" value={asset.price == null ? "-" : asset.price.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          <ReadonlyField label="หน่วย" value={asset.unit} />
        </div>

        <section className="mt-6 border-t border-slate-200 pt-5">
          <div className="mb-4">
            <h3 className="text-base font-extrabold !text-slate-900 sm:text-lg">เลขทะเบียนครุภัณฑ์</h3>
            <p className="mt-1 text-sm font-semibold !text-slate-500">ข้อมูลรหัสทะเบียนของครุภัณฑ์</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadonlyField label="รหัส GFMIS" value={asset.governmentAssetNo} />
            <ReadonlyField label="รหัสครุภัณฑ์" value={asset.officeAssetNo} />
          </div>
        </section>

        <section className="mt-6 border-t border-slate-200 pt-5">
          <div className="mb-4">
            <h3 className="text-base font-extrabold !text-slate-900 sm:text-lg">ผู้ครอบครอง</h3>
            <p className="mt-1 text-sm font-semibold !text-slate-500">ข้อมูลกลุ่มงานและผู้รับผิดชอบครุภัณฑ์</p>
          </div>
          <AppInfoCard className="!overflow-visible">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div><p className={labelClass}>หน่วยงาน</p><div className={valueClass}>{asset.department.name}</div></div>
              <div><p className={labelClass}>กลุ่มงาน</p><div className={valueClass}>{asset.section?.name || "-"}</div></div>
              <div><p className={labelClass}>ผู้ครอบครอง</p><div className={valueClass}>{officerName}</div></div>
              <div><p className={labelClass}>ตำแหน่ง</p><div className={valueClass}>{asset.officer?.position || "-"}</div></div>
            </div>
          </AppInfoCard>
          <div className="mt-5">
            <h4 className="mb-3 text-base font-extrabold !text-slate-900">ประวัติผู้ครอบครอง</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead className="bg-slate-800 text-white"><tr>
                  <th className="px-3 py-3 text-left">วันที่เปลี่ยน</th>
                  <th className="px-3 py-3 text-left">ผู้ครอบครองเดิม</th>
                  <th className="px-3 py-3 text-left">ผู้ครอบครองใหม่</th>
                </tr></thead>
                <tbody>
                  {ownerHistory.length ? ownerHistory.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-3 py-3">{item.changedAt.toLocaleString("th-TH")}</td>
                      <td className="px-3 py-3">{item.previousName || "-"}</td>
                      <td className="px-3 py-3">{item.nextName || "-"}</td>
                    </tr>
                  )) : <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500">ยังไม่มีประวัติการเปลี่ยนผู้ครอบครอง</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="mb-4 text-base font-extrabold !text-slate-900 sm:text-lg">หมายเหตุ</h3>
          <ReadonlyField label="หมายเหตุ" value={cleanRemark} />
        </section>

      </AppCard>
    </AppPage>
  );
}
