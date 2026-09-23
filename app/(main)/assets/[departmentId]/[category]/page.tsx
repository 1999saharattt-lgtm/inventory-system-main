import { prisma } from "@/lib/prisma";
import {
  notFound,
  redirect,
} from "next/navigation";

import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

import AssetCategorySearch from "./AssetCategorySearch";

export const dynamic =
  "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
  }>;

  searchParams: Promise<{
    q?: string;
  }>;
};

/* =========================================================
   CATEGORY NAME
========================================================= */

const categoryName = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER:
    "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้นวาง",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
} as const;

/* =========================================================
   CATEGORY ICON
========================================================= */

const categoryIcon = {
  DESK: "🪑",
  CHAIR: "💺",
  AIR_CONDITIONER: "❄️",
  TELEPHONE: "☎️",
  CABINET: "🗄️",
  COMPUTER: "💻",
  PRINTER: "🖨️",
  OTHER: "📦",
  NO_SYSTEM: "📋",
} as const;

/* =========================================================
   CATEGORY UNIT
========================================================= */

const categoryUnit = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  CABINET: "ตู้",
  COMPUTER: "เครื่อง",
  PRINTER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
} as const;

/* =========================================================
   VALID CATEGORIES
========================================================= */

const validCategories = [
  "DESK",
  "CHAIR",
  "AIR_CONDITIONER",
  "TELEPHONE",
  "CABINET",
  "COMPUTER",
  "PRINTER",
  "OTHER",
  "NO_SYSTEM",
] as const;

type AssetCategory =
  (typeof validCategories)[number];

/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(
  value: string | null | undefined
): string {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   SOURCE ORDER
========================================================= */

function getSourceOrder(
  remark: string | null | undefined
): number {
  if (!remark) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_1:(\d+)/i
  );

  if (!match?.[1]) {
    return Number.MAX_SAFE_INTEGER;
  }

  const sourceOrder =
    Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return Number.MAX_SAFE_INTEGER;
  }

  return sourceOrder;
}

/* =========================================================
   ASSET UNIT
========================================================= */

function getAssetUnit(
  unit: string | null | undefined,
  remark: string | null | undefined,
  fallback: string
): string {
  const databaseUnit =
    normalizeText(unit);

  if (
    databaseUnit &&
    databaseUnit !== "-"
  ) {
    return databaseUnit;
  }

  if (remark) {
    const unitMarker =
      remark.match(
        /(?:^|\|)\s*UNIT:\s*([^|]+)/i
      );

    if (unitMarker?.[1]) {
      const value =
        normalizeText(
          unitMarker[1]
        );

      if (
        value &&
        value !== "-"
      ) {
        return value;
      }
    }

    const thaiUnit =
      remark.match(
        /(?:^|\|)\s*หน่วยนับ\s+([^|]+)/i
      );

    if (thaiUnit?.[1]) {
      const value =
        normalizeText(
          thaiUnit[1]
        );

      if (
        value &&
        value !== "-"
      ) {
        return value;
      }
    }
  }

  return fallback;
}

/* =========================================================
   RESPONSIBLE NAME
========================================================= */

function getResponsibleName(
  asset: {
    responsibleName:
      | string
      | null;

    officer: {
      firstName: string;
      lastName: string;
    } | null;

    section: {
      name: string;
    } | null;
  },
  departmentName: string
): string {
  const original =
    normalizeText(
      asset.responsibleName
    );

  let responsibleName = "";

  if (
    original &&
    original !== "-"
  ) {
    responsibleName =
      original;
  } else {
    const officerName =
      asset.officer
        ? normalizeText(
            `${asset.officer.firstName} ${asset.officer.lastName}`
          )
        : "";

    const sectionName =
      asset.section
        ? normalizeText(
            asset.section.name
          )
        : "";

    if (
      officerName &&
      sectionName
    ) {
      responsibleName =
        `${officerName} / ${sectionName}`;
    } else if (officerName) {
      responsibleName =
        officerName;
    } else if (sectionName) {
      responsibleName =
        sectionName;
    } else {
      responsibleName = "-";
    }
  }

  const normalizedDepartmentName =
    normalizeText(
      departmentName
    );

  if (
    normalizedDepartmentName ===
      "กลุ่มอำนวยการ" &&
    responsibleName !== "-"
  ) {
    const prefix =
      `${normalizedDepartmentName} / `;

    if (
      responsibleName ===
      normalizedDepartmentName
    ) {
      return responsibleName;
    }

    if (
      responsibleName.startsWith(
        prefix
      )
    ) {
      return responsibleName;
    }

    return `${normalizedDepartmentName} / ${responsibleName}`;
  }

  return responsibleName;
}

