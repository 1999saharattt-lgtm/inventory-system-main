import Link from "next/link";
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
];

const categoryIcons: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
};

export default async function LowStockPage() {
  const materials = await prisma.material.findMany({
    where: {
      balance: {
        lte: prisma.material.fields.minimumStock,
      },
    },

    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],

    include: {
      receiveItems: {
        orderBy: [
          {
            receive: {
              receiveDate: "desc",
            },
          },
          {
            id: "desc",
          },
        ],

        include: {
          receive: {
            include: {
              vendor: true,
            },
          },
        },
      },
    },
  });

  const data = materials.map((material) => {
    const latestReceive = material.receiveItems[0];

    return {
      id: material.id,
      category: material.category,
      code: material.code,
      name: material.name,
      balance: Number(material.balance),
      minimumStock: Number(material.minimumStock),
      unit: material.unit,

      latestPrice: latestReceive
        ? Number(latestReceive.unitPrice)
        : null,

      latestVendor:
        latestReceive?.receive.vendor?.name ?? "-",
    };
  });

  const totalLowStock = data.length;

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
          from-red-950
          via-red-900
          to-slate-800
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
            ⚠️ พัสดุใกล้หมด
          </h1>

          <p
            className="
              mt-2
              break-words
              text-base
              font-bold
              !text-red-100
              sm:text-xl
            "
          >
            แสดงเฉพาะพัสดุที่มีจำนวนคงเหลือน้อยกว่าหรือเท่ากับจุดขั้นต่ำ
          </p>
        </div>

        <Link
          href="/"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-white
            px-5
            py-3
            text-center
            text-base
            font-extrabold
            text-slate-900
            shadow-lg
            transition
            hover:scale-105
            hover:bg-slate-100
            sm:w-auto
            sm:text-lg
          "
        >
          ← กลับหน้าหลัก
        </Link>
      </div>

      {/* =====================================================
          Summary
      ===================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-red-200
          bg-red-50
          p-4
          shadow-md
          sm:p-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p className="text-lg font-extrabold text-red-800">
              รายการที่ต้องติดตาม
            </p>

            <p className="mt-1 text-sm font-semibold text-red-700 sm:text-base">
              พัสดุที่มีจำนวนคงเหลือถึงจุดขั้นต่ำหรือต่ำกว่า
            </p>
          </div>

          <div
            className="
              w-fit
              rounded-xl
              bg-red-600
              px-5
              py-2
              text-xl
              font-extrabold
              text-white
              shadow
            "
          >
            {totalLowStock} รายการ
          </div>
        </div>
      </div>

      {/* =====================================================
          Category Sections
      ===================================================== */}

      <div className="space-y-5">
        {categories.map((category) => {
          const categoryMaterials = data.filter(
            (material) => material.category === category
          );

          if (categoryMaterials.length === 0) {
            return null;
          }

          return (
            <div
              key={category}
              className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-xl
              "
            >
              {/* Category Header */}

              <div
                className="
                  flex
                  flex-col
                  gap-2
                  bg-gradient-to-r
                  from-slate-950
                  via-slate-800
                  to-slate-700
                  px-4
                  py-4
                  text-white
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-6
                "
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">
                    {categoryIcons[category]}
                  </span>

                  <h2
                    className="
                      break-words
                      text-xl
                      font-extrabold
                      !text-white
                      sm:text-2xl
                    "
                  >
                    {categoryName[category]}
                  </h2>
                </div>

                <span
                  className="
                    w-fit
                    rounded-xl
                    bg-red-600
                    px-4
                    py-2
                    text-sm
                    font-extrabold
                    text-white
                    shadow
                    sm:text-base
                  "
                >
                  {categoryMaterials.length} รายการ
                </span>
              </div>

              {/* Table */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th
                        className="
                          border
                          border-slate-300
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-slate-900
                        "
                      >
                        ลำดับ
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-slate-900
                        "
                      >
                        รหัสพัสดุ
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          px-3
                          py-3
                          text-left
                          text-base
                          font-extrabold
                          text-slate-900
                        "
                      >
                        รายการพัสดุ
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-slate-900
                        "
                      >
                        หน่วย
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          bg-red-100
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-red-800
                        "
                      >
                        คงเหลือ
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          bg-amber-100
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-amber-800
                        "
                      >
                        ขั้นต่ำ
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          px-3
                          py-3
                          text-right
                          text-base
                          font-extrabold
                          text-slate-900
                        "
                      >
                        ราคาล่าสุด
                      </th>

                      <th
                        className="
                          border
                          border-slate-300
                          px-3
                          py-3
                          text-left
                          text-base
                          font-extrabold
                          text-slate-900
                        "
                      >
                        ผู้จำหน่ายล่าสุด
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {categoryMaterials.map((material, index) => (
                      <tr
                        key={material.id}
                        className="
                          text-slate-900
                          transition
                          hover:bg-red-50
                        "
                      >
                        <td
                          className="
                            border
                            border-slate-300
                            px-3
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
                            border-slate-300
                            px-3
                            py-3
                            text-center
                            font-bold
                          "
                        >
                          {material.code}
                        </td>

                        <td
                          className="
                            border
                            border-slate-300
                            px-3
                            py-3
                            font-semibold
                          "
                        >
                          {material.name}
                        </td>

                        <td
                          className="
                            border
                            border-slate-300
                            px-3
                            py-3
                            text-center
                          "
                        >
                          {material.unit}
                        </td>

                        <td
                          className="
                            border
                            border-slate-300
                            bg-red-50
                            px-3
                            py-3
                            text-center
                            text-lg
                            font-extrabold
                            text-red-700
                          "
                        >
                          {material.balance}
                        </td>

                        <td
                          className="
                            border
                            border-slate-300
                            bg-amber-50
                            px-3
                            py-3
                            text-center
                            font-extrabold
                            text-amber-700
                          "
                        >
                          {material.minimumStock}
                        </td>

                        <td
                          className="
                            border
                            border-slate-300
                            px-3
                            py-3
                            text-right
                            font-semibold
                          "
                        >
                          {material.latestPrice !== null
                            ? material.latestPrice.toFixed(2)
                            : "-"}
                        </td>

                        <td
                          className="
                            border
                            border-slate-300
                            px-3
                            py-3
                          "
                        >
                          {material.latestVendor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          ไม่มีรายการ
      ===================================================== */}

      {data.length === 0 && (
        <div
          className="
            rounded-2xl
            border
            border-emerald-200
            bg-emerald-50
            p-8
            text-center
            shadow-md
          "
        >
          <div className="text-5xl">✅</div>

          <h2
            className="
              mt-4
              text-2xl
              font-extrabold
              text-emerald-800
            "
          >
            ไม่มีพัสดุใกล้หมด
          </h2>

          <p
            className="
              mt-2
              font-semibold
              text-emerald-700
            "
          >
            ขณะนี้พัสดุทุกรายการมีจำนวนมากกว่าจุดขั้นต่ำ
          </p>
        </div>
      )}
    </div>
  );
}