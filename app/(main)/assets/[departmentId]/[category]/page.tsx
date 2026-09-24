import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

import AssetCategorySearch from "./AssetCategorySearch";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
  }>;

  searchParams?: Promise<{
    search?: string | string[];
    q?: string | string[];
  }>;
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  TELEPHONE: "เครื่องโทรศัพท์",
  CABINET: "ตู้และชั้น",
  SHELF: "ชั้นวาง",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอภาพ",
  PRINTER: "เครื่องพิมพ์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "🪑",
  AIR_CONDITIONER: "❄️",
  TELEPHONE: "☎️",
  CABINET: "🗄️",
  SHELF: "🗃️",
  COMPUTER: "💻",
  MONITOR: "🖥️",
  PRINTER: "🖨️",
  OTHER: "📦",
  NO_SYSTEM: "📋",
};

/* =========================================================
   CATEGORY UNIT
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
   STATUS
========================================================= */

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

/* =========================================================
   SOURCE ORDER
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
   UNIT FROM REMARK
========================================================= */

function getUnitFromRemark(
  remark: string | null
) {
  if (!remark) {
    return "";
  }

  const patterns = [
    /(?:^|\|)\s*UNIT:([^|]+)/i,
    /(?:^|\|)\s*หน่วย:([^|]+)/i,
  ];

  for (const pattern of patterns) {
    const match =
      remark.match(pattern);

    if (match?.[1]) {
      const value =
        match[1].trim();

      if (
        value &&
        value !== "-"
      ) {
        return value;
      }
    }
  }

  return "";
}

/* =========================================================
   ASSET UNIT
========================================================= */

function getAssetUnit(
  unit: string | null,
  remark: string | null,
  fallbackUnit: string
) {
  const originalUnit =
    unit?.trim();

  if (
    originalUnit &&
    originalUnit !== "-"
  ) {
    return originalUnit;
  }

  const remarkUnit =
    getUnitFromRemark(
      remark
    );

  if (remarkUnit) {
    return remarkUnit;
  }

  return (
    fallbackUnit ||
    "รายการ"
  );
}

/* =========================================================
   RESPONSIBLE NAME
========================================================= */

