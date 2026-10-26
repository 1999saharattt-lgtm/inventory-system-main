import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";
import AssetCategorySearch from "./AssetCategorySearch";
import AssetHorizontalScroll from "./AssetHorizontalScroll";
export const dynamic = "force-dynamic";
/* =========================================================
   TYPES
========================================================= */
type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
  }>;
  searchParams?: Promise<{
    search?: string | string[];
    q?: string | string[];
    fiscalYear?: string | string[];
  }>;
};
/* =========================================================
   CATEGORY
========================================================= */
const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  TELEPHONE: "เครื่องโทรศัพท์",
  CABINET: "ตู้",
  SHELF: "ชั้น",
  COMPUTER: "เครื่องคอมพิวเตอร์",
  MONITOR: "จอภาพ",
  PRINTER: "เครื่องพิมพ์คอมพิวเตอร์",
  UPS: "เครื่องสำรองไฟฟ้า",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};
// ข้อความมาตรฐานที่แสดงอัตโนมัติเมื่อรายการยังไม่มีหมวด/ชนิดเฉพาะ
// หนึ่งข้อความต่อหนึ่งหมวด โดยไม่แก้ไขข้อมูลต้นฉบับในฐานข้อมูล
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

function getDisplayedCategoryDetail(asset: {
  category: string;
  categoryDetail: string | null;
  remark: string | null;
  name: string;
}, pageCategory: string) {
  const saved = asset.categoryDetail?.trim();
  if (saved) return saved;

  // รองรับรายการเก่าที่เคยบันทึกหมวด/ชนิดไว้ในบรรทัดแรกของหมายเหตุ
  const firstRemarkLine = (asset.remark ?? "").split("\n")[0]?.trim() ?? "";
  if (firstRemarkLine.startsWith("หมวด/ชนิด:")) {
    const previous = firstRemarkLine.slice("หมวด/ชนิด:".length).trim();
    if (previous) return previous;
  }

  if (pageCategory === "UPS") return defaultCategoryDetail.UPS;
  if (pageCategory === "SHELF") return defaultCategoryDetail.SHELF;
  if (pageCategory === "OTHER") {
    if (/เครื่องเล่นเทปคาสเซ็ท/i.test(asset.name)) return "เครื่องเล่นเทปคาสเซ็ท";
    if (/รถเข็น/i.test(asset.name)) return "รถเข็น";
    return "ทั่วไป";
  }
  return defaultCategoryDetail[asset.category] ?? categoryName[asset.category] ?? asset.category;
}

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "🪑",
  AIR_CONDITIONER: "❄️",
  TELEPHONE: "☎️",
  CABINET: "🗄️",
  SHELF: "🗃️",
  COMPUTER: "💻",
  MONITOR: "🖥️",
  PRINTER: "🖨️",
  UPS: "🔋",
  OTHER: "📦",
  NO_SYSTEM: "📋",
};
/* =========================================================
   CATEGORY UNIT
========================================================= */
const assetStatusName: Record<string, string> = {
  IN_USE: "ใช้งานอยู่",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

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
  UPS: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};
