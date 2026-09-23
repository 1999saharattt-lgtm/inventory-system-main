import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import EditReceiveForm from "./EditReceiveForm";

/* =========================================================
   TYPES
========================================================= */

interface Props {
  params: Promise<{
    id: string;
  }>;
}

/* =========================================================
   PAGE
========================================================= */

export default async function EditReceivePage({
  params,
}: Props) {
  const { id } = await params;

  /* =========================================================
     RECEIVE
  ========================================================= */

  const receive =
    await prisma.receive.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        items: {
          include: {
            material: true,
          },

          orderBy: {
            id: "asc",
          },
        },
      },
    });

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!receive) {
    notFound();
  }

  /* =========================================================
     MATERIALS + VENDORS
  ========================================================= */

  const [materials, vendors] =
    await Promise.all([
      prisma.material.findMany({
        orderBy: [
          {
            category: "asc",
          },
          {
            code: "asc",
          },
        ],
      }),

      prisma.vendor.findMany({
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="✏️"
        title="แก้ไขรายการรับเข้าพัสดุ"
        subtitle="แก้ไขรายละเอียดเอกสารและรายการพัสดุ"
        actions={
          <AppButton
            href="/receive"
            variant="back"
            size="md"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          EDIT RECEIVE FORM

          EditReceiveForm จัดการ Card ภายในเองแล้วด้วย:
          - AppCard
          - AppInfoCard
          - AppTableCard

          จึงไม่ครอบ AppCard ซ้ำใน page นี้
      ===================================================== */}

      <div
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible
        "
      >
        <EditReceiveForm
          receive={receive}
          vendors={vendors}
          materials={materials}
        />
      </div>
    </AppPage>
  );
}