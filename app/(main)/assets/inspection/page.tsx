import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

import AssetInspectionClient from "./AssetInspectionClient";

/* =========================================================
   PAGE
========================================================= */

export default async function AssetInspectionPage() {
  /* =======================================================
     CURRENT YEAR
  ======================================================= */

  const currentYear =
    new Date().getFullYear();

  /* =======================================================
     INSPECTIONS
  ======================================================= */

  const inspections =
    await prisma.assetInspection.findMany({
      orderBy: [
        {
          inspectionDate:
            "desc",
        },
        {
          id:
            "desc",
        },
      ],

      include: {
        asset: {
          include: {
            department:
              true,

            section:
              true,

            officer:
              true,
          },
        },
      },
    });

  /* =======================================================
     SUMMARY
     คง Logic เดิม
  ======================================================= */

  const currentYearInspections =
    inspections.filter(
      (inspection) =>
        inspection.year ===
        currentYear
    );

  const totalInspections =
    inspections.length;

  const inUseCount =
    inspections.filter(
      (inspection) =>
        inspection.status ===
        "IN_USE"
    ).length;

  const problemCount =
    inspections.filter(
      (inspection) =>
        inspection.status !==
        "IN_USE"
    ).length;

  /* =======================================================
     SERIALIZABLE DATA

     ส่งเฉพาะข้อมูลที่หน้าจอใช้
     ไปยัง Client Component

     ไม่ส่ง Prisma object ทั้งก้อน
  ======================================================= */

  const inspectionRows =
    inspections.map(
      (inspection) => ({
        id:
          inspection.id,

        inspectionDate:
          inspection.inspectionDate.toISOString(),

        quarter:
          inspection.quarter,

        year:
          inspection.year,

        status:
          inspection.status,

        asset: {
          id:
            inspection.asset.id,

          departmentId:
            inspection.asset
              .departmentId,

          category:
            inspection.asset
              .category,

          name:
            inspection.asset.name,

          officeAssetNo:
            inspection.asset
              .officeAssetNo,

          departmentName:
            inspection.asset
              .department.name,

          sectionName:
            inspection.asset
              .section?.name ??
            null,

          officerName:
            inspection.asset
              .officer
              ? `${inspection.asset.officer.firstName} ${inspection.asset.officer.lastName}`.trim()
              : null,
        },
      })
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🔍"
        title="ตรวจสอบครุภัณฑ์"
        subtitle="ประวัติและผลการตรวจสอบครุภัณฑ์ของแต่ละกลุ่มงาน"
        actions={
          <AppButton
            href="/assets/inspection/pending"
            variant="primary"
            size="md"
            icon={
              <span aria-hidden="true">
                📋
              </span>
            }
          >
            รายการรอตรวจ
          </AppButton>
        }
      />

      {/* =====================================================
          SUMMARY

          ใช้ AppCard + AppInfoCard ตัวกลาง
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            grid
            w-full
            min-w-0

            grid-cols-1
            gap-4

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {/* ===============================================
              TOTAL
          =============================================== */}

          <AppInfoCard
            label="ประวัติการตรวจทั้งหมด"
            value={`${totalInspections.toLocaleString(
              "th-TH"
            )} รายการ`}
          />

          {/* ===============================================
              CURRENT YEAR
          =============================================== */}

          <AppInfoCard
            label={`ตรวจในปี ${
              currentYear + 543
            }`}
            value={`${currentYearInspections.length.toLocaleString(
              "th-TH"
            )} รายการ`}
          />

          {/* ===============================================
              NORMAL
          =============================================== */}

          <AppInfoCard
            label="ผลตรวจปกติ"
            value={`${inUseCount.toLocaleString(
              "th-TH"
            )} รายการ`}
          />

          {/* ===============================================
              PROBLEM
          =============================================== */}

          <AppInfoCard
            label="ต้องติดตาม"
            value={`${problemCount.toLocaleString(
              "th-TH"
            )} รายการ`}
          />
        </div>
      </AppCard>

      {/* =====================================================
          SEARCH + TABLE

          AppSearchInput ต้องอยู่ Client
      ===================================================== */}

      <AssetInspectionClient
        inspections={
          inspectionRows
        }
      />
    </AppPage>
  );
}