/* =========================================================
   STATUS
========================================================= */
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
  const sourceOrder = Number(
    match[1]
  );
  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }
  return sourceOrder;
}
/* =========================================================
   UNIT FROM REMARK
========================================================= */
function getUnitFromRemark(
  remark: string | null
) {
  if (!remark) {
    return "";
  }
  const patterns = [
    /(?:^|\|)\s*UNIT:([^|]+)/i,
    /(?:^|\|)\s*หน่วย:([^|]+)/i,
  ];
  for (const pattern of patterns) {
    const match =
      remark.match(pattern);
    if (match?.[1]) {
      const value =
        match[1].trim();
      if (
        value &&
        value !== "-"
      ) {
        return value;
      }
    }
  }
  return "";
}
/* =========================================================
   ASSET UNIT
========================================================= */
function getAssetUnit(
  unit: string | null,
  remark: string | null,
  fallbackUnit: string
) {
  const originalUnit =
    unit?.trim();
  if (
    originalUnit &&
    originalUnit !== "-"
  ) {
    return originalUnit;
  }
  const remarkUnit =
    getUnitFromRemark(
      remark
    );
  if (remarkUnit) {
    return remarkUnit;
  }
  return (
    fallbackUnit ||
    "รายการ"
  );
}
/* =========================================================
   RESPONSIBLE NAME
========================================================= */
function getResponsibleName(
  asset: {
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
  },
  departmentName: string
) {
  const cleanDepartmentName =
    departmentName?.trim() ||
    asset.department.name?.trim() ||
    "";
  const originalResponsibleName =
    asset.responsibleName?.trim();
  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    if (
      cleanDepartmentName &&
      (
        originalResponsibleName ===
          cleanDepartmentName ||
        originalResponsibleName.startsWith(
          `${cleanDepartmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }
    if (cleanDepartmentName) {
      return `${cleanDepartmentName} / ${originalResponsibleName}`;
    }
    return originalResponsibleName;
  }
  const sectionName =
    asset.section?.name?.trim();
  if (sectionName) {
    if (cleanDepartmentName) {
      return `${cleanDepartmentName} / ${sectionName}`;
    }
    return sectionName;
  }
  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";
  if (officerName) {
    if (cleanDepartmentName) {
      return `${cleanDepartmentName} / ${officerName}`;
    }
    return officerName;
  }
  if (cleanDepartmentName) {
    return cleanDepartmentName;
  }
  return "-";
}
/* =========================================================
   STATUS
========================================================= */
/* =========================================================
   PAGE
========================================================= */
export default async function AssetCategoryPage({
  params,
  searchParams,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */
  const resolvedParams =
    await params;
  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {};
  /* Keep the selected fiscal year across navigation.
     Asset records themselves are not filtered by fiscal year. */
  const rawFiscalYear = resolvedSearchParams.fiscalYear;
  const fiscalYearText = Array.isArray(rawFiscalYear)
    ? rawFiscalYear[0]
    : rawFiscalYear;
  const fiscalYearNumber = Number(fiscalYearText);
  // หากลิงก์หมวดไม่มีปีงบประมาณ ให้ใช้ปีที่เลือกจากหน้าก่อนหน้า
  // และเติม fiscalYear ลงใน URL โดยไม่เปลี่ยนข้อมูลครุภัณฑ์
  const validFiscalYear =
    typeof fiscalYearText === "string" &&
    /^\d{4}$/.test(fiscalYearText) &&
    Number.isInteger(fiscalYearNumber) &&
    fiscalYearNumber >= 2569 &&
    fiscalYearNumber <= 3000;
  if (!validFiscalYear) {
    const requestHeaders = await headers();
    const referer = requestHeaders.get("referer");
    let selectedYear: number | null = null;
    if (referer) {
      try {
        const previousUrl = new URL(referer);
        const previousYearText = previousUrl.searchParams.get("fiscalYear");
        const previousYear = Number(previousYearText);
        if (
          previousYearText &&
          /^\d{4}$/.test(previousYearText) &&
          Number.isInteger(previousYear) &&
          previousYear >= 2569 &&
          previousYear <= 3000
        ) {
          selectedYear = previousYear;
        }
      } catch {
        // ไม่มี URL อ้างอิงที่อ่านได้
      }
    }
    // เมื่อเปิด URL ตรงโดยไม่มีปีที่เลือก ให้ใช้ปีงบประมาณปัจจุบัน
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const currentFiscalYear = thaiYear + (now.getMonth() >= 9 ? 1 : 0);
    const year = selectedYear ?? currentFiscalYear;
    const searchValue = resolvedSearchParams.search ?? resolvedSearchParams.q;
    const queryText = Array.isArray(searchValue) ? searchValue[0] : searchValue;
    const query = new URLSearchParams({ fiscalYear: String(year) });
    if (queryText) query.set("search", queryText);
    redirect(`/assets/${resolvedParams.departmentId}/${resolvedParams.category}?${query.toString()}`);
  }
  const fiscalYearQuery =
    fiscalYearText &&
    /^\d{4}$/.test(fiscalYearText) &&
    Number.isInteger(fiscalYearNumber) &&
    fiscalYearNumber >= 2569 &&
    fiscalYearNumber <= 3000
      ? `fiscalYear=${fiscalYearNumber}`
      : "";
  const withFiscalYear = (path: string) =>
    fiscalYearQuery
      ? `${path}${path.includes("?") ? "&" : "?"}${fiscalYearQuery}`
      : path;
  const departmentId =
    Number(
      resolvedParams.departmentId
    );
  const assetCategory =
    decodeURIComponent(
      resolvedParams.category
    )
      .trim()
      .toUpperCase();
  /* =======================================================
     VALIDATION
  ======================================================= */
  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0
  ) {
    notFound();
  }
  if (
    !Object.prototype.hasOwnProperty.call(
      categoryName,
      assetCategory
    )
  ) {
    notFound();
  }
  /* =======================================================
     SEARCH
  ======================================================= */
  const rawSearch =
    resolvedSearchParams.search ??
    resolvedSearchParams.q ??
    "";
  const search =
    (
      Array.isArray(
        rawSearch
      )
        ? rawSearch[0]
        : rawSearch
    )?.trim() ?? "";
  /* =======================================================
     DEPARTMENT
  ======================================================= */
  const department =
    await prisma.department.findUnique({
      where: {
        id:
          departmentId,
      },
      select: {
        id:
          true,
        name:
          true,
      },
    });
  if (!department) {
    notFound();
  }
  /* =======================================================
     SAFE VALUES
  ======================================================= */
  const departmentIdForAction =
    department.id;
  const departmentNameForDisplay =
    department.name;
  const assetCategoryForAction =
    assetCategory;
  const categorySlug =
    assetCategory.toLowerCase();
  /* =======================================================
     ASSETS
  ======================================================= */
  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId:
          departmentIdForAction,
        ...(assetCategory === "UPS"
          ? { category: "OTHER" as any }
          : assetCategory === "COMPUTER"
            ? { category: { in: ["COMPUTER", "MONITOR"] as any } }
            : assetCategory === "OTHER"
              ? { category: "OTHER" as any }
              : assetCategory === "SHELF"
                ? { category: { in: ["SHELF", "OTHER"] as any } }
                : { category: assetCategory as any }),
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  governmentAssetNo: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  officeAssetNo: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  brand: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  model: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  responsibleName: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  unit: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  section: {
                    is: {
                      name: {
                        contains:
                          search,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },
                {
                  officer: {
                    is: {
                      firstName: {
                        contains:
                          search,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },
                {
                  officer: {
                    is: {
                      lastName: {
                        contains:
                          search,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        department:
          true,
        section:
          true,
        officer:
          true,
      },
    });
  /* =======================================================
     SORT
  ======================================================= */
  const belongsToPage = (asset: (typeof assetsFromDatabase)[number]) => {
    const detail = (asset.categoryDetail ?? "").trim();
    const label = detail || asset.name;
    const isUps = /เครื่องสำรองไฟฟ้า|\bUPS\b/i.test(label);
    const isShelf = detail === "ชั้น";
    if (assetCategory === "UPS") return asset.category === "OTHER" && isUps;
    if (assetCategory === "SHELF") return asset.category === "SHELF" || (asset.category === "OTHER" && isShelf);
    if (assetCategory === "OTHER") return !isUps && !isShelf;
    return true;
  };
  const assets = [
    ...assetsFromDatabase.filter(belongsToPage),
  ].sort((a, b) => {
    const orderA =
      getSourceOrder(
        a.remark
      );
    const orderB =
      getSourceOrder(
        b.remark
      );
    if (
      orderA !== null &&
      orderB !== null
    ) {
      return (
        orderA -
        orderB
      );
    }
    if (orderA !== null) {
      return -1;
    }
    if (orderB !== null) {
      return 1;
    }
    return (
      a.id -
      b.id
    );
  });
  /* =======================================================
     PERMISSION
  ======================================================= */
  const canManage =
    true;
  /* =======================================================
     DELETE ASSET
  ======================================================= */
  async function deleteAsset(
    formData: FormData
  ) {
    "use server";
    const assetId =
      Number(
        formData.get(
          "assetId"
        )
      );
    if (
      !Number.isInteger(
        assetId
      ) ||
      assetId <= 0
    ) {
      return;
    }
    const assetToDelete =
      await prisma.asset.findFirst({
        where: {
          id:
            assetId,
          departmentId:
            departmentIdForAction,
          ...(assetCategoryForAction === "UPS" || assetCategoryForAction === "SHELF" || assetCategoryForAction === "OTHER" || assetCategoryForAction === "COMPUTER"
            ? {}
            : { category: assetCategoryForAction as any }),
        },
        select: {
          id:
            true,
        },
      });
    if (!assetToDelete) {
      return;
    }
    // Guard virtual-category deletion using the same classification as the displayed rows.
    const visibleAsset = assets.find((asset) => asset.id === assetToDelete.id);
    if (!visibleAsset) return;
    await prisma.asset.delete({
      where: {
        id:
          assetToDelete.id,
      },
    });
    revalidatePath(
      `/assets/${departmentIdForAction}`
    );
    revalidatePath(
      `/assets/${departmentIdForAction}/${categorySlug}`
    );
    revalidatePath(
      `/assets/${departmentIdForAction}/all`
    );
  }
  /* =========================================================
     UI
  ========================================================= */
  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ AppPageHeader ตัวกลาง
          รูปแบบเดียวกับหน้าอื่นในระบบ
      ===================================================== */}
      <AppPageHeader
        icon={
          categoryIcon[
            assetCategory
          ]
        }
        title={
          categoryName[
            assetCategory
          ]
        }
        subtitle={`${departmentNameForDisplay} — ทะเบียนคุมครุภัณฑ์`}
        actions={
          <>
            {/* ===============================================
                ADD
                สีเขียวตัวกลาง
            =============================================== */}
            {canManage && assetCategory !== "UPS" && (
              <AppButton
                href={withFiscalYear(`/assets/${departmentIdForAction}/${categorySlug}/new`)}
                variant="primary"
                size="md"
                icon={
                  <span
                    aria-hidden="true"
                  >
                    ＋
                  </span>
                }
              >
                เพิ่มรายการ
              </AppButton>
            )}
            {/* ===============================================
                BACK
                สีเขียวตัวกลาง
            =============================================== */}
            <AppButton
              href={withFiscalYear(`/assets/${departmentIdForAction}`)}
              variant="back"
              size="md"
            >
              กลับ
            </AppButton>
          </>
        }
      />
      {/* =====================================================
          SEARCH
          ใช้ตัวกลาง AssetCategorySearch
          ซึ่งใช้ AppSearchInput
          ลักษณะเหมือนภาพตัวอย่าง:
          Input | ปุ่มค้นหา | จำนวนรายการ
      ===================================================== */}
      <AssetCategorySearch
        initialValue={
          search
        }
        resultCount={
          assets.length
        }
        pathname={withFiscalYear(`/assets/${departmentIdForAction}/${categorySlug}`)}
      />
      {/* =====================================================
          TABLE
          ใช้ AppTableCard ตัวกลาง
          badge จำนวนรายการด้านขวา
      ===================================================== */}
      <AppTableCard
        title={`รายการ${categoryName[assetCategory]}`}
        subtitle={`${departmentNameForDisplay} • ทะเบียนคุมครุภัณฑ์`}
        badge={`${assets.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
          max-w-full
        "
      >
        {/* ตารางทุกหมวด: เลื่อนแนวนอนด้านบนและด้านล่างพร้อมกัน */}
        <AssetHorizontalScroll>
          <table className="w-max min-w-full table-auto border-collapse bg-white text-sm [&_th]:!whitespace-nowrap [&_th]:!break-normal [&_td]:!whitespace-nowrap [&_td]:!break-normal [&_td]:!overflow-visible">
            {/* =================================================
                HEADER
            ================================================= */}
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รหัส GFMIS",
                  "รหัสครุภัณฑ์",
                  "สถานที่ใช้งาน",
                  "ผู้รับผิดชอบ",
                  "หมวด/ชนิด",
                  "ชื่อเรียก/คุณลักษณะครุภัณฑ์",
                  "ยี่ห้อ/รุ่น",
                  "ยอดคงเหลือ",
                  "หน่วยนับ",
                  "สถานะ",
                  "จัดการ",
                ].map(
                  (
                    tableTitle
                  ) => (
                    <th
                      key={
                        tableTitle
                      }
                      className="
                        whitespace-normal
                        break-words
                        border
                        border-black
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-1
                        py-3
                        text-center
                        text-xs
                        font-extrabold
                        leading-snug
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
            {/* =================================================
                BODY
            ================================================= */}
            <tbody>
              {assets.length >
              0 ? (
                assets.map(
                  (
                    asset,
                    index
                  ) => {
                    const unit =
                      getAssetUnit(
                        asset.unit,
                        asset.remark,
                        categoryUnit[
                          assetCategory
                        ]
                      );
                    const responsible = asset.section?.name?.trim() || departmentNameForDisplay;
                    const editHref =
                      withFiscalYear(`/assets/${departmentIdForAction}/${asset.category.toLowerCase()}/${asset.id}/edit`);
                    return (
                      <tr
                        key={
                          asset.id
                        }
                        className={`
                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }
                          transition-colors
                          duration-200
                          hover:bg-emerald-50/60
                        `}
                      >
                        {/* ===================================
                            ORDER
                        =================================== */}
                        <td
                          className="
                            overflow-hidden
                            whitespace-nowrap
                            border
                            border-black
                            px-1
                            py-2.5
                            text-center
                            font-semibold
                            tabular-nums
                            !text-slate-700
                          "
                        >
                          {(
                            index +
                            1
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>
                        {/* ===================================
                            GFMIS
                        =================================== */}
                        <td
                          title={
                            asset.governmentAssetNo ||
                            "-"
                          }
                          className="
                            overflow-hidden
                            break-all
                            whitespace-normal
                            border
                            border-black
                            px-1
                            py-2.5
                            text-center
                            font-semibold
                            !text-slate-700
                          "
                        >
                          {asset.governmentAssetNo ||
                            "-"}
                        </td>
                        {/* ===================================
                            ASSET CODE
                        =================================== */}
                        <td
                          title={
                            asset.officeAssetNo ||
                            "-"
                          }
                          className="
                            overflow-hidden
                            break-all
                            whitespace-normal
                            border
                            border-black
                            px-1
                            py-2.5
                            text-center
                            font-semibold
                            !text-slate-700
                          "
                        >
                          {asset.officeAssetNo ||
                            "-"}
                        </td>
                                                {/* สถานที่ใช้งาน: ใช้ข้อมูลผู้รับผิดชอบเดิมจากทะเบียน */}
                        <td title={responsible} className="border border-black px-3 py-2.5 text-center font-semibold !text-slate-700 break-words">
                          {responsible}
                        </td>

                        {/* ผู้รับผิดชอบ: ชื่อบุคคลในระบบ */}
                        <td className="border border-black px-3 py-2.5 text-center font-semibold !text-slate-700 break-words">
                          {asset.officer
                            ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim() || "-"
                            : asset.responsibleName?.trim() || "-"}
                        </td>

                        {/* หมวด/ชนิด: ประเภทครุภัณฑ์ในทะเบียน */}
                        <td className="border border-black px-2 py-2.5 text-center font-semibold !text-slate-700 break-words">
                          {getDisplayedCategoryDetail(asset, assetCategory)}
                        </td>

                        {/* ชื่อเรียก/คุณลักษณะครุภัณฑ์ */}
                        <td title={asset.name} className="border border-black px-3 py-2.5 font-semibold !text-slate-700 break-words">
                          {asset.name || "-"}
                        </td>

                        {/* ยี่ห้อ/รุ่น */}
                        <td className="border border-black px-2 py-2.5 text-center font-semibold !text-slate-700 break-words">
                          {[asset.brand, asset.model].filter(Boolean).join(" / ") || "-"}
                        </td>

                        {/* ยอดคงเหลือ: ข้อมูลจาก Asset.quantity */}
                        <td className="border border-black px-2 py-2.5 text-center font-semibold tabular-nums !text-slate-700">
                          {asset.quantity.toLocaleString("th-TH")}
                        </td>

                        {/* หน่วยนับ */}
                        <td className="border border-black px-2 py-2.5 text-center font-semibold !text-slate-700">
                          {unit}
                        </td>

                        {/* สถานะ: ข้อมูลจาก Asset.status */}
                        <td className="border border-black px-2 py-2.5 text-center font-semibold !text-slate-700 break-words">
                          {assetStatusName[asset.status] ?? asset.status}
                        </td>

{/* ===================================
                            ACTIONS
                            แบบเดียวกับภาพ:
                            แก้ไข = เขียว
                            ลบ = แดง
                            ใช้ AppButton ตัวกลางทั้งคู่
                            ไม่กำหนด h / px เอง
                        =================================== */}
                        <td
                          className="
                            overflow-hidden
                            whitespace-nowrap
                            border
                            border-black
                            px-1
                            py-2.5
                            text-center
                          "
                        >
                          {canManage ? (
                            <div
                              className="
                                flex
                                w-full
                                min-w-0
                                items-center
                                flex-col
                                justify-center
                                gap-1
                              "
                            >
                              {/* =============================
                                  EDIT
                              ============================= */}
                              <AppButton
                                href={
                                  editHref
                                }
                                variant="primary"
                                size="sm"
                                icon={
                                  <span
                                    aria-hidden="true"
                                  >
                                    ✏️
                                  </span>
                                }
                              >
                                แก้ไข
                              </AppButton>
                              {/* =============================
                                  DELETE
                              ============================= */}
                              <form
                                action={
                                  deleteAsset
                                }
                                className="
                                  m-0
                                  p-0
                                "
                              >
                                <input
                                  type="hidden"
                                  name="assetId"
                                  value={
                                    asset.id
                                  }
                                />
                                <AppButton
                                  type="submit"
                                  variant="danger"
                                  size="sm"
                                  icon={
                                    <span
                                      aria-hidden="true"
                                    >
                                      🗑️
                                    </span>
                                  }
                                >
                                  ลบ
                                </AppButton>
                              </form>
                            </div>
                          ) : (
                            <span
                              className="
                                font-semibold
                                !text-slate-400
                              "
                            >
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* ===========================================
                    EMPTY STATE
                =========================================== */
                <tr>
                  <td
                    colSpan={
                      12
                    }
                    className="
                      border
                      border-black
                      bg-white
                      px-6
                      py-16
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
                          grid
                          h-16
                          w-16
                          place-items-center
                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        {search
                          ? "🔍"
                          : categoryIcon[
                              assetCategory
                            ]}
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
                        {search
                          ? "ไม่พบข้อมูลที่ค้นหา"
                          : `ยังไม่มี${categoryName[assetCategory]}ในหน่วยงานนี้`}
                      </p>
                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          leading-relaxed
                          !text-slate-500
                        "
                      >
                        {search
                          ? `ไม่พบข้อมูลที่ตรงกับ "${search}"`
                          : "เมื่อมีการเพิ่มครุภัณฑ์ ข้อมูลจะแสดงในตารางนี้"}
                      </p>
                      {search && (
                        <div className="mt-5">
                          <AppButton
                            href={withFiscalYear(`/assets/${departmentIdForAction}/${categorySlug}`)}
                            variant="primary"
                            size="md"
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AssetHorizontalScroll>
      </AppTableCard>
    </AppPage>
  );
}