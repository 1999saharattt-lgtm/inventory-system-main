import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

export const dynamic = "force-dynamic";

/* =========================================================
   CREATE USER
========================================================= */

async function createUser(
  formData: FormData
) {
  "use server";

  /* =======================================================
     PERMISSION
  ======================================================= */

  await requireRole("ADMIN");

  /* =======================================================
     FORM DATA
  ======================================================= */

  const username =
    String(
      formData.get("username") ??
        ""
    ).trim();

  const fullname =
    String(
      formData.get("fullname") ??
        ""
    ).trim();

  const password =
    String(
      formData.get("password") ??
        ""
    );

  const roleValue =
    String(
      formData.get("role") ??
        "STAFF"
    );

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (
    !username ||
    !fullname ||
    !password
  ) {
    return;
  }

  const validRoles = [
    "ADMIN",
    "STAFF",
    "VIEWER",
  ] as const;

  type UserRole =
    (typeof validRoles)[number];

  if (
    !validRoles.includes(
      roleValue as UserRole
    )
  ) {
    return;
  }

  const role =
    roleValue as UserRole;

  /* =======================================================
     PASSWORD
  ======================================================= */

  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );

  /* =======================================================
     CREATE
  ======================================================= */

  await prisma.user.create({
    data: {
      username,
      fullname,
      password:
        hashedPassword,
      role,
    },
  });

  /* =======================================================
     REDIRECT
  ======================================================= */

  redirect("/users");
}

/* =========================================================
   PAGE
========================================================= */

export default async function CreateUserPage() {
  /* =======================================================
     PERMISSION
  ======================================================= */

  await requireRole("ADMIN");

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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="👤"
        title="เพิ่มผู้ใช้งานระบบ"
        subtitle="สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์การเข้าใช้งานระบบ"
        actions={
          <AppButton
            href="/users"
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
        action={createUser}
        className="
          w-full
          min-w-0
        "
      >
        <AppCard
          className="
            mx-auto
            w-full
            max-w-4xl
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

                sm:text-xl
              "
            >
              ข้อมูลผู้ใช้งาน
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
              กรอกข้อมูลบัญชีผู้ใช้งานและกำหนดสิทธิ์สำหรับเข้าใช้งานระบบ
            </p>
          </div>

          {/* =================================================
              FIELDS
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-4
            "
          >
            {/* ===============================================
                USERNAME
            =============================================== */}

            <AppInfoCard>
              <label
                htmlFor="username"
                className={
                  labelClassName
                }
              >
                Username{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="username"
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="ระบุ Username"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* ===============================================
                FULLNAME
            =============================================== */}

            <AppInfoCard>
              <label
                htmlFor="fullname"
                className={
                  labelClassName
                }
              >
                ชื่อ-นามสกุล{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="fullname"
                type="text"
                name="fullname"
                required
                autoComplete="name"
                placeholder="ระบุชื่อ-นามสกุล"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* ===============================================
                PASSWORD
            =============================================== */}

            <AppInfoCard>
              <label
                htmlFor="password"
                className={
                  labelClassName
                }
              >
                Password{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="new-password"
                placeholder="ระบุ Password"
                className={
                  inputClassName
                }
              />

              <p
                className="
                  mt-2

                  text-xs
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                "
              >
                กำหนดรหัสผ่านสำหรับใช้เข้าสู่ระบบ
              </p>
            </AppInfoCard>

            {/* ===============================================
                ROLE
            =============================================== */}

            <AppInfoCard>
              <label
                htmlFor="role"
                className={
                  labelClassName
                }
              >
                สิทธิ์การใช้งาน{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <select
                id="role"
                name="role"
                required
                defaultValue="STAFF"
                className={
                  inputClassName
                }
              >
                <option value="STAFF">
                  STAFF
                </option>

                <option value="ADMIN">
                  ADMIN
                </option>

                <option value="VIEWER">
                  VIEWER
                </option>
              </select>

              <p
                className="
                  mt-2

                  text-xs
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                "
              >
                กำหนดระดับสิทธิ์ของผู้ใช้งานในการเข้าถึงระบบ
              </p>
            </AppInfoCard>
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
              href="/users"
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