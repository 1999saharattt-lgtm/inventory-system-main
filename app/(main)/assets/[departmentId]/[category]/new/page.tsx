import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import AssetResponsibleFields from "./AssetResponsibleFields";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
  }>;
};

/* =========================================================
   CATEGORY
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

const categoryIcon = {
  DESK: "🪑",
  CHAIR: "💺",
  AIR_CONDITIONER: "❄️",
  CABINET: "🗄️",
  COMPUTER: "💻",
  PRINTER: "🖨️",
  TELEPHONE: "☎️",
  OTHER: "📦",
  NO_SYSTEM: "📋",
} as const;

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
   PAGE
   ========================================================= */

export default async function NewAssetPage({
  params,
}: Props) {
  const user = await requireLogin();

  const {
    departmentId,
    category,
  } = await params;

  const departmentIdNumber =
    Number(departmentId);

  const normalizedCategory =
    category.toUpperCase();

  if (
    !Number.isInteger(departmentIdNumber) ||
    departmentIdNumber <= 0 ||
    !validCategories.includes(
      normalizedCategory as AssetCategoryValue
    )
  ) {
    notFound();
  }

  const assetCategory =
    normalizedCategory as AssetCategoryValue;

  /* =======================================================
     สิทธิ์ผู้ใช้งาน
     ======================================================= */

  if (
    user.role === "STAFF" &&
    user.departmentId !==
      departmentIdNumber
  ) {
    redirect("/");
  }

  /* =======================================================
     ดึงข้อมูลหน่วยงาน
     ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentIdNumber,
      },

      include: {
        officers: {
          orderBy: [
            {
              firstName: "asc",
            },
            {
              lastName: "asc",
            },
          ],
        },

        sections: {
          orderBy: {
            id: "asc",
          },

          include: {
            officers: {
              orderBy: [
                {
                  firstName: "asc",
                },
                {
                  lastName: "asc",
                },
              ],
            },
          },
        },
      },
    });

  if (!department) {
    notFound();
  }

  /* =======================================================
     CREATE ASSET
     ======================================================= */

  async function createAsset(
    formData: FormData
  ) {
    "use server";

    const currentUser =
      await requireLogin();

    /* =====================================================
       อ่านข้อมูลจาก Form
       ===================================================== */

    const name =
      normalizeText(
        String(
          formData.get("name") ?? ""
        )
      );

    const brand =
      normalizeText(
        String(
          formData.get("brand") ?? ""
        )
      );

    const model =
      normalizeText(
        String(
          formData.get("model") ?? ""
        )
      );

    const serialNumber =
      normalizeText(
        String(
          formData.get("serialNumber") ??
            ""
        )
      );

    const governmentAssetNo =
      normalizeText(
        String(
          formData.get(
            "governmentAssetNo"
          ) ?? ""
        )
      );

    const officeAssetNo =
      normalizeText(
        String(
          formData.get(
            "officeAssetNo"
          ) ?? ""
        )
      );

    const quantityRaw =
      String(
        formData.get("quantity") ?? "1"
      ).trim();

    const unit =
      normalizeText(
        String(
          formData.get("unit") ?? ""
        )
      );

    const sectionIdRaw =
      String(
        formData.get("sectionId") ?? ""
      ).trim();

    const officerIdRaw =
      String(
        formData.get("officerId") ?? ""
      ).trim();

    const purchaseDateRaw =
      String(
        formData.get("purchaseDate") ?? ""
      ).trim();

    const priceRaw =
      String(
        formData.get("price") ?? ""
      ).trim();

    const location =
      normalizeText(
        String(
          formData.get("location") ?? ""
        )
      );

    const remark =
      normalizeText(
        String(
          formData.get("remark") ?? ""
        )
      );

    /* =====================================================
       ตรวจชื่อครุภัณฑ์
       ===================================================== */

    if (!name) {
      throw new Error(
        "กรุณาระบุชื่อครุภัณฑ์"
      );
    }

    /* =====================================================
       ตรวจสิทธิ์
       ===================================================== */

    if (
      currentUser.role === "STAFF" &&
      currentUser.departmentId !==
        departmentIdNumber
    ) {
      throw new Error(
        "ไม่มีสิทธิ์เพิ่มครุภัณฑ์ในหน่วยงานนี้"
      );
    }

    /* =====================================================
       QUANTITY
       ===================================================== */

    const quantity =
      Number(quantityRaw);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "จำนวนครุภัณฑ์ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป"
      );
    }

    /* =====================================================
       UNIT
       ===================================================== */

    const assetUnit =
      unit ||
      categoryUnit[assetCategory];

    /* =====================================================
       ตรวจ Department
       ===================================================== */

    const targetDepartment =
      await prisma.department.findUnique({
        where: {
          id: departmentIdNumber,
        },

        select: {
          id: true,

          sections: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!targetDepartment) {
      throw new Error(
        "ไม่พบหน่วยงานที่เลือก"
      );
    }

    const hasTargetSections =
      targetDepartment.sections.length > 0;

    /* =====================================================
       SECTION
       ===================================================== */

    let selectedSectionId:
      | number
      | null = null;

    if (
      hasTargetSections &&
      sectionIdRaw
    ) {
      selectedSectionId =
        Number(sectionIdRaw);

      if (
        !Number.isInteger(
          selectedSectionId
        ) ||
        selectedSectionId <= 0
      ) {
        throw new Error(
          "กลุ่มงานไม่ถูกต้อง"
        );
      }

      const selectedSection =
        await prisma.section.findFirst({
          where: {
            id: selectedSectionId,

            departmentId:
              departmentIdNumber,
          },

          select: {
            id: true,
          },
        });

      if (!selectedSection) {
        throw new Error(
          "กลุ่มงานไม่อยู่ในหน่วยงานที่เลือก"
        );
      }
    }

    /* =====================================================
       OFFICER
       ===================================================== */

    const officerId =
      officerIdRaw
        ? Number(officerIdRaw)
        : null;

    if (
      officerId !== null &&
      (!Number.isInteger(officerId) ||
        officerId <= 0)
    ) {
      throw new Error(
        "ผู้ครอบครองไม่ถูกต้อง"
      );
    }

    let sectionId:
      | number
      | null =
      selectedSectionId;

    let responsibleName:
      | string
      | null = null;

    /* =====================================================
       ตรวจ Officer
       ===================================================== */

    if (officerId !== null) {
      const officer =
        await prisma.officer.findFirst({
          where: {
            id: officerId,

            OR: [
              {
                departmentId:
                  departmentIdNumber,
              },

              {
                section: {
                  is: {
                    departmentId:
                      departmentIdNumber,
                  },
                },
              },
            ],
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            sectionId: true,

            section: {
              select: {
                id: true,
                name: true,
                departmentId: true,
              },
            },
          },
        });

      if (!officer) {
        throw new Error(
          "ผู้ครอบครองไม่อยู่ในหน่วยงานที่เลือก"
        );
      }

      /* ===================================================
         ใช้ Section จริงของ Officer
         =================================================== */

      if (hasTargetSections) {
        if (
          officer.sectionId !== null
        ) {
          const officerSectionExists =
            targetDepartment.sections.some(
              (section) =>
                section.id ===
                officer.sectionId
            );

          if (!officerSectionExists) {
            throw new Error(
              "กลุ่มงานของผู้ครอบครองไม่อยู่ในหน่วยงานที่เลือก"
            );
          }

          sectionId =
            officer.sectionId;
        }
      } else {
        sectionId = null;
      }

      /* ===================================================
         เก็บ responsibleName

         ทำให้หน้ารายการที่อ่าน responsibleName ก่อน
         สามารถแสดงชื่อผู้รับผิดชอบได้ทันที
         =================================================== */

      const officerName =
        normalizeText(
          `${officer.firstName} ${officer.lastName}`
        );

      if (
        officerName &&
        officer.section?.name
      ) {
        responsibleName =
          `${officerName} / ${normalizeText(
            officer.section.name
          )}`;
      } else if (officerName) {
        responsibleName =
          officerName;
      }
    }

    /* =====================================================
       ถ้าไม่ได้เลือก Officer แต่เลือก Section
       ใช้ชื่อ Section เป็น responsibleName
       ===================================================== */

    if (
      !responsibleName &&
      sectionId !== null
    ) {
      const section =
        await prisma.section.findFirst({
          where: {
            id: sectionId,
            departmentId:
              departmentIdNumber,
          },

          select: {
            name: true,
          },
        });

      if (section?.name) {
        responsibleName =
          normalizeText(
            section.name
          );
      }
    }

    /* =====================================================
       GFMIS / OFFICE ASSET NO

       สำคัญ:
       governmentAssetNo และ officeAssetNo
       ไม่ใช่ @unique ใน Prisma

       ข้อมูลทะเบียนต้นฉบับสามารถมีรหัสซ้ำได้

       ดังนั้น:
       - ไม่ใช้ findUnique()
       - ไม่ Reject เมื่อพบเลขซ้ำ
       - บันทึกค่าตามที่ผู้ใช้กรอก
       ===================================================== */

    /* =====================================================
       PRICE
       ===================================================== */

    let price:
      | number
      | null = null;

    if (priceRaw) {
      price = Number(priceRaw);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error(
          "ราคาครุภัณฑ์ไม่ถูกต้อง"
        );
      }
    }

    /* =====================================================
       PURCHASE DATE
       ===================================================== */

    let purchaseDate:
      | Date
      | null = null;

    if (purchaseDateRaw) {
      const parsedDate =
        new Date(
          `${purchaseDateRaw}T00:00:00`
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        throw new Error(
          "วันที่ได้มาไม่ถูกต้อง"
        );
      }

      purchaseDate =
        parsedDate;
    }

    /* =====================================================
       CREATE
       ===================================================== */

    await prisma.asset.create({
      data: {
        name,
        category:
          assetCategory,

        brand:
          brand || null,

        model:
          model || null,

        serialNumber:
          serialNumber || null,

        quantity,

        unit:
          assetUnit || null,

        governmentAssetNo:
          governmentAssetNo || null,

        officeAssetNo:
          officeAssetNo || null,

        departmentId:
          departmentIdNumber,

        sectionId,
        officerId,

        responsibleName,

        status:
          "IN_USE",

        purchaseDate,
        price,

        location:
          location || null,

        remark:
          remark || null,
      },
    });

    redirect(
      `/assets/${departmentIdNumber}/${assetCategory}`
    );
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div
      className="
        min-h-screen
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        bg-white
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
            {categoryIcon[
              assetCategory
            ]}{" "}
            เพิ่ม
            {categoryName[
              assetCategory
            ]}
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
            {department.name} —
            ทะเบียนคุมครุภัณฑ์
          </p>
        </div>

        <Link
          href={`/assets/${department.id}/${assetCategory}`}
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* ===================================================
          FORM
          =================================================== */}

      <form
        action={createAsset}
        className="
          mx-auto
          w-full
          max-w-4xl
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
        {/* =================================================
            ข้อมูลครุภัณฑ์
            ================================================= */}

        <div>
          <h2 className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-lg font-extrabold !text-white">
            📋 ข้อมูลครุภัณฑ์
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* รายการ */}

            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-extrabold !text-slate-200"
              >
                รายการครุภัณฑ์{" "}
                <span className="text-red-400">
                  *
                </span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder={`เช่น ${
                  categoryName[
                    assetCategory
                  ]
                }`}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* ยี่ห้อ */}

            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-extrabold !text-slate-200"
              >
                ยี่ห้อ
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* รุ่น */}

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-extrabold !text-slate-200"
              >
                รุ่น
              </label>

              <input
                id="model"
                name="model"
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Serial */}

            <div className="sm:col-span-2">
              <label
                htmlFor="serialNumber"
                className="block text-sm font-extrabold !text-slate-200"
              >
                Serial Number
              </label>

              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* จำนวน */}

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-extrabold !text-slate-200"
              >
                จำนวน{" "}
                <span className="text-red-400">
                  *
                </span>
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={1}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* หน่วย */}

            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-extrabold !text-slate-200"
              >
                หน่วย
              </label>

              <input
                id="unit"
                name="unit"
                type="text"
                defaultValue={
                  categoryUnit[
                    assetCategory
                  ]
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            เลขทะเบียน
            ================================================= */}

        <div className="mt-6">
          <h2 className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-lg font-extrabold !text-white">
            🔖 เลขทะเบียนครุภัณฑ์
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="governmentAssetNo"
                className="block text-sm font-extrabold !text-slate-200"
              >
                รหัส GFMIS
              </label>

              <input
                id="governmentAssetNo"
                name="governmentAssetNo"
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label
                htmlFor="officeAssetNo"
                className="block text-sm font-extrabold !text-slate-200"
              >
                รหัสครุภัณฑ์
              </label>

              <input
                id="officeAssetNo"
                name="officeAssetNo"
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            ผู้รับผิดชอบ
            ================================================= */}

        <div className="mt-6">
          <h2 className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-lg font-extrabold !text-white">
            👤 ผู้รับผิดชอบ
          </h2>

          <AssetResponsibleFields
            sections={
              department.sections
            }
            officers={
              department.officers
            }
            departmentName={
              department.name
            }
            departmentId={
              department.id
            }
          />
        </div>

        {/* =================================================
            ข้อมูลเพิ่มเติม
            ================================================= */}

        <div className="mt-6">
          <h2 className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-lg font-extrabold !text-white">
            📌 ข้อมูลเพิ่มเติม
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* วันที่ได้มา */}

            <div>
              <label
                htmlFor="purchaseDate"
                className="block text-sm font-extrabold !text-slate-200"
              >
                วันที่ได้มา
              </label>

              <input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* ราคา */}

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-extrabold !text-slate-200"
              >
                ราคา
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* สถานที่ */}

            <div className="sm:col-span-2">
              <label
                htmlFor="location"
                className="block text-sm font-extrabold !text-slate-200"
              >
                สถานที่ตั้ง
              </label>

              <input
                id="location"
                name="location"
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            หมายเหตุ
            ================================================= */}

        <div className="mt-6">
          <h2 className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-lg font-extrabold !text-white">
            📝 หมายเหตุ
          </h2>

          <div className="mt-4">
            <textarea
              id="remark"
              name="remark"
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* =================================================
            BUTTONS
            ================================================= */}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/assets/${department.id}/${assetCategory}`}
            className="w-full rounded-xl bg-slate-700 px-8 py-3 text-center text-lg font-extrabold !text-white shadow-lg transition hover:bg-slate-800 sm:w-auto"
          >
            ยกเลิก
          </Link>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 font-extrabold !text-white shadow-lg transition hover:scale-105 hover:from-emerald-700 hover:to-green-600 active:scale-[0.98] sm:w-auto"
          >
            💾 บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}