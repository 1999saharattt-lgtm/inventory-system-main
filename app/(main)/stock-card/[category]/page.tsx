import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchStockCard from "./SearchStockCard";

type Props = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    search?: string;
  }>;
};

const categoryNames: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const { category } = await params;
  const { search = "" } = await searchParams;

  const materials = await prisma.material.findMany({
    where: {
      category: category as any,

      ...(search
        ? {
            OR: [
              {
                code: {
                  contains: search,
                },
              },
              {
                name: {
                  contains: search,
                },
              },
              {
                vendor: {
                  name: {
                    contains: search,
                  },
                },
              },
            ],
          }
        : {}),
    },

    include: {
      vendor: true,
    },

    orderBy: {
      code: "asc",
    },
  });

  return (
    <div className="space-y-8">

      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >
        <div>
          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-800
            "
          >
            {categoryNames[category]}
          </h1>

          <p className="mt-2 text-slate-600">
            จำนวน {materials.length} รายการ
          </p>
        </div>

        <Link
          href="/stock-card"
          className="
            rounded-lg
            bg-slate-200
            px-5
            py-3
            font-semibold
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-300
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* Search */}

      <SearchStockCard
        category={category}
        defaultSearch={search}
      />

      {/* Table */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-300
          bg-white
          shadow-sm
        "
      >
        <div className="overflow-x-auto">

          <table className="min-w-full border-collapse">

            <thead className="bg-slate-200">

              <tr className="text-sm font-semibold text-slate-800">

                <th className="w-20 border border-slate-300 px-4 py-3 text-center">
                  ลำดับ
                </th>

                <th className="border border-slate-300 px-4 py-3 text-center">
                  รหัสพัสดุ
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  รายการพัสดุ
                </th>

                <th className="border border-slate-300 px-4 py-3 text-center">
                  หน่วย
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  ผู้จำหน่าย
                </th>

                <th className="w-40 border border-slate-300 px-4 py-3 text-center">
                  บัญชีพัสดุ
                </th>

              </tr>

            </thead>

            <tbody>
                            {materials.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="
                      py-12
                      text-center
                      text-slate-500
                    "
                  >
                    ไม่พบข้อมูล
                  </td>

                </tr>

              ) : (

                materials.map((material, index) => (

                  <tr
                    key={material.id}
                    className="
                      odd:bg-white
                      even:bg-slate-50
                      hover:bg-blue-50
                      transition-colors
                    "
                  >

                    <td className="border border-slate-300 px-4 py-3 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-slate-300 px-4 py-3 text-center font-medium">
                      {material.code}
                    </td>

                    <td className="border border-slate-300 px-4 py-3">
                      {material.name}
                    </td>

                    <td className="border border-slate-300 px-4 py-3 text-center">
                      {material.unit}
                    </td>

                    <td className="border border-slate-300 px-4 py-3">
                      {material.vendor?.name ?? "-"}
                    </td>

                    <td className="border border-slate-300 px-4 py-3 text-center">

                      <Link
                        href={`/stock-card/material/${material.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-emerald-500
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-white
                          shadow-sm
                          transition
                          hover:bg-emerald-600
                        "
                      >
                        เปิด
                      </Link>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}