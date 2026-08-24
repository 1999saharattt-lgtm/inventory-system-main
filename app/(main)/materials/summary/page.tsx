import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MaterialsSummaryClient from "./MaterialsSummaryClient";
import { getCurrentUser } from "@/lib/auth";

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const categoryIcons: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
};

export default async function MaterialsSummaryPage() {
  // =====================================================
  // ตรวจสอบ Session
  // =====================================================

  const user = await getCurrentUser();
  const role = user?.role ?? "VIEWER";

  // =====================================================
  // ADMIN
  //
  // แสดงข้อมูลพัสดุทั้งหมด
  // =====================================================

  if (role === "ADMIN") {
    const materials = await prisma.material.findMany({
      orderBy: {
        code: "asc",
      },

      include: {
        receiveItems: {
          orderBy: {
            receive: {
              receiveDate: "desc",
            },
          },

          include: {
            receive: {
              include: {
                vendor: true,
              },
            },
          },
        },

        issueItems: true,
      },
    });

    const data = materials.map((material) => {
      const latestReceive = material.receiveItems[0];

      const totalReceive = material.receiveItems.reduce(
        (sum, item) => sum + item.qty,
        0
      );

      const totalIssue = material.issueItems.reduce(
        (sum, item) => sum + item.qty,
        0
      );

      const balance = totalReceive - totalIssue;

      return {
        id: material.id,
        category: material.category,
        code: material.code,
        name: material.name,
        balance,
        unit: material.unit,

        latestPrice: latestReceive
          ? Number(latestReceive.unitPrice)
          : null,

        latestVendor:
          latestReceive?.receive.vendor?.name ?? "-",
      };
    });

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
            w-full
            min-w-0
            flex-col
            gap-4
            rounded-3xl
            bg-gradient-to-r
            from-slate-950
            via-slate-800
            to-slate-700
            p-5
            text-white
            shadow-xl
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:p-7
          "
        >
          <div className="min-w-0">
            <h1
              className="
                break-words
                text-3xl
                font-extrabold
                leading-tight
                !text-white
                sm:text-5xl
              "
            >
              📦 รายการพัสดุทั้งหมด
            </h1>

            <p
              className="
                mt-2
                break-words
                text-base
                font-bold
                !text-slate-200
                sm:text-xl
              "
            >
              แสดงข้อมูลล่าสุดจากบัญชี Stock Card
            </p>
          </div>

          <Link
            href="/"
            className="
              w-full
              shrink-0
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
              py-3
              text-center
              text-base
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-105
              sm:w-auto
              sm:text-lg
            "
          >
            ← กลับ
          </Link>
        </div>

        {/* =====================================================
            Materials Summary
        ===================================================== */}

        <MaterialsSummaryClient
          materials={data}
          categories={categories}
          categoryName={categoryName}
          role={role}
        />
      </div>
    );
  }

  // =====================================================
  // STAFF / VIEWER
  //
  // แสดงหน้าเลือกหมวด
  // =====================================================

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
          w-full
          min-w-0
          flex-col
          rounded-3xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-5
          text-white
          shadow-xl
          sm:p-7
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-3xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-5xl
            "
          >
            📦 รายการพัสดุทั้งหมด
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-bold
              !text-slate-200
              sm:text-xl
            "
          >
            เลือกหมวดหมู่เพื่อดูรายการพัสดุ
          </p>
        </div>
      </div>

      {/* =====================================================
          Category Cards
      ===================================================== */}

      <div
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-3
          sm:gap-5
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {categories.map((category) => (
          <Link
            key={category}
            href={`/materials/summary/${category}`}
            className="
              group
              min-w-0
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
            {/* =====================================================
                Top Color
            ===================================================== */}

            <div
              className="
                h-1.5
                bg-gradient-to-r
                from-slate-700
                to-slate-900
                sm:h-2
              "
            />

            <div
              className="
                flex
                min-h-[170px]
                min-w-0
                flex-col
                items-center
                gap-2
                p-3
                text-center
                sm:min-h-[230px]
                sm:gap-5
                sm:p-6
              "
            >
              {/* =====================================================
                  Icon
              ===================================================== */}

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-100
                  text-xl
                  shadow-md
                  transition
                  duration-300
                  group-hover:scale-110
                  sm:h-16
                  sm:w-16
                  sm:text-3xl
                "
              >
                {categoryIcons[category]}
              </div>

              {/* =====================================================
                  Name
              ===================================================== */}

              <div className="min-w-0 max-w-full">
                <h2
                  className="
                    mt-1
                    break-words
                    text-base
                    font-extrabold
                    leading-tight
                    text-slate-900
                    sm:mt-5
                    sm:text-xl
                  "
                >
                  {categoryName[category]}
                </h2>

                <p
                  className="
                    mt-1
                    break-words
                    text-xs
                    font-semibold
                    leading-tight
                    text-slate-600
                    sm:mt-2
                    sm:text-lg
                  "
                >
                  คลิกเพื่อดูรายการพัสดุในหมวดนี้
                </p>
              </div>

              {/* =====================================================
                  Open
              ===================================================== */}

              <span
                className="
                  mt-1
                  rounded-xl
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-950
                  px-5
                  py-2
                  text-sm
                  font-extrabold
                  text-white
                  shadow-lg
                  transition
                  group-hover:scale-105
                  sm:mt-5
                  sm:px-8
                  sm:py-3
                  sm:text-lg
                "
              >
                เปิด
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}