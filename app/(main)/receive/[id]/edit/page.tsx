import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import EditReceiveForm from "./EditReceiveForm";

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
          FORM CARD
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-visible

          rounded-[28px]

          border
          border-slate-300

          bg-white/85

          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            AMBIENT BACKGROUND
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20

            h-52
            w-52

            rounded-full

            bg-blue-400/10

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-20

            h-56
            w-56

            rounded-full

            bg-cyan-400/10

            blur-3xl
          "
        />

        {/* ===================================================
            FORM HEADER
        =================================================== */}

        <div
          className="
            relative

            flex
            items-center
            gap-3

            border-b
            border-black

            bg-white/70

            px-5
            py-4

            sm:px-6
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center

              rounded-[15px]

              bg-blue-50

              text-xl

              shadow-sm

              ring-1
              ring-blue-100
            "
          >
            📝
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900

                sm:text-xl
              "
            >
              ข้อมูลการรับเข้าพัสดุ
            </h2>

            <p
              className="
                mt-0.5

                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนบันทึก
            </p>
          </div>
        </div>

        {/* ===================================================
            EDIT FORM
        =================================================== */}

        <div
          className="
            relative
            z-10

            w-full
            min-w-0

            p-4

            sm:p-6
          "
        >
          <EditReceiveForm
            receive={receive}
            vendors={vendors}
            materials={materials}
          />
        </div>
      </section>
    </AppPage>
  );
}