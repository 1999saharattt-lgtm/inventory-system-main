import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import EditIssueForm from "./EditIssueForm";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function EditIssuePage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

  const issueId = Number(id);

  if (
    !Number.isInteger(issueId) ||
    issueId <= 0
  ) {
    notFound();
  }

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

  if (!session) {
    redirect("/login");
  }

  /* =======================================================
     USER DEPARTMENT
  ======================================================= */

  let userDepartmentId =
    session.departmentId ?? null;

  if (
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
     ISSUE PERMISSION
  ======================================================= */

  const issueWhere =
    session.role === "ADMIN"
      ? {
          id: issueId,
        }
      : userDepartmentId
        ? {
            id: issueId,
            departmentId:
              userDepartmentId,
          }
        : {
            id: issueId,
            departmentId: -1,
          };

  /* =======================================================
     LOAD ISSUE
  ======================================================= */

  const issue =
    await prisma.issue.findFirst({
      where: issueWhere,

      include: {
        officer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,

            department: {
              select: {
                id: true,
              },
            },

            section: {
              select: {
                departmentId: true,
              },
            },
          },
        },

        items: {
          include: {
            material: true,
          },

          orderBy: {
            id: "asc",
          },
        },
      },
    });

  if (!issue) {
    notFound();
  }

  /* =======================================================
     LOAD FORM DATA
  ======================================================= */

  const [
    departments,
    materials,
    receiveItems,
    officers,
  ] = await Promise.all([
    /* =====================================================
       DEPARTMENTS
    ===================================================== */

    prisma.department.findMany({
      where:
        session.role === "ADMIN"
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
       RECEIVE ITEMS
    ===================================================== */

    prisma.receiveItem.findMany({
      where: {
        balance: {
          gt: 0,
        },
      },

      include: {
        material: true,
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
       OFFICERS

       ADMIN
       - โหลดทั้งหมด

       USER
       - โหลดเฉพาะบุคลากรในกลุ่มงานตนเอง
    ===================================================== */

    prisma.officer.findMany({
      where:
        session.role === "ADMIN"
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
        department: true,
        section: true,
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
  ]);

  /* =======================================================
     PERMISSION

     กลุ่มงาน:
     ADMIN เท่านั้นที่เปลี่ยนได้
  ======================================================= */

  const canChangeDepartment =
    session.role === "ADMIN";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ให้เหมือน /issue/create
      ===================================================== */}

      <AppPageHeader
        icon="🖊️"
        title="แก้ไขรายการเบิกพัสดุ"
        subtitle="แก้ไขรายละเอียดเอกสารและรายการพัสดุ"
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
          MAIN CARD
          รูปแบบเดียวกับ /issue/create
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
        <div
          className="
            relative
            z-10

            w-full
            min-w-0

            overflow-visible
          "
        >
          <EditIssueForm
            issue={issue}
            departments={
              departments
            }
            materials={
              materials
            }
            receiveItems={
              receiveItems
            }
            officers={
              officers
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