import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

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

    if (!match) {
      continue;
    }

    const lastNumber = Number(
      match[1]
    );

    const lastYear = match[2];

    if (
      lastYear === year &&
      lastNumber >= running
    ) {
      running =
        lastNumber + 1;
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
      />

      {/* =====================================================
          RECEIVE FORM CARD
      ===================================================== */}

      <section
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible

          rounded-[28px]

          border
          border-slate-200/90

          bg-white/80

          p-4

          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl

          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            IOS AMBIENT BACKGROUND
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -right-20
            -top-20

            -z-10

            h-52
            w-52

            rounded-full

            bg-blue-400/[0.08]

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

            -z-10

            h-56
            w-56

            rounded-full

            bg-cyan-400/[0.08]

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            left-1/2
            top-10

            -z-10

            h-40
            w-72

            -translate-x-1/2

            rounded-full

            bg-slate-200/20

            blur-3xl
          "
        />

        {/* ===================================================
            FORM
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
          <ReceiveForm
            vendors={vendors}
            materials={materials}
            documentNo={documentNo}
          />
        </div>
      </section>
    </AppPage>
  );
}