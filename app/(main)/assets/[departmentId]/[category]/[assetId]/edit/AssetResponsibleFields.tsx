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

  /*
   * ข้อมูลผู้รับผิดชอบ/ตำแหน่งเดิมจาก Excel
   *
   * ตัวอย่าง:
   * - หน้าห้องผู้อำนวยการ
   * - ข้างห้องชั้น 4
   * - ห้องประชุม
   * - ชื่อผู้รับผิดชอบเดิม
   *
   * สำคัญ:
   * ข้อมูลนี้แยกจาก officerId
   * และไม่ถูกแก้ไขจาก Component นี้
   */
  initialResponsibleName: string | null;

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
  initialResponsibleName,
  departmentName,
  departmentId,
}: Props) {
  /* =======================================================
     ตรวจสอบกลุ่มงานเดิม

     Section เดิมต้องอยู่ในรายการที่ Server ส่งมา
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
     ตรวจสอบว่า Officer เดิมยังใช้ได้หรือไม่

     หน่วยงานไม่มี Section
     → ใช้ Officer เดิมได้

     หน่วยงานมี Section
     → Asset ต้องมี Section ที่ถูกต้อง
     → Officer ต้องอยู่ Section เดียวกับ Asset

     หมายเหตุ:
     responsibleName ไม่เกี่ยวข้องกับการตรวจสอบนี้
     ======================================================= */

  const validInitialOfficerId = useMemo(() => {
    if (!initialOfficer) {
      return null;
    }

    /*
     * หน่วยงานไม่มีการแบ่งกลุ่มงาน
     */
    if (sections.length === 0) {
      return initialOfficer.id;
    }

    /*
     * หน่วยงานมี Section
     * แต่ Asset เดิมไม่มี Section ที่ถูกต้อง
     */
    if (validInitialSectionId === null) {
      return null;
    }

    /*
     * Officer ต้องอยู่ Section เดียวกับ Asset
     */
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

     ผู้ครอบครองเป็น Optional
     สามารถไม่เลือกได้
     ======================================================= */

  const [officerId, setOfficerId] = useState<string>(
    validInitialOfficerId !== null
      ? String(validInitialOfficerId)
      : ""
  );

  /* =======================================================
     RESPONSIBLE NAME เดิมจาก Excel

     ไม่ใช้ State
     ไม่ให้แก้ไข
     ไม่ส่งกลับไป update

     ทำให้ข้อมูลเดิมไม่ถูกกระทบ
     ======================================================= */

  const responsibleName =
    initialResponsibleName?.trim() ?? "";

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

     กรณี 1:
     หน่วยงานไม่มี Section
     → แสดง Officer ทั้งหมดที่ Server ส่งมา

     กรณี 2:
     หน่วยงานมี Section แต่ยังไม่เลือก
     → ไม่แสดง Officer

     กรณี 3:
     เลือก Section แล้ว
     → แสดงเฉพาะ Officer ของ Section นั้น
     ======================================================= */

  const filteredOfficers = useMemo(() => {
    /*
     * ไม่มี Section
     */
    if (sections.length === 0) {
      return officers;
    }

    /*
     * ยังไม่เลือก Section
     */
    if (selectedSectionId === null) {
      return [];
    }

    /*
     * กรองตาม Section
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

     ใช้ filteredOfficers เพื่อป้องกัน Officer
     ที่ไม่ได้อยู่ใน Section ปัจจุบัน
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
        (officer) =>
          officer.id === parsedOfficerId
      ) ?? null
    );
  }, [filteredOfficers, officerId]);

  /* =======================================================
     เปลี่ยน SECTION
     ======================================================= */

  function handleSectionChange(value: string) {
    /*
     * ไม่ระบุ Section
     *
     * ล้างเฉพาะ officerId
     * responsibleName เดิมไม่เกี่ยวข้อง
     */
    if (!value) {
      setSectionId("");
      setOfficerId("");
      return;
    }

    const nextSectionId = Number(value);

    /*
     * ตรวจสอบ Integer
     */
    if (!Number.isInteger(nextSectionId)) {
      setSectionId("");
      setOfficerId("");
      return;
    }

    /*
     * ตรวจสอบว่า Section มีอยู่จริง
     */
    const sectionExists = sections.some(
      (section) =>
        section.id === nextSectionId
    );

    if (!sectionExists) {
      setSectionId("");
      setOfficerId("");
      return;
    }

    setSectionId(String(nextSectionId));

    /*
     * ยังไม่มี Officer
     * ไม่ต้องทำอะไรต่อ
     */
    if (!officerId) {
      return;
    }

    const currentOfficerId =
      Number(officerId);

    const currentOfficer =
      officers.find(
        (officer) =>
          officer.id === currentOfficerId
      );

    /*
     * Officer เดิมยังอยู่ใน Section ใหม่
     * → คงค่าเดิม
     */
    if (
      currentOfficer &&
      currentOfficer.sectionId === nextSectionId
    ) {
      return;
    }

    /*
     * Officer เดิมไม่อยู่ Section ใหม่
     * → ล้างเฉพาะ Officer
     *
     * responsibleName เดิมไม่ถูกแตะต้อง
     */
    setOfficerId("");
  }

  /* =======================================================
     เปลี่ยน OFFICER
     ======================================================= */

  function handleOfficerChange(value: string) {
    /*
     * ไม่ระบุผู้ครอบครอง
     *
     * → officerId ว่าง
     * → responsibleName เดิมยังอยู่
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
     * ต้องเป็น Officer ที่อยู่ในรายการ
     * filteredOfficers เท่านั้น
     */
    const officerExists =
      filteredOfficers.some(
        (officer) =>
          officer.id === nextOfficerId
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

        {/*
         * ส่ง departmentId กลับ Server
         *
         * Server จะตรวจอีกครั้งว่า
         * ตรงกับ Department เดิมของ Asset
         */}
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
          ข้อมูลเดิมจากทะเบียน / Excel

          สำคัญ:
          - แสดงอย่างเดียว
          - ไม่แก้ไข
          - ไม่มี name="responsibleName"
          - จึงไม่ส่งค่าไป action.ts
          - action.ts จะไม่เขียนทับข้อมูลเดิม
          =================================================== */}

      <div className="h-full min-w-0">
        <label
          htmlFor="responsibleNameDisplay"
          className="
            block
            text-sm
            font-extrabold
            !text-slate-200
          "
        >
          ผู้รับผิดชอบเดิม / ตำแหน่งจัดเก็บ
        </label>

        <div
          id="responsibleNameDisplay"
          className="
            mt-2
            min-h-[50px]
            w-full
            break-words
            rounded-xl
            border
            border-slate-300
            bg-slate-100
            px-4
            py-3
            font-semibold
            text-slate-900
          "
        >
          {responsibleName || "-"}
        </div>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            !text-slate-400
          "
        >
          ข้อมูลเดิมจากทะเบียน/Excel ระบบจะเก็บไว้ตามเดิม
        </p>
      </div>

      {/* ===================================================
          ผู้ครอบครอง

          Optional:
          จะเลือกหรือไม่เลือกก็ได้
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
            handleOfficerChange(
              event.target.value
            )
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
          ตำแหน่งของ Officer

          แสดงตาม Officer ที่เลือกเท่านั้น
          ไม่เกี่ยวกับ responsibleName
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
          {selectedOfficer?.position?.trim() ||
            "-"}
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