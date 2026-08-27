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

const inspectionStatusName: Record<string, string> = {
  IN_USE: "ใช้งานอยู่",
  RETURNED: "ส่งคืน",
  DAMAGED: "ชำรุด",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const quarterName: Record<string, string> = {
  Q1: "ไตรมาส 1",
  Q2: "ไตรมาส 2",
  Q3: "ไตรมาส 3",
  Q4: "ไตรมาส 4",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AssetInspectionPage() {
  const currentYear = new Date().getFullYear();

  const inspections = await prisma.assetInspection.findMany({
    orderBy: [
      {
        inspectionDate: "desc",
      },
      {
        id: "desc",
      },
    ],
    include: {
      asset: {
        include: {
          department: true,
          section: true,
          officer: true,
        },
      },
    },
  });

  const currentYearInspections = inspections.filter(
    (inspection) => inspection.year === currentYear
  );

  const totalInspections = inspections.length;

  const inUseCount = inspections.filter(
    (inspection) => inspection.status === "IN_USE"
  ).length;

  const problemCount = inspections.filter(
    (inspection) =>
      inspection.status !== "IN_USE"
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
            🔍 ตรวจสอบครุภัณฑ์
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
            ประวัติและผลการตรวจสอบครุภัณฑ์ของแต่ละกลุ่มงาน
          </p>
        </div>

        <Link
          href="/assets/inspection/pending"
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-emerald-700
            hover:to-green-600
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          📋 รายการรอตรวจ
        </Link>
      </div>

      {/* =====================================================
          Summary
      ===================================================== */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-4
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
            ประวัติการตรวจทั้งหมด
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {totalInspections}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            รายการ
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-blue-300
            bg-blue-50
            p-5
            shadow-lg
          "
        >
          <p className="text-sm font-bold text-blue-700">
            ตรวจในปี {currentYear + 543}
          </p>

          <p className="mt-2 text-3xl font-extrabold text-blue-800">
            {currentYearInspections.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-700">
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
            ผลตรวจปกติ
          </p>

          <p className="mt-2 text-3xl font-extrabold text-emerald-800">
            {inUseCount}
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
            ต้องติดตาม
          </p>

          <p className="mt-2 text-3xl font-extrabold text-amber-800">
            {problemCount}
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
              min-w-[1300px]
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

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  วันที่ตรวจ
                </th>

                <th className="w-[9%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  รอบ
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  หน่วยงาน
                </th>

                <th className="w-[10%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ประเภท
                </th>

                <th className="w-[20%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ครุภัณฑ์
                </th>

                <th className="w-[12%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ผู้ครอบครอง
                </th>

                <th className="w-[10%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ผลตรวจ
                </th>

                <th className="w-[10%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  รายละเอียด
                </th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection, index) => (
                <tr
                  key={inspection.id}
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

                  {/* วันที่ตรวจ */}

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
                    {formatDate(inspection.inspectionDate)}
                  </td>

                  {/* รอบ */}

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
                    <p>
                      {quarterName[inspection.quarter] ??
                        inspection.quarter}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      พ.ศ. {inspection.year + 543}
                    </p>
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
                    <p>{inspection.asset.department.name}</p>

                    {inspection.asset.section && (
                      <p className="mt-1 text-xs text-slate-500">
                        {inspection.asset.section.name}
                      </p>
                    )}
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
                    {categoryName[inspection.asset.category] ??
                      inspection.asset.category}
                  </td>

                  {/* ครุภัณฑ์ */}

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
                      href={`/assets/${inspection.asset.departmentId}/${inspection.asset.category}/${inspection.asset.id}`}
                      className="
                        font-extrabold
                        text-slate-900
                        underline-offset-4
                        hover:text-blue-700
                        hover:underline
                      "
                    >
                      {inspection.asset.name}
                    </Link>

                    {inspection.asset.officeAssetNo && (
                      <p className="mt-1 text-xs text-slate-500">
                        เลขประจำสำนัก:{" "}
                        {inspection.asset.officeAssetNo}
                      </p>
                    )}
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
                    {inspection.asset.officer
                      ? `${inspection.asset.officer.firstName} ${inspection.asset.officer.lastName}`
                      : "-"}
                  </td>

                  {/* ผลตรวจ */}

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
                        py-2
                        text-xs
                        font-extrabold
                        ${
                          inspection.status === "IN_USE"
                            ? "bg-emerald-100 text-emerald-800"
                            : inspection.status === "RETURNED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }
                      `}
                    >
                      {inspectionStatusName[
                        inspection.status
                      ] ?? inspection.status}
                    </span>
                  </td>

                  {/* รายละเอียด */}

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                    "
                  >
                    <Link
                      href={`/assets/${inspection.asset.departmentId}/${inspection.asset.category}/${inspection.asset.id}/inspection`}
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
                      ดูประวัติ
                    </Link>
                  </td>
                </tr>
              ))}

              {inspections.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
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
                    ยังไม่มีประวัติการตรวจสอบครุภัณฑ์
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