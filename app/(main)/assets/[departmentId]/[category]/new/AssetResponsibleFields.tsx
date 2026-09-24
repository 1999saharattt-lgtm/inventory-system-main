"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

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

type SearchableOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id: string;
  name: string;
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

/* =========================================================
   SEARCHABLE SELECT
========================================================= */

function SearchableSelect({
  id,
  name,
  value,
  options,
  placeholder,
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  /* =======================================================
     SELECTED OPTION
  ======================================================= */

  const selectedOption =
    useMemo(() => {
      return (
        options.find(
          (option) =>
            option.value === value
        ) ?? null
      );
    }, [options, value]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredOptions =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLocaleLowerCase("th");

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) =>
          option.label
            .toLocaleLowerCase("th")
            .includes(keyword) ||
          option.value
            .toLocaleLowerCase("th")
            .includes(keyword)
      );
    }, [options, search]);

  /* =======================================================
     CLOSE WHEN CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown
      );
    };
  }, []);

  /* =======================================================
     AUTO FOCUS SEARCH
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      ref={containerRef}
      className={`
        relative
        w-full
        min-w-0

        ${
          open
            ? "z-[200]"
            : "z-0"
        }
      `}
    >
      {/* ===============================================
          REAL FORM VALUE
      =============================================== */}

      <input
        type="hidden"
        name={name}
        value={value}
      />

      {/* ===============================================
          SELECT BUTTON
      =============================================== */}

      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) {
            return;
          }

          setOpen(
            (current) => {
              const next =
                !current;

              if (!next) {
                setSearch("");
              }

              return next;
            }
          );
        }}
        className="
          flex
          min-h-[50px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3

          rounded-[14px]

          border
          border-slate-300

          bg-white

          px-4
          py-3

          text-left
          text-base
          font-bold
          !text-slate-900

          shadow-sm
          outline-none

          transition-all
          duration-200

          hover:border-slate-400
          hover:bg-slate-50

          focus:border-blue-400
          focus:bg-white
          focus:ring-4
          focus:ring-blue-500/10

          disabled:cursor-not-allowed
          disabled:border-slate-200
          disabled:bg-slate-100
          disabled:!text-slate-400
          disabled:opacity-70
        "
      >
        <span
          className={`
            min-w-0
            flex-1
            truncate

            ${
              selectedOption
                ? "!text-slate-900"
                : "!text-slate-400"
            }
          `}
        >
          {selectedOption?.label ??
            placeholder}
        </span>

        <span
          aria-hidden="true"
          className={`
            shrink-0
            text-xs
            !text-slate-500

            transition-transform
            duration-200

            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        >
          ▼
        </span>
      </button>

      {/* ===============================================
          DROPDOWN
      =============================================== */}

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]

            z-[9999]

            overflow-hidden

            rounded-[16px]

            border
            border-slate-200

            bg-white

            shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)]
          "
        >
          {/* =============================================
              SEARCH
          ============================================= */}

          <div
            className="
              border-b
              border-slate-200
              bg-slate-50
              p-3
            "
          >
            <input
              ref={inputRef}
              type="text"
              value={search}
              autoComplete="off"
              placeholder={
                searchPlaceholder
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Escape"
                ) {
                  setOpen(false);
                  setSearch("");
                }

                if (
                  event.key ===
                    "Enter" &&
                  filteredOptions.length ===
                    1
                ) {
                  event.preventDefault();

                  onChange(
                    filteredOptions[0]
                      .value
                  );

                  setOpen(false);
                  setSearch("");
                }
              }}
              className="
                min-h-[46px]
                w-full

                rounded-[12px]

                border
                border-slate-300

                bg-white

                px-4
                py-2.5

                text-base
                font-bold
                !text-slate-900

                shadow-sm
                outline-none

                transition-all
                duration-200

                placeholder:!text-slate-400

                hover:border-slate-400

                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          {/* =============================================
              OPTIONS
          ============================================= */}

          <div
            role="listbox"
            className="
              max-h-[280px]
              overflow-y-auto
              overscroll-contain
              bg-white
              p-2
            "
          >
            {filteredOptions.length >
            0 ? (
              filteredOptions.map(
                (option) => {
                  const active =
                    option.value ===
                    value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      role="option"
                      aria-selected={
                        active
                      }
                      onClick={() => {
                        onChange(
                          option.value
                        );

                        setOpen(
                          false
                        );
                        setSearch("");
                      }}
                      className={`
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-3

                        rounded-[10px]

                        px-3
                        py-2.5

                        text-left
                        text-base
                        font-bold

                        transition-colors

                        ${
                          active
                            ? `
                              bg-slate-900
                              !text-white
                            `
                            : `
                              bg-white
                              !text-slate-900
                              hover:bg-slate-100
                            `
                        }
                      `}
                    >
                      <span
                        className="
                          min-w-0
                          flex-1
                          break-words
                        "
                      >
                        {option.label}
                      </span>

                      {active && (
                        <span
                          aria-hidden="true"
                          className="
                            shrink-0
                            !text-white
                          "
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                }
              )
            ) : (
              <div
                className="
                  px-4
                  py-8
                  text-center
                  text-sm
                  font-bold
                  !text-slate-500
                "
              >
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ASSET RESPONSIBLE FIELDS
========================================================= */

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

  /* =======================================================
     SELECTED SECTION
  ======================================================= */

  const selectedSection =
    useMemo(() => {
      if (!sectionId) {
        return null;
      }

      return (
        sections.find(
          (section) =>
            section.id ===
            Number(sectionId)
        ) ?? null
      );
    }, [sections, sectionId]);

  /* =======================================================
     FILTERED OFFICERS
  ======================================================= */

  const filteredOfficers =
    useMemo(() => {
      // ===================================================
      // หน่วยงานไม่มีกลุ่มงาน
      // แสดงเจ้าหน้าที่ทั้งหมด
      // ===================================================

      if (sections.length === 0) {
        return officers;
      }

      // ===================================================
      // มี Section แต่ยังไม่ได้เลือก
      // ===================================================

      if (!selectedSection) {
        return [];
      }

      // ===================================================
      // ใช้เจ้าหน้าที่ของ Section ที่เลือก
      // ===================================================

      return selectedSection.officers;
    }, [
      officers,
      sections,
      selectedSection,
    ]);

  /* =======================================================
     SELECTED OFFICER
  ======================================================= */

  const selectedOfficer =
    useMemo(() => {
      if (!officerId) {
        return null;
      }

      return (
        filteredOfficers.find(
          (officer) =>
            officer.id ===
            Number(officerId)
        ) ?? null
      );
    }, [
      filteredOfficers,
      officerId,
    ]);

  /* =======================================================
     OPTIONS
  ======================================================= */

  const sectionOptions =
    useMemo<
      SearchableOption[]
    >(
      () => [
        {
          value: "",
          label: "-- ไม่ระบุ --",
        },

        ...sections.map(
          (section) => ({
            value: String(
              section.id
            ),
            label: section.name,
          })
        ),
      ],
      [sections]
    );

  const officerOptions =
    useMemo<
      SearchableOption[]
    >(
      () => [
        {
          value: "",
          label:
            "-- ยังไม่ได้ระบุผู้ครอบครอง --",
        },

        ...filteredOfficers.map(
          (officer) => {
            const fullName =
              `${officer.firstName} ${officer.lastName}`.trim();

            return {
              value: String(
                officer.id
              ),

              label:
                officer.position
                  ? `${fullName} — ${officer.position}`
                  : fullName,
            };
          }
        ),
      ],
      [filteredOfficers]
    );

  /* =======================================================
     CHANGE SECTION
  ======================================================= */

  function handleSectionChange(
    value: string
  ) {
    setSectionId(value);

    // เปลี่ยนกลุ่มงาน
    // ล้างผู้ครอบครองเดิม
    setOfficerId("");
  }

  /* =======================================================
     CHANGE OFFICER
  ======================================================= */

  function handleOfficerChange(
    value: string
  ) {
    setOfficerId(value);
  }

  /* =======================================================
     SHARED CLASS
  ======================================================= */

  const labelClassName = `
    mb-2
    block
    text-sm
    font-extrabold
    !text-slate-700
    sm:text-base
  `;

  const displayClassName = `
    flex
    min-h-[50px]
    w-full
    min-w-0
    items-center

    rounded-[14px]

    border
    border-slate-300

    bg-white

    px-4
    py-3

    text-base
    font-bold
    !text-slate-900

    shadow-sm
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        mt-4
        grid
        w-full
        min-w-0
        grid-cols-1
        gap-4
        overflow-visible
        lg:grid-cols-2
      "
    >
      {/* ===================================================
          DEPARTMENT
      =================================================== */}

      <div className="min-w-0">
        <label
          htmlFor="departmentDisplay"
          className={
            labelClassName
          }
        >
          หน่วยงาน
        </label>

        <div
          id="departmentDisplay"
          className={
            displayClassName
          }
        >
          <span
            className="
              min-w-0
              break-words
            "
          >
            {departmentName}
          </span>
        </div>

        <input
          type="hidden"
          name="departmentId"
          value={departmentId}
        />
      </div>

      {/* ===================================================
          SECTION
      =================================================== */}

      {sections.length > 0 ? (
        <div
          className="
            relative
            z-50
            min-w-0
          "
        >
          <label
            htmlFor="sectionId"
            className={
              labelClassName
            }
          >
            กลุ่มงาน
          </label>

          <SearchableSelect
            id="sectionId"
            name="sectionId"
            value={sectionId}
            options={
              sectionOptions
            }
            placeholder="เลือกกลุ่มงาน"
            searchPlaceholder="พิมพ์ค้นหากลุ่มงาน..."
            emptyText="ไม่พบกลุ่มงาน"
            onChange={
              handleSectionChange
            }
          />
        </div>
      ) : (
        <input
          type="hidden"
          name="sectionId"
          value=""
        />
      )}

      {/* ===================================================
          OFFICER
      =================================================== */}

      <div
        className="
          relative
          z-40
          min-w-0
        "
      >
        <label
          htmlFor="officerId"
          className={
            labelClassName
          }
        >
          ผู้ครอบครอง
        </label>

        <SearchableSelect
          id="officerId"
          name="officerId"
          value={officerId}
          options={
            officerOptions
          }
          placeholder={
            sections.length > 0 &&
            !sectionId
              ? "กรุณาเลือกกลุ่มงานก่อน"
              : "เลือกผู้ครอบครอง"
          }
          searchPlaceholder="พิมพ์ชื่อหรือตำแหน่งเพื่อค้นหา..."
          emptyText="ไม่พบเจ้าหน้าที่"
          disabled={
            sections.length > 0 &&
            !sectionId
          }
          onChange={
            handleOfficerChange
          }
        />

        <p
          className="
            mt-2
            text-sm
            font-semibold
            !text-slate-500
          "
        >
          {sections.length > 0
            ? sectionId
              ? "แสดงเฉพาะเจ้าหน้าที่ในกลุ่มงานที่เลือก"
              : "กรุณาเลือกกลุ่มงานก่อน"
            : "แสดงเจ้าหน้าที่ทั้งหมดในหน่วยงานนี้"}
        </p>
      </div>

      {/* ===================================================
          POSITION
      =================================================== */}

      <div className="min-w-0">
        <label
          htmlFor="positionDisplay"
          className={
            labelClassName
          }
        >
          ตำแหน่ง
        </label>

        <div
          id="positionDisplay"
          className={
            displayClassName
          }
        >
          <span
            className={`
              min-w-0
              break-words

              ${
                selectedOfficer
                  ?.position
                  ? "!text-slate-900"
                  : "!text-slate-400"
              }
            `}
          >
            {selectedOfficer
              ?.position?.trim() ||
              "-"}
          </span>
        </div>

        <p
          className="
            mt-2
            text-sm
            font-semibold
            !text-slate-500
          "
        >
          ตำแหน่งจะแสดงตามผู้ครอบครองที่เลือก
        </p>
      </div>
    </div>
  );
}