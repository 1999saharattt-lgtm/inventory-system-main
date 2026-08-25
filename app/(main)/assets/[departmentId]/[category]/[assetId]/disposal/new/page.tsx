import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  CABINET: "ตู้",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอคอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "โทรศัพท์",
  SHELF: "ชั้น / ชั้นวาง",
  OTHER: "อื่น ๆ",
};

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
  }>;
};

export default async function NewAssetDisposalPage({
  params,
}: Props) {
  const { departmentId, category, assetId } = await params;

  const asset = await prisma.asset.findFirst({
    where: {
      id: Number(assetId),
      departmentId: Number(departmentId),
      category: category as any,
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

  if (asset.status !== "WAITING_DISPOSAL") {
    redirect(
      `/assets/${departmentId}/${category}/${asset.id}/disposal`
    );
  }

  async function submitDisposal(formData: FormData) {
    "use server";

    const currentAsset = await prisma.asset.findFirst({
      where: {
        id: Number(assetId),
        departmentId: Number(departmentId),
        category: category as any,
      },
    });

    if (!currentAsset) {
      notFound();
    }

    if (currentAsset.status !== "WAITING_DISPOSAL") {
      redirect(
        `/assets/${departmentId}/${category}/${currentAsset.id}/disposal`
      );
    }

    await prisma.asset.update({
      where: {
        id: currentAsset.id,
      },
      data: {
        status: "DISPOSED",
      },
    });

    redirect(
      `/assets/${departmentId}/${category}/${currentAsset.id}/disposal`
    );
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
            📋 บันทึกการจำหน่ายครุภัณฑ์
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
            ยืนยันการจำหน่ายครุภัณฑ์ออกจากทะเบียน
          </p>
        </div>

        <Link
          href={`/assets/${departmentId}/${category}/${asset.id}/disposal`}
          className="
            shrink-0
            rounded-xl
            bg-white
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-slate-900
            shadow-lg
            transition
            hover:scale-[1.02]
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
          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              รายการครุภัณฑ์
            </p>

            <p className="mt-2 break-words text-lg font-extrabold !text-white">
              {asset.name}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              ประเภท
            </p>

            <p className="mt-2 font-extrabold !text-white">
              {categoryName[asset.category] ??
                asset.category}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              หน่วยงาน
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.department.name}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              กลุ่มงาน
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.section?.name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              ผู้ครอบครอง
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.officer
                ? `${asset.officer.firstName} ${asset.officer.lastName}`
                : "-"}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              สถานะปัจจุบัน
            </p>

            <p className="mt-2 font-extrabold !text-amber-300">
              รอจำหน่าย
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์กรม
            </p>

            <p className="mt-2 break-all font-extrabold !text-white">
              {asset.governmentAssetNo ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์ประจำสำนัก
            </p>

            <p className="mt-2 break-all font-extrabold !text-white">
              {asset.officeAssetNo ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          คำเตือน
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
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
          ⚠️ ยืนยันการจำหน่าย
        </p>

        <p className="mt-2 text-sm font-semibold leading-relaxed text-red-800 sm:text-base">
          กรุณาตรวจสอบข้อมูลครุภัณฑ์ให้ถูกต้องก่อนยืนยัน
          เมื่อยืนยันแล้ว สถานะครุภัณฑ์จะเปลี่ยนจาก
          &quot;รอจำหน่าย&quot; เป็น &quot;จำหน่ายแล้ว&quot;
        </p>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <form action={submitDisposal}>
        <div
          className="
            w-full
            min-w-0
            rounded-2xl
            border
            border-slate-300
            bg-white
            p-5
            shadow-xl
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >
            <Link
              href={`/assets/${departmentId}/${category}/${asset.id}/disposal`}
              className="
                w-full
                rounded-xl
                border
                border-slate-400
                bg-white
                px-6
                py-3
                text-center
                font-extrabold
                text-slate-800
                shadow-md
                transition
                hover:bg-slate-100
                sm:w-auto
              "
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              className="
                w-full
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
                hover:scale-[1.02]
                hover:from-red-700
                hover:to-rose-600
                active:scale-[0.98]
                sm:w-auto
              "
            >
              🗑️ ยืนยันการจำหน่าย
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}