import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   DYNAMIC
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type PageProps = {
  params: Promise<{
    fiscalYear: string;
  }>;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryOrder = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const categoryName: Record<
  string,
  string
> = {
  OFFICE:
    "วัสดุสำนักงาน",

  COMPUTER:
    "วัสดุคอมพิวเตอร์",

  ELECTRIC:
    "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",

  VEHICLE:
    "วัสดุยานพาหนะ",

  PRINTING:
    "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   COMMITTEE ROLE
========================================================= */

const inspectorRoleNames = [
  "ประธานกรรมการ",
  "กรรมการคนที่ 1",
  "กรรมการคนที่ 2",
];

/* =========================================================
   THAI MONTH
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
   PARSE INSPECTOR IDS
========================================================= */

function parseInspectorIds(
  value: unknown
): number[] {
  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) =>
        Number(item)
      )
      .filter(
        (item) =>
          Number.isInteger(
            item
          ) &&
          item > 0
      );
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
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
          .map((item) =>
            Number(
              item
            )
          )
          .filter(
            (item) =>
              Number.isInteger(
                item
              ) &&
              item > 0
          );
      }
    } catch {
      return value
        .split(",")
        .map(
          (item) =>
            Number(
              item.trim()
            )
        )
        .filter(
          (item) =>
            Number.isInteger(
              item
            ) &&
            item > 0
        );
    }
  }

  return [];
}

/* =========================================================
   PARSE INSPECTOR NAMES
========================================================= */

