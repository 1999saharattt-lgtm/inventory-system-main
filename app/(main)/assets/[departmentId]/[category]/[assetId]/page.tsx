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

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "💺",
  AIR_CONDITIONER: "❄️",
  CABINET: "🗄️",
  COMPUTER: "💻",
  PRINTER: "🖨️",
  TELEPHONE: "☎️",
  OTHER: "📦",
  NO_SYSTEM: "📋",
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

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

const statusClass: Record<string, string> = {
  IN_USE:
    "border-emerald-200 bg-emerald-100 !text-emerald-800",

  DAMAGED:
    "border-orange-200 bg-orange-100 !text-orange-800",

  WAITING_DISPOSAL:
    "border-amber-200 bg-amber-100 !text-amber-800",

  DISPOSED:
    "border-slate-300 bg-slate-200 !text-slate-700",
};

/* =========================================================
   INSPECTION STATUS
========================================================= */

const inspectionStatusName: Record<string, string> = {
  IN_USE: "ยังใช้งานอยู่",
  RETURNED: "ส่งคืน",
  DAMAGED: "ชำรุด",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const inspectionStatusClass: Record<string, string> = {
  IN_USE:
    "border-emerald-200 bg-emerald-100 !text-emerald-800",

  RETURNED:
    "border-blue-200 bg-blue-100 !text-blue-800",

  DAMAGED:
    "border-amber-200 bg-amber-100 !text-amber-800",

  MISSING:
    "border-red-200 bg-red-100 !text-red-800",

  NOT_FOUND:
    "border-red-200 bg-red-100 !text-red-800",
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

  const parsedDate = new Date(date);

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
   DETAIL FIELD
========================================================= */

function DetailField({
  label,
  value,
  helper,
  fullWidth = false,
}: {
  label: string;
  value:
    | string
    | number
    | null
    | undefined;
  helper?: string;
  fullWidth?: boolean;
}) {
  const displayValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "-"
      : String(value);

  return (
    <div
      className={`
        min-w-0

        ${
          fullWidth
            ? "sm:col-span-2"
            : ""
        }
      `}
    >
      <AppInfoCard className="h-full">
        <p
          className="
            text-sm
            font-extrabold
            !text-slate-600

            sm:text-base
          "
        >
          {label}
        </p>

        <p
          className="
            mt-2
            break-words
            text-base
            font-extrabold
            leading-relaxed
            !text-slate-900
          "
        >
          {displayValue}
        </p>

        {helper && (
          <p
            className="
              mt-2
              text-xs
              font-semibold
              leading-relaxed
              !text-slate-500
            "
          >
            {helper}
          </p>
        )}
      </AppInfoCard>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
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
      <div className="min-w-0">
        <h2
          className="
            flex
            items-center
            gap-2

            text-lg
            font-extrabold
            tracking-tight
            !text-slate-900

            sm:text-xl
          "
        >
          <span
            aria-hidden="true"
            className="shrink-0"
          >
            {icon}
          </span>

          <span className="min-w-0">
            {title}
          </span>
        </h2>
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
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
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon={
          categoryIcon[
            asset.category
          ] ?? "📋"
        }
        title="รายละเอียดครุภัณฑ์"
        subtitle={`${asset.name} — ${asset.department.name}`}
        actions={
          <>
            <AppButton
              href={`${assetBasePath}/edit`}
              variant="danger"
              size="md"
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

            <AppButton
              href={categoryPath}
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
          </>
        }
      />

      {/* =====================================================
          ASSET INFORMATION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <SectionHeader
          icon="📋"
          title="ข้อมูลครุภัณฑ์"
          action={
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

                  px-3
                  py-1.5

                  text-xs
                  font-extrabold

                  ${
                    statusClass[
                      asset.status
                    ] ??
                    "border-slate-200 bg-slate-100 !text-slate-700"
                  }
                `}
              >
                {statusName[
                  asset.status
                ] ??
                  asset.status}
              </span>
            </div>
          }
        />

        <div
          className="
            grid
            grid-cols-1
            gap-4

            sm:grid-cols-2
          "
        >
          <DetailField
            label="รายการครุภัณฑ์"
            value={asset.name}
            fullWidth
          />

          <DetailField
            label="ประเภท"
            value={
              categoryName[
                asset.category
              ] ??
              asset.category
            }
          />

          <DetailField
            label="ยี่ห้อ"
            value={asset.brand}
          />

          <DetailField
            label="รุ่น"
            value={asset.model}
          />

          <DetailField
            label="Serial Number"
            value={
              asset.serialNumber
            }
          />

          <DetailField
            label="จำนวน"
            value={
              asset.quantity ?? 1
            }
          />

          <DetailField
            label="หน่วย"
            value={asset.unit}
          />
        </div>
      </AppCard>

      {/* =====================================================
          ASSET REGISTRATION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <SectionHeader
          icon="🔖"
          title="เลขทะเบียนครุภัณฑ์"
        />

        <div
          className="
            grid
            grid-cols-1
            gap-4

            sm:grid-cols-2
          "
        >
          <DetailField
            label="รหัส GFMIS"
            value={
              asset.governmentAssetNo
            }
          />

          <DetailField
            label="รหัสครุภัณฑ์"
            value={
              asset.officeAssetNo
            }
          />
        </div>
      </AppCard>

      {/* =====================================================
          RESPONSIBLE
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <SectionHeader
          icon="👤"
          title="หน่วยงานและผู้รับผิดชอบ"
        />

        <div
          className="
            grid
            grid-cols-1
            gap-4

            sm:grid-cols-2
          "
        >
          <DetailField
            label="หน่วยงาน"
            value={
              asset.department.name
            }
          />

          <DetailField
            label="กลุ่มงาน"
            value={
              asset.section?.name ??
              "-"
            }
          />

          <DetailField
            label="ผู้ครอบครอง"
            value={officerFullName}
            helper="ผู้ครอบครองที่เลือกจากรายชื่อเจ้าหน้าที่ในระบบ"
          />

          <DetailField
            label="ตำแหน่ง"
            value={officerPosition}
            helper="ตำแหน่งตามผู้ครอบครองที่เลือก"
          />

          {asset.remark && (
            <DetailField
              label="หมายเหตุ"
              value={asset.remark}
              fullWidth
            />
          )}
        </div>
      </AppCard>

      {/* =====================================================
          LATEST INSPECTION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <SectionHeader
          icon="🔍"
          title="ผลการตรวจสอบล่าสุด"
          action={
            <AppButton
              href={`${assetBasePath}/inspection`}
              variant="secondary"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  📋
                </span>
              }
            >
              ดูประวัติการตรวจสอบ
            </AppButton>
          }
        />

        {latestInspection ? (
          <div
            className="
              grid
              grid-cols-1
              gap-4

              sm:grid-cols-2

              xl:grid-cols-4
            "
          >
            {/* =============================================
                ROUND
            ============================================= */}

            <DetailField
              label="รอบการตรวจสอบ"
              value={`ปี ${
                latestInspection.year
              } / ${formatQuarter(
                latestInspection.quarter
              )}`}
            />

            {/* =============================================
                DATE
            ============================================= */}

            <DetailField
              label="วันที่ตรวจสอบ"
              value={formatThaiDate(
                latestInspection.inspectionDate
              )}
            />

            {/* =============================================
                INSPECTION STATUS
            ============================================= */}

            <AppInfoCard>
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-600

                  sm:text-base
                "
              >
                ผลการตรวจสอบ
              </p>

              <div
                className="
                  mt-3
                  flex
                  min-h-[32px]
                  items-center
                "
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

                    text-sm
                    font-extrabold

                    ${
                      inspectionStatusClass[
                        latestInspection
                          .status
                      ] ??
                      "border-slate-200 bg-slate-100 !text-slate-700"
                    }
                  `}
                >
                  {inspectionStatusName[
                    latestInspection
                      .status
                  ] ??
                    latestInspection
                      .status}
                </span>
              </div>
            </AppInfoCard>

            {/* =============================================
                INSPECTOR
            ============================================= */}

            <DetailField
              label="ผู้ตรวจครุภัณฑ์"
              value={
                latestInspection.inspectorName ??
                "-"
              }
            />

            {/* =============================================
                CONDITION
            ============================================= */}

            {latestInspection.condition && (
              <div
                className="
                  min-w-0

                  sm:col-span-2
                  xl:col-span-4
                "
              >
                <AppInfoCard>
                  <p
                    className="
                      text-sm
                      font-extrabold
                      !text-slate-600

                      sm:text-base
                    "
                  >
                    สภาพครุภัณฑ์
                  </p>

                  <p
                    className="
                      mt-2
                      break-words
                      whitespace-pre-wrap

                      text-base
                      font-semibold
                      leading-relaxed
                      !text-slate-900
                    "
                  >
                    {
                      latestInspection.condition
                    }
                  </p>
                </AppInfoCard>
              </div>
            )}

            {/* =============================================
                INSPECTION REMARK
            ============================================= */}

            {latestInspection.remark && (
              <div
                className="
                  min-w-0

                  sm:col-span-2
                  xl:col-span-4
                "
              >
                <AppInfoCard>
                  <p
                    className="
                      text-sm
                      font-extrabold
                      !text-slate-600

                      sm:text-base
                    "
                  >
                    หมายเหตุการตรวจ
                  </p>

                  <p
                    className="
                      mt-2
                      break-words
                      whitespace-pre-wrap

                      text-base
                      font-semibold
                      leading-relaxed
                      !text-slate-900
                    "
                  >
                    {
                      latestInspection.remark
                    }
                  </p>
                </AppInfoCard>
              </div>
            )}
          </div>
        ) : (
          <AppInfoCard
            className="
              flex
              min-h-[160px]
              items-center
              justify-center
              text-center
            "
          >
            <div>
              <div
                className="
                  text-3xl
                "
                aria-hidden="true"
              >
                🔍
              </div>

              <p
                className="
                  mt-3
                  text-base
                  font-extrabold
                  !text-slate-900
                "
              >
                ยังไม่มีประวัติการตรวจสอบครุภัณฑ์
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                เมื่อมีการบันทึกผลการตรวจสอบ
                ข้อมูลล่าสุดจะแสดงในส่วนนี้
              </p>
            </div>
          </AppInfoCard>
        )}
      </AppCard>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
          !p-4

          sm:!p-5
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-base
                font-extrabold
                !text-slate-900
              "
            >
              การดำเนินการ
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              บันทึกผลการตรวจสอบหรือดำเนินการจำหน่ายครุภัณฑ์
            </p>
          </div>

          <div
            className="
              flex
              w-full
              flex-col
              gap-2

              sm:w-auto
              sm:flex-row
            "
          >
            <AppButton
              href={`${assetBasePath}/inspection/new`}
              variant="success"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  🔍
                </span>
              }
              className="
                w-full
                sm:w-auto
              "
            >
              บันทึกผลการตรวจ
            </AppButton>

            <AppButton
              href={`${assetBasePath}/disposal`}
              variant="danger"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  📦
                </span>
              }
              className="
                w-full
                sm:w-auto
              "
            >
              การจำหน่าย
            </AppButton>
          </div>
        </div>
      </AppCard>
    </AppPage>
  );
}