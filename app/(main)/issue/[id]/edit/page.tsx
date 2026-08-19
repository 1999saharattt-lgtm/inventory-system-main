import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifySession, type SessionUser } from "@/lib/session";
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

  // =====================================================
  // Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

  // =====================================================
  // ตรวจสอบสิทธิ์ของใบเบิก
  //
  // ADMIN:
  //   แก้ไขใบเบิกได้ทั้งหมด
  //
  // ผู้ใช้งานทั่วไป:
  //   แก้ไขได้เฉพาะใบเบิกของ department ตัวเอง
  //
  // ไม่มี departmentId:
  //   ไม่อนุญาตให้เข้าถึงใบเบิก
  // =====================================================

  const issueWhere =
    session?.role === "ADMIN"
      ? {
          id: Number(id),
        }
      : session?.departmentId
        ? {
            id: Number(id),
            departmentId: session.departmentId,
          }
        : {
            id: Number(id),
            departmentId: -1,
          };

  // =====================================================
  // ดึงข้อมูลใบเบิก
  //
  // สำคัญ:
  // ตรวจ department ตั้งแต่ query
  // ไม่ใช่ดึงข้อมูลทั้งหมดแล้วค่อยซ่อนหน้า
  // =====================================================

  const issue = await prisma.issue.findFirst({
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

  // =====================================================
  // Departments
  //
  // ADMIN:
  //   เห็นทุกหน่วยงาน
  //
  // ผู้ใช้งานทั่วไป:
  //   เห็นเฉพาะหน่วยงานตัวเอง
  // =====================================================

  const departments = await prisma.department.findMany({
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

  // =====================================================
  // Materials
  //
  // ไม่เปลี่ยน logic เดิม
  // =====================================================

  const materials = await prisma.material.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        code: "asc",
      },
    ],
  });

  // =====================================================
  // ล็อตที่ยังมีจำนวนคงเหลือจริง
  //
  // ใช้ balance เหมือนเดิม
  // ไม่แตะ FEFO / stock logic
  // =====================================================

  const receiveItems = await prisma.receiveItem.findMany({
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
    ],
  });

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
          to-slate-700
          p-6
          shadow-xl
        "
      >
        <div>
          <div
            className="
              text-lg
              font-extrabold
              !text-white
            "
          >
            🖊️ แก้ไขรายการเบิกพัสดุ
          </div>

          <div
            className="
              mt-2
              font-bold
              text-white
            "
          >
            แก้ไขรายละเอียดเอกสารและรายการพัสดุ
          </div>
        </div>

        <Link
          href="/issue"
          className="
            rounded-xl
            bg-emerald-500
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
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
          to-slate-800
          p-6
          shadow-xl
        "
      >
        <EditIssueForm
          issue={issue}
          departments={departments}
          materials={materials}
          receiveItems={receiveItems}
        />
      </div>
    </div>
  );
}