import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "💺",
  MONITOR: "❄️",
  TELEPHONE: "☎️",
  CABINET: "🗄️",
  COMPUTER: "💻",
  PRINTER: "🖨️",
  OTHER: "📦",
  SHELF: "❓",
};

const categoryOrder = [
  "DESK",
  "CHAIR",
  "MONITOR",
  "TELEPHONE",
  "CABINET",
  "COMPUTER",
  "PRINTER",
  "OTHER",
  "SHELF",
];

export default async function DepartmentAssetsPage({
  params,
}: Props) {
  const { departmentId } = await params;

  const id = Number(departmentId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const department = await prisma.department.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          assets: true,
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  const assets = await prisma.asset.findMany({
    where: {
      departmentId: id,
    },
    select: {
      category: true,
    },
  });

  const categoryCounts = new Map<string, number>();

  for (const asset of assets) {
    categoryCounts.set(
      asset.category,
      (categoryCounts.get(asset.category) ?? 0) + 1
    );
  }

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

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
            🏢 {department.name}
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            เลือกประเภทครุภัณฑ์เพื่อดูทะเบียนคุม
          </p>
        </div>

        <Link
          href="/assets"
          className="
            shrink-0
            whitespace-nowrap
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            leading-tight
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Summary
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          text-white
          shadow-xl
          sm:p-6
        "
      >
        <p className="text-sm font-bold !text-slate-300">
          ครุภัณฑ์ทั้งหมดของกลุ่มงาน
        </p>

        <p className="mt-1 text-3xl font-extrabold !text-white">
          {department._count.assets} รายการ
        </p>
      </div>

      {/* =====================================================
          Category Cards
      ===================================================== */}

      <div
        className="
          grid
          gap-5
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {categoryOrder.map((category) => {
          const count = categoryCounts.get(category) ?? 0;

          return (
            <Link
              key={category}
              href={`/assets/${department.id}/${category.toLowerCase()}`}
              className="
                group
                overflow-hidden
                rounded-2xl
                border
                border-slate-300
                bg-white
                shadow-lg
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
              "
            >
              {/* Top Bar */}

              <div
                className="
                  h-2
                  bg-gradient-to-r
                  from-slate-700
                  to-slate-900
                "
              />

              <div
                className="
                  flex
                  min-h-[220px]
                  flex-col
                  items-center
                  justify-between
                  gap-4
                  p-6
                  text-center
                "
              >
                {/* Icon */}

                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-100
                    text-4xl
                    shadow-md
                    transition
                    duration-300
                    group-hover:scale-110
                  "
                >
                  {categoryIcon[category]}
                </div>

                {/* Name / Count */}

                <div>
                  <h2
                    className="
                      text-xl
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {categoryName[category]}
                  </h2>

                  <p
                    className="
                      mt-2
                      text-lg
                      font-bold
                      text-slate-600
                    "
                  >
                    {count} รายการ
                  </p>
                </div>

                {/* Button */}

                <span
                  className="
                    rounded-xl
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-950
                    px-7
                    py-2.5
                    font-extrabold
                    text-white
                    shadow-lg
                    transition
                    group-hover:scale-105
                  "
                >
                  เปิด
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}