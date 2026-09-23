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
     VALIDATE ID
  ========================================================= */

  const receiveId = Number(id);

  if (
    !Number.isInteger(receiveId) ||
    receiveId <= 0
  ) {
    notFound();
  }

  /* =========================================================
     DATA
  ========================================================= */

  const [
    receive,
    materials,
    vendors,
  ] = await Promise.all([
    prisma.receive.findUnique({
      where: {
        id: receiveId,
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
    }),

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
     NOT FOUND
  ========================================================= */

  if (!receive) {
    notFound();
  }

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
          EDIT RECEIVE FORM
      ===================================================== */}

      <div
        className="
          relative

          w-full
          min-w-0

          overflow-visible

          rounded-[30px]

          bg-white/70

          p-4
          sm:p-5
          lg:p-6

          shadow-[0_18px_50px_-24px_rgba(15,23,42,0.20)]

          ring-1
          ring-slate-200/70

          backdrop-blur-xl
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