import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import ReceiveForm from "./ReceiveForm";

/* =========================================================
   THAI FISCAL YEAR

   ปีงบประมาณไทย:
   1 ตุลาคม - 30 กันยายน

   ใช้เวลา Asia/Bangkok
   ไม่ขึ้นอยู่กับ timezone ของ Server

   ตัวอย่าง:
   30 ก.ย. 2569 => ปีงบประมาณ 2569
   1 ต.ค. 2569 => ปีงบประมาณ 2570
========================================================= */

function getThaiFiscalYear() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const fiscalYearGregorian =
    month >= 10 ? year + 1 : year;

  return fiscalYearGregorian + 543;
}

/* =========================================================
   GENERATE RECEIVE DOCUMENT NUMBER

   รูปแบบ:
   ร.01/70
   ร.02/70

   เริ่มเลขใหม่เมื่อเข้าสู่ปีงบประมาณใหม่

   หมายเหตุ:
   เลขที่แสดงบนฟอร์มเป็นเลขเบื้องต้น
   การบันทึกจริงควรสร้างเลขซ้ำอีกครั้ง
   ใน Server Action โดยใช้วันที่รับพัสดุจริง
========================================================= */

async function generateReceiveNo() {
  const fiscalYearThai = getThaiFiscalYear();

  const yearShort = String(fiscalYearThai).slice(-2);

  const receives = await prisma.receive.findMany({
    where: {
      documentNo: {
        startsWith: "ร.",
      },
    },

    select: {
      documentNo: true,
    },
  });

  let maxRunning = 0;

  for (const receive of receives) {
    const documentNo = String(
      receive.documentNo ?? ""
    ).trim();

    const match = documentNo.match(
      /^ร\.(\d+)\/(\d{2}|\d{4})$/
    );

    if (!match) {
      continue;
    }

    const running = Number(match[1]);
    const documentYear = match[2];

    const isSameFiscalYear =
      documentYear === yearShort ||
      documentYear === String(fiscalYearThai);

    if (
      !isSameFiscalYear ||
      !Number.isInteger(running) ||
      running <= 0
    ) {
      continue;
    }

    if (running > maxRunning) {
      maxRunning = running;
    }
  }

  const nextRunning = maxRunning + 1;

  return `ร.${String(nextRunning).padStart(2, "0")}/${yearShort}`;
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