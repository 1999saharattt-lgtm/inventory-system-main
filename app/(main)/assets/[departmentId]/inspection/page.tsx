import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import InspectionForm from "./InspectionForm";
import DepartmentInspectionSelect from "./DepartmentInspectionSelect";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

/* =========================================================
   SOURCE ORDER

   ใช้ลำดับเดียวกับหน้า
   /assets/[departmentId]/all

   รูปแบบใน remark:

   SOURCE:DEPARTMENT_1:1
   SOURCE:DEPARTMENT_1:2
   SOURCE:DEPARTMENT_1:3

   มี SourceOrder
   -> เรียงตาม SourceOrder

   ไม่มี SourceOrder
   -> อยู่ท้ายรายการ
   -> เรียงตาม Asset.id
========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match =
    remark.match(
      /SOURCE:DEPARTMENT_1:(\d+)/
    );

  if (!match) {
    return null;
  }

  const sourceOrder =
    Number(
      match[1]
    );

  if (
    !Number.isInteger(
      sourceOrder
    ) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   PAGE
========================================================= */

export default async function AssetInspectionPage({
  params,
}: Props) {
  /* =======================================================
     USER
  ======================================================= */

  const user =
    await requireLogin();

  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId,
  } = await params;

  const id =
    Number(
      departmentId
    );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    notFound();
  }

  /* =======================================================
     PERMISSION

     หน้านี้สำหรับ ADMIN เท่านั้น
  ======================================================= */

  if (
    user.role !== "ADMIN"
  ) {
    notFound();
  }

  /* =======================================================
     DEPARTMENTS

     ใช้สำหรับ Dropdown เลือกกลุ่มงาน
  ======================================================= */

  const departments =
    await prisma.department.findMany({
      select: {
        id:
          true,

        name:
          true,
      },

      orderBy: {
        id:
          "asc",
      },
    });

  /* =======================================================
     CURRENT DEPARTMENT
  ======================================================= */

  const department =
    departments.find(
      (item) =>
        item.id === id
    );

  if (!department) {
    notFound();
  }

  /* =======================================================
     ASSETS

     ใช้ข้อมูลเดียวกับหน้า /all

     ดึง:
     - quantity
     - unit
     - responsibleName
     - remark
     - section
     - officer
  ======================================================= */

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId:
          id,
      },

      select: {
        id:
          true,

        name:
          true,

        category:
          true,

        brand:
          true,

        model:
          true,

        serialNumber:
          true,

        governmentAssetNo:
          true,

        officeAssetNo:
          true,

        /* ===============================================
           จำนวน / หน่วย
        =============================================== */

        quantity:
          true,

        unit:
          true,

        /* ===============================================
           ผู้รับผิดชอบจากทะเบียนต้นฉบับ
        =============================================== */

        responsibleName:
          true,

        departmentId:
          true,

        sectionId:
          true,

        officerId:
          true,

        status:
          true,

        purchaseDate:
          true,

        price:
          true,

        location:
          true,

        /* ===============================================
           SOURCE ORDER
        =============================================== */

        remark:
          true,

        /* ===============================================
           SECTION
        =============================================== */

        section: {
          select: {
            id:
              true,

            name:
              true,
          },
        },

        /* ===============================================
           OFFICER
        =============================================== */

        officer: {
          select: {
            id:
              true,

            firstName:
              true,

            lastName:
              true,

            position:
              true,
          },
        },
      },
    });

  /* =======================================================
     SORT

     1. มี SourceOrder ทั้งคู่
        -> เรียง SourceOrder

     2. A มี SourceOrder
        -> A ก่อน

     3. B มี SourceOrder
        -> B ก่อน

     4. ไม่มีทั้งคู่
        -> Asset.id
  ======================================================= */

  const assets =
    [
      ...assetsFromDatabase,
    ].sort(
      (a, b) => {
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

        if (
          orderA !== null
        ) {
          return -1;
        }

        if (
          orderB !== null
        ) {
          return 1;
        }

        return (
          a.id -
          b.id
        );
      }
    );

  /* =======================================================
     OFFICERS

     ดึงจากทุกกลุ่มงาน

     ใช้สำหรับ:
     - ผู้ตรวจสอบ 5 คน
     - fallback ผู้รับผิดชอบ
  ======================================================= */

  const officers =
    await prisma.officer.findMany({
      select: {
        id:
          true,

        firstName:
          true,

        lastName:
          true,

        position:
          true,

        type:
          true,

        departmentId:
          true,

        sectionId:
          true,

        department: {
          select: {
            id:
              true,

            name:
              true,
          },
        },

        section: {
          select: {
            id:
              true,

            name:
              true,
          },
        },
      },

      orderBy: [
        {
          firstName:
            "asc",
        },
        {
          lastName:
            "asc",
        },
      ],
    });

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER

          ใช้ AppPageHeader ตัวกลาง
          เหมือนหน้าอื่นทั้งหมด
      ===================================================== */}

      <AppPageHeader
        icon="🔎"
        title="ตรวจสอบรายการครุภัณฑ์ประจำปี"
        subtitle={`${department.name} • ตรวจสอบและบันทึกผลการตรวจครุภัณฑ์ประจำปี`}
        actions={
          <AppButton
            href="/assets"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          DEPARTMENT SELECT

          ใช้ AppCard ตัวกลาง
          แยกออกจาก Header
          ให้รูปแบบเหมือนหน้าอื่น
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col

            gap-4

            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* ===============================================
              INFORMATION
          =============================================== */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                flex
                items-start

                gap-3
              "
            >
              {/* =============================================
                  ICON
              ============================================= */}

              <div
                className="
                  grid
                  h-11
                  w-11
                  shrink-0

                  place-items-center

                  rounded-[14px]

                  border
                  border-emerald-100

                  bg-emerald-50

                  text-xl

                  shadow-sm
                "
                aria-hidden="true"
              >
                🏢
              </div>

              {/* =============================================
                  TEXT
              ============================================= */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <h2
                  className="
                    text-base
                    font-extrabold

                    !text-slate-900

                    sm:text-lg
                  "
                >
                  เลือกกลุ่มงานที่ต้องการตรวจสอบ
                </h2>

                <p
                  className="
                    mt-1

                    text-sm
                    font-semibold
                    leading-relaxed

                    !text-slate-500
                  "
                >
                  เมื่อเปลี่ยนกลุ่มงาน
                  ระบบจะโหลดรายการครุภัณฑ์ของกลุ่มงานนั้นโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* ===============================================
              SELECT
          =============================================== */}

          <div
            className="
              w-full
              min-w-0

              lg:w-[420px]
              lg:shrink-0
            "
          >
            <DepartmentInspectionSelect
              departments={
                departments
              }
              currentDepartmentId={
                department.id
              }
            />
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          CURRENT DEPARTMENT INFORMATION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col

            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {/* ===============================================
              DEPARTMENT
          =============================================== */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                text-sm
                font-bold

                !text-slate-500
              "
            >
              กลุ่มงานที่กำลังตรวจสอบ
            </p>

            <h2
              className="
                mt-1

                break-words

                text-xl
                font-black
                tracking-tight

                !text-slate-900
              "
            >
              {
                department.name
              }
            </h2>
          </div>

          {/* ===============================================
              ASSET COUNT
          =============================================== */}

          <div
            className="
              flex
              shrink-0
              items-center

              gap-2

              rounded-[16px]

              border
              border-slate-200

              bg-slate-50/80

              px-4
              py-3

              shadow-sm
            "
          >
            <span
              aria-hidden="true"
              className="
                text-lg
              "
            >
              🗄️
            </span>

            <div>
              <p
                className="
                  text-xs
                  font-bold

                  !text-slate-500
                "
              >
                จำนวนครุภัณฑ์
              </p>

              <p
                className="
                  text-base
                  font-black
                  tabular-nums

                  !text-slate-900
                "
              >
                {assets.length.toLocaleString(
                  "th-TH"
                )}{" "}
                รายการ
              </p>
            </div>
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          INSPECTION FORM

          Logic เดิมทั้งหมด

          key ใช้ department.id
          เพื่อ reset state เมื่อเปลี่ยนกลุ่มงาน
      ===================================================== */}

      <InspectionForm
        key={
          department.id
        }
        department={
          department
        }
        assets={
          assets
        }
        officers={
          officers
        }
      />
    </AppPage>
  );
}