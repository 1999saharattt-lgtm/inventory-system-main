import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatThaiDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function getInspectorCount(value: unknown) {
  if (!value) return 0;

  if (Array.isArray(value)) {
    return value.filter(Boolean).length;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).length;
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean).length;
    }
  }

  return 0;
}

type HistoryItem = {
  departmentId: number;
  departmentName: string;
  year: string;
  inspectionStartDate: Date | string | null;
  inspectionEndDate: Date | string | null;
  assetIds: Set<number>;
  inspectorCount: number;
};

export default async function InspectionHistoryPage() {
  const inspections = await prisma.assetInspection.findMany({
    include: {
      asset: {
        include: {
          department: true,
        },
      },
    },
    orderBy: {
      year: "desc",
    },
  });

  const historyMap = new Map<string, HistoryItem>();

  for (const inspection of inspections) {
    const department = inspection.asset?.department;

    if (!department) continue;

    const year = String(inspection.year);
    const key = `${department.id}-${year}`;

    const existing = historyMap.get(key);

    if (!existing) {
      historyMap.set(key, {
        departmentId: department.id,
        departmentName: department.name,
        year,
        inspectionStartDate: inspection.inspectionStartDate,
        inspectionEndDate: inspection.inspectionEndDate,
        assetIds: new Set([inspection.assetId]),
        inspectorCount: getInspectorCount(inspection.inspectorIds),
      });

      continue;
    }

    existing.assetIds.add(inspection.assetId);

    const inspectorCount = getInspectorCount(inspection.inspectorIds);

    if (inspectorCount > existing.inspectorCount) {
      existing.inspectorCount = inspectorCount;
    }

    if (
      inspection.inspectionStartDate &&
      (!existing.inspectionStartDate ||
        new Date(inspection.inspectionStartDate) <
          new Date(existing.inspectionStartDate))
    ) {
      existing.inspectionStartDate = inspection.inspectionStartDate;
    }

    if (
      inspection.inspectionEndDate &&
      (!existing.inspectionEndDate ||
        new Date(inspection.inspectionEndDate) >
          new Date(existing.inspectionEndDate))
    ) {
      existing.inspectionEndDate = inspection.inspectionEndDate;
    }
  }

  const history = Array.from(historyMap.values()).sort((a, b) => {
    const yearCompare =
      Number(b.year.replace(/\D/g, "")) - Number(a.year.replace(/\D/g, ""));

    if (yearCompare !== 0) return yearCompare;

    return a.departmentName.localeCompare(b.departmentName, "th");
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
          items-start
          justify-between
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
          sm:flex-row
          sm:items-center
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-extrabold leading-tight !text-white sm:text-3xl">
            📋 ประวัติการตรวจสอบครุภัณฑ์ประจำปี
          </h1>

          <p className="mt-2 break-words text-sm font-semibold leading-tight !text-slate-200 sm:mt-3 sm:text-base">
            แสดงประวัติการตรวจสอบครุภัณฑ์แยกตามกลุ่มงานและปีงบประมาณ
          </p>
        </div>

        <Link
          href="/assets"
          className="
            inline-flex
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-slate-200
            px-5
            py-2.5
            text-base
            font-extrabold
            text-slate-800
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:bg-slate-300
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          History Table
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ลำดับ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ชื่อกลุ่มงาน
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ประจำปีงบประมาณ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  วันที่เริ่มตรวจสอบ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  วันที่ตรวจสอบแล้วเสร็จ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  จำนวนครุภัณฑ์
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ผู้ตรวจสอบ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  รายละเอียดข้อมูล
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold !text-white">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {history.map((item, index) => (
                <tr
                  key={`${item.departmentId}-${item.year}`}
                  className="bg-white transition hover:bg-slate-50"
                >
                  <td className="border border-black px-3 py-3 text-center font-semibold text-slate-800">
                    {index + 1}
                  </td>

                  <td className="border border-black px-4 py-3 text-left font-extrabold text-slate-900">
                    {item.departmentName}
                  </td>

                  <td className="border border-black px-3 py-3 text-center font-extrabold text-slate-900">
                    พ.ศ. {item.year}
                  </td>

                  <td className="border border-black px-3 py-3 text-center font-semibold text-slate-700">
                    {formatThaiDate(item.inspectionStartDate)}
                  </td>

                  <td className="border border-black px-3 py-3 text-center font-semibold text-slate-700">
                    {formatThaiDate(item.inspectionEndDate)}
                  </td>

                  <td className="border border-black px-3 py-3 text-center font-semibold text-slate-700">
                    {item.assetIds.size.toLocaleString("th-TH")} รายการ
                  </td>

                  <td className="border border-black px-3 py-3 text-center font-semibold text-slate-700">
                    {item.inspectorCount.toLocaleString("th-TH")} คน
                  </td>

                  <td className="border border-black px-3 py-3 text-center">
                    <Link
                      href={`/assets/${item.departmentId}/inspection-history/${item.year}`}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-lg
                        bg-gradient-to-r
                        from-sky-700
                        to-cyan-600
                        px-5
                        py-2
                        text-sm
                        font-extrabold
                        !text-white
                        shadow-md
                        transition
                        hover:scale-[1.03]
                        hover:from-sky-800
                        hover:to-cyan-700
                      "
                    >
                      เปิด
                    </Link>
                  </td>

                  <td className="border border-black px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/assets/${item.departmentId}/inspection-history/${item.year}/edit`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-gradient-to-r
                          from-amber-500
                          to-orange-500
                          px-4
                          py-2
                          text-sm
                          font-extrabold
                          !text-white
                          shadow-md
                          transition
                          hover:scale-[1.03]
                          hover:from-amber-600
                          hover:to-orange-600
                        "
                      >
                        แก้ไข
                      </Link>

                      <button
                        type="button"
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-gradient-to-r
                          from-red-700
                          to-red-500
                          px-4
                          py-2
                          text-sm
                          font-extrabold
                          !text-white
                          shadow-md
                          transition
                          hover:scale-[1.03]
                          hover:from-red-800
                          hover:to-red-600
                        "
                        title="ขั้นถัดไปจะเชื่อมการลบพร้อมกล่องยืนยัน"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="border border-black px-4 py-12 text-center text-lg font-semibold text-slate-500"
                  >
                    ยังไม่มีประวัติการตรวจสอบครุภัณฑ์ประจำปี
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
