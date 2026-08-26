import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
  }>;
};

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  CABINET: "ตู้",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอคอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "โทรศัพท์",
  SHELF: "ชั้น/ชั้นวาง",
  OTHER: "อื่น ๆ",
};

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "💺",
  CABINET: "🗄️",
  COMPUTER: "💻",
  MONITOR: "🖥️",
  PRINTER: "🖨️",
  TELEPHONE: "☎️",
  SHELF: "🗂️",
  OTHER: "📦",
};

export default async function AssetCategoryPage({
  params,
}: Props) {
  const { departmentId, category } = await params;

  const departmentIdNumber = Number(departmentId);

  if (!Number.isInteger(departmentIdNumber)) {
    notFound();
  }

  const normalizedCategory = category.toUpperCase();

  const validCategories = Object.keys(categoryName);

  if (!validCategories.includes(normalizedCategory)) {
    notFound();
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentIdNumber,
    },
  });

  if (!department) {
    notFound();
  }

  const assets = await prisma.asset.findMany({
    where: {
      departmentId: departmentIdNumber,
      category: normalizedCategory as
        | "DESK"
        | "CHAIR"
        | "CABINET"
        | "COMPUTER"
        | "MONITOR"
        | "PRINTER"
        | "TELEPHONE"
        | "SHELF"
        | "OTHER",
    },
    include: {
      section: true,
      officer: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
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
          sm:flex-row
          sm:items-center
          sm:justify-between
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
            {categoryIcon[normalizedCategory]}{" "}
            {categoryName[normalizedCategory]}
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            {department.name} — ทะเบียนคุมครุภัณฑ์
          </p>
        </div>

        <Link
          href={`/assets/${department.id}`}
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Search
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          to-slate-800
          p-4
          shadow-xl
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
          "
        >
          <input
            type="text"
            placeholder="ค้นหารายการ / เลขครุภัณฑ์กรม / เลขครุภัณฑ์ประจำสำนัก"
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
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />

          <button
            type="submit"
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
              py-3
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-105
              sm:w-auto
            "
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* =====================================================
          Toolbar
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-5
        "
      >
        <div>
          <p className="text-lg font-extrabold !text-white">
            รายการ{categoryName[normalizedCategory]}
          </p>

          <p className="mt-1 text-sm font-semibold !text-slate-200">
            พบทั้งหมด {assets.length} รายการ
          </p>
        </div>

        <Link
          href={`/assets/${department.id}/${normalizedCategory}/new`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            text-center
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
          "
        >
          + เพิ่มครุภัณฑ์
        </Link>
      </div>

      {/* =====================================================
          ตาราง
      ===================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              min-w-[1100px]
              border-collapse
              border
              border-black
              text-sm
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    w-[6%]
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
                    w-[16%]
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
                  รายการ
                </th>

                <th
                  className="
                    w-[14%]
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
                  เลขครุภัณฑ์กรม
                </th>

                <th
                  className="
                    w-[16%]
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
                  เลขครุภัณฑ์ประจำสำนัก
                </th>

                <th
                  className="
                    w-[16%]
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
                  ผู้ครอบครอง
                </th>

                <th
                  className="
                    w-[12%]
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
                  กลุ่มงาน
                </th>

                <th
                  className="
                    w-[10%]
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
                  สถานะ
                </th>

                <th
                  className="
                    w-[10%]
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
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-900">
              {assets.map((asset, index) => (
                <tr
                  key={asset.id}
                  className="
                    text-slate-900
                    transition
                    hover:bg-emerald-50
                  "
                >
                  <td
                    className="
                      border
                      border-black
                      px-4
                      py-3
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {index + 1}
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-4
                      py-3
                      font-extrabold
                      text-slate-900
                    "
                  >
                    <div className="font-extrabold">
                      {asset.name}
                    </div>

                    {(asset.brand || asset.model) && (
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {[asset.brand, asset.model]
                          .filter(Boolean)
                          .join(" / ")}
                      </div>
                    )}
                  </td>

                  <td
                    className="
                      break-all
                      border
                      border-black
                      px-4
                      py-3
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {asset.governmentAssetNo ?? "-"}
                  </td>

                  <td
                    className="
                      break-all
                      border
                      border-black
                      px-4
                      py-3
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {asset.officeAssetNo ?? "-"}
                  </td>

                  <td
                    className="
                      break-words
                      border
                      border-black
                      px-4
                      py-3
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {asset.officer
                      ? `${asset.officer.firstName} ${asset.officer.lastName}`
                      : "-"}
                  </td>

                  <td
                    className="
                      break-words
                      border
                      border-black
                      px-4
                      py-3
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {asset.section?.name ?? "-"}
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-4
                      py-3
                      text-center
                      font-extrabold
                    "
                  >
                    {asset.status === "IN_USE" && (
                      <span className="text-emerald-700">
                        ยังใช้งาน
                      </span>
                    )}

                    {asset.status === "WAITING_DISPOSAL" && (
                      <span className="text-amber-700">
                        รอจำหน่าย
                      </span>
                    )}

                    {asset.status === "DISPOSED" && (
                      <span className="text-red-700">
                        จำหน่ายแล้ว
                      </span>
                    )}
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-4
                      py-3
                      text-center
                    "
                  >
                    <Link
                      href={`/assets/${department.id}/${normalizedCategory}/${asset.id}`}
                      className="
                        whitespace-nowrap
                        rounded-lg
                        bg-gradient-to-r
                        from-emerald-600
                        to-green-500
                        px-4
                        py-2
                        font-extrabold
                        !text-white
                        shadow
                        transition
                        hover:scale-105
                      "
                    >
                      ดูรายละเอียด
                    </Link>
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
                      py-12
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ยังไม่มีครุภัณฑ์ประเภทนี้ในหน่วยงาน
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