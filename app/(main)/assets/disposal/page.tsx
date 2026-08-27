import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statusName = {
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
} as const;

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

export default async function AssetDisposalPage() {
  const assets = await prisma.asset.findMany({
    where: {
      status: {
        in: ["WAITING_DISPOSAL", "DISPOSED"],
      },
    },
    include: {
      department: true,
      section: true,
      officer: true,
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const waitingCount = assets.filter(
    (asset) => asset.status === "WAITING_DISPOSAL"
  ).length;

  const disposedCount = assets.filter(
    (asset) => asset.status === "DISPOSED"
  ).length;

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
            🗃️ ทะเบียนครุภัณฑ์รอจำหน่าย / จำหน่ายแล้ว
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
            ตรวจสอบรายการครุภัณฑ์ที่อยู่ระหว่างการจำหน่ายและรายการที่จำหน่ายแล้ว
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
        "
      >
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
          <p className="text-sm font-bold text-amber-800">
            รอจำหน่าย
          </p>

          <p className="mt-2 text-3xl font-extrabold text-amber-900">
            {waitingCount}
          </p>

          <p className="mt-1 text-sm font-semibold text-amber-700">
            รายการ
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-300
            bg-slate-50
            p-5
            shadow-lg
          "
        >
          <p className="text-sm font-bold text-slate-700">
            จำหน่ายแล้ว
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {disposedCount}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-600">
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
              min-w-[1100px]
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
                <th className="w-[6%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ลำดับ
                </th>

                <th className="w-[18%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  รายการครุภัณฑ์
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ประเภท
                </th>

                <th className="w-[14%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  เลขครุภัณฑ์กรม
                </th>

                <th className="w-[14%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  เลขครุภัณฑ์ประจำสำนัก
                </th>

                <th className="w-[13%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  กลุ่มงาน
                </th>

                <th className="w-[13%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ผู้ครอบครอง
                </th>

                <th className="w-[10%] border border-black px-3 py-4 text-center font-extrabold !text-white">
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

                  {/* รายการ */}

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                    "
                  >
                    <Link
                      href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}`}
                      className="
                        font-extrabold
                        text-slate-900
                        underline-offset-2
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

                  {/* ประเภท */}

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                      font-semibold
                    "
                  >
                    {categoryName[asset.category] ??
                      asset.category}
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

                  {/* กลุ่มงาน */}

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
                    {asset.section?.name ??
                      asset.department.name}
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
                        rounded-lg
                        px-3
                        py-1.5
                        text-xs
                        font-extrabold
                        ${
                          asset.status ===
                          "WAITING_DISPOSAL"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-800"
                        }
                      `}
                    >
                      {statusName[asset.status]}
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
                    ยังไม่มีครุภัณฑ์ที่อยู่ในสถานะรอจำหน่ายหรือจำหน่ายแล้ว
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