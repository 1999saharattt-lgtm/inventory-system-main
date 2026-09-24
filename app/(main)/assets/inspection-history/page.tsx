import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   THAI DATE
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

  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${
    date.getFullYear() + 543
  }`;
}

/* =========================================================
   INSPECTOR COUNT
========================================================= */

function getInspectorCount(
  value: unknown
) {
  if (!value) {
    return 0;
  }

  if (
    Array.isArray(value)
  ) {
    return value.filter(
      Boolean
    ).length;
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed.filter(
          Boolean
        ).length;
      }
    } catch {
      return value
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
        .length;
    }
  }

  return 0;
}

/* =========================================================
   TYPES
========================================================= */

type HistoryItem = {
  departmentId: number;

  departmentName: string;

  year: string;

  inspectionStartDate:
    | Date
    | string
    | null;

  inspectionEndDate:
    | Date
    | string
    | null;

  assetIds: Set<number>;

  inspectorCount: number;
};

/* =========================================================
   PAGE
========================================================= */

export default async function InspectionHistoryPage() {
  /* =======================================================
     LOAD INSPECTIONS
  ======================================================= */

  const inspections =
    await prisma.assetInspection.findMany({
      include: {
        asset: {
          include: {
            department:
              true,
          },
        },
      },

      orderBy: {
        year:
          "desc",
      },
    });

  /* =======================================================
     GROUP HISTORY

     แยกตาม:
     - กลุ่มงาน
     - ปีงบประมาณ
  ======================================================= */

  const historyMap =
    new Map<
      string,
      HistoryItem
    >();

  for (
    const inspection of
    inspections
  ) {
    const department =
      inspection.asset
        ?.department;

    if (!department) {
      continue;
    }

    const year =
      String(
        inspection.year
      );

    const key =
      `${department.id}-${year}`;

    const existing =
      historyMap.get(
        key
      );

    /* =====================================================
       FIRST ITEM
    ===================================================== */

    if (!existing) {
      historyMap.set(
        key,
        {
          departmentId:
            department.id,

          departmentName:
            department.name,

          year,

          inspectionStartDate:
            inspection.inspectionStartDate,

          inspectionEndDate:
            inspection.inspectionEndDate,

          assetIds:
            new Set([
              inspection.assetId,
            ]),

          inspectorCount:
            getInspectorCount(
              inspection.inspectorIds
            ),
        }
      );

      continue;
    }

    /* =====================================================
       ASSET COUNT
    ===================================================== */

    existing.assetIds.add(
      inspection.assetId
    );

    /* =====================================================
       INSPECTOR COUNT
    ===================================================== */

    const inspectorCount =
      getInspectorCount(
        inspection.inspectorIds
      );

    if (
      inspectorCount >
      existing.inspectorCount
    ) {
      existing.inspectorCount =
        inspectorCount;
    }

    /* =====================================================
       EARLIEST START DATE
    ===================================================== */

    if (
      inspection.inspectionStartDate &&
      (
        !existing.inspectionStartDate ||
        new Date(
          inspection.inspectionStartDate
        ) <
          new Date(
            existing.inspectionStartDate
          )
      )
    ) {
      existing.inspectionStartDate =
        inspection.inspectionStartDate;
    }

    /* =====================================================
       LATEST END DATE
    ===================================================== */

    if (
      inspection.inspectionEndDate &&
      (
        !existing.inspectionEndDate ||
        new Date(
          inspection.inspectionEndDate
        ) >
          new Date(
            existing.inspectionEndDate
          )
      )
    ) {
      existing.inspectionEndDate =
        inspection.inspectionEndDate;
    }
  }

  /* =======================================================
     SORT HISTORY

     1. ปีล่าสุดก่อน
     2. ชื่อกลุ่มงาน
  ======================================================= */

  const history =
    Array.from(
      historyMap.values()
    ).sort(
      (a, b) => {
        const yearCompare =
          Number(
            b.year.replace(
              /\D/g,
              ""
            )
          ) -
          Number(
            a.year.replace(
              /\D/g,
              ""
            )
          );

        if (
          yearCompare !==
          0
        ) {
          return yearCompare;
        }

        return a.departmentName.localeCompare(
          b.departmentName,
          "th"
        );
      }
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📋"
        title="ประวัติการตรวจสอบครุภัณฑ์ประจำปี"
        subtitle="แสดงประวัติการตรวจสอบครุภัณฑ์แยกตามกลุ่มงานและปีงบประมาณ"
        actions={
          <AppButton
            href="/assets"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          HISTORY TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการประวัติการตรวจสอบ"
        subtitle="ประวัติการตรวจสอบครุภัณฑ์ประจำปีของแต่ละกลุ่มงาน"
        badge={`${history.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
          max-w-full
        "
      >
        {/* =================================================
            RESPONSIVE TABLE
        ================================================= */}

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
              min-w-[1400px]

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
                  "ชื่อกลุ่มงาน",
                  "ประจำปีงบประมาณ",
                  "วันที่เริ่มตรวจสอบ",
                  "วันที่ตรวจสอบแล้วเสร็จ",
                  "จำนวนครุภัณฑ์",
                  "ผู้ตรวจสอบ",
                  "รายละเอียดข้อมูล",
                  "จัดการ",
                ].map(
                  (
                    tableTitle
                  ) => (
                    <th
                      key={
                        tableTitle
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
                        font-extrabold

                        !text-white
                      "
                    >
                      {
                        tableTitle
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
              {history.length >
              0 ? (
                history.map(
                  (
                    item,
                    index
                  ) => {
                    const detailHref =
                      `/assets/${item.departmentId}/inspection-history/${item.year}`;

                    const editHref =
                      `${detailHref}/edit`;

                    return (
                      <tr
                        key={`${item.departmentId}-${item.year}`}
                        className={`
                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          transition-colors
                          duration-200

                          hover:bg-emerald-50/60
                        `}
                      >
                        {/* ===================================
                            ORDER
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center

                            font-semibold
                            tabular-nums

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

                        {/* ===================================
                            DEPARTMENT
                        =================================== */}

                        <td
                          className="
                            min-w-[260px]

                            border
                            border-black

                            px-4
                            py-3.5

                            text-left

                            font-extrabold

                            !text-slate-900
                          "
                        >
                          {
                            item.departmentName
                          }
                        </td>

                        {/* ===================================
                            FISCAL YEAR
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center

                            font-extrabold
                            tabular-nums

                            !text-slate-900
                          "
                        >
                          พ.ศ.{" "}
                          {
                            item.year
                          }
                        </td>

                        {/* ===================================
                            START DATE
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center

                            font-semibold

                            !text-slate-700
                          "
                        >
                          {formatThaiDate(
                            item.inspectionStartDate
                          )}
                        </td>

                        {/* ===================================
                            END DATE
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center

                            font-semibold

                            !text-slate-700
                          "
                        >
                          {formatThaiDate(
                            item.inspectionEndDate
                          )}
                        </td>

                        {/* ===================================
                            ASSET COUNT
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center

                            font-semibold
                            tabular-nums

                            !text-slate-700
                          "
                        >
                          {item.assetIds.size.toLocaleString(
                            "th-TH"
                          )}{" "}
                          รายการ
                        </td>

                        {/* ===================================
                            INSPECTOR COUNT
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center

                            font-semibold
                            tabular-nums

                            !text-slate-700
                          "
                        >
                          {item.inspectorCount.toLocaleString(
                            "th-TH"
                          )}{" "}
                          คน
                        </td>

                        {/* ===================================
                            DETAIL

                            ใช้ AppButton ตัวกลาง
                            สีเขียว
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-2.5

                            text-center
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <AppButton
                              href={
                                detailHref
                              }
                              variant="primary"
                              size="sm"
                            >
                              เปิด
                            </AppButton>
                          </div>
                        </td>

                        {/* ===================================
                            ACTIONS
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-2.5

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
                            {/* =============================
                                EDIT
                                ใช้ AppButton ตัวกลาง
                                สีเขียวตามมาตรฐานล่าสุด
                            ============================= */}

                            <AppButton
                              href={
                                editHref
                              }
                              variant="primary"
                              size="sm"
                            >
                              แก้ไข
                            </AppButton>

                            {/* =============================
                                DELETE
                                ใช้ AppButton ตัวกลาง
                                สีแดง

                                ยังไม่เชื่อม Delete
                                เพื่อคง behavior เดิม
                            ============================= */}

                            <AppButton
                              type="button"
                              variant="danger"
                              size="sm"
                              title="ขั้นถัดไปจะเชื่อมการลบพร้อมกล่องยืนยัน"
                            >
                              ลบ
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* ===========================================
                    EMPTY STATE
                =========================================== */

                <tr>
                  <td
                    colSpan={
                      9
                    }
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto

                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-16
                          w-16

                          place-items-center

                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        📋
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight

                          !text-slate-900
                        "
                      >
                        ยังไม่มีประวัติการตรวจสอบครุภัณฑ์ประจำปี
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed

                          !text-slate-500
                        "
                      >
                        เมื่อมีการบันทึกการตรวจสอบครุภัณฑ์
                        ประวัติการตรวจสอบจะแสดงในตารางนี้
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}