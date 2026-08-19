import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession, type SessionUser } from "@/lib/session";
import DeletePdfButton from "./DeletePdfButton";
import IssuePdf from "./IssuePdf";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type IssueItem = {
  id: number;
  qty: number;

  material: {
    code: string;
    name: string;
    unit: string;
    category: string;
    latestPrice: {
      toString(): string;
    };
  };
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

export default async function IssueDetailPage({
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
  // ถ้าไม่มี Session ให้กลับหน้า Login
  // =====================================================

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // ดึงข้อมูลใบเบิก
  // =====================================================

  const issue = await prisma.issue.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      department: true,

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
  // สิทธิ์การเข้าดู
  //
  // ADMIN:
  //   ดูได้ทุกกลุ่มงาน
  //
  // ผู้ใช้งานทั่วไป:
  //   ดูได้เฉพาะรายการของ department ตัวเอง
  //
  // ไม่มี departmentId:
  //   ห้ามเข้าดูรายการ
  // =====================================================

  if (
    session.role !== "ADMIN" &&
    (
      !session.departmentId ||
      issue.departmentId !== session.departmentId
    )
  ) {
    redirect("/issue");
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          Header
      ===================================================== */}

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
          <h1
            className="
              text-4xl
              font-extrabold
              text-white
            "
          >
            📤 รายละเอียดใบเบิกพัสดุ
          </h1>

          <p
            className="
              mt-2
              text-lg
              font-semibold
              text-slate-200
            "
          >
            รายละเอียดรายการเบิกจ่ายพัสดุ
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
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลใบเบิก
      ===================================================== */}

      <div
        className="
          space-y-5
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-6
          text-white
          shadow-xl
        "
      >
        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >
          {/* เลขที่ใบเบิก */}

          <div>
            <p className="font-extrabold">
              เลขที่ใบเบิก
            </p>

            <p
              className="
                mt-1
                text-lg
                font-semibold
                text-cyan-300
              "
            >
              {issue.documentNo}
            </p>
          </div>

          {/* วันที่เบิก */}

          <div>
            <p className="font-extrabold">
              วันที่เบิก
            </p>

            <p className="mt-1 font-semibold">
              {new Date(
                issue.issueDate
              ).toLocaleDateString("th-TH")}
            </p>
          </div>

          {/* หน่วยงาน */}

          <div>
            <p className="font-extrabold">
              หน่วยงาน / กลุ่มงาน
            </p>

            <p className="mt-1 font-semibold">
              {issue.department.name}
            </p>
          </div>

          {/* จำนวนรายการ */}

          <div>
            <p className="font-extrabold">
              จำนวนรายการ
            </p>

            <p className="mt-1 font-semibold">
              {issue.items.length} รายการ
            </p>
          </div>
        </div>

        {/* หมายเหตุ */}

        {issue.remark && (
          <div
            className="
              border-t
              border-slate-600
              pt-4
            "
          >
            <p className="font-extrabold">
              หมายเหตุ
            </p>

            <p className="mt-1 font-semibold">
              {issue.remark}
            </p>
          </div>
        )}

        {/* =====================================================
            PDF
        ===================================================== */}

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
            border-t
            border-slate-600
            pt-5
          "
        >
          <IssuePdf
            issueId={issue.id}
            documentNo={issue.documentNo}
            issueDate={issue.issueDate}
            departmentName={issue.department.name}
            items={issue.items as IssueItem[]}
          />

          {issue.pdf && (
            <>
              <span className="font-extrabold">
                เอกสารแนบ :
              </span>

              <a
                href={issue.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2
                  font-bold
                  text-white
                  transition
                  hover:bg-blue-700
                "
              >
                เปิดไฟล์ PDF
              </a>

              <DeletePdfButton
                id={issue.id}
              />
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          ตารางรายการใบเบิก
      ===================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              min-w-[1000px]
              border-collapse
              text-sm
            "
          >
            <thead>
              <tr
                className="
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  text-white
                "
              >
                <th
                  className="
                    w-[8%]
                    border
                    border-slate-600
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    w-[20%]
                    border
                    border-slate-600
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                  "
                >
                  หมวดหมู่
                </th>

                <th
                  className="
                    w-[36%]
                    border
                    border-slate-600
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                  "
                >
                  รายการพัสดุ
                </th>

                <th
                  className="
                    w-[12%]
                    border
                    border-slate-600
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                  "
                >
                  จำนวนที่ขอเบิก
                </th>

                <th
                  className="
                    w-[12%]
                    border
                    border-slate-600
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                  "
                >
                  จำนวนที่เบิกจ่าย
                </th>

                <th
                  className="
                    w-[12%]
                    border
                    border-slate-600
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                  "
                >
                  หมายเหตุ
                </th>
              </tr>
            </thead>

            <tbody>
              {issue.items.map(
                (
                  item: IssueItem,
                  index: number
                ) => (
                  <tr
                    key={item.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    <td
                      className="
                        border
                        border-slate-300
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-slate-300
                        px-3
                        py-4
                        font-semibold
                      "
                    >
                      {categoryName[
                        item.material.category
                      ] ??
                        item.material.category}
                    </td>

                    <td
                      className="
                        border
                        border-slate-300
                        px-3
                        py-4
                        font-semibold
                      "
                    >
                      <div>
                        {item.material.name}
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs
                          text-slate-500
                        "
                      >
                        รหัสพัสดุ:{" "}
                        {item.material.code}
                      </div>
                    </td>

                    <td
                      className="
                        border
                        border-slate-300
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        border
                        border-slate-300
                        px-3
                        py-4
                        text-center
                        font-bold
                        text-emerald-700
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        border
                        border-slate-300
                        px-3
                        py-4
                        text-center
                      "
                    >
                      -
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}