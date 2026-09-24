import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";

import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

/* =========================================================
   CONSTANT
========================================================= */

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

/* =========================================================
   DATE
========================================================= */

function formatThaiDate(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "-";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return `${date.getDate()} ${
    thaiMonths[
      date.getMonth()
    ]
  } ${
    date.getFullYear() +
    543
  }`;
}

/* =========================================================
   DATE ONLY
========================================================= */

function formatDateOnly(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/* =========================================================
   ONE YEAR BEFORE
========================================================= */

function getOneYearBefore(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  date.setFullYear(
    date.getFullYear() - 1
  );

  return formatDateOnly(
    date
  );
}

/* =========================================================
   ONE DAY BEFORE
========================================================= */

function getOneDayBefore(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  date.setDate(
    date.getDate() - 1
  );

  return formatDateOnly(
    date
  );
}

/* =========================================================
   FISCAL YEAR

   ระบบเดิมยึดปี พ.ศ. ของวันที่ตรวจสอบโดยตรง
========================================================= */

function getFiscalYear(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return String(
    date.getFullYear() +
      543
  );
}

/* =========================================================
   CATEGORY UNIT
========================================================= */

function getCategoryUnit(
  category: string
) {
  const categoryUnit:
    Record<
      string,
      string
    > = {
      COMPUTER:
        "เครื่อง",

      DESKTOP:
        "เครื่อง",

      LAPTOP:
        "เครื่อง",

      MONITOR:
        "เครื่อง",

      PRINTER:
        "เครื่อง",

      TELEPHONE:
        "เครื่อง",

      AIR_CONDITIONER:
        "เครื่อง",

      FAN:
        "เครื่อง",

      CHAIR:
        "ตัว",

      DESK:
        "ตัว",

      TABLE:
        "ตัว",

      SHELF:
        "ตัว",

      CABINET:
        "ตู้",

      OTHER:
        "รายการ",

      NO_SYSTEM:
        "รายการ",
    };

  return (
    categoryUnit[
      category
    ] ||
    "รายการ"
  );
}

/* =========================================================
   INSPECTOR IDS
========================================================= */

function parseInspectorIds(
  value: unknown
): string[] {
  if (!value) {
    return [];
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (
          item
        ) =>
          String(
            item
          )
      )
      .filter(
        Boolean
      );
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(
          value
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed
          .map(
            (
              item
            ) =>
              String(
                item
              )
          )
          .filter(
            Boolean
          );
      }
    } catch {
      return value
        .split(",")
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );
    }
  }

  return [];
}

/* =========================================================
   FISCAL YEAR NORMALIZE
========================================================= */

function normalizeFiscalYear(
  value:
    | number
    | string
) {
  const year =
    Number(
      value
    );

  if (
    !Number.isFinite(
      year
    )
  ) {
    return String(
      value
    );
  }

  return year < 2400
    ? String(
        year + 543
      )
    : String(
        year
      );
}

/* =========================================================
   RESPONSIBLE NAME

   ให้รูปแบบการแสดงใกล้เคียงหน้าตรวจสอบปัจจุบัน
========================================================= */

function getResponsibleName(
  asset: {
    responsibleName?:
      | string
      | null;

    section: {
      name: string;
    } | null;

    officer: {
      firstName: string;
      lastName: string;
    } | null;
  },
  departmentName: string
) {
  const cleanDepartmentName =
    departmentName.trim();

  const originalResponsibleName =
    asset.responsibleName?.trim();

  if (
    originalResponsibleName &&
    originalResponsibleName !==
      "-"
  ) {
    if (
      originalResponsibleName ===
        cleanDepartmentName ||
      originalResponsibleName.startsWith(
        `${cleanDepartmentName} /`
      )
    ) {
      return originalResponsibleName;
    }

    return `${cleanDepartmentName} / ${originalResponsibleName}`;
  }

  const sectionName =
    asset.section?.name?.trim();

  if (sectionName) {
    if (
      sectionName ===
        cleanDepartmentName ||
      sectionName.startsWith(
        `${cleanDepartmentName} /`
      )
    ) {
      return sectionName;
    }

    return `${cleanDepartmentName} / ${sectionName}`;
  }

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    return `${cleanDepartmentName} / ${officerName}`;
  }

  return (
    cleanDepartmentName ||
    "-"
  );
}

/* =========================================================
   TYPES
========================================================= */

