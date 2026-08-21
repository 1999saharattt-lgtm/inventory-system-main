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
            ],
          }
        : {}),
    },

    include: {
      receiveItems: {
        orderBy: {
          receive: {
            receiveDate: "desc",
          },
        },

        take: 1,

        include: {
          receive: {
            include: {
              vendor: true,
            },
          },
        },
      },
    },

    orderBy: {
      code: "asc",
    },
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
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
          sm:py-5
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
              sm:text-4xl
            "
          >
            {categoryNames[category]}
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
            รายการบัญชีพัสดุ จำนวน {materials.length} รายการ
          </p>
        </div>

        <Link
          href="/stock-card"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Search
      ===================================================== */}

      <SearchStockCard
        category={category}
        defaultSearch={search}
      />

      {/* =====================================================
          Table
      ===================================================== */}

      <div className="w-full min-w-0 overflow-x-auto">
        <table
          className="
            min-w-[900px]
            border
            border-slate-900
            border-collapse
          "
        >
          <thead>
            <tr>
              {[
                "ลำดับ",
                "รหัสพัสดุ",
                "รายการพัสดุ",
                "หน่วย",
                "ผู้จำหน่ายล่าสุด",
                "บัญชีพัสดุ",
              ].map((title) => (
                <th
                  key={title}
                  className="
                    whitespace-nowrap
                    border
                    border-slate-900
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-4
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="
                    border
                    border-slate-900
                    py-12
                    text-center
                    text-lg
                    font-bold
                    text-slate-500
                  "
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              materials.map((material, index) => {
                const latestReceive = material.receiveItems[0];

                const latestVendor =
                  latestReceive?.receive.vendor?.name ?? "-";

                return (
                  <tr
                    key={material.id}
                    className="hover:bg-blue-50"
                  >
                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {material.code}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {material.name}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {material.unit}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {latestVendor}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                      "
                    >
                      <Link
                        href={`/stock-card/material/${material.id}`}
                        className="
                          inline-block
                          rounded-xl
                          bg-gradient-to-r
                          from-emerald-600
                          to-green-500
                          px-5
                          py-2
                          font-extrabold
                          text-white
                          shadow-lg
                          transition
                          hover:scale-105
                        "
                      >
                        เปิด
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}