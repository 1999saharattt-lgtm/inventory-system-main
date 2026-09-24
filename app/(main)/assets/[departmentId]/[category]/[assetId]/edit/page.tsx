import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateAsset } from "../../action";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

import AssetResponsibleFields from "./AssetResponsibleFields";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
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
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
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
   STATUS
========================================================= */

const statusName: Record<
  string,
  string
> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL:
    "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

/* =========================================================
   PAGE
========================================================= */

export default async function EditAssetPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  /* =======================================================
     PARAMS
  ======================================================= */

  const departmentIdNumber =
    Number(departmentId);

  const assetIdNumber =
    Number(assetId);

  const normalizedCategory =
    category.toUpperCase();

  if (
    !Number.isInteger(
      departmentIdNumber
    ) ||
    departmentIdNumber <= 0 ||
    !Number.isInteger(
      assetIdNumber
    ) ||
    assetIdNumber <= 0 ||
    !validCategories.includes(
      normalizedCategory as AssetCategoryValue
    )
  ) {
    notFound();
  }

  const assetCategory =
    normalizedCategory as AssetCategoryValue;

  /* =======================================================
     ASSET
  ======================================================= */

  const asset =
    await prisma.asset.findFirst({
      where: {
        id: assetIdNumber,

        departmentId:
          departmentIdNumber,

        category:
          assetCategory,
      },

      include: {
        department: true,
        section: true,
        officer: true,
      },
    });

  if (!asset) {
    notFound();
  }

  const assetIdForUpdate =
    asset.id;

  /* =======================================================
     SECTIONS
  ======================================================= */

  const sections =
    await prisma.section.findMany({
      where: {
        departmentId:
          departmentIdNumber,
      },

      select: {
        id: true,
        name: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     OFFICERS
  ======================================================= */

  const officers =
    await prisma.officer.findMany({
      where: {
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
        position: true,
        sectionId: true,
      },

      orderBy: [
        {
          firstName: "asc",
        },

        {
          lastName: "asc",
        },
      ],
    });

  /* =======================================================
     UPDATE
  ======================================================= */

  async function submitUpdate(
    formData: FormData
  ) {
    "use server";

    await updateAsset(
      assetIdForUpdate,
      formData
    );
  }

  /* =======================================================
     ROUTES
  ======================================================= */

  const detailPath =
    `/assets/${departmentIdNumber}/${assetCategory.toLowerCase()}/${asset.id}`;

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
        icon="✏️"
        title="แก้ไขข้อมูลครุภัณฑ์"
        subtitle={`${asset.name} — ${asset.department.name}`}
        actions={
          <AppButton
            href={detailPath}
            variant="back"
            size="md"
            icon={
              <span aria-hidden="true">
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
        action={submitUpdate}
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
              HEADER
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
              แก้ไขรายละเอียดข้อมูลครุภัณฑ์
            </p>
          </div>

          {/* =================================================
              GRID
          ================================================= */}

          <div
            className="
              relative
              grid
              grid-cols-1
              gap-4
              overflow-visible

              lg:grid-cols-2
            "
          >
            {/* =============================================
                STATUS
            ============================================= */}

            <AppInfoCard>
              <label
                htmlFor="status"
                className={
                  labelClassName
                }
              >
                สถานะ
              </label>

              <select
                id="status"
                name="status"
                defaultValue={
                  asset.status
                }
                className={
                  inputClassName
                }
              >
                <option value="IN_USE">
                  {
                    statusName.IN_USE
                  }
                </option>

                <option value="DAMAGED">
                  {
                    statusName.DAMAGED
                  }
                </option>

                <option value="WAITING_DISPOSAL">
                  {
                    statusName.WAITING_DISPOSAL
                  }
                </option>

                <option value="DISPOSED">
                  {
                    statusName.DISPOSED
                  }
                </option>
              </select>

              <p
                className="
                  mt-2
                  text-xs
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                "
              >
                สถานะหลักของครุภัณฑ์สำหรับการควบคุมทะเบียนโดยผู้ดูแลระบบ
              </p>
            </AppInfoCard>

            {/* =============================================
                CATEGORY
            ============================================= */}

            <AppInfoCard>
              <label
                htmlFor="category"
                className={
                  labelClassName
                }
              >
                ประเภท{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue={
                  asset.category
                }
                className={
                  inputClassName
                }
              >
                {Object.entries(
                  categoryName
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </AppInfoCard>

            {/* =============================================
                NAME
            ============================================= */}

            <div
              className="
                lg:col-span-2
              "
            >
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
                  defaultValue={
                    asset.name
                  }
                  placeholder="ระบุรายการครุภัณฑ์"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>

            {/* =============================================
                BRAND
            ============================================= */}

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
                defaultValue={
                  asset.brand ?? ""
                }
                placeholder="ระบุยี่ห้อ"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* =============================================
                MODEL
            ============================================= */}

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
                defaultValue={
                  asset.model ?? ""
                }
                placeholder="ระบุรุ่น"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* =============================================
                SERIAL NUMBER
            ============================================= */}

            <div
              className="
                lg:col-span-2
              "
            >
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
                  defaultValue={
                    asset.serialNumber ??
                    ""
                  }
                  placeholder="ระบุ Serial Number"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>

            {/* =============================================
                GFMIS
            ============================================= */}

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
                defaultValue={
                  asset.governmentAssetNo ??
                  ""
                }
                placeholder="ระบุรหัส GFMIS"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* =============================================
                ASSET CODE
            ============================================= */}

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
                defaultValue={
                  asset.officeAssetNo ??
                  ""
                }
                placeholder="ระบุรหัสครุภัณฑ์"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* =============================================
                RESPONSIBLE
            ============================================= */}

            <div
              className="
                relative
                z-30
                lg:col-span-2
              "
            >
              <AppInfoCard
                className="
                  !overflow-visible
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

                <AssetResponsibleFields
                  sections={
                    sections
                  }
                  officers={
                    officers
                  }
                  initialSectionId={
                    asset.sectionId
                  }
                  initialOfficerId={
                    asset.officerId
                  }
                  departmentName={
                    asset.department
                      .name
                  }
                  departmentId={
                    departmentIdNumber
                  }
                />
              </AppInfoCard>
            </div>

            {/* =============================================
                REMARK
            ============================================= */}

            <div
              className="
                lg:col-span-2
              "
            >
              <AppInfoCard>
                <label
                  htmlFor="remark"
                  className={
                    labelClassName
                  }
                >
                  หมายเหตุ
                </label>

                <textarea
                  id="remark"
                  name="remark"
                  rows={4}
                  defaultValue={
                    asset.remark ??
                    ""
                  }
                  placeholder="ระบุรายละเอียดเพิ่มเติม"
                  className="
                    min-h-[130px]
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
                    leading-relaxed
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
              href={detailPath}
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
                <span aria-hidden="true">
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