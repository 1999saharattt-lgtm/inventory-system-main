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
};

type Props = {
  sections: Section[];
  officers: Officer[];

  initialSectionId?: number | null;
  initialOfficerId?: number | null;

  departmentName: string;
  departmentId: number;
};

/* =========================================================
   NORMALIZE SEARCH
========================================================= */

function normalizeSearch(
  value: string
) {
  return value
    .trim()
    .toLocaleLowerCase("th-TH");
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AssetResponsibleFields({
  sections,
  officers,
  initialSectionId = null,
  initialOfficerId = null,
  departmentName,
  departmentId,
}: Props) {
  /* =======================================================
     VALUES
  ======================================================= */

  const [sectionId, setSectionId] =
    useState<string>(
      initialSectionId
        ? String(initialSectionId)
        : ""
    );

  const [officerId, setOfficerId] =
    useState<string>(
      initialOfficerId
        ? String(initialOfficerId)
        : ""
    );

  /* =======================================================
     SEARCH
  ======================================================= */

  const [
    sectionSearch,
    setSectionSearch,
  ] = useState("");

  const [
    officerSearch,
    setOfficerSearch,
  ] = useState("");

  /* =======================================================
     DROPDOWN
  ======================================================= */

  const [
    sectionDropdownOpen,
    setSectionDropdownOpen,
  ] = useState(false);

  const [
    officerDropdownOpen,
    setOfficerDropdownOpen,
  ] = useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const sectionRef =
    useRef<HTMLDivElement>(null);

  const officerRef =
    useRef<HTMLDivElement>(null);

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
    }, [
      sections,
      sectionId,
    ]);

  /* =======================================================
     FILTERED OFFICERS

     ถ้ามี section:
     แสดงเฉพาะเจ้าหน้าที่ของ section ที่เลือก

     ถ้าไม่มี section:
     แสดงเจ้าหน้าที่ทั้งหมด
  ======================================================= */

  const availableOfficers =
    useMemo(() => {
      if (
        sections.length === 0
      ) {
        return officers;
      }

      if (!sectionId) {
        return [];
      }

      return officers.filter(
        (officer) =>
          officer.sectionId ===
          Number(sectionId)
      );
    }, [
      officers,
      sections.length,
      sectionId,
    ]);

  /* =======================================================
     SELECTED OFFICER

     ค้นจาก officers ทั้งหมด
     เพื่อให้ค่าเดิมยังแสดงได้
  ======================================================= */

  const selectedOfficer =
    useMemo(() => {
      if (!officerId) {
        return null;
      }

      return (
        officers.find(
          (officer) =>
            officer.id ===
            Number(officerId)
        ) ?? null
      );
    }, [
      officers,
      officerId,
    ]);

  /* =======================================================
     SECTION SEARCH RESULT
  ======================================================= */

  const filteredSections =
    useMemo(() => {
      const keyword =
        normalizeSearch(
          sectionSearch
        );

      if (!keyword) {
        return sections;
      }

      return sections.filter(
        (section) =>
          normalizeSearch(
            section.name
          ).includes(keyword)
      );
    }, [
      sections,
      sectionSearch,
    ]);

  /* =======================================================
     OFFICER SEARCH RESULT
  ======================================================= */

  const filteredOfficers =
    useMemo(() => {
      const keyword =
        normalizeSearch(
          officerSearch
        );

      if (!keyword) {
        return availableOfficers;
      }

      return availableOfficers.filter(
        (officer) => {
          const fullName =
            `${officer.firstName} ${officer.lastName}`;

          const searchableText =
            `${fullName} ${officer.position}`;

          return normalizeSearch(
            searchableText
          ).includes(keyword);
        }
      );
    }, [
      availableOfficers,
      officerSearch,
    ]);

  /* =======================================================
     DISPLAY VALUE
  ======================================================= */

  const sectionDisplayValue =
    sectionDropdownOpen
      ? sectionSearch
      : selectedSection?.name ??
        "";

  const officerDisplayValue =
    officerDropdownOpen
      ? officerSearch
      : selectedOfficer
        ? `${selectedOfficer.firstName} ${selectedOfficer.lastName}`
        : "";

  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        sectionRef.current &&
        !sectionRef.current.contains(
          target
        )
      ) {
        setSectionDropdownOpen(
          false
        );

        setSectionSearch("");
      }

      if (
        officerRef.current &&
        !officerRef.current.contains(
          target
        )
      ) {
        setOfficerDropdownOpen(
          false
        );

        setOfficerSearch("");
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
     ESC
  ======================================================= */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      setSectionDropdownOpen(
        false
      );

      setOfficerDropdownOpen(
        false
      );

      setSectionSearch("");

      setOfficerSearch("");
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =======================================================
     SELECT SECTION
  ======================================================= */

  function selectSection(
    value: string
  ) {
    setSectionId(value);

    /*
     * เปลี่ยนกลุ่มงาน
     * ต้องล้างผู้ครอบครองเดิม
     */

    setOfficerId("");

    setSectionSearch("");

    setOfficerSearch("");

    setSectionDropdownOpen(
      false
    );

    setOfficerDropdownOpen(
      false
    );
  }

  /* =======================================================
     SELECT OFFICER
  ======================================================= */

  function selectOfficer(
    value: string
  ) {
    setOfficerId(value);

    setOfficerSearch("");

    setOfficerDropdownOpen(
      false
    );
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

  const inputClassName = `
    min-h-[50px]
    w-full

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
    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-400
    hover:bg-slate-50

    focus:border-blue-400
    focus:bg-white
    focus:ring-4
    focus:ring-blue-500/10

    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:!text-slate-400
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        relative
        grid
        w-full
        min-w-0
        grid-cols-1
        gap-5
        overflow-visible

        lg:grid-cols-2
      "
    >
      {/* =====================================================
          HIDDEN VALUES

          ค่าที่ส่งเข้า Form
      ===================================================== */}

      <input
        type="hidden"
        name="departmentId"
        value={departmentId}
      />

      <input
        type="hidden"
        name="sectionId"
        value={sectionId}
      />

      <input
        type="hidden"
        name="officerId"
        value={officerId}
      />

      {/* =====================================================
          DEPARTMENT
      ===================================================== */}

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
          className="
            flex
            min-h-[50px]
            w-full
            items-center

            rounded-[14px]

            border
            border-slate-300

            bg-slate-100

            px-4
            py-3

            text-base
            font-extrabold
            !text-slate-900

            shadow-sm
          "
        >
          {departmentName}
        </div>
      </div>

      {/* =====================================================
          SECTION SEARCHABLE DROPDOWN
      ===================================================== */}

      {sections.length > 0 ? (
        <div
          ref={sectionRef}
          className="
            relative
            z-[60]
            min-w-0
          "
        >
          <label
            htmlFor="sectionSearch"
            className={
              labelClassName
            }
          >
            กลุ่มงาน
          </label>

          <div className="relative">
            {/* ===============================================
                INPUT
            =============================================== */}

            <input
              id="sectionSearch"
              type="text"
              autoComplete="off"
              value={
                sectionDisplayValue
              }
              placeholder="พิมพ์ค้นหากลุ่มงาน..."
              className={`
                ${inputClassName}
                pr-11
              `}
              onFocus={() => {
                setSectionDropdownOpen(
                  true
                );

                setSectionSearch(
                  ""
                );
              }}
              onClick={() => {
                setSectionDropdownOpen(
                  true
                );
              }}
              onChange={(
                event
              ) => {
                setSectionSearch(
                  event.target.value
                );

                setSectionDropdownOpen(
                  true
                );
              }}
            />

            {/* ===============================================
                ARROW
            =============================================== */}

            <button
              type="button"
              aria-label="เปิดรายการกลุ่มงาน"
              onClick={() => {
                setSectionDropdownOpen(
                  (current) =>
                    !current
                );

                setSectionSearch(
                  ""
                );
              }}
              className="
                absolute
                right-1
                top-1/2

                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center

                rounded-xl

                !text-slate-500

                transition

                hover:bg-slate-100
                hover:!text-slate-900
              "
            >
              <span
                className={`
                  text-sm
                  transition-transform
                  duration-200

                  ${
                    sectionDropdownOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
                aria-hidden="true"
              >
                ▼
              </span>
            </button>

            {/* ===============================================
                DROPDOWN
            =============================================== */}

            {sectionDropdownOpen && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-[calc(100%+8px)]
                  z-[100]

                  max-h-[300px]
                  overflow-y-auto

                  rounded-2xl

                  border
                  border-slate-200

                  bg-white

                  p-2

                  shadow-2xl
                  shadow-slate-900/20
                "
              >
                {/* =========================================
                    NOT SPECIFIED
                ========================================= */}

                <button
                  type="button"
                  onClick={() =>
                    selectSection(
                      ""
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center

                    rounded-xl

                    px-4
                    py-3

                    text-left
                    text-sm
                    font-bold

                    transition

                    ${
                      !sectionId
                        ? "bg-blue-50 !text-blue-700"
                        : "!text-slate-700 hover:bg-slate-100"
                    }
                  `}
                >
                  -- ไม่ระบุ --
                </button>

                {/* =========================================
                    RESULTS
                ========================================= */}

                {filteredSections.map(
                  (
                    section
                  ) => {
                    const isSelected =
                      section.id ===
                      Number(
                        sectionId
                      );

                    return (
                      <button
                        key={
                          section.id
                        }
                        type="button"
                        onClick={() =>
                          selectSection(
                            String(
                              section.id
                            )
                          )
                        }
                        className={`
                          mt-1
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3

                          rounded-xl

                          px-4
                          py-3

                          text-left
                          text-sm
                          font-bold

                          transition

                          ${
                            isSelected
                              ? "bg-blue-50 !text-blue-700"
                              : "!text-slate-700 hover:bg-slate-100 hover:!text-slate-900"
                          }
                        `}
                      >
                        <span
                          className="
                            min-w-0
                            break-words
                          "
                        >
                          {
                            section.name
                          }
                        </span>

                        {isSelected && (
                          <span
                            className="
                              shrink-0
                              !text-blue-600
                            "
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )}

                {/* =========================================
                    EMPTY SEARCH
                ========================================= */}

                {filteredSections.length ===
                  0 && (
                  <div
                    className="
                      px-4
                      py-8
                      text-center
                    "
                  >
                    <div
                      className="
                        text-2xl
                      "
                      aria-hidden="true"
                    >
                      🔍
                    </div>

                    <p
                      className="
                        mt-2
                        text-sm
                        font-extrabold
                        !text-slate-700
                      "
                    >
                      ไม่พบกลุ่มงาน
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-semibold
                        !text-slate-400
                      "
                    >
                      ลองพิมพ์คำค้นหาใหม่
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p
            className="
              mt-2
              text-xs
              font-semibold
              leading-relaxed
              !text-slate-500
            "
          >
            พิมพ์ชื่อกลุ่มงานเพื่อค้นหาได้
          </p>
        </div>
      ) : (
        <input
          type="hidden"
          name="sectionId"
          value=""
        />
      )}

      {/* =====================================================
          OFFICER SEARCHABLE DROPDOWN
      ===================================================== */}

      <div
        ref={officerRef}
        className="
          relative
          z-[50]
          min-w-0
        "
      >
        <label
          htmlFor="officerSearch"
          className={
            labelClassName
          }
        >
          ผู้ครอบครอง
        </label>

        <div className="relative">
          {/* ===============================================
              INPUT
          =============================================== */}

          <input
            id="officerSearch"
            type="text"
            autoComplete="off"
            disabled={
              sections.length >
                0 &&
              !sectionId
            }
            value={
              officerDisplayValue
            }
            placeholder={
              sections.length >
                0 &&
              !sectionId
                ? "กรุณาเลือกกลุ่มงานก่อน"
                : "พิมพ์ค้นหาชื่อผู้ครอบครอง..."
            }
            className={`
              ${inputClassName}
              pr-11
            `}
            onFocus={() => {
              if (
                sections.length >
                  0 &&
                !sectionId
              ) {
                return;
              }

              setOfficerDropdownOpen(
                true
              );

              setOfficerSearch(
                ""
              );
            }}
            onClick={() => {
              if (
                sections.length >
                  0 &&
                !sectionId
              ) {
                return;
              }

              setOfficerDropdownOpen(
                true
              );
            }}
            onChange={(
              event
            ) => {
              setOfficerSearch(
                event.target.value
              );

              setOfficerDropdownOpen(
                true
              );
            }}
          />

          {/* ===============================================
              ARROW
          =============================================== */}

          <button
            type="button"
            aria-label="เปิดรายชื่อผู้ครอบครอง"
            disabled={
              sections.length >
                0 &&
              !sectionId
            }
            onClick={() => {
              setOfficerDropdownOpen(
                (current) =>
                  !current
              );

              setOfficerSearch(
                ""
              );
            }}
            className="
              absolute
              right-1
              top-1/2

              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center

              rounded-xl

              !text-slate-500

              transition

              hover:bg-slate-100
              hover:!text-slate-900

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <span
              className={`
                text-sm
                transition-transform
                duration-200

                ${
                  officerDropdownOpen
                    ? "rotate-180"
                    : ""
                }
              `}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>

          {/* ===============================================
              DROPDOWN
          =============================================== */}

          {officerDropdownOpen &&
            !(
              sections.length >
                0 &&
              !sectionId
            ) && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-[calc(100%+8px)]
                  z-[100]

                  max-h-[320px]
                  overflow-y-auto

                  rounded-2xl

                  border
                  border-slate-200

                  bg-white

                  p-2

                  shadow-2xl
                  shadow-slate-900/20
                "
              >
                {/* =========================================
                    NO OFFICER
                ========================================= */}

                <button
                  type="button"
                  onClick={() =>
                    selectOfficer(
                      ""
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center

                    rounded-xl

                    px-4
                    py-3

                    text-left
                    text-sm
                    font-bold

                    transition

                    ${
                      !officerId
                        ? "bg-blue-50 !text-blue-700"
                        : "!text-slate-700 hover:bg-slate-100"
                    }
                  `}
                >
                  -- ยังไม่ได้ระบุผู้ครอบครอง --
                </button>

                {/* =========================================
                    OFFICERS
                ========================================= */}

                {filteredOfficers.map(
                  (
                    officer
                  ) => {
                    const isSelected =
                      officer.id ===
                      Number(
                        officerId
                      );

                    return (
                      <button
                        key={
                          officer.id
                        }
                        type="button"
                        onClick={() =>
                          selectOfficer(
                            String(
                              officer.id
                            )
                          )
                        }
                        className={`
                          mt-1
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3

                          rounded-xl

                          px-4
                          py-3

                          text-left

                          transition

                          ${
                            isSelected
                              ? "bg-blue-50"
                              : "hover:bg-slate-100"
                          }
                        `}
                      >
                        <div
                          className="
                            min-w-0
                          "
                        >
                          <div
                            className={`
                              break-words
                              text-sm
                              font-extrabold

                              ${
                                isSelected
                                  ? "!text-blue-700"
                                  : "!text-slate-800"
                              }
                            `}
                          >
                            {
                              officer.firstName
                            }{" "}
                            {
                              officer.lastName
                            }
                          </div>

                          {officer.position && (
                            <div
                              className="
                                mt-0.5
                                break-words
                                text-xs
                                font-semibold
                                !text-slate-500
                              "
                            >
                              {
                                officer.position
                              }
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <span
                            className="
                              shrink-0
                              !text-blue-600
                            "
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )}

                {/* =========================================
                    EMPTY
                ========================================= */}

                {filteredOfficers.length ===
                  0 && (
                  <div
                    className="
                      px-4
                      py-8
                      text-center
                    "
                  >
                    <div
                      className="
                        text-2xl
                      "
                      aria-hidden="true"
                    >
                      🔍
                    </div>

                    <p
                      className="
                        mt-2
                        text-sm
                        font-extrabold
                        !text-slate-700
                      "
                    >
                      ไม่พบผู้ครอบครอง
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-semibold
                        !text-slate-400
                      "
                    >
                      ลองพิมพ์ชื่อหรือตำแหน่งใหม่
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>

        <p
          className="
            mt-2
            text-xs
            font-semibold
            leading-relaxed
            !text-slate-500
          "
        >
          {sections.length > 0
            ? sectionId
              ? "พิมพ์ค้นหาผู้ครอบครองในกลุ่มงานที่เลือกได้"
              : "กรุณาเลือกกลุ่มงานก่อน"
            : "พิมพ์ค้นหาผู้ครอบครองในหน่วยงานได้"}
        </p>
      </div>

      {/* =====================================================
          POSITION
      ===================================================== */}

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
          className="
            flex
            min-h-[50px]
            w-full
            items-center

            rounded-[14px]

            border
            border-slate-300

            bg-slate-100

            px-4
            py-3

            text-base
            font-extrabold
            !text-slate-900

            shadow-sm
          "
        >
          {selectedOfficer?.position ??
            "-"}
        </div>

        <p
          className="
            mt-2
            text-xs
            font-semibold
            leading-relaxed
            !text-slate-500
          "
        >
          ตำแหน่งจะแสดงตามผู้ครอบครองที่เลือก
        </p>
      </div>
    </div>
  );
}