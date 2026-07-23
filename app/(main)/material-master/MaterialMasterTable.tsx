import { prisma } from "@/lib/prisma";

export default async function Home() {
  const totalMaterials = await prisma.material.count();

  const lowStock = await prisma.material
    .count({
      where: {
        balance: {
          lte: prisma.material.fields.minimumStock,
        },
      },
    })
    .catch(() => 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const receiveToday = await prisma.receive.count({
    where: {
      receiveDate: {
        gte: today,
      },
    },
  });

  const issueToday = await prisma.issue.count({
    where: {
      issueDate: {
        gte: today,
      },
    },
  });

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="rounded-xl border border-slate-300 bg-slate-100 p-6 shadow-sm">

        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์
        </p>

      </div>

      {/* Summary */}
      <div className="grid gap-6 md:grid-cols-4">

        {/* Material */}
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">

          <div className="h-2 bg-blue-700" />

          <div className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  จำนวนพัสดุทั้งหมด
                </p>

                <p className="mt-3 text-5xl font-bold text-slate-900">
                  {totalMaterials}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  รายการ
                </p>

              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-100 p-4 text-4xl">
                📦
              </div>

            </div>

          </div>

        </div>

        {/* Receive */}
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">

          <div className="h-2 bg-emerald-600" />

          <div className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  รับเข้าวันนี้
                </p>

                <p className="mt-3 text-5xl font-bold text-slate-900">
                  {receiveToday}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  ใบรับพัสดุ
                </p>

              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-100 p-4 text-4xl">
                📥
              </div>

            </div>

          </div>

        </div>

        {/* Issue */}
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md">

          <div className="h-2 bg-amber-600" />

          <div className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  เบิกจ่ายวันนี้
                </p>

                <p className="mt-3 text-5xl font-bold text-slate-900">
                  {issueToday}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  ใบเบิก
                </p>

              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-100 p-4 text-4xl">
                📤
              </div>

            </div>

          </div>

        </div>

        {/* Low Stock */}
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-300 hover:shadow-md">

          <div className="h-2 bg-red-600" />

          <div className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  พัสดุใกล้หมด
                </p>

                <p className="mt-3 text-5xl font-bold text-slate-900">
                  {lowStock}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  รายการ
                </p>

              </div>

              <div className="rounded-xl border border-red-200 bg-red-100 p-4 text-4xl">
                ⚠️
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Information */}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm">

        <div className="border-b border-slate-300 bg-slate-200 px-6 py-4">

          <h2 className="text-lg font-semibold text-slate-800">
            ข้อมูลระบบ
          </h2>

        </div>

        <div className="p-6 leading-8 text-slate-700">

          ระบบบริหารคลังพัสดุ ใช้สำหรับบริหารจัดการข้อมูลวัสดุคงคลังของหน่วยงาน
          รองรับการบันทึกรับเข้า การเบิกจ่าย การควบคุมจำนวนคงเหลือ
          และการติดตามข้อมูลผ่าน Stock Card เพื่อให้การบริหารพัสดุเป็นไปอย่างถูกต้อง
          โปร่งใส และสามารถตรวจสอบย้อนหลังได้

        </div>

      </div>

    </div>
  );
}