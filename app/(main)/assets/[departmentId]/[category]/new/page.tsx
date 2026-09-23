import { prisma } from "@/lib/prisma";
import {
  notFound,
  redirect,
} from "next/navigation";

import { requireLogin } from "@/lib/auth";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

import AssetResponsibleFields from "./AssetResponsibleFields";

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
};

/* =========================================================
   CATEGORY
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
    !Number.isInteger(
      departmentIdNumber
    ) ||
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
     PERMISSION
  ======================================================= */

  if (
    user.role === "STAFF" &&
    user.departmentId !==
      departmentIdNumber
  ) {
    redirect("/");
  }

  /* =======================================================
     DEPARTMENT
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

  const backHref =
    `/assets/${department.id}/${assetCategory.toLowerCase()}`;

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
       FORM DATA
    ===================================================== */

    const name =
      normalizeText(
        String(
          formData.get("name") ??
            ""
        )
      );

    const brand =
      normalizeText(
        String(
          formData.get("brand") ??
            ""
        )
      );

    const model =
      normalizeText(
        String(
          formData.get("model") ??
            ""
        )
      );

    const serialNumber =
      normalizeText(
        String(
          formData.get(
            "serialNumber"
          ) ?? ""
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
        formData.get(
          "quantity"
        ) ?? "1"
      ).trim();

    const unit =
      normalizeText(
        String(
          formData.get("unit") ??
            ""
        )
      );

    const sectionIdRaw =
      String(
        formData.get(
          "sectionId"
        ) ?? ""
      ).trim();

    const officerIdRaw =
      String(
        formData.get(
          "officerId"
        ) ?? ""
      ).trim();

    const purchaseDateRaw =
      String(
        formData.get(
          "purchaseDate"
        ) ?? ""
      ).trim();

    const priceRaw =
      String(
        formData.get("price") ??
          ""
      ).trim();

    const location =
      normalizeText(
        String(
          formData.get(
            "location"
          ) ?? ""
        )
      );

    const remark =
      normalizeText(
        String(
          formData.get(
            "remark"
          ) ?? ""
        )
      );

    /* =====================================================
       NAME
    ===================================================== */

    if (!name) {
      throw new Error(
        "กรุณาระบุชื่อครุภัณฑ์"
      );
    }

    /* =====================================================
       PERMISSION
    ===================================================== */

    if (
      currentUser.role ===
        "STAFF" &&
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
      !Number.isInteger(
        quantity
      ) ||
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
      categoryUnit[
        assetCategory
      ];

    /* =====================================================
       DEPARTMENT
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
      targetDepartment.sections
        .length > 0;

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
        ? Number(
            officerIdRaw
          )
        : null;

    if (
      officerId !== null &&
      (!Number.isInteger(
        officerId
      ) ||
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
       CHECK OFFICER
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
         OFFICER SECTION
      =================================================== */

      if (hasTargetSections) {
        if (
          officer.sectionId !==
          null
        ) {
          const officerSectionExists =
            targetDepartment.sections.some(
              (section) =>
                section.id ===
                officer.sectionId
            );

          if (
            !officerSectionExists
          ) {
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
         RESPONSIBLE NAME
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
            officer.section
              .name
          )}`;
      } else if (
        officerName
      ) {
        responsibleName =
          officerName;
      }
    }

    /* =====================================================
       SECTION RESPONSIBLE
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
       PRICE
    ===================================================== */

    let price:
      | number
      | null = null;

    if (priceRaw) {
      price =
        Number(priceRaw);

      if (
        !Number.isFinite(
          price
        ) ||
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
          serialNumber ||
          null,

        quantity,

        unit:
          assetUnit || null,

        governmentAssetNo:
          governmentAssetNo ||
          null,

        officeAssetNo:
          officeAssetNo ||
          null,

        departmentId:
          departmentIdNumber,

        sectionId,

        officerId,

        responsibleName,

        status: "IN_USE",

        purchaseDate,

        price,

        location:
          location || null,

        remark:
          remark || null,
      },
    });

    redirect(backHref);
  }

  /* =======================================================
     SHARED CLASSES
  ======================================================= */

  const labelClassName = `
    mb-2
    block

    text-sm
    font-extrabold
    !text-slate-700

    sm:text-base
  `;

  const inputClassName = `
    min-h-[50px]
    w-full

    rounded-[14px]

    border
    border-slate-300

    bg-white

    px-4
    py-3

    text-base
    font-bold
    !text-slate-900

    shadow-sm
    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-400
    hover:bg-slate-50

    focus:border-blue-400
    focus:bg-white
    focus:ring-4
    focus:ring-blue-500/10
  `;

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
        title={`เพิ่ม${categoryName[assetCategory]}`}
        subtitle={`${department.name} — เพิ่มข้อมูลครุภัณฑ์ใหม่เข้าสู่ระบบ`}
        actions={
          <AppButton
            href={backHref}
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
        }
      />

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        action={createAsset}
        className="
          relative
          z-0
          w-full
          min-w-0
          overflow-visible
        "
      >
        <AppCard
          className="
            relative
            w-full
            !overflow-visible
          "
        >
          {/* =================================================
              FORM HEADER
          ================================================= */}

          <div className="mb-6">
            <h2
              className="
                text-lg
                font-extrabold
                !text-slate-900
              "
            >
              ข้อมูลครุภัณฑ์
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ระบุรายละเอียดของครุภัณฑ์ที่ต้องการเพิ่ม
            </p>
          </div>

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-4

              lg:grid-cols-2
            "
          >
            {/* NAME */}

            <div className="lg:col-span-2">
              <AppInfoCard>
                <label
                  htmlFor="name"
                  className={
                    labelClassName
                  }
                >
                  รายการครุภัณฑ์{" "}
                  <span className="!text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder={`เช่น ${categoryName[assetCategory]}`}
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>

            {/* BRAND */}

            <AppInfoCard>
              <label
                htmlFor="brand"
                className={
                  labelClassName
                }
              >
                ยี่ห้อ
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                placeholder="กรอกยี่ห้อ"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* MODEL */}

            <AppInfoCard>
              <label
                htmlFor="model"
                className={
                  labelClassName
                }
              >
                รุ่น
              </label>

              <input
                id="model"
                name="model"
                type="text"
                placeholder="กรอกรุ่น"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* SERIAL NUMBER */}

            <div className="lg:col-span-2">
              <AppInfoCard>
                <label
                  htmlFor="serialNumber"
                  className={
                    labelClassName
                  }
                >
                  Serial Number
                </label>

                <input
                  id="serialNumber"
                  name="serialNumber"
                  type="text"
                  placeholder="กรอก Serial Number"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>

            {/* QUANTITY */}

            <AppInfoCard>
              <label
                htmlFor="quantity"
                className={
                  labelClassName
                }
              >
                จำนวน{" "}
                <span className="!text-red-500">
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
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* UNIT */}

            <AppInfoCard>
              <label
                htmlFor="unit"
                className={
                  labelClassName
                }
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
                className={
                  inputClassName
                }
              />
            </AppInfoCard>
          </div>

          {/* =================================================
              ASSET NUMBER
          ================================================= */}

          <div
            className="
              mt-6
              border-t
              border-slate-200
              pt-6
            "
          >
            <div className="mb-4">
              <h3
                className="
                  text-base
                  font-extrabold
                  !text-slate-900

                  sm:text-lg
                "
              >
                เลขทะเบียนครุภัณฑ์
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ระบุรหัสทะเบียนของครุภัณฑ์
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-4

                lg:grid-cols-2
              "
            >
              {/* GFMIS */}

              <AppInfoCard>
                <label
                  htmlFor="governmentAssetNo"
                  className={
                    labelClassName
                  }
                >
                  รหัส GFMIS
                </label>

                <input
                  id="governmentAssetNo"
                  name="governmentAssetNo"
                  type="text"
                  placeholder="กรอกรหัส GFMIS"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>

              {/* OFFICE ASSET NUMBER */}

              <AppInfoCard>
                <label
                  htmlFor="officeAssetNo"
                  className={
                    labelClassName
                  }
                >
                  รหัสครุภัณฑ์
                </label>

                <input
                  id="officeAssetNo"
                  name="officeAssetNo"
                  type="text"
                  placeholder="กรอกรหัสครุภัณฑ์"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>
          </div>

          {/* =================================================
              RESPONSIBLE
          ================================================= */}

          <div
            className="
              mt-6
              border-t
              border-slate-200
              pt-6
            "
          >
            <div className="mb-4">
              <h3
                className="
                  text-base
                  font-extrabold
                  !text-slate-900

                  sm:text-lg
                "
              >
                ผู้รับผิดชอบ
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ระบุกลุ่มงานและผู้ครอบครองครุภัณฑ์
              </p>
            </div>

            <AppInfoCard
              className="
                !overflow-visible
              "
            >
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
            </AppInfoCard>
          </div>

          {/* =================================================
              ADDITIONAL INFORMATION
          ================================================= */}

          <div
            className="
              mt-6
              border-t
              border-slate-200
              pt-6
            "
          >
            <div className="mb-4">
              <h3
                className="
                  text-base
                  font-extrabold
                  !text-slate-900

                  sm:text-lg
                "
              >
                ข้อมูลเพิ่มเติม
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ระบุวันที่ได้มา ราคา และสถานที่ตั้ง
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-4

                lg:grid-cols-2
              "
            >
              {/* PURCHASE DATE */}

              <AppInfoCard>
                <label
                  htmlFor="purchaseDate"
                  className={
                    labelClassName
                  }
                >
                  วันที่ได้มา
                </label>

                <input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>

              {/* PRICE */}

              <AppInfoCard>
                <label
                  htmlFor="price"
                  className={
                    labelClassName
                  }
                >
                  ราคา
                </label>

                <div
                  className="
                    flex
                    min-h-[50px]
                    w-full
                    overflow-hidden

                    rounded-[14px]

                    border
                    border-slate-300

                    bg-white

                    shadow-sm

                    transition-all
                    duration-200

                    focus-within:border-blue-400
                    focus-within:ring-4
                    focus-within:ring-blue-500/10
                  "
                >
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className="
                      min-w-0
                      flex-1

                      border-0
                      bg-transparent

                      px-4
                      py-3

                      text-right
                      text-base
                      font-bold
                      tabular-nums
                      !text-slate-900

                      outline-none

                      placeholder:!text-slate-400
                    "
                  />

                  <div
                    className="
                      flex
                      shrink-0
                      items-center

                      border-l
                      border-slate-200

                      bg-slate-50

                      px-4

                      text-sm
                      font-extrabold
                      !text-slate-500
                    "
                  >
                    บาท
                  </div>
                </div>
              </AppInfoCard>

              {/* LOCATION */}

              <div className="lg:col-span-2">
                <AppInfoCard>
                  <label
                    htmlFor="location"
                    className={
                      labelClassName
                    }
                  >
                    สถานที่ตั้ง
                  </label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="กรอกสถานที่ตั้ง"
                    className={
                      inputClassName
                    }
                  />
                </AppInfoCard>
              </div>
            </div>
          </div>

          {/* =================================================
              REMARK
          ================================================= */}

          <div
            className="
              mt-6
              border-t
              border-slate-200
              pt-6
            "
          >
            <div className="mb-4">
              <h3
                className="
                  text-base
                  font-extrabold
                  !text-slate-900

                  sm:text-lg
                "
              >
                หมายเหตุ
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ระบุรายละเอียดเพิ่มเติมเกี่ยวกับครุภัณฑ์
              </p>
            </div>

            <AppInfoCard>
              <label
                htmlFor="remark"
                className={
                  labelClassName
                }
              >
                รายละเอียดเพิ่มเติม
              </label>

              <textarea
                id="remark"
                name="remark"
                rows={4}
                placeholder="กรอกหมายเหตุเพิ่มเติม"
                className="
                  w-full
                  resize-y

                  rounded-[14px]

                  border
                  border-slate-300

                  bg-white

                  px-4
                  py-3

                  text-base
                  font-bold
                  !text-slate-900

                  shadow-sm
                  outline-none

                  transition-all
                  duration-200

                  placeholder:!text-slate-400

                  hover:border-slate-400
                  hover:bg-slate-50

                  focus:border-blue-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />
            </AppInfoCard>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            className="
              mt-6

              flex
              flex-col-reverse
              gap-3

              border-t
              border-slate-200

              pt-5

              sm:flex-row
              sm:justify-end
            "
          >
            <AppButton
              href={backHref}
              variant="secondary"
              size="md"
            >
              ยกเลิก
            </AppButton>

            <AppButton
              type="submit"
              variant="success"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  💾
                </span>
              }
            >
              บันทึก
            </AppButton>
          </div>
        </AppCard>
      </form>
    </AppPage>
  );
}