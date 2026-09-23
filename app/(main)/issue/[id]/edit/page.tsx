import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

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

  /* =======================================================
     ISSUE PERMISSION

     ADMIN
     - แก้ไขใบเบิกได้ทั้งหมด

     USER
     - แก้ไขเฉพาะใบเบิกของกลุ่มงานตัวเอง

     ไม่มี departmentId
     - ไม่อนุญาต
  ======================================================= */

  const issueWhere =
    session?.role === "ADMIN"
      ? {
          id: issueId,
        }
      : session?.departmentId
        ? {
            id: issueId,
            departmentId:
              session.departmentId,
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
        items: {
          include: {
            material: true,
          },
        },
      },
    });

  if (!issue) {
    notFound();
  }

  /* =======================================================
     DEPARTMENTS

     ADMIN
     - ทุกกลุ่มงาน
     - สามารถเปลี่ยนกลุ่มงานได้

     USER
     - เฉพาะกลุ่มงานตัวเอง
     - ไม่สามารถเปลี่ยนกลุ่มงานได้
  ======================================================= */

  const departments =
    await prisma.department.findMany({
      where:
        session?.role === "ADMIN"
          ? undefined
          : session?.departmentId
            ? {
                id: session.departmentId,
              }
            : {
                id: -1,
              },

      orderBy: {
        name: "asc",
      },
    });

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
     RECEIVE ITEMS

     ใช้ balance เดิม
     ไม่แก้ stock / FEFO logic
  ======================================================= */

  const receiveItems =
    await prisma.receiveItem.findMany({
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
    });

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
      {/* =====================================================
          HEADER

          รูปแบบเดียวกับ /issue/create
      ===================================================== */}

      <AppPageHeader
        icon="🖊️"
        title="แก้ไขรายการเบิกพัสดุ"
        subtitle="แก้ไขรายละเอียดเอกสารและรายการพัสดุ"
        actions={
          <AppButton
            href={`/issue/${issue.id}`}
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
          EDIT ISSUE FORM CARD

          ใช้โครงสร้างเดียวกับ
          /issue/create
          /receive/create
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
            EDIT ISSUE FORM
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
            canChangeDepartment={
              canChangeDepartment
            }
          />
        </div>
      </AppCard>
    </AppPage>
  );
}