import Link from "next/link";
import { prisma } from "@/lib/prisma";

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  CABINET: "ตู้",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอคอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "โทรศัพท์",
  SHELF: "ชั้นวาง/ชั้นใส่แฟ้ม",
  OTHER: "อื่น ๆ",
};

export default async function PendingAssetInspectionPage() {
  const assets = await prisma.asset.findMany({
    where: {
      status: "IN_USE",
    },
    include: {
      department: true,
      section: true,
      officer: true,
      inspections: {
        orderBy: {
          inspectionDate: "desc",
        },
        take: 1,
      },
    },
    orderBy: [
      {
        departmentId: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let currentQuarter: "Q1" | "Q2" | "Q3" | "Q4";

  if (currentMonth <= 3) {
    currentQuarter = "Q1";
  } else if (currentMonth <= 6) {
    currentQuarter = "Q2";
  } else if (currentMonth <= 9) {
    currentQuarter = "Q3";
  } else {
    currentQuarter = "Q4";
  }

  const pendingAssets = assets.filter((asset) => {
    const latestInspection = asset.inspections[0];

    if (!latestInspection) {
      return true;
    }

    return !(
      latestInspection.year === currentYear &&
      latestInspection.quarter === currentQuarter
    );
  });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
            🔎 รายการครุภัณฑ์รอตรวจสอบ
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
            ครุภัณฑ์ที่ยังไม่มีผลตรวจสอบในรอบ {currentQuarter} ปี{" "}
            {currentYear + 543}
          </p>
        </div>

        <Link
          href="/assets/inspection"
          className="
            shrink-0
            rounded-xl
            bg-white
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-slate-900
            shadow-lg
            transition
            hover:scale-[1.02]
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับหน้าตรวจสอบ
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
          lg:grid-cols-3
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
            รอบตรวจปัจจุบัน
          </p>

          <p className="mt-1 text-2xl font-extrabold text-amber-900">
            {currentQuarter} / {currentYear + 543}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-red-300
            bg-red-50
            p-5
            shadow-lg
          "
        >
          <p className="text-sm font-bold text-red-800">
            จำนวนที่รอตรวจสอบ
          </p>

          <p className="mt-1 text-2xl font-extrabold text-red-900">
            {pendingAssets.length} รายการ
          </p>
        </div>

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
          <p className="text-sm font-bold text-slate-600">
            ครุภัณฑ์ที่ใช้งานอยู่ทั้งหมด
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {assets.length} รายการ
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

                <th className="w-[15%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  หน่วยงาน
                </th>

                <th className="w-[13%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ประเภท
                </th>

                <th className="w-[25%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  รายการครุภัณฑ์
                </th>

                <th className="w-[15%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  เลขครุภัณฑ์กรม
                </th>

                <th className="w-[15%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ผู้ครอบครอง
                </th>

                <th className="w-[11%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                  ดำเนินการ
                </th>
              </tr>
            </thead>

            <tbody>
              {pendingAssets.map((asset, index) => {
                const owner = asset.officer
                  ? `${asset.officer.firstName} ${asset.officer.lastName}`
                  : "-";

                return (
                  <tr
                    key={asset.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
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

                      {asset.section && (
                        <div className="mt-1 text-sm font-medium text-slate-500">
                          {asset.section.name}
                        </div>
                      )}
                    </td>

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
                      {categoryName[asset.category] ?? asset.category}
                    </td>

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
                      <span className="font-extrabold">
                        {asset.name}
                      </span>

                      {(asset.brand || asset.model) && (
                        <div className="mt-1 text-sm text-slate-500">
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
                        px-3
                        py-4
                        text-center
                        font-semibold
                      "
                    >
                      {asset.governmentAssetNo ?? "-"}
                    </td>

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
                      {owner}
                    </td>

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
                        href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}/inspection/new`}
                        className="
                          inline-block
                          rounded-lg
                          bg-gradient-to-r
                          from-emerald-600
                          to-green-500
                          px-4
                          py-2
                          font-extrabold
                          !text-white
                          shadow-md
                          transition
                          hover:scale-105
                          hover:from-emerald-700
                          hover:to-green-600
                        "
                      >
                        ตรวจสอบ
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {pendingAssets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      border
                      border-black
                      px-6
                      py-12
                      text-center
                      text-lg
                      font-extrabold
                      text-emerald-700
                    "
                  >
                    ✅ ครุภัณฑ์ได้รับการตรวจสอบครบแล้วในรอบนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          หมายเหตุ
      ===================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-lg
          sm:p-6
        "
      >
        <p className="text-sm font-extrabold text-slate-900">
          📌 หมายเหตุ
        </p>

        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
          ระบบจะแสดงเฉพาะครุภัณฑ์ที่มีสถานะหลักเป็น
          &quot;ยังใช้งาน&quot; และยังไม่มีผลตรวจสอบสำหรับรอบปัจจุบัน
          โดยผลการตรวจสอบจะถูกบันทึกแยกเป็นประวัติ ไม่กระทบข้อมูลทะเบียนครุภัณฑ์เดิม
        </p>

        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
          รอบการตรวจสอบแบ่งเป็น 4 รอบต่อปี ได้แก่ Q1 (มกราคม–มีนาคม),
          Q2 (เมษายน–มิถุนายน), Q3 (กรกฎาคม–กันยายน) และ Q4
          (ตุลาคม–ธันวาคม)
        </p>
      </div>
    </div>
  );
}