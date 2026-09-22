import Link from "next/link";
import MaterialForm from "./MaterialForm";
import { prisma } from "@/lib/prisma";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

export const dynamic = "force-dynamic";

export default async function NewMaterialPage() {
  /* =========================================================
     Vendors
  ========================================================= */

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  /* =========================================================
     Material Masters
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
          Header
      ===================================================== */}

      <AppPageHeader
        icon="➕"
        title="เพิ่มรายการพัสดุ"
        subtitle="เพิ่มข้อมูลพัสดุใหม่เข้าสู่ระบบ"
        actions={
          <Link
            href="/materials"
            prefetch
            className="
              group
              inline-flex
              h-11
              min-w-[104px]
              items-center
              justify-center
              gap-2
              rounded-[16px]
              border
              border-slate-200
              bg-white/90
              px-4
              text-sm
              font-extrabold
              !text-slate-800
              shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)]
              backdrop-blur-xl
              transition-all
              duration-300
              ease-out
              hover:-translate-y-0.5
              hover:border-slate-300
              hover:bg-white
              hover:shadow-[0_16px_30px_-18px_rgba(15,23,42,0.4)]
              active:translate-y-0
              active:scale-[0.97]
            "
          >
            <span
              className="
                transition-transform
                duration-300
                group-hover:-translate-x-0.5
              "
            >
              ←
            </span>

            <span>กลับ</span>
          </Link>
        }
      />

      {/* =====================================================
          Form Area
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
        "
      >
        {/* Ambient Background */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            -top-10
            -z-10
            mx-auto
            h-52
            max-w-5xl
            rounded-full
            bg-gradient-to-r
            from-blue-100/40
            via-slate-100/30
            to-cyan-100/40
            blur-3xl
          "
        />

        {/* Material Form */}

        <MaterialForm
          vendors={vendors}
          materialMasters={materialMasters}
        />
      </section>
    </AppPage>
  );
}