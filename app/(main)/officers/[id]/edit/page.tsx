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
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

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
     ROUTE DATA
  ======================================================= */

  const sectionId =
    officer.sectionId;

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

    const firstName =
      String(
        formData.get(
          "firstName"
        ) ?? ""
      ).trim();

    const lastName =
      String(
        formData.get(
          "lastName"
        ) ?? ""
      ).trim();

    const position =
      String(
        formData.get(
          "position"
        ) ?? ""
      ).trim();

    const type =
      String(
        formData.get(
          "type"
        ) ?? ""
      );

    /* =====================================================
       VALIDATE
    ===================================================== */

    if (
      !firstName ||
      !lastName ||
      !position
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

    redirect(backPath);
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
    min-w-0

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
        subtitle="ปรับปรุงข้อมูลรายชื่อและประเภทบุคลากร"
        actions={
          <AppButton
            href={backPath}
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
        action={updateOfficer}
        className="
          w-full
          min-w-0
        "
      >
        <AppCard
          className="
            mx-auto
            w-full
            max-w-5xl
          "
        >
          {/* =================================================
              FORM HEADER
          ================================================= */}

          <div
            className="
              mb-6

              border-b
              border-slate-200

              pb-5
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-slate-900

                sm:text-xl
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
              แก้ไขข้อมูลเจ้าหน้าที่ให้ถูกต้องและเป็นปัจจุบัน
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

              md:grid-cols-2
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
                defaultValue={
                  officer.firstName
                }
                placeholder="ระบุชื่อ"
                autoComplete="given-name"
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
                defaultValue={
                  officer.lastName
                }
                placeholder="ระบุนามสกุล"
                autoComplete="family-name"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* ===============================================
                POSITION
            =============================================== */}

            <AppInfoCard
              className="
                md:col-span-2
              "
            >
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

            {/* ===============================================
                OFFICER TYPE
            =============================================== */}

            <AppInfoCard
              className="
                md:col-span-2
              "
            >
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

          {/* =================================================
              ACTION BUTTONS
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
              href={backPath}
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
                <span aria-hidden="true">
                  💾
                </span>
              }
            >
              บันทึกการแก้ไข
            </AppButton>
          </div>
        </AppCard>
      </form>
    </AppPage>
  );
}