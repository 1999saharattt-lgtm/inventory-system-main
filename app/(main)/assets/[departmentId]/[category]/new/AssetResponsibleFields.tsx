"use client";

import { useState } from "react";

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
};

type Section = {
  id: number;
  name: string;
  officers: Officer[];
};

type Props = {
  sections: Section[];
  officers: Officer[];
  departmentName: string;
  defaultSectionId?: number | null;
  locked?: boolean;
};

export default function AssetResponsibleFields({
  sections,
  officers: departmentOfficers,
  departmentName,
  defaultSectionId,
  locked = false,
}: Props) {
  // =====================================================
  // กำหนดกลุ่มงานเริ่มต้น
  //
  // ถ้าหน่วยงานไม่มี section
  // จะใช้ชื่อหน่วยงานเป็นกลุ่มงานอัตโนมัติ
  // =====================================================

  const [sectionId, setSectionId] = useState(
    defaultSectionId !== null &&
      defaultSectionId !== undefined
      ? String(defaultSectionId)
      : ""
  );

  const [officerId, setOfficerId] = useState("");

  const selectedSection = sections.find(
    (section) => String(section.id) === sectionId
  );

  // ถ้ามี section → ใช้เจ้าหน้าที่ของ section
  // ถ้าไม่มี section → ใช้เจ้าหน้าที่ของ department
  const officers = selectedSection?.officers ?? departmentOfficers;

  const hasSections = sections.length > 0;

  function handleSectionChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    setSectionId(value);

    // เมื่อเปลี่ยนกลุ่มงาน
    // ให้ล้างผู้ครอบครองเดิม
    setOfficerId("");
  }

  function handleOfficerChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    setOfficerId(event.target.value);
  }

  return (
    <>
      {/* =====================================================
          กลุ่มงาน
      ===================================================== */}

      <div>
        <label
          htmlFor="sectionId"
          className="
            block
            text-sm
            font-extrabold
            !text-slate-200
          "
        >
          กลุ่มงาน
        </label>

        {hasSections ? (
          <select
            id="sectionId"
            name="sectionId"
            value={sectionId}
            onChange={handleSectionChange}
            disabled={locked}
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              disabled:cursor-not-allowed
              disabled:bg-slate-200
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          >
            <option value="">
              -- ไม่ระบุ --
            </option>

            {sections.map((section) => (
              <option
                key={section.id}
                value={section.id}
              >
                {section.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              type="text"
              value={departmentName}
              readOnly
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-300
                bg-slate-200
                px-4
                py-3
                font-semibold
                text-slate-900
                outline-none
              "
            />

            <input
              type="hidden"
              name="sectionId"
              value=""
            />
          </>
        )}
      </div>

      {/* =====================================================
          ผู้ครอบครอง
      ===================================================== */}

      <div>
        <label
          htmlFor="officerId"
          className="
            block
            text-sm
            font-extrabold
            !text-slate-200
          "
        >
          ผู้ครอบครอง
        </label>

        <select
          id="officerId"
          name="officerId"
          value={officerId}
          onChange={handleOfficerChange}
          disabled={
            locked ||
            (hasSections && !sectionId)
          }
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-semibold
            text-slate-900
            outline-none
            transition
            disabled:cursor-not-allowed
            disabled:bg-slate-200
            focus:border-emerald-600
            focus:ring-2
            focus:ring-emerald-200
          "
        >
          <option value="">
            {hasSections
              ? !sectionId
                ? "-- เลือกกลุ่มงานก่อน --"
                : officers.length === 0
                  ? "-- ไม่พบผู้ครอบครอง --"
                  : "-- ไม่ระบุ --"
              : officers.length === 0
                ? "-- ไม่พบผู้ครอบครอง --"
                : "-- ไม่ระบุ --"}
          </option>

          {officers.map((officer) => (
            <option
              key={officer.id}
              value={officer.id}
            >
              {officer.firstName} {officer.lastName}
            </option>
          ))}
        </select>

        <p
          className="
            mt-2
            text-xs
            font-semibold
            !text-slate-400
          "
        >
          {hasSections
            ? "แสดงเฉพาะบุคลากรของกลุ่มงานที่เลือก"
            : "แสดงเฉพาะบุคลากรของหน่วยงานที่เลือก"}
        </p>
      </div>
    </>
  );
}