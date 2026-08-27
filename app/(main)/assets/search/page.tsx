import Link from "next/link";
import { prisma } from "@/lib/prisma";

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const statusName: Record<string, string> = {
  IN_USE: "ใช้งานอยู่",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AssetSearchPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const assets = q
    ? await prisma.asset.findMany({
        where: {
          OR: [
            {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              brand: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              model: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              serialNumber: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              governmentAssetNo: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              officeAssetNo: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              location: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              department: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
            {
              section: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
            {
              officer: {
                OR: [
                  {
                    firstName: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                  {
                    lastName: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          ],
        },
        include: {
          department: true,
          section: true,
          officer: true,
        },
        orderBy: {
          id: "asc",
        },
      })
    : [];

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
          items-center
          justify-between
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
          sm:min-h-[140px]
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
              sm:text-3xl
            "
          >
            🔎 ค้นหาครุภัณฑ์
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            ค้นหาครุภัณฑ์จากเลขทะเบียน ชื่อครุภัณฑ์ ผู้ครอบครอง หรือหน่วยงาน
          </p>
        </div>
      </div>

      {/* =====================================================
          Search
      ===================================================== */}

      <form
        method="GET"
        className="
          flex
          w-full
          flex-col
          gap-3
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-lg
          sm:flex-row
          sm:items-center
          sm:p-5
        "
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ค้นหา เช่น เลขครุภัณฑ์ ชื่อครุภัณฑ์ ผู้ครอบครอง..."
          className="
            min-w-0
            flex-1
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-semibold
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-emerald-600
            focus:ring-2
            focus:ring-emerald-200
          "
        />

        <button
          type="submit"
          className="
            w-full
            shrink-0
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
            hover:scale-[1.02]
            hover:from-emerald-700
            hover:to-green-600
            sm:w-auto
          "
        >
          🔎 ค้นหา
        </button>

        {q && (
          <Link
            href="/assets/search"
            className="
              w-full
              shrink-0
              rounded-xl
              bg-gradient-to-r
              from-slate-700
              to-slate-900
              px-6
              py-3
              text-center
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              sm:w-auto
            "
          >
            ล้าง
          </Link>
        )}
      </form>

      {/* =====================================================
          Result Summary
      ===================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-300
          bg-white
          px-4
          py-4
          shadow-lg
          sm:px-6
        "
      >
        <p className="font-extrabold text-slate-900">
          {q
            ? `ผลการค้นหา "${q}"`
            : "กรุณาระบุคำค้นหา"}
        </p>

        {q && (
          <p className="mt-1 font-semibold text-slate-600">
            พบครุภัณฑ์ทั้งหมด {assets.length} รายการ
          </p>
        )}
      </div>

      {/* =====================================================
          Result Table
      ===================================================== */}

      {q && (
        <div
          className="
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-black
            bg-white
            shadow-xl
          "
        >
          <div className="w-full overflow-x-auto">
            <table
              className="
                w-full
                min-w-[1200px]
                border-collapse
                text-sm
              "
            >
              <thead>
                <tr
                  className="
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    !text-white
                  "
                >
                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    ลำดับ
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    ประเภท
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    รายการครุภัณฑ์
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    เลขครุภัณฑ์กรม
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    เลขครุภัณฑ์ประจำสำนัก
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    ผู้ครอบครอง
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    กลุ่มงาน
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    สถานะ
                  </th>

                  <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                    รายละเอียด
                  </th>
                </tr>
              </thead>

              <tbody>
                {assets.map((asset, index) => (
                  <tr
                    key={asset.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
                    <td className="border border-black px-3 py-4 text-center font-bold">
                      {index + 1}
                    </td>

                    <td className="border border-black px-3 py-4 text-center font-semibold">
                      {categoryName[asset.category] ??
                        asset.category}
                    </td>

                    <td className="border border-black px-3 py-4 font-semibold">
                      <p className="font-extrabold">
                        {asset.name}
                      </p>

                      {(asset.brand || asset.model) && (
                        <p className="mt-1 text-sm text-slate-600">
                          {[asset.brand, asset.model]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      )}

                      {asset.serialNumber && (
                        <p className="mt-1 text-xs text-slate-500">
                          S/N: {asset.serialNumber}
                        </p>
                      )}
                    </td>

                    <td className="border border-black px-3 py-4 text-center font-semibold">
                      {asset.governmentAssetNo ?? "-"}
                    </td>

                    <td className="border border-black px-3 py-4 text-center font-semibold">
                      {asset.officeAssetNo ?? "-"}
                    </td>

                    <td className="border border-black px-3 py-4 font-semibold">
                      {asset.officer
                        ? `${asset.officer.firstName} ${asset.officer.lastName}`
                        : "-"}
                    </td>

                    <td className="border border-black px-3 py-4 font-semibold">
                      <p>
                        {asset.department.name}
                      </p>

                      {asset.section && (
                        <p className="mt-1 text-sm text-slate-600">
                          {asset.section.name}
                        </p>
                      )}
                    </td>

                    <td className="border border-black px-3 py-4 text-center">
                      <span
                        className={`
                          inline-flex
                          rounded-lg
                          px-3
                          py-2
                          text-xs
                          font-extrabold
                          ${
                            asset.status === "IN_USE"
                              ? "bg-emerald-100 text-emerald-800"
                              : asset.status ===
                                  "WAITING_DISPOSAL"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-800"
                          }
                        `}
                      >
                        {statusName[asset.status] ??
                          asset.status}
                      </span>
                    </td>

                    <td className="border border-black px-3 py-4 text-center">
                      <Link
                        href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}`}
                        className="
                          inline-flex
                          rounded-lg
                          bg-gradient-to-r
                          from-slate-800
                          to-slate-950
                          px-4
                          py-2
                          font-extrabold
                          !text-white
                          shadow
                          transition
                          hover:scale-105
                        "
                      >
                        ดูข้อมูล
                      </Link>
                    </td>
                  </tr>
                ))}

                {assets.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="
                        border
                        border-black
                        px-6
                        py-12
                        text-center
                        font-semibold
                        text-slate-500
                      "
                    >
                      ไม่พบข้อมูลครุภัณฑ์ที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}