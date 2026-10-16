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
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
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

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  DAMAGED: "ชำรุด",
  WAITING_DISPOSAL: "รอจำหน่าย",
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
    category
      .trim()
      .toUpperCase();

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

  /*
   * เก็บเป็น primitive หลังจากตรวจ asset แล้ว
   * เพื่อให้ Server Action ใช้งานได้โดยไม่ติด
   * TypeScript เรื่อง possibly null
   */

  const assetIdForUpdate =
    asset.id;

  const departmentIdForPage =
    asset.departmentId;

  const categoryForPage =
    asset.category;

  const categorySlug =
    categoryForPage.toLowerCase();

  /* =======================================================
     SECTIONS
  ======================================================= */

  const sections =
    await prisma.section.findMany({
      where: {
        departmentId:
          departmentIdForPage,
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
              departmentIdForPage,
          },

          {
            section: {
              is: {
                departmentId:
                  departmentIdForPage,
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

     ตัวอย่าง:
     /assets/1/desk/530/edit

     BACK:
     /assets/1/desk

     DISPOSAL:
     /assets/1/desk/530/disposal
  ======================================================= */

  const categoryPath =
    `/assets/${departmentIdForPage}/${categorySlug}`;

  const detailPath =
    `${categoryPath}/${asset.id}`;

  const disposalPath =
    `${detailPath}/disposal`;

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

  // หมวด/ชนิด ถูกบันทึกเป็นบรรทัดนำหน้าใน remark โดยหน้าเพิ่มครุภัณฑ์
  const remarkLines = (asset.remark ?? "").split("\n");
  const categoryLine = remarkLines[0] ?? "";
  const existingCategoryType = categoryLine.startsWith("หมวด/ชนิด: ")
    ? categoryLine.slice("หมวด/ชนิด: ".length)
    : "";
  const existingRemark = existingCategoryType
    ? remarkLines.slice(1).join("\n")
    : asset.remark ?? "";

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
          <>
            {/* ===============================================
                DISPOSAL
            =============================================== */}

            <AppButton
              href={disposalPath}
              variant="danger"
              size="md"
              icon={
                <span aria-hidden="true">
                  📦
                </span>
              }
            >
              จำหน่าย
            </AppButton>

            {/* ===============================================
                BACK

                จาก:
                /assets/1/desk/530/edit

                ไป:
                /assets/1/desk
            =============================================== */}

            <AppButton
              href={categoryPath}
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
          </>
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
        <input type="hidden" name="category" value={asset.category} />
        <input type="hidden" name="responsibleName" value={asset.responsibleName ?? ""} />
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
              แก้ไขรายละเอียดข้อมูลครุภัณฑ์
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

            <div className="min-w-0 sm:col-span-2">
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
                  defaultValue={asset.name}
                  placeholder="ระบุชื่อเรียก/คุณลักษณะครุภัณฑ์"
                  className={
                    inputClassName
                  }
                />
              </AppInfoCard>
            </div>

            {/* USAGE STATUS */}

            <div className="min-w-0 sm:col-span-2">
              <AppInfoCard>
                <label htmlFor="status" className={labelClassName}>
                  สถานะการใช้งาน <span className="!text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue={asset.status}
                  className={inputClassName}
                >
                  <option value="IN_USE">ใช้งานปกติ</option>
                  <option value="DAMAGED">ชำรุด</option>
                  <option value="DETERIORATED">เสื่อมสภาพ</option>
                  <option value="UNNECESSARY">ไม่จำเป็นต้องใช้งาน</option>
                  {asset.status === "WAITING_DISPOSAL" && (
                    <option value="WAITING_DISPOSAL">รอจำหน่าย (สถานะเดิม)</option>
                  )}
                  {asset.status === "DISPOSED" && (
                    <option value="DISPOSED">จำหน่ายแล้ว (สถานะเดิม)</option>
                  )}
                </select>
              </AppInfoCard>
            </div>

            {/* CATEGORY / TYPE */}

            <AppInfoCard>
              <label htmlFor="categoryType" className={labelClassName}>
                หมวด/ชนิด
              </label>
              <input
                id="categoryType"
                name="categoryType"
                type="text"
                defaultValue={existingCategoryType}
                placeholder="กรอกหมวด/ชนิด"
                className={inputClassName}
              />
            </AppInfoCard>

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
                defaultValue={[asset.brand, asset.model].filter(Boolean).join(" / ")}
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
                defaultValue={asset.quantity}
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
                defaultValue={asset.unit ?? ""}
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
                  defaultValue={asset.governmentAssetNo ?? ""}
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
                  defaultValue={asset.officeAssetNo ?? ""}
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
              relative
              z-30
              !overflow-visible
              mt-6
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
                sections={sections}
                officers={officers}
                departmentName={asset.department.name}
                departmentId={departmentIdForPage}
                initialSectionId={asset.sectionId}
                initialOfficerId={asset.officerId}
              />
            </AppInfoCard>
          </div>

          {/* =================================================
              REMARK
          ================================================= */}

          <div
            className="
              relative
              z-0
              mt-6
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
                defaultValue={existingRemark}
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
              href={categoryPath}
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
