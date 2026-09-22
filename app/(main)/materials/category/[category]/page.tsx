import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import QRCodeButton from "./QRCodeButton";
import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";

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
            {/* เพิ่มรายการ */}

            <Link
              href="/materials/new"
              prefetch
              className="
                group
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-[16px]
                border
                border-emerald-200/80
                bg-emerald-500
                px-4
                text-sm
                font-extrabold
                !text-white
                shadow-[0_12px_28px_-16px_rgba(16,185,129,0.55)]
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:bg-emerald-600
                hover:shadow-[0_18px_34px_-18px_rgba(16,185,129,0.65)]
                active:translate-y-0
                active:scale-[0.97]
                sm:px-5
              "
            >
              <span
                className="
                  text-lg
                  leading-none
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              >
                +
              </span>

              <span>เพิ่มรายการ</span>
            </Link>

            {/* กลับ */}

            <Link
              href="/materials"
              prefetch
              className="
                group
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-[16px]
                border
                border-slate-200
                bg-white/90
                px-4
                text-sm
                font-extrabold
                !text-slate-800
                shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)]
                backdrop-blur-xl
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:border-slate-300
                hover:bg-white
                hover:shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)]
                active:translate-y-0
                active:scale-[0.97]
                sm:px-5
              "
            >
              <span
                className="
                  transition-transform
                  duration-300
                  group-hover:-translate-x-0.5
                "
              >
                ←
              </span>

              <span>กลับ</span>
            </Link>
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
          border-white/80
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
          {/* Search Input */}

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
                border-slate-200
                bg-slate-50/80
                py-3
                pl-12
                pr-4
                text-base
                font-bold
                !text-slate-900
                shadow-inner
                outline-none
                transition-all
                duration-300
                placeholder:!text-slate-400
                hover:border-slate-300
                hover:bg-white
                focus:border-blue-400
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          {/* Search Button */}

          <button
            type="submit"
            className="
              inline-flex
              min-h-[48px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[16px]
              bg-slate-900
              px-6
              py-3
              text-sm
              font-extrabold
              !text-white
              shadow-[0_12px_28px_-16px_rgba(15,23,42,0.55)]
              transition-all
              duration-300
              ease-out
              hover:-translate-y-0.5
              hover:bg-slate-800
              hover:shadow-[0_18px_34px_-18px_rgba(15,23,42,0.6)]
              active:translate-y-0
              active:scale-[0.97]
              sm:w-auto
            "
          >
            <span>🔎</span>
            <span>ค้นหา</span>
          </button>

          {/* Clear Search */}

          {search && (
            <Link
              href={`/materials/category/${category}`}
              prefetch
              className="
                inline-flex
                min-h-[48px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-[16px]
                border
                border-slate-200
                bg-white
                px-5
                py-3
                text-sm
                font-extrabold
                !text-slate-700
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-slate-50
                active:translate-y-0
                active:scale-[0.97]
                sm:w-auto
              "
            >
              <span>✕</span>
              <span>ล้างการค้นหา</span>
            </Link>
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
          border-white/80
          bg-white/85
          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]
          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            TABLE HEADER
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2
            border-b
            border-slate-200/80
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
              border-slate-200
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
              min-w-[1200px]
              w-full
              border-separate
              border-spacing-0
              bg-transparent
              shadow-none
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
                      whitespace-nowrap
                      border-b
                      border-r
                      border-slate-600
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
                      py-4
                      text-center
                      text-base
                      font-extrabold
                      !text-white
                      first:border-l-0
                      last:border-r-0
                      sm:text-lg
                    "
                  >
                    {title}
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
                          group/row
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
                        {/* รหัสพัสดุ */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
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
                              border-slate-200
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

                        {/* รายการ */}

                        <td
                          className="
                            min-w-[240px]
                            border-b
                            border-r
                            border-slate-200
                            px-4
                            py-3.5
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {material.name}
                        </td>

                        {/* จำนวน */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
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
                                    ring-red-100
                                  `
                                  : material.balance < 10
                                    ? `
                                      bg-amber-50
                                      !text-amber-600
                                      ring-1
                                      ring-amber-100
                                    `
                                    : `
                                      bg-emerald-50
                                      !text-emerald-700
                                      ring-1
                                      ring-emerald-100
                                    `
                              }
                            `}
                          >
                            {material.balance}
                          </span>
                        </td>

                        {/* หน่วย */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
                            px-4
                            py-3.5
                            text-center
                            font-bold
                            !text-slate-700
                          "
                        >
                          {material.unit}
                        </td>

                        {/* ราคาล่าสุด */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
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

                        {/* วันผลิต */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
                            px-4
                            py-3.5
                            text-center
                            font-bold
                            !text-slate-700
                          "
                        >
                          {latestReceive?.manufacture
                            ? new Date(
                                latestReceive.manufacture
                              ).toLocaleDateString(
                                "th-TH"
                              )
                            : "-"}
                        </td>

                        {/* วันหมดอายุ */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
                            px-4
                            py-3.5
                            text-center
                            font-bold
                            !text-slate-700
                          "
                        >
                          {latestReceive?.expiry
                            ? new Date(
                                latestReceive.expiry
                              ).toLocaleDateString(
                                "th-TH"
                              )
                            : "-"}
                        </td>

                        {/* จัดการ */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-r
                            border-slate-200
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
                            <Link
                              href={`/materials/${material.id}/edit`}
                              prefetch
                              className="
                                inline-flex
                                h-9
                                items-center
                                justify-center
                                gap-1.5
                                rounded-[12px]
                                border
                                border-slate-200
                                bg-white
                                px-3.5
                                text-sm
                                font-extrabold
                                !text-slate-800
                                shadow-sm
                                transition-all
                                duration-200
                                hover:-translate-y-0.5
                                hover:border-blue-200
                                hover:bg-blue-50
                                hover:!text-blue-700
                                active:translate-y-0
                                active:scale-[0.96]
                              "
                            >
                              <span>✏️</span>
                              <span>แก้ไข</span>
                            </Link>

                            <DeleteButton
                              id={material.id}
                            />
                          </div>
                        </td>

                        {/* QR Code */}

                        <td
                          className="
                            whitespace-nowrap
                            border-b
                            border-slate-200
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
                        <Link
                          href={`/materials/category/${category}`}
                          prefetch
                          className="
                            mt-5
                            inline-flex
                            h-10
                            items-center
                            justify-center
                            rounded-[14px]
                            bg-slate-900
                            px-5
                            text-sm
                            font-extrabold
                            !text-white
                            shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)]
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-slate-800
                            active:translate-y-0
                            active:scale-[0.97]
                          "
                        >
                          แสดงรายการทั้งหมด
                        </Link>
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