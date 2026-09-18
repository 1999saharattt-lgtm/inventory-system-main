import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

import ExportDepartmentAssetsPdf from "../ExportDepartmentAssetsPdf";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

// =====================================================
// สถานะครุภัณฑ์
// =====================================================

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

// =====================================================
// หน่วยนับสำรอง
//
// ใช้เฉพาะกรณีในทะเบียนไม่มี unit
// =====================================================

const categoryUnit: Record<string, string> = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  CABINET: "ตู้",
  SHELF: "ตัว",
  COMPUTER: "เครื่อง",
  MONITOR: "เครื่อง",
  PRINTER: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

// =====================================================
// ลำดับจากทะเบียนต้นฉบับ
//
// SOURCE:DEPARTMENT_1:1
// SOURCE:DEPARTMENT_1:2
// ...
// =====================================================

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_1:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder = Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

// =====================================================
// ผู้รับผิดชอบ
//
// ลำดับ:
// 1. responsibleName จากทะเบียนต้นฉบับ
// 2. เจ้าหน้าที่ + กลุ่มงาน
// 3. เจ้าหน้าที่
// 4. กลุ่มงาน
// =====================================================

function getResponsibleName(asset: {
  responsibleName: string | null;

  officer: {
    firstName: string;
    lastName: string;
  } | null;

  section: {
    name: string;
  } | null;
}) {
  const originalResponsibleName =
    asset.responsibleName?.trim();

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    return originalResponsibleName;
  }

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (
    officerName &&
    asset.section?.name
  ) {
    return `${officerName} / ${asset.section.name}`;
  }

  if (officerName) {
    return officerName;
  }

  if (asset.section?.name) {
    return asset.section.name;
  }

  return "-";
}

// =====================================================
// หน่วย
// =====================================================

function getAssetUnit(asset: {
  unit: string | null;
  category: string;
}) {
  const originalUnit =
    asset.unit?.trim();

  if (
    originalUnit &&
    originalUnit !== "-"
  ) {
    return originalUnit;
  }

  return (
    categoryUnit[asset.category] ??
    "รายการ"
  );
}

// =====================================================
// PAGE
// =====================================================

