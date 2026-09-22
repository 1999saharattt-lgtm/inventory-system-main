import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditMaterialForm from "./EditMaterialForm";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMaterialPage({
  params,
}: Props) {
  const { id } = await params;

  /* =========================================================
     Material
  ========================================================= */

  const material = await prisma.material.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!material) {
    notFound();
  }

  /* =========================================================
     Vendors
  ========================================================= */

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="✏️"
        title="แก้ไขข้อมูลพัสดุ"
        subtitle="แก้ไขรายละเอียดรายการพัสดุ"
        actions={
          <Link
            href={`/materials/category/${material.category}`}
            prefetch
            className="
              group
              inline-flex
              h-11
              shrink-0
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
              sm:px-5
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
          Edit Material Form
      ===================================================== */}

      <section
        className="
          flex
          w-full
          min-w-0
          justify-center
        "
      >
        <div className="w-full max-w-4xl">
          <EditMaterialForm
            material={material}
            vendors={vendors}
          />
        </div>
      </section>
    </AppPage>
  );
}