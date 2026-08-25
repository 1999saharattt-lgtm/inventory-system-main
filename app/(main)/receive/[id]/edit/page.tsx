import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditReceiveForm from "./EditReceiveForm";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditReceivePage({
  params,
}: Props) {
  const { id } = await params;

  const receive = await prisma.receive.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  if (!receive) {
    return (
      <div
        className="
          rounded-2xl
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-6
          text-xl
          font-bold
          text-white
        "
      >
        ไม่พบรายการรับเข้าพัสดุ
      </div>
    );
  }

  const materials = await prisma.material.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],
  });

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Header */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            ✏️ แก้ไขรายการรับเข้าพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            แก้ไขรายละเอียดเอกสารและรายการพัสดุ
          </p>
        </div>

        <Link
          href="/receive"
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
            sm:px-5
            sm:py-3
            sm:text-lg
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
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-4
          shadow-xl
          sm:p-6
        "
      >
        <EditReceiveForm
          receive={receive}
          vendors={vendors}
          materials={materials}
        />
      </div>
    </div>
  );
}