import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import ReceiveForm from "./ReceiveForm";

/* =========================================================
   THAI YEAR
========================================================= */

function getThaiYear() {
  return String(
    new Date().getFullYear() + 543
  ).slice(-2);
}

/* =========================================================
   GENERATE RECEIVE DOCUMENT NUMBER
========================================================= */

async function generateReceiveNo() {
  const year = getThaiYear();

  const receives =
    await prisma.receive.findMany({
      where: {
        documentNo: {
          startsWith: "ร.",
        },
      },

      select: {
        documentNo: true,
      },
    });

  let running = 1;

  for (const receive of receives) {
    const match =
      receive.documentNo.match(
        /^ร\.(\d+)\/(\d+)$/
      );

    if (match) {
      const lastNumber = Number(
        match[1]
      );

      const lastYear =
        match[2];

      if (
        lastYear === year &&
        lastNumber >= running
      ) {
        running =
          lastNumber + 1;
      }
    }
  }

  return `ร.${String(
    running
  ).padStart(2, "0")}/${year}`;
}

/* =========================================================
   PAGE
========================================================= */

export default async function CreateReceivePage() {
  const [
    materials,
    vendors,
    documentNo,
  ] = await Promise.all([
    /* =======================================================
       MATERIALS
    ======================================================= */

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

    /* =======================================================
       VENDORS
    ======================================================= */

    prisma.vendor.findMany({
      orderBy: {
        name: "asc",
      },
    }),

    /* =======================================================
       DOCUMENT NUMBER
    ======================================================= */

    generateReceiveNo(),
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
        icon="📥"
        title="บันทึกการรับเข้าพัสดุ"
        subtitle="เพิ่มรายการรับเข้าพัสดุเข้าสู่ระบบ"
        actions={
          <AppButton
            href="/receive"
            variant="back"
            size="md"
            icon={
              <span>←</span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          RECEIVE FORM CARD
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
          p-4
          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]
          backdrop-blur-2xl
          sm:p-6
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
            FORM
        =================================================== */}

        <div className="relative">
          <ReceiveForm
            vendors={vendors}
            materials={materials}
            documentNo={
              documentNo
            }
          />
        </div>
      </section>
    </AppPage>
  );
}