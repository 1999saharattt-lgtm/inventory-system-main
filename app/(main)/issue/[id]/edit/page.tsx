import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import EditIssueForm from "./EditIssueForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditIssuePage({
  params,
}: Props) {
  const { id } = await params;

  const issueId = Number(id);

  if (
    !Number.isInteger(issueId) ||
    issueId <= 0
  ) {
    notFound();
  }

  const cookieStore = await cookies();
  const token =
    cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session =
        await verifySession(token);
    } catch {
      session = null;
    }
  }

  if (!session) {
    redirect("/login");
  }

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
      currentUser?.departmentId ?? null;
  }

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
            receiveItem: true,
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

  if (
    issue.status === "APPROVED" &&
    session.role !== "ADMIN"
  ) {
    redirect(`/issue/${issue.id}`);
  }

  const currentReceiveItemIds =
    issue.items
      .map(
        (item) =>
          item.receiveItemId
      )
      .filter(
        (
          value
        ): value is number =>
          typeof value === "number" &&
          Number.isInteger(value) &&
          value > 0
      );

  const [
    departments,
    materials,
    receiveItems,
    officers,
  ] = await Promise.all([
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

    prisma.receiveItem.findMany({
      where:
        currentReceiveItemIds.length >
        0
          ? {
              OR: [
                {
                  balance: {
                    gt: 0,
                  },
                },
                {
                  id: {
                    in:
                      currentReceiveItemIds,
                  },
                },
              ],
            }
          : {
              balance: {
                gt: 0,
              },
            },
      include: {
        material: true,
        receive: {
          select: {
            id: true,
            documentNo: true,
            receiveDate: true,
          },
        },
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

  const canChangeDepartment =
    session.role === "ADMIN";

  const isApproved =
    issue.status === "APPROVED";

  return (
    <AppPage>
      <AppPageHeader
        icon="🖊️"
        title={
          isApproved
            ? "แก้ไขใบเบิกที่บันทึกเบิกจ่ายแล้ว"
            : "แก้ไขรายการเบิกพัสดุ"
        }
        subtitle={
          isApproved
            ? "แก้ไขรายการที่เบิกผิด โดยระบบจะต้องคืนสต็อกเดิมและตัดสต็อกใหม่"
            : "แก้ไขรายละเอียดเอกสารและรายการพัสดุ"
        }
        actions={
          <AppButton
            href="/issue"
            variant="back"
            size="md"
            icon={
              <span aria-hidden="true">
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

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
        {isApproved && (
          <div
            className="
              mb-4
              rounded-[18px]
              border
              border-amber-200
              bg-amber-50/80
              px-4
              py-3
              text-sm
              font-bold
              leading-relaxed
              !text-amber-900
              shadow-sm
            "
          >
            ⚠️ ใบเบิกนี้ผ่านการเบิกจ่ายและตัดสต็อกแล้ว
            การบันทึกการแก้ไขต้องคืนยอดเดิมกลับเข้าสต็อกก่อน
            แล้วจึงตัดสต็อกใหม่ตามรายการที่แก้ไข
          </div>
        )}

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
