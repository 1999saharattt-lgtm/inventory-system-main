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
  position: string | null;
  sectionId: number | null;
};

type Props = {
  sections: Section[];
  officers: Officer[];
  defaultSectionId: number | null;
  defaultOfficerId: number | null;
};

export default function AssetResponsibleFields({
  sections,
  officers,
  defaultSectionId,
  defaultOfficerId,
}: Props) {
  const [sectionId, setSectionId] = useState<string>(
    defaultSectionId
      ? String(defaultSectionId)
      : ""
  );

  const [officerId, setOfficerId] = useState<string>(
    defaultOfficerId
      ? String(defaultOfficerId)
      : ""
  );

  const filteredOfficers = useMemo(() => {
    if (!sectionId) {
      return officers;
    }

    return officers.filter(
      (officer) =>
        String(officer.sectionId) === sectionId
    );
  }, [officers, sectionId]);

  const selectedOfficer = officers.find(
    (officer) =>
      String(officer.id) === officerId
  );

  function handleSectionChange(
    value: string
  ) {
    setSectionId(value);

    if (!value) {
      setOfficerId("");
      return;
    }

    const currentOfficer =
      officers.find(
        (officer) =>
          String(officer.id) === officerId
      );

    if (
      !currentOfficer ||
      String(currentOfficer.sectionId) !== value
    ) {
      setOfficerId("");
    }
  }

  return (
    <>
      {/* =====================================================
          กลุ่มงาน
      ===================================================== */}

      {sections.length > 0 && (
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
            setOfficerId(event.target.value)
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
            -- ยังไม่ได้ระบุผู้ครอบครอง --
          </option>

          {filteredOfficers.map((officer) => (
            <option
              key={officer.id}
              value={officer.id}
            >
              {officer.firstName}{" "}
              {officer.lastName}
            </option>
          ))}
        </select>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            text-slate-500
          "
        >
          {sectionId
            ? "รายชื่อผู้ครอบครองจะแสดงเฉพาะเจ้าหน้าที่ในกลุ่มงานที่เลือก"
            : "รายชื่อผู้ครอบครองจะแสดงตามหน่วยงาน"}
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
            block
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
    </>
  );
}