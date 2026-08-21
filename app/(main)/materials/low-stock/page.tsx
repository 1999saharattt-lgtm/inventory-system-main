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

type LowStockPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function LowStockPage({
  searchParams,
}: LowStockPageProps) {
  const params = await searchParams;
  const search = (params.q ?? "").trim().toLowerCase();

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

  const data = materials
    .map((material) => {
      const latestReceive = material.receiveItems[0];

      return {
        id: material.id,
        category: material.category,
        code: material.code,
        name: material.name,
        balance: Number(material.balance),
        unit: material.unit,

        latestPrice: latestReceive
          ? Number(latestReceive.unitPrice)
          : null,

        latestVendor:
          latestReceive?.receive.vendor?.name ?? "-",
      };
    })
    .filter((material) => {
      if (!search) {
        return true;
      }

      return (
        material.code.toLowerCase().includes(search) ||
        material.name.toLowerCase().includes(search) ||
        material.unit.toLowerCase().includes(search) ||
        material.latestVendor.toLowerCase().includes(search)
      );
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
            ⚠️ พัสดุใกล้หมด
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
            แสดงเฉพาะพัสดุที่มีจำนวนคงเหลือน้อยกว่าหรือเท่ากับจุดขั้นต่ำ
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
            text-white
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
          Search
      ===================================================== */}

      <form
        method="GET"
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-r
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-5
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
          "
        >
          <div className="relative min-w-0 flex-1">
            <span
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-xl
              "
            >
              🔎
            </span>

            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                py-3
                pl-12
                pr-4
                text-base
                font-semibold
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-slate-500
                focus:bg-white
                focus:ring-2
                focus:ring-slate-300
              "
            />
          </div>

          <button
            type="submit"
            className="
              shrink-0
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-6
              py-3
              text-base
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
              sm:px-8
            "
          >
            ค้นหา
          </button>

          {search && (
            <Link
              href="/materials/low-stock"
              className="
                shrink-0
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                px-6
                py-3
                text-center
                text-base
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-105
                hover:bg-slate-700
                sm:px-8
              "
            >
              ล้างค้นหา
            </Link>
          )}

          <div
            className="
              shrink-0
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              px-5
              py-3
              text-center
              text-sm
              font-extrabold
              text-slate-200
              shadow
              sm:text-base
            "
          >
            พบ {totalLowStock} รายการ
          </div>
        </div>
      </form>

      {/* =====================================================
          Summary
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-r
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-5
        "
      >
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-white sm:text-xl">
            รายการพัสดุใกล้หมด
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-300 sm:text-base">
            {search
              ? `ผลการค้นหาสำหรับ "${params.q}"`
              : "แสดงรายการพัสดุที่มีจำนวนคงเหลือถึงจุดขั้นต่ำหรือต่ำกว่า"}
          </p>
        </div>

        <div
          className="
            w-fit
            shrink-0
            rounded-xl
            border
            border-slate-500
            bg-slate-700
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
                w-full
                min-w-0
                overflow-hidden
                rounded-2xl
                border
                border-slate-300
                bg-white
                shadow-xl
              "
            >
              {/* =================================================
                  Category Header
              ================================================= */}

              <div
                className="
                  flex
                  min-w-0
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
                  <span className="shrink-0 text-2xl">
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
                    shrink-0
                    rounded-xl
                    border
                    border-slate-500
                    bg-slate-700
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

              {/* =================================================
                  Table
              ================================================= */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr
                      className="
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                      "
                    >
                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        ลำดับ
                      </th>

                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        รหัสพัสดุ
                      </th>

                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-left
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        รายการพัสดุ
                      </th>

                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        จำนวน
                      </th>

                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-center
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        หน่วย
                      </th>

                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-right
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        ราคา
                      </th>

                      <th
                        className="
                          border
                          border-slate-600
                          px-3
                          py-3
                          text-left
                          text-base
                          font-extrabold
                          text-white
                        "
                      >
                        ผู้จำหน่ายล่าสุด
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {categoryMaterials.map((material, index) => (
                      <tr
                        key={material.id}
                        className="
                          bg-white
                          text-slate-700
                          transition
                          hover:bg-slate-50
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
                            text-slate-700
                          "
                        >
                          {material.name}
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
            {search
              ? "ไม่พบพัสดุที่ค้นหา"
              : "ไม่มีพัสดุใกล้หมด"}
          </h2>

          <p
            className="
              mt-2
              font-semibold
              text-emerald-700
            "
          >
            {search
              ? "ลองค้นหาด้วยรหัสพัสดุ ชื่อพัสดุ หน่วย หรือผู้จำหน่ายอื่น"
              : "ขณะนี้พัสดุทุกรายการมีจำนวนมากกว่าจุดขั้นต่ำ"}
          </p>
        </div>
      )}
    </div>
  );
}