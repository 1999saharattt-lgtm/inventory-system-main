import Link from "next/link";

const categories = [
  { value: "OFFICE", label: "วัสดุสำนักงาน" },
  { value: "COMPUTER", label: "วัสดุคอมพิวเตอร์" },
  { value: "ELECTRIC", label: "วัสดุไฟฟ้าและวิทยุ" },
  { value: "HOUSEHOLD", label: "วัสดุงานบ้านและงานครัว" },
  { value: "VEHICLE", label: "วัสดุยานพาหนะ" },
  { value: "PRINTING", label: "สื่อสิ่งพิมพ์" },
];

export default function CreateMaterialMasterPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            เพิ่มรายการพัสดุ
          </h1>

          <p className="mt-2 text-slate-600">
            เพิ่มรายการพัสดุสำหรับใช้งานในระบบ
          </p>
        </div>

        <Link
          href="/material-master"
          className="rounded-lg bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300"
        >
          ← กลับ
        </Link>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <form className="space-y-5">
          <div>
            <label className="mb-2 block font-medium text-slate-700">
              หมวดหมู่
            </label>

            <select className="w-full rounded-lg border p-3">
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-700">
              ชื่อพัสดุ
            </label>

            <input
              type="text"
              className="w-full rounded-lg border p-3"
              placeholder="เช่น กระดาษ A3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-700">
              หน่วย
            </label>

            <input
              type="text"
              className="w-full rounded-lg border p-3"
              placeholder="เช่น รีม / กล่อง / ชิ้น"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white"
            >
              บันทึก
            </button>

            <Link
              href="/material-master"
              className="rounded-lg bg-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-300"
            >
              ยกเลิก
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}