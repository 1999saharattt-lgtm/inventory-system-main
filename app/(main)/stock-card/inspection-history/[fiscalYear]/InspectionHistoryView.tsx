"use client";

import { Fragment, useMemo, useState } from "react";
import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";
import ExportInspectionPdf from "../../inspection/ExportInspectionPdf";

type Material = {
  materialId: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  openingBalance: number;
  receiveQty: number;
  issueQty: number;
  closingBalance: number;
};

type InspectionRow = {
  materialId: number;
  accuracy: string;
  shortageQty: string;
  excessQty: string;
  baht: string;
  satang: string;
  damagedQty: string;
  deterioratedQty: string;
  unnecessaryQty: string;
  remark: string;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  type: string;
  departmentId: number | null;
  sectionId: number | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};

type Props = {
  fiscalYear: number;
  startShortYear: string;
  endShortYear: string;
  materials: Material[];
  rows: InspectionRow[];
  officers: Officer[];
  inspectorIds: string[];
  inspectionStartDate: string;
  inspectionEndDate: string;
};

const CATEGORY_ORDER = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

const CATEGORY_NAME: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

const THAI_MONTHS = [
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

const COLUMN_WIDTHS = [
  42, 372, 72, 132, 84, 84, 90, 60, 78,
  66, 66, 60, 60, 84, 90, 108, 162,
];

const TABLE_MIN_WIDTH = 1710;

const th = [
  "border border-black",
  "bg-gradient-to-r from-slate-800 to-slate-700",
  "px-2 py-3 text-center align-middle",
  "text-sm font-extrabold !text-white",
  "whitespace-normal break-words",
].join(" ");

const td = [
  "border border-black",
  "px-2 py-3 text-center align-middle",
  "text-sm font-semibold !text-slate-800",
].join(" ");

function formatThaiDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "-";
  }

  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`;
}

function shouldShowMaterial(material: Material): boolean {
  const name = material.name.trim();

  if (/\(สสส\.\)\s*$/u.test(name)) {
    return false;
  }

  if (
    material.category === "ELECTRIC" &&
    /ถ่านกระดุม/iu.test(name)
  ) {
    return false;
  }

  return true;
}

function displayValue(
  value: string | number | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value.toLocaleString("th-TH")
      : "-";
  }

  return String(value);
}

function getOfficerName(
  officer: Officer | undefined
): string {
  if (!officer) {
    return "-";
  }

  return `${officer.firstName} ${officer.lastName}`.trim();
}

export default function InspectionHistoryView({
  fiscalYear,
  startShortYear,
  endShortYear,
  materials,
  rows,
  officers,
  inspectorIds,
  inspectionStartDate,
  inspectionEndDate,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const savedRows = useMemo(
    () => new Map(rows.map((row) => [row.materialId, row])),
    [rows]
  );

  const allowedMaterials = useMemo(
    () => materials.filter(shouldShowMaterial),
    [materials]
  );

  const visibleMaterials = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("th");

    return allowedMaterials.filter((material) => {
      const matchesCategory =
        category === "ALL" || material.category === category;

      const matchesSearch =
        keyword.length === 0 ||
        `${material.code} ${material.name}`
          .toLocaleLowerCase("th")
          .includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [allowedMaterials, search, category]);

  const categories = useMemo(
    () => [
      ...new Set(
        allowedMaterials.map((material) => material.category)
      ),
    ],
    [allowedMaterials]
  );

  const groupedMaterials = useMemo(() => {
    const orderedCategories = [
      ...CATEGORY_ORDER,
      ...categories.filter(
        (item) => !CATEGORY_ORDER.includes(item)
      ),
    ];

    return orderedCategories
      .map((item) => ({
        category: item,
        name: CATEGORY_NAME[item] ?? item,
        materials: visibleMaterials.filter(
          (material) => material.category === item
        ),
      }))
      .filter((group) => group.materials.length > 0);
  }, [categories, visibleMaterials]);

  const officerMap = useMemo(
    () => new Map(officers.map((officer) => [
      String(officer.id),
      officer,
    ])),
    [officers]
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AppCard>
        <div className="grid gap-4 p-2 md:grid-cols-2">
          <div>
            <div className="text-sm font-bold text-slate-600">
              วันที่เริ่มตรวจสอบ
            </div>

            <div className="mt-1 rounded-xl bg-slate-50 p-3 font-semibold text-slate-900">
              {formatThaiDate(inspectionStartDate)}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-600">
              วันที่ตรวจสอบแล้วเสร็จ
            </div>

            <div className="mt-1 rounded-xl bg-slate-50 p-3 font-semibold text-slate-900">
              {formatThaiDate(inspectionEndDate)}
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div className="p-2">
          <h3 className="mb-3 font-extrabold text-slate-900">
            คณะกรรมการตรวจสอบ
          </h3>

          <div className="grid gap-3 md:grid-cols-3">
            {inspectorIds.map((id, index) => {
              const officer = officerMap.get(id);

              return (
                <div
                  key={`${index}-${id}`}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <div className="text-xs font-bold text-slate-500">
                    {index === 0
                      ? "ประธานกรรมการ"
                      : `กรรมการคนที่ ${index}`}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {getOfficerName(officer)}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    {officer?.position || "-"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppCard>

      <AppTableCard
        title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        badge={`${visibleMaterials.length.toLocaleString("th-TH")} รายการ`}
        className="w-full min-w-0"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-3">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm font-semibold text-slate-700">
              ค้นหา

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ค้นหารหัส / ชื่อวัสดุ"
                className="mt-1 block h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              หมวดวัสดุ

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="mt-1 block h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="ALL">ทุกหมวด</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_NAME[item] ?? item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ExportInspectionPdf
            fiscalYear={fiscalYear}
            startShortYear={startShortYear}
            endShortYear={endShortYear}
            materials={allowedMaterials}
            rows={rows}
            inspectionStartDate={inspectionStartDate}
            inspectionEndDate={inspectionEndDate}
            inspectorIds={inspectorIds}
            officers={officers}
          />
        </div>

        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
          เลื่อนตารางซ้าย–ขวา เพื่อดูข้อมูลทั้งหมด
        </div>

        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table
            className="w-full table-fixed border-collapse bg-white text-[15px]"
            style={{ minWidth: TABLE_MIN_WIDTH }}
          >
            <colgroup>
              {COLUMN_WIDTHS.map((width, index) => (
                <col
                  key={index}
                  style={{ width: `${width}px` }}
                />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th rowSpan={2} className={th}>
                  ลำดับ
                </th>

                <th rowSpan={2} className={th}>
                  ชื่อหรือชนิดวัสดุหรือครุภัณฑ์
                </th>

                <th rowSpan={2} className={th}>
                  หน่วยนับ
                </th>

                <th rowSpan={2} className={th}>
                  คงเหลือยอดยกมาเมื่อ
                  <div>30 ก.ย. {startShortYear}</div>
                </th>

                <th colSpan={2} className={th}>
                  01 ต.ค. {startShortYear} - 30 ก.ย.{" "}
                  {endShortYear}
                </th>

                <th rowSpan={2} className={th}>
                  คงเหลือปัจจุบัน
                </th>

                <th colSpan={2} className={th}>
                  ผลการตรวจสอบ
                </th>

                <th colSpan={4} className={th}>
                  ถ้าไม่ถูกต้องจำนวนที่ขาด
                  <div>
                    จำนวนที่เกินคิดเป็นเงินร้อยละ
                  </div>
                </th>

                <th colSpan={3} className={th}>
                  จำนวนที่
                </th>

                <th rowSpan={2} className={th}>
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                {[
                  "รับ",
                  "จ่าย",
                  "ถูกต้อง",
                  "ไม่ถูกต้อง",
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                  "ชำรุด",
                  "เสื่อมสภาพ",
                  "ไม่จำเป็นต้องใช้",
                ].map((label) => (
                  <th
                    key={label}
                    className={`${th} !py-2`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleMaterials.length === 0 && (
                <tr>
                  <td
                    colSpan={17}
                    className={`${td} py-12`}
                  >
                    ไม่พบรายการพัสดุ
                  </td>
                </tr>
              )}

              {groupedMaterials.map((group) => (
                <Fragment key={group.category}>
                  <tr>
                    <td
                      colSpan={17}
                      className="border border-black bg-slate-100 px-4 py-2 text-left font-extrabold !text-slate-900"
                    >
                      {group.name}
                    </td>
                  </tr>

                  {group.materials.map(
                    (material, index) => {
                      const row = savedRows.get(
                        material.materialId
                      );

                      const values: Array<
                        string | number | null | undefined
                      > = [
                        index + 1,
                        material.name,
                        material.unit,
                        material.openingBalance,
                        material.receiveQty,
                        material.issueQty,
                        material.closingBalance,
                        row?.accuracy === "CORRECT"
                          ? "✓"
                          : "",
                        row?.accuracy === "INCORRECT"
                          ? "✓"
                          : "",
                        row?.shortageQty,
                        row?.excessQty,
                        row?.baht,
                        row?.satang,
                        row?.damagedQty,
                        row?.deterioratedQty,
                        row?.unnecessaryQty,
                        row?.remark,
                      ];

                      return (
                        <tr
                          key={material.materialId}
                          className={
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/70"
                          }
                        >
                          {values.map((value, column) => (
                            <td
                              key={column}
                              className={[
                                td,
                                column === 1
                                  ? "text-left"
                                  : "",
                              ].join(" ")}
                            >
                              {column === 1 ? (
                                <>
                                  <div className="font-extrabold">
                                    {material.name}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    รหัส {material.code}
                                  </div>
                                </>
                              ) : column === 7 ||
                                column === 8 ? (
                                value || ""
                              ) : (
                                displayValue(value)
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </div>
  );
}