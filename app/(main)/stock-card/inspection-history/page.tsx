import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
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
  searchParams: Promise<{
    fiscalYear?: string;
  }>;
};

/* =========================================================
   THAI MONTHS
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
   CURRENT FISCAL YEAR
========================================================= */

function getCurrentFiscalYearThai() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "numeric",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "month"
      )?.value
    );

  const fiscalChristianYear =
    month >= 10
      ? year + 1
      : year;

  return (
    fiscalChristianYear +
    543
  );
}

/* =========================================================
   INSPECTION DATE

   inspectionDate เก็บเป็น Date Only แบบ UTC
   จึงอ่านด้วย UTC เพื่อไม่ให้วันที่เลื่อน
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
   INSPECTOR NAMES
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
   PAGE
========================================================= */

export default async function StockCardInspectionHistoryPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const currentFiscalYear =
    getCurrentFiscalYearThai();

  const requestedFiscalYear =
    Number(
      params.fiscalYear
    );

  const selectedFiscalYear =
    Number.isInteger(
      requestedFiscalYear
    ) &&
    requestedFiscalYear >=
      2400 &&
    requestedFiscalYear <=
      3000
      ? requestedFiscalYear
      : null;

  /* =======================================================
     DATA
  ======================================================= */

  const inspections =
    await prisma.stockCardInspection.findMany(
      {
        where:
          selectedFiscalYear !==
          null
            ? {
                fiscalYear:
                  selectedFiscalYear,
              }
            : undefined,

        include: {
          _count: {
            select: {
              rows:
                true,
            },
          },
        },

        orderBy: [
          {
            fiscalYear:
              "desc",
          },

          {
            inspectionDate:
              "desc",
          },

          {
            id:
              "desc",
          },
        ],
      }
    );

  /* =======================================================
     URL
  ======================================================= */

  const backFiscalYear =
    selectedFiscalYear ??
    currentFiscalYear;

  const backHref =
    `/stock-card?fiscalYear=${backFiscalYear}`;

  const newInspectionHref =
    `/stock-card/inspection?fiscalYear=${backFiscalYear}`;

  const clearFilterHref =
    "/stock-card/inspection-history";

  /* =======================================================
     SUBTITLE
  ======================================================= */

  const tableSubtitle =
    selectedFiscalYear !==
    null
      ? `ประวัติการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${selectedFiscalYear}`
      : "ประวัติการตรวจสอบบัญชีพัสดุประจำปีทั้งหมด";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🗂️"
        title="ประวัติการตรวจสอบบัญชีพัสดุประจำปี"
        subtitle="ตรวจสอบและเรียกดูผลการตรวจสอบบัญชีพัสดุที่บันทึกไว้"
        actions={
          <>
            <AppButton
              href={
                newInspectionHref
              }
              variant="primary"
              size="md"
            >
              🔎 ตรวจสอบบัญชีพัสดุประจำปี
            </AppButton>

            <AppButton
              href={
                backHref
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
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการประวัติการตรวจสอบ"
        subtitle={
          tableSubtitle
        }
        badge={`${inspections.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            FILTER INFORMATION
        =================================================== */}

        {selectedFiscalYear !==
          null && (
          <div
            className="
              mb-4

              flex
              w-full
              min-w-0
              flex-col
              gap-3

              rounded-[18px]

              border
              border-slate-200

              bg-slate-50/80

              px-4
              py-3

              shadow-sm

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  text-sm
                  font-extrabold

                  !text-slate-900
                "
              >
                กำลังแสดงปีงบประมาณ{" "}
                {
                  selectedFiscalYear
                }
              </p>

              <p
                className="
                  mt-1

                  text-xs
                  font-semibold

                  !text-slate-500
                "
              >
                แสดงเฉพาะประวัติการตรวจสอบของปีงบประมาณที่เลือก
              </p>
            </div>

            <AppButton
              href={
                clearFilterHref
              }
              variant="secondary"
              size="sm"
            >
              แสดงประวัติทั้งหมด
            </AppButton>
          </div>
        )}

        {/* ===================================================
            TABLE SCROLL
        =================================================== */}

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
              min-w-[1050px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "ปีงบประมาณ",
                  "วันที่ตรวจสอบ",
                  "จำนวนรายการ",
                  "คณะกรรมการตรวจสอบ",
                  "วันที่บันทึก",
                  "การดำเนินการ",
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

                        px-4
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
              {inspections.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      7
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
                    {selectedFiscalYear !==
                    null
                      ? `ยังไม่มีประวัติการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${selectedFiscalYear}`
                      : "ยังไม่มีประวัติการตรวจสอบบัญชีพัสดุ"}
                  </td>
                </tr>
              ) : (
                inspections.map(
                  (
                    inspection,
                    index
                  ) => {
                    const inspectorNames =
                      parseInspectorNames(
                        inspection.inspectorNames
                      );

                    const detailHref =
                      `/stock-card/inspection-history/${inspection.fiscalYear}`;

                    return (
                      <tr
                        key={
                          inspection.id
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
                        {/* =====================================
                            ORDER
                        ===================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-4

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

                        {/* =====================================
                            FISCAL YEAR
                        ===================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-4
                            py-4

                            text-center
                            text-base
                            font-extrabold

                            !text-slate-900
                          "
                        >
                          {
                            inspection.fiscalYear
                          }
                        </td>

                        {/* =====================================
                            INSPECTION DATE
                        ===================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-4

                            text-center
                            font-semibold

                            !text-slate-700
                          "
                        >
                          {formatInspectionDate(
                            inspection.inspectionDate
                          )}
                        </td>

                        {/* =====================================
                            ROW COUNT
                        ===================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-4
                            py-4

                            text-center
                            font-bold
                            tabular-nums

                            !text-slate-800
                          "
                        >
                          {inspection._count.rows.toLocaleString(
                            "th-TH"
                          )}{" "}
                          รายการ
                        </td>

                        {/* =====================================
                            INSPECTORS
                        ===================================== */}

                        <td
                          className="
                            min-w-[280px]

                            border
                            border-black

                            px-4
                            py-4

                            align-top

                            font-semibold

                            !text-slate-700
                          "
                        >
                          {inspectorNames.length >
                          0 ? (
                            <div
                              className="
                                space-y-1.5
                              "
                            >
                              {inspectorNames.map(
                                (
                                  name,
                                  inspectorIndex
                                ) => (
                                  <div
                                    key={`${inspection.id}-${inspectorIndex}`}
                                    className="
                                      flex
                                      min-w-0
                                      items-start
                                      gap-2
                                    "
                                  >
                                    <span
                                      className="
                                        shrink-0

                                        font-extrabold

                                        !text-slate-500
                                      "
                                    >
                                      {inspectorIndex +
                                        1}
                                      .
                                    </span>

                                    <span
                                      className="
                                        min-w-0
                                        break-words
                                      "
                                    >
                                      {
                                        name
                                      }
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div
                              className="
                                text-center

                                !text-slate-400
                              "
                            >
                              -
                            </div>
                          )}
                        </td>

                        {/* =====================================
                            CREATED AT
                        ===================================== */}

                        <td
                          className="
                            min-w-[190px]

                            border
                            border-black

                            px-4
                            py-4

                            text-center
                            font-semibold

                            !text-slate-700
                          "
                        >
                          {formatCreatedDate(
                            inspection.createdAt
                          )}
                        </td>

                        {/* =====================================
                            ACTION
                        ===================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-4
                            py-4

                            text-center
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >
                            <AppButton
                              href={
                                detailHref
                              }
                              variant="secondary"
                              size="sm"
                            >
                              ดู / แก้ไข
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}