import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

import IssueForm from "./IssueForm";

/* =========================================================
   DOCUMENT NUMBER
========================================================= */

function getThaiYear() {
  return String(
    new Date().getFullYear() + 543
  ).slice(-2);
}

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

  let maxNumber = 0;

  for (const issue of issues) {
    const match =
      issue.documentNo.match(
        /^จ\.(\d+)\/(\d+)$/
      );

    if (!match) {
      continue;
    }

    const number = Number(
      match[1]
    );

    const documentYear =
      match[2];

    if (
      documentYear === year &&
      number > maxNumber
    ) {
      maxNumber = number;
    }
  }

  const running =
    maxNumber + 1;

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
     MATERIALS
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          code: "asc",
        },
      ],
    });

  /* =======================================================
     RECEIVE LOTS
  ======================================================= */

  const receiveLots =
    await prisma.receiveItem.findMany({
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
    });

  /* =======================================================
     USER DEPARTMENT
  ======================================================= */

  let userDepartmentId =
    session?.departmentId ??
    null;

  if (
    session &&
    session.role !== "ADMIN"
  ) {
    if (!userDepartmentId) {
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
  }

  /* =======================================================
     DEPARTMENTS

     ADMIN
     - เลือกกลุ่มงานได้

     USER
     - เห็นเฉพาะกลุ่มงานตัวเอง
     - IssueForm จะล็อกไม่ให้เปลี่ยน
  ======================================================= */

  const departments =
    await prisma.department.findMany({
      where:
        session?.role ===
        "ADMIN"
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
    });

  /* =======================================================
     OFFICERS
  ======================================================= */

  const officers =
    await prisma.officer.findMany({
      where:
        session?.role ===
        "ADMIN"
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
    });

  /* =======================================================
     DOCUMENT NUMBER
  ======================================================= */

  const documentNo =
    await generateIssueNo();

  /* =======================================================
     INITIAL DEPARTMENT
  ======================================================= */

  const initialDepartmentId =
    session?.role === "ADMIN"
      ? ""
      : userDepartmentId
        ? String(
            userDepartmentId
          )
        : "";

  /* =======================================================
     PERMISSION
  ======================================================= */

  const canChangeDepartment =
    session?.role === "ADMIN";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* ===================================================
          HEADER
      =================================================== */}

      <AppPageHeader
        icon="📤"
        title="บันทึกการเบิกจ่ายพัสดุ"
        subtitle="เพิ่มรายการเบิกจ่ายพัสดุออกจากระบบ"
        actions={
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-end
              gap-3
            "
          >
            {/* =============================================
                PDF

                ใช้ danger จาก AppButton กลาง
                ไม่สร้าง variant pdf เพิ่มเอง
            ============================================= */}

            <AppButton
              href="/issue/create/pdf"
              variant="danger"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  📄
                </span>
              }
            >
              ส่งออก PDF
            </AppButton>

            {/* =============================================
                BACK
            ============================================= */}

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
          </div>
        }
      />

      {/* ===================================================
          FORM CARD

          ใช้ AppTableCard กลาง
          ไม่สร้างพื้นหลัง Card เอง
      =================================================== */}

      <AppTableCard
        title="ใบเบิกพัสดุ"
        subtitle="แบบ พอ.101"
        className="
          w-full
          min-w-0
        "
      >
        <IssueForm
          departments={
            departments
          }
          officers={officers}
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
      </AppTableCard>
    </AppPage>
  );
}