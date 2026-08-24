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

  // =====================================================
  // ดึงเฉพาะพัสดุที่มีจำนวนคงเหลือน้อยกว่า 10
  // แสดงตั้งแต่ 0 - 9
  // =====================================================

  const materials = await prisma.material.findMany({
    where: {
      balance: {
        lt: 10,
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
            ⚠️ รายการพัสดุใกล้หมด
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
            แสดงรายการพัสดุที่มีจำนวนคงเหลือน้อยกว่า 10
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
          Search Box
      ===================================================== */}

      <form method="GET">
        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            p-4
            shadow-xl
          "
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              className="
                flex-1
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                px-4
                py-3
                text-base
                font-semibold
                text-white
                placeholder:text-slate-400
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-500/20
              "
            />

            <button
              type="submit"
              className="
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-6
                py-3
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:scale-105
                hover:shadow-xl
                active:scale-95
              "
            >
              ค้นหา
            </button>

            {search && (
              <Link
                href="/materials/low-stock"
                className="
                  rounded-xl
                  border
                  border-slate-600
                  bg-slate-800
                  px-5
                  py-3
                  text-center
                  font-extrabold
                  !text-white
                  shadow
                  transition
                  hover:scale-105
                  hover:bg-slate-700
                  active:scale-95
                "
              >
                ล้างค้นหา
              </Link>
            )}

            <div
              className="
                rounded-xl
                border
                border-slate-600
                bg-slate-800
                px-5
                py-3
                text-center
                font-extrabold
                !text-white
              "
            >
              พบ {totalLowStock} รายการ
            </div>
          </div>
        </div>
      </form>

      {/* =====================================================
          Category Sections
      ===================================================== */}

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
              bg-white
              shadow-lg
            "
          >
            {/* =================================================
                Category Header
            ================================================= */}

            <div
              className="
                flex
                items-center
                justify-between
                bg-gradient-to-r
                from-slate-950
                via-slate-800
                to-slate-700
                px-6
                py-4
                text-white
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-2xl">
                  {categoryIcons[category]}
                </span>

                <h2
                  className="
                    break-words
                    text-2xl
                    font-extrabold
                    !text-white
                  "
                >
                  {categoryName[category] ?? category}
                </h2>
              </div>

              <span
                className="
                  shrink-0
                  rounded-lg
                  bg-white/10
                  px-4
                  py-2
                  font-bold
                  !text-white
                "
              >
                {categoryMaterials.length} รายการ
              </span>
            </div>

            {/* =================================================
                Table
                ให้ table เป็นเจ้าของกรอบเพียงตัวเดียว
            ================================================= */}

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
                  border
                  border-black
                  bg-white
                "
              >
                <thead>
                  <tr>
                    <th
                      className="
                        whitespace-nowrap
                        border
                        border-black
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
                      ลำดับ
                    </th>

                    <th
                      className="
                        whitespace-nowrap
                        border
                        border-black
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
                      รหัสพัสดุ
                    </th>

                    <th
                      className="
                        border
                        border-black
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
                      รายการพัสดุ
                    </th>

                    <th
                      className="
                        whitespace-nowrap
                        border
                        border-black
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
                      จำนวน
                    </th>

                    <th
                      className="
                        whitespace-nowrap
                        border
                        border-black
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
                      หน่วย
                    </th>

                    <th
                      className="
                        whitespace-nowrap
                        border
                        border-black
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
                      ราคา
                    </th>

                    <th
                      className="
                        border
                        border-black
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
                        hover:bg-blue-50
                      "
                    >
                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
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
                          whitespace-nowrap
                          border
                          border-black
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
                          border-black
                          px-4
                          py-3
                          font-bold
                        "
                      >
                        {material.name || "-"}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          bg-red-50
                          px-4
                          py-3
                          text-center
                          text-lg
                          font-extrabold
                          text-red-700
                        "
                      >
                        {material.balance ?? 0}
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
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
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3
                          text-right
                          font-semibold
                        "
                      >
                        {material.latestPrice !== null
                          ? material.latestPrice.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-4
                          py-3
                          font-semibold
                        "
                      >
                        {material.latestVendor || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

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
              : "ขณะนี้พัสดุทุกรายการมีจำนวนคงเหลือตั้งแต่ 10 รายการขึ้นไป"}
          </p>
        </div>
      )}
    </div>
  );
}