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

type MaterialCategory =
  (typeof validCategories)[number];

/* =========================================================
   VALIDATE CATEGORY
========================================================= */

function getValidCategory(
  category: string | undefined
): MaterialCategory | undefined {
  if (!category) {
    return undefined;
  }

  const normalizedCategory =
    category.toUpperCase();

  if (
    validCategories.includes(
      normalizedCategory as MaterialCategory
    )
  ) {
    return normalizedCategory as MaterialCategory;
  }

  return undefined;
}

/* =========================================================
   BACK HREF
========================================================= */

function getBackHref(
  category: MaterialCategory | undefined
) {
  if (category) {
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

  const params = await searchParams;

  const category =
    getValidCategory(
      params.category
    );

  const backHref =
    getBackHref(category);

  /* =========================================================
     VENDORS
  ========================================================= */

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

  /* =========================================================
     MATERIAL MASTERS
  ========================================================= */

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
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FORM AREA
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
        "
      >
        <MaterialForm
          vendors={vendors}
          materialMasters={materialMasters}
          initialCategory={category}
        />
      </section>
    </AppPage>
  );
}