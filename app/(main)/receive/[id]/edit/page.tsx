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

          สำคัญ:
          - ไม่กำหนด z-0 ที่ wrapper
          - ไม่ใช้ overflow-hidden
          - ปล่อยให้ DatePicker / Dropdown ของ Form
            สามารถแสดงเหนือ Card และ Table ได้
          - Card ต่าง ๆ จัดการภายใน EditReceiveForm
      ===================================================== */}

      <div
        className="
          relative

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