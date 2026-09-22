import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";
import QRCodeButton from "./QRCodeButton";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const categoryIcon: Record<string, string> = {
  OFFICE: "📄",
  COMPUTER: "💻",
  ELECTRIC: "⚡",
  HOUSEHOLD: "🏠",
  VEHICLE: "🚗",
  PRINTING: "📰",
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

/* =========================================================
   วันที่ไทยแบบย่อ
   ตัวอย่าง 01 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = thaiShortMonths[date.getMonth()];

  const buddhistYear = String(
    date.getFullYear() + 543
  ).slice(-2);

  return `${day} ${month} ${buddhistYear}`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const { category } = await params;
  const { search } = await searchParams;

  /* =========================================================
     DATA
  ========================================================= */

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

  const title =
    categoryName[category] ?? "รายการพัสดุ";

  const icon =
    categoryIcon[category] ?? "📦";

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon={icon}
        title={title}
        subtitle={`รายการพัสดุในหมวดนี้ทั้งหมด ${materials.length} รายการ`}
        actions={
          <>
            <AppButton
              href="/materials/new"
              variant="primary"
              size="md"
            >
              <span>＋</span>
              <span>เพิ่มรายการ</span>
            </AppButton>

            <AppButton
              href="/materials"
              variant="back"
              size="md"
              icon={<span>←</span>}
            >
              กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          rounded-[24px]
          border
          border-slate-200
          bg-white/80
          p-4
          shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
          sm:p-5
        "
      >
        <form
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
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-4
                flex
                items-center
                text-lg
              "
            >
              🔎
            </div>

            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
              className="
                min-h-[48px]
                w-full
                rounded-[16px]
                border
                border-black
                bg-white
                py-3
                pl-12
                pr-4
                text-base
                font-bold
                !text-slate-900
                outline-none
                transition-all
                duration-300
                placeholder:!text-slate-400

                hover:bg-slate-50

                focus:border-blue-600
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          <AppButton
            type="submit"
            variant="primary"
            size="md"
          >
            <span>🔎</span>
            <span>ค้นหา</span>
          </AppButton>

          {search && (
            <AppButton
              href={`/materials/category/${category}`}
              variant="outline"
              size="md"
            >
              <span>✕</span>
              <span>ล้างการค้นหา</span>
            </AppButton>
          )}
        </form>
      </section>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-slate-300
          bg-white/85
          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]
          backdrop-blur-2xl
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2
            border-b
            border-black
            bg-white/70
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900
                sm:text-xl
              "
            >
              รายการพัสดุ
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              {search
                ? `ผลการค้นหา “${search}”`
                : "ข้อมูลพัสดุทั้งหมดในหมวดนี้"}
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              border
              border-slate-300
              bg-slate-100/80
              px-3
              py-1.5
              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            <span>ทั้งหมด</span>

            <span
              className="
                inline-flex
                min-w-6
                items-center
                justify-center
                rounded-full
                bg-white
                px-2
                py-0.5
                !text-slate-900
                shadow-sm
              "
            >
              {materials.length}
            </span>
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div
          className="
            w-full
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1200px]
              border-collapse
              border
              border-black
              bg-white
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
                ].map((tableTitle) => (
                  <th
                    key={tableTitle}
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
                      text-base
                      font-extrabold
                      !text-white
                      sm:text-lg
                    "
                  >
                    {tableTitle}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {materials.length > 0 ? (
                materials.map(
                  (
                    material: Material,
                    index
                  ) => {
                    const latestReceive =
                      material.receiveItems[0];

                    return (
                      <tr
                        key={material.id}
                        className={`
                          transition-colors
                          duration-200

                          ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          hover:bg-blue-50/70
                        `}
                      >
                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          <span
                            className="
                              inline-flex
                              rounded-[10px]
                              border
                              border-black
                              bg-slate-100
                              px-2.5
                              py-1
                              text-sm
                              !text-slate-700
                            "
                          >
                            {material.code}
                          </span>
                        </td>

                        <td
                          className="
                            min-w-[240px]
                            border
                            border-black
                            px-4
                            py-3.5
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {material.name}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              min-w-[44px]
                              items-center
                              justify-center
                              rounded-full
                              px-3
                              py-1
                              text-sm

                              ${
                                material.balance <= 0
                                  ? `
                                    bg-red-50
                                    !text-red-600
                                    ring-1
                                    ring-red-200
                                  `
                                  : material.balance < 10
                                    ? `
                                      bg-amber-50
                                      !text-amber-600
                                      ring-1
                                      ring-amber-200
                                    `
                                    : `
                                      bg-emerald-50
                                      !text-emerald-700
                                      ring-1
                                      ring-emerald-200
                                    `
                              }
                            `}
                          >
                            {material.balance}
                          </span>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-bold
                            !text-slate-700
                          "
                        >
                          {material.unit}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-right
                            font-extrabold
                            tabular-nums
                            !text-slate-900
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
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-bold
                            !text-slate-700
                          "
                        >
                          {formatThaiShortDate(
                            latestReceive?.manufacture
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-bold
                            !text-slate-700
                          "
                        >
                          {formatThaiShortDate(
                            latestReceive?.expiry
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >
                            <AppButton
                              href={`/materials/${material.id}/edit`}
                              variant="outline"
                              size="sm"
                            >
                              <span>✏️</span>
                              <span>แก้ไข</span>
                            </AppButton>

                            <DeleteButton
                              id={material.id}
                            />
                          </div>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3
                            text-center
                          "
                        >
                          <div className="flex justify-center">
                            <QRCodeButton
                              materialId={
                                material.id
                              }
                              materialCode={
                                material.code
                              }
                              materialName={
                                material.name
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-black
                      bg-white
                      px-6
                      py-16
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                      "
                    >
                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center
                          rounded-[20px]
                          bg-slate-100
                          text-3xl
                          shadow-inner
                        "
                      >
                        📦
                      </div>

                      <p
                        className="
                          mt-4
                          text-lg
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {search
                          ? "ไม่พบพัสดุที่ค้นหา"
                          : "ยังไม่มีพัสดุในหมวดนี้"}
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        {search
                          ? "ลองค้นหาด้วยรหัสหรือชื่อพัสดุอื่น"
                          : "เมื่อเพิ่มพัสดุ รายการจะแสดงในส่วนนี้"}
                      </p>

                      {search && (
                        <div className="mt-5">
                          <AppButton
                            href={`/materials/category/${category}`}
                            variant="primary"
                            size="md"
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppPage>
  );
}