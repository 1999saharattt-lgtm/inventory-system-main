import Link from "next/link";
import { prisma } from "@/lib/prisma";

const categories = [
  {
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
    icon: "📄",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
    icon: "💻",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
    icon: "⚡",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
    icon: "🏠",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
    icon: "🚗",
  },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
    icon: "📰",
  },
];

export default async function MaterialsExportPage() {
  const materials = await prisma.material.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      unit: true,
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
              sm:text-5xl
            "
          >
            📋 รวมรายการพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-xl
            "
          >
            รายการพัสดุแยกตามหมวดหมู่
          </p>
        </div>

        <Link
          href="/materials"
          className="
            shrink-0
            rounded-xl
            bg-white
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            text-slate-900
            shadow-lg
            transition
            hover:scale-105
            hover:bg-slate-100
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* Summary */}
      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-lg
          sm:p-6
        "
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-2xl">
              รายการพัสดุทั้งหมด
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500 sm:text-base">
              จำนวนทั้งหมด {materials.length} รายการ
            </p>
          </div>

          {/* Export PDF */}
          <Link
            href="/materials/export/pdf"
            target="_blank"
            className="
              shrink-0
              rounded-xl
              bg-slate-900
              px-4
              py-2
              text-sm
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:bg-slate-700
              sm:px-6
              sm:py-3
              sm:text-lg
            "
          >
            🖨️ ส่งออก PDF
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-5">
        {categories.map((category) => {
          const categoryMaterials = materials.filter(
            (material) => material.category === category.code
          );

          return (
            <div
              key={category.code}
              className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-300
                bg-white
                shadow-lg
              "
            >
              {/* Category Header */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-950
                  px-4
                  py-3
                  text-white
                  sm:px-6
                  sm:py-4
                "
              >
                <h2 className="text-lg font-extrabold sm:text-2xl">
                  {category.icon} {category.name}
                </h2>

                <span className="shrink-0 text-sm font-bold text-slate-200 sm:text-base">
                  {categoryMaterials.length} รายการ
                </span>
              </div>

              {/* Table */}
              {categoryMaterials.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-700 sm:px-5">
                          ลำดับ
                        </th>

                        <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-700 sm:px-5">
                          รหัสพัสดุ
                        </th>

                        <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-700 sm:px-5">
                          รายการพัสดุ
                        </th>

                        <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-700 sm:px-5">
                          หน่วยนับ
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {categoryMaterials.map((material, index) => (
                        <tr
                          key={material.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="border-b border-slate-100 px-3 py-3 text-sm font-semibold text-slate-600 sm:px-5">
                            {index + 1}
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3 text-sm font-bold text-slate-800 sm:px-5">
                            {material.code}
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3 text-sm font-semibold text-slate-800 sm:px-5">
                            {material.name}
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3 text-sm font-semibold text-slate-600 sm:px-5">
                            {material.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm font-semibold text-slate-500 sm:text-base">
                  ไม่มีรายการพัสดุในหมวดนี้
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}