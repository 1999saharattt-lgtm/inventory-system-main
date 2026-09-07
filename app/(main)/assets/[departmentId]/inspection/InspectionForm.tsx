"use client";

import { useState } from "react";
import ExportInspectionPdf from "./ExportInspectionPdf";

type Department = {
id: number;
name: string;
};

type Asset = {
id: number;
name: string;
category: string;
brand: string | null;
model: string | null;
serialNumber: string | null;
governmentAssetNo: string | null;
officeAssetNo: string | null;
departmentId: number;
sectionId: number | null;
officerId: number | null;
status: string;
purchaseDate: Date | string | null;
price: number | null;
location: string | null;
remark: string | null;

section: {
id: number;
name: string;
} | null;

officer: {
id: number;
firstName: string;
lastName: string;
position: string;
} | null;
};

type Officer = {
id: number;
firstName: string;
lastName: string;
position: string;
type: string;
departmentId: number | null;
sectionId: number | null;

department: {
id: number;
name: string;
} | null;

section: {
id: number;
name: string;
} | null;
};

type Props = {
department: Department;
assets: Asset[];
officers: Officer[];
};

type InspectionRow = {
assetId: number;
countedQty: string;
accuracy: string;
status: string;
remark: string;
};

const inspectionStatuses = [
{
value: "IN_USE",
label: "ใช้งาน",
},
{
value: "DAMAGED",
label: "ชำรุด",
},
{
value: "DETERIORATED",
label: "เสื่อมสภาพ",
},
{
value: "UNUSABLE",
label: "ไม่สามารถใช้งาน",
},
];

const accuracyOptions = [
{
value: "CORRECT",
label: "ถูกต้อง",
},
{
value: "INCORRECT",
label: "ไม่ถูกต้อง",
},
];

const INSPECTION_FISCAL_YEAR = "2569";

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

function getCurrentDate() {
const now = new Date();

const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

/**

* แปลง YYYY-MM-DD เป็น Date แบบ local
* เพื่อป้องกันปัญหา timezone
  */
  function parseDateOnly(value: string) {
  if (!value) {
  return new Date(NaN);
  }

const [year, month, day] = value.split("-").map(Number);

if (
!year ||
!month ||
!day ||
Number.isNaN(year) ||
Number.isNaN(month) ||
Number.isNaN(day)
) {
return new Date(NaN);
}

return new Date(year, month - 1, day);
}

/**

* แปลง Date เป็น YYYY-MM-DD
  */
  function formatDateInput(date: Date) {
  if (Number.isNaN(date.getTime())) {
  return "";
  }

const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

/**

* วันที่ย้อนหลัง 1 ปี
  */
  function getOneYearBefore(value: string) {
  if (!value) {
  return "";
  }

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "";
}

date.setFullYear(date.getFullYear() - 1);

return formatDateInput(date);
}

/**

* วันที่ย้อนหลัง 1 วัน
  */
  function getOneDayBefore(value: string) {
  if (!value) {
  return "";
  }

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "";
}

date.setDate(date.getDate() - 1);

return formatDateInput(date);
}

/**

* แสดงวันที่เป็นภาษาไทย
*
* เช่น
* 2026-08-30
* -> 30 สิงหาคม 2569
  */
  function formatThaiDate(value: string) {
  if (!value) {
  return "........";
  }

const date = parseDateOnly(value);

if (Number.isNaN(date.getTime())) {
return "........";
}

const day = date.getDate();
const month = thaiMonths[date.getMonth()];
const year = date.getFullYear() + 543;

return `${day} ${month} ${year}`;
}

/**

* ปีงบประมาณสำหรับการตรวจสอบ
*
* รอบการตรวจครั้งนี้กำหนดเป็น พ.ศ. 2569
  */
  function getFiscalYear() {
  return INSPECTION_FISCAL_YEAR;
  }

/**

* หน่วยของครุภัณฑ์
  */
  function getCategoryUnit(category: string) {
  const categoryUnit: Record<string, string> = {
  COMPUTER: "เครื่อง",
  DESKTOP: "เครื่อง",
  LAPTOP: "เครื่อง",
  PRINTER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  AIR_CONDITIONER: "เครื่อง",
  FAN: "เครื่อง",
  CHAIR: "ตัว",
  DESK: "ตัว",
  CABINET: "ตู้",
  TABLE: "ตัว",
  OTHER: "รายการ",
  };

return categoryUnit[category] || "รายการ";
}

function createInitialRows(assets: Asset[]): InspectionRow[] {
return assets.map((asset) => ({
assetId: asset.id,
countedQty: "1",
accuracy: "",
status: "",
remark: "",
}));
}

export default function InspectionForm({
department,
assets,
officers,
}: Props) {
// =====================================================
// วันที่ตรวจสอบ
// =====================================================

const [inspectionStartDate, setInspectionStartDate] =
useState(getCurrentDate());

const [inspectionEndDate, setInspectionEndDate] =
useState(getCurrentDate());

// =====================================================
// วันที่ที่ใช้แสดงในหัวตาราง
//
// 1. ย้อนหลัง 1 ปีจากวันเริ่มตรวจสอบ
// 2. ย้อนหลัง 1 วันจากวันตรวจสอบแล้วเสร็จ
// =====================================================

const accountStartDate = getOneYearBefore(
inspectionStartDate
);

const accountEndDate = getOneDayBefore(
inspectionEndDate
);

// =====================================================
// ปีงบประมาณสำหรับรายการเคลื่อนไหว
// =====================================================

const movementFiscalYear = getFiscalYear();

// =====================================================
// รายการตรวจสอบ
// =====================================================

const [rows, setRows] = useState<InspectionRow[]>(
() => createInitialRows(assets)
);

// =====================================================
// ผู้ตรวจสอบ 5 คน
// =====================================================

const [inspectorIds, setInspectorIds] = useState<string[]>(
Array.from(
{
length: 5,
},
() => ""
)
);

// =====================================================
// สถานะการบันทึก
// =====================================================

const [isSaving, setIsSaving] = useState(false);

// =====================================================
// อัปเดตข้อมูลรายการตรวจ
// =====================================================

function updateRow(
index: number,
key: keyof InspectionRow,
value: string
) {
const copy = [...rows];

copy[index] = {
  ...copy[index],
  [key]: value,
};

setRows(copy);

}

// =====================================================
// เปลี่ยนผู้ตรวจสอบ
// =====================================================

function updateInspector(index: number, value: string) {
const copy = [...inspectorIds];

copy[index] = value;

setInspectorIds(copy);

}

// =====================================================
// หาข้อมูล Officer จาก ID
// =====================================================

function getOfficer(inspectorId: string) {
return officers.find(
(officer) => String(officer.id) === inspectorId
);
}

// =====================================================
// ป้องกันเลือก Officer คนเดียวกันซ้ำ
// =====================================================

function isOfficerSelected(
officerId: number,
currentIndex: number
) {
return inspectorIds.some(
(selectedId, index) =>
index !== currentIndex &&
selectedId === String(officerId)
);
}

// =====================================================
// บันทึกผลการตรวจสอบ
// =====================================================

async function handleSave() {
if (isSaving) {
return;
}

// -----------------------------------------------------
// ตรวจสอบวันที่
// -----------------------------------------------------

if (!inspectionStartDate || !inspectionEndDate) {
  alert(
    "กรุณาระบุวันที่เริ่มตรวจสอบและวันที่ตรวจสอบแล้วเสร็จ"
  );
  return;
}

const startDate = parseDateOnly(inspectionStartDate);
const endDate = parseDateOnly(inspectionEndDate);

if (endDate < startDate) {
  alert(
    "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ"
  );
  return;
}

// -----------------------------------------------------
// ตรวจสอบผู้ตรวจสอบ 5 คน
// -----------------------------------------------------

if (inspectorIds.length !== 5) {
  alert("กรุณาระบุผู้ตรวจสอบจำนวน 5 คน");
  return;
}

if (inspectorIds.some((id) => !id)) {
  alert("กรุณาเลือกผู้ตรวจสอบให้ครบทั้ง 5 คน");
  return;
}

const uniqueInspectorIds = new Set(inspectorIds);

if (uniqueInspectorIds.size !== 5) {
  alert("ไม่สามารถเลือกผู้ตรวจสอบคนเดียวกันซ้ำได้");
  return;
}

// -----------------------------------------------------
// ตรวจสอบรายการครุภัณฑ์
// -----------------------------------------------------

if (rows.length === 0) {
  alert("ไม่พบรายการครุภัณฑ์ที่ต้องการบันทึก");
  return;
}

for (const row of rows) {
  const countedQty = Number(row.countedQty);

  if (
    !Number.isInteger(countedQty) ||
    countedQty < 0
  ) {
    alert(
      `จำนวนที่ตรวจนับของครุภัณฑ์รหัส ${row.assetId} ไม่ถูกต้อง`
    );
    return;
  }

  if (!row.accuracy) {
    alert(
      `กรุณาระบุผลการตรวจนับของครุภัณฑ์รหัส ${row.assetId}`
    );
    return;
  }

  if (!row.status) {
    alert(
      `กรุณาระบุสภาพครุภัณฑ์ของครุภัณฑ์รหัส ${row.assetId}`
    );
    return;
  }
}

// -----------------------------------------------------
// ส่งข้อมูลไป API
// -----------------------------------------------------

setIsSaving(true);

try {
  const response = await fetch(
    "/api/assets/inspection",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        departmentId: department.id,
        inspectionStartDate,
        inspectionEndDate,
        inspectorIds,
        rows,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    alert(
      result.message ||
        "ไม่สามารถบันทึกผลการตรวจสอบได้"
    );
    return;
  }

  alert(
    `บันทึกผลการตรวจสอบเรียบร้อยแล้ว\nจำนวน ${result.savedCount} รายการ`
  );
} catch (error) {
  console.error(
    "Save asset inspection error:",
    error
  );

  alert(
    "ไม่สามารถเชื่อมต่อระบบเพื่อบันทึกผลการตรวจสอบได้"
  );
} finally {
  setIsSaving(false);
}

}

return ( <div
   className="
     mx-auto
     w-full
     max-w-[1800px]
     space-y-6
   "
 >
{/* =====================================================
ข้อมูลการตรวจสอบ
===================================================== */}

  <div
    className="
      rounded-2xl
      border
      border-slate-700
      bg-gradient-to-br
      from-slate-950
      to-slate-800
      p-4
      text-white
      shadow-xl
      sm:p-6
    "
  >
    <div
      className="
        mb-5
        flex
        flex-col
        gap-4
        border-b
        border-slate-700
        pb-4
        sm:flex-row
        sm:items-start
        sm:justify-between
      "
    >
      <div>
        <h2
          className="
            text-xl
            font-extrabold
            !text-white
            sm:text-2xl
          "
        >
          ข้อมูลการตรวจสอบ
        </h2>

        <p
          className="
            mt-1
            text-sm
            font-semibold
            text-slate-300
          "
        >
          {department.name}
        </p>
      </div>

      <ExportInspectionPdf
        department={department}
        assets={assets}
        rows={rows}
        inspectionStartDate={inspectionStartDate}
        inspectionEndDate={inspectionEndDate}
        inspectorIds={inspectorIds}
        officers={officers}
      />
    </div>

    <div
      className="
        grid
        gap-4
        md:grid-cols-2
      "
    >
      {/* วันที่เริ่มตรวจสอบ */}

      <div>
        <label
          className="
            mb-2
            block
            text-base
            font-extrabold
            text-white
          "
        >
          เริ่มดำเนินการตรวจสอบวันที่
        </label>

        <input
          type="date"
          value={inspectionStartDate}
          onChange={(e) =>
            setInspectionStartDate(e.target.value)
          }
          required
          className="
            w-full
            rounded-lg
            border
            border-slate-300
            bg-white
            p-2.5
            font-semibold
            text-slate-900
            outline-none
            focus:border-cyan-500
            focus:ring-2
            focus:ring-cyan-100
          "
        />

        <p
          className="
            mt-2
            text-sm
            font-semibold
            text-slate-300
          "
        >
          วันที่เลือก:{" "}
          {formatThaiDate(inspectionStartDate)}
        </p>
      </div>

      {/* วันที่ตรวจสอบแล้วเสร็จ */}

      <div>
        <label
          className="
            mb-2
            block
            text-base
            font-extrabold
            text-white
          "
        >
          ตรวจสอบแล้วเสร็จวันที่
        </label>

        <input
          type="date"
          value={inspectionEndDate}
          onChange={(e) =>
            setInspectionEndDate(e.target.value)
          }
          required
          className="
            w-full
            rounded-lg
            border
            border-slate-300
            bg-white
            p-2.5
            font-semibold
            text-slate-900
            outline-none
            focus:border-cyan-500
            focus:ring-2
            focus:ring-cyan-100
          "
        />

        <p
          className="
            mt-2
            text-sm
            font-semibold
            text-slate-300
          "
        >
          วันที่เลือก:{" "}
          {formatThaiDate(inspectionEndDate)}
        </p>
      </div>
    </div>
  </div>

  {/* =====================================================
      ตารางตรวจสอบครุภัณฑ์
  ===================================================== */}

  <div
    className="
      w-full
      rounded-2xl
      border
      border-slate-700
      bg-gradient-to-br
      from-slate-950
      to-slate-800
      p-3
      text-white
      shadow-xl
      sm:p-4
      lg:p-6
    "
  >
    <div
      className="
        mb-5
        flex
        flex-col
        gap-2
        border-b
        border-slate-700
        pb-4
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div>
        <h2
          className="
            text-xl
            font-extrabold
            !text-white
            sm:text-2xl
          "
        >
          รายการครุภัณฑ์ที่ตรวจสอบ
        </h2>

        <p
          className="
            mt-1
            text-sm
            font-semibold
            text-slate-300
          "
        >
          จำนวน {assets.length} รายการ
        </p>
      </div>
    </div>

    {/* =====================================================
        ตาราง
    ===================================================== */}

    <div
      className="
        w-full
        overflow-x-auto
        overflow-y-hidden
        rounded-xl
        bg-white
      "
    >
      <table
        className="
          w-max
          min-w-[2900px]
          border-collapse
          text-xs
          sm:text-sm
        "
      >
        <colgroup>
          <col className="w-[60px]" />
          <col className="w-[180px]" />
          <col className="w-[190px]" />
          <col className="w-[240px]" />
          <col className="w-[300px]" />
          <col className="w-[100px]" />

          {/* ยอดคงเหลือตามบัญชี ณ วันที่เริ่มย้อนหลัง 1 ปี */}
          <col className="w-[170px]" />

          {/* รายการเคลื่อนไหว รับ / จ่าย */}
          <col className="w-[110px]" />
          <col className="w-[110px]" />

          {/* ยอดคงเหลือตามบัญชี ณ วันก่อนตรวจเสร็จ */}
          <col className="w-[190px]" />

          <col className="w-[180px]" />
          <col className="w-[110px]" />
          <col className="w-[130px]" />
          <col className="w-[110px]" />
          <col className="w-[110px]" />
          <col className="w-[140px]" />
          <col className="w-[190px]" />
          <col className="w-[240px]" />
        </colgroup>

        <thead>
          <tr>
            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              ลำดับ
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              รหัส GFMIS
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              รหัสครุภัณฑ์
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              ผู้รับผิดชอบ
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              รายการ
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              หน่วย
            </th>

            {/* =================================================
                ยอดคงเหลือตามบัญชีช่วงเริ่มตรวจ
            ================================================= */}

            <th
              rowSpan={2}
              className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              <div className="whitespace-nowrap">
                ยอดคงเหลือตามบัญชี
              </div>

              <div className="mt-1 whitespace-nowrap">
                ณ วันที่{" "}
                <span className="font-bold">
                  {formatThaiDate(accountStartDate)}
                </span>
              </div>
            </th>

            {/* =================================================
                รายการเคลื่อนไหวระหว่างปีงบประมาณ
            ================================================= */}

            <th
              colSpan={2}
              className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              <div className="whitespace-nowrap">
                รายการเคลื่อนไหวระหว่างปีงบประมาณ พ.ศ.{" "}
                {movementFiscalYear}
              </div>
            </th>

            {/* =================================================
                ยอดคงเหลือตามบัญชี ณ วันก่อนตรวจเสร็จ
            ================================================= */}

            <th
              rowSpan={2}
              className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              <div className="whitespace-nowrap">
                ยอดคงเหลือตามบัญชี
              </div>

              <div className="mt-1 whitespace-nowrap">
                ณ วันที่{" "}
                <span className="font-bold">
                  {formatThaiDate(accountEndDate)}
                </span>
              </div>
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              จำนวนที่ตรวจนับได้
            </th>

            <th
              colSpan={2}
              className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              <div className="whitespace-nowrap">
                ผลการตรวจนับ
              </div>

              <div className="mt-1 whitespace-nowrap">
                ถูกต้องตรงกับยอดคงเหลือตามบัญชี
              </div>
            </th>

            <th
              colSpan={4}
              className="border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              <span className="whitespace-nowrap">
                สภาพครุภัณฑ์ที่ตรวจนับ
              </span>
            </th>

            <th
              rowSpan={2}
              className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-3 text-center align-middle font-extrabold text-white"
            >
              หมายเหตุ
            </th>
          </tr>

          <tr>
            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              รับ
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              จ่าย
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              ถูกต้อง
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              ไม่ถูกต้อง
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              ใช้งาน
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              ชำรุด
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              เสื่อมสภาพ
            </th>

            <th className="whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 text-center font-extrabold text-white">
              <span className="whitespace-nowrap">
                ไม่สามารถใช้งาน
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const row = rows[index];

            const officer = asset.officer;

            return (
              <tr
                key={asset.id}
                className="transition hover:bg-emerald-50"
              >
                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-bold text-slate-900">
                  {index + 1}
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-semibold text-slate-900">
                  {asset.governmentAssetNo || "-"}
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-semibold text-slate-900">
                  {asset.officeAssetNo || "-"}
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-semibold text-slate-900">
                  {officer
                    ? `${officer.firstName} ${officer.lastName}`
                    : "-"}
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 font-semibold text-slate-900">
                  {asset.name}

                  {(asset.brand || asset.model) && (
                    <span className="ml-2 text-xs font-medium text-slate-500">
                      (
                      {asset.brand || ""}

                      {asset.brand && asset.model
                        ? " / "
                        : ""}

                      {asset.model || ""}
                      )
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-semibold text-slate-900">
                  {getCategoryUnit(asset.category)}
                </td>

                {/* ยอดคงเหลือตามบัญชี ณ วันที่เริ่มย้อนหลัง 1 ปี */}

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-bold text-slate-900">
                  1
                </td>

                {/* รายการเคลื่อนไหว - รับ */}

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-bold text-slate-500">
                  -
                </td>

                {/* รายการเคลื่อนไหว - จ่าย */}

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-bold text-slate-500">
                  -
                </td>

                {/* ยอดคงเหลือตามบัญชี ณ วันก่อนตรวจเสร็จ */}

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center font-bold text-slate-900">
                  1
                </td>

                <td className="border border-black px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    value={row.countedQty}
                    onChange={(e) =>
                      updateRow(
                        index,
                        "countedQty",
                        e.target.value
                      )
                    }
                    className="block w-full min-w-[100px] rounded-lg border border-slate-300 bg-white p-1.5 text-center text-xs font-bold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 sm:p-2 sm:text-sm"
                  />
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`accuracy-${asset.id}`}
                    checked={
                      row.accuracy === "CORRECT"
                    }
                    onChange={() =>
                      updateRow(
                        index,
                        "accuracy",
                        "CORRECT"
                      )
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                  />
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`accuracy-${asset.id}`}
                    checked={
                      row.accuracy === "INCORRECT"
                    }
                    onChange={() =>
                      updateRow(
                        index,
                        "accuracy",
                        "INCORRECT"
                      )
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                  />
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`status-${asset.id}`}
                    checked={
                      row.status === "IN_USE"
                    }
                    onChange={() =>
                      updateRow(
                        index,
                        "status",
                        "IN_USE"
                      )
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                  />
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`status-${asset.id}`}
                    checked={
                      row.status === "DAMAGED"
                    }
                    onChange={() =>
                      updateRow(
                        index,
                        "status",
                        "DAMAGED"
                      )
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                  />
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`status-${asset.id}`}
                    checked={
                      row.status === "DETERIORATED"
                    }
                    onChange={() =>
                      updateRow(
                        index,
                        "status",
                        "DETERIORATED"
                      )
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                  />
                </td>

                <td className="whitespace-nowrap border border-black px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`status-${asset.id}`}
                    checked={
                      row.status === "UNUSABLE"
                    }
                    onChange={() =>
                      updateRow(
                        index,
                        "status",
                        "UNUSABLE"
                      )
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                  />
                </td>

                <td className="border border-black px-3 py-2">
                  <input
                    type="text"
                    value={row.remark}
                    onChange={(e) =>
                      updateRow(
                        index,
                        "remark",
                        e.target.value
                      )
                    }
                    placeholder="หมายเหตุ"
                    className="block w-full min-w-[150px] rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 sm:p-2 sm:text-sm"
                  />
                </td>
              </tr>
            );
          })}

          {assets.length === 0 && (
            <tr>
              <td
                colSpan={18}
                className="border border-black px-4 py-10 text-center font-bold text-slate-500"
              >
                ไม่พบรายการครุภัณฑ์
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>

  {/* =====================================================
      ผู้ตรวจสอบ 5 คน
  ===================================================== */}

  <div
    className="
      rounded-2xl
      border
      border-slate-700
      bg-gradient-to-br
      from-slate-950
      to-slate-800
      p-4
      text-white
      shadow-xl
      sm:p-6
    "
  >
    <div
      className="
        mb-5
        border-b
        border-slate-700
        pb-4
      "
    >
      <h2
        className="
          text-xl
          font-extrabold
          !text-white
          sm:text-2xl
        "
      >
        ผู้ตรวจสอบ
      </h2>

      <p
        className="
          mt-1
          text-sm
          font-semibold
          text-slate-300
        "
      >
        เลือกรายชื่อจาก Officer ของทุกกลุ่มงาน
      </p>
    </div>

    <div
      className="
        grid
        gap-4
        lg:grid-cols-2
      "
    >
      {inspectorIds.map((inspectorId, index) => {
        const selectedOfficer =
          getOfficer(inspectorId);

        return (
          <div
            key={index}
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-900/70
              p-4
            "
          >
            <div
              className="
                mb-3
                text-base
                font-extrabold
                text-white
              "
            >
              ผู้ตรวจสอบคนที่ {index + 1}
            </div>

            <label
              className="
                mb-2
                block
                text-sm
                font-bold
                text-slate-300
              "
            >
              ลงชื่อ
            </label>

            <select
              value={inspectorId}
              onChange={(e) =>
                updateInspector(
                  index,
                  e.target.value
                )
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2.5
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
                focus:ring-2
                focus:ring-cyan-100
              "
            >
              <option value="">
                -- เลือกผู้ตรวจสอบ --
              </option>

              {officers.map((officer) => (
                <option
                  key={officer.id}
                  value={officer.id}
                  disabled={isOfficerSelected(
                    officer.id,
                    index
                  )}
                >
                  {officer.firstName}{" "}
                  {officer.lastName}
                  {officer.department
                    ? ` — ${officer.department.name}`
                    : ""}
                  {officer.section
                    ? ` / ${officer.section.name}`
                    : ""}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-bold
                  text-slate-300
                "
              >
                ตำแหน่ง
              </label>

              <input
                type="text"
                readOnly
                value={
                  selectedOfficer?.position || ""
                }
                placeholder="ตำแหน่งจะแสดงอัตโนมัติ"
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-slate-100
                  p-2.5
                  font-semibold
                  text-slate-900
                  outline-none
                  placeholder:text-slate-400
                "
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* =====================================================
      ปุ่ม
  ===================================================== */}

  <div
    className="
      flex
      flex-col
      justify-end
      gap-3
      pt-2
      sm:flex-row
    "
  >
    <button
      type="button"
      className="
        rounded-xl
        bg-slate-700
        px-8
        py-3
        text-lg
        font-extrabold
        text-white
        shadow-lg
        transition
        hover:bg-slate-800
      "
      onClick={() => {
        window.history.back();
      }}
    >
      ยกเลิก
    </button>

    <button
      type="button"
      disabled={isSaving}
      className="
        rounded-xl
        bg-gradient-to-r
        from-emerald-600
        via-green-500
        to-emerald-500
        px-8
        py-3
        text-lg
        font-extrabold
        text-white
        shadow-lg
        transition
        hover:scale-105
        disabled:cursor-not-allowed
        disabled:opacity-60
        disabled:hover:scale-100
      "
      onClick={handleSave}
    >
      {isSaving
        ? "⏳ กำลังบันทึก..."
        : "💾 บันทึกผลการตรวจสอบ"}
    </button>
  </div>
</div>

);
}