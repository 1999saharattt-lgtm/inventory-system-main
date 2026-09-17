import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AssetCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
  }>;
};

/* =========================================================
   CATEGORY
   ========================================================= */

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

const validCategories = [
  "DESK",
  "CHAIR",
  "AIR_CONDITIONER",
  "CABINET",
  "COMPUTER",
  "PRINTER",
  "TELEPHONE",
  "OTHER",
  "NO_SYSTEM",
] as const;

type AssetCategoryValue =
  (typeof validCategories)[number];

/* =========================================================
   ASSET STATUS
   ========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

const statusClass: Record<string, string> = {
  IN_USE:
    "bg-emerald-100 text-emerald-800 border-emerald-300",

  DAMAGED:
    "bg-orange-100 text-orange-800 border-orange-300",

  WAITING_DISPOSAL:
    "bg-amber-100 text-amber-800 border-amber-300",

  DISPOSED:
    "bg-slate-200 text-slate-700 border-slate-400",
};

/* =========================================================
   INSPECTION STATUS
   ========================================================= */

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

/* =========================================================
   DATE
   ========================================================= */

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatThaiDate(
  date: Date | string | null
) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return `${parsedDate.getDate()} ${
    thaiMonths[
      parsedDate.getMonth()
    ]
  } ${
    parsedDate.getFullYear() + 543
  }`;
}

/* =========================================================
   QUARTER
   ========================================================= */

