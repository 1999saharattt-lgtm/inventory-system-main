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
    <div className="space-y-8">

      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-md
        "
      >

        <div>

          <h1 className="text-3xl font-extrabold text-slate-800">
            รายการเบิกจ่ายพัสดุ
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            แสดงรายการเอกสารเบิกจ่ายพัสดุทั้งหมด
          </p>

        </div>

        <Link
          href="/issue/create"
          className="
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            to-blue-700
            px-6
            py-3
            font-bold
            text-white
            shadow-md
            transition
            hover:scale-105
            hover:shadow-xl
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
          shadow-md
        "
      >

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>

              <tr>

                <th>ลำดับ</th>

                <th>วันที่เบิกจ่าย</th>

                <th>เลขที่เอกสาร</th>

                <th>หน่วยงาน / กลุ่มงาน</th>

                <th>ผู้ขอเบิก</th>

                <th>รายละเอียด</th>

                <th>หมายเหตุ</th>

                <th>จัดการ</th>

              </tr>

            </thead>

            <tbody>
                          {issues.length > 0 ? (

                issues.map((issue: Issue, index: number) => (

                  <tr
                    key={issue.id}
                    className="transition"
                  >

                    <td className="text-center">
                      {index + 1}
                    </td>

                    <td className="text-center">
                      {new Date(issue.issueDate).toLocaleDateString("th-TH")}
                    </td>

                    <td className="text-center">

                      <span
                        className="
                          inline-flex
                          items-center
                          rounded-full
                          bg-slate-100
                          px-3
                          py-1
                          font-bold
                          text-slate-700
                        "
                      >
                        {issue.documentNo}
                      </span>

                    </td>

                    <td>
                      {issue.department.name}
                    </td>

                    <td>
                      {issue.officer
                        ? `${issue.officer.firstName} ${issue.officer.lastName}`
                        : "-"}
                    </td>

                    <td className="text-center">

                      <Link
                        href={`/issue/${issue.id}`}
                        className="
                          inline-flex
                          items-center
                          rounded-xl
                          bg-sky-600
                          px-4
                          py-2
                          font-bold
                          text-white
                          transition
                          hover:bg-sky-700
                        "
                      >
                        แสดงรายการพัสดุ
                      </Link>

                    </td>

                    <td>
                      {issue.remark || (
                        <span className="italic text-slate-400">
                          -
                        </span>
                      )}
                    </td>

                    <td>

                      <div className="flex justify-center gap-2">

                        <Link
                          href={`/issue/${issue.id}/edit`}
                          className="
                            rounded-xl
                            bg-amber-500
                            px-4
                            py-2
                            font-bold
                            text-white
                            transition
                            hover:bg-amber-600
                          "
                        >
                          แก้ไข
                        </Link>

                        <DeleteButton id={issue.id} />

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-500"
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