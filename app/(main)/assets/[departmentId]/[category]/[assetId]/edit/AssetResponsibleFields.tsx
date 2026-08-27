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
  /*
   * ตรวจสอบผู้ครอบครองเดิม
   *
   * กรณีหน่วยงานมี section:
   * ผู้ครอบครองเดิมต้องอยู่ section เดียวกับครุภัณฑ์
   *
   * กรณีหน่วยงานไม่มี section:
   * สามารถใช้ผู้ครอบครองเดิมได้ตามปกติ
   */
  const initialOfficer = useMemo(() => {
    if (initialOfficerId === null) {
      return null;
    }

    return (
      officers.find(
        (officer) => officer.id === initialOfficerId
      ) ?? null
    );
  }, [officers, initialOfficerId]);

  const validInitialOfficerId =
    sections.length === 0
      ? initialOfficerId
      : initialSectionId !== null &&
          initialOfficer?.sectionId === initialSectionId
        ? initialOfficerId
        : null;

  const [sectionId, setSectionId] = useState<string>(
    initialSectionId !== null
      ? String(initialSectionId)
      : ""
  );

  const [officerId, setOfficerId] = useState<string>(
    validInitialOfficerId !== null
      ? String(validInitialOfficerId)
      : ""
  );

  /*
   * กรองผู้ครอบครองตามกลุ่มงาน
   *
   * หน่วยงานไม่มี section
   * → แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงาน
   *
   * หน่วยงานมี section
   * → ต้องเลือก section ก่อน
   * → แสดงเฉพาะเจ้าหน้าที่ใน section นั้น
   */
  const filteredOfficers = useMemo(() => {
    if (sections.length === 0) {
      return officers;
    }

    if (!sectionId) {
      return [];
    }

    const selectedSectionId = Number(sectionId);

    return officers.filter(
      (officer) =>
        officer.sectionId === selectedSectionId
    );
  }, [officers, sections.length, sectionId]);

  /*
   * ผู้ครอบครองที่เลือก
   */
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

  /*
   * เปลี่ยนกลุ่มงาน
   */
  function handleSectionChange(value: string) {
    setSectionId(value);

    /*
     * ไม่เลือกกลุ่มงาน
     * → ล้างผู้ครอบครอง
     */
    if (!value) {
      setOfficerId("");
      return;
    }

    const selectedSectionId = Number(value);

    const currentOfficer = officers.find(
      (officer) =>
        officer.id === Number(officerId)
    );

    /*
     * ผู้ครอบครองเดิมอยู่กลุ่มงานใหม่
     * → คงค่าเดิมไว้
     */
    if (
      currentOfficer &&
      currentOfficer.sectionId ===
        selectedSectionId
    ) {
      return;
    }

    /*
     * เปลี่ยนกลุ่มงานแล้วผู้ครอบครองเดิม
     * ไม่ตรงกลุ่มงาน
     * → ล้างผู้ครอบครอง
     */
    setOfficerId("");
  }

  /*
   * เปลี่ยนผู้ครอบครอง
   */
  function handleOfficerChange(value: string) {
    setOfficerId(value);
  }

  return (
    <div
      className="
        grid
        items-stretch
        gap-4
        pt-4
        sm:grid-cols-2
      "
    >
      {/* =====================================================
          หน่วยงาน
      ===================================================== */}

      <div className="min-w-0 h-full">
        <label
          htmlFor="departmentDisplay"
          className="
            block
            text-sm
            font-extrabold
            !text-slate-200
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
        <div className="min-w-0 h-full">
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

      <div className="min-w-0 h-full">
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
          onChange={(event) =>
            handleOfficerChange(
              event.target.value
            )
          }
          disabled={
            sections.length > 0 && !sectionId
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

      <div className="min-w-0 h-full">
        <label
          htmlFor="positionDisplay"
          className="
            block
            text-sm
            font-extrabold
            !text-slate-200
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