function parseInspectorNames(
  value: unknown
): string[] {
  if (
    Array.isArray(value)
  ) {
    return value
      .map(
        (item) =>
          String(
            item ?? ""
          ).trim()
      )
      .filter(Boolean);
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
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
            (item) =>
              String(
                item ?? ""
              ).trim()
          )
          .filter(
            Boolean
          );
      }
    } catch {
      return value
        .split(",")
        .map(
          (item) =>
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
   DATE

   inspectionDate เป็น Date Only แบบ UTC
========================================================= */

function formatInspectionDate(
  value: Date
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const day =
    date.getUTCDate();

  const month =
    thaiMonths[
      date.getUTCMonth()
    ];

  const year =
    date.getUTCFullYear() +
    543;

  return `${day} ${month} ${year}`;
}

/* =========================================================
   CREATED DATE
========================================================= */

function formatCreatedDate(
  value: Date
) {
  try {
    return new Intl.DateTimeFormat(
      "th-TH",
      {
        timeZone:
          "Asia/Bangkok",

        day:
          "numeric",

        month:
          "long",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    ).format(value);
  } catch {
    return "-";
  }
}

/* =========================================================
   NUMBER
========================================================= */

function displayNumber(
  value:
    | number
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return Number(
    value
  ).toLocaleString(
    "th-TH"
  );
}

/* =========================================================
   MATERIAL SORT
========================================================= */

function compareMaterial(
  a: {
    material: {
      code: string;
      category: string;
    };
  },
  b: {
    material: {
      code: string;
      category: string;
    };
  }
) {
  const categoryA =
    categoryOrder.indexOf(
      a.material.category
    );

  const categoryB =
    categoryOrder.indexOf(
      b.material.category
    );

  const orderA =
    categoryA >= 0
      ? categoryA
      : Number.MAX_SAFE_INTEGER;

  const orderB =
    categoryB >= 0
      ? categoryB
      : Number.MAX_SAFE_INTEGER;

  if (
    orderA !== orderB
  ) {
    return (
      orderA -
      orderB
    );
  }

  return a.material.code.localeCompare(
    b.material.code,
    "th",
    {
      numeric: true,
      sensitivity:
        "base",
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function StockCardInspectionHistoryDetailPage({
  params,
}: PageProps) {
  const {
    fiscalYear:
      fiscalYearParam,
  } = await params;

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const fiscalYear =
    Number(
      fiscalYearParam
    );

  if (
    !Number.isInteger(
      fiscalYear
    ) ||
    fiscalYear < 2400 ||
    fiscalYear > 3000
  ) {
    notFound();
  }

  /* =======================================================
     INSPECTION
  ======================================================= */

  const inspection =
    await prisma.stockCardInspection.findUnique(
      {
        where: {
          fiscalYear,
        },

        include: {
          rows: {
            include: {
              material:
                true,
            },
          },
        },
      }
    );

  if (!inspection) {
    notFound();
  }

  /* =======================================================
     INSPECTORS
  ======================================================= */

  const inspectorIds =
    parseInspectorIds(
      inspection.inspectorIds
    );

  const storedInspectorNames =
    parseInspectorNames(
      inspection.inspectorNames
    );

  const officers =
    inspectorIds.length >
    0
      ? await prisma.officer.findMany(
          {
            where: {
              id: {
                in:
                  inspectorIds,
              },
            },

            select: {
              id: true,
              firstName:
                true,
              lastName:
                true,
              position:
                true,
            },
          }
        )
      : [];

  const officerMap =
    new Map(
      officers.map(
        (officer) => [
          officer.id,
          officer,
        ]
      )
    );

  const inspectors =
    inspectorIds.map(
      (
        inspectorId,
        index
      ) => {
        const officer =
          officerMap.get(
            inspectorId
          );

        const storedName =
          storedInspectorNames[
            index
          ] ?? "";

        const currentName =
          officer
            ? `${officer.firstName} ${officer.lastName}`.trim()
            : "";

        return {
          id:
            inspectorId,

          role:
            inspectorRoleNames[
              index
            ] ??
            `กรรมการคนที่ ${index}`,

          name:
            storedName ||
            currentName ||
            "-",

          position:
            officer?.position ||
            "-",
        };
      }
    );

  /* =======================================================
     SORT ROWS
  ======================================================= */

  const sortedRows =
    [
      ...inspection.rows,
    ].sort(
      compareMaterial
    );

  /* =======================================================
     GROUP ROWS
  ======================================================= */

  const groupedRows =
    categoryOrder
      .map(
        (
          category
        ) => ({
          category,

          name:
            categoryName[
              category
            ] ??
            category,

          rows:
            sortedRows.filter(
              (row) =>
                row.material
                  .category ===
                category
            ),
        })
      )
      .filter(
        (group) =>
          group.rows
            .length > 0
      );

  /* =======================================================
     URL
  ======================================================= */

  const historyHref =
    `/stock-card/inspection-history?fiscalYear=${fiscalYear}`;

  const editHref =
    `/stock-card/inspection-history/${fiscalYear}/edit`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📋"
        title="รายละเอียดการตรวจสอบบัญชีพัสดุประจำปี"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        actions={
          <>
            <AppButton
              href={
                editHref
              }
              variant="secondary"
              size="md"
            >
              ✏️ แก้ไขข้อมูล
            </AppButton>

            <AppButton
              href={
                historyHref
              }
              variant="back"
              size="md"
            >
              ← กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          INSPECTION INFORMATION
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          p-4

          sm:p-5
          lg:p-6
        "
      >
        <div
          className="
            mb-5
          "
        >
          <h2
            className="
              text-lg
              font-black
              tracking-tight

              !text-slate-900

              sm:text-xl
            "
          >
            ข้อมูลการตรวจสอบ
          </h2>

          <p
            className="
              mt-1

              text-sm
              font-semibold

              !text-slate-500
            "
          >
            ข้อมูลที่บันทึกไว้สำหรับการตรวจสอบบัญชีพัสดุประจำปี
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1

            gap-4

            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          {/* ===============================================
              FISCAL YEAR
          =============================================== */}

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold

                !text-slate-500
              "
            >
              ปีงบประมาณ
            </p>

            <p
              className="
                mt-2

                text-lg
                font-extrabold

                !text-slate-900
              "
            >
              พ.ศ.{" "}
              {
                inspection.fiscalYear
              }
            </p>
          </AppInfoCard>

          {/* ===============================================
              INSPECTION DATE
          =============================================== */}

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold

                !text-slate-500
              "
            >
              วันที่ตรวจสอบ
            </p>

            <p
              className="
                mt-2

                text-lg
                font-extrabold

                !text-slate-900
              "
            >
              {formatInspectionDate(
                inspection.inspectionDate
              )}
            </p>
          </AppInfoCard>

          {/* ===============================================
              ROW COUNT
          =============================================== */}

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold

                !text-slate-500
              "
            >
              จำนวนรายการพัสดุ
            </p>

            <p
              className="
                mt-2

                text-lg
                font-extrabold
                tabular-nums

                !text-slate-900
              "
            >
              {inspection.rows.length.toLocaleString(
                "th-TH"
              )}{" "}
              รายการ
            </p>
          </AppInfoCard>

          {/* ===============================================
              CREATED AT
          =============================================== */}

          <AppInfoCard>
            <p
              className="
                text-sm
                font-bold

                !text-slate-500
              "
            >
              วันที่บันทึก
            </p>

            <p
              className="
                mt-2

                text-base
                font-extrabold

                !text-slate-900
              "
            >
              {formatCreatedDate(
                inspection.createdAt
              )}
            </p>
          </AppInfoCard>
        </div>
      </AppCard>

      {/* =====================================================
          COMMITTEE
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          p-4

          sm:p-5
          lg:p-6
        "
      >
        <div
          className="
            mb-5
          "
        >
          <h2
            className="
              text-lg
              font-black
              tracking-tight

              !text-slate-900

              sm:text-xl
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
            รายชื่อคณะกรรมการตรวจสอบจำนวน 3 คน
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1

            gap-4

            lg:grid-cols-3
          "
        >
          {Array.from({
            length: 3,
          }).map(
            (
              _,
              index
            ) => {
              const inspector =
                inspectors[
                  index
                ];

              return (
                <AppInfoCard
                  key={
                    index
                  }
                >
                  <p
                    className="
                      text-sm
                      font-bold

                      !text-slate-500
                    "
                  >
                    {
                      inspectorRoleNames[
                        index
                      ]
                    }
                  </p>

                  <p
                    className="
                      mt-2

                      text-base
                      font-extrabold

                      !text-slate-900
                    "
                  >
                    {inspector?.name ??
                      "-"}
                  </p>

                  <p
                    className="
                      mt-1

                      text-sm
                      font-semibold

                      !text-slate-500
                    "
                  >
                    {inspector?.position ??
                      "-"}
                  </p>
                </AppInfoCard>
              );
            }
          )}
        </div>
      </AppCard>

      {/* =====================================================
          INSPECTION ROWS
      ===================================================== */}

      <AppTableCard
        title="ผลการตรวจสอบบัญชีพัสดุ"
        subtitle={`ข้อมูลผลการตรวจสอบที่บันทึกไว้ • ทั้งหมด ${inspection.rows.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        badge={`${inspection.rows.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            w-full
            min-w-0

            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1650px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รายการพัสดุ",
                  "หน่วยนับ",
                  "ถูกต้อง",
                  "ไม่ถูกต้อง",
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                  "ชำรุด",
                  "เสื่อมสภาพ",
                  "ไม่จำเป็นต้องใช้",
                  "หมายเหตุ",
                ].map(
                  (
                    title
                  ) => (
                    <th
                      key={
                        title
                      }
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-3
                        py-4

                        text-center
                        text-base
                        font-extrabold

                        !text-white
                      "
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
              {groupedRows.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      13
                    }
                    className="
                      border
                      border-black

                      px-4
                      py-12

                      text-center
                      text-base
                      font-bold

                      !text-slate-500
                    "
                  >
                    ไม่พบรายการผลการตรวจสอบ
                  </td>
                </tr>
              ) : (
                groupedRows.map(
                  (
                    group
                  ) => (
                    <CategoryRows
                      key={
                        group.category
                      }
                      categoryName={
                        group.name
                      }
                      rows={
                        group.rows
                      }
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}

/* =========================================================
   CATEGORY ROWS
========================================================= */

function CategoryRows({
  categoryName,
  rows,
}: {
  categoryName: string;

  rows: Array<{
    id: number;

    accuracy:
      | string
      | null;

    shortageQty:
      | number
      | null;

    excessQty:
      | number
      | null;

    baht:
      | number
      | null;

    satang:
      | number
      | null;

    damagedQty:
      | number
      | null;

    deterioratedQty:
      | number
      | null;

    unnecessaryQty:
      | number
      | null;

    remark:
      | string
      | null;

    material: {
      id: number;
      code: string;
      name: string;
      unit: string;
      category: string;
    };
  }>;
}) {
  return (
    <>
      {/* =====================================================
          CATEGORY HEADER
      ===================================================== */}

      <tr>
        <td
          colSpan={
            13
          }
          className="
            border
            border-black

            bg-slate-200

            px-4
            py-3

            text-left
            text-base
            font-black

            !text-slate-900
          "
        >
          {
            categoryName
          }
        </td>
      </tr>

      {/* =====================================================
          MATERIAL ROW
      ===================================================== */}

      {rows.map(
        (
          row,
          index
        ) => {
          const correct =
            row.accuracy ===
            "CORRECT";

          const incorrect =
            row.accuracy ===
            "INCORRECT";

          return (
            <tr
              key={
                row.id
              }
              className={`
                transition-colors
                duration-150

                hover:bg-blue-50/70

                ${
                  index %
                    2 ===
                  0
                    ? "bg-white"
                    : "bg-slate-50/70"
                }
              `}
            >
              {/* ===========================================
                  ORDER
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-bold

                  !text-slate-700
                "
              >
                {(
                  index +
                  1
                ).toLocaleString(
                  "th-TH"
                )}
              </td>

              {/* ===========================================
                  MATERIAL
              =========================================== */}

              <td
                className="
                  min-w-[320px]

                  border
                  border-black

                  px-4
                  py-3

                  text-left

                  !text-slate-900
                "
              >
                <div
                  className="
                    font-extrabold
                  "
                >
                  {
                    row.material
                      .name
                  }
                </div>

                <div
                  className="
                    mt-1

                    text-xs
                    font-semibold

                    !text-slate-500
                  "
                >
                  รหัส{" "}
                  {
                    row.material
                      .code
                  }
                </div>
              </td>

              {/* ===========================================
                  UNIT
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold

                  !text-slate-700
                "
              >
                {row.material
                  .unit ||
                  "-"}
              </td>

              {/* ===========================================
                  CORRECT
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  text-lg
                  font-black

                  !text-slate-900
                "
              >
                {correct
                  ? "✓"
                  : ""}
              </td>

              {/* ===========================================
                  INCORRECT
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  text-lg
                  font-black

                  !text-slate-900
                "
              >
                {incorrect
                  ? "✓"
                  : ""}
              </td>

              {/* ===========================================
                  SHORTAGE
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.shortageQty
                )}
              </td>

              {/* ===========================================
                  EXCESS
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.excessQty
                )}
              </td>

              {/* ===========================================
                  BAHT
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.baht
                )}
              </td>

              {/* ===========================================
                  SATANG
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.satang
                )}
              </td>

              {/* ===========================================
                  DAMAGED
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.damagedQty
                )}
              </td>

              {/* ===========================================
                  DETERIORATED
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.deterioratedQty
                )}
              </td>

              {/* ===========================================
                  UNNECESSARY
              =========================================== */}

              <td
                className="
                  border
                  border-black

                  px-3
                  py-3

                  text-center
                  font-semibold
                  tabular-nums

                  !text-slate-800
                "
              >
                {displayNumber(
                  row.unnecessaryQty
                )}
              </td>

              {/* ===========================================
                  REMARK
              =========================================== */}

              <td
                className="
                  min-w-[240px]

                  border
                  border-black

                  px-4
                  py-3

                  text-left
                  font-semibold

                  !text-slate-700
                "
              >
                {row.remark ||
                  ""}
              </td>
            </tr>
          );
        }
      )}
    </>
  );
}