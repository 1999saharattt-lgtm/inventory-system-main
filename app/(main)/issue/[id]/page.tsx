import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
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

export default async function IssueDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const issue =
    await prisma.issue.findUnique({
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

  const categoryName: Record<string, string> = {
    OFFICE: "วัสดุสำนักงาน",
    COMPUTER: "วัสดุคอมพิวเตอร์",
    ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
    HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
    VEHICLE: "วัสดุยานพาหนะ",
    PRINTING: "วัสดุสื่อสิ่งพิมพ์",
  };

  return (
    <div className="space-y-6">

      {/* Header */}

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

      {/* ข้อมูลใบเบิก */}

      <div
        className="
          space-y-4
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
        <p>
          <span className="font-extrabold">
            เลขที่ใบเบิก :
          </span>{" "}
          {issue.documentNo}
        </p>

        <p>
          <span className="font-extrabold">
            วันที่เบิก :
          </span>{" "}
          {new Date(
            issue.issueDate
          ).toLocaleDateString("th-TH")}
        </p>

        <p>
          <span className="font-extrabold">
            หน่วยงาน :
          </span>{" "}
          {issue.department.name}
        </p>

        <p>
          <span className="font-extrabold">
            หมายเหตุ :
          </span>{" "}
          {issue.remark || "-"}
        </p>

        {/* ปุ่ม PDF */}

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
          "
        >
          <IssuePdf
            documentNo={issue.documentNo}
            issueDate={issue.issueDate}
            departmentName={issue.department.name}
            items={issue.items}
          />

          {issue.pdf && (
            <>
              <span className="font-extrabold">
                เอกสารแนบ :
              </span>

              <a
                href={issue.pdf}
                target="_blank"
                className="
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2
                  font-bold
                  text-white
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

      {/* ตารางรายการ */}

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
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "หน่วย",
                  "จำนวน",
                  "ราคาต่อหน่วย",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      border
                      border-slate-600
                      px-3
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    {title}
                  </th>
                ))}
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
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        px-3
                        py-3
                      "
                    >
                      {
                        categoryName[
                          item.material.category
                        ]
                      }
                    </td>

                    <td
                      className="
                        border
                        px-3
                        py-3
                        font-semibold
                      "
                    >
                      {item.material.code}
                      {" - "}
                      {item.material.name}
                    </td>

                    <td
                      className="
                        border
                        px-3
                        py-3
                        text-center
                      "
                    >
                      {item.material.unit}
                    </td>

                    <td
                      className="
                        border
                        px-3
                        py-3
                        text-center
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        border
                        px-3
                        py-3
                        text-right
                      "
                    >
                      {Number(
                        item.material.latestPrice
                      ).toFixed(2)}
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