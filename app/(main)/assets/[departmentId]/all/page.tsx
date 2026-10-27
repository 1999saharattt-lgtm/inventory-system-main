import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

import ExportDepartmentAssetsPdf from "../ExportDepartmentAssetsPdf";
import AssetHorizontalScroll from "../[category]/AssetHorizontalScroll";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
  searchParams: Promise<{
    fiscalYear?: string | string[];
  }>;
};

/* =========================================================
   STATUS
========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  ACTIVE: "ยังใช้งาน",
  INACTIVE: "ไม่ใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
  LOST: "สูญหาย",
};

/* =========================================================
   CATEGORY UNIT
========================================================= */

const categoryUnit: Record<string, string> = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  CABINET: "ตู้",
  SHELF: "ตัว",
  COMPUTER: "เครื่อง",
  MONITOR: "เครื่อง",
  PRINTER: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

/* =========================================================
   SOURCE ORDER
========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_\d+:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder = Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   RESPONSIBLE NAME
========================================================= */

function getResponsibleName(asset: {
  responsibleName: string | null;

  department: {
    name: string;
  };

  section: {
    name: string;
  } | null;

  officer: {
    firstName: string;
    lastName: string;
  } | null;
}) {
  const departmentName =
    asset.department.name?.trim() || "";

  const originalResponsibleName =
    asset.responsibleName?.trim();

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    if (
      departmentName &&
      (
        originalResponsibleName === departmentName ||
        originalResponsibleName.startsWith(
          `${departmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    if (departmentName) {
      return `${departmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  const sectionName =
    asset.section?.name?.trim();

  if (sectionName) {
    if (departmentName) {
      return `${departmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    if (departmentName) {
      return `${departmentName} / ${officerName}`;
    }

    return officerName;
  }

  if (departmentName) {
    return departmentName;
  }

  return "-";
}

/* =========================================================
   ASSET UNIT
========================================================= */

function getAssetUnit(asset: {
  unit: string | null;
  category: string;
}) {
  const originalUnit =
    asset.unit?.trim();

  if (
    originalUnit &&
    originalUnit !== "-"
  ) {
    return originalUnit;
  }

  return (
    categoryUnit[asset.category] ??
    "รายการ"
  );
}

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
  status: string
) {
  switch (status) {
    case "IN_USE":
    case "ACTIVE":
      return `
        bg-emerald-100
        !text-emerald-800
      `;

    case "WAITING_DISPOSAL":
      return `
        bg-amber-100
        !text-amber-800
      `;

    case "DAMAGED":
      return `
        bg-red-100
        !text-red-800
      `;

    case "DISPOSED":
    case "INACTIVE":
      return `
        bg-slate-200
        !text-slate-800
      `;

    case "LOST":
      return `
        bg-rose-100
        !text-rose-800
      `;

    default:
      return `
        bg-slate-100
        !text-slate-700
      `;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function AllAssetsPage({
  params,
  searchParams,
}: Props) {
  const {
    departmentId,
  } = await params;

  const id =
    Number(departmentId);

  /* =======================================================
     PARAMS
  ======================================================= */

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    notFound();
  }

  /* =======================================================
     FISCAL YEAR
     คงปีงบประมาณที่เลือกจากหน้า /assets
     ไม่กรอง Asset เพราะเป็นทะเบียนครุภัณฑ์หลัก
  ======================================================= */

  const { fiscalYear: fiscalYearParam } = await searchParams;
  const rawFiscalYear = Array.isArray(fiscalYearParam)
    ? fiscalYearParam[0]
    : fiscalYearParam;

  const bangkokParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const currentYear = Number(
    bangkokParts.find((part) => part.type === "year")?.value
  );
  const currentMonth = Number(
    bangkokParts.find((part) => part.type === "month")?.value
  );
  const currentFiscalYear =
    currentYear + 543 + (currentMonth >= 10 ? 1 : 0);

  const parsedFiscalYear = Number(rawFiscalYear);
  const selectedFiscalYear =
    rawFiscalYear &&
    /^\d{4}$/.test(rawFiscalYear) &&
    Number.isInteger(parsedFiscalYear) &&
    parsedFiscalYear >= 2569 &&
    parsedFiscalYear <= 3000
      ? parsedFiscalYear
      : currentFiscalYear;

  const fiscalYearQuery = `fiscalYear=${selectedFiscalYear}`;

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!department) {
    notFound();
  }

  const departmentIdForPage =
    department.id;

  const departmentNameForPage =
    department.name;

  /* =======================================================
     ASSETS
  ======================================================= */

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId:
          departmentIdForPage,
      },

      include: {
        department: true,
        section: true,
        officer: true,
      },
    });

  /* =======================================================
     SORT
  ======================================================= */

  const assets = [
    ...assetsFromDatabase,
  ].sort((a, b) => {
    const orderA =
      getSourceOrder(a.remark);

    const orderB =
      getSourceOrder(b.remark);

    if (
      orderA !== null &&
      orderB !== null
    ) {
      return orderA - orderB;
    }

    if (orderA !== null) {
      return -1;
    }

    if (orderB !== null) {
      return 1;
    }

    return a.id - b.id;
  });

  // จัดกลุ่มตามหมวดที่ปรากฏในหน้ารายการจริง โดยไม่แก้ไขข้อมูลฐานข้อมูล
  const categoryOrder = ["DESK", "CHAIR", "CABINET", "SHELF", "COMPUTER", "PRINTER", "AIR_CONDITIONER", "TELEPHONE", "UPS", "OTHER", "NO_SYSTEM"];
  const categoryLabels: Record<string, string> = {
    DESK: "โต๊ะ", CHAIR: "เก้าอี้", CABINET: "ตู้", SHELF: "ชั้น",
    COMPUTER: "คอมพิวเตอร์", PRINTER: "เครื่องพิมพ์คอมพิวเตอร์",
    AIR_CONDITIONER: "เครื่องปรับอากาศ", TELEPHONE: "เครื่องโทรศัพท์",
    UPS: "เครื่องสำรองไฟฟ้า (UPS)", OTHER: "ทั่วไป", NO_SYSTEM: "ไม่มีอยู่ในระบบ",
  };
  const categoryDefault: Record<string, string> = {
    DESK: "โต๊ะ, โต๊ะทำงาน, โต๊ะสำหรับวางคอมพิวเตอร์, โต๊ะวางของอเนกประสงค์",
    CHAIR: "เก้าอี้, เก้าอี้สำนักงานพนักพิงสูง, เก้าอี้สำหรับห้องประชุม",
    CABINET: "ตู้, ตู้ใส่เอกสาร 2 บานเปิด, ตู้เก็บเอกสารบานสไลด์, ตู้เอกสาร",
    SHELF: "ชั้น", COMPUTER: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
    PRINTER: "เครื่องพิมพ์คอมพิวเตอร์, เครื่องพิมพ์เลเซอร์ขาวดำ ชนิด Network แบบที่ 1, เครื่องพิมพ์เลเซอร์ LED สี ชนิด Network แบบที่ 2",
    AIR_CONDITIONER: "เครื่องปรับอากาศแบบติดผนัง, เครื่องปรับอากาศแบบแขวนฝ้าเพดาน",
    TELEPHONE: "เครื่องโทรศัพท์ ชนิด IP PHONE ไร้สาย", UPS: "เครื่องสำรองไฟฟ้า, เครื่องสำรองไฟฟ้า ชนิด True Online UPS",
  };
  const displayedType = (asset: (typeof assets)[number], group: string) => {
    const saved = asset.categoryDetail?.trim();
    if (saved) return saved;
    const firstLine = (asset.remark ?? "").split("\n")[0]?.trim() ?? "";
    if (firstLine.startsWith("หมวด/ชนิด:")) {
      const legacy = firstLine.slice("หมวด/ชนิด:".length).trim();
      if (legacy) return legacy;
    }
    if (group === "OTHER") {
      if (/เครื่องเล่นเทปคาสเซ็ท/i.test(asset.name)) return "เครื่องเล่นเทปคาสเซ็ท";
      if (/รถเข็น/i.test(asset.name)) return "รถเข็น";
      return "ทั่วไป";
    }
    return categoryDefault[group] ?? categoryLabels[group] ?? group;
  };
  const getGroup = (asset: (typeof assets)[number]) => {
    if (asset.category === "OTHER") {
      const type = asset.categoryDetail?.trim() || asset.name;
      if (/เครื่องสำรองไฟฟ้า|\bUPS\b/i.test(type)) return "UPS";
      if (asset.categoryDetail?.trim() === "ชั้น") return "SHELF";
    }
    if (asset.category === "MONITOR") return "COMPUTER";
    return asset.category;
  };
  const groupedAssets = categoryOrder.map((key) => ({
    key, name: categoryLabels[key], items: assets.filter((asset) => getGroup(asset) === key),
  })).filter((group) => group.items.length > 0);
  const extraGroups = [...new Set(assets.map(getGroup))].filter((key) => !categoryOrder.includes(key));
  for (const key of extraGroups) groupedAssets.push({ key, name: categoryLabels[key] ?? key, items: assets.filter((asset) => getGroup(asset) === key) });

  return (
    <AppPage>
      <AppPageHeader
        icon="📋"
        title="ทะเบียนครุภัณฑ์ทั้งหมด"
        subtitle={departmentNameForPage}
        actions={<>
          <ExportDepartmentAssetsPdf departmentName={departmentNameForPage} assets={assets} />
          <AppButton href={`/assets/${departmentIdForPage}?${fiscalYearQuery}`} variant="back" size="md">กลับ</AppButton>
        </>}
      />
      <AppTableCard
        title="ทะเบียนครุภัณฑ์ทั้งหมด"
        subtitle={`${departmentNameForPage} • ทะเบียนคุมครุภัณฑ์`}
        badge={`${assets.length.toLocaleString("th-TH")} รายการ`}
        className="w-full min-w-0 max-w-full"
      >
        <AssetHorizontalScroll>
          <table className="w-max min-w-full table-auto border-collapse bg-white text-sm [&_th]:!whitespace-nowrap [&_th]:!break-normal [&_td]:!whitespace-nowrap [&_td]:!break-normal [&_td]:!overflow-visible">
            <thead>
              <tr>
                {[
                  "ลำดับ", "รหัส GFMIS", "รหัสครุภัณฑ์", "สถานที่ใช้งาน", "ผู้รับผิดชอบ",
                  "หมวด/ชนิด", "ชื่อเรียก/คุณลักษณะครุภัณฑ์", "ยี่ห้อ/รุ่น", "ยอดคงเหลือ",
                  "หน่วยนับ", "สถานะ", "จัดการ",
                ].map((heading) => (
                  <th key={heading} className="whitespace-normal break-words border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-1 py-3 text-center text-xs font-extrabold leading-snug !text-white">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.length ? groupedAssets.map((group) => (
                <Fragment key={group.key}>
                  <tr><td colSpan={12} className="border border-black bg-slate-200 px-4 py-3 text-left text-sm font-extrabold !text-slate-900">{group.name} ({group.items.length.toLocaleString("th-TH")} รายการ)</td></tr>
                  {group.items.map((asset, index) => {
                    const number = groupedAssets.slice(0, groupedAssets.findIndex((entry) => entry.key === group.key)).reduce((sum, entry) => sum + entry.items.length, 0) + index + 1;
                    const detailPath = `/assets/${asset.departmentId}/${asset.category.toLowerCase()}/${asset.id}?from=all&${fiscalYearQuery}`;
                    const editPath = `/assets/${asset.departmentId}/${asset.category.toLowerCase()}/${asset.id}/edit?${fiscalYearQuery}`;
                    const location = asset.section?.name?.trim() || departmentNameForPage;
                    const officer = asset.officer ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim() : asset.responsibleName?.trim() || "-";
                    const unit = getAssetUnit(asset);
                    const td = "border border-black px-2 py-2.5 text-center font-semibold !text-slate-700";
                    return (
                      <tr key={asset.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"} transition-colors duration-200 hover:bg-emerald-50/60`}>
                        <td className={td}>{number.toLocaleString("th-TH")}</td>
                        <td className={td}>{asset.governmentAssetNo || "-"}</td>
                        <td className={td}>{asset.officeAssetNo || "-"}</td>
                        <td className={td}>{location}</td>
                        <td className={td}>{officer}</td>
                        <td className={td}>{displayedType(asset, group.key)}</td>
                        <td className={`${td} text-left`} title={asset.name}>{asset.name || "-"}</td>
                        <td className={td}>{[asset.brand, asset.model].filter(Boolean).join(" / ") || "-"}</td>
                        <td className={td}>{asset.quantity.toLocaleString("th-TH")}</td>
                        <td className={td}>{unit}</td>
                        <td className={td}>{statusName[asset.status] ?? asset.status}</td>
                        <td className={td}><div className="flex flex-col items-center justify-center gap-1">
                          <AppButton href={editPath} variant="primary" size="sm">✏️ แก้ไข</AppButton>
                          <AppButton href={detailPath} variant="secondary" size="sm">เปิด</AppButton>
                        </div></td>
                      </tr>
                    );
                  })}
                </Fragment>
              )) : (
                <tr><td colSpan={12} className="border border-black px-6 py-16 text-center font-semibold text-slate-500">ยังไม่มีข้อมูลครุภัณฑ์ในหน่วยงานนี้</td></tr>
              )}
            </tbody>
          </table>
        </AssetHorizontalScroll>
      </AppTableCard>
    </AppPage>
  );
}
