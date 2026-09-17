"use client";

import { useMemo, useState } from "react";

/* =========================================================
   TYPES
   ========================================================= */

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

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AssetResponsibleFields({
  sections,
  officers,
  initialSectionId,
  initialOfficerId,
  departmentName,
  departmentId,
}: Props) {
  /* =======================================================
     ตรวจสอบกลุ่มงานเดิม
     ======================================================= */

  const validInitialSectionId = useMemo(() => {
    if (initialSectionId === null) {
      return null;
    }

    const exists = sections.some(
      (section) => section.id === initialSectionId
    );

    return exists ? initialSectionId : null;
  }, [sections, initialSectionId]);

  /* =======================================================
     ตรวจสอบ Officer เดิม
     ======================================================= */

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

  /* =======================================================
     ตรวจสอบ Officer เดิมว่าใช้ได้หรือไม่

     ไม่มี Section
     → ใช้ Officer เดิมได้

     มี Section
     → Officer ต้องอยู่ Section เดียวกับ Asset
     ======================================================= */

  const validInitialOfficerId = useMemo(() => {
    if (!initialOfficer) {
      return null;
    }

    if (sections.length === 0) {
      return initialOfficer.id;
    }

    if (validInitialSectionId === null) {
      return null;
    }

    if (
      initialOfficer.sectionId !== validInitialSectionId
    ) {
      return null;
    }

    return initialOfficer.id;
  }, [
    initialOfficer,
    sections.length,
    validInitialSectionId,
  ]);

  /* =======================================================
     STATE : SECTION
     ======================================================= */

  const [sectionId, setSectionId] = useState<string>(
    validInitialSectionId !== null
      ? String(validInitialSectionId)
      : ""
  );

  /* =======================================================
     STATE : OFFICER
     ======================================================= */

  const [officerId, setOfficerId] = useState<string>(
    validInitialOfficerId !== null
      ? String(validInitialOfficerId)
      : ""
  );

  /* =======================================================
     SECTION ที่เลือกปัจจุบัน
     ======================================================= */

  const selectedSectionId = useMemo(() => {
    if (!sectionId) {
      return null;
    }

    const parsed = Number(sectionId);

    if (!Number.isInteger(parsed)) {
      return null;
    }

    const exists = sections.some(
      (section) => section.id === parsed
    );

    return exists ? parsed : null;
  }, [sectionId, sections]);

  /* =======================================================
     กรอง Officer ตาม Section
     ======================================================= */

  const filteredOfficers = useMemo(() => {
    /*
     * หน่วยงานไม่มี Section
     * → แสดง Officer ทั้งหมด
     */
    if (sections.length === 0) {
      return officers;
    }

    /*
     * มี Section แต่ยังไม่ได้เลือก
     */
    if (selectedSectionId === null) {
      return [];
    }

    /*
     * แสดงเฉพาะ Officer ใน Section ที่เลือก
     */
    return officers.filter(
      (officer) =>
        officer.sectionId === selectedSectionId
    );
  }, [
    officers,
    sections.length,
    selectedSectionId,
  ]);

  /* =======================================================
     Officer ที่เลือกปัจจุบัน
     ======================================================= */

  const selectedOfficer = useMemo(() => {
    if (!officerId) {
      return null;
    }

    const parsedOfficerId = Number(officerId);

    if (!Number.isInteger(parsedOfficerId)) {
      return null;
    }

    return (
      filteredOfficers.find(
        (officer) => officer.id === parsedOfficerId
      ) ?? null
    );
  }, [filteredOfficers, officerId]);

  /* =======================================================
     เปลี่ยน SECTION
     ======================================================= */

  function handleSectionChange(value: string) {
    /*
     * ไม่ระบุกลุ่มงาน
     * → ล้าง Officer
     */
    if (!value) {
      setSectionId("");
      setOfficerId("");
      return;
    }

    const nextSectionId = Number(value);

    if (!Number.isInteger(nextSectionId)) {
      setSectionId("");
      setOfficerId("");
      return;
    }

    const sectionExists = sections.some(
      (section) => section.id === nextSectionId
    );

    if (!sectionExists) {
      setSectionId("");
      setOfficerId("");
      return;
    }

    setSectionId(String(nextSectionId));

    /*
     * ยังไม่มี Officer
     */
    if (!officerId) {
      return;
    }

    const currentOfficerId = Number(officerId);

    const currentOfficer = officers.find(
      (officer) => officer.id === currentOfficerId
    );

    /*
     * Officer เดิมยังอยู่ใน Section ใหม่
     * → เก็บไว้
     */
    if (
      currentOfficer &&
      currentOfficer.sectionId === nextSectionId
    ) {
      return;
    }

    /*
     * Officer ไม่อยู่ Section ใหม่
     * → ล้าง Officer
     */
    setOfficerId("");
  }

  /* =======================================================
     เปลี่ยน OFFICER
     ======================================================= */

  function handleOfficerChange(value: string) {
    /*
     * ไม่ระบุผู้ครอบครอง
     */
    if (!value) {
      setOfficerId("");
      return;
    }

    const nextOfficerId = Number(value);

    if (!Number.isInteger(nextOfficerId)) {
      setOfficerId("");
      return;
    }

    /*
     * ต้องเป็น Officer ที่อยู่ในรายการปัจจุบันเท่านั้น
     */
    const officerExists = filteredOfficers.some(
      (officer) => officer.id === nextOfficerId
    );

    if (!officerExists) {
      setOfficerId("");
      return;
    }

    setOfficerId(String(nextOfficerId));
  }

  /* =======================================================
     RENDER
     ======================================================= */

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
      {/* ===================================================
          หน่วยงาน
          =================================================== */}

      <div className="h-full min-w-0">
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

      {/* ===================================================
          กลุ่มงาน
          =================================================== */}

      {sections.length > 0 ? (
        <div className="h-full min-w-0">
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
              handleSectionChange(event.target.value)
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
              transition
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

          <p
            className="
              mt-2
              text-sm
              font-semibold
              !text-slate-400
            "
          >
            ใช้สำหรับกรองรายชื่อผู้ครอบครองตามกลุ่มงาน
          </p>
        </div>
      ) : (
        <input
          type="hidden"
          name="sectionId"
          value=""
        />
      )}

      {/* ===================================================
          ผู้ครอบครอง
          =================================================== */}

      <div className="h-full min-w-0">
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
            handleOfficerChange(event.target.value)
          }
          disabled={
            sections.length > 0 &&
            selectedSectionId === null
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
            transition
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
              {officer.firstName} {officer.lastName}
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
            ? selectedSectionId !== null
              ? filteredOfficers.length > 0
                ? `แสดงเจ้าหน้าที่ในกลุ่มงานที่เลือก ${filteredOfficers.length} คน`
                : "ยังไม่มีรายชื่อเจ้าหน้าที่ในกลุ่มงานที่เลือก"
              : "กรุณาเลือกกลุ่มงานก่อน"
            : officers.length > 0
              ? `แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงานนี้ ${officers.length} คน`
              : "ยังไม่มีรายชื่อเจ้าหน้าที่ในหน่วยงานนี้"}
        </p>
      </div>

      {/* ===================================================
          ตำแหน่ง
          =================================================== */}

      <div className="h-full min-w-0">
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
            break-words
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
          {selectedOfficer?.position?.trim() || "-"}
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