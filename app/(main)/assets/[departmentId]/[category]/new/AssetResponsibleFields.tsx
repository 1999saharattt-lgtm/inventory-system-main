"use client";

import { useMemo, useState } from "react";

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  sectionId: number | null;
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
  departmentId: number;
};

export default function AssetResponsibleFields({
  sections,
  officers,
  departmentName,
  departmentId,
}: Props) {
  const [sectionId, setSectionId] =
    useState<string>("");

  const [officerId, setOfficerId] =
    useState<string>("");

  const selectedSection = useMemo(() => {
    if (!sectionId) {
      return null;
    }

    return (
      sections.find(
        (section) =>
          section.id === Number(sectionId)
      ) ?? null
    );
  }, [sections, sectionId]);

  const filteredOfficers = useMemo(() => {
    // =====================================================
    // หน่วยงานไม่มี section
    // แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงาน
    // =====================================================

    if (sections.length === 0) {
      return officers;
    }

    // =====================================================
    // ยังไม่ได้เลือกกลุ่มงาน
    // =====================================================

    if (!selectedSection) {
      return [];
    }

    // =====================================================
    // หน่วยงานมี section
    // แสดงเจ้าหน้าที่ของกลุ่มงานที่เลือก
    // โดยใช้ข้อมูล officers จาก section โดยตรง
    // =====================================================

    return selectedSection.officers;
  }, [
    officers,
    sections,
    selectedSection,
  ]);

  const selectedOfficer = useMemo(() => {
    if (!officerId) {
      return null;
    }

    return (
      filteredOfficers.find(
        (officer) =>
          officer.id === Number(officerId)
      ) ?? null
    );
  }, [filteredOfficers, officerId]);

  function handleSectionChange(
    value: string
  ) {
    // =====================================================
    // เปลี่ยนกลุ่มงาน
    // ต้องล้างผู้ครอบครองเดิมทุกครั้ง
    // =====================================================

    setSectionId(value);
    setOfficerId("");
  }

  function handleOfficerChange(
    value: string
  ) {
    // =====================================================
    // เมื่อเลือกผู้ครอบครอง
    //
    // officer ที่เลือกมาจาก filteredOfficers อยู่แล้ว
    // ดังนั้นผู้ครอบครองจะสัมพันธ์กับกลุ่มงานที่เลือก
    // =====================================================

    setOfficerId(value);
  }

  return (
    <div
      className="
        mt-4
        grid
        w-full
        gap-5
        sm:grid-cols-2
      "
    >
      {/* =====================================================
          หน่วยงาน
      ===================================================== */}

      <div className="min-w-0">
        <label
          htmlFor="departmentDisplay"
          className="
            mb-2
            block
            text-lg
            font-extrabold
            text-white
          "
        >
          หน่วยงาน
        </label>

        <div
          id="departmentDisplay"
          className="
            flex
            min-h-[50px]
            w-full
            items-center
            rounded-xl
            border
            border-slate-600
            bg-slate-700
            px-4
            py-3
            font-extrabold
            text-white
          "
        >
          {departmentName}
        </div>

        <input
          type="hidden"
          name="departmentId"
          value={departmentId}
        />
      </div>

      {/* =====================================================
          กลุ่มงาน
      ===================================================== */}

      {sections.length > 0 ? (
        <div className="min-w-0">
          <label
            htmlFor="sectionId"
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            "
          >
            กลุ่มงาน
          </label>

          <select
            id="sectionId"
            name="sectionId"
            value={sectionId}
            onChange={(event) =>
              handleSectionChange(
                event.target.value
              )
            }
            className="
              min-h-[50px]
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              text-white
              focus:border-cyan-400
              focus:outline-none
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
        </div>
      ) : (
        <input
          type="hidden"
          name="sectionId"
          value=""
        />
      )}

      {/* =====================================================
          ผู้ครอบครอง
      ===================================================== */}

      <div className="min-w-0">
        <label
          htmlFor="officerId"
          className="
            mb-2
            block
            text-lg
            font-extrabold
            text-white
          "
        >
          ผู้ครอบครอง
        </label>

        <select
          id="officerId"
          name="officerId"
          value={officerId}
          onChange={(event) =>
            handleOfficerChange(
              event.target.value
            )
          }
          disabled={
            sections.length > 0 &&
            !sectionId
          }
          className="
            min-h-[50px]
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
            disabled:cursor-not-allowed
            disabled:bg-slate-700
            disabled:text-slate-400
          "
        >
          <option value="">
            -- ยังไม่ได้ระบุผู้ครอบครอง --
          </option>

          {filteredOfficers.map(
            (officer) => (
              <option
                key={officer.id}
                value={officer.id}
              >
                {officer.firstName}{" "}
                {officer.lastName}
              </option>
            )
          )}
        </select>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            text-slate-400
          "
        >
          {sections.length > 0
            ? sectionId
              ? "แสดงเฉพาะเจ้าหน้าที่ในกลุ่มงานที่เลือก"
              : "กรุณาเลือกกลุ่มงานก่อน"
            : "แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงานนี้"}
        </p>
      </div>

      {/* =====================================================
          ตำแหน่ง
      ===================================================== */}

      <div className="min-w-0">
        <label
          htmlFor="positionDisplay"
          className="
            mb-2
            block
            text-lg
            font-extrabold
            text-white
          "
        >
          ตำแหน่ง
        </label>

        <div
          id="positionDisplay"
          className="
            flex
            min-h-[50px]
            w-full
            items-center
            rounded-xl
            border
            border-slate-600
            bg-slate-700
            px-4
            py-3
            font-extrabold
            text-white
          "
        >
          {selectedOfficer?.position ?? "-"}
        </div>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            text-slate-400
          "
        >
          ตำแหน่งจะแสดงตามผู้ครอบครองที่เลือก
        </p>
      </div>
    </div>
  );
}