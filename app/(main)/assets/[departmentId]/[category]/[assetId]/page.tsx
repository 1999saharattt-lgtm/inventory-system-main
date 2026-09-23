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
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
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

   ใช้ข้อความภาษาไทยให้ตรงกับสถานะเดิมของระบบ
========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",

  DETERIORATED: "เสื่อมสภาพ",
  UNUSABLE: "ใช้งานไม่ได้",
  RETURNED: "ส่งคืน",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const statusClass: Record<string, string> = {
  IN_USE:
    "border-emerald-300 bg-emerald-100 !text-emerald-800",

  DAMAGED:
    "border-orange-300 bg-orange-100 !text-orange-800",

  WAITING_DISPOSAL:
    "border-amber-300 bg-amber-100 !text-amber-800",

  DISPOSED:
    "border-slate-400 bg-slate-200 !text-slate-700",

  DETERIORATED:
    "border-amber-300 bg-amber-100 !text-amber-800",

  UNUSABLE:
    "border-red-300 bg-red-100 !text-red-800",

  RETURNED:
    "border-blue-300 bg-blue-100 !text-blue-800",

  MISSING:
    "border-red-300 bg-red-100 !text-red-800",

  NOT_FOUND:
    "border-red-300 bg-red-100 !text-red-800",
};

/* =========================================================
   PAGE
========================================================= */

export default async function AssetDetailPage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId,
    category,
    assetId,
  } = await params;

  const departmentIdNumber =
    Number(departmentId);

  const assetIdNumber =
    Number(assetId);

  const normalizedCategory =
    category.toUpperCase();

  if (
    !Number.isInteger(departmentIdNumber) ||
    departmentIdNumber <= 0 ||
    !Number.isInteger(assetIdNumber) ||
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

     ไม่โหลด inspections แล้ว
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

  const assetBasePath =
    `/assets/${departmentIdNumber}/${asset.category.toLowerCase()}/${asset.id}`;

  const categoryPath =
    `/assets/${departmentIdNumber}/${asset.category.toLowerCase()}`;

  /* =======================================================
     STATUS DISPLAY
  ======================================================= */

  const thaiStatus =
    statusName[asset.status] ??
    "ไม่ระบุสถานะ";

  const thaiStatusClass =
    statusClass[asset.status] ??
    "border-slate-300 bg-slate-100 !text-slate-700";

  /* =======================================================
     SHARED UI
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
    flex
    min-h-[50px]
    w-full
    min-w-0
    items-center

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
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📋"
        title="รายละเอียดครุภัณฑ์"
        subtitle={`${asset.name} — ทะเบียนคุมครุภัณฑ์`}
        actions={
          <>
            {/* ===============================================
                EDIT
            =============================================== */}

            <AppButton
              href={`${assetBasePath}/edit`}
              variant="primary"
              size="md"
              icon={
                <span aria-hidden="true">
                  ✏️
                </span>
              }
            >
              แก้ไข
            </AppButton>

            {/* ===============================================
                BACK
            =============================================== */}

            <AppButton
              href={categoryPath}
              variant="back"
              size="md"
              icon={
                <span aria-hidden="true">
                  ←
                </span>
              }
            >
              กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <AppCard
        className="
          relative
          w-full
          min-w-0
          !overflow-visible
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            mb-6

            flex
            flex-col
            gap-4

            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div className="min-w-0">
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

          {/* ===============================================
              STATUS
          =============================================== */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            <span
              className="
                text-sm
                font-extrabold
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

                whitespace-nowrap

                rounded-full

                border

                px-4
                py-1.5

                text-sm
                font-extrabold

                ${thaiStatusClass}
              `}
            >
              {thaiStatus}
            </span>
          </div>
        </div>

        {/* =================================================
            INFORMATION GRID
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-4

            lg:grid-cols-2
          "
        >
          {/* =================================================
              ASSET NAME
          ================================================= */}

          <div className="lg:col-span-2">
            <AppInfoCard>
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
                <span
                  className="
                    min-w-0
                    break-words
                  "
                >
                  {asset.name}
                </span>
              </div>
            </AppInfoCard>
          </div>

          {/* =================================================
              CATEGORY
          ================================================= */}

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
              <span className="break-words">
                {categoryName[
                  asset.category
                ] ?? asset.category}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              BRAND
          ================================================= */}

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
              <span className="break-words">
                {asset.brand ?? "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              MODEL
          ================================================= */}

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
              <span className="break-words">
                {asset.model ?? "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              SERIAL NUMBER
          ================================================= */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              Serial Number
            </p>

            <div
              className={
                valueClassName
              }
            >
              <span className="break-all">
                {asset.serialNumber ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              GFMIS
          ================================================= */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              รหัส GFMIS
            </p>

            <div
              className={
                valueClassName
              }
            >
              <span className="break-all">
                {asset.governmentAssetNo ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              ASSET CODE
          ================================================= */}

          <AppInfoCard>
            <p
              className={
                labelClassName
              }
            >
              รหัสครุภัณฑ์
            </p>

            <div
              className={
                valueClassName
              }
            >
              <span className="break-all">
                {asset.officeAssetNo ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              DEPARTMENT
          ================================================= */}

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
              <span className="break-words">
                {asset.department.name}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              SECTION
          ================================================= */}

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
              <span className="break-words">
                {asset.section?.name ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* =================================================
              OFFICER
          ================================================= */}

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
              <span className="break-words">
                {officerFullName}
              </span>
            </div>

            <p
              className="
                mt-2

                text-xs
                font-semibold
                leading-relaxed
                !text-slate-500
              "
            >
              ผู้ครอบครองที่เลือกจากรายชื่อเจ้าหน้าที่ในระบบ
            </p>
          </AppInfoCard>

          {/* =================================================
              POSITION
          ================================================= */}

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
              <span className="break-words">
                {officerPosition}
              </span>
            </div>

            <p
              className="
                mt-2

                text-xs
                font-semibold
                leading-relaxed
                !text-slate-500
              "
            >
              ตำแหน่งตามผู้ครอบครองที่เลือก
            </p>
          </AppInfoCard>

          {/* =================================================
              REMARK
          ================================================= */}

          {asset.remark && (
            <div className="lg:col-span-2">
              <AppInfoCard>
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
                    items-start
                  `}
                >
                  <span
                    className="
                      min-w-0
                      break-words
                      whitespace-pre-wrap
                    "
                  >
                    {asset.remark}
                  </span>
                </div>
              </AppInfoCard>
            </div>
          )}
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="
            mt-6

            flex
            flex-col-reverse
            gap-3

            border-t
            border-slate-200

            pt-5

            sm:flex-row
            sm:justify-end
          "
        >
          <AppButton
            href={`${assetBasePath}/disposal`}
            variant="danger"
            size="md"
            icon={
              <span aria-hidden="true">
                📦
              </span>
            }
          >
            การจำหน่าย
          </AppButton>
        </div>
      </AppCard>
    </AppPage>
  );
}