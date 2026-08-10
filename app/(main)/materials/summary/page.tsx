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

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return Number(value).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function MaterialsSummaryPage() {
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
  });

  return (
    <div className="space-y-6">

      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          text-white
          shadow-xl
        "
      >
        <div>

          <h1
            className="
              text-4xl
              font-extrabold
              !text-white
            "
          >
            📦 รายการพัสดุทั้งหมด
          </h1>

          <p
            className="
              mt-2
              text-xl
              font-semibold
              text-slate-200
            "
          >
            แสดงข้อมูลพัสดุล่าสุดจากบัญชี Stock Card
          </p>

        </div>

        <Link
          href="/"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          ← กลับ
        </Link>

      </div>

      {/* Categories */}

      {categories.map((category) => {

        const categoryMaterials = materials.filter(
          (material) => material.category === category
        );

        return (
          <div
            key={category}
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
                bg-gradient-to-r
                from-slate-800
                to-slate-700
                px-6
                py-4
                text-white
              "
            >

              <h2
                className="
                  text-2xl
                  font-extrabold
                  !text-white
                "
              >
                {categoryName[category] ?? category}
              </h2>

              <span
                className="
                  rounded-lg
                  bg-white/10
                  px-4
                  py-2
                  font-bold
                  text-white
                "
              >
                {categoryMaterials.length} รายการ
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
                          bg-slate-100
                          px-4
                          py-4
                          text-center
                          text-lg
                          font-extrabold
                          text-slate-900
                        "
                      >
                        {title}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {categoryMaterials.length === 0 ? (

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

                    categoryMaterials.map(
                      (material, index) => {

                        const latestReceive =
                          material.receiveItems[0];

                        const latestPrice =
                          latestReceive
                            ? Number(
                                latestReceive.unitPrice
                              )
                            : null;

                        const latestVendor =
                          latestReceive
                            ?.receive.vendor?.name ?? "-";

                        return (
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

                            {/* ลำดับ */}

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

                            {/* รหัสพัสดุ */}

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

                            {/* รายการ */}

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

                            {/* จำนวน */}

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

                            {/* หน่วย */}

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

                            {/* ราคาจากรับเข้าล่าสุด */}

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
                              {formatMoney(latestPrice)}
                            </td>

                            {/* ผู้จำหน่ายจากรับเข้าล่าสุด */}

                            <td
                              className="
                                border
                                border-slate-900
                                px-4
                                py-3
                                font-semibold
                              "
                            >
                              {latestVendor}
                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        );
      })}

    </div>
  );
}