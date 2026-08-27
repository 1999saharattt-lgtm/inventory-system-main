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
    // หน่วยงานไม่มี section
    // แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงาน
    if (sections.length === 0) {
      return officers;
    }

    // ยังไม่ได้เลือกกลุ่มงาน
    if (!selectedSection) {
      return [];
    }

    // หน่วยงานมี section
    // ใช้เจ้าหน้าที่จาก section ที่เลือกโดยตรง
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
    setSectionId(value);

    // เปลี่ยนกลุ่มงาน
    // ต้องล้างผู้ครอบครองเดิม
    setOfficerId("");
  }

  function handleOfficerChange(
    value: string
  ) {
    setOfficerId(value);
  }

  return (
    <div
      className="
        grid
        gap-4
        sm:grid-cols-2
      "
    >
      {/* =====================================================
          หน่วยงาน
      ===================================================== */}

      <div
        className="
          min-w-0
          rounded-xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-md
        "
      >
        <label
          className="
            text-sm
            font-extrabold
            text-slate-700
          "
        >
          หน่วยงาน
        </label>

        <div
          className="
            mt-2
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-extrabold
            text-slate-900
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
        <div
          className="
            min-w-0
            rounded-xl
            border
            border-slate-300
            bg-white
            p-4
            shadow-md
          "
        >
          <label
            htmlFor="sectionId"
            className="
              text-sm
              font-extrabold
              text-slate-700
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

      <div
        className="
          min-w-0
          rounded-xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-md
        "
      >
        <label
          htmlFor="officerId"
          className="
            text-sm
            font-extrabold
            text-slate-700
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
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-400
            focus:border-emerald-600
            focus:ring-2
            focus:ring-emerald-200
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
            text-slate-500
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

      <div
        className="
          min-w-0
          rounded-xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-md
        "
      >
        <label
          className="
            text-sm
            font-extrabold
            text-slate-700
          "
        >
          ตำแหน่ง
        </label>

        <div
          className="
            mt-2
            min-h-[50px]
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-extrabold
            text-slate-900
          "
        >
          {selectedOfficer?.position ?? "-"}
        </div>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            text-slate-500
          "
        >
          ตำแหน่งจะแสดงตามผู้ครอบครองที่เลือก
        </p>
      </div>
    </div>
  );
}