import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
  }>;
};

export default async function AssetDisposalDetailPage({
  params,
}: Props) {
  const { departmentId, category, assetId } = await params;

  const asset = await prisma.asset.findFirst({
    where: {
      id: Number(assetId),
      departmentId: Number(departmentId),
    },
    include: {
      department: true,
      section: true,
      officer: true,
    },
  });

  if (!asset) {
    notFound();
  }

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          flex-col
          justify-center
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
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
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            🗃️ ดำเนินการจำหน่ายครุภัณฑ์
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            ตรวจสอบข้อมูลครุภัณฑ์ก่อนดำเนินการจำหน่าย
          </p>
        </div>

        <Link
          href={`/assets/${departmentId}/${category}/${asset.id}`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-emerald-700
            hover:to-green-600
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
          ข้อมูลครุภัณฑ์
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
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
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {/* รายการ */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              รายการครุภัณฑ์
            </p>

            <p className="mt-2 break-words text-lg font-extrabold !text-white">
              {asset.name}
            </p>
          </div>

          {/* ประเภท */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              ประเภท
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {categoryName[asset.category] ?? asset.category}
            </p>
          </div>

          {/* หน่วยงาน */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              หน่วยงาน
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.department.name}
            </p>
          </div>

          {/* กลุ่มงาน */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              กลุ่มงาน
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.section?.name ?? "-"}
            </p>
          </div>

          {/* ผู้ครอบครอง */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              ผู้ครอบครอง
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.officer
                ? `${asset.officer.firstName} ${asset.officer.lastName}`
                : "-"}
            </p>
          </div>

          {/* สถานะ */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              สถานะปัจจุบัน
            </p>

            <p
              className={`mt-2 font-extrabold ${
                asset.status === "DISPOSED"
                  ? "!text-red-300"
                  : asset.status === "WAITING_DISPOSAL"
                    ? "!text-amber-300"
                    : "!text-white"
              }`}
            >
              {statusName[asset.status] ?? asset.status}
            </p>
          </div>

          {/* เลขกรม */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์กรม
            </p>

            <p className="mt-2 break-all font-extrabold !text-white">
              {asset.governmentAssetNo ?? "-"}
            </p>
          </div>

          {/* เลขสำนัก */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์ประจำสำนัก
            </p>

            <p className="mt-2 break-all font-extrabold !text-white">
              {asset.officeAssetNo ?? "-"}
            </p>
          </div>

          {/* Serial */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              Serial Number
            </p>

            <p className="mt-2 break-all font-extrabold !text-white">
              {asset.serialNumber ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          สถานะ
      ===================================================== */}

      {asset.status === "IN_USE" && (
        <div
          className="
            rounded-2xl
            border
            border-amber-300
            bg-amber-50
            p-5
            shadow-lg
            sm:p-6
          "
        >
          <p className="text-lg font-extrabold text-amber-900">
            ⚠️ ครุภัณฑ์รายการนี้ยังมีสถานะใช้งาน
          </p>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800 sm:text-base">
            หากต้องการดำเนินการจำหน่าย กรุณาดำเนินการเปลี่ยนสถานะเป็น
            &quot;รอจำหน่าย&quot; ก่อน
          </p>

          <div className="mt-4">
            <Link
              href={`/assets/${departmentId}/${category}/${asset.id}/edit`}
              className="
                inline-block
                rounded-xl
                bg-gradient-to-r
                from-amber-600
                to-orange-500
                px-6
                py-3
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:scale-105
                hover:from-amber-700
                hover:to-orange-600
              "
            >
              แก้ไขสถานะครุภัณฑ์
            </Link>
          </div>
        </div>
      )}

      {asset.status === "WAITING_DISPOSAL" && (
        <div
          className="
            rounded-2xl
            border
            border-amber-300
            bg-amber-50
            p-5
            shadow-lg
            sm:p-6
          "
        >
          <p className="text-lg font-extrabold text-amber-900">
            🟡 ครุภัณฑ์อยู่ระหว่างรอจำหน่าย
          </p>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800 sm:text-base">
            รายการนี้พร้อมเข้าสู่ขั้นตอนการจำหน่าย กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนดำเนินการ
          </p>

          <div className="mt-5">
            <Link
              href={`/assets/${departmentId}/${category}/${asset.id}/disposal/new`}
              className="
                inline-block
                rounded-xl
                bg-gradient-to-r
                from-red-600
                to-rose-500
                px-6
                py-3
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:scale-105
                hover:from-red-700
                hover:to-rose-600
              "
            >
              ดำเนินการจำหน่าย
            </Link>
          </div>
        </div>
      )}

      {asset.status === "DISPOSED" && (
        <div
          className="
            rounded-2xl
            border
            border-red-300
            bg-red-50
            p-5
            shadow-lg
            sm:p-6
          "
        >
          <p className="text-lg font-extrabold text-red-900">
            🗑️ ครุภัณฑ์จำหน่ายแล้ว
          </p>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-red-800 sm:text-base">
            ครุภัณฑ์รายการนี้มีสถานะเป็น &quot;จำหน่ายแล้ว&quot;
            และไม่สามารถดำเนินการจำหน่ายซ้ำได้
          </p>

          {/* =================================================
              ข้อมูลการจำหน่าย
          ================================================= */}

          <div
            className="
              mt-5
              grid
              gap-4
              rounded-xl
              border
              border-red-200
              bg-white
              p-4
              sm:grid-cols-2
              sm:p-5
            "
          >
            {/* วันที่จำหน่าย */}

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-600">
                วันที่จำหน่าย
              </p>

              <p className="mt-2 font-extrabold text-slate-900">
                {asset.disposalDate
                  ? asset.disposalDate.toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "-"}
              </p>
            </div>

            {/* สถานที่จำหน่าย */}

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-600">
                สถานที่จำหน่าย
              </p>

              <p className="mt-2 break-words font-extrabold text-slate-900">
                {asset.disposalLocation ?? "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}