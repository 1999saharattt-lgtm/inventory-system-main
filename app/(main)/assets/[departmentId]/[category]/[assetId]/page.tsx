import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AssetCategory } from "@prisma/client";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
  }>;

  searchParams?: Promise<{
    from?: string | string[];
  }>;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER:
    "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const validCategories = [
  "DESK",
  "CHAIR",
  "AIR_CONDITIONER",
  "CABINET",
  "COMPUTER",
  "PRINTER",
  "TELEPHONE",
  "OTHER",
  "NO_SYSTEM",
] as const;

type AssetCategoryValue =
  (typeof validCategories)[number];

/* =========================================================
   STATUS
========================================================= */

const statusName: Record<
  string,
  string
> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL:
    "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

const statusClass: Record<
  string,
  string
> = {
  IN_USE:
    "border-emerald-200 bg-emerald-50 !text-emerald-700",

  DAMAGED:
    "border-orange-200 bg-orange-50 !text-orange-700",

  WAITING_DISPOSAL:
    "border-amber-200 bg-amber-50 !text-amber-700",

  DISPOSED:
    "border-slate-300 bg-slate-100 !text-slate-700",
};

/* =========================================================
   PAGE
========================================================= */

export default async function AssetDetailPage({
  params,
  searchParams,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId,
    category,
    assetId,
  } = await params;

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {};

  /* =======================================================
     FROM

     ถ้ามาจาก /assets/[departmentId]/all
     URL จะเป็น ?from=all
  ======================================================= */

  const rawFrom =
    resolvedSearchParams.from;

  const from =
    (
      Array.isArray(rawFrom)
        ? rawFrom[0]
        : rawFrom
    )
      ?.trim()
      .toLowerCase() ?? "";

  /* =======================================================
     PARAM VALIDATION
  ======================================================= */

  const departmentIdNumber =
    Number(departmentId);

  const assetIdNumber =
    Number(assetId);

  const normalizedCategory =
    decodeURIComponent(
      category
    )
      .trim()
      .toUpperCase();

  if (
    !Number.isInteger(
      departmentIdNumber
    ) ||
    departmentIdNumber <= 0 ||
    !Number.isInteger(
      assetIdNumber
    ) ||
    assetIdNumber <= 0 ||
    !validCategories.includes(
      normalizedCategory as AssetCategoryValue
    )
  ) {
    notFound();
  }

  const assetCategory =
    normalizedCategory as AssetCategory;

  /* =======================================================
     ASSET
  ======================================================= */

  const asset =
    await prisma.asset.findFirst({
      where: {
        id: assetIdNumber,

        departmentId:
          departmentIdNumber,

        category:
          assetCategory,
      },

      include: {
        department: true,
        section: true,
        officer: true,
      },
    });

  if (!asset) {
    notFound();
  }

  /* =======================================================
     NON-NULL VALUES

     เก็บค่าหลังตรวจสอบ asset แล้ว
     เพื่อให้ TypeScript ทราบว่า asset มีอยู่จริง
  ======================================================= */

  const assetDepartmentId =
    asset.departmentId;

  const assetCategorySlug =
    asset.category.toLowerCase();

  /* =======================================================
     OFFICER
  ======================================================= */

  const officerFullName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "ยังไม่ได้ระบุผู้ครอบครอง";

  const officerPosition =
    asset.officer?.position?.trim() ||
    "-";

  /* =======================================================
     ROUTES
  ======================================================= */

  const categoryPath =
    `/assets/${assetDepartmentId}/${assetCategorySlug}`;

  const allAssetsPath =
    `/assets/${assetDepartmentId}/all`;

  /*
   * สำคัญ:
   *
   * /assets/1/all
   *   ↓
   * /assets/1/chair/934?from=all
   *   ↓ กดกลับ
   * /assets/1/all
   *
   * แต่ถ้าเข้าจากหน้าหมวดตามปกติ
   *
   * /assets/1/chair
   *   ↓
   * /assets/1/chair/934
   *   ↓ กดกลับ
   * /assets/1/chair
   */

  const backPath =
    from === "all"
      ? allAssetsPath
      : categoryPath;

  /* =======================================================
     SHARED STYLE
  ======================================================= */

  const labelClassName = `
    mb-2
    block
    text-sm
    font-extrabold
    !text-slate-700
    sm:text-base
  `;

  const valueClassName = `
    min-h-[50px]
    w-full

    rounded-[14px]

    border
    border-slate-300

    bg-white

    px-4
    py-3

    text-base
    font-bold
    !text-slate-900

    shadow-sm
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* ===================================================
          HEADER
      =================================================== */}

      <AppPageHeader
        icon="📋"
        title="รายละเอียดครุภัณฑ์"
        subtitle={`${asset.name} — ทะเบียนคุมครุภัณฑ์`}
        actions={
          <AppButton
            href={backPath}
            variant="back"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* ===================================================
          ASSET INFORMATION
      =================================================== */}

      <AppCard>
        <div
          className="
            mb-6
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-extrabold
                !text-slate-900
              "
            >
              ข้อมูลครุภัณฑ์
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              รายละเอียดข้อมูลทะเบียนครุภัณฑ์
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              สถานะ
            </span>

            <span
              className={`
                inline-flex
                items-center
                justify-center

                rounded-full

                border

                px-3
                py-1.5

                text-sm
                font-extrabold

                ${
                  statusClass[
                    asset.status
                  ] ??
                  "border-slate-300 bg-slate-100 !text-slate-700"
                }
              `}
            >
              {statusName[
                asset.status
              ] ?? "ไม่ระบุสถานะ"}
            </span>
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-2
          "
        >
          {/* ===============================================
              NAME
          =============================================== */}

          <AppInfoCard
            className="
              lg:col-span-2
            "
          >
            <p
              className={
                labelClassName
              }
            >
              รายการครุภัณฑ์
            </p>

            <div
              className={
                valueClassName
              }
            >
              {asset.name}
            </div>
          </AppInfoCard>

          {/* ===============================================
              CATEGORY
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              ประเภท
            </p>

            <div
              className={
                valueClassName
              }
            >
              {categoryName[
                asset.category
              ] ?? asset.category}
            </div>
          </AppInfoCard>

          {/* ===============================================
              BRAND
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              ยี่ห้อ
            </p>

            <div
              className={
                valueClassName
              }
            >
              {asset.brand ??
                "-"}
            </div>
          </AppInfoCard>

          {/* ===============================================
              MODEL
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              รุ่น
            </p>

            <div
              className={
                valueClassName
              }
            >
              {asset.model ??
                "-"}
            </div>
          </AppInfoCard>

          {/* ===============================================
              SERIAL NUMBER
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              Serial Number
            </p>

            <div
              className={`
                ${valueClassName}
                break-all
              `}
            >
              {asset.serialNumber ??
                "-"}
            </div>
          </AppInfoCard>
        </div>
      </AppCard>

      {/* ===================================================
          ASSET NUMBER
      =================================================== */}

      <AppCard>
        <div className="mb-6">
          <h2
            className="
              text-lg
              font-extrabold
              !text-slate-900
            "
          >
            เลขทะเบียนครุภัณฑ์
          </h2>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              !text-slate-500
            "
          >
            ข้อมูลรหัสอ้างอิงของครุภัณฑ์
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-2
          "
        >
          {/* ===============================================
              GFMIS
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              รหัส GFMIS
            </p>

            <div
              className={`
                ${valueClassName}
                break-all
              `}
            >
              {asset.governmentAssetNo ??
                "-"}
            </div>
          </AppInfoCard>

          {/* ===============================================
              ASSET CODE
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              รหัสครุภัณฑ์
            </p>

            <div
              className={`
                ${valueClassName}
                break-all
              `}
            >
              {asset.officeAssetNo ??
                "-"}
            </div>
          </AppInfoCard>
        </div>
      </AppCard>

      {/* ===================================================
          RESPONSIBLE
      =================================================== */}

      <AppCard>
        <div className="mb-6">
          <h2
            className="
              text-lg
              font-extrabold
              !text-slate-900
            "
          >
            หน่วยงานและผู้รับผิดชอบ
          </h2>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              !text-slate-500
            "
          >
            ข้อมูลหน่วยงาน กลุ่มงาน และผู้ครอบครองครุภัณฑ์
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-2
          "
        >
          {/* ===============================================
              DEPARTMENT
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              หน่วยงาน
            </p>

            <div
              className={
                valueClassName
              }
            >
              {asset.department.name}
            </div>
          </AppInfoCard>

          {/* ===============================================
              SECTION
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              กลุ่มงาน
            </p>

            <div
              className={
                valueClassName
              }
            >
              {asset.section?.name ??
                "-"}
            </div>
          </AppInfoCard>

          {/* ===============================================
              OFFICER
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              ผู้ครอบครอง
            </p>

            <div
              className={
                valueClassName
              }
            >
              {officerFullName}
            </div>
          </AppInfoCard>

          {/* ===============================================
              POSITION
          =============================================== */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              ตำแหน่ง
            </p>

            <div
              className={
                valueClassName
              }
            >
              {officerPosition}
            </div>
          </AppInfoCard>

          {/* ===============================================
              REMARK
          =============================================== */}

          {asset.remark && (
            <AppInfoCard
              className="
                lg:col-span-2
              "
            >
              <p
                className={
                  labelClassName
                }
              >
                หมายเหตุ
              </p>

              <div
                className={`
                  ${valueClassName}
                  whitespace-pre-wrap
                  break-words
                `}
              >
                {asset.remark}
              </div>
            </AppInfoCard>
          )}
        </div>
      </AppCard>
    </AppPage>
  );
}