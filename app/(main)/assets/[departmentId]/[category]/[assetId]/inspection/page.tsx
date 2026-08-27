import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
  }>;
};

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
  IN_USE: "ยังใช้งานอยู่",
  RETURNED: "ส่งคืน",
  DAMAGED: "ชำรุด",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const inspectionStatusClass: Record<string, string> = {
  IN_USE: "border-emerald-300 bg-emerald-50 text-emerald-800",
  RETURNED: "border-blue-300 bg-blue-50 text-blue-800",
  DAMAGED: "border-amber-300 bg-amber-50 text-amber-800",
  MISSING: "border-red-300 bg-red-50 text-red-800",
  NOT_FOUND: "border-red-300 bg-red-50 text-red-800",
};

const quarterName: Record<string, string> = {
  Q1: "ไตรมาส 1",
  Q2: "ไตรมาส 2",
  Q3: "ไตรมาส 3",
  Q4: "ไตรมาส 4",
};

export default async function AssetInspectionPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  const departmentIdNumber = Number(departmentId);
  const assetIdNumber = Number(assetId);

  if (
    !Number.isInteger(departmentIdNumber) ||
    !Number.isInteger(assetIdNumber)
  ) {
    notFound();
  }

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetIdNumber,
      departmentId: departmentIdNumber,
      category: category as any,
    },
    include: {
      department: true,
      section: true,
      officer: true,
      inspections: {
        orderBy: [
          {
            year: "desc",
          },
          {
            quarter: "desc",
          },
        ],
      },
    },
  });

  if (!asset) {
    notFound();
  }

  const latestInspection = asset.inspections[0] ?? null;

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
            🔍 ประวัติการตรวจสอบครุภัณฑ์
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
            ตรวจสอบและติดตามประวัติการตรวจครุภัณฑ์รายไตรมาส
          </p>
        </div>

        <Link
          href={`/assets/${departmentId}/${category}/${asset.id}`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
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
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลครุภัณฑ์
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <div
          className="
            rounded-xl
            bg-gradient-to-r
            from-slate-800
            to-slate-700
            px-4
            py-3
          "
        >
          <h2
            className="
              text-lg
              font-extrabold
              !text-white
              sm:text-xl
            "
          >
            📦 ข้อมูลครุภัณฑ์
          </h2>
        </div>

        <div
          className="
            mt-4
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          <div className="min-w-0 lg:col-span-2">
            <p className="text-sm font-bold !text-slate-300">
              รายการครุภัณฑ์
            </p>

            <p
              className="
                mt-2
                break-words
                text-lg
                font-extrabold
                !text-white
              "
            >
              {asset.name}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              ประเภท
            </p>

            <p
              className="
                mt-2
                break-words
                font-extrabold
                !text-white
              "
            >
              {categoryName[asset.category] ?? asset.category}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์กรม
            </p>

            <p
              className="
                mt-2
                break-words
                font-extrabold
                !text-white
              "
            >
              {asset.governmentAssetNo ?? "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์ประจำสำนัก
            </p>

            <p
              className="
                mt-2
                break-words
                font-extrabold
                !text-white
              "
            >
              {asset.officeAssetNo ?? "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              กลุ่มงาน
            </p>

            <p
              className="
                mt-2
                break-words
                font-extrabold
                !text-white
              "
            >
              {asset.section?.name ?? asset.department.name}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              ผู้ครอบครอง
            </p>

            <p
              className="
                mt-2
                break-words
                font-extrabold
                !text-white
              "
            >
              {asset.officer
                ? `${asset.officer.firstName} ${asset.officer.lastName}`
                : "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              ผลการตรวจล่าสุด
            </p>

            <div className="mt-2">
              {latestInspection ? (
                <span
                  className={`
                    inline-flex
                    rounded-lg
                    border
                    px-3
                    py-1
                    text-sm
                    font-extrabold
                    ${
                      inspectionStatusClass[
                        latestInspection.status
                      ] ??
                      "border-slate-300 bg-slate-50 text-slate-700"
                    }
                  `}
                >
                  {inspectionStatusName[
                    latestInspection.status
                  ] ?? latestInspection.status}
                </span>
              ) : (
                <p
                  className="
                    font-extrabold
                    !text-slate-400
                  "
                >
                  ยังไม่มีประวัติการตรวจ
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ประวัติการตรวจสอบ
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <div
          className="
            rounded-xl
            bg-gradient-to-r
            from-slate-800
            to-slate-700
            px-4
            py-3
          "
        >
          <h2
            className="
              text-lg
              font-extrabold
              !text-white
              sm:text-xl
            "
          >
            📋 ประวัติการตรวจสอบ
          </h2>
        </div>

        <div
          className="
            mt-4
            overflow-hidden
            rounded-2xl
            bg-white
            shadow-xl
          "
        >
          <div className="w-full overflow-x-auto">
            <table
              className="
                w-full
                min-w-[1000px]
                border-collapse
                text-sm
              "
            >
              <thead>
                <tr>
                  <th
                    className="
                      w-[8%]
                      whitespace-nowrap
                      border
                      border-black
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    ลำดับ
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
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    ปี
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
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    รอบตรวจ
                  </th>

                  <th
                    className="
                      w-[15%]
                      whitespace-nowrap
                      border
                      border-black
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    วันที่ตรวจ
                  </th>

                  <th
                    className="
                      w-[17%]
                      whitespace-nowrap
                      border
                      border-black
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    ผลการตรวจ
                  </th>

                  <th
                    className="
                      w-[18%]
                      whitespace-nowrap
                      border
                      border-black
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    ผู้ตรวจ
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
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      !text-white
                    "
                  >
                    รายละเอียด
                  </th>
                </tr>
              </thead>

              <tbody className="text-slate-900">
                {asset.inspections.map(
                  (inspection, index) => (
                    <tr
                      key={inspection.id}
                      className="
                        text-slate-900
                        transition
                        hover:bg-slate-50
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
                          border
                          border-black
                          px-3
                          py-4
                          text-center
                          font-extrabold
                        "
                      >
                        {inspection.year}
                      </td>

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
                        {quarterName[
                          inspection.quarter
                        ] ?? inspection.quarter}
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
                        {new Date(
                          inspection.inspectionDate
                        ).toLocaleDateString("th-TH")}
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
                        <span
                          className={`
                            inline-flex
                            rounded-lg
                            border
                            px-3
                            py-1
                            text-sm
                            font-extrabold
                            ${
                              inspectionStatusClass[
                                inspection.status
                              ] ??
                              "border-slate-300 bg-slate-50 text-slate-700"
                            }
                          `}
                        >
                          {inspectionStatusName[
                            inspection.status
                          ] ?? inspection.status}
                        </span>
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
                        {inspection.inspectorName ?? "-"}
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
                        <div className="flex flex-col gap-2">
                          <span
                            className="
                              font-semibold
                              text-slate-700
                            "
                          >
                            {inspection.condition ?? "-"}
                          </span>

                          {inspection.remark && (
                            <span
                              className="
                                break-words
                                text-sm
                                text-slate-500
                              "
                            >
                              {inspection.remark}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {asset.inspections.length === 0 && (
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
    </div>
  );
}