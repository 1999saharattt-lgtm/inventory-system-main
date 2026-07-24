import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MaterialMasterPage() {
  const materials = await prisma.materialMaster.findMany({
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
  });

  const categoryName: Record<string, string> = {
    OFFICE: "วัสดุสำนักงาน",
    COMPUTER: "วัสดุคอมพิวเตอร์",
    ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
    HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
    VEHICLE: "วัสดุยานพาหนะ",
    PRINTING: "สื่อสิ่งพิมพ์",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            ทะเบียนพัสดุ
          </h1>

          <p className="mt-2 text-slate-600">
            รายการพัสดุทั้งหมดสำหรับใช้งานในระบบ
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/material-master/create"
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            + เพิ่มรายการ
          </Link>

          <Link
            href="/materials"
            className="rounded-lg bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300"
          >
            ← กลับ
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-200">
              <tr className="text-sm font-semibold text-slate-800">
                <th className="w-20 border border-slate-300 px-4 py-3 text-center">
                  ลำดับ
                </th>

                <th className="border border-slate-300 px-4 py-3 text-center">
                  หมวด
                </th>

                <th className="border border-slate-300 px-4 py-3">
                  รายการพัสดุ
                </th>

                <th className="border border-slate-300 px-4 py-3 text-center">
                  หน่วย
                </th>

                <th className="w-40 border border-slate-300 px-4 py-3 text-center">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                materials.map((item: any, index: number) => (
                  <tr
                    key={item.id}
                    className="odd:bg-white even:bg-slate-50 hover:bg-blue-50"
                  >
                    <td className="border border-slate-300 px-4 py-3 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-slate-300 px-4 py-3 text-center">
                      {categoryName[item.category]}
                    </td>

                    <td className="border border-slate-300 px-4 py-3">
                      {item.name}
                    </td>

                    <td className="border border-slate-300 px-4 py-3 text-center">
                      {item.unit}
                    </td>

                    <td className="border border-slate-300 px-4 py-3 text-center">
                      <span className="text-slate-400">
                        ยังไม่เปิดใช้งาน
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}