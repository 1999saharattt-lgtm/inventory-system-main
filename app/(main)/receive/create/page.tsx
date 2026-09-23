import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

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
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          RECEIVE FORM CARD

          ใช้ AppCard กลางของระบบ
          เพื่อให้ Card หลักของหน้า Create
          เป็นมาตรฐานเดียวกับหน้าอื่น

          ภายใน ReceiveForm สามารถใช้:
          - AppInfoCard
          - AppTableCard
          ได้ตามปกติ
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
            RECEIVE FORM
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
      </AppCard>
    </AppPage>
  );
}