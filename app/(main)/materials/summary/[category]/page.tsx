import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
] as const;

type Category = (typeof categories)[number];

type PageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function MaterialsSummaryCategoryPage({
  params,
}: PageProps) {
  const { category } = await params;

  const categoryCode = category.toUpperCase();

  if (!categories.includes(categoryCode as Category)) {
    notFound();
  }

  const materials = await prisma.material.findMany({
    where: {
      category: categoryCode as Category,
    },

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

    // =====================================================
    // คำนวณยอดคงเหลือแบบเดียวกับ Stock Card
    //
    // ยอดคงเหลือ = รับเข้าทั้งหมด - เบิกจ่ายทั้งหมด
    // =====================================================

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

      // ราคาจากรายการรับเข้าล่าสุด
      latestPrice: latestReceive
        ? Number(latestReceive.unitPrice)
        : null,

      // ผู้จำหน่ายจากรายการรับเข้าล่าสุด
      latestVendor:
        latestReceive?.receive.vendor?.name ?? "-",
    };
  });

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5">
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
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:px-6
          sm:py-6
        "
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
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
              📦 {categoryName[categoryCode]}
            </h1>

            <p
              className="
                mt-2
                break-words
                text-sm
                font-semibold
                leading-tight
                !text-slate-200
                sm:text-xl
              "
            >
              รายการพัสดุทั้งหมดในหมวดนี้
            </p>
          </div>

          <Link
            href="/materials/summary"
            className="
              shrink-0
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-4
              py-2
              text-sm
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
              sm:px-5
              sm:py-3
              sm:text-base
            "
          >
            ← กลับ
          </Link>
        </div>
      </div>

      {/* Summary */}

      <div
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
            from-slate-950
            via-slate-800
            to-slate-700
            px-3
            py-4
            text-white
            sm:px-6
          "
        >
          <h2
            className="
              break-words
              text-lg
              font-extrabold
              !text-white
              sm:text-2xl
            "
          >
            {categoryName[categoryCode]}
          </h2>

          <span
            className="
              shrink-0
              rounded-lg
              bg-white/10
              px-3
              py-2
              text-sm
              font-bold
              text-white
              sm:px-4
              sm:text-base
            "
          >
            {data.length} รายการ
          </span>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table
            className="
              min-w-full
              border-collapse
              border
              border-slate-900
            "
          >
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "จำนวน",
                  "หน่วย",
                  "ราคา",
                  "ผู้จำหน่ายล่าสุด",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
                      py-4
                      text-center
                      text-base
                      font-extrabold
                      text-white
                      sm:text-lg
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      border
                      border-slate-900
                      py-10
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ยังไม่มีพัสดุในหมวดนี้
                  </td>
                </tr>
              ) : (
                data.map((material, index) => (
                  <tr
                    key={material.id}
                    className="
                      border
                      border-slate-900
                      text-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-bold
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
                        font-bold
                      "
                    >
                      {material.code || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-bold
                      "
                    >
                      {material.name || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                      "
                    >
                      {material.balance ?? 0}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-semibold
                      "
                    >
                      {material.unit || "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-right
                        font-semibold
                      "
                    >
                      {material.latestPrice === null
                        ? "-"
                        : material.latestPrice.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-semibold
                      "
                    >
                      {material.latestVendor || "-"}
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