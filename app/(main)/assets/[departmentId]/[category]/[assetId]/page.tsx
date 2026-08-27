import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExportDepartmentAssetsPdf from "../ExportDepartmentAssetsPdf";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

type AssetItem = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
  departmentId: number;
  department: {
    name: string;
  };
  sectionId: number | null;
  section: {
    name: string;
  } | null;
  officerId: number | null;
  officer: {
    firstName: string;
    lastName: string;
  } | null;
  status: string;
  purchaseDate: Date | null;
  price: unknown;
  location: string | null;
  remark: string | null;
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

const categoryUnit: Record<string, string> = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  CABINET: "ตัว",
  COMPUTER: "เครื่อง",
  PRINTER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

/*
 * แปลงค่าที่เก็บในฐานข้อมูลเป็นภาษาไทย
 *
 * IN_USE = ยังใช้งาน
 * ACTIVE = ยังใช้งาน (รองรับข้อมูลเดิม)
 * INACTIVE = ไม่ใช้งาน
 * DAMAGED = ชำรุด
 * DISPOSED = จำหน่ายแล้ว
 * LOST = สูญหาย
 */
const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  ACTIVE: "ยังใช้งาน",
  INACTIVE: "ไม่ใช้งาน",
  DAMAGED: "ชำรุด",
  DISPOSED: "จำหน่ายแล้ว",
  LOST: "สูญหาย",
};

const statusClass: Record<string, string> = {
  IN_USE:
    "bg-emerald-100 text-emerald-800 border-emerald-300",

  ACTIVE:
    "bg-emerald-100 text-emerald-800 border-emerald-300",

  INACTIVE:
    "bg-slate-100 text-slate-800 border-slate-300",

  DAMAGED:
    "bg-amber-100 text-amber-800 border-amber-300",

  DISPOSED:
    "bg-red-100 text-red-800 border-red-300",

  LOST:
    "bg-red-100 text-red-800 border-red-300",
};