type PageProps = {
  params: Promise<{
    departmentId: string;
    year: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function InspectionHistoryDetailPage({
  params,
}: PageProps) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId:
      departmentIdParam,

    year:
      yearParam,
  } = await params;

  const departmentId =
    Number(
      departmentIdParam
    );

  const requestedYear =
    Number(
      yearParam
    );

  /* =======================================================
     VALIDATE
  ======================================================= */

  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <=
      0 ||
    !Number.isInteger(
      requestedYear
    )
  ) {
    notFound();
  }

  /* =======================================================
     YEAR

     รองรับ URL ทั้ง พ.ศ. และ ค.ศ.
  ======================================================= */

  const buddhistYear =
    requestedYear < 2400
      ? requestedYear +
        543
      : requestedYear;

  const christianYear =
    buddhistYear -
    543;

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id:
          departmentId,
      },
    });

  if (!department) {
    notFound();
  }

  /* =======================================================
     INSPECTIONS
  ======================================================= */

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
            section:
              true,

            officer:
              true,
          },
        },
      },

      orderBy: {
        assetId:
          "asc",
      },
    });

  if (
    inspections.length ===
    0
  ) {
    notFound();
  }

  /* =======================================================
     FIRST INSPECTION
  ======================================================= */

  const firstInspection =
    inspections[0];

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const databaseYear =
    firstInspection.year;

  const displayFiscalYear =
    getFiscalYear(
      firstInspection.inspectionStartDate
    ) ||
    normalizeFiscalYear(
      databaseYear
    );

  /* =======================================================
     DATES
  ======================================================= */

  const inspectionStartDate =
    formatDateOnly(
      firstInspection.inspectionStartDate
    );

  const inspectionEndDate =
    formatDateOnly(
      firstInspection.inspectionEndDate
    );

  const accountStartDate =
    getOneYearBefore(
      firstInspection.inspectionStartDate
    );

  const accountEndDate =
    getOneDayBefore(
      firstInspection.inspectionEndDate
    );

  const movementFiscalYear =
    getFiscalYear(
      firstInspection.inspectionStartDate
    ) ||
    displayFiscalYear;

  /* =======================================================
     INSPECTOR IDS
  ======================================================= */

  const rawInspectorIds =
    parseInspectorIds(
      firstInspection.inspectorIds
    );

  const inspectorIds =
    Array.from(
      {
        length:
          5,
      },
      (
        _,
        index
      ) =>
        rawInspectorIds[
          index
        ] ||
        ""
    );

  const numericInspectorIds =
    rawInspectorIds
      .map(
        Number
      )
      .filter(
        (
          value
        ) =>
          Number.isInteger(
            value
          )
      );

  /* =======================================================
     OFFICERS
  ======================================================= */

  const officers =
    numericInspectorIds.length >
    0
      ? await prisma.officer.findMany({
          where: {
            id: {
              in:
                numericInspectorIds,
            },
          },

          include: {
            department:
              true,

            section:
              true,
          },

          orderBy: {
            id:
              "asc",
          },
        })
      : [];

  const officerMap =
    new Map(
      officers.map(
        (
          officer
        ) => [
          String(
            officer.id
          ),
          officer,
        ]
      )
    );

  /* =======================================================
     ASSETS
  ======================================================= */

  const assets =
    inspections.map(
      (
        inspection
      ) =>
        inspection.asset
    );

  /* =======================================================
     PDF ROWS
  ======================================================= */

  const rows =
    inspections.map(
      (
        inspection
      ) => ({
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER

          ใช้ตัวกลางเหมือนหน้า /assets/1/inspection
      ===================================================== */}

      <AppPageHeader
        icon="📋"
        title="ข้อมูลการตรวจสอบครุภัณฑ์ประจำปี"
        subtitle={`${department.name} • ประจำปีงบประมาณ พ.ศ. ${displayFiscalYear}`}
        actions={
          <AppButton
            href="/assets/inspection-history"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          INSPECTION INFO

          ใช้ AppCard ตัวกลาง
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            flex-col

            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <h2
            className="
              text-xl
              font-black
              tracking-tight

              !text-slate-900

              sm:text-2xl
            "
          >
            ข้อมูลการตรวจสอบ
          </h2>

          {/* ===============================================
              ExportInspectionPdf

              Component นี้ใช้ AppButton ตัวกลางอยู่แล้ว
              จึงไม่กำหนดขนาด / สีจากหน้านี้ซ้ำ
          =============================================== */}

          <div
            className="
              shrink-0
            "
          >
            <ExportInspectionPdf
              department={
                department
              }
              assets={
                assets
              }
              rows={
                rows
              }
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
              officers={
                officers
              }
            />
          </div>
        </div>

        {/* =================================================
            DATE INFORMATION
        ================================================= */}

        <div
          className="
            mt-5

            grid
            grid-cols-1

            gap-4

            md:grid-cols-2
          "
        >
          {/* ===============================================
              START DATE
          =============================================== */}

          <div
            className="
              min-w-0
            "
          >
            <label
              className="
                mb-2
                block

                text-sm
                font-extrabold

                !text-slate-700
              "
            >
              เริ่มดำเนินการตรวจสอบวันที่
            </label>

            <div
              className="
                flex
                min-h-[52px]
                w-full

                items-center

                rounded-[16px]

                border
                border-slate-300/90

                bg-slate-100

                px-4
                py-3

                text-base
                font-bold

                !text-slate-900

                shadow-sm
              "
            >
              {formatThaiDate(
                firstInspection.inspectionStartDate
              )}
            </div>
          </div>

          {/* ===============================================
              END DATE
          =============================================== */}

          <div
            className="
              min-w-0
            "
          >
            <label
              className="
                mb-2
                block

                text-sm
                font-extrabold

                !text-slate-700
              "
            >
              ตรวจสอบแล้วเสร็จวันที่
            </label>

            <div
              className="
                flex
                min-h-[52px]
                w-full

                items-center

                rounded-[16px]

                border
                border-slate-300/90

                bg-slate-100

                px-4
                py-3

                text-base
                font-bold

                !text-slate-900

                shadow-sm
              "
            >
              {formatThaiDate(
                firstInspection.inspectionEndDate
              )}
            </div>
          </div>
        </div>
      </AppCard>

      {/* =====================================================
          TABLE

          ใช้ AppTableCard ตัวกลาง
      ===================================================== */}

      <AppTableCard
        title="รายการตรวจสอบครุภัณฑ์"
        subtitle={`${department.name} • ประจำปีงบประมาณ พ.ศ. ${displayFiscalYear}`}
        badge={`${inspections.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
          max-w-full
        "
      >
        <div
          className="
            w-full
            min-w-0

            overflow-x-auto
            overscroll-x-contain

            [-webkit-overflow-scrolling:touch]
          "
        >
          <table
            className="
              w-full
              min-w-[2900px]

              border-collapse

              bg-white

              text-[13px]
              leading-tight
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr>
                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ลำดับ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัส GFMIS
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รหัสครุภัณฑ์
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  ผู้รับผิดชอบ
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  รายการครุภัณฑ์
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หน่วย
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountStartDate
                    )}
                  </div>
                </th>

                <th
                  colSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    รายการเคลื่อนไหวระหว่าง
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ปีงบประมาณ พ.ศ.{" "}
                    {
                      movementFiscalYear
                    }
                  </div>
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ณ วันที่{" "}
                    {formatThaiDate(
                      accountEndDate
                    )}
                  </div>
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap">
                    จำนวนที่ตรวจนับได้
                  </span>
                </th>

                <th
                  colSpan={
                    2
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <div className="whitespace-nowrap">
                    ผลการตรวจนับถูกต้องตรงกับ
                  </div>

                  <div className="mt-1 whitespace-nowrap">
                    ยอดคงเหลือตามบัญชี
                  </div>
                </th>

                <th
                  colSpan={
                    4
                  }
                  className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  <span className="whitespace-nowrap">
                    สภาพครุภัณฑ์ที่ตรวจนับ
                  </span>
                </th>

                <th
                  rowSpan={
                    2
                  }
                  className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-3 text-center align-middle font-extrabold !text-white"
                >
                  หมายเหตุ
                </th>
              </tr>

              {/* =============================================
                  SECOND HEADER
              ============================================= */}

              <tr>
                {[
                  "รับ",
                  "จ่าย",
                  "ถูกต้อง",
                  "ไม่ถูกต้อง",
                  "ใช้งานปกติ",
                  "ชำรุด",
                  "เสื่อมสภาพ",
                  "ไม่จำเป็นต้องใช้",
                ].map(
                  (
                    title
                  ) => (
                    <th
                      key={
                        title
                      }
                      className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2.5 text-center font-extrabold !text-white"
                    >
                      {
                        title
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {inspections.map(
                (
                  inspection,
                  index
                ) => {
                  const asset =
                    inspection.asset;

                  const responsibleName =
                    getResponsibleName(
                      asset,
                      department.name
                    );

                  return (
                    <tr
                      key={
                        inspection.id
                      }
                      className={`
                        ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        text-sm
                        font-medium

                        !text-slate-900

                        transition-colors
                        duration-200

                        hover:bg-emerald-50/60
                      `}
                    >
                      {/* ===================================
                          ORDER
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        {(
                          index +
                          1
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* ===================================
                          GFMIS
                      =================================== */}

                      <td className="whitespace-nowrap border border-black px-2 py-3 text-center align-middle">
                        {asset.governmentAssetNo ||
                          "-"}
                      </td>

                      {/* ===================================
                          ASSET NO
                      =================================== */}

                      <td className="whitespace-nowrap border border-black px-2 py-3 text-center align-middle">
                        {asset.officeAssetNo ||
                          "-"}
                      </td>

                      {/* ===================================
                          RESPONSIBLE
                      =================================== */}

                      <td className="whitespace-nowrap border border-black px-2 py-3 text-center align-middle">
                        {
                          responsibleName
                        }
                      </td>

                      {/* ===================================
                          ITEM
                      =================================== */}

                      <td className="whitespace-nowrap border border-black px-3 py-3 text-left align-middle font-semibold">
                        {
                          asset.name
                        }
                      </td>

                      {/* ===================================
                          UNIT
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        {getCategoryUnit(
                          asset.category
                        )}
                      </td>

                      {/* ===================================
                          START BALANCE
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        1
                      </td>

                      {/* ===================================
                          RECEIVE
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        -
                      </td>

                      {/* ===================================
                          ISSUE
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        -
                      </td>

                      {/* ===================================
                          END BALANCE
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle">
                        1
                      </td>

                      {/* ===================================
                          COUNTED QTY
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle font-semibold">
                        {inspection.countedQty ??
                          "-"}
                      </td>

                      {/* ===================================
                          CORRECT
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.accuracy ===
                        "CORRECT"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ===================================
                          INCORRECT
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.accuracy ===
                        "INCORRECT"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ===================================
                          IN USE
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "IN_USE"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ===================================
                          DAMAGED
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "DAMAGED"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ===================================
                          DETERIORATED
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "DETERIORATED"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ===================================
                          UNUSABLE
                      =================================== */}

                      <td className="border border-black px-2 py-3 text-center align-middle text-lg font-extrabold">
                        {inspection.status ===
                        "UNUSABLE"
                          ? "✓"
                          : ""}
                      </td>

                      {/* ===================================
                          REMARK
                      =================================== */}

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
      </AppTableCard>

      {/* =====================================================
          INSPECTORS

          ใช้ AppCard ตัวกลางเหมือนหน้า inspection
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0
        "
      >
        <div>
          <h2
            className="
              text-xl
              font-black
              tracking-tight

              !text-slate-900

              sm:text-2xl
            "
          >
            คณะกรรมการตรวจสอบครุภัณฑ์
          </h2>

          <p
            className="
              mt-1

              text-sm
              font-semibold

              !text-slate-500
            "
          >
            รายชื่อผู้ตรวจสอบจำนวน 5 คน
          </p>
        </div>

        <div
          className="
            mt-5

            grid
            grid-cols-1

            gap-4

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
                <div
                  key={
                    index
                  }
                  className="
                    min-w-0

                    rounded-[18px]

                    border
                    border-slate-200/80

                    bg-slate-50/60

                    p-4
                  "
                >
                  <label
                    className="
                      mb-2
                      block

                      text-sm
                      font-extrabold

                      !text-slate-700
                    "
                  >
                    {index ===
                    0
                      ? "ประธานกรรมการ"
                      : `กรรมการคนที่ ${index}`}
                  </label>

                  {/* =======================================
                      รูปแบบ Read only
                      ให้ทรงเดียวกับช่อง Dropdown หน้า inspection
                  ======================================= */}

                  <div
                    className="
                      flex
                      min-h-[50px]
                      w-full
                      min-w-0

                      items-center

                      rounded-[14px]

                      border
                      border-slate-300

                      bg-slate-100

                      px-4
                      py-3

                      text-base
                      font-bold

                      !text-slate-900

                      shadow-sm
                    "
                  >
                    {officer
                      ? `${officer.firstName} ${officer.lastName}`
                      : "-"}
                  </div>

                  <p
                    className="
                      mt-2

                      text-xs
                      font-semibold

                      !text-slate-500
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
      </AppCard>
    </AppPage>
  );
}