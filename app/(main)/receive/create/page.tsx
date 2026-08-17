import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReceiveForm from "./ReceiveForm";

function getThaiYear() {
  return String(
    new Date().getFullYear() + 543
  ).slice(-2);
}

async function generateReceiveNo() {
  const year = getThaiYear();

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

  let running = 1;

  for (const receive of receives) {
    const match = receive.documentNo.match(
      /ร\.(\d+)\/(\d+)/
    );

    if (match) {
      const lastNumber = Number(match[1]);
      const lastYear = match[2];

      if (lastYear === year) {
        if (lastNumber >= running) {
          running = lastNumber + 1;
        }
      }
    }
  }

  return `ร.${String(running).padStart(2, "0")}/${year}`;
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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Header */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-cyan-700
          p-4
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              tracking-wide
              !text-white
              sm:text-5xl
            "
          >
            📥 บันทึกการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-xl
            "
          >
            เพิ่มรายการรับเข้าพัสดุเข้าสู่ระบบ
          </p>
        </div>

        <Link
          href="/receive"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* Form */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-3
          shadow-xl
          sm:p-6
        "
      >
        <ReceiveForm
          vendors={vendors}
          materials={materials}
          documentNo={documentNo}
        />
      </div>
    </div>
  );
}