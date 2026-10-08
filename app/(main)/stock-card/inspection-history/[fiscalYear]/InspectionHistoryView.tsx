
"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import AppSearchInput from "@/components/AppSearchInput";
import AppSearchableSelect from "@/components/AppSearchableSelect";
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

type EditableField = Exclude<
  keyof InspectionRow,
  "materialId"
>;

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

const widths = [
  42, 372, 72, 132, 84, 84, 90, 60, 78,
  66, 66, 60, 60, 84, 90, 108, 162,
];

const headerClass =
  "border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-1 py-2 text-center align-middle text-[15px] font-extrabold leading-tight !text-white";

const cellClass =
  "h-[23.25px] border border-black px-1 py-0 text-center text-[15px] font-normal leading-none tabular-nums !text-black";

const inputClass =
  "h-7 w-full min-w-0 rounded-md border-2 !border-black bg-white px-1 text-center text-[14px] font-medium !text-black outline-none focus:ring-2 focus:ring-blue-200";

const formatStock = (value: number) =>
  Number.isFinite(value) && value !== 0
    ? value.toLocaleString("th-TH")
    : "-";

const formatCurrent = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("th-TH")
    : "0";

const dateText = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "-";

  const [y, m, d] = value.split("-").map(Number);

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

  return `${d} ${months[m - 1] ?? ""} ${y + 543}`;
};

const numberFields = [
  "shortageQty",
  "excessQty",
  "baht",
  "satang",
  "damagedQty",
  "deterioratedQty",
  "unnecessaryQty",
] as const;

