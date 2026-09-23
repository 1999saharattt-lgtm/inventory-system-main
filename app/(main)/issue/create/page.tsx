import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import IssueForm from "./IssueForm";

/* =========================================================
   THAI YEAR
========================================================= */

function getThaiYear() {
  return String(
    new Date().getFullYear() + 543
  ).slice(-2);
}

/* =========================================================
   GENERATE ISSUE DOCUMENT NUMBER
========================================================= */

async function generateIssueNo() {
  const year = getThaiYear();

  const issues =
    await prisma.issue.findMany({
      where: {
        documentNo: {
          startsWith: "จ.",
        },
      },

      select: {
        documentNo: true,
      },
    });

  let running = 1;

  for (const issue of issues) {
    const match =
      issue.documentNo.match(
        /^จ\.(\d+)\/(\d+)$/
      );

    if (!match) {
      continue;
    }

    const lastNumber = Number(
      match[1]
    );

    const lastYear =
      match[2];

    if (
      lastYear === year &&
      lastNumber >= running
    ) {
      running =
        lastNumber + 1;
    }
  }

  return `จ.${String(
    running
  ).padStart(2, "0")}/${year}`;
}

/* =========================================================
   PAGE
========================================================= */

export default async function CreateIssuePage() {
  /* =======================================================
     SESSION
  ======================================================= */

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "session"
    )?.value;

  let session:
    | SessionUser
    | null = null;

  if (token) {
    try {
      session =
        await verifySession(
          token
        );
    } catch {
      session = null;
    }
  }

  /* =======================================================
     USER DEPARTMENT
  ======================================================= */

  let userDepartmentId =
    session?.departmentId ?? null;

  /*
   * ผู้ใช้งานทั่วไป
   * ต้องใช้กลุ่มงานของตนเอง
   *
   * ถ้าใน Session ไม่มี departmentId
   * ให้ตรวจจาก User ในฐานข้อมูลอีกครั้ง
   */

  if (
    session &&
    session.role !== "ADMIN" &&
    !userDepartmentId
  ) {
    const currentUser =
      await prisma.user.findUnique({
        where: {
          id: session.id,
        },

        select: {
          departmentId: true,
        },
      });

    userDepartmentId =
      currentUser?.departmentId ??
      null;
  }

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const [
    materials,
    receiveLots,
    departments,
    officers,
    documentNo,
  ] = await Promise.all([
    /* =====================================================
       MATERIALS
    ===================================================== */

    prisma.material.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          code: "asc",
        },
      ],
    }),

    /* =====================================================
       RECEIVE LOTS

       โหลดเฉพาะล็อตที่ยังมีจำนวนคงเหลือ
    ===================================================== */

    prisma.receiveItem.findMany({
      where: {
        balance: {
          gt: 0,
        },
      },

      select: {
        id: true,
        materialId: true,
        balance: true,
        manufacture: true,
        expiry: true,
      },

      orderBy: [
        {
          expiry: "asc",
        },
        {
          manufacture: "asc",
        },
        {
          id: "asc",
        },
      ],
    }),

    /* =====================================================
       DEPARTMENTS

       ADMIN
       - เห็นทุกกลุ่มงาน
       - เปลี่ยนกลุ่มงานได้

       USER
       - เห็นเฉพาะกลุ่มงานตัวเอง
       - เปลี่ยนกลุ่มงานไม่ได้
    ===================================================== */

    prisma.department.findMany({
      where:
        session?.role === "ADMIN"
          ? undefined
          : userDepartmentId
            ? {
                id: userDepartmentId,
              }
            : {
                id: -1,
              },

      orderBy: {
        name: "asc",
      },
    }),

    /* =====================================================
       OFFICERS

       ADMIN
       - โหลดทั้งหมด

       USER
       - โหลดเฉพาะบุคลากร
         ภายในกลุ่มงานของตนเอง
    ===================================================== */

    prisma.officer.findMany({
      where:
        session?.role === "ADMIN"
          ? undefined
          : userDepartmentId
            ? {
                OR: [
                  {
                    departmentId:
                      userDepartmentId,
                  },
                  {
                    section: {
                      departmentId:
                        userDepartmentId,
                    },
                  },
                ],
              }
            : {
                id: -1,
              },

      include: {
        section: true,
        department: true,
      },

      orderBy: [
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ],
    }),

    /* =====================================================
       DOCUMENT NUMBER
    ===================================================== */

    generateIssueNo(),
  ]);

  /* =========================================================
     INITIAL DEPARTMENT
  ========================================================= */

  const initialDepartmentId =
    session?.role === "ADMIN"
      ? ""
      : userDepartmentId
        ? String(
            userDepartmentId
          )
        : "";

  /* =========================================================
     PERMISSION

     ADMIN
     - เปลี่ยนกลุ่มงานได้

     USER
     - ใช้กลุ่มงานตัวเองเท่านั้น
  ========================================================= */

  const canChangeDepartment =
    session?.role === "ADMIN";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER

          ใช้ Component กลาง
          รูปแบบเดียวกับ receive/create/page.tsx
      ===================================================== */}

      <AppPageHeader
        icon="📤"
        title="บันทึกการเบิกจ่ายพัสดุ"
        subtitle="เพิ่มรายการเบิกจ่ายพัสดุออกจากระบบ"
        actions={
          <AppButton
            href="/issue"
            variant="back"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          ISSUE FORM CARD

          ใช้ AppCard กลางของระบบ
          รูปแบบเดียวกับ receive/create
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            ISSUE FORM
        =================================================== */}

        <div
          className="
            relative
            z-10

            w-full
            min-w-0

            overflow-visible
          "
        >
          <IssueForm
            departments={
              departments
            }
            officers={
              officers
            }
            materials={
              materials
            }
            receiveLots={
              receiveLots
            }
            documentNo={
              documentNo
            }
            initialDepartmentId={
              initialDepartmentId
            }
            canChangeDepartment={
              canChangeDepartment
            }
          />
        </div>
      </AppCard>
    </AppPage>
  );
}