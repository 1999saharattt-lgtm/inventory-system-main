import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   OFFICER TYPE
========================================================= */

const officerTypeOptions = [
  {
    value: "CIVIL_SERVANT",
    label: "ข้าราชการ",
  },
  {
    value: "GOVERNMENT_EMPLOYEE",
    label: "พนักงานราชการ",
  },
  {
    value: "PERMANENT_EMPLOYEE",
    label: "ลูกจ้างประจำ",
  },
  {
    value: "OUTSOURCE",
    label: "จ้างเหมาบริการ",
  },
] as const;

/* =========================================================
   PAGE
========================================================= */

export default async function EditOfficerPage({
  params,
}: Props) {
  const { id } = await params;

  /* =======================================================
     PARAMS
  ======================================================= */

  const officerId = Number(id);

  if (
    !Number.isInteger(officerId) ||
    officerId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     OFFICER
  ======================================================= */

  const officer =
    await prisma.officer.findUnique({
      where: {
        id: officerId,
      },

      include: {
        section: true,
        department: true,
      },
    });

  if (!officer) {
    notFound();
  }

  /* =======================================================
     SAFE VALUES
  ======================================================= */

  const sectionId =
    officer.sectionId;

  const sectionName =
    officer.section?.name ??
    "ไม่ระบุกลุ่มงาน";

  const departmentName =
    officer.department?.name ??
    "ไม่ระบุหน่วยงาน";

  /*
   * คงเส้นทางเดิมของระบบไว้
   * /departments/[sectionId]
   */

  const backPath =
    `/departments/${sectionId}`;

  /* =======================================================
     UPDATE OFFICER
  ======================================================= */

  async function updateOfficer(
    formData: FormData
  ) {
    "use server";

    /* =====================================================
       FORM VALUES
    ===================================================== */

    const firstName =
      String(
        formData.get("firstName") ??
          ""
      ).trim();

    const lastName =
      String(
        formData.get("lastName") ??
          ""
      ).trim();

    const position =
      String(
        formData.get("position") ??
          ""
      ).trim();

    const type =
      String(
        formData.get("type") ??
          ""
      ).trim();

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !firstName ||
      !lastName ||
      !position ||
      !type
    ) {
      return;
    }

    const validOfficerTypes =
      officerTypeOptions.map(
        (item) =>
          item.value
      );

    if (
      !validOfficerTypes.includes(
        type as
          (typeof officerTypeOptions)[number]["value"]
      )
    ) {
      return;
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    await prisma.officer.update({
      where: {
        id: officerId,
      },

      data: {
        firstName,
        lastName,
        position,
        type: type as any,
      },
    });

    /* =====================================================
       REDIRECT
    ===================================================== */

    redirect(
      backPath
    );
  }

  /* =======================================================
     SHARED CLASSES
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
  `;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="✏️"
        title="แก้ไขข้อมูลเจ้าหน้าที่"
        subtitle={`${departmentName} / ${sectionName}`}
        actions={
          <AppButton
            href={
              backPath
            }
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        action={
          updateOfficer
        }
        className="
          w-full
          min-w-0
        "
      >
        <AppCard
          className="
            w-full
            min-w-0
          "
        >
          {/* =================================================
              FORM HEADER
          ================================================= */}

          <div className="mb-6">
            <h2
              className="
                text-lg
                font-extrabold
                !text-slate-900
              "
            >
              ข้อมูลเจ้าหน้าที่
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                leading-relaxed
                !text-slate-500
              "
            >
              แก้ไขข้อมูลเจ้าหน้าที่สำหรับกลุ่มงาน
              {" "}
              {sectionName}
            </p>
          </div>

          {/* =================================================
              FORM GRID
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-4

              lg:grid-cols-2
            "
          >
            {/* ===============================================
                FIRST NAME
            =============================================== */}

            <AppInfoCard>
              <label
                htmlFor="firstName"
                className={
                  labelClassName
                }
              >
                ชื่อ{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                defaultValue={
                  officer.firstName
                }
                placeholder="ระบุชื่อ"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* ===============================================
                LAST NAME
            =============================================== */}

            <AppInfoCard>
              <label
                htmlFor="lastName"
                className={
                  labelClassName
                }
              >
                นามสกุล{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                defaultValue={
                  officer.lastName
                }
                placeholder="ระบุนามสกุล"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* ===============================================
                POSITION
            =============================================== */}

            <div
              className="
                lg:col-span-2
              "
            >
              <AppInfoCard>
                <label
                  htmlFor="position"
                  className={
                    labelClassName
                  }
                >
                  ตำแหน่ง{" "}
                  <span className="!text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="position"
                  name="position"
                  type="text"
                  required
                  defaultValue={
                    officer.position
                  }
                  placeholder="ระบุตำแหน่ง"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>

            {/* ===============================================
                OFFICER TYPE
            =============================================== */}

            <div
              className="
                lg:col-span-2
              "
            >
              <AppInfoCard>
                <label
                  htmlFor="type"
                  className={
                    labelClassName
                  }
                >
                  ประเภทบุคลากร{" "}
                  <span className="!text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="type"
                  name="type"
                  required
                  defaultValue={
                    officer.type
                  }
                  className={
                    inputClassName
                  }
                >
                  {officerTypeOptions.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </AppInfoCard>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            className="
              mt-6

              flex
              flex-col-reverse
              gap-3

              border-t
              border-slate-200

              pt-5

              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >
            {/* ===============================================
                CANCEL
            =============================================== */}

            <AppButton
              href={
                backPath
              }
              variant="secondary"
              size="md"
            >
              ยกเลิก
            </AppButton>

            {/* ===============================================
                SAVE
            =============================================== */}

            <AppButton
              type="submit"
              variant="success"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  💾
                </span>
              }
            >
              บันทึก
            </AppButton>
          </div>
        </AppCard>
      </form>
    </AppPage>
  );
}