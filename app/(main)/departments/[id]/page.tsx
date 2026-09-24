import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { officerTypeText } from "@/lib/officerType";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type OfficerItem = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  type: string;
};

type OfficerTableProps = {
  officers: OfficerItem[];
};

/* =========================================================
   OFFICER PRIORITY
========================================================= */

const officerPriority = [
  "CIVIL_SERVANT",
  "GOVERNMENT_EMPLOYEE",
  "PERMANENT_EMPLOYEE",
  "OUTSOURCE",
];

/* =========================================================
   SORT OFFICERS
========================================================= */

function sortOfficers(
  officers: OfficerItem[]
) {
  return [...officers].sort(
    (a, b) => {
      /* =====================================================
         HEAD OF SECTION FIRST
      ===================================================== */

      const aHead =
        a.position?.includes(
          "หัวหน้ากลุ่ม"
        )
          ? 0
          : 1;

      const bHead =
        b.position?.includes(
          "หัวหน้ากลุ่ม"
        )
          ? 0
          : 1;

      if (aHead !== bHead) {
        return aHead - bHead;
      }

      /* =====================================================
         OFFICER TYPE
      ===================================================== */

      const aTypeIndex =
        officerPriority.indexOf(
          a.type
        );

      const bTypeIndex =
        officerPriority.indexOf(
          b.type
        );

      const aType =
        aTypeIndex === -1
          ? officerPriority.length
          : aTypeIndex;

      const bType =
        bTypeIndex === -1
          ? officerPriority.length
          : bTypeIndex;

      if (aType !== bType) {
        return aType - bType;
      }

      /* =====================================================
         NAME
      ===================================================== */

      const firstNameCompare =
        a.firstName.localeCompare(
          b.firstName,
          "th"
        );

      if (
        firstNameCompare !== 0
      ) {
        return firstNameCompare;
      }

      return a.lastName.localeCompare(
        b.lastName,
        "th"
      );
    }
  );
}

/* =========================================================
   OFFICER TABLE
========================================================= */