export default async function DepartmentAllAssetsPage({
  params,
}: Props) {
  const { departmentId } = await params;

  const id = Number(departmentId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  // =====================================================
  // ดึงข้อมูลกลุ่มงาน
  // =====================================================

  const department = await prisma.department.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          assets: true,
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  // =====================================================
  // ดึงครุภัณฑ์ทั้งหมดของกลุ่มงาน
  // =====================================================

  const assets = await prisma.asset.findMany({
    where: {
      departmentId: id,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      model: true,
      serialNumber: true,
      governmentAssetNo: true,
      officeAssetNo: true,
      departmentId: true,
      department: {
        select: {
          name: true,
        },
      },
      sectionId: true,
      section: {
        select: {
          name: true,
        },
      },
      officerId: true,
      officer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      status: true,
      purchaseDate: true,
      price: true,
      location: true,
      remark: true,
    },
  });

  // =====================================================
  // เตรียมข้อมูลสำหรับ Export PDF
  // =====================================================

  const exportAssets = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    category: asset.category,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    governmentAssetNo: asset.governmentAssetNo,
    officeAssetNo: asset.officeAssetNo,
    departmentName: asset.department.name,
    sectionName: asset.section?.name ?? null,
    officerName: asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`
      : null,
    status: asset.status,
    purchaseDate: asset.purchaseDate
      ? asset.purchaseDate.toISOString()
      : null,
    price: asset.price,
    location: asset.location,
    remark: asset.remark,
  }));

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
          items-center
          justify-between
          gap-3
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
            📋 รายการครุภัณฑ์ทั้งหมด
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            {department.name}
          </p>
        </div>

        <Link
          href={`/assets/${department.id}`}
          className="
            shrink-0
            whitespace-nowrap
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            leading-tight
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลกลุ่มงาน
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          !text-white
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
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-300
              "
            >
              กลุ่มงาน
            </p>

            <p
              className="
                mt-1
                break-words
                text-xl
                font-extrabold
                !text-white
                sm:text-2xl
              "
            >
              {department.name}
            </p>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                !text-slate-300
              "
            >
              ครุภัณฑ์ทั้งหมด {department._count.assets} รายการ
            </p>
          </div>

          {/* Export PDF ด้านขวาบน */}

          <div className="w-full shrink-0 sm:w-auto">
            <ExportDepartmentAssetsPdf
              departmentName={department.name}
              assets={exportAssets}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          ตารางรายการครุภัณฑ์
          ไม่มีกรอบซ้อนรอบตาราง
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-xl
        "
      >
        <div className="overflow-x-auto">
          <table
            className="
              w-full
              border-collapse
              border
              border-black
            "
          >
            <thead>
              <tr>
                {/* ลำดับ */}

                <th
                  className="
                    w-[60px]
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  ลำดับ
                </th>

                {/* ประเภท */}

                <th
                  className="
                    w-[120px]
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-2
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  ประเภท
                </th>

                {/* เลขครุภัณฑ์กรม */}

                <th
                  className="
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  เลขครุภัณฑ์กรม
                </th>

                {/* เลขครุภัณฑ์ประจำสำนัก */}

                <th
                  className="
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  เลขครุภัณฑ์ประจำสำนัก
                </th>

                {/* ชื่อครุภัณฑ์ */}

                <th
                  className="
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  ชื่อครุภัณฑ์
                </th>

                {/* หน่วย */}

                <th
                  className="
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  หน่วย
                </th>

                {/* ผู้ครอบครอง */}

                <th
                  className="
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  ผู้ครอบครอง
                </th>

                {/* สถานะ */}

                <th
                  className="
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  สถานะ
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-900">
              {assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-black
                      px-4
                      py-8
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ไม่พบรายการครุภัณฑ์
                  </td>
                </tr>
              ) : (
                assets.map(
                  (asset: AssetItem, index: number) => {
                    const officerName = asset.officer
                      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
                      : "-";

                    return (
                      <tr
                        key={asset.id}
                        className="
                          text-slate-900
                          transition
                          hover:bg-emerald-50
                        "
                      >
                        {/* ลำดับ */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-2
                            py-3
                            text-center
                            align-middle
                            font-bold
                          "
                        >
                          {index + 1}
                        </td>

                        {/* ประเภท */}

                        <td
                          className="
                            border
                            border-black
                            px-2
                            py-3
                            text-center
                            align-middle
                            font-semibold
                          "
                        >
                          {categoryName[asset.category] ??
                            asset.category}
                        </td>

                        {/* เลขครุภัณฑ์กรม */}

                        <td
                          className="
                            border
                            border-black
                            px-3
                            py-3
                            text-center
                            align-middle
                            font-semibold
                          "
                        >
                          {asset.governmentAssetNo ?? "-"}
                        </td>

                        {/* เลขครุภัณฑ์ประจำสำนัก */}

                        <td
                          className="
                            border
                            border-black
                            px-3
                            py-3
                            text-center
                            align-middle
                            font-semibold
                          "
                        >
                          {asset.officeAssetNo ?? "-"}
                        </td>

                        {/* ชื่อครุภัณฑ์ */}

                        <td
                          className="
                            border
                            border-black
                            px-3
                            py-3
                            text-center
                            align-middle
                            font-extrabold
                          "
                        >
                          {asset.name}
                        </td>

                        {/* หน่วย */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-3
                            py-3
                            text-center
                            align-middle
                            font-semibold
                          "
                        >
                          {categoryUnit[asset.category] ??
                            "รายการ"}
                        </td>

                        {/* ผู้ครอบครอง */}

                        <td
                          className="
                            border
                            border-black
                            px-3
                            py-3
                            text-center
                            align-middle
                          "
                        >
                          <p className="font-semibold">
                            {officerName}
                          </p>

                          {asset.section && (
                            <p
                              className="
                                mt-1
                                text-center
                                text-sm
                                font-semibold
                                text-slate-600
                              "
                            >
                              {asset.section.name}
                            </p>
                          )}
                        </td>

                        {/* สถานะ */}

                        <td
                          className="
                            border
                            border-black
                            px-3
                            py-3
                            text-center
                            align-middle
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              items-center
                              justify-center
                              rounded-full
                              border
                              px-4
                              py-1.5
                              text-sm
                              font-extrabold
                              shadow-sm
                              ${
                                statusClass[asset.status] ??
                                "border-slate-300 bg-slate-100 text-slate-800"
                              }
                            `}
                          >
                            {statusName[asset.status] ??
                              "ไม่ระบุสถานะ"}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}