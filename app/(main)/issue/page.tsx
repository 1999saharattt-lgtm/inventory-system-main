import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";

type Issue = {
  id: number;
  issueDate: Date;
  documentNo: string;
  remark: string | null;

  department: {
    name: string;
  };

  officer: {
    firstName: string;
    lastName: string;
  } | null;

  items: {
    id: number;
    qty: number;
    manufacture: Date | null;
    expiry: Date | null;

    material: {
      id: number;
      name: string;
      unit: string;
    };
  }[];
};

export default async function IssuePage() {
  const issues = await prisma.issue.findMany({
    orderBy: {
      issueDate: "desc",
    },

    include: {
      department: true,

      officer: true,

      items: {
        include: {
          material: true,
        },
      },
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}

      <div
        className="
          flex
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
          sm:min-h-[140px]
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
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-5xl
            "
          >
            📤 รายการเบิกจ่ายพัสดุ
          </h1>

          <p
            className="
              mt-2
              text-base
              font-semibold
              !text-slate-200
              sm:text-xl
            "
          >
            แสดงรายการเอกสารเบิกจ่ายพัสดุทั้งหมด
          </p>

        </div>

        <Link
          href="/issue/create"
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-base
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:py-3
            sm:text-lg
          "
        >
          + เพิ่มรายการเบิก
        </Link>
      </div>

      {/* Table */}

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
              min-w-[1200px]
              border
              border-slate-900
            "
          >

            <thead>

              <tr>

                {[
                  "ลำดับ",
                  "วันที่เบิกจ่าย",
                  "เลขที่เอกสาร",
                  "หน่วยงาน / กลุ่มงาน",
                  "ผู้ขอเบิก",
                  "รายละเอียด",
                  "หมายเหตุ",
                  "จัดการ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
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

              {issues.length > 0 ? (

                issues.map((issue, index: number) => (

                  <tr
                    key={issue.id}
                    className="
                      border-b
                      border-slate-900
                      hover:bg-blue-50
                    "
                  >

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {issue.issueDate
                        ? new Date(
                            issue.issueDate
                          ).toLocaleDateString("th-TH")
                        : "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {issue.documentNo}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {issue.department?.name ?? "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {issue.officer
                        ? `${issue.officer.firstName} ${issue.officer.lastName}`
                        : "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      <Link
                        href={`/issue/${issue.id}`}
                        className="
                          inline-block
                          rounded-lg
                          bg-slate-800
                          px-4
                          py-2
                          font-extrabold
                          text-white
                          shadow
                          transition
                          hover:bg-slate-700
                        "
                      >
                        ดูรายการ
                      </Link>
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {issue.remark || (
                        <span
                          className="
                            italic
                            text-slate-400
                          "
                        >
                          -
                        </span>
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      <div
                        className="
                          flex
                          justify-center
                          gap-2
                        "
                      >

                        <Link
                          href={`/issue/${issue.id}/edit`}
                          className="
                            rounded-lg
                            bg-slate-800
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow
                            transition
                            hover:bg-slate-700
                          "
                        >
                          แก้ไข
                        </Link>

                        <DeleteButton
                          id={issue.id}
                        />

                      </div>
                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={8}
                    className="
                      border
                      border-slate-900
                      py-12
                      text-center
                      text-lg
                      font-extrabold
                      text-slate-500
                    "
                  >
                    ยังไม่มีรายการเบิกจ่ายพัสดุ
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}