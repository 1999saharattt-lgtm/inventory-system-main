"use client";

import { useMemo, useState } from "react";

type Section = {
id: number;
name: string;
};

type Officer = {
id: number;
firstName: string;
lastName: string;
position: string;
sectionId: number | null;
};

type Props = {
sections: Section[];
officers: Officer[];
initialSectionId: number | null;
initialOfficerId: number | null;
departmentName: string;
departmentId: number;
};

export default function AssetResponsibleFields({
sections,
officers,
initialSectionId,
initialOfficerId,
departmentName,
departmentId,
}: Props) {
const [sectionId, setSectionId] = useState<string>(
initialSectionId !== null
? String(initialSectionId)
: ""
);

const [officerId, setOfficerId] = useState<string>(
initialOfficerId !== null
? String(initialOfficerId)
: ""
);

const filteredOfficers = useMemo(() => {
// หน่วยงานไม่มี section
// แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงาน
if (sections.length === 0) {
return officers;
}


// ยังไม่ได้เลือกกลุ่มงาน
if (!sectionId) {
  return [];
}

const selectedSectionId = Number(sectionId);

// หน่วยงานมี section
// แสดงเฉพาะเจ้าหน้าที่ในกลุ่มงานที่เลือก
return officers.filter(
  (officer) =>
    officer.sectionId === selectedSectionId
);


}, [officers, sections.length, sectionId]);

const selectedOfficer = useMemo(() => {
if (!officerId) {
return null;
}


return (
  officers.find(
    (officer) =>
      officer.id === Number(officerId)
  ) ?? null
);


}, [officers, officerId]);

function handleSectionChange(value: string) {
setSectionId(value);


if (!value) {
  setOfficerId("");
  return;
}

const selectedSectionId = Number(value);

const currentOfficer = officers.find(
  (officer) =>
    officer.id === Number(officerId)
);

// ถ้าผู้ครอบครองเดิมอยู่ในกลุ่มงานใหม่
// ให้คงค่าเดิมไว้
if (
  currentOfficer &&
  currentOfficer.sectionId === selectedSectionId
) {
  return;
}

// เปลี่ยนกลุ่มงานแล้วผู้ครอบครองเดิมไม่ตรงกลุ่ม
// ต้องล้างผู้ครอบครองเดิม
setOfficerId("");


}

function handleOfficerChange(value: string) {
setOfficerId(value);
}

return ( <div
   className="
     grid
     items-stretch
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
      h-full
      rounded-xl
      border
      border-slate-300
      bg-white
      p-4
      shadow-md
    "
  >
    <label
      htmlFor="departmentDisplay"
      className="
        block
        text-sm
        font-extrabold
        text-slate-700
      "
    >
      หน่วยงาน
    </label>

    <div
      id="departmentDisplay"
      className="
        mt-2
        min-h-[50px]
        w-full
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
        h-full
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
          block
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
          min-h-[50px]
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
      h-full
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
        block
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
        min-h-[50px]
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
        !text-slate-400
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
      h-full
      rounded-xl
      border
      border-slate-300
      bg-white
      p-4
      shadow-md
    "
  >
    <label
      htmlFor="positionDisplay"
      className="
        block
        text-sm
        font-extrabold
        text-slate-700
      "
    >
      ตำแหน่ง
    </label>

    <div
      id="positionDisplay"
      className="
        mt-2
        min-h-[50px]
        w-full
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
        !text-slate-400
      "
    >
      ตำแหน่งจะแสดงตามผู้ครอบครองที่เลือก
    </p>
  </div>
</div>

);
}