export default async function AllAssetsPage({
  params,
}: Props) {
  const { departmentId } =
    await params;

  const id =
    Number(departmentId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    notFound();
  }

  // ===================================================
  // หน่วยงาน
  // ===================================================

  const department =
    await prisma.department.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!department) {
    notFound();
  }

  // ===================================================
  // ครุภัณฑ์
  //
  // ดึงเฉพาะ department ที่เปิดอยู่
  // ===================================================

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId: id,
      },

      include: {
        department: true,
        section: true,
        officer: true,
      },
    });

  // ===================================================
  // เรียงตามทะเบียนต้นฉบับ
  // ===================================================

  const assets = [
    ...assetsFromDatabase,
  ].sort((a, b) => {
    const orderA =
      getSourceOrder(a.remark);

    const orderB =
      getSourceOrder(b.remark);

    if (
      orderA !== null &&
      orderB !== null
    ) {
      return orderA - orderB;
    }

    if (orderA !== null) {
      return -1;
    }

    if (orderB !== null) {
      return 1;
    }

    return a.id - b.id;
  });

  // ===================================================
  // Component PDF เดิม
  //
  // ส่ง props หลักที่ PDF ของ department อาจใช้อยู่
  // ===================================================

  const ExportPdfButton =
    ExportDepartmentAssetsPdf as any;

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
      {/* =================================================
          HEADER
      ================================================= */}

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
          px-4
          py-5
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
        {/* ===============================================
            ชื่อหน้า
        =============================================== */}

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
            📋 ทะเบียนครุภัณฑ์ทั้งหมด
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

        {/* ===============================================
            ปุ่ม
        =============================================== */}

        <div
          className="
            flex
            w-full
            shrink-0
            flex-col
            gap-3
            sm:w-auto
            sm:flex-row
            sm:items-center
          "
        >
          {/* =============================================
              ส่งออก PDF เดิม
          ============================================= */}

          <ExportPdfButton
            departmentId={
              department.id
            }
            departmentName={
              department.name
            }
            department={
              department
            }
            assets={
              assets
            }
          />

          {/* =============================================
              กลับ
          ============================================= */}

          <Link
            href={`/assets/${department.id}`}
            className="
              w-full
              whitespace-nowrap
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
              py-3
              text-center
              text-sm
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-105
              hover:from-emerald-700
              hover:to-green-600
              sm:w-auto
              sm:text-base
            "
          >
            ← กลับ
          </Link>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-black
          bg-white
          shadow-xl
        "
      >
        <div
          className="
            w-full
            overflow-x-auto
          "
        >
          <table
            className="
              w-full
              min-w-[1450px]
              border-collapse
              text-sm
            "
          >
            <thead>
              <tr>
                {/* =======================================
                    ลำดับ
                ======================================= */}

                <th
                  className="
                    w-[6%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  ลำดับ
                </th>

                {/* =======================================
                    รหัส GFMIS
                ======================================= */}

                <th
                  className="
                    w-[14%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  รหัส GFMIS
                </th>

                {/* =======================================
                    รหัสครุภัณฑ์
                ======================================= */}

                <th
                  className="
                    w-[15%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  รหัสครุภัณฑ์
                </th>

                {/* =======================================
                    ผู้รับผิดชอบ
                ======================================= */}

                <th
                  className="
                    w-[16%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  ผู้รับผิดชอบ
                </th>

                {/* =======================================
                    รายการครุภัณฑ์
                ======================================= */}

                <th
                  className="
                    w-[25%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  รายการครุภัณฑ์
                </th>

                {/* =======================================
                    จำนวน
                ======================================= */}

                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  จำนวน
                </th>

                {/* =======================================
                    หน่วย
                ======================================= */}

                <th
                  className="
                    w-[7%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  หน่วย
                </th>

                {/* =======================================
                    สถานะ
                ======================================= */}

                <th
                  className="
                    w-[10%]
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-4
                    text-center
                    font-extrabold
                    !text-white
                  "
                >
                  สถานะ
                </th>
              </tr>
            </thead>

            <tbody>
              {assets.map(
                (asset, index) => (
                  <tr
                    key={asset.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
                    {/* ===================================
                        ลำดับ
                    =================================== */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    {/* ===================================
                        รหัส GFMIS
                    =================================== */}

                    <td
                      className="
                        break-all
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-semibold
                      "
                    >
                      {asset.governmentAssetNo ??
                        "-"}
                    </td>

                    {/* ===================================
                        รหัสครุภัณฑ์
                    =================================== */}

                    <td
                      className="
                        break-all
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-semibold
                      "
                    >
                      {asset.officeAssetNo ??
                        "-"}
                    </td>

                    {/* ===================================
                        ผู้รับผิดชอบ
                    =================================== */}

                    <td
                      className="
                        break-words
                        border
                        border-black
                        px-3
                        py-4
                        font-semibold
                      "
                    >
                      {getResponsibleName(
                        asset
                      )}
                    </td>

                    {/* ===================================
                        รายการครุภัณฑ์
                    =================================== */}

                    <td
                      className="
                        break-words
                        border
                        border-black
                        px-3
                        py-4
                        font-semibold
                      "
                    >
                      <Link
                        href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}`}
                        className="
                          font-extrabold
                          text-slate-900
                          underline-offset-4
                          hover:text-blue-700
                          hover:underline
                        "
                      >
                        {asset.name}
                      </Link>

                      {(asset.brand ||
                        asset.model) && (
                        <p
                          className="
                            mt-1
                            text-xs
                            font-semibold
                            text-slate-500
                          "
                        >
                          {[
                            asset.brand,
                            asset.model,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " / "
                            )}
                        </p>
                      )}
                    </td>

                    {/* ===================================
                        จำนวน
                    =================================== */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {asset.quantity}
                    </td>

                    {/* ===================================
                        หน่วย
                    =================================== */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {getAssetUnit(
                        asset
                      )}
                    </td>

                    {/* ===================================
                        สถานะ
                    =================================== */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                      "
                    >
                      <span
                        className={`
                          inline-flex
                          whitespace-nowrap
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-extrabold
                          ${
                            asset.status ===
                            "IN_USE"
                              ? "bg-emerald-100 text-emerald-800"
                              : asset.status ===
                                  "WAITING_DISPOSAL"
                                ? "bg-amber-100 text-amber-800"
                                : asset.status ===
                                    "DAMAGED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-200 text-slate-800"
                          }
                        `}
                      >
                        {statusName[
                          asset.status
                        ] ??
                          asset.status}
                      </span>
                    </td>
                  </tr>
                )
              )}

              {/* =============================================
                  ไม่มีข้อมูล
              ============================================= */}

              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-black
                      px-6
                      py-12
                      text-center
                      text-lg
                      font-semibold
                      text-slate-500
                    "
                  >
                    ยังไม่มีข้อมูลครุภัณฑ์
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