function OfficerTable({
  officers,
}: OfficerTableProps) {
  const sortedOfficers =
    sortOfficers(officers);

  return (
    <AppTableCard
      className="
        w-full
        min-w-0
      "
    >
      <div
        className="
          w-full
          min-w-0
          overflow-hidden
        "
      >
        <table
          className="
            w-full
            table-fixed
            border-collapse
            bg-white
            text-base
          "
        >
          {/* =================================================
              COLUMN WIDTH
          ================================================= */}

          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[30%]" />
            <col className="w-[22%]" />
            <col className="w-[20%]" />
          </colgroup>

          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <thead>
            <tr>
              {[
                "ชื่อ - นามสกุล",
                "ตำแหน่ง",
                "ประเภทบุคลากร",
                "จัดการ",
              ].map(
                (title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap

                      border
                      border-black

                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700

                      px-3
                      py-4

                      text-center
                      text-base
                      font-extrabold
                      !text-white

                      sm:text-lg
                    "
                  >
                    {title}
                  </th>
                )
              )}
            </tr>
          </thead>

          {/* =================================================
              TABLE BODY
          ================================================= */}

          <tbody>
            {sortedOfficers.map(
              (
                officer,
                index
              ) => (
                <tr
                  key={officer.id}
                  className={`
                    ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50/60"
                    }

                    transition-colors
                    duration-200

                    hover:bg-blue-50/70
                  `}
                >
                  {/* =========================================
                      NAME
                  ========================================= */}

                  <td
                    className="
                      overflow-hidden
                      border
                      border-black

                      px-4
                      py-3.5

                      text-base
                      font-extrabold
                      !text-slate-900
                    "
                    title={`${officer.firstName} ${officer.lastName}`}
                  >
                    <div
                      className="
                        overflow-hidden
                        text-ellipsis
                        whitespace-nowrap
                      "
                    >
                      {officer.firstName}{" "}
                      {officer.lastName}
                    </div>
                  </td>

                  {/* =========================================
                      POSITION
                  ========================================= */}

                  <td
                    className="
                      overflow-hidden
                      border
                      border-black

                      px-4
                      py-3.5

                      text-base
                      font-bold
                      !text-slate-900
                    "
                    title={
                      officer.position ||
                      "-"
                    }
                  >
                    <div
                      className="
                        overflow-hidden
                        text-ellipsis
                        whitespace-nowrap
                      "
                    >
                      {officer.position ||
                        "-"}
                    </div>
                  </td>

                  {/* =========================================
                      OFFICER TYPE
                  ========================================= */}

                  <td
                    className="
                      whitespace-nowrap

                      border
                      border-black

                      px-3
                      py-3.5

                      text-center
                    "
                  >
                    <span
                      className="
                        inline-flex
                        max-w-full
                        items-center
                        justify-center

                        whitespace-nowrap

                        rounded-full

                        bg-emerald-100

                        px-3
                        py-1.5

                        text-base
                        font-extrabold
                        !text-emerald-800
                      "
                    >
                      {officerTypeText(
                        officer.type as any
                      )}
                    </span>
                  </td>

                  {/* =========================================
                      ACTIONS
                  ========================================= */}

                  <td
                    className="
                      whitespace-nowrap

                      border
                      border-black

                      px-3
                      py-3

                      text-center
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      {/* =====================================
                          EDIT
                      ===================================== */}

                      <AppButton
                        href={`/officers/${officer.id}/edit`}
                        variant="primary"
                        size="sm"
                        icon={
                          <span
                            aria-hidden="true"
                          >
                            ✏️
                          </span>
                        }
                      >
                        แก้ไข
                      </AppButton>

                      {/* =====================================
                          DELETE
                      ===================================== */}

                      <AppButton
                        href={`/officers/${officer.id}/delete`}
                        variant="danger"
                        size="sm"
                        icon={
                          <span
                            aria-hidden="true"
                          >
                            🗑️
                          </span>
                        }
                      >
                        ลบ
                      </AppButton>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </AppTableCard>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyOfficerState() {
  return (
    <div
      className="
        flex
        min-h-[180px]
        w-full
        flex-col
        items-center
        justify-center

        rounded-[18px]

        border
        border-dashed
        border-slate-300

        bg-slate-50/70

        px-6
        py-10

        text-center
      "
    >
      <div
        className="
          grid
          h-14
          w-14
          place-items-center

          text-3xl
        "
        aria-hidden="true"
      >
        👤
      </div>

      <p
        className="
          mt-3
          text-lg
          font-extrabold
          !text-slate-900
        "
      >
        ยังไม่มีเจ้าหน้าที่
      </p>

      <p
        className="
          mt-1
          text-sm
          font-semibold
          !text-slate-500
        "
      >
        เมื่อเพิ่มรายชื่อเจ้าหน้าที่
        ข้อมูลจะแสดงในตารางนี้
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function DepartmentDetailPage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } =
    await params;

  const departmentId =
    Number(id);

  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },

      include: {
        officers: {
          orderBy: [
            {
              firstName:
                "asc",
            },
            {
              lastName:
                "asc",
            },
          ],
        },

        sections: {
          include: {
            officers: {
              orderBy: [
                {
                  firstName:
                    "asc",
                },
                {
                  lastName:
                    "asc",
                },
              ],
            },
          },

          orderBy: {
            id: "asc",
          },
        },
      },
    });

  if (!department) {
    notFound();
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title={
          department.name
        }
        subtitle="รายละเอียดหน่วยงานและรายชื่อเจ้าหน้าที่"
        actions={
          <AppButton
            href="/departments"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          NO SECTION
      ===================================================== */}

      {department.sections
        .length === 0 ? (
        <AppCard
          className="
            w-full
            min-w-0
          "
        >
          {/* =================================================
              SECTION HEADER
          ================================================= */}

          <div
            className="
              mb-6

              flex
              flex-col
              gap-4

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <h2
                className="
                  text-xl
                  font-extrabold
                  !text-slate-900

                  sm:text-2xl
                "
              >
                รายชื่อเจ้าหน้าที่
              </h2>

              <p
                className="
                  mt-1

                  text-sm
                  font-semibold
                  !text-slate-500

                  sm:text-base
                "
              >
                จำนวนเจ้าหน้าที่{" "}
                <span
                  className="
                    font-extrabold
                    !text-slate-900
                  "
                >
                  {department.officers.length.toLocaleString(
                    "th-TH"
                  )}
                </span>{" "}
                คน
              </p>
            </div>

            <AppButton
              href={`/departments/${department.id}/officers/create`}
              variant="primary"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ＋
                </span>
              }
            >
              เพิ่มรายชื่อ
            </AppButton>
          </div>

          {/* =================================================
              OFFICERS
          ================================================= */}

          {department.officers
            .length === 0 ? (
            <EmptyOfficerState />
          ) : (
            <OfficerTable
              officers={
                department.officers
              }
            />
          )}
        </AppCard>
      ) : (
        /* ===================================================
           SECTIONS
        =================================================== */

        <div
          className="
            space-y-4
            sm:space-y-6
          "
        >
          {department.sections.map(
            (section) => (
              <AppCard
                key={
                  section.id
                }
                className="
                  w-full
                  min-w-0
                "
              >
                {/* ===========================================
                    SECTION HEADER
                =========================================== */}

                <div
                  className="
                    mb-6

                    flex
                    flex-col
                    gap-4

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div
                    className="
                      min-w-0
                    "
                  >
                    <h2
                      className="
                        break-words

                        text-xl
                        font-extrabold
                        !text-slate-900

                        sm:text-2xl
                      "
                    >
                      {
                        section.name
                      }
                    </h2>

                    <p
                      className="
                        mt-1

                        text-sm
                        font-semibold
                        !text-slate-500

                        sm:text-base
                      "
                    >
                      จำนวนเจ้าหน้าที่{" "}
                      <span
                        className="
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {section.officers.length.toLocaleString(
                          "th-TH"
                        )}
                      </span>{" "}
                      คน
                    </p>
                  </div>

                  {/* =========================================
                      ADD OFFICER
                  ========================================= */}

                  <AppButton
                    href={`/sections/${section.id}/officers/create`}
                    variant="primary"
                    size="md"
                    icon={
                      <span
                        aria-hidden="true"
                      >
                        ＋
                      </span>
                    }
                  >
                    เพิ่มรายชื่อ
                  </AppButton>
                </div>

                {/* ===========================================
                    OFFICERS
                =========================================== */}

                {section.officers
                  .length ===
                0 ? (
                  <EmptyOfficerState />
                ) : (
                  <OfficerTable
                    officers={
                      section.officers
                    }
                  />
                )}
              </AppCard>
            )
          )}
        </div>
      )}
    </AppPage>
  );
}