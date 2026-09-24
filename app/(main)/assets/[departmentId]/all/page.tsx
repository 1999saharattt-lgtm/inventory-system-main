import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

import ExportDepartmentAssetsPdf from "../ExportDepartmentAssetsPdf";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

/* =========================================================
   STATUS
========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

/* =========================================================
   CATEGORY UNIT

   ใช้เฉพาะกรณีในทะเบียนไม่มี unit
========================================================= */

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

/* =========================================================
   SOURCE ORDER

   ลำดับจากทะเบียนต้นฉบับ
========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_\d+:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder = Number(
    match[1]
  );

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   RESPONSIBLE NAME

   ใช้ responsibleName จากทะเบียน Excel เป็นหลัก
========================================================= */

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

  /* =======================================================
     RESPONSIBLE NAME
  ======================================================= */

  if (
    originalResponsibleName &&
    originalResponsibleName !== "-"
  ) {
    if (
      departmentName &&
      (
        originalResponsibleName ===
          departmentName ||
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

  /* =======================================================
     SECTION
  ======================================================= */

  const sectionName =
    asset.section?.name?.trim();

  if (sectionName) {
    if (departmentName) {
      return `${departmentName} / ${sectionName}`;
    }

    return sectionName;
  }

  /* =======================================================
     OFFICER
  ======================================================= */

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

/* =========================================================
   ASSET UNIT
========================================================= */

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

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
  status: string
) {
  switch (status) {
    case "IN_USE":
      return `
        bg-emerald-100
        !text-emerald-800
      `;

    case "WAITING_DISPOSAL":
      return `
        bg-amber-100
        !text-amber-800
      `;

    case "DAMAGED":
      return `
        bg-red-100
        !text-red-800
      `;

    case "DISPOSED":
      return `
        bg-slate-200
        !text-slate-800
      `;

    default:
      return `
        bg-slate-100
        !text-slate-700
      `;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function AllAssetsPage({
  params,
}: Props) {
  const {
    departmentId,
  } = await params;

  const id =
    Number(departmentId);

  /* =======================================================
     PARAMS
  ======================================================= */

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    notFound();
  }

  /* =======================================================
     DEPARTMENT
  ======================================================= */

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

  /* =======================================================
     NON-NULL VALUES
  ======================================================= */

  const departmentIdForPage =
    department.id;

  const departmentNameForPage =
    department.name;

  /* =======================================================
     ASSETS
  ======================================================= */

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId:
          departmentIdForPage,
      },

      include: {
        department: true,
        section: true,
        officer: true,
      },
    });

  /* =======================================================
     SORT
  ======================================================= */

  const assets = [
    ...assetsFromDatabase,
  ].sort((a, b) => {
    const orderA =
      getSourceOrder(
        a.remark
      );

    const orderB =
      getSourceOrder(
        b.remark
      );

    if (
      orderA !== null &&
      orderB !== null
    ) {
      return (
        orderA -
        orderB
      );
    }

    if (orderA !== null) {
      return -1;
    }

    if (orderB !== null) {
      return 1;
    }

    return a.id - b.id;
  });

  /* =======================================================
     PDF
  ======================================================= */

  const ExportPdfButton =
    ExportDepartmentAssetsPdf as any;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📋"
        title="ทะเบียนครุภัณฑ์ทั้งหมด"
        subtitle={
          departmentNameForPage
        }
        actions={
          <>
            {/* ===============================================
                EXPORT PDF
            =============================================== */}

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
                  departmentIdForPage
                }
                departmentName={
                  departmentNameForPage
                }
                department={
                  department
                }
                assets={
                  assets
                }
              />
            </div>

            {/* ===============================================
                BACK
            =============================================== */}

            <AppButton
              href={`/assets/${departmentIdForPage}`}
              variant="back"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  ←
                </span>
              }
            >
              กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="ทะเบียนครุภัณฑ์ทั้งหมด"
        subtitle={`${departmentNameForPage} • ทะเบียนคุมครุภัณฑ์`}
        badge={`${assets.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE WRAPPER

            ไม่กำหนด min-width ขนาดใหญ่
            เพื่อไม่ให้ตารางล้นออกด้านข้าง
        =================================================== */}

        <div
          className="
            w-full
            min-w-0
            overflow-hidden
          "
        >
          <table
            className="
              w-full
              table-fixed
              border-collapse
              bg-white
              text-sm
            "
          >
            {/* =================================================
                COLUMN WIDTH

                รวม 100%
            ================================================= */}

            <colgroup>
              {/* ลำดับ */}
              <col className="w-[5%]" />

              {/* GFMIS */}
              <col className="w-[12%]" />

              {/* รหัสครุภัณฑ์ */}
              <col className="w-[14%]" />

              {/* รายการ */}
              <col className="w-[21%]" />

              {/* จำนวน */}
              <col className="w-[6%]" />

              {/* หน่วย */}
              <col className="w-[6%]" />

              {/* ผู้รับผิดชอบ */}
              <col className="w-[18%]" />

              {/* สถานะ */}
              <col className="w-[9%]" />

              {/* รายละเอียด */}
              <col className="w-[9%]" />
            </colgroup>

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "รหัส GFMIS",
                  "รหัสครุภัณฑ์",
                  "รายการครุภัณฑ์",
                  "จำนวน",
                  "หน่วย",
                  "ผู้รับผิดชอบ",
                  "สถานะ",
                  "รายละเอียด",
                ].map(
                  (
                    tableTitle
                  ) => (
                    <th
                      key={
                        tableTitle
                      }
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-2
                        py-4

                        text-center
                        text-sm
                        font-extrabold
                        !text-white

                        xl:px-3
                        xl:text-base
                      "
                    >
                      {
                        tableTitle
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {assets.length >
              0 ? (
                assets.map(
                  (
                    asset,
                    index
                  ) => {
                    const detailPath =
                      `/assets/${asset.departmentId}/${asset.category.toLowerCase()}/${asset.id}`;

                    const responsible =
                      getResponsibleName(
                        asset
                      );

                    return (
                      <tr
                        key={
                          asset.id
                        }
                        className={`
                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          transition-colors
                          duration-200

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* ===================================
                            ORDER
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-1.5
                            py-3.5
                            text-center
                            font-extrabold
                            tabular-nums
                            !text-slate-900
                          "
                        >
                          {(
                            index + 1
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        {/* ===================================
                            GFMIS
                        =================================== */}

                        <td
                          className="
                            overflow-hidden
                            whitespace-nowrap
                            border
                            border-black
                            px-2
                            py-3.5
                            text-center
                            text-sm
                            font-bold
                            !text-slate-900
                          "
                          title={
                            asset.governmentAssetNo ??
                            "-"
                          }
                        >
                          <span
                            className="
                              block
                              overflow-hidden
                              text-ellipsis
                              whitespace-nowrap
                            "
                          >
                            {asset.governmentAssetNo ??
                              "-"}
                          </span>
                        </td>

                        {/* ===================================
                            ASSET CODE
                        =================================== */}

                        <td
                          className="
                            overflow-hidden
                            whitespace-nowrap
                            border
                            border-black
                            px-2
                            py-3.5
                            text-center
                            text-sm
                            font-bold
                            !text-slate-900
                          "
                          title={
                            asset.officeAssetNo ??
                            "-"
                          }
                        >
                          <span
                            className="
                              block
                              overflow-hidden
                              text-ellipsis
                              whitespace-nowrap
                            "
                          >
                            {asset.officeAssetNo ??
                              "-"}
                          </span>
                        </td>

                        {/* ===================================
                            NAME
                        =================================== */}

                        <td
                          className="
                            overflow-hidden
                            whitespace-nowrap
                            border
                            border-black
                            px-2.5
                            py-3.5
                            font-bold
                            !text-slate-900
                          "
                          title={
                            [
                              asset.name,
                              asset.brand,
                              asset.model,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " / "
                              )
                          }
                        >
                          <div
                            className="
                              overflow-hidden
                              text-ellipsis
                              whitespace-nowrap
                              font-extrabold
                              !text-slate-900
                            "
                          >
                            {
                              asset.name
                            }
                          </div>

                          {(asset.brand ||
                            asset.model) && (
                            <div
                              className="
                                mt-1
                                overflow-hidden
                                text-ellipsis
                                whitespace-nowrap
                                text-xs
                                font-semibold
                                !text-slate-500
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
                            </div>
                          )}
                        </td>

                        {/* ===================================
                            QUANTITY
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-1
                            py-3.5
                            text-center
                            font-extrabold
                            tabular-nums
                            !text-slate-900
                          "
                        >
                          {Number(
                            asset.quantity ??
                              1
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        {/* ===================================
                            UNIT
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-1
                            py-3.5
                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {getAssetUnit(
                            asset
                          )}
                        </td>

                        {/* ===================================
                            RESPONSIBLE
                        =================================== */}

                        <td
                          className="
                            overflow-hidden
                            whitespace-nowrap
                            border
                            border-black
                            px-2
                            py-3.5
                            text-center
                            text-sm
                            font-bold
                            !text-slate-900
                          "
                          title={
                            responsible
                          }
                        >
                          <span
                            className="
                              block
                              overflow-hidden
                              text-ellipsis
                              whitespace-nowrap
                            "
                          >
                            {
                              responsible
                            }
                          </span>
                        </td>

                        {/* ===================================
                            STATUS

                            ปรับเป็น text-sm
                            ให้ขนาดข้อความเท่าข้อมูลอื่น
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-1
                            py-3.5
                            text-center
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              max-w-full
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              px-2
                              py-1.5

                              text-sm
                              font-extrabold
                              leading-none

                              ${getStatusClass(
                                asset.status
                              )}
                            `}
                          >
                            {statusName[
                              asset.status
                            ] ??
                              asset.status}
                          </span>
                        </td>

                        {/* ===================================
                            DETAIL
                        =================================== */}

                        <td
                          className="
                            whitespace-nowrap
                            border
                            border-black
                            px-1.5
                            py-3
                            text-center
                          "
                        >
                          <AppButton
                            href={
                              detailPath
                            }
                            variant="primary"
                            size="sm"
                          >
                            เปิด
                          </AppButton>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* ===========================================
                    EMPTY STATE
                =========================================== */

                <tr>
                  <td
                    colSpan={
                      9
                    }
                    className="
                      border
                      border-black
                      bg-white
                      px-6
                      py-16
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-16
                          w-16
                          place-items-center
                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        📋
                      </div>

                      <p
                        className="
                          mt-4
                          text-lg
                          font-extrabold
                          tracking-tight
                          !text-slate-900
                        "
                      >
                        ยังไม่มีข้อมูลครุภัณฑ์
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          leading-relaxed
                          !text-slate-500
                        "
                      >
                        เมื่อมีข้อมูลครุภัณฑ์
                        รายการจะแสดงในตารางนี้
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}