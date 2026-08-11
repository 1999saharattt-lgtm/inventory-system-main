import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import QRCodeButton from "./QRCodeButton";

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

type Category =
  | "OFFICE"
  | "COMPUTER"
  | "ELECTRIC"
  | "HOUSEHOLD"
  | "VEHICLE"
  | "PRINTING";

type Material = {
  id: number;
  code: string;
  name: string;
  balance: number;
  unit: string;
  latestPrice: {
    toLocaleString(
      locale?: string,
      options?: Intl.NumberFormatOptions
    ): string;
  };
  receiveItems: {
    manufacture: Date | null;
    expiry: Date | null;
  }[];
};

type Props = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const { category } = await params;
  const { search } = await searchParams;

  const materials = await prisma.material.findMany({
    where: {
      category: category as Category,

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
          id: "desc",
        },
        take: 1,
      },
    },

    orderBy: {
      code: "asc",
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
              !text-white
              text-5xl
              font-extrabold
              leading-tight
            "
          >
            {categoryName[category]}
          </h1>

          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            รายการพัสดุในหมวดนี้
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/materials/new"
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
            + เพิ่มรายการ
          </Link>

          <Link
            href="/materials"
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
      </div>

      {/* Search */}

      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          to-slate-800
          p-5
          shadow-xl
        "
      >
        <form className="flex gap-3">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
            className="
              flex-1
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              text-black
            "
          />

          <button
            type="submit"
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
            ค้นหา
          </button>
        </form>
      </div>

      {/* Table */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              min-w-full
              border
              border-slate-900
            "
          >
            <thead>
              <tr>
                {[
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "จำนวน",
                  "หน่วย",
                  "ราคาล่าสุด",
                  "วันผลิต",
                  "วันหมดอายุ",
                  "จัดการ",
                  "QR Code",
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
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {materials.length > 0 ? (
                materials.map((material: Material) => (
                  <tr
                    key={material.id}
                    className="
                      hover:bg-blue-50
                    "
                  >
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
                      {material.balance}
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
                        text-right
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {material.latestPrice.toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
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
                      {material.receiveItems[0]?.manufacture
                        ? new Date(
                            material.receiveItems[0].manufacture
                          ).toLocaleDateString("th-TH")
                        : "-"}
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
                      {material.receiveItems[0]?.expiry
                        ? new Date(
                            material.receiveItems[0].expiry
                          ).toLocaleDateString("th-TH")
                        : "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                      "
                    >
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/materials/${material.id}/edit`}
                          className="
                            rounded-lg
                            bg-slate-800
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow
                            transition
                            hover:bg-amber-600
                            hover:bg-slate-700
                          "
                        >
                          แก้ไข
                        </Link>

                        <DeleteButton
                          id={material.id}
                        />
                      </div>
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
                      <div className="flex justify-center">
                        <QRCodeButton
                          materialId={material.id}
                          materialCode={material.code}
                          materialName={material.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      py-12
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ยังไม่มีพัสดุในหมวดนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}