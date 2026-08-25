"use client";

import { useState } from "react";

type Section = {
  id: number;
  name: string;
  officers: Officer[];
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
};

type Props = {
  sections: Section[];
};

export default function AssetResponsibleFields({
  sections,
}: Props) {
  const [sectionId, setSectionId] = useState("");
  const [officerId, setOfficerId] = useState("");

  const selectedSection = sections.find(
    (section) => String(section.id) === sectionId
  );

  const officers = selectedSection?.officers ?? [];

  function handleSectionChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    setSectionId(event.target.value);

    // เมื่อเปลี่ยนกลุ่มงาน ให้ล้างผู้ครอบครองเดิม
    setOfficerId("");
  }

  return (
    <>
      <div>
        <label
          htmlFor="sectionId"
          className="block text-sm font-extrabold !text-slate-200"
        >
          กลุ่มงาน
        </label>

        <select
          id="sectionId"
          name="sectionId"
          value={sectionId}
          onChange={handleSectionChange}
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
          <option value="">-- ไม่ระบุ --</option>

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

      <div>
        <label
          htmlFor="officerId"
          className="block text-sm font-extrabold !text-slate-200"
        >
          ผู้ครอบครอง
        </label>

        <select
          id="officerId"
          name="officerId"
          value={officerId}
          onChange={(event) =>
            setOfficerId(event.target.value)
          }
          disabled={!sectionId}
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
            disabled:bg-slate-200
            focus:border-emerald-600
            focus:ring-2
            focus:ring-emerald-200
          "
        >
          <option value="">
            {!sectionId
              ? "-- เลือกกลุ่มงานก่อน --"
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

        <p className="mt-2 text-xs font-semibold !text-slate-400">
          แสดงเฉพาะบุคลากรของกลุ่มงานที่เลือก
        </p>
      </div>
    </>
  );
}