/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "IN_USE":
      return {
        label: "ยังใช้งาน",
        className:
          "bg-emerald-100 !text-emerald-800",
      };

    case "DAMAGED":
      return {
        label: "ชำรุด",
        className:
          "bg-orange-100 !text-orange-800",
      };

    case "WAITING_DISPOSAL":
      return {
        label: "รอจำหน่าย",
        className:
          "bg-amber-100 !text-amber-800",
      };

    case "DISPOSED":
      return {
        label: "จำหน่ายแล้ว",
        className:
          "bg-red-100 !text-red-800",
      };

    default:
      return {
        label: status || "-",
        className:
          "bg-slate-100 !text-slate-700",
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
     USER
  ======================================================= */

  const currentUser =
    await requireLogin();

  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId,
    category,
  } = await params;

  const { q } =
    await searchParams;

  const departmentIdNumber =
    Number(departmentId);

  if (
    !Number.isInteger(
      departmentIdNumber
    ) ||
    departmentIdNumber <= 0
  ) {
    notFound();
  }

  const normalizedCategory =
    category.toUpperCase();

  if (
    !validCategories.includes(
      normalizedCategory as AssetCategory
    )
  ) {
    notFound();
  }

  const assetCategory =
    normalizedCategory as AssetCategory;

  const search =
    normalizeText(q);

  /* =======================================================
     DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentIdNumber,
      },
    });

  if (!department) {
    notFound();
  }

  /* =======================================================
     DELETE ASSET
  ======================================================= */

  async function deleteAsset(
    formData: FormData
  ) {
    "use server";

    const user =
      await requireLogin();

    const assetIdRaw =
      String(
        formData.get(
          "assetId"
        ) ?? ""
      ).trim();

    const assetId =
      Number(assetIdRaw);

    if (
      !Number.isInteger(
        assetId
      ) ||
      assetId <= 0
    ) {
      throw new Error(
        "รหัสครุภัณฑ์ไม่ถูกต้อง"
      );
    }

    if (
      user.role === "STAFF" &&
      user.departmentId !==
        departmentIdNumber
    ) {
      throw new Error(
        "ไม่มีสิทธิ์ลบครุภัณฑ์ในหน่วยงานนี้"
      );
    }

    const asset =
      await prisma.asset.findFirst({
        where: {
          id: assetId,

          departmentId:
            departmentIdNumber,

          category:
            assetCategory,
        },

        select: {
          id: true,
        },
      });

    if (!asset) {
      throw new Error(
        "ไม่พบครุภัณฑ์ที่ต้องการลบ"
      );
    }

    await prisma.asset.delete({
      where: {
        id: asset.id,
      },
    });

    redirect(
      `/assets/${departmentIdNumber}/${assetCategory.toLowerCase()}`
    );
  }

  /* =======================================================
     LOAD ASSETS
  ======================================================= */

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId:
          departmentIdNumber,

        category:
          assetCategory,

        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains:
                      search,
                    mode: "insensitive",
                  },
                },

                {
                  governmentAssetNo:
                    {
                      contains:
                        search,
                      mode: "insensitive",
                    },
                },

                {
                  officeAssetNo: {
                    contains:
                      search,
                    mode: "insensitive",
                  },
                },

                {
                  responsibleName:
                    {
                      contains:
                        search,
                      mode: "insensitive",
                    },
                },

                {
                  unit: {
                    contains:
                      search,
                    mode: "insensitive",
                  },
                },

                {
                  section: {
                    is: {
                      name: {
                        contains:
                          search,
                        mode: "insensitive",
                      },
                    },
                  },
                },

                {
                  officer: {
                    is: {
                      firstName: {
                        contains:
                          search,
                        mode: "insensitive",
                      },
                    },
                  },
                },

                {
                  officer: {
                    is: {
                      lastName: {
                        contains:
                          search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        section: {
          select: {
            id: true,
            name: true,
          },
        },

        officer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        id: "asc",
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
      orderA !== orderB
    ) {
      return (
        orderA - orderB
      );
    }

    return a.id - b.id;
  });

  /* =======================================================
     PERMISSION
  ======================================================= */

  const canManage =
    currentUser.role ===
      "ADMIN" ||
    (currentUser.role ===
      "STAFF" &&
      currentUser.departmentId ===
        departmentIdNumber);

  /* =======================================================
     UI
  ======================================================= */

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
        subtitle={`${department.name} — ทะเบียนคุมครุภัณฑ์`}
        actions={
          <>
            {/* ===============================================
                ADD ASSET
            =============================================== */}

            {canManage && (
              <AppButton
                href={`/assets/${department.id}/${assetCategory.toLowerCase()}/new`}
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

            {/* ===============================================
                BACK
            =============================================== */}

            <AppButton
              href={`/assets/${department.id}`}
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
        initialValue={search}
        resultCount={
          assets.length
        }
        pathname={`/assets/${department.id}/${assetCategory.toLowerCase()}`}
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title={`รายการ${categoryName[assetCategory]}`}
        subtitle={`${department.name} • ทะเบียนคุมครุภัณฑ์`}
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
              min-w-[1500px]
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
              {assets.length > 0 ? (
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
                        department.name
                      );

                    const status =
                      getStatusLabel(
                        asset.status
                      );

                    return (
                      <tr
                        key={
                          asset.id
                        }
                        className={`
                          ${
                            index % 2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          transition-colors
                          duration-200

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* ORDER */}

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
                            index + 1
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        {/* GFMIS */}

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

                        {/* ASSET CODE */}

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

                        {/* NAME */}

                        <td
                          className="
                            min-w-[280px]
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

                        {/* QUANTITY */}

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

                        {/* UNIT */}

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

                        {/* RESPONSIBLE */}

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

                        {/* STATUS */}

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

                        {/* ACTIONS */}

                        <td
                          className="
                            min-w-[260px]
                            whitespace-nowrap
                            border
                            border-black
                            px-4
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >
                            <AppButton
                              href={`/assets/${department.id}/${assetCategory.toLowerCase()}/${asset.id}`}
                              variant="primary"
                              size="sm"
                            >
                              ดูรายละเอียด
                            </AppButton>

                            {canManage && (
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
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                /* =============================================
                   EMPTY
                ============================================= */

                <tr>
                  <td
                    colSpan={9}
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
                            href={`/assets/${department.id}/${assetCategory.toLowerCase()}`}
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