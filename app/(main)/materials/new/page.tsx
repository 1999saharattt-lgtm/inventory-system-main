import { prisma } from "@/lib/prisma";
import MaterialForm from "./MaterialForm";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

/* =========================================================
   CATEGORY
========================================================= */

const validCategories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
] as const;

type CategoryCode =
  (typeof validCategories)[number];

/* =========================================================
   CATEGORY VALIDATION
========================================================= */

function isValidCategory(
  category: string | undefined
): category is CategoryCode {
  return (
    !!category &&
    validCategories.includes(
      category as CategoryCode
    )
  );
}

/* =========================================================
   BACK URL
========================================================= */

function getBackHref(
  category: string | undefined
) {
  if (isValidCategory(category)) {
    return `/materials/category/${category}`;
  }

  return "/materials";
}

/* =========================================================
   PAGE
========================================================= */

export default async function NewMaterialPage({
  searchParams,
}: Props) {
  /* =======================================================
     SEARCH PARAMS
  ======================================================= */

  const { category } =
    await searchParams;

  const initialCategory =
    isValidCategory(category)
      ? category
      : "";

  const backHref =
    getBackHref(category);

  /* =======================================================
     VENDORS
  ======================================================= */

  const vendors =
    await prisma.vendor.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  /* =======================================================
     MATERIAL MASTERS
  ======================================================= */

  const materialMasters =
    await prisma.materialMaster.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],

      select: {
        id: true,
        category: true,
        name: true,
        unit: true,
      },
    });

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ Component กลางของระบบ
      ===================================================== */}

      <AppPageHeader
        icon="➕"
        title="เพิ่มรายการพัสดุ"
        subtitle="เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ"
        actions={
          <AppButton
            href={backHref}
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FORM
          ใช้ MaterialForm กลาง
      ===================================================== */}

      <MaterialForm
        vendors={vendors}
        materialMasters={
          materialMasters
        }
        initialCategory={
          initialCategory
        }
        backHref={backHref}
      />
    </AppPage>
  );
}