import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession, type SessionUser } from "@/lib/session";
import DeletePdfButton from "./DeletePdfButton";

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
    (!session.departmentId ||
      issue.departmentId !== session.departmentId)
  ) {
    redirect("/issue");
  }

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-4
          py-5
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              text-white
              sm:text-4xl
            "
          >
            📤 รายละเอียดใบเบิกพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              text-white
              sm:text-lg
            "
          >
            รายละเอียดรายการเบิกจ่ายพัสดุ
          </p>
        </div>

        <Link
          href="/issue"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
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
          w-full
          min-w-0
          space-y-5
          rounded-2xl
          border
          border-black
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-4
          text-white
          shadow-xl
          sm:p-6
        "
      >
        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
          "
        >
          {/* เลขที่ใบเบิก */}

          <div className="min-w-0">
            <p className="font-extrabold">
              เลขที่ใบเบิก
            </p>

            <p
              className="
                mt-1
                break-all
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

          <div className="min-w-0">
            <p className="font-extrabold">
              หน่วยงาน / กลุ่มงาน
            </p>

            <p
              className="
                mt-1
                break-words
                font-semibold
              "
            >
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
              border-black
              pt-4
            "
          >
            <p className="font-extrabold">
              หมายเหตุ
            </p>

            <p
              className="
                mt-1
                break-words
                font-semibold
              "
            >
              {issue.remark}
            </p>
          </div>
        )}

        {/* =====================================================
            เอกสาร PDF ที่แนบ
            ไม่มี PDF Preview ในหน้านี้
        ===================================================== */}

        {issue.pdf && (
          <div
            className="
              flex
              flex-col
              items-stretch
              gap-3
              border-t
              border-black
              pt-5
              sm:flex-row
              sm:flex-wrap
              sm:items-center
            "
          >
            <span className="font-extrabold">
              เอกสารแนบ :
            </span>

            <a
              href={issue.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-block
                rounded-lg
                bg-blue-600
                px-4
                py-2
                text-center
                font-bold
                text-white
                transition
                hover:bg-blue-700
              "
            >
              เปิดไฟล์ PDF
            </a>

            <DeletePdfButton id={issue.id} />
          </div>
        )}
      </div>

      {/* =====================================================
          ตารางรายการใบเบิก
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-black
          bg-white
          shadow-xl
        "
      >
        <div className="w-full overflow-x-auto">
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
                    border-black
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  ลำดับ
                </th>

                <th
                  className="
                    w-[20%]
                    border
                    border-black
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  หมวดหมู่
                </th>

                <th
                  className="
                    w-[36%]
                    border
                    border-black
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  รายการพัสดุ
                </th>

                <th
                  className="
                    w-[12%]
                    border
                    border-black
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  จำนวนที่ขอเบิก
                </th>

                <th
                  className="
                    w-[12%]
                    border
                    border-black
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  จำนวนที่เบิกจ่าย
                </th>

                <th
                  className="
                    w-[12%]
                    border
                    border-black
                    px-3
                    py-4
                    text-center
                    text-lg
                    font-extrabold
                    text-white
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
                    {/* ลำดับ */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    {/* หมวดหมู่ */}

                    <td
                      className="
                        border
                        border-black
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

                    {/* รายการพัสดุ */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        font-semibold
                        whitespace-nowrap
                      "
                    >
                      <div className="whitespace-nowrap">
                        {item.material.name}
                      </div>

                      <div
                        className="
                          mt-1
                          whitespace-nowrap
                          text-xs
                          text-slate-500
                        "
                      >
                        รหัสพัสดุ:{" "}
                        {item.material.code}
                      </div>
                    </td>

                    {/* จำนวนที่ขอเบิก */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {item.qty}
                    </td>

                    {/* จำนวนที่เบิกจ่าย */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                        text-slate-400
                      "
                    >
                      -
                    </td>

                    {/* หมายเหตุ */}

                    <td
                      className="
                        border
                        border-black
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