import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import IssueForm from "./IssueForm";

function getThaiYear() {
  return (new Date().getFullYear() + 543)
    .toString()
    .slice(-2);
}

async function generateIssueNo() {
  const year = getThaiYear();

  const issues = await prisma.issue.findMany({
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
    const match = issue.documentNo.match(
      /^จ\.(\d+)\/(\d+)$/
    );

    if (!match) {
      continue;
    }

    const number = Number(match[1]);
    const documentYear = match[2];

    if (documentYear === year) {
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  }

  const running = maxNumber + 1;

  return `จ.${running
    .toString()
    .padStart(2, "0")}/${year}`;
}

export default async function CreateIssuePage() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

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

  let userDepartmentId =
    session?.departmentId ?? null;

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
        currentUser?.departmentId ?? null;
    }
  }

  const departments =
    await prisma.department.findMany({
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
    });

  const officers =
    await prisma.officer.findMany({
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
    });

  const documentNo =
    await generateIssueNo();

  const initialDepartmentId =
    session?.role === "ADMIN"
      ? ""
      : userDepartmentId
        ? String(userDepartmentId)
        : "";

  return (
    <div className="space-y-6">
      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-cyan-700
          p-6
          shadow-xl
        "
      >
        <div>
          <h1
            className="
              text-5xl
              font-extrabold
              tracking-wide
              !text-white
            "
          >
            📤 บันทึกการเบิกจ่ายพัสดุ
          </h1>

          <p
            className="
              mt-3
              text-xl
              font-semibold
              !text-slate-200
            "
          >
            เพิ่มรายการเบิกจ่ายพัสดุออกจากระบบ
          </p>
        </div>

        <Link
          href="/issue"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
          "
        >
          ← กลับ
        </Link>
      </div>

      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-6
          shadow-xl
        "
      >
        <IssueForm
          departments={departments}
          officers={officers}
          materials={materials}
          receiveLots={receiveLots}
          documentNo={documentNo}
          initialDepartmentId={
            initialDepartmentId
          }
        />
      </div>
    </div>
  );
}