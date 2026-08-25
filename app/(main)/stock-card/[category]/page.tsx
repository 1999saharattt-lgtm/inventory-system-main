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
          min-h-[110px]
          w-full
          min-w-0
          flex-col
          justify-center
          gap-4
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
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:gap-4
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
              sm:text-4xl
            "
          >
            {categoryNames[category]}
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
              sm:text-lg
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
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:w-auto
            sm:px-5
            sm:py-3
            sm:text-lg
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
          ไม่มีกรอบ wrapper ซ้ำ
          ไม่มีเส้น div แยกออกจาก table
          เส้นล่างใช้ border ของ td แถวสุดท้าย
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          max-w-full
          overflow-x-auto
          overscroll-x-contain
        "
      >
        <table
          className="
            w-full
            min-w-[900px]
            border-collapse
            bg-white
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
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
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

          <tbody className="text-slate-900">
            {materials.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="
                    border
                    border-black
                    px-3
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
                const latestReceive =
                  material.receiveItems[0];

                const latestVendor =
                  latestReceive?.receive.vendor?.name ??
                  "-";

                const isLastRow =
                  index === materials.length - 1;

                const bottomBorder = isLastRow
                  ? "border-b-2 border-b-black"
                  : "";

                return (
                  <tr
                    key={material.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    <td
                      className={`
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        font-bold
                        ${bottomBorder}
                      `}
                    >
                      {index + 1}
                    </td>

                    <td
                      className={`
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        font-bold
                        ${bottomBorder}
                      `}
                    >
                      {material.code}
                    </td>

                    <td
                      className={`
                        border
                        border-black
                        px-3
                        py-3
                        font-semibold
                        ${bottomBorder}
                      `}
                    >
                      {material.name}
                    </td>

                    <td
                      className={`
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        ${bottomBorder}
                      `}
                    >
                      {material.unit}
                    </td>

                    <td
                      className={`
                        border
                        border-black
                        px-3
                        py-3
                        ${bottomBorder}
                      `}
                    >
                      {latestVendor}
                    </td>

                    <td
                      className={`
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        ${bottomBorder}
                      `}
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
                          !text-white
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