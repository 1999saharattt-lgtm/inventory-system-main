import { prisma } from "@/lib/prisma";
import Link from "next/link";

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  CABINET: "ตู้",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอคอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "โทรศัพท์",
  SHELF: "ชั้นใส่แฟ้ม",
  OTHER: "อื่น ๆ",
};

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

export default async function AllAssetsPage() {
  const assets = await prisma.asset.findMany({
    orderBy: [
      {
        department: {
          name: "asc",
        },
      },
      {
        category: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      department: true,
      section: true,
      officer: true,
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
            📋 ทะเบียนครุภัณฑ์ทั้งหมด
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
            รายการครุภัณฑ์ทั้งหมดของสำนัก แยกตามหน่วยงานและประเภท
          </p>
        </div>
      </div>

      {/* =====================================================
          Summary
      ===================================================== */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-300
            bg-white
            p-5
            shadow-lg
          "
        >
          <p className="text-sm font-bold text-slate-500">
            ครุภัณฑ์ทั้งหมด
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {assets.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            รายการ
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-emerald-300
            bg-emerald-50
            p-5
            shadow-lg
          "
        >
          <p className="text-sm font-bold text-emerald-700">
            ยังใช้งาน
          </p>

          <p className="mt-2 text-3xl font-extrabold text-emerald-800">
            {assets.filter((asset) => asset.status === "IN_USE").length}
          </p>

          <p className="mt-1 text-sm font-semibold text-emerald-700">
            รายการ
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-amber-300
            bg-amber-50
            p-5
            shadow-lg
          "
        >
          <p className="text-sm font-bold text-amber-700">
            รอจำหน่าย
          </p>

          <p className="mt-2 text-3xl font-extrabold text-amber-800">
            {
              assets.filter(
                (asset) => asset.status === "WAITING_DISPOSAL"
              ).length
            }
          </p>

          <p className="mt-1 text-sm font-semibold text-amber-700">
            รายการ
          </p>
        </div>
      </div>

      {/* =====================================================
          Table
      ===================================================== */}

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
                <th className="w-[5%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ลำดับ
                </th>

                <th className="w-[13%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  หน่วยงาน
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ประเภท
                </th>

                <th className="w-[22%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  รายการครุภัณฑ์
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  เลขครุภัณฑ์กรม
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  เลขครุภัณฑ์ประจำสำนัก
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ผู้ครอบครอง
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  สถานะ
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
                  {/* ลำดับ */}

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                      font-bold
                    "
                  >
                    {index + 1}
                  </td>

                  {/* หน่วยงาน */}

                  <td
                    className="
                      break-words
                      border
                      border-black
                      px-3
                      py-4
                      font-semibold
                    "
                  >
                    {asset.department.name}
                  </td>

                  {/* ประเภท */}

                  <td
                    className="
                      break-words
                      border
                      border-black
                      px-3
                      py-4
                      font-semibold
                    "
                  >
                    {categoryName[asset.category] ?? asset.category}
                  </td>

                  {/* รายการ */}

                  <td
                    className="
                      break-words
                      border
                      border-black
                      px-3
                      py-4
                      font-semibold
                    "
                  >
                    <Link
                      href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}`}
                      className="
                        font-extrabold
                        text-slate-900
                        underline-offset-4
                        hover:text-blue-700
                        hover:underline
                      "
                    >
                      {asset.name}
                    </Link>

                    {(asset.brand || asset.model) && (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {[asset.brand, asset.model]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </td>

                  {/* เลขครุภัณฑ์กรม */}

                  <td
                    className="
                      break-all
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                      font-semibold
                    "
                  >
                    {asset.governmentAssetNo ?? "-"}
                  </td>

                  {/* เลขครุภัณฑ์ประจำสำนัก */}

                  <td
                    className="
                      break-all
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                      font-semibold
                    "
                  >
                    {asset.officeAssetNo ?? "-"}
                  </td>

                  {/* ผู้ครอบครอง */}

                  <td
                    className="
                      break-words
                      border
                      border-black
                      px-3
                      py-4
                      font-semibold
                    "
                  >
                    {asset.officer
                      ? `${asset.officer.firstName} ${asset.officer.lastName}`
                      : "-"}
                  </td>

                  {/* สถานะ */}

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                    "
                  >
                    <span
                      className={`
                        inline-flex
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-extrabold
                        ${
                          asset.status === "IN_USE"
                            ? "bg-emerald-100 text-emerald-800"
                            : asset.status === "WAITING_DISPOSAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-800"
                        }
                      `}
                    >
                      {statusName[asset.status] ?? asset.status}
                    </span>
                  </td>
                </tr>
              ))}

              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-black
                      px-6
                      py-12
                      text-center
                      text-lg
                      font-semibold
                      text-slate-500
                    "
                  >
                    ยังไม่มีข้อมูลครุภัณฑ์
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