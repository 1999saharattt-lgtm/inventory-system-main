import Link from "next/link";

import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

import ReceiveForm from "./ReceiveForm";

function getThaiYear() {
  return String(
    new Date().getFullYear() + 543
  ).slice(-2);
}

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
      const lastNumber = Number(match[1]);
      const lastYear = match[2];

      if (
        lastYear === year &&
        lastNumber >= running
      ) {
        running = lastNumber + 1;
      }
    }
  }

  return `ร.${String(running).padStart(
    2,
    "0"
  )}/${year}`;
}

export default async function CreateReceivePage() {
  const [
    materials,
    vendors,
    documentNo,
  ] = await Promise.all([
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

    generateReceiveNo(),
  ]);

  return (
    <AppPage>
      {/* =====================================================
          Header
      ===================================================== */}

      <AppPageHeader
        icon="📥"
        title="บันทึกการรับเข้าพัสดุ"
        subtitle="เพิ่มรายการรับเข้าพัสดุเข้าสู่ระบบ"
        actions={
          <Link
            href="/receive"
            className="
              group
              inline-flex
              h-11
              min-w-[104px]
              shrink-0
              items-center
              justify-center
              gap-2
              whitespace-nowrap
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
              focus:outline-none
              focus:ring-4
              focus:ring-slate-400/15
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
          Receive Form
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-white/80
          bg-white/80
          p-4
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
          sm:p-6
        "
      >
        {/* Ambient Background */}

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

        <div className="relative">
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