function getResponsibleName(
  asset: {
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
  },
  departmentName: string
) {
  const cleanDepartmentName =
    departmentName?.trim() ||
    asset.department.name?.trim() ||
    "";

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
      cleanDepartmentName &&
      (
        originalResponsibleName ===
          cleanDepartmentName ||
        originalResponsibleName.startsWith(
          `${cleanDepartmentName} /`
        )
      )
    ) {
      return originalResponsibleName;
    }

    if (
      cleanDepartmentName
    ) {
      return `${cleanDepartmentName} / ${originalResponsibleName}`;
    }

    return originalResponsibleName;
  }

  /* =======================================================
     SECTION
  ======================================================= */

  const sectionName =
    asset.section?.name?.trim();

  if (sectionName) {
    if (
      cleanDepartmentName
    ) {
      return `${cleanDepartmentName} / ${sectionName}`;
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
    if (
      cleanDepartmentName
    ) {
      return `${cleanDepartmentName} / ${officerName}`;
    }

    return officerName;
  }

  if (
    cleanDepartmentName
  ) {
    return cleanDepartmentName;
  }

  return "-";
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "IN_USE":
      return {
        label:
          statusName[
            status
          ] ?? "ยังใช้งาน",

        className: `
          bg-emerald-100
          !text-emerald-800
        `,
      };

    case "WAITING_DISPOSAL":
      return {
        label:
          statusName[
            status
          ] ?? "รอจำหน่าย",

        className: `
          bg-amber-100
          !text-amber-800
        `,
      };

    case "DAMAGED":
      return {
        label:
          statusName[
            status
          ] ?? "ชำรุด",

        className: `
          bg-red-100
          !text-red-800
        `,
      };

    case "DISPOSED":
      return {
        label:
          statusName[
            status
          ] ?? "จำหน่ายแล้ว",

        className: `
          bg-slate-200
          !text-slate-800
        `,
      };

    default:
      return {
        label:
          statusName[
            status
          ] ?? status,

        className: `
          bg-slate-100
          !text-slate-700
        `,
      };
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function AssetCategoryPage({
  params,
  searchParams,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const resolvedParams =
    await params;

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {};

  const departmentId =
    Number(
      resolvedParams.departmentId
    );

  const assetCategory =
    decodeURIComponent(
      resolvedParams.category
    )
      .trim()
      .toUpperCase();

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0
  ) {
    notFound();
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      categoryName,
      assetCategory
    )
  ) {
    notFound();
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  const rawSearch =
    resolvedSearchParams.search ??
    resolvedSearchParams.q ??
    "";

  const search =
    (
      Array.isArray(
        rawSearch
      )
        ? rawSearch[0]
        : rawSearch
    )?.trim() ?? "";

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
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

     สำคัญ:
     Server Action ด้านล่างจะใช้ primitive เหล่านี้
     แทนการอ้าง department โดยตรง

     ป้องกัน TypeScript:
     'department' is possibly 'null'
  ======================================================= */

  const departmentIdForAction =
    department.id;

  const departmentNameForDisplay =
    department.name;

  const assetCategoryForAction =
    assetCategory;

  const categorySlug =
    assetCategory.toLowerCase();

  /* =======================================================
     ASSETS
  ======================================================= */

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId:
          departmentIdForAction,

        category:
          assetCategory as any,

        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains:
                      search,

                    mode:
                      "insensitive",
                  },
                },

                {
                  governmentAssetNo: {
                    contains:
                      search,

                    mode:
                      "insensitive",
                  },
                },

                {
                  officeAssetNo: {
                    contains:
                      search,

                    mode:
                      "insensitive",
                  },
                },

                {
                  brand: {
                    contains:
                      search,

                    mode:
                      "insensitive",
                  },
                },

                {
                  model: {
                    contains:
                      search,

                    mode:
                      "insensitive",
                  },
                },

                {
                  responsibleName: {
                    contains:
                      search,

                    mode:
                      "insensitive",
                  },
                },
              ],
            }
          : {}),
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

    if (
      orderA !== null
    ) {
      return -1;
    }

    if (
      orderB !== null
    ) {
      return 1;
    }

    return (
      a.id -
      b.id
    );
  });

  /* =======================================================
     PERMISSION
  ======================================================= */

  const canManage =
    true;

  /* =======================================================
     DELETE ASSET
  ======================================================= */

  async function deleteAsset(
    formData: FormData
  ) {
    "use server";

    const assetId =
      Number(
        formData.get(
          "assetId"
        )
      );

    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (
      !Number.isInteger(
        assetId
      ) ||
      assetId <= 0
    ) {
      return;
    }

    /* =====================================================
       ตรวจสอบว่าครุภัณฑ์อยู่ในหน่วยงาน
       และประเภทนี้จริง
    ===================================================== */

    const assetToDelete =
      await prisma.asset.findFirst({
        where: {
          id: assetId,

          departmentId:
            departmentIdForAction,

          category:
            assetCategoryForAction as any,
        },

        select: {
          id: true,
        },
      });

    if (
      !assetToDelete
    ) {
      return;
    }

    /* =====================================================
       DELETE
    ===================================================== */

    await prisma.asset.delete({
      where: {
        id:
          assetToDelete.id,
      },
    });

    /* =====================================================
       REVALIDATE
    ===================================================== */

    revalidatePath(
      `/assets/${departmentIdForAction}`
    );

    revalidatePath(
      `/assets/${departmentIdForAction}/${assetCategoryForAction.toLowerCase()}`
    );

    revalidatePath(
      `/assets/${departmentIdForAction}/all`
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon={
          categoryIcon[
            assetCategory
          ]
        }
        title={
          categoryName[
            assetCategory
          ]
        }
        subtitle={`${departmentNameForDisplay} — ทะเบียนคุมครุภัณฑ์`}
        actions={
          <>
            {canManage && (
              <AppButton
                href={`/assets/${departmentIdForAction}/${categorySlug}/new`}
                variant="primary"
                size="md"
                icon={
                  <span
                    aria-hidden="true"
                  >
                    ＋
                  </span>
                }
              >
                เพิ่มครุภัณฑ์
              </AppButton>
            )}

            <AppButton
              href={`/assets/${departmentIdForAction}`}
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
          SEARCH
      ===================================================== */}

      <AssetCategorySearch
        initialValue={
          search
        }
        resultCount={
          assets.length
        }
        pathname={`/assets/${departmentIdForAction}/${categorySlug}`}
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title={`รายการ${categoryName[assetCategory]}`}
        subtitle={`${departmentNameForDisplay} • ทะเบียนคุมครุภัณฑ์`}
        badge={`${assets.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1650px]
              border-collapse
              bg-white
              text-sm
            "
          >
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
                  "จัดการ",
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
                        px-4
                        py-4
                        text-center
                        text-base
                        font-extrabold
                        !text-white
                        sm:text-lg
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
                    const quantity =
                      asset.quantity ??
                      1;

                    const unit =
                      getAssetUnit(
                        asset.unit,
                        asset.remark,
                        categoryUnit[
                          assetCategory
                        ]
                      );

                    const responsible =
                      getResponsibleName(
                        asset,
                        departmentNameForDisplay
                      );

                    const status =
                      getStatusLabel(
                        asset.status
                      );

                    const detailHref =
                      `/assets/${departmentIdForAction}/${categorySlug}/${asset.id}`;

                    const editHref =
                      `${detailHref}/edit`;

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
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            tabular-nums
                            !text-slate-900
                          "
                        >
                          {(
                            index +
                            1
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        {/* ===================================
                            GFMIS
                        =================================== */}

                        <td
                          className="
                            min-w-[180px]
                            break-all
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {asset.governmentAssetNo ||
                            "-"}
                        </td>

                        {/* ===================================
                            ASSET CODE
                        =================================== */}

                        <td
                          className="
                            min-w-[200px]
                            break-all
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {asset.officeAssetNo ||
                            "-"}
                        </td>

                        {/* ===================================
                            NAME
                        =================================== */}

                        <td
                          className="
                            min-w-[280px]
                            break-words
                            border
                            border-black
                            px-4
                            py-3.5
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          <div
                            className="
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
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            tabular-nums
                            !text-slate-900
                          "
                        >
                          {Number(
                            quantity
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
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {unit}
                        </td>

                        {/* ===================================
                            RESPONSIBLE
                        =================================== */}

                        <td
                          className="
                            min-w-[240px]
                            break-words
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {
                            responsible
                          }
                        </td>

                        {/* ===================================
                            STATUS
                        =================================== */}

                        <td
                          className="
                            min-w-[150px]
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3.5
                            text-center
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              items-center
                              justify-center
                              whitespace-nowrap
                              rounded-full
                              px-3
                              py-1.5
                              text-xs
                              font-extrabold
                              ${status.className}
                            `}
                          >
                            {
                              status.label
                            }
                          </span>
                        </td>

                        {/* ===================================
                            DETAIL
                        =================================== */}

                        <td
                          className="
                            min-w-[130px]
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3
                            text-center
                          "
                        >
                          <AppButton
                            href={
                              detailHref
                            }
                            variant="primary"
                            size="sm"
                          >
                            เปิด
                          </AppButton>
                        </td>

                        {/* ===================================
                            ACTIONS
                        =================================== */}

                        <td
                          className="
                            min-w-[220px]
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3
                            text-center
                          "
                        >
                          {canManage ? (
                            <div
                              className="
                                flex
                                items-center
                                justify-center
                                gap-2
                              "
                            >
                              {/* EDIT */}

                              <AppButton
                                href={
                                  editHref
                                }
                                variant="secondary"
                                size="sm"
                              >
                                แก้ไข
                              </AppButton>

                              {/* DELETE */}

                              <form
                                action={
                                  deleteAsset
                                }
                              >
                                <input
                                  type="hidden"
                                  name="assetId"
                                  value={
                                    asset.id
                                  }
                                />

                                <AppButton
                                  type="submit"
                                  variant="danger"
                                  size="sm"
                                >
                                  ลบ
                                </AppButton>
                              </form>
                            </div>
                          ) : (
                            <span
                              className="
                                font-semibold
                                !text-slate-400
                              "
                            >
                              -
                            </span>
                          )}
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
                      10
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
                        {search
                          ? "🔍"
                          : categoryIcon[
                              assetCategory
                            ]}
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
                        {search
                          ? "ไม่พบข้อมูลที่ค้นหา"
                          : `ยังไม่มี${categoryName[assetCategory]}ในหน่วยงานนี้`}
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
                        {search
                          ? `ไม่พบข้อมูลที่ตรงกับ "${search}"`
                          : "เมื่อมีการเพิ่มครุภัณฑ์ ข้อมูลจะแสดงในตารางนี้"}
                      </p>

                      {search && (
                        <div className="mt-5">
                          <AppButton
                            href={`/assets/${departmentIdForAction}/${categorySlug}`}
                            variant="primary"
                            size="md"
                          >
                            แสดงรายการทั้งหมด
                          </AppButton>
                        </div>
                      )}
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