import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
  }>;
};

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

const statusClass: Record<string, string> = {
  IN_USE:
    "bg-emerald-100 text-emerald-800 border-emerald-300",
  WAITING_DISPOSAL:
    "bg-amber-100 text-amber-800 border-amber-300",
  DISPOSED:
    "bg-slate-200 text-slate-700 border-slate-400",
};

const inspectionStatusName: Record<string, string> = {
  IN_USE: "ยังใช้งานอยู่",
  RETURNED: "ส่งคืน",
  DAMAGED: "ชำรุด",
  MISSING: "สูญหาย",
  NOT_FOUND: "ไม่พบครุภัณฑ์",
};

const inspectionStatusClass: Record<string, string> = {
  IN_USE:
    "bg-emerald-100 text-emerald-800 border-emerald-300",
  RETURNED:
    "bg-blue-100 text-blue-800 border-blue-300",
  DAMAGED:
    "bg-amber-100 text-amber-800 border-amber-300",
  MISSING:
    "bg-red-100 text-red-800 border-red-300",
  NOT_FOUND:
    "bg-red-100 text-red-800 border-red-300",
};

export default async function AssetDetailPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  const departmentIdNumber = Number(departmentId);
  const assetIdNumber = Number(assetId);

  if (
    !Number.isInteger(departmentIdNumber) ||
    !Number.isInteger(assetIdNumber)
  ) {
    notFound();
  }

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetIdNumber,
      departmentId: departmentIdNumber,
      category: category as any,
    },
    include: {
      department: true,
      section: true,
      officer: true,
      inspections: {
        orderBy: {
          inspectionDate: "desc",
        },
        take: 4,
      },
    },
  });

  if (!asset) {
    notFound();
  }

  const latestInspection = asset.inspections[0];

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
          justify-between
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
            📋 รายละเอียดครุภัณฑ์
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
            {asset.name} — ทะเบียนคุมครุภัณฑ์
          </p>
        </div>

        <div
          className="
            flex
            w-full
            flex-col
            gap-2
            sm:w-auto
            sm:flex-row
          "
        >
          <Link
            href={`/assets/${departmentId}/${category}`}
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
            "
          >
            ← กลับ
          </Link>

          <Link
            href={`/assets/${departmentId}/${category}/${asset.id}/edit`}
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-red-600
              to-red-500
              px-5
              py-2.5
              text-center
              text-sm
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              hover:from-red-700
              hover:to-red-600
              sm:w-auto
            "
          >
            ✏️ แก้ไข
          </Link>
        </div>
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
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
            "
          >
            <h2
              className="
                min-w-0
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              📋 ข้อมูลครุภัณฑ์
            </h2>

            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              <span
                className="
                  hidden
                  text-sm
                  font-extrabold
                  !text-slate-200
                  sm:inline
                "
              >
                สถานะครุภัณฑ์
              </span>

              <span
                className="
                  text-xs
                  font-extrabold
                  !text-slate-200
                  sm:hidden
                "
              >
                สถานะ
              </span>

              <span
                className={` 
                  inline-flex
                  rounded-xl
                  border
                  px-3
                  py-1.5
                  text-sm
                  font-extrabold
                  ${
                    statusClass[asset.status] ??
                    "border-slate-300 bg-slate-100 text-slate-700"
                  }
                `}
              >
                {statusName[asset.status] ??
                  asset.status}
              </span>
            </div>
          </div>

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <div className="min-w-0 sm:col-span-2">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                ชื่อครุภัณฑ์
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-words text-lg font-extrabold text-slate-900">
                  {asset.name}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                ยี่ห้อ
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-words font-extrabold text-slate-900">
                  {asset.brand ?? "-"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                รุ่น
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-words font-extrabold text-slate-900">
                  {asset.model ?? "-"}
                </p>
              </div>
            </div>

            <div className="min-w-0 sm:col-span-2">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                Serial Number
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-all font-extrabold text-slate-900">
                  {asset.serialNumber ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          เลขทะเบียนครุภัณฑ์
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <div>
          <h2
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
              text-lg
              font-extrabold
              !text-white
              sm:text-xl
            "
          >
            🔖 เลขทะเบียนครุภัณฑ์
          </h2>

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                เลขครุภัณฑ์กรม
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-all font-extrabold text-slate-900">
                  {asset.governmentAssetNo ?? "-"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                เลขครุภัณฑ์ประจำสำนัก
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-all font-extrabold text-slate-900">
                  {asset.officeAssetNo ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ผู้รับผิดชอบ
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <div>
          <h2
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
              text-lg
              font-extrabold
              !text-white
              sm:text-xl
            "
          >
            👤 ผู้รับผิดชอบ
          </h2>

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                หน่วยงาน
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  font-extrabold
                  text-slate-900
                  shadow-md
                "
              >
                {asset.department.name}
              </div>
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                กลุ่มงาน
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  font-extrabold
                  text-slate-900
                  shadow-md
                "
              >
                {asset.section?.name ?? "-"}
              </div>
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                ผู้ครอบครอง
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  font-extrabold
                  text-slate-900
                  shadow-md
                "
              >
                {asset.officer
                  ? `${asset.officer.firstName} ${asset.officer.lastName}`
                  : "ยังไม่ได้ระบุผู้ครอบครอง"}
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  !text-slate-400
                "
              >
                ผู้รับผิดชอบครุภัณฑ์
              </p>
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                ตำแหน่ง
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  font-extrabold
                  text-slate-900
                  shadow-md
                "
              >
                {asset.officer?.position ?? "-"}
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  !text-slate-400
                "
              >
                ตำแหน่งตามผู้ครอบครองที่เลือก
              </p>
            </div>
          </div>

          {asset.remark && (
            <div className="mt-4">
              <p
                className="
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                หมายเหตุ
              </p>

              <div
                className="
                  mt-2
                  min-h-[50px]
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  shadow-md
                "
              >
                <p className="break-words font-semibold text-slate-900">
                  {asset.remark}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ผลการตรวจสอบล่าสุด
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >
        <div>
          <div
            className="
              flex
              flex-col
              gap-3
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              🔍 ผลการตรวจสอบล่าสุด
            </h2>

            <Link
              href={`/assets/${departmentId}/${category}/${asset.id}/inspection`}
              className="
                w-full
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-4
                py-2
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
              "
            >
              ดูประวัติการตรวจสอบ
            </Link>
          </div>

          <div className="mt-4">
            {latestInspection ? (
              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-extrabold
                      !text-slate-200
                    "
                  >
                    รอบการตรวจ
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      min-h-[50px]
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      text-center
                      shadow-md
                    "
                  >
                    <p className="break-words text-center font-extrabold text-slate-900">
                      ปี {latestInspection.year} /{" "}
                      {latestInspection.quarter}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-extrabold
                      !text-slate-200
                    "
                  >
                    วันที่ตรวจ
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      min-h-[50px]
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      text-center
                      shadow-md
                    "
                  >
                    <p className="break-words text-center font-extrabold text-slate-900">
                      {new Date(
                        latestInspection.inspectionDate
                      ).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-extrabold
                      !text-slate-200
                    "
                  >
                    ผลการตรวจ
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      min-h-[50px]
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-2
                      text-center
                      shadow-md
                    "
                  >
                    <span
                      className={`
                        inline-flex
                        rounded-lg
                        border
                        px-3
                        py-1.5
                        text-center
                        text-sm
                        font-extrabold
                        ${
                          inspectionStatusClass[
                            latestInspection.status
                          ] ??
                          "border-slate-300 bg-slate-100 text-slate-700"
                        }
                      `}
                    >
                      {inspectionStatusName[
                        latestInspection.status
                      ] ?? latestInspection.status}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-extrabold
                      !text-slate-200
                    "
                  >
                    ผู้ตรวจ
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      min-h-[50px]
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      text-center
                      shadow-md
                    "
                  >
                    <p className="break-words text-center font-extrabold text-slate-900">
                      {latestInspection.inspectorName ??
                        "-"}
                    </p>
                  </div>
                </div>

                {latestInspection.condition && (
                  <div
                    className="
                      min-w-0
                      sm:col-span-2
                      lg:col-span-4
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-extrabold
                        !text-slate-200
                      "
                    >
                      สภาพครุภัณฑ์
                    </p>

                    <div
                      className="
                        mt-2
                        flex
                        min-h-[50px]
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-4
                        py-3
                        text-center
                        shadow-md
                      "
                    >
                      <p className="break-words text-center font-semibold text-slate-900">
                        {latestInspection.condition}
                      </p>
                    </div>
                  </div>
                )}

                {latestInspection.remark && (
                  <div
                    className="
                      min-w-0
                      sm:col-span-2
                      lg:col-span-4
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-extrabold
                        !text-slate-200
                      "
                    >
                      หมายเหตุการตรวจ
                    </p>

                    <div
                      className="
                        mt-2
                        flex
                        min-h-[50px]
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-4
                        py-3
                        text-center
                        shadow-md
                      "
                    >
                      <p className="break-words text-center font-semibold text-slate-900">
                        {latestInspection.remark}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  p-8
                  text-center
                  font-semibold
                  text-slate-500
                  shadow-md
                "
              >
                ยังไม่มีประวัติการตรวจสอบครุภัณฑ์
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          การดำเนินการ
      ===================================================== */}

      <div
        className="
          flex
          w-full
          flex-col
          gap-3
          sm:flex-row
          sm:justify-end
        "
      >
        <Link
          href={`/assets/${departmentId}/${category}/${asset.id}/inspection/new`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            to-blue-500
            px-6
            py-3
            text-center
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-blue-700
            hover:to-blue-600
            sm:w-auto
          "
        >
          🔍 บันทึกผลการตรวจ
        </Link>

        <Link
          href={`/assets/${departmentId}/${category}/${asset.id}/disposal`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-amber-600
            to-orange-500
            px-6
            py-3
            text-center
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-amber-700
            hover:to-amber-600
            sm:w-auto
          "
        >
          📦 การจำหน่าย
        </Link>
      </div>
    </div>
  );
}