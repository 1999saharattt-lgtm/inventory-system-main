import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

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
          EDIT RECEIVE FORM CARD

          ใช้ AppCard กลางของระบบ
          - รูปแบบ iOS / Glass
          - Border / Radius / Shadow มาตรฐานเดียวกัน
          - ไม่มีหัวข้อซ้ำด้านใน
          - ไม่มีเส้นดำใต้หัวข้อ
          - รองรับ Dropdown / Calendar ที่ลอยออกจาก Card
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            EDIT FORM
        =================================================== */}

        <div
          className="
            relative
            z-10

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
      </AppCard>
    </AppPage>
  );
}