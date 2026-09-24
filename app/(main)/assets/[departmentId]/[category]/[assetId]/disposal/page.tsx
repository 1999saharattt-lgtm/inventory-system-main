import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

/* =========================================================
   STATUS
========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

/* =========================================================
   PAGE
========================================================= */

export default async function AssetDisposalDetailPage({
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

  if (
    !Number.isInteger(departmentIdNumber) ||
    departmentIdNumber <= 0 ||
    !Number.isInteger(assetIdNumber) ||
    assetIdNumber <= 0
  ) {
    notFound();
  }

  /* =======================================================
     ASSET
  ======================================================= */

  const asset =
    await prisma.asset.findFirst({
      where: {
        id: assetIdNumber,
        departmentId:
          departmentIdNumber,
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
     ROUTES
  ======================================================= */

  const normalizedCategory =
    category.toLowerCase();

  const detailPath =
    `/assets/${departmentIdNumber}/${normalizedCategory}/${asset.id}`;

  const editPath =
    `${detailPath}/edit`;

  const newDisposalPath =
    `${detailPath}/disposal/new`;

  /* =======================================================
     OFFICER
  ======================================================= */

  const officerFullName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "-";

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
     STATUS BADGE
  ======================================================= */

  function getStatusClassName(
    status: string
  ) {
    switch (status) {
      case "DISPOSED":
        return `
          border-red-200
          bg-red-50
          !text-red-700
        `;

      case "WAITING_DISPOSAL":
        return `
          border-amber-200
          bg-amber-50
          !text-amber-700
        `;

      case "DAMAGED":
        return `
          border-orange-200
          bg-orange-50
          !text-orange-700
        `;

      default:
        return `
          border-emerald-200
          bg-emerald-50
          !text-emerald-700
        `;
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🗃️"
        title="ดำเนินการจำหน่ายครุภัณฑ์"
        subtitle="ตรวจสอบข้อมูลครุภัณฑ์ก่อนดำเนินการจำหน่าย"
        actions={
          <AppButton
            href={detailPath}
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
        }
      />

      {/* =====================================================
          ASSET INFORMATION
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
              ตรวจสอบรายละเอียดรายการก่อนดำเนินการ
            </p>
          </div>

          {/* ===============================================
              STATUS
          =============================================== */}

          <span
            className={`
              inline-flex
              w-fit
              shrink-0
              items-center
              justify-center

              whitespace-nowrap

              rounded-full

              border

              px-4
              py-1.5

              text-sm
              font-extrabold

              ${getStatusClassName(
                asset.status
              )}
            `}
          >
            {statusName[
              asset.status
            ] ?? "ไม่ระบุสถานะ"}
          </span>
        </div>

        {/* =================================================
            GRID
        ================================================= */}

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

          <div className="lg:col-span-2">
            <AppInfoCard>
              <p className={labelClassName}>
                รายการครุภัณฑ์
              </p>

              <div className={valueClassName}>
                <span className="break-words">
                  {asset.name}
                </span>
              </div>
            </AppInfoCard>
          </div>

          {/* ===============================================
              CATEGORY
          =============================================== */}

          <AppInfoCard>
            <p className={labelClassName}>
              ประเภท
            </p>

            <div className={valueClassName}>
              <span className="break-words">
                {categoryName[
                  asset.category
                ] ?? "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* ===============================================
              DEPARTMENT
          =============================================== */}

          <AppInfoCard>
            <p className={labelClassName}>
              หน่วยงาน
            </p>

            <div className={valueClassName}>
              <span className="break-words">
                {asset.department.name}
              </span>
            </div>
          </AppInfoCard>

          {/* ===============================================
              SECTION
          =============================================== */}

          <AppInfoCard>
            <p className={labelClassName}>
              กลุ่มงาน
            </p>

            <div className={valueClassName}>
              <span className="break-words">
                {asset.section?.name ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* ===============================================
              OFFICER
          =============================================== */}

          <AppInfoCard>
            <p className={labelClassName}>
              ผู้ครอบครอง
            </p>

            <div className={valueClassName}>
              <span className="break-words">
                {officerFullName}
              </span>
            </div>
          </AppInfoCard>

          {/* ===============================================
              GFMIS
          =============================================== */}

          <AppInfoCard>
            <p className={labelClassName}>
              รหัส GFMIS
            </p>

            <div className={valueClassName}>
              <span className="break-all">
                {asset.governmentAssetNo ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* ===============================================
              ASSET CODE
          =============================================== */}

          <AppInfoCard>
            <p className={labelClassName}>
              รหัสครุภัณฑ์
            </p>

            <div className={valueClassName}>
              <span className="break-all">
                {asset.officeAssetNo ??
                  "-"}
              </span>
            </div>
          </AppInfoCard>

          {/* ===============================================
              SERIAL NUMBER
          =============================================== */}

          <div className="lg:col-span-2">
            <AppInfoCard>
              <p className={labelClassName}>
                Serial Number
              </p>

              <div className={valueClassName}>
                <span className="break-all">
                  {asset.serialNumber ??
                    "-"}
                </span>
              </div>
            </AppInfoCard>
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          IN USE
      ===================================================== */}

      {asset.status === "IN_USE" && (
        <AppCard
          className="
            w-full
            border-amber-200
            bg-amber-50
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  text-lg
                  font-extrabold
                  !text-amber-900
                "
              >
                ⚠️ ครุภัณฑ์รายการนี้ยังมีสถานะใช้งาน
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-amber-800

                  sm:text-base
                "
              >
                หากต้องการดำเนินการจำหน่าย
                กรุณาเปลี่ยนสถานะเป็น
                &quot;รอจำหน่าย&quot;
                ก่อนดำเนินการ
              </p>
            </div>

            <AppButton
              href={editPath}
              variant="primary"
              size="md"
              icon={
                <span aria-hidden="true">
                  ✏️
                </span>
              }
              className="
                w-full
                shrink-0

                sm:w-auto
              "
            >
              แก้ไขสถานะครุภัณฑ์
            </AppButton>
          </div>
        </AppCard>
      )}

      {/* =====================================================
          DAMAGED
      ===================================================== */}

      {asset.status ===
        "DAMAGED" && (
        <AppCard
          className="
            w-full
            border-orange-200
            bg-orange-50
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  text-lg
                  font-extrabold
                  !text-orange-900
                "
              >
                🛠️ ครุภัณฑ์มีสถานะชำรุด
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-orange-800

                  sm:text-base
                "
              >
                ครุภัณฑ์รายการนี้มีสถานะ
                &quot;ชำรุด&quot;
                กรุณาตรวจสอบสภาพครุภัณฑ์และดำเนินการตามขั้นตอนที่เกี่ยวข้อง
              </p>
            </div>

            <AppButton
              href={editPath}
              variant="primary"
              size="md"
              icon={
                <span aria-hidden="true">
                  ✏️
                </span>
              }
              className="
                w-full
                shrink-0

                sm:w-auto
              "
            >
              แก้ไขสถานะครุภัณฑ์
            </AppButton>
          </div>
        </AppCard>
      )}

      {/* =====================================================
          WAITING DISPOSAL
      ===================================================== */}

      {asset.status ===
        "WAITING_DISPOSAL" && (
        <AppCard
          className="
            w-full
            border-amber-200
            bg-amber-50
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  text-lg
                  font-extrabold
                  !text-amber-900
                "
              >
                🟡 ครุภัณฑ์อยู่ระหว่างรอจำหน่าย
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-amber-800

                  sm:text-base
                "
              >
                รายการนี้พร้อมเข้าสู่ขั้นตอนการจำหน่าย
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนดำเนินการ
              </p>
            </div>

            <AppButton
              href={newDisposalPath}
              variant="danger"
              size="md"
              icon={
                <span aria-hidden="true">
                  🗑️
                </span>
              }
              className="
                w-full
                shrink-0

                sm:w-auto
              "
            >
              ดำเนินการจำหน่าย
            </AppButton>
          </div>
        </AppCard>
      )}

      {/* =====================================================
          DISPOSED
      ===================================================== */}

      {asset.status ===
        "DISPOSED" && (
        <AppCard
          className="
            w-full
            border-red-200
            bg-red-50
          "
        >
          {/* ===============================================
              MESSAGE
          =============================================== */}

          <div>
            <h2
              className="
                text-lg
                font-extrabold
                !text-red-900
              "
            >
              🗑️ ครุภัณฑ์จำหน่ายแล้ว
            </h2>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                leading-relaxed
                !text-red-800

                sm:text-base
              "
            >
              ครุภัณฑ์รายการนี้มีสถานะเป็น
              &quot;จำหน่ายแล้ว&quot;
              และไม่สามารถดำเนินการจำหน่ายซ้ำได้
            </p>
          </div>

          {/* ===============================================
              DISPOSAL INFORMATION
          =============================================== */}

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-4

              lg:grid-cols-2
            "
          >
            {/* DATE */}

            <AppInfoCard>
              <p className={labelClassName}>
                วันที่จำหน่าย
              </p>

              <div className={valueClassName}>
                {asset.disposalDate
                  ? asset.disposalDate.toLocaleDateString(
                      "th-TH",
                      {
                        day: "2-digit",
                        month:
                          "2-digit",
                        year: "numeric",
                      }
                    )
                  : "-"}
              </div>
            </AppInfoCard>

            {/* LOCATION */}

            <AppInfoCard>
              <p className={labelClassName}>
                สถานที่จำหน่าย
              </p>

              <div className={valueClassName}>
                <span className="break-words">
                  {asset.disposalLocation ??
                    "-"}
                </span>
              </div>
            </AppInfoCard>
          </div>
        </AppCard>
      )}
    </AppPage>
  );
}