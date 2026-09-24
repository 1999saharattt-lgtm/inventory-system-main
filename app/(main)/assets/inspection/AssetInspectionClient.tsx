"use client";

import {
  useMemo,
  useState,
} from "react";

import AppSearchInput from "@/components/AppSearchInput";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type InspectionRow = {
  id: number;

  inspectionDate: string;

  quarter: string;

  year: number;

  status: string;

  asset: {
    id: number;

    departmentId: number;

    category: string;

    name: string;

    officeAssetNo:
      | string
      | null;

    departmentName: string;

    sectionName:
      | string
      | null;

    officerName:
      | string
      | null;
  };
};

type Props = {
  inspections:
    InspectionRow[];
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  DESK:
    "โต๊ะ",

  CHAIR:
    "เก้าอี้",

  AIR_CONDITIONER:
    "เครื่องปรับอากาศ",

  CABINET:
    "ตู้และชั้น",

  SHELF:
    "ชั้นวาง",

  COMPUTER:
    "คอมพิวเตอร์",

  MONITOR:
    "จอภาพ",

  PRINTER:
    "เครื่องพิมพ์",

  TELEPHONE:
    "เครื่องโทรศัพท์",

  OTHER:
    "ทั่วไป",

  NO_SYSTEM:
    "ไม่มีอยู่ในระบบ",
};

/* =========================================================
   INSPECTION STATUS
========================================================= */

const inspectionStatusName:
  Record<string, string> = {
    IN_USE:
      "ใช้งานอยู่",

    RETURNED:
      "ส่งคืน",

    DAMAGED:
      "ชำรุด",

    MISSING:
      "สูญหาย",

    NOT_FOUND:
      "ไม่พบครุภัณฑ์",
  };

/* =========================================================
   QUARTER
========================================================= */

const quarterName:
  Record<string, string> = {
    Q1:
      "ไตรมาส 1",

    Q2:
      "ไตรมาส 2",

    Q3:
      "ไตรมาส 3",

    Q4:
      "ไตรมาส 4",
  };

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string
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

  return date.toLocaleDateString(
    "th-TH",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",
    }
  );
}

/* =========================================================
   STATUS STYLE
========================================================= */

function getStatusStyle(
  status: string
) {
  switch (status) {
    case "IN_USE":
      return `
        bg-emerald-100
        !text-emerald-700
        ring-1
        ring-inset
        ring-emerald-200
      `;

    case "RETURNED":
      return `
        bg-sky-100
        !text-sky-700
        ring-1
        ring-inset
        ring-sky-200
      `;

    case "DAMAGED":
    case "MISSING":
    case "NOT_FOUND":
      return `
        bg-red-100
        !text-red-700
        ring-1
        ring-inset
        ring-red-200
      `;

    default:
      return `
        bg-slate-100
        !text-slate-700
        ring-1
        ring-inset
        ring-slate-200
      `;
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AssetInspectionClient({
  inspections,
}: Props) {
  /* =======================================================
     SEARCH STATE
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const keyword =
    search
      .trim()
      .toLowerCase();

  /* =======================================================
     SEARCH

     ค้นหา:
     - ชื่อครุภัณฑ์
     - เลขประจำสำนัก
     - กลุ่มงาน
     - ส่วนงาน
     - ผู้ครอบครอง
     - ประเภท
     - สถานะ
     - ไตรมาส
     - ปี
  ======================================================= */

  const filteredInspections =
    useMemo(() => {
      if (!keyword) {
        return inspections;
      }

      return inspections.filter(
        (inspection) => {
          const category =
            categoryName[
              inspection.asset
                .category
            ] ??
            inspection.asset
              .category;

          const status =
            inspectionStatusName[
              inspection.status
            ] ??
            inspection.status;

          const quarter =
            quarterName[
              inspection.quarter
            ] ??
            inspection.quarter;

          const buddhistYear =
            String(
              inspection.year +
                543
            );

          const searchableValues =
            [
              inspection.asset
                .name,

              inspection.asset
                .officeAssetNo ??
                "",

              inspection.asset
                .departmentName,

              inspection.asset
                .sectionName ??
                "",

              inspection.asset
                .officerName ??
                "",

              category,

              status,

              quarter,

              String(
                inspection.year
              ),

              buddhistYear,
            ];

          return searchableValues.some(
            (value) =>
              value
                .toLowerCase()
                .includes(
                  keyword
                )
          );
        }
      );
    }, [
      inspections,
      keyword,
    ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        w-full
        min-w-0

        space-y-5

        sm:space-y-6
      "
    >
      {/* =====================================================
          SEARCH

          ใช้ AppSearchInput ตัวกลางทั้งหมด
          - ช่องค้นหา
          - ปุ่มค้นหา
          - ปุ่มล้าง
          - จำนวนผลลัพธ์
      ===================================================== */}

      <AppSearchInput
        value={search}
        onChange={(
          event
        ) =>
          setSearch(
            event.target.value
          )
        }
        onSubmit={() => {
          /*
           * Search เป็น realtime
           * อยู่แล้ว
           */
        }}
        onClear={() =>
          setSearch("")
        }
        placeholder="ค้นหาครุภัณฑ์ / กลุ่มงาน / ผู้ครอบครอง / สถานะ / ปีงบประมาณ"
        resultCount={
          filteredInspections.length
        }
        resultLabel="รายการ"
        showSearchButton
        showClearButton
        searchButtonText="ค้นหา"
        clearButtonText="ล้าง"
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="ประวัติการตรวจสอบครุภัณฑ์"
        subtitle="รายละเอียดผลการตรวจสอบครุภัณฑ์ของแต่ละกลุ่มงาน"
        badge={`${filteredInspections.length.toLocaleString(
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
              min-w-[1300px]

              border-collapse

              bg-white

              text-sm
            "
          >
            {/* ===============================================
                HEADER
            =============================================== */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "วันที่ตรวจ",
                  "รอบ",
                  "หน่วยงาน",
                  "ประเภท",
                  "ครุภัณฑ์",
                  "ผู้ครอบครอง",
                  "ผลตรวจ",
                  "รายละเอียด",
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

            {/* ===============================================
                BODY
            =============================================== */}

            <tbody>
              {filteredInspections.length >
              0 ? (
                filteredInspections.map(
                  (
                    inspection,
                    index
                  ) => {
                    const category =
                      categoryName[
                        inspection
                          .asset
                          .category
                      ] ??
                      inspection
                        .asset
                        .category;

                    const status =
                      inspectionStatusName[
                        inspection.status
                      ] ??
                      inspection.status;

                    const quarter =
                      quarterName[
                        inspection.quarter
                      ] ??
                      inspection.quarter;

                    const assetHref =
                      `/assets/${inspection.asset.departmentId}/${inspection.asset.category}/${inspection.asset.id}`;

                    const historyHref =
                      `${assetHref}/inspection`;

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
                            DATE
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
                          {formatDate(
                            inspection.inspectionDate
                          )}
                        </td>

                        {/* ===================================
                            QUARTER
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
                          <p>
                            {quarter}
                          </p>

                          <p
                            className="
                              mt-1

                              text-xs
                              font-semibold

                              !text-slate-500
                            "
                          >
                            พ.ศ.{" "}
                            {(
                              inspection.year +
                              543
                            ).toLocaleString(
                              "th-TH",
                              {
                                useGrouping:
                                  false,
                              }
                            )}
                          </p>
                        </td>

                        {/* ===================================
                            DEPARTMENT
                        =================================== */}

                        <td
                          className="
                            min-w-[200px]

                            border
                            border-black

                            px-3
                            py-3.5

                            font-semibold

                            !text-slate-700
                          "
                        >
                          <p
                            className="
                              font-extrabold
                              !text-slate-900
                            "
                          >
                            {
                              inspection
                                .asset
                                .departmentName
                            }
                          </p>

                          {inspection
                            .asset
                            .sectionName && (
                            <p
                              className="
                                mt-1

                                text-xs
                                font-semibold

                                !text-slate-500
                              "
                            >
                              {
                                inspection
                                  .asset
                                  .sectionName
                              }
                            </p>
                          )}
                        </td>

                        {/* ===================================
                            CATEGORY
                        =================================== */}

                        <td
                          className="
                            min-w-[150px]

                            border
                            border-black

                            px-3
                            py-3.5

                            font-semibold

                            !text-slate-700
                          "
                        >
                          {
                            category
                          }
                        </td>

                        {/* ===================================
                            ASSET
                        =================================== */}

                        <td
                          className="
                            min-w-[260px]

                            border
                            border-black

                            px-3
                            py-3.5

                            font-semibold

                            !text-slate-700
                          "
                        >
                          <a
                            href={
                              assetHref
                            }
                            className="
                              font-extrabold

                              !text-slate-900

                              underline-offset-4

                              transition-colors

                              hover:!text-emerald-700
                              hover:underline
                            "
                          >
                            {
                              inspection
                                .asset
                                .name
                            }
                          </a>

                          {inspection
                            .asset
                            .officeAssetNo && (
                            <p
                              className="
                                mt-1

                                text-xs
                                font-semibold

                                !text-slate-500
                              "
                            >
                              เลขประจำสำนัก:{" "}
                              {
                                inspection
                                  .asset
                                  .officeAssetNo
                              }
                            </p>
                          )}
                        </td>

                        {/* ===================================
                            OWNER
                        =================================== */}

                        <td
                          className="
                            min-w-[180px]

                            border
                            border-black

                            px-3
                            py-3.5

                            font-semibold

                            !text-slate-700
                          "
                        >
                          {inspection
                            .asset
                            .officerName ??
                            "-"}
                        </td>

                        {/* ===================================
                            STATUS
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap

                            border
                            border-black

                            px-3
                            py-3.5

                            text-center
                          "
                        >
                          <span
                            className={`
                              inline-flex

                              items-center
                              justify-center

                              rounded-full

                              px-3
                              py-1.5

                              text-xs
                              font-extrabold

                              ${getStatusStyle(
                                inspection.status
                              )}
                            `}
                          >
                            {
                              status
                            }
                          </span>
                        </td>

                        {/* ===================================
                            HISTORY

                            ใช้ AppButton ตัวกลาง
                            สีเขียวกรมอนามัย
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
                                historyHref
                              }
                              variant="primary"
                              size="sm"
                            >
                              ดูประวัติ
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
                        {keyword
                          ? "🔎"
                          : "📋"}
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
                        {keyword
                          ? "ไม่พบข้อมูลที่ค้นหา"
                          : "ยังไม่มีประวัติการตรวจสอบครุภัณฑ์"}
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
                        {keyword
                          ? `ไม่พบรายการที่ตรงกับ "${search}"`
                          : "เมื่อมีการตรวจสอบครุภัณฑ์ ข้อมูลจะแสดงในตารางนี้"}
                      </p>

                      {keyword && (
                        <div className="mt-5">
                          <AppButton
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setSearch(
                                ""
                              )
                            }
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </div>
  );
}