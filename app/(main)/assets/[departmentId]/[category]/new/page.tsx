import { prisma } from "@/lib/prisma";
import type { AssetStatus } from "@prisma/client";
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
import AssetCategoryTypeDropdown from "./AssetCategoryTypeDropdown";

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
  searchParams?: Promise<{ fiscalYear?: string | string[] }>;
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


// หนึ่งข้อความในรายการ = หนึ่งตัวเลือก (ไม่แยกตามเครื่องหมายจุลภาค)
const STANDARD_TYPES: Record<string, string> = {
  CHAIR: "เก้าอี้, เก้าอี้สำนักงานพนักพิงสูง, เก้าอี้สำหรับห้องประชุม",
  AIR_CONDITIONER: "เครื่องปรับอากาศแบบติดผนัง, เครื่องปรับอากาศแบบแขวนฝ้าเพดาน",
  TELEPHONE: "เครื่องโทรศัพท์ ชนิด IP PHONE ไร้สาย",
  SHELF: "ชั้น",
  CABINET: "ตู้, ตู้ใส่เอกสาร 2 บานเปิด, ตู้เก็บเอกสารบานสไลด์, ตู้เอกสาร",
  DESK: "โต๊ะ, โต๊ะทำงาน, โต๊ะสำหรับวางคอมพิวเตอร์, โต๊ะวางของอเนกประสงค์",
  COMPUTER: "เครื่องคอมพิวเตอร์โน๊ตบุ้ค, เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ, เครื่องคอมพิวเตอร์สำนักงาน All In One",
  PRINTER: "เครื่องพิมพ์คอมพิวเตอร์, เครื่องพิมพ์เลเซอร์ขาวดำ ชนิด Network แบบที่ 1, เครื่องพิมพ์เลเซอร์ LED สี ชนิด Network แบบที่ 2",
  UPS: "เครื่องสำรองไฟฟ้า, เครื่องสำรองไฟฟ้า ชนิด True Online UPS",
};
const EXTRA_TYPES = ["เครื่องเล่นเทปคาสเซ็ท", "รถเข็น"];

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
  searchParams,
}: Props) {
  /* =======================================================
     AUTH
  ======================================================= */

  const user = await requireLogin();

  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    departmentId,
    category,
  } = await params;

  const query = await searchParams;
  const yearValue = Array.isArray(query?.fiscalYear)
    ? query.fiscalYear[0]
    : query?.fiscalYear;
  const fiscalYearSuffix = yearValue && /^\d{4}$/.test(yearValue)
    ? `?fiscalYear=${yearValue}`
    : "";

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

  /* =======================================================
     BACK URL
  ======================================================= */

  const backHref =
    `/assets/${department.id}/${assetCategory.toLowerCase()}${fiscalYearSuffix}`;

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

    const statusFromForm = String(formData.get("status") ?? "IN_USE").trim();
    const allowedStatuses = ["IN_USE", "DAMAGED", "DETERIORATED", "UNNECESSARY"] as const;
    if (!allowedStatuses.some((value) => value === statusFromForm)) {
      throw new Error("สถานะการใช้งานไม่ถูกต้อง");
    }
    // คงสิทธิ์เดิม: เฉพาะ ADMIN ที่กำหนดสถานะตอนเพิ่มครุภัณฑ์ได้
    const assetStatus = currentUser.role === "ADMIN" ? statusFromForm : "IN_USE";

    const model = "";

    const serialNumber = "";

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

    const categoryType = normalizeText(String(formData.get("categoryType") ?? ""));
    const customOfficerName = normalizeText(String(formData.get("customOfficerName") ?? ""));

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
        "กรุณาระบุชื่อเรียก/คุณลักษณะครุภัณฑ์"
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
       CHECK DEPARTMENT
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
        "ผู้รับผิดชอบไม่ถูกต้อง"
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

    if (officerId !== null && customOfficerName) {
      throw new Error("กรุณาเลือกผู้ครอบครองจากรายการหรือพิมพ์ชื่อใหม่อย่างใดอย่างหนึ่ง");
    }

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
          "ผู้รับผิดชอบไม่อยู่ในหน่วยงานที่เลือก"
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
              "กลุ่มงานของผู้รับผิดชอบไม่อยู่ในหน่วยงานที่เลือก"
            );
          }

          if (selectedSectionId !== null && officer.sectionId !== selectedSectionId) {
            throw new Error("ผู้รับผิดชอบไม่อยู่ในกลุ่มงานที่เลือก");
          }
          sectionId = officer.sectionId;
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
       CREATE
    ===================================================== */

    await prisma.asset.create({
      data: {
        name,

        category:
          assetCategory,
        categoryDetail: categoryType || defaultType || null,

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

        status: assetStatus as AssetStatus,

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

          <div className="mb-4">
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

              sm:grid-cols-2
            "
          >
            {/* NAME */}

            <div className="min-w-0">
              <AppInfoCard>
                <label
                  htmlFor="name"
                  className={
                    labelClassName
                  }
                >
                  ชื่อเรียก/คุณลักษณะครุภัณฑ์{" "}
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

            {/* USAGE STATUS */}

            <div className="min-w-0">
              <AppInfoCard>
                <label htmlFor="status" className={labelClassName}>
                  สถานะการใช้งาน <span className="!text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue="IN_USE"
                  className={inputClassName}
                >
                  <option value="IN_USE">ใช้งานปกติ</option>
                  <option value="DAMAGED">ชำรุด</option>
                  <option value="DETERIORATED">เสื่อมสภาพ</option>
                  <option value="UNNECESSARY">ไม่จำเป็นต้องใช้งาน</option>
                </select>
              </AppInfoCard>
            </div>

            {/* CATEGORY / TYPE */}
            <div className="relative z-[100] min-w-0">
              <AppInfoCard className="!overflow-visible">
                <label htmlFor="categoryType" className={labelClassName}>
                  หมวด/ชนิด
                </label>
                <AssetCategoryTypeDropdown
                  name="categoryType"
                  initialValue={defaultType}
                  options={typeOptions}
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
                ยี่ห้อ/รุ่น
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                placeholder="กรอกยี่ห้อ/รุ่น"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>


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
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
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
              relative z-0 mt-6
              border-t
              border-slate-200
              pt-5
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

                sm:grid-cols-2
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
              relative z-[50] !overflow-visible mt-6
              border-t
              border-slate-200
              pt-5
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
                ผู้ครอบครอง
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                เลือกกลุ่มงานและผู้รับผิดชอบครุภัณฑ์
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
              REMARK
          ================================================= */}

          <div
            className="
              relative z-0 mt-6
              border-t
              border-slate-200
              pt-5
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
            </div>

            <AppInfoCard>

              <textarea
                id="remark"
                name="remark"
                aria-label="หมายเหตุ"
                rows={3}
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