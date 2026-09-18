import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

const thaiMonths = [
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

// =====================================================
// แสดงวันที่ภาษาไทย
// =====================================================

function formatThaiDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getDate()} ${
    thaiMonths[date.getMonth()]
  } ${date.getFullYear() + 543}`;
}

// =====================================================
// แปลง Date เป็น YYYY-MM-DD
// =====================================================

function formatDateOnly(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// หนึ่งปีก่อน
// =====================================================

function getOneYearBefore(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setFullYear(
    date.getFullYear() - 1
  );

  return formatDateOnly(date);
}

// =====================================================
// หนึ่งวันก่อน
// =====================================================

function getOneDayBefore(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(
    date.getDate() - 1
  );

  return formatDateOnly(date);
}

// =====================================================
// ปีงบประมาณจากวันที่
//
// ระบบนี้ยึดปี พ.ศ. ของวันที่ตรวจสอบโดยตรง
// เช่น 18 กันยายน 2026 = 2569
// และ 1 ตุลาคม 2026 = 2569
// ไม่บวกปีเพิ่มเป็น 2570
// =====================================================

function getFiscalYear(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return String(
    date.getFullYear() + 543
  );
}

// =====================================================
// หน่วยนับ
// =====================================================

function getCategoryUnit(
  category: string
) {
  const categoryUnit: Record<
    string,
    string
  > = {
    COMPUTER: "เครื่อง",
    DESKTOP: "เครื่อง",
    LAPTOP: "เครื่อง",
    PRINTER: "เครื่อง",
    TELEPHONE: "เครื่อง",
    AIR_CONDITIONER: "เครื่อง",
    FAN: "เครื่อง",

    CHAIR: "ตัว",
    DESK: "ตัว",
    TABLE: "ตัว",

    CABINET: "ตู้",

    OTHER: "รายการ",
  };

  return (
    categoryUnit[category] ||
    "รายการ"
  );
}

// =====================================================
// แปลง inspectorIds
// =====================================================

function parseInspectorIds(
  value: unknown
): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            String(item)
          )
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);
    }
  }

  return [];
}

// =====================================================
// แปลง ค.ศ. / พ.ศ. ให้เป็น พ.ศ.
// =====================================================

function normalizeFiscalYear(
  value: number | string
) {
  const year = Number(value);

  if (!Number.isFinite(year)) {
    return String(value);
  }

  return year < 2400
    ? String(year + 543)
    : String(year);
}

// =====================================================
// Props
// =====================================================

type PageProps = {
  params: Promise<{
    departmentId: string;
    year: string;
  }>;
};

// =====================================================
// Page
// =====================================================

export default async function InspectionHistoryDetailPage({
  params,
}: PageProps) {
  const {
    departmentId:
      departmentIdParam,
    year: yearParam,
  } = await params;

  const departmentId =
    Number(departmentIdParam);

  const requestedYear =
    Number(yearParam);

  // ===================================================
  // ตรวจสอบ parameter
  // ===================================================

  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0 ||
    !Number.isInteger(
      requestedYear
    )
  ) {
    notFound();
  }

  // ===================================================
  // รองรับ URL ทั้ง พ.ศ. และ ค.ศ.
  //
  // URL 2569
  // พ.ศ. = 2569
  // ค.ศ. = 2026
  //
  // URL 2026
  // พ.ศ. = 2569
  // ค.ศ. = 2026
  // ===================================================

  const buddhistYear =
    requestedYear < 2400
      ? requestedYear + 543
      : requestedYear;

  const christianYear =
    buddhistYear - 543;

  // ===================================================
  // กลุ่มงาน
  // ===================================================

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

  if (!department) {
    notFound();
  }

  // ===================================================
  // ดึงข้อมูลการตรวจสอบ
  // รองรับฐานข้อมูลที่เก็บ year เป็น พ.ศ. หรือ ค.ศ.
  // ===================================================

  const inspections =
    await prisma.assetInspection.findMany({
      where: {
        year: {
          in: [
            buddhistYear,
            christianYear,
          ],
        },

        asset: {
          departmentId,
        },
      },

      include: {
        asset: {
          include: {
            section: true,
            officer: true,
          },
        },
      },

      orderBy: {
        assetId: "asc",
      },
    });

  // ===================================================
  // ไม่พบประวัติ
  // ===================================================

  if (inspections.length === 0) {
    notFound();
  }

  // ===================================================
  // Inspection แรก
  // ===================================================

  const firstInspection =
    inspections[0];

  // ===================================================
  // ปีที่ใช้แสดง
  //
  // ยึดปีของวันที่เริ่มตรวจเป็นหลัก
  // เพื่อให้ข้อมูลปี 2569 แสดงเป็น 2569
  // ไม่ถูกบวกเป็น 2570
  //
  // หากไม่มีวันที่ จึง fallback ไปใช้ year ในฐานข้อมูล
  // ===================================================

  const databaseYear =
    inspections[0].year;

  const displayFiscalYear =
    getFiscalYear(
      firstInspection.inspectionStartDate
    ) ||
    normalizeFiscalYear(
      databaseYear
    );

  // ===================================================
  // วันที่
  // ===================================================

  const inspectionStartDate =
    formatDateOnly(
      firstInspection.inspectionStartDate
    );

  const inspectionEndDate =
    formatDateOnly(
      firstInspection.inspectionEndDate
    );

  // ===================================================
  // วันที่ยอดบัญชี
  // ใช้ Logic เดียวกับ InspectionForm
  // ===================================================

  const accountStartDate =
    getOneYearBefore(
      firstInspection.inspectionStartDate
    );

  const accountEndDate =
    getOneDayBefore(
      firstInspection.inspectionEndDate
    );

  // ===================================================
  // ปีงบประมาณรายการเคลื่อนไหว
  //
  // ใช้ปีเดียวกับข้อมูลที่แสดง
  // เช่น 2569 ไม่เป็น 2570
  // ===================================================

  const movementFiscalYear =
    getFiscalYear(
      firstInspection.inspectionStartDate
    ) ||
    displayFiscalYear;

  // ===================================================
  // ผู้ตรวจสอบ
  // ===================================================

  const rawInspectorIds =
    parseInspectorIds(
      firstInspection.inspectorIds
    );

  const inspectorIds =
    Array.from(
      {
        length: 5,
      },
      (_, index) =>
        rawInspectorIds[index] ||
        ""
    );

  const numericInspectorIds =
    rawInspectorIds
      .map(Number)
      .filter((value) =>
        Number.isInteger(value)
      );

  // ===================================================
  // รายชื่อเจ้าหน้าที่
  // ===================================================

  const officers =
    numericInspectorIds.length > 0
      ? await prisma.officer.findMany({
          where: {
            id: {
              in: numericInspectorIds,
            },
          },

          include: {
            department: true,
            section: true,
          },

          orderBy: {
            id: "asc",
          },
        })
      : [];

  const officerMap = new Map(
    officers.map((officer) => [
      String(officer.id),
      officer,
    ])
  );

  // ===================================================
  // Assets
  // ===================================================

  const assets =
    inspections.map(
      (inspection) =>
        inspection.asset
    );

  // ===================================================
  // Rows สำหรับ Export PDF
  // ===================================================

  const rows =
    inspections.map(
      (inspection) => ({
        assetId:
          inspection.assetId,

        countedQty:
          String(
            inspection.countedQty ??
              ""
          ),

        accuracy:
          inspection.accuracy ||
          "",

        status:
          inspection.status ||
          "",

        remark:
          inspection.remark ||
          "",
      })
    );

  // ===================================================
  // Render
  // ===================================================

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1800px]
        space-y-6
      "
    >
      {/* =================================================
          Header
      ================================================= */}

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
          px-5
          py-5
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
            📋 ข้อมูลการตรวจสอบครุภัณฑ์ประจำปี
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
            {department.name}
            {" · "}
            ประจำปีงบประมาณ พ.ศ.{" "}
            {displayFiscalYear}
          </p>
        </div>

        <Link
          href="/assets/inspection-history"
          className="
            inline-flex
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-base
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-emerald-700
            hover:to-green-600
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =================================================
          ข้อมูลการตรวจสอบ
      ================================================= */}

      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-5
          text-white
          shadow-xl
        "
      >
        <div
          className="
            mb-4
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <h2
            className="
              text-2xl
              font-extrabold
              !text-white
            "
          >
            ข้อมูลการตรวจสอบ
          </h2>

          <ExportInspectionPdf
            department={department}
            assets={assets}
            rows={rows}
            inspectorIds={
              inspectorIds
            }
            inspectionStartDate={
              inspectionStartDate
            }
            inspectionEndDate={
              inspectionEndDate
            }
            accountStartDate={
              accountStartDate
            }
            accountEndDate={
              accountEndDate
            }
            movementFiscalYear={
              movementFiscalYear
            }
            officers={officers}
          />
        </div>

        {/* ===============================================
            วันที่ตรวจสอบ
        =============================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-6
            md:grid-cols-2
          "
        >
          <div>
            <div
              className="
                mb-2
                text-lg
                font-extrabold
                !text-white
              "
            >
              เริ่มดำเนินการตรวจสอบวันที่
            </div>

            <div
              className="
                min-h-[46px]
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2.5
                font-semibold
                text-slate-900
              "
            >
              {formatThaiDate(
                firstInspection.inspectionStartDate
              )}
            </div>
          </div>

          <div>
            <div
              className="
                mb-2
                text-lg
                font-extrabold
                !text-white
              "
            >
              ตรวจสอบแล้วเสร็จวันที่
            </div>

            <div
              className="
                min-h-[46px]
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2.5
                font-semibold
                text-slate-900
              "
            >
              {formatThaiDate(
                firstInspection.inspectionEndDate
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          ตารางรายละเอียด
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-300
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              min-w-[2300px]
              border-collapse
              text-[13px]
              leading-tight
            "
          >
            <thead>
              <tr
                className="
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  text-white
                "
              >
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รายการ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หน่วยนับ
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountStartDate
                    )}
                  </div>
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    รายการเคลื่อนไหวระหว่าง
                  </div>

                  <div className="whitespace-nowrap">
                    ปีงบประมาณ พ.ศ.{" "}
                    {movementFiscalYear}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountEndDate
                    )}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap">
                    จำนวนที่ตรวจนับได้
                  </span>
                </th>

                <th
                  colSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ผลการตรวจนับถูกต้องตรงกับ
                  </div>

                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>
                </th>

                <th
                  colSpan={4}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap">
                    สภาพครุภัณฑ์ที่ตรวจนับ
                  </span>
                </th>

                <th
                  rowSpan={2}
                  className="border border-black px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              <tr
                className="
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  text-white
                "
              >
                <th className="border border-black px-3 py-2 text-center font-extrabold !text-white">
                  รับ
                </th>

                <th className="border border-black px-3 py-2 text-center font-extrabold !text-white">
                  จ่าย
                </th>

                <th className="border border-black px-3 py-2 text-center font-extrabold !text-white">
                  ถูกต้อง
                </th>

                <th className="border border-black px-3 py-2 text-center font-extrabold !text-white">
                  ไม่ถูกต้อง
                </th>

                <th className="min-w-[105px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold !text-white">
                  ใช้งานปกติ
                </th>

                <th className="min-w-[70px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold !text-white">
                  ชำรุด
                </th>

                <th className="min-w-[95px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold !text-white">
                  เสื่อมสภาพ
                </th>

                <th className="min-w-[125px] whitespace-nowrap border border-black px-3 py-2 text-center font-extrabold !text-white">
                  ไม่จำเป็นต้องใช้
                </th>
              </tr>
            </thead>

            <tbody>
              {inspections.map(
                (
                  inspection,
                  index
                ) => {
                  const asset =
                    inspection.asset;

                  const responsibleGroup =
                    department.name ===
                    "กลุ่มอำนวยการ"
                      ? [
                          department.name,
                          asset.section
                            ?.name || "",
                        ]
                          .filter(Boolean)
                          .join(" / ")
                      : department.name;

                  return (
                    <tr
                      key={
                        inspection.id
                      }
                      className="
                        bg-white
                        text-sm
                        font-medium
                        text-slate-900
                      "
                    >
                      <td className="border border-black px-2 py-3 text-center align-middle">
                        {index + 1}
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        {asset.governmentAssetNo ||
                          "-"}
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        {asset.officeAssetNo ||
                          "-"}
                      </td>

                      {/* กลุ่มงาน / ผู้รับผิดชอบ
                          จัดข้อความให้อยู่กึ่งกลางแนวนอนและแนวตั้ง */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        <div className="flex w-full items-center justify-center text-center">
                          {
                            responsibleGroup
                          }
                        </div>
                      </td>

                      <td className="border border-black px-2 py-3 text-left align-middle">
                        {asset.name}
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        {getCategoryUnit(
                          asset.category
                        )}
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        1
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        -
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        -
                      </td>

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        1
                      </td>

                      {/* จำนวนที่ตรวจนับ */}

                      <td className="border border-black px-2 py-3 text-center align-middle font-semibold">
                        {inspection.countedQty ??
                          "-"}
                      </td>

                      {/* ถูกต้อง */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.accuracy ===
                        "CORRECT"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ไม่ถูกต้อง */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.accuracy ===
                        "INCORRECT"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ใช้งานปกติ */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "IN_USE"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ชำรุด */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "DAMAGED"
                          ? "✓"
                          : ""}
                      </td>

                      {/* เสื่อมสภาพ */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "DETERIORATED"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ไม่จำเป็นต้องใช้ */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "UNUSABLE"
                          ? "✓"
                          : ""}
                      </td>

                      {/* หมายเหตุ */}

                      <td className="border border-black px-2 py-3 text-left align-middle">
                        {inspection.remark ||
                          "-"}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          รายชื่อผู้ตรวจสอบ
      ================================================= */}

      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-6
          text-white
          shadow-xl
        "
      >
        <h2
          className="
            mb-6
            text-2xl
            font-extrabold
            !text-white
          "
        >
          รายชื่อผู้ตรวจสอบ
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
          "
        >
          {inspectorIds.map(
            (
              inspectorId,
              index
            ) => {
              const officer =
                officerMap.get(
                  inspectorId
                );

              return (
                <div key={index}>
                  <div
                    className="
                      mb-2
                      text-lg
                      font-extrabold
                      !text-white
                    "
                  >
                    ผู้ตรวจสอบคนที่{" "}
                    {index + 1}
                  </div>

                  <div
                    className="
                      min-h-[46px]
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      p-2.5
                      font-semibold
                      text-slate-900
                    "
                  >
                    {officer
                      ? `${officer.firstName} ${officer.lastName}`
                      : "-"}
                  </div>

                  <p
                    className="
                      mt-2
                      text-sm
                      font-semibold
                      text-slate-300
                    "
                  >
                    ตำแหน่ง:{" "}
                    {officer?.position ||
                      "-"}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
