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
   ASSET STATUS
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
    "bg-emerald-100 !text-emerald-800 border-emerald-300",

  DAMAGED:
    "bg-orange-100 !text-orange-800 border-orange-300",

  WAITING_DISPOSAL:
    "bg-amber-100 !text-amber-800 border-amber-300",

  DISPOSED:
    "bg-slate-200 !text-slate-700 border-slate-400",
};

/* =========================================================
   INSPECTION STATUS
========================================================= */

const inspectionStatusName: Record<
  string,
  string
> = {
  IN_USE: "ยังใช้งานอยู่",
  RETURNED: "ส่งคืน",
  DAMAGED: "ชำรุด",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const inspectionStatusClass: Record<
  string,
  string
> = {
  IN_USE:
    "bg-emerald-100 !text-emerald-800 border-emerald-300",

  RETURNED:
    "bg-blue-100 !text-blue-800 border-blue-300",

  DAMAGED:
    "bg-amber-100 !text-amber-800 border-amber-300",

  MISSING:
    "bg-red-100 !text-red-800 border-red-300",

  NOT_FOUND:
    "bg-red-100 !text-red-800 border-red-300",
};

/* =========================================================
   DATE
========================================================= */

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiDate(
  date: Date | string | null
) {
  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return `${parsedDate.getDate()} ${
    thaiMonths[
      parsedDate.getMonth()
    ]
  } ${
    parsedDate.getFullYear() +
    543
  }`;
}

/* =========================================================
   QUARTER
========================================================= */

function formatQuarter(
  quarter: string | null
) {
  if (!quarter) {
    return "-";
  }

  const quarterMap: Record<
    string,
    string
  > = {
    Q1: "ไตรมาสที่ 1",
    Q2: "ไตรมาสที่ 2",
    Q3: "ไตรมาสที่ 3",
    Q4: "ไตรมาสที่ 4",

    "1": "ไตรมาสที่ 1",
    "2": "ไตรมาสที่ 2",
    "3": "ไตรมาสที่ 3",
    "4": "ไตรมาสที่ 4",
  };

  return (
    quarterMap[quarter] ??
    quarter
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function AssetDetailPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  /* =======================================================
     PARAMS
  ======================================================= */

  const departmentIdNumber =
    Number(departmentId);

  const assetIdNumber =
    Number(assetId);

  const normalizedCategory =
    category.toUpperCase();

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

        inspections: {
          orderBy: {
            inspectionDate:
              "desc",
          },

          take: 4,
        },
      },
    });

  if (!asset) {
    notFound();
  }

  /* =======================================================
     LATEST INSPECTION
  ======================================================= */

  const latestInspection =
    asset.inspections[0] ??
    null;

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

                rounded-full

                border

                px-3
                py-1.5

                text-xs
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
              ] ?? asset.status}
            </span>
          </div>
        </div>

        {/* =================================================
            ASSET INFORMATION
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-4

            lg:grid-cols-2
          "
        >
          {/* NAME */}

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
                <span className="break-words">
                  {asset.name}
                </span>
              </div>
            </AppInfoCard>
          </div>

          {/* CATEGORY */}

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

          {/* BRAND */}

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
              {asset.brand ?? "-"}
            </div>
          </AppInfoCard>

          {/* MODEL */}

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
              {asset.model ?? "-"}
            </div>
          </AppInfoCard>

          {/* SERIAL */}

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

          {/* GFMIS */}

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

          {/* ASSET CODE */}

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

          {/* DEPARTMENT */}

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
                {
                  asset.department
                    .name
                }
              </span>
            </div>
          </AppInfoCard>

          {/* SECTION */}

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

          {/* OFFICER */}

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
                !text-slate-500
              "
            >
              ผู้ครอบครองที่เลือกจากรายชื่อเจ้าหน้าที่ในระบบ
            </p>
          </AppInfoCard>

          {/* POSITION */}

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
                !text-slate-500
              "
            >
              ตำแหน่งตามผู้ครอบครองที่เลือก
            </p>
          </AppInfoCard>

          {/* REMARK */}

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
            INSPECTION
        ================================================= */}

        <div
          className="
            mt-6

            border-t
            border-slate-200

            pt-6
          "
        >
          <div
            className="
              mb-5
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
                ผลการตรวจสอบล่าสุด
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ข้อมูลการตรวจสอบครุภัณฑ์ครั้งล่าสุด
              </p>
            </div>

            <AppButton
              href={`${assetBasePath}/inspection`}
              variant="secondary"
              size="md"
              icon={
                <span aria-hidden="true">
                  🔍
                </span>
              }
            >
              ดูประวัติการตรวจสอบ
            </AppButton>
          </div>

          {latestInspection ? (
            <div
              className="
                grid
                grid-cols-1
                gap-4

                md:grid-cols-2
                xl:grid-cols-4
              "
            >
              {/* ROUND */}

              <AppInfoCard>
                <p
                  className={
                    labelClassName
                  }
                >
                  รอบการตรวจสอบ
                </p>

                <div
                  className={
                    valueClassName
                  }
                >
                  ปี{" "}
                  {
                    latestInspection.year
                  }{" "}
                  /{" "}
                  {formatQuarter(
                    latestInspection.quarter
                  )}
                </div>
              </AppInfoCard>

              {/* DATE */}

              <AppInfoCard>
                <p
                  className={
                    labelClassName
                  }
                >
                  วันที่ตรวจสอบ
                </p>

                <div
                  className={
                    valueClassName
                  }
                >
                  {formatThaiDate(
                    latestInspection.inspectionDate
                  )}
                </div>
              </AppInfoCard>

              {/* RESULT */}

              <AppInfoCard>
                <p
                  className={
                    labelClassName
                  }
                >
                  ผลการตรวจสอบ
                </p>

                <div
                  className={`
                    ${valueClassName}
                    justify-center
                  `}
                >
                  <span
                    className={`
                      inline-flex
                      items-center
                      justify-center

                      rounded-full
                      border

                      px-3
                      py-1.5

                      text-xs
                      font-extrabold

                      ${
                        inspectionStatusClass[
                          latestInspection
                            .status
                        ] ??
                        "border-slate-300 bg-slate-100 !text-slate-700"
                      }
                    `}
                  >
                    {inspectionStatusName[
                      latestInspection
                        .status
                    ] ??
                      latestInspection.status}
                  </span>
                </div>
              </AppInfoCard>

              {/* INSPECTOR */}

              <AppInfoCard>
                <p
                  className={
                    labelClassName
                  }
                >
                  ผู้ตรวจครุภัณฑ์
                </p>

                <div
                  className={
                    valueClassName
                  }
                >
                  <span className="break-words">
                    {latestInspection.inspectorName ??
                      "-"}
                  </span>
                </div>
              </AppInfoCard>

              {/* CONDITION */}

              {latestInspection.condition && (
                <div
                  className="
                    md:col-span-2
                    xl:col-span-4
                  "
                >
                  <AppInfoCard>
                    <p
                      className={
                        labelClassName
                      }
                    >
                      สภาพครุภัณฑ์
                    </p>

                    <div
                      className={
                        valueClassName
                      }
                    >
                      <span className="break-words">
                        {
                          latestInspection.condition
                        }
                      </span>
                    </div>
                  </AppInfoCard>
                </div>
              )}

              {/* INSPECTION REMARK */}

              {latestInspection.remark && (
                <div
                  className="
                    md:col-span-2
                    xl:col-span-4
                  "
                >
                  <AppInfoCard>
                    <p
                      className={
                        labelClassName
                      }
                    >
                      หมายเหตุการตรวจ
                    </p>

                    <div
                      className={`
                        ${valueClassName}
                        items-start
                      `}
                    >
                      <span
                        className="
                          break-words
                          whitespace-pre-wrap
                        "
                      >
                        {
                          latestInspection.remark
                        }
                      </span>
                    </div>
                  </AppInfoCard>
                </div>
              )}
            </div>
          ) : (
            <AppInfoCard>
              <div
                className="
                  py-8
                  text-center
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ยังไม่มีประวัติการตรวจสอบครุภัณฑ์
              </div>
            </AppInfoCard>
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
            href={`${assetBasePath}/inspection/new`}
            variant="success"
            size="md"
            icon={
              <span aria-hidden="true">
                🔍
              </span>
            }
          >
            บันทึกผลการตรวจ
          </AppButton>

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