import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

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
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
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

   ใช้เป็น fallback เท่านั้น

   ลำดับ:
   1. Asset.unit
   2. UNIT:xxx ใน remark
   3. หน่วยนับ xxx ใน remark
   4. categoryUnit
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

   Import ของ Department 1 เก็บ marker:

   SOURCE:DEPARTMENT_1:1
   SOURCE:DEPARTMENT_1:2
   ...
   SOURCE:DEPARTMENT_1:446

   ใช้ค่านี้เพื่อเรียงหน้าเว็บตาม Excel ต้นฉบับจริง
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

  const sourceOrder = Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return Number.MAX_SAFE_INTEGER;
  }

  return sourceOrder;
}

/* =========================================================
   อ่านหน่วย

   ลำดับ:
   1. unit จาก Asset
   2. UNIT:xxx ใน remark
   3. หน่วยนับ xxx ใน remark
   4. fallback ตามหมวด
   ========================================================= */

function getAssetUnit(
  unit: string | null | undefined,
  remark: string | null | undefined,
  fallback: string
): string {
  /* -------------------------------------------------------
     1. Asset.unit
     ------------------------------------------------------- */

  const databaseUnit =
    normalizeText(unit);

  if (
    databaseUnit &&
    databaseUnit !== "-"
  ) {
    return databaseUnit;
  }

  if (remark) {
    /* -----------------------------------------------------
       2. UNIT:xxx
       ----------------------------------------------------- */

    const unitMarker = remark.match(
      /(?:^|\|)\s*UNIT:\s*([^|]+)/i
    );

    if (unitMarker?.[1]) {
      const value =
        normalizeText(unitMarker[1]);

      if (
        value &&
        value !== "-"
      ) {
        return value;
      }
    }

    /* -----------------------------------------------------
       3. หน่วยนับ xxx
       ----------------------------------------------------- */

    const thaiUnit = remark.match(
      /(?:^|\|)\s*หน่วยนับ\s+([^|]+)/i
    );

    if (thaiUnit?.[1]) {
      const value =
        normalizeText(thaiUnit[1]);

      if (
        value &&
        value !== "-"
      ) {
        return value;
      }
    }
  }

  /* -------------------------------------------------------
     4. fallback
     ------------------------------------------------------- */

  return fallback;
}

/* =========================================================
   ผู้รับผิดชอบ

   ลำดับ:
   1. responsibleName จากทะเบียนต้นฉบับ
   2. Officer + Section
   3. Officer
   4. Section
   5. -

   สำหรับ "กลุ่มอำนวยการ"
   ให้แสดงชื่อกลุ่มนำหน้าผู้รับผิดชอบเดิม

   ตัวอย่าง:
   หน้าห้องหัวหน้าอำนวยการ
   ->
   กลุ่มอำนวยการ / หน้าห้องหัวหน้าอำนวยการ
   ========================================================= */

function getResponsibleName(
  asset: {
    responsibleName: string | null;

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
  /* -------------------------------------------------------
     1. responsibleName
     ------------------------------------------------------- */

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
    /* -----------------------------------------------------
       2. Officer
       ----------------------------------------------------- */

    const officerName =
      asset.officer
        ? normalizeText(
            `${asset.officer.firstName} ${asset.officer.lastName}`
          )
        : "";

    /* -----------------------------------------------------
       3. Section
       ----------------------------------------------------- */

    const sectionName =
      asset.section
        ? normalizeText(
            asset.section.name
          )
        : "";

    /* -----------------------------------------------------
       4. Officer + Section
       ----------------------------------------------------- */

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

  /* -------------------------------------------------------
     กลุ่มอำนวยการ

     เพิ่มชื่อกลุ่มด้านหน้า
     แต่ป้องกันไม่ให้ซ้ำ
     ------------------------------------------------------- */

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
   PAGE
   ========================================================= */

export default async function AssetCategoryPage({
  params,
  searchParams,
}: Props) {
  await requireLogin();

  const {
    departmentId,
    category,
  } = await params;

  const { q } =
    await searchParams;

  const departmentIdNumber =
    Number(departmentId);

  if (
    !Number.isInteger(departmentIdNumber) ||
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

    const currentUser =
      await requireLogin();

    const assetIdRaw =
      String(
        formData.get("assetId") ?? ""
      ).trim();

    const assetId =
      Number(assetIdRaw);

    if (
      !Number.isInteger(assetId) ||
      assetId <= 0
    ) {
      throw new Error(
        "รหัสครุภัณฑ์ไม่ถูกต้อง"
      );
    }

    if (
      currentUser.role === "STAFF" &&
      currentUser.departmentId !==
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
      `/assets/${departmentIdNumber}/${assetCategory}`
    );
  }

  /* =======================================================
     ASSETS

     ดึง:
     - quantity
     - unit
     - responsibleName
     - remark

     โดยตรงจาก Asset
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
                /* รายการ */

                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                /* GFMIS */

                {
                  governmentAssetNo: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                /* รหัสครุภัณฑ์ */

                {
                  officeAssetNo: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                /* ผู้รับผิดชอบต้นฉบับ */

                {
                  responsibleName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                /* หน่วย */

                {
                  unit: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                /* Section */

                {
                  section: {
                    is: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },

                /* Officer ชื่อ */

                {
                  officer: {
                    is: {
                      firstName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },

                /* Officer นามสกุล */

                {
                  officer: {
                    is: {
                      lastName: {
                        contains: search,
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

      /*
       * ใช้ ID เป็นลำดับสำรอง
       *
       * ลำดับจริงจะ sort ด้วย sourceOrder
       * หลังจากดึงข้อมูลแล้ว
       */
      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     SORT ตาม Excel

     1. sourceOrder จาก SOURCE:DEPARTMENT_1:x
     2. ถ้าไม่มี sourceOrder ให้ไว้ท้ายรายการ
     3. ถ้า sourceOrder เท่ากัน ใช้ id
     ======================================================= */

  const assets = [...assetsFromDatabase].sort(
    (a, b) => {
      const orderA =
        getSourceOrder(a.remark);

      const orderB =
        getSourceOrder(b.remark);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.id - b.id;
    }
  );

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
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
          justify-center
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
            {categoryIcon[assetCategory]}{" "}
            {categoryName[assetCategory]}
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
            {department.name} —
            ทะเบียนคุมครุภัณฑ์
          </p>
        </div>

        <BackButton
          href={`/assets/${department.id}`}
        />
      </div>

      {/* ===================================================
          SEARCH
          =================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-5
        "
      >
        <form
          method="GET"
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-3
            sm:flex-row
          "
        >
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="ค้นหารายการ / รหัส GFMIS / รหัสครุภัณฑ์ / ผู้รับผิดชอบ"
            className="
              min-w-0
              flex-1
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              transition
              focus:border-emerald-600
              focus:ring-2
              focus:ring-emerald-200
            "
          />

          <button
            type="submit"
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-5
              py-3
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-105
              sm:w-auto
            "
          >
            ค้นหา
          </button>

          {search && (
            <Link
              href={`/assets/${department.id}/${assetCategory}`}
              className="
                w-full
                rounded-xl
                bg-slate-600
                px-5
                py-3
                text-center
                font-extrabold
                !text-white
                shadow-lg
                transition
                hover:bg-slate-500
                sm:w-auto
              "
            >
              ล้างการค้นหา
            </Link>
          )}
        </form>
      </div>

      {/* ===================================================
          SUMMARY
          =================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-5
        "
      >
        <div>
          <p className="text-lg font-extrabold !text-white">
            รายการ{categoryName[assetCategory]}
          </p>

          <p className="mt-1 text-sm font-semibold !text-slate-200">
            {search
              ? `ผลการค้นหา ${assets.length} รายการ`
              : `พบทั้งหมด ${assets.length} รายการ`}
          </p>
        </div>

        <Link
          href={`/assets/${department.id}/${assetCategory}/new`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            text-center
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
          "
        >
          + เพิ่มครุภัณฑ์
        </Link>
      </div>

      {/* ===================================================
          TABLE
          =================================================== */}

      <div
        className="
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
              min-w-[1500px]
              border-collapse
              border
              border-black
              text-sm
            "
          >
            <thead>
              <tr>
                <th className="w-[5%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  ลำดับ
                </th>

                <th className="w-[13%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  รหัส GFMIS
                </th>

                <th className="w-[15%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  รหัสครุภัณฑ์
                </th>

                <th className="w-[19%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  รายการครุภัณฑ์
                </th>

                <th className="w-[7%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  จำนวน
                </th>

                <th className="w-[7%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  หน่วย
                </th>

                <th className="w-[16%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  ผู้รับผิดชอบ
                </th>

                <th className="w-[9%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  สถานะ
                </th>

                <th className="w-[9%] whitespace-nowrap border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 text-center text-lg font-extrabold !text-white">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-900">
              {assets.map(
                (asset, index) => {
                  /* =======================================
                     จำนวนจริงจากฐานข้อมูล
                     ======================================= */

                  const quantity =
                    asset.quantity ?? 1;

                  /* =======================================
                     หน่วยจริงจากฐานข้อมูล / Excel
                     ======================================= */

                  const unit =
                    getAssetUnit(
                      asset.unit,
                      asset.remark,
                      categoryUnit[
                        assetCategory
                      ]
                    );

                  /* =======================================
                     ผู้รับผิดชอบ
                     ======================================= */

                  const responsible =
                    getResponsibleName(
                      asset,
                      department.name
                    );

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

                      <td className="border border-black px-4 py-3 text-center font-extrabold text-slate-900">
                        {index + 1}
                      </td>

                      {/* GFMIS */}

                      <td className="break-all border border-black px-4 py-3 text-center font-extrabold text-slate-900">
                        {asset.governmentAssetNo ||
                          "-"}
                      </td>

                      {/* รหัสครุภัณฑ์ */}

                      <td className="break-all border border-black px-4 py-3 text-center font-extrabold text-slate-900">
                        {asset.officeAssetNo ||
                          "-"}
                      </td>

                      {/* รายการ */}

                      <td className="border border-black px-4 py-3 font-extrabold text-slate-900">
                        <div className="font-extrabold">
                          {asset.name}
                        </div>

                        {(asset.brand ||
                          asset.model) && (
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {[
                              asset.brand,
                              asset.model,
                            ]
                              .filter(Boolean)
                              .join(" / ")}
                          </div>
                        )}
                      </td>

                      {/* จำนวน */}

                      <td className="whitespace-nowrap border border-black px-4 py-3 text-center font-extrabold text-slate-900">
                        {quantity}
                      </td>

                      {/* หน่วย */}

                      <td className="whitespace-nowrap border border-black px-4 py-3 text-center font-extrabold text-slate-900">
                        {unit}
                      </td>

                      {/* ผู้รับผิดชอบ */}

                      <td className="break-words border border-black px-4 py-3 text-center font-extrabold text-slate-900">
                        {responsible}
                      </td>

                      {/* สถานะ */}

                      <td className="border border-black px-4 py-3 text-center font-extrabold">
                        {asset.status ===
                          "IN_USE" && (
                          <span className="text-emerald-700">
                            ยังใช้งาน
                          </span>
                        )}

                        {asset.status ===
                          "DAMAGED" && (
                          <span className="text-orange-700">
                            ชำรุด
                          </span>
                        )}

                        {asset.status ===
                          "WAITING_DISPOSAL" && (
                          <span className="text-amber-700">
                            รอจำหน่าย
                          </span>
                        )}

                        {asset.status ===
                          "DISPOSED" && (
                          <span className="text-red-700">
                            จำหน่ายแล้ว
                          </span>
                        )}

                        {![
                          "IN_USE",
                          "DAMAGED",
                          "WAITING_DISPOSAL",
                          "DISPOSED",
                        ].includes(
                          asset.status
                        ) && (
                          <span className="text-slate-700">
                            {asset.status}
                          </span>
                        )}
                      </td>

                      {/* จัดการ */}

                      <td className="border border-black px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/assets/${department.id}/${assetCategory}/${asset.id}`}
                            className="
                              inline-block
                              whitespace-nowrap
                              rounded-xl
                              bg-gradient-to-r
                              from-slate-950
                              via-slate-800
                              to-slate-700
                              px-4
                              py-2
                              font-extrabold
                              !text-white
                              shadow-lg
                              transition
                              hover:scale-105
                              hover:from-slate-900
                              hover:via-slate-700
                              hover:to-slate-600
                            "
                          >
                            ดูรายละเอียด
                          </Link>

                          <form action={deleteAsset}>
                            <input
                              type="hidden"
                              name="assetId"
                              value={asset.id}
                            />

                            <button
                              type="submit"
                              className="
                                whitespace-nowrap
                                rounded-xl
                                bg-red-600
                                px-4
                                py-2
                                font-extrabold
                                !text-white
                                shadow-lg
                                transition
                                hover:scale-105
                                hover:bg-red-700
                              "
                            >
                              ลบ
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}

              {/* =================================================
                  EMPTY
                  ================================================= */}

              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-black
                      px-6
                      py-12
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    {search
                      ? `ไม่พบข้อมูลที่ตรงกับ "${search}"`
                      : "ยังไม่มีครุภัณฑ์ประเภทนี้ในหน่วยงาน"}
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
