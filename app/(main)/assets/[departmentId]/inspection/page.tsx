import {
  notFound,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireLogin,
} from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import InspectionForm from "./InspectionForm";

export const dynamic =
  "force-dynamic";

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
   SOURCE ORDER
========================================================= */

function getSourceOrder(
  remark:
    | string
    | null
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
  searchParams,
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
    !Number.isInteger(
      id
    ) ||
    id <= 0
  ) {
    notFound();
  }

  const query = await searchParams;
  const rawFiscalYear = Array.isArray(query.fiscalYear)
    ? query.fiscalYear[0]
    : query.fiscalYear;
  const fiscalYear = rawFiscalYear && /^\d{4}$/.test(rawFiscalYear)
    ? rawFiscalYear
    : undefined;

  /* =======================================================
     ADMIN ONLY
  ======================================================= */

  if (
    user.role !==
    "ADMIN"
  ) {
    notFound();
  }

  /* =======================================================
     DEPARTMENTS
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
      (
        item
      ) =>
        item.id ===
        id
    );

  if (!department) {
    notFound();
  }

  /* =======================================================
     ASSETS
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

        categoryDetail:
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

        quantity:
          true,

        unit:
          true,

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

        remark:
          true,

        section: {
          select: {
            id:
              true,

            name:
              true,
          },
        },

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
  ======================================================= */

  const sortedAssets =
    [
      ...assetsFromDatabase,
    ].sort(
      (
        a,
        b
      ) => {
        const orderA =
          getSourceOrder(
            a.remark
          );

        const orderB =
          getSourceOrder(
            b.remark
          );

        if (
          orderA !==
            null &&
          orderB !==
            null
        ) {
          return (
            orderA -
            orderB
          );
        }

        if (
          orderA !==
          null
        ) {
          return -1;
        }

        if (
          orderB !==
          null
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
     DISPLAY DATA
  ======================================================= */

  const assets = sortedAssets.map((asset) => {
    const groupName = department.name.trim();

    const officerName = asset.officer
      ? [
          asset.officer.firstName,
          asset.officer.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

    return {
      ...asset,
      location: groupName,
      responsibleName: asset.responsibleName?.trim() || officerName,
    };
  });

  /* =======================================================
     OFFICERS
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
      <AppPageHeader
        icon="🔎"
        title="ตรวจสอบรายการครุภัณฑ์ประจำปี"
        subtitle="บันทึกผลการตรวจสอบครุภัณฑ์ประจำปีของแต่ละกลุ่มงาน"
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

      <InspectionForm
        key={department.id}
        department={department}
        departments={departments}
        assets={assets}
        officers={officers}
        fiscalYear={fiscalYear}
      />
    </AppPage>
  );
}