export default function InspectionHistoryView(props: Props) {
  const router = useRouter();

  const {
    fiscalYear,
    startShortYear,
    endShortYear,
    materials,
    rows,
    officers,
    inspectorIds,
    inspectionStartDate,
    inspectionEndDate,
  } = props;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editedRows, setEditedRows] = useState<InspectionRow[]>(
    () => rows.map((row) => ({ ...row }))
  );

  const [editedInspectorIds, setEditedInspectorIds] =
    useState<string[]>(() => [
      inspectorIds[0] ?? "",
      inspectorIds[1] ?? "",
      inspectorIds[2] ?? "",
    ]);

  const [editedStartDate, setEditedStartDate] =
    useState(inspectionStartDate);

  const [editedEndDate, setEditedEndDate] =
    useState(inspectionEndDate);

  const rowMap = useMemo(
    () =>
      new Map(
        editedRows.map((row) => [row.materialId, row])
      ),
    [editedRows]
  );

  const filtered = useMemo(
    () =>
      materials.filter((material) => {
        if (
          selectedCategory !== "ALL" &&
          material.category !== selectedCategory
        ) {
          return false;
        }

        const q = searchTerm.trim().toLocaleLowerCase("th");

        return (
          !q ||
          [
            material.code,
            material.name,
            material.unit,
            CATEGORY_NAME[material.category],
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("th")
            .includes(q)
        );
      }),
    [materials, searchTerm, selectedCategory]
  );

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    name: CATEGORY_NAME[category],
    materials: filtered.filter(
      (material) => material.category === category
    ),
  })).filter((group) => group.materials.length);

  const officerMap = new Map(
    officers.map((officer) => [String(officer.id), officer])
  );

  const categories = [
    { value: "ALL", label: "ทุกหมวด" },
    ...CATEGORY_ORDER.map((category) => ({
      value: category,
      label: CATEGORY_NAME[category],
    })),
  ];

  const officerOptions = officers.map((officer) => ({
    value: String(officer.id),
    label: `${officer.firstName} ${officer.lastName}`.trim(),
  }));

  const updateRow = (
    materialId: number,
    field: EditableField,
    value: string
  ) => {
    setEditedRows((current) =>
      current.map((row) =>
        row.materialId === materialId
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const updateInspector = (index: number, value: string) => {
    setEditedInspectorIds((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const cancelEditing = () => {
    setEditedRows(rows.map((row) => ({ ...row })));

    setEditedInspectorIds([
      inspectorIds[0] ?? "",
      inspectorIds[1] ?? "",
      inspectorIds[2] ?? "",
    ]);

    setEditedStartDate(inspectionStartDate);
    setEditedEndDate(inspectionEndDate);

    setIsEditing(false);
    setError("");
    setMessage("");
  };

  const saveChanges = async () => {
    if (isSaving) return;

    setError("");
    setMessage("");

    if (!editedStartDate) {
      setError("กรุณาระบุวันที่เริ่มตรวจสอบ");
      return;
    }

    if (
      editedInspectorIds.length !== 3 ||
      editedInspectorIds.some((id) => !id)
    ) {
      setError("กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน");
      return;
    }

    if (new Set(editedInspectorIds).size !== 3) {
      setError("ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้");
      return;
    }

    for (const row of editedRows) {
      if (
        row.accuracy &&
        row.accuracy !== "CORRECT" &&
        row.accuracy !== "INCORRECT"
      ) {
        setError(`ผลการตรวจสอบรายการ ${row.materialId} ไม่ถูกต้อง`);
        return;
      }

      for (const field of numberFields) {
        const value = row[field].trim();

        if (
          value !== "" &&
          (!/^\d+$/.test(value) ||
            !Number.isSafeInteger(Number(value)))
        ) {
          setError(
            `กรุณากรอกจำนวนเต็มตั้งแต่ 0 ขึ้นไป ในรายการ ${row.materialId}`
          );
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        fiscalYear,
        inspectionDate: editedStartDate,
        inspectorIds: editedInspectorIds.map(Number),
        rows: editedRows.map((row) => ({
          materialId: row.materialId,
          accuracy: row.accuracy || null,
          shortageQty:
            row.shortageQty === "" ? null : Number(row.shortageQty),
          excessQty:
            row.excessQty === "" ? null : Number(row.excessQty),
          baht: row.baht === "" ? null : Number(row.baht),
          satang: row.satang === "" ? null : Number(row.satang),
          damagedQty:
            row.damagedQty === "" ? null : Number(row.damagedQty),
          deterioratedQty:
            row.deterioratedQty === ""
              ? null
              : Number(row.deterioratedQty),
          unnecessaryQty:
            row.unnecessaryQty === ""
              ? null
              : Number(row.unnecessaryQty),
          remark: row.remark.trim() || null,
        })),
      };

      const response = await fetch(
        `/api/stock-card/inspection?fiscalYear=${fiscalYear}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message ||
            "ไม่สามารถบันทึกการแก้ไขได้"
        );
      }

      setMessage("บันทึกการแก้ไขเรียบร้อยแล้ว");
      setIsEditing(false);

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <AppCard
        padding={false}
        className="!overflow-visible !rounded-[22px]"
      >
        <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="shrink-0 lg:w-[210px]">
              <h2 className="text-lg font-black tracking-tight !text-slate-900">
                ข้อมูลการตรวจสอบ
              </h2>

              <p className="mt-0.5 text-xs font-semibold !text-slate-500">
                {isEditing
                  ? "กำลังแก้ไขข้อมูลการตรวจสอบ"
                  : "ข้อมูลที่บันทึกไว้"}
              </p>
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">
                  วันที่เริ่มตรวจสอบ
                </label>

                {isEditing ? (
                  <input
                    type="date"
                    value={editedStartDate}
                    onChange={(event) =>
                      setEditedStartDate(event.target.value)
                    }
                    className="h-[46px] w-full rounded-[14px] border-2 !border-black bg-white px-4 text-sm font-bold !text-black"
                  />
                ) : (
                  <div className="flex h-[46px] items-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold !text-slate-900 shadow-sm">
                    {dateText(editedStartDate)}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">
                  วันที่ตรวจสอบแล้วเสร็จ
                </label>

                <div className="flex h-[46px] items-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold !text-slate-900 shadow-sm">
                  {dateText(editedEndDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {!isEditing ? (
          <AppButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setError("");
              setMessage("");
              setIsEditing(true);
            }}
          >
            ✏️ แก้ไขข้อมูล
          </AppButton>
        ) : (
          <>
            <AppButton
              type="button"
              variant="secondary"
              size="md"
              disabled={isSaving}
              onClick={cancelEditing}
            >
              ยกเลิก
            </AppButton>

            <AppButton
              type="button"
              variant="primary"
              size="md"
              disabled={isSaving}
              onClick={saveChanges}
            >
              {isSaving
                ? "กำลังบันทึก..."
                : "💾 บันทึกการแก้ไข"}
            </AppButton>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
        >
          {message}
        </div>
      )}

      <div className="relative z-10">
        <AppSearchInput
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          onSubmit={() =>
            setSearchTerm(searchTerm.trim())
          }
          onClear={() => setSearchTerm("")}
          placeholder="ค้นหารหัส / ชื่อหรือชนิดวัสดุหรือครุภัณฑ์"
          resultCount={filtered.length}
          resultLabel="รายการ"
          showSearchButton
          showClearButton
          searchButtonText="ค้นหา"
          clearButtonText="ล้าง"
        />
      </div>

      <AppTableCard
        title="รายการตรวจสอบบัญชีพัสดุ"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        badge={`${filtered.length.toLocaleString("th-TH")} รายการ`}
        className="relative z-0 w-full min-w-0"
      >
        <div className="border-b border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="relative z-30 w-full sm:max-w-[420px]">
              <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">
                เลือกหมวด
              </label>

              <AppSearchableSelect
                value={selectedCategory}
                options={categories}
                placeholder="เลือกหมวด"
                searchPlaceholder="พิมพ์ค้นหาหมวด..."
                emptyText="ไม่พบหมวด"
                onChange={setSelectedCategory}
              />
            </div>

            {!isEditing && (
              <ExportInspectionPdf
                fiscalYear={fiscalYear}
                startShortYear={startShortYear}
                endShortYear={endShortYear}
                materials={filtered}
                rows={editedRows}
                inspectionStartDate={editedStartDate}
                inspectionEndDate={editedEndDate}
                inspectorIds={editedInspectorIds}
                officers={officers}
              />
            )}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-1 text-xs font-bold !text-slate-600">
            เลื่อนตารางซ้าย–ขวา
          </div>

          <div
            className="w-full overflow-x-auto rounded-md border border-slate-300 bg-white"
            aria-label="แถบเลื่อนตารางด้านบน"
          >
            <div style={{ width: 1710, height: 8 }} />
          </div>
        </div>

        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1710px] table-fixed border-collapse bg-white text-[15px]">
            <colgroup>
              {widths.map((width, index) => (
                <col
                  key={index}
                  style={{ width: `${width}px` }}
                />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th rowSpan={2} className={headerClass}>
                  ลำดับ
                </th>

                <th rowSpan={2} className={headerClass}>
                  ชื่อหรือชนิดวัสดุหรือครุภัณฑ์
                </th>

                <th rowSpan={2} className={headerClass}>
                  หน่วยนับ
                </th>

                <th rowSpan={2} className={headerClass}>
                  คงเหลือยอดยกมาเมื่อ
                  <br />
                  30 ก.ย. {startShortYear}
                </th>

                <th colSpan={2} className={headerClass}>
                  01 ต.ค. {startShortYear} - 30 ก.ย.{" "}
                  {endShortYear}
                </th>

                <th rowSpan={2} className={headerClass}>
                  คงเหลือปัจจุบัน
                </th>

                <th rowSpan={2} className={headerClass}>
                  ถูกต้อง
                </th>

                <th rowSpan={2} className={headerClass}>
                  ไม่ถูกต้อง
                </th>

                <th colSpan={4} className={headerClass}>
                  รายละเอียดกรณีไม่ถูกต้อง
                </th>

                <th rowSpan={2} className={headerClass}>
                  ชำรุด
                </th>

                <th rowSpan={2} className={headerClass}>
                  เสื่อมสภาพ
                </th>

                <th rowSpan={2} className={headerClass}>
                  ไม่จำเป็นต้องใช้
                </th>

                <th rowSpan={2} className={headerClass}>
                  หมายเหตุ
                </th>
              </tr>

              <tr>
                {[
                  "รับ",
                  "จ่าย",
                  "ขาด",
                  "เกิน",
                  "บาท",
                  "สต.",
                ].map((label) => (
                  <th
                    key={label}
                    className={`${headerClass} !py-1`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {groups.length === 0 && (
                <tr>
                  <td
                    colSpan={17}
                    className={`${cellClass} py-6`}
                  >
                    ไม่พบรายการพัสดุ
                  </td>
                </tr>
              )}

              {groups.map((group) => (
                <Fragment key={group.category}>
                  <tr>
                    <td
                      colSpan={17}
                      className="h-[23.25px] border border-black bg-white px-2 py-0 text-left text-[15px] font-bold leading-none !text-black"
                    >
                      {group.name}
                    </td>
                  </tr>

                  {group.materials.map(
                    (material, index) => {
                      const row = rowMap.get(
                        material.materialId
                      );

                      const cells = [
                        formatStock(
                          material.openingBalance
                        ),
                        formatStock(material.receiveQty),
                        formatStock(material.issueQty),
                        formatCurrent(
                          material.closingBalance
                        ),
                      ];

                      return (
                        <tr
                          key={material.materialId}
                          className={
                            index % 2 === 0
                              ? "bg-white hover:bg-blue-50/50"
                              : "bg-slate-50/35 hover:bg-blue-50/50"
                          }
                        >
                          <td className={cellClass}>
                            {index + 1}
                          </td>

                          <td
                            className={`${cellClass} px-2 text-left leading-tight`}
                          >
                            {material.name}
                          </td>

                          <td className={cellClass}>
                            {material.unit || "-"}
                          </td>

                          {cells.map((value, i) => (
                            <td
                              key={i}
                              className={cellClass}
                            >
                              {value}
                            </td>
                          ))}

                          <td className={cellClass}>
                            {isEditing ? (
                              <input
                                type="checkbox"
                                aria-label={`ถูกต้อง ${material.name}`}
                                checked={
                                  row?.accuracy ===
                                  "CORRECT"
                                }
                                onChange={(event) =>
                                  updateRow(
                                    material.materialId,
                                    "accuracy",
                                    event.target.checked
                                      ? "CORRECT"
                                      : ""
                                  )
                                }
                                className="h-4 w-4 accent-emerald-600"
                              />
                            ) : row?.accuracy ===
                              "CORRECT" ? (
                              "✓"
                            ) : (
                              ""
                            )}
                          </td>

                          <td className={cellClass}>
                            {isEditing ? (
                              <input
                                type="checkbox"
                                aria-label={`ไม่ถูกต้อง ${material.name}`}
                                checked={
                                  row?.accuracy ===
                                  "INCORRECT"
                                }
                                onChange={(event) =>
                                  updateRow(
                                    material.materialId,
                                    "accuracy",
                                    event.target.checked
                                      ? "INCORRECT"
                                      : ""
                                  )
                                }
                                className="h-4 w-4 accent-red-600"
                              />
                            ) : row?.accuracy ===
                              "INCORRECT" ? (
                              "✓"
                            ) : (
                              ""
                            )}
                          </td>

                          {numberFields.map((field) => (
                            <td
                              key={field}
                              className={cellClass}
                            >
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={
                                    row?.[field] ?? ""
                                  }
                                  onChange={(event) =>
                                    updateRow(
                                      material.materialId,
                                      field,
                                      event.target.value
                                    )
                                  }
                                  aria-label={`${field} ${material.name}`}
                                  className={inputClass}
                                />
                              ) : (
                                row?.[field] ?? ""
                              )}
                            </td>
                          ))}

                          <td
                            className={`${cellClass} px-2 text-left`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={row?.remark ?? ""}
                                onChange={(event) =>
                                  updateRow(
                                    material.materialId,
                                    "remark",
                                    event.target.value
                                  )
                                }
                                aria-label={`หมายเหตุ ${material.name}`}
                                className={`${inputClass} text-left`}
                              />
                            ) : (
                              row?.remark ?? ""
                            )}
                          </td>
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

      <AppCard className="relative z-20 w-full min-w-0 !overflow-visible !p-4">
        <h2 className="text-xl font-black tracking-tight !text-slate-900">
          คณะกรรมการตรวจสอบครุภัณฑ์
        </h2>

        <p className="mt-1 text-sm font-semibold !text-slate-500">
          รายชื่อคณะกรรมการตรวจสอบจำนวน 3 คน
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((index) => {
            const officer = officerMap.get(
              editedInspectorIds[index] ?? ""
            );

            return (
              <div
                key={index}
                className="relative min-w-0 rounded-[16px] border border-slate-200/80 bg-slate-50/60 p-3"
              >
                <div className="mb-2 text-sm font-extrabold !text-slate-700">
                  {index === 0
                    ? "ประธานกรรมการ"
                    : `กรรมการคนที่ ${index}`}
                </div>

                {isEditing ? (
                  <AppSearchableSelect
                    value={
                      editedInspectorIds[index] ?? ""
                    }
                    options={officerOptions}
                    placeholder="เลือกคณะกรรมการ"
                    searchPlaceholder="พิมพ์ค้นหาชื่อกรรมการ..."
                    emptyText="ไม่พบรายชื่อ"
                    onChange={(value) =>
                      updateInspector(index, value)
                    }
                  />
                ) : (
                  <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold !text-slate-900">
                    {officer
                      ? `${officer.firstName} ${officer.lastName}`.trim()
                      : "-"}
                  </div>
                )}

                <p className="mt-2 text-xs font-semibold !text-slate-500">
                  ตำแหน่ง: {officer?.position || "-"}
                </p>
              </div>
            );
          })}
        </div>
      </AppCard>

      {isEditing && (
        <div className="flex flex-wrap justify-end gap-2 pb-4">
          <AppButton
            type="button"
            variant="secondary"
            size="md"
            disabled={isSaving}
            onClick={cancelEditing}
          >
            ยกเลิก
          </AppButton>

          <AppButton
            type="button"
            variant="primary"
            size="md"
            disabled={isSaving}
            onClick={saveChanges}
          >
            {isSaving
              ? "กำลังบันทึก..."
              : "💾 บันทึกการแก้ไข"}
          </AppButton>
        </div>
      )}
    </div>
  );
}
