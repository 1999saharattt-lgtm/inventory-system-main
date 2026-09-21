import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackButton from "@/components/BackButton";
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
// ใช้ responsibleName จากทะเบียน Excel เป็นหลัก
// =====================================================

function getResponsibleName(asset: {
  responsibleName: string | null;

  department: {
    name: string;
  };

  section: {
    name: string;
  } | null;

  officer: {
    firstName: string;
    lastName: string;
  } | null;
}) {
  const departmentName =
    asset.department.name?.trim() || "";

  const originalResponsibleName =
    asset.responsibleName?.trim();

  // ===================================================
  // ใช้ข้อความจาก Excel ก่อน
  // ===================================================

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    if (
      departmentName &&
      (
        originalResponsibleName === departmentName ||
        originalResponsibleName.startsWith(
          `${departmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    if (departmentName) {
      return `${departmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  // ===================================================
  // ถ้าไม่มี responsibleName ใช้ section
  // ===================================================

  const sectionName =
    asset.section?.name?.trim();

  if (sectionName) {
    if (departmentName) {
      return `${departmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  // ===================================================
  // ถ้าไม่มีทั้ง responsibleName และ section
  // ใช้ผู้ครอบครอง
  // ===================================================

  const officerName =
    asset.officer
      ? `${asset.officer.firstName} ${asset.officer.lastName}`.trim()
      : "";

  if (officerName) {
    if (departmentName) {
      return `${departmentName} / ${officerName}`;
    }

    return officerName;
  }

  if (departmentName) {
    return departmentName;
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
  // ดึงครุภัณฑ์เฉพาะหน่วยงานนี้
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
  // PDF
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
              ส่งออก PDF
          ============================================= */}

          <div
            className="
              w-full
              sm:w-auto

              [&_button]:!flex
              [&_button]:!h-11
              [&_button]:!w-full
              [&_button]:!items-center
              [&_button]:!justify-center
              [&_button]:!whitespace-nowrap
              [&_button]:!rounded-xl
              [&_button]:!border-0
              [&_button]:!bg-none
              [&_button]:!bg-red-600
              [&_button]:!px-4
              [&_button]:!py-0
              [&_button]:!text-center
              [&_button]:!text-sm
              [&_button]:!font-extrabold
              [&_button]:!leading-none
              [&_button]:!text-white
              [&_button]:!shadow-lg
              [&_button]:!transition

              [&_button:hover]:!scale-[1.02]
              [&_button:hover]:!bg-red-700

              [&_button:active]:!scale-[0.98]

              sm:[&_button]:!w-auto
            "
          >
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
          </div>

          {/* =============================================
              กลับ
          ============================================= */}

          <BackButton
            href={`/assets/${department.id}`}
          />
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
                    {/* ลำดับ */}

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

                    {/* รหัส GFMIS */}

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

                    {/* รหัสครุภัณฑ์ */}

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

                    {/* รายการครุภัณฑ์ */}

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
                            .filter(Boolean)
                            .join(" / ")}
                        </p>
                      )}
                    </td>

                    {/* จำนวน */}

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

                    {/* หน่วย */}

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

                    {/* ผู้รับผิดชอบ */}

                    <td
                      className="
                        break-words
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        align-middle
                        font-semibold
                      "
                    >
                      {getResponsibleName(
                        asset
                      )}
                    </td>

                    {/* สถานะ */}

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