function formatQuarter(
  quarter: string | null
) {
  if (!quarter) {
    return "-";
  }

  const quarterMap: Record<
    string,
    string
  > = {
    Q1: "ไตรมาสที่ 1",
    Q2: "ไตรมาสที่ 2",
    Q3: "ไตรมาสที่ 3",
    Q4: "ไตรมาสที่ 4",

    "1": "ไตรมาสที่ 1",
    "2": "ไตรมาสที่ 2",
    "3": "ไตรมาสที่ 3",
    "4": "ไตรมาสที่ 4",
  };

  return (
    quarterMap[quarter] ??
    quarter
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function AssetDetailPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  /* =======================================================
     PARAMS
     ======================================================= */

  const departmentIdNumber =
    Number(departmentId);

  const assetIdNumber =
    Number(assetId);

  const normalizedCategory =
    category.toUpperCase();

  if (
    !Number.isInteger(
      departmentIdNumber
    ) ||
    departmentIdNumber <= 0 ||
    !Number.isInteger(
      assetIdNumber
    ) ||
    assetIdNumber <= 0 ||
    !validCategories.includes(
      normalizedCategory as AssetCategoryValue
    )
  ) {
    notFound();
  }

  const assetCategory =
    normalizedCategory as AssetCategory;

  /* =======================================================
     ASSET

     responsibleName
     = ข้อมูลเดิมจาก Excel / ทะเบียนเดิม

     officer
     = ผู้ครอบครองที่เลือกจากระบบ

     ทั้งสองข้อมูลแยกจากกัน
     ======================================================= */

  const asset =
    await prisma.asset.findFirst({
      where: {
        id: assetIdNumber,

        departmentId:
          departmentIdNumber,

        category:
          assetCategory,
      },

      include: {
        department: true,
        section: true,
        officer: true,

        inspections: {
          orderBy: {
            inspectionDate:
              "desc",
          },

          take: 4,
        },
      },
    });

  if (!asset) {
    notFound();
  }

  /* =======================================================
     LATEST INSPECTION
     ======================================================= */

  const latestInspection =
    asset.inspections[0] ?? null;

  /* =======================================================
     RESPONSIBLE DATA
     ======================================================= */

  const responsibleName =
    asset.responsibleName?.trim() ||
    "-";

  const officerFullName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "ยังไม่ได้ระบุผู้ครอบครอง";

  const officerPosition =
    asset.officer?.position?.trim() ||
    "-";

  /* =======================================================
     ROUTES

     ใช้ค่าที่ผ่านการตรวจสอบแล้ว
     ======================================================= */

  const assetBasePath =
    `/assets/${departmentIdNumber}/${asset.category}/${asset.id}`;

  const categoryPath =
    `/assets/${departmentIdNumber}/${asset.category}`;

  /* =======================================================
     UI
     ======================================================= */

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
      {/* ===================================================
          HEADER
          =================================================== */}

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
            href={categoryPath}
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
            href={`${assetBasePath}/edit`}
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

      {/* ===================================================
          ข้อมูลครุภัณฑ์
          =================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-4xl
          min-w-0
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-6
          text-white
          shadow-2xl
          sm:p-8
        "
      >
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
                  statusClass[
                    asset.status
                  ] ??
                  "border-slate-300 bg-slate-100 text-slate-700"
                }
              `}
            >
              {statusName[
                asset.status
              ] ?? asset.status}
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
          {/* รายการ */}

          <div className="min-w-0 sm:col-span-2">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-200
              "
            >
              รายการครุภัณฑ์
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
              <p
                className="
                  break-words
                  text-lg
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.name}
              </p>
            </div>
          </div>

          {/* ประเภท */}

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-200
              "
            >
              ประเภท
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
              <p
                className="
                  break-words
                  font-extrabold
                  text-slate-900
                "
              >
                {categoryName[
                  asset.category
                ] ?? asset.category}
              </p>
            </div>
          </div>

          {/* ยี่ห้อ */}

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
              <p
                className="
                  break-words
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.brand ?? "-"}
              </p>
            </div>
          </div>

          {/* รุ่น */}

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
              <p
                className="
                  break-words
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.model ?? "-"}
              </p>
            </div>
          </div>

          {/* Serial Number */}

          <div className="min-w-0">
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
              <p
                className="
                  break-all
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.serialNumber ??
                  "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          เลขทะเบียนครุภัณฑ์
          =================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-4xl
          min-w-0
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-6
          text-white
          shadow-2xl
          sm:p-8
        "
      >
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
              รหัส GFMIS
            </p>

            <div
              className="
                mt-2
                min-h-[50px]
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                shadow-md
              "
            >
              <p
                className="
                  break-all
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.governmentAssetNo ??
                  "-"}
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
              รหัสครุภัณฑ์
            </p>

            <div
              className="
                mt-2
                min-h-[50px]
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                shadow-md
              "
            >
              <p
                className="
                  break-all
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.officeAssetNo ??
                  "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          หน่วยงานและผู้รับผิดชอบ

          responsibleName
          = ข้อมูลเดิมจาก Excel

          officer
          = ผู้ครอบครองที่เลือกในระบบ
          =================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-4xl
          min-w-0
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-6
          text-white
          shadow-2xl
          sm:p-8
        "
      >
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
          👤 หน่วยงานและผู้รับผิดชอบ
        </h2>

        <div
          className="
            mt-4
            grid
            gap-4
            sm:grid-cols-2
          "
        >
          {/* หน่วยงาน */}

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

          {/* กลุ่มงาน */}

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
              {asset.section?.name ??
                "-"}
            </div>
          </div>

          {/* ===============================================
              responsibleName เดิมจาก Excel

              แสดงแยกจาก Officer
              =============================================== */}

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-extrabold
                !text-slate-200
              "
            >
              ผู้รับผิดชอบเดิม / ตำแหน่งจัดเก็บ
            </p>

            <div
              className="
                mt-2
                min-h-[50px]
                w-full
                rounded-xl
                border
                border-slate-300
                bg-slate-100
                px-4
                py-3
                font-extrabold
                text-slate-900
                shadow-md
              "
            >
              <p className="break-words">
                {responsibleName}
              </p>
            </div>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                !text-slate-400
              "
            >
              ข้อมูลเดิมจากทะเบียน/Excel
            </p>
          </div>

          {/* ผู้ครอบครองในระบบ */}

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
              <p className="break-words">
                {officerFullName}
              </p>
            </div>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                !text-slate-400
              "
            >
              ผู้ครอบครองที่เลือกจากรายชื่อเจ้าหน้าที่ในระบบ
            </p>
          </div>

          {/* ตำแหน่ง Officer */}

          <div className="min-w-0 sm:col-start-2">
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
              <p className="break-words">
                {officerPosition}
              </p>
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

        {/* หมายเหตุ */}

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
              <p
                className="
                  break-words
                  whitespace-pre-wrap
                  font-semibold
                  text-slate-900
                "
              >
                {asset.remark}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          ผลการตรวจสอบล่าสุด
          =================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-4xl
          min-w-0
          rounded-3xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-6
          text-white
          shadow-2xl
          sm:p-8
        "
      >
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
            href={`${assetBasePath}/inspection`}
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
              {/* รอบ */}

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-extrabold
                    !text-slate-200
                  "
                >
                  รอบการตรวจสอบ
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
                  <p
                    className="
                      break-words
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    ปี{" "}
                    {
                      latestInspection.year
                    }{" "}
                    /{" "}
                    {formatQuarter(
                      latestInspection.quarter
                    )}
                  </p>
                </div>
              </div>

              {/* วันที่ */}

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-extrabold
                    !text-slate-200
                  "
                >
                  วันที่ตรวจสอบ
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
                  <p
                    className="
                      break-words
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {formatThaiDate(
                      latestInspection.inspectionDate
                    )}
                  </p>
                </div>
              </div>

              {/* ผล */}

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-extrabold
                    !text-slate-200
                  "
                >
                  ผลการตรวจสอบ
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
                    ] ??
                      latestInspection.status}
                  </span>
                </div>
              </div>

              {/* ผู้ตรวจ */}

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-extrabold
                    !text-slate-200
                  "
                >
                  ผู้ตรวจครุภัณฑ์
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
                  <p
                    className="
                      break-words
                      text-center
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {latestInspection.inspectorName ??
                      "-"}
                  </p>
                </div>
              </div>

              {/* สภาพ */}

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
                    <p
                      className="
                        break-words
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {
                        latestInspection.condition
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* หมายเหตุการตรวจ */}

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
                    <p
                      className="
                        break-words
                        whitespace-pre-wrap
                        text-center
                        font-semibold
                        text-slate-900
                      "
                    >
                      {
                        latestInspection.remark
                      }
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

      {/* ===================================================
          การดำเนินการ
          =================================================== */}

      <div
        className="
          mx-auto
          flex
          w-full
          max-w-4xl
          flex-col
          gap-3
          sm:flex-row
          sm:justify-end
        "
      >
        <Link
          href={`${assetBasePath}/inspection/new`}
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
          href={`${assetBasePath}/disposal`}
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