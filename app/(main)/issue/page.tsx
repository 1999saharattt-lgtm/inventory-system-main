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
      <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-6 shadow-sm">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            รายการเบิกจ่ายพัสดุ
          </h1>

          <p className="mt-2 text-slate-600">
            แสดงรายการเอกสารเบิกจ่ายพัสดุทั้งหมด
          </p>
        </div>

        <Link
          href="/issue/create"
          className="
            rounded-lg
            bg-blue-700
            px-5
            py-3
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-blue-800
          "
        >
          + เพิ่มรายการเบิก
        </Link>

      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full border-collapse">

            <thead className="bg-slate-200 text-center">

              <tr className="text-sm font-semibold text-slate-800">

                <th className="w-16 border border-slate-300 px-4 py-3">
                  ลำดับ
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  วันที่เบิกจ่าย
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  เลขที่เอกสาร
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  หน่วยงาน / กลุ่มงาน
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  ผู้ขอเบิก
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  รายละเอียด
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  หมายเหตุ
                </th>

                <th className="w-56 border border-slate-300 px-4 py-3">
                  จัดการ
                </th>

              </tr>

            </thead>


            <tbody>

              {issues.length > 0 ? (

                issues.map((issue: Issue, index: number) => (

                  <tr
                    key={issue.id}
                    className="
                      odd:bg-white
                      even:bg-slate-50
                      hover:bg-blue-50
                      transition-colors
                    "
                  >

                    <td className="border border-slate-300 px-4 py-3 text-center font-medium text-slate-700">
                      {index + 1}
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-center text-slate-700">
                      {new Date(issue.issueDate).toLocaleDateString("th-TH")}
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-center">

                      <span className="
                        inline-block
                        rounded-md
                        bg-slate-200
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-slate-800
                      ">
                        {issue.documentNo}
                      </span>

                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-slate-700">
                      {issue.department.name}
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-slate-700">
                      {issue.officer
                        ? `${issue.officer.firstName} ${issue.officer.lastName}`
                        : "-"
                      }
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-center">

                      <Link
                        href={`/issue/${issue.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-sky-600
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-white
                          shadow-sm
                          transition
                          hover:bg-sky-700
                        "
                      >
                        แสดงรายการพัสดุ
                      </Link>

                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-slate-700">

                      {issue.remark ? (
                        issue.remark
                      ) : (
                        <span className="italic text-slate-400">
                          -
                        </span>
                      )}

                    </td>


                    <td className="border border-slate-300 px-4 py-3">

                      <div className="flex justify-center gap-2">

                        <Link
                          href={`/issue/${issue.id}/edit`}
                          className="
                            rounded-lg
                            bg-amber-500
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            shadow-sm
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
                    className="bg-white py-12 text-center text-slate-500"
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