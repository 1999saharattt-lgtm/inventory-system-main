"use client";

import { useState } from "react";

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
    label: "ใช้งานปกติ",
  },
  {
    value: "RETURNED",
    label: "ส่งคืน",
  },
  {
    value: "DAMAGED",
    label: "ชำรุด",
  },
  {
    value: "MISSING",
    label: "สูญหาย",
  },
  {
    value: "NOT_FOUND",
    label: "ไม่พบ",
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

function getCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createInitialRows(
  assets: Asset[]
): InspectionRow[] {
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
  // รายการตรวจสอบ
  // =====================================================

  const [rows, setRows] = useState<
    InspectionRow[]
  >(() => createInitialRows(assets));

  // =====================================================
  // ผู้ตรวจสอบ 5 คน
  // =====================================================

  const [inspectorIds, setInspectorIds] =
    useState<string[]>(
      Array.from(
        {
          length: 5,
        },
        () => ""
      )
    );

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

  function updateInspector(
    index: number,
    value: string
  ) {
    const copy = [...inspectorIds];

    copy[index] = value;

    setInspectorIds(copy);
  }

  // =====================================================
  // หาข้อมูล Officer จาก ID
  // =====================================================

  function getOfficer(
    officerId: string
  ) {
    return officers.find(
      (officer) =>
        String(officer.id) ===
        officerId
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

  return (
    <div
      className="
        mx-auto
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
          border-slate-300
          bg-white
          p-4
          shadow-lg
          sm:p-6
        "
      >
        <div
          className="
            mb-5
            border-b
            border-slate-300
            pb-4
          "
        >
          <h2
            className="
              text-xl
              font-extrabold
              text-slate-900
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
              text-slate-600
            "
          >
            {department.name}
          </p>
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
                text-slate-900
              "
            >
              เริ่มดำเนินการตรวจสอบวันที่
            </label>

            <input
              type="date"
              value={inspectionStartDate}
              onChange={(e) =>
                setInspectionStartDate(
                  e.target.value
                )
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
          </div>

          {/* วันที่ตรวจสอบแล้วเสร็จ */}

          <div>
            <label
              className="
                mb-2
                block
                text-base
                font-extrabold
                text-slate-900
              "
            >
              ตรวจสอบแล้วเสร็จวันที่
            </label>

            <input
              type="date"
              value={inspectionEndDate}
              onChange={(e) =>
                setInspectionEndDate(
                  e.target.value
                )
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
          </div>
        </div>
      </div>

      {/* =====================================================
          ตารางตรวจสอบครุภัณฑ์
      ===================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-lg
          sm:p-6
        "
      >
        <div
          className="
            mb-5
            flex
            flex-col
            gap-2
            border-b
            border-slate-300
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
                text-slate-900
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
                text-slate-600
              "
            >
              จำนวน {assets.length} รายการ
            </p>
          </div>
        </div>

        <div
          className="
            overflow-x-auto
            rounded-xl
            bg-white
          "
        >
          <table
            className="
              w-full
              min-w-[1500px]
              border-collapse
              text-sm
            "
          >
            <thead>
              <tr>
                {/* ลำดับ */}

                <th
                  className="
                    w-[5%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  ลำดับ
                </th>

                {/* รหัสครุภัณฑ์ */}

                <th
                  className="
                    w-[12%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  รหัสครุภัณฑ์
                </th>

                {/* รายการ */}

                <th
                  className="
                    w-[20%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  รายการครุภัณฑ์
                </th>

                {/* กลุ่มงาน */}

                <th
                  className="
                    w-[13%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  กลุ่มงาน
                </th>

                {/* ผู้ครอบครอง */}

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  ผู้ครอบครอง
                </th>

                {/* รับ */}

                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  รับ
                </th>

                {/* จ่าย */}

                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  จ่าย
                </th>

                {/* คงเหลือ */}

                <th
                  className="
                    w-[8%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  ยอดคงเหลือ
                </th>

                {/* ตรวจนับ */}

                <th
                  className="
                    w-[9%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  จำนวนที่ตรวจนับ
                </th>

                {/* ความถูกต้อง */}

                <th
                  className="
                    w-[11%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  ผลการตรวจสอบ
                </th>

                {/* สภาพ */}

                <th
                  className="
                    w-[13%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  สภาพครุภัณฑ์
                </th>

                {/* หมายเหตุ */}

                <th
                  className="
                    w-[16%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    font-extrabold
                    text-white
                  "
                >
                  หมายเหตุ
                </th>
              </tr>
            </thead>

            <tbody>
              {assets.map(
                (asset, index) => {
                  const row =
                    rows[index];

                  const officer =
                    asset.officer;

                  return (
                    <tr
                      key={asset.id}
                      className="
                        transition
                        hover:bg-emerald-50
                      "
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-bold
                          text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* รหัสครุภัณฑ์ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-semibold
                          text-slate-900
                        "
                      >
                        <div>
                          {asset.officeAssetNo ||
                            "-"}
                        </div>

                        {asset.governmentAssetNo && (
                          <div
                            className="
                              mt-1
                              text-xs
                              text-slate-500
                            "
                          >
                            GFMIS:{" "}
                            {
                              asset.governmentAssetNo
                            }
                          </div>
                        )}
                      </td>

                      {/* รายการ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          font-semibold
                          text-slate-900
                        "
                      >
                        <div>
                          {asset.name}
                        </div>

                        {(asset.brand ||
                          asset.model) && (
                          <div
                            className="
                              mt-1
                              text-xs
                              text-slate-500
                            "
                          >
                            {asset.brand || ""}
                            {asset.brand &&
                            asset.model
                              ? " / "
                              : ""}
                            {asset.model || ""}
                          </div>
                        )}
                      </td>

                      {/* กลุ่มงาน */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-semibold
                          text-slate-900
                        "
                      >
                        {asset.section?.name ||
                          "-"}
                      </td>

                      {/* ผู้ครอบครอง */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-semibold
                          text-slate-900
                        "
                      >
                        {officer
                          ? `${officer.firstName} ${officer.lastName}`
                          : "-"}
                      </td>

                      {/* รับ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-bold
                          text-slate-500
                        "
                      >
                        -
                      </td>

                      {/* จ่าย */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-bold
                          text-slate-500
                        "
                      >
                        -
                      </td>

                      {/* คงเหลือ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                          text-center
                          font-bold
                          text-slate-500
                        "
                      >
                        -
                      </td>

                      {/* จำนวนที่ตรวจนับ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        <input
                          type="number"
                          min="0"
                          value={
                            row.countedQty
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "countedQty",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-center
                            font-bold
                            text-slate-900
                            outline-none
                            focus:border-cyan-500
                            focus:ring-2
                            focus:ring-cyan-100
                          "
                        />
                      </td>

                      {/* ผลการตรวจสอบ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        <select
                          value={
                            row.accuracy
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "accuracy",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            p-2
                            font-semibold
                            text-slate-900
                            outline-none
                            focus:border-cyan-500
                            focus:ring-2
                            focus:ring-cyan-100
                          "
                        >
                          <option value="">
                            เลือกผลตรวจ
                          </option>

                          {accuracyOptions.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* สภาพ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        <select
                          value={
                            row.status
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "status",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            p-2
                            font-semibold
                            text-slate-900
                            outline-none
                            focus:border-cyan-500
                            focus:ring-2
                            focus:ring-cyan-100
                          "
                        >
                          <option value="">
                            เลือกสภาพ
                          </option>

                          {inspectionStatuses.map(
                            (status) => (
                              <option
                                key={
                                  status.value
                                }
                                value={
                                  status.value
                                }
                              >
                                {status.label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* หมายเหตุ */}

                      <td
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        <input
                          type="text"
                          value={
                            row.remark
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              "remark",
                              e.target.value
                            )
                          }
                          placeholder="หมายเหตุ"
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            p-2
                            font-semibold
                            text-slate-900
                            outline-none
                            placeholder:text-slate-400
                            focus:border-cyan-500
                            focus:ring-2
                            focus:ring-cyan-100
                          "
                        />
                      </td>
                    </tr>
                  );
                }
              )}

              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="
                      border
                      border-black
                      px-4
                      py-10
                      text-center
                      font-bold
                      text-slate-500
                    "
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
          border-slate-300
          bg-white
          p-4
          shadow-lg
          sm:p-6
        "
      >
        <div
          className="
            mb-5
            border-b
            border-slate-300
            pb-4
          "
        >
          <h2
            className="
              text-xl
              font-extrabold
              text-slate-900
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
              text-slate-600
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
          {inspectorIds.map(
            (inspectorId, index) => {
              const selectedOfficer =
                getOfficer(inspectorId);

              return (
                <div
                  key={index}
                  className="
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    p-4
                  "
                >
                  <div
                    className="
                      mb-3
                      text-base
                      font-extrabold
                      text-slate-900
                    "
                  >
                    ผู้ตรวจสอบคนที่{" "}
                    {index + 1}
                  </div>

                  {/* เลือกชื่อ */}

                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-bold
                      text-slate-700
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

                    {officers.map(
                      (officer) => (
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
                      )
                    )}
                  </select>

                  {/* ตำแหน่ง */}

                  <div className="mt-3">
                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-bold
                        text-slate-700
                      "
                    >
                      ตำแหน่ง
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={
                        selectedOfficer?.position ||
                        ""
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
            }
          )}
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
          "
          onClick={() => {
            alert(
              "ขั้นตอนนี้เป็นการเตรียมแบบฟอร์ม ยังไม่ได้บันทึกข้อมูล"
            );
          }}
        >
          💾 บันทึกผลการตรวจสอบ
        </button>
      </div>
    </div>
  );
}