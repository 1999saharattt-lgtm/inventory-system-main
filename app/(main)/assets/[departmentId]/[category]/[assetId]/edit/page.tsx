import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateAsset } from "../../action";
import BackButton from "@/components/BackButton";
import AssetResponsibleFields from "./AssetResponsibleFields";

export const dynamic = "force-dynamic";

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

  const departmentIdNumber = Number(departmentId);
  const assetIdNumber = Number(assetId);
  const normalizedCategory = category.toUpperCase();

  if (
    !Number.isInteger(departmentIdNumber) ||
    departmentIdNumber <= 0 ||
    !Number.isInteger(assetIdNumber) ||
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

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetIdNumber,
      departmentId: departmentIdNumber,
      category: assetCategory,
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

  const assetIdForUpdate = asset.id;

  /* =======================================================
     SECTIONS
     ======================================================= */

  const sections = await prisma.section.findMany({
    where: {
      departmentId: departmentIdNumber,
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

  const officers = await prisma.officer.findMany({
    where: {
      OR: [
        {
          departmentId: departmentIdNumber,
        },
        {
          section: {
            is: {
              departmentId: departmentIdNumber,
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

  const detailPath =
    `/assets/${departmentIdNumber}/${assetCategory}/${asset.id}`;

  /* =======================================================
     UI
     ======================================================= */

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
          justify-between
          gap-4
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
            ✏️ แก้ไขข้อมูลครุภัณฑ์
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
            {asset.name}
          </p>
        </div>

        <BackButton href={detailPath} />
      </div>

      {/* ===================================================
          FORM
          =================================================== */}

      <form
        action={submitUpdate}
        className="
          mx-auto
          w-full
          max-w-4xl
          space-y-4
          sm:space-y-6
        "
      >
        {/* =================================================
            สถานะครุภัณฑ์
            ================================================= */}

        <div
          className="
            w-full
            min-w-0
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
          <div
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              📌 สถานะครุภัณฑ์
            </h2>
          </div>

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <div className="min-w-0">
              <label
                htmlFor="status"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                สถานะ
              </label>

              <select
                id="status"
                name="status"
                defaultValue={asset.status}
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
              >
                <option value="IN_USE">
                  {statusName.IN_USE}
                </option>

                <option value="DAMAGED">
                  {statusName.DAMAGED}
                </option>

                <option value="WAITING_DISPOSAL">
                  {statusName.WAITING_DISPOSAL}
                </option>

                <option value="DISPOSED">
                  {statusName.DISPOSED}
                </option>
              </select>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  !text-slate-400
                "
              >
                สถานะหลักของครุภัณฑ์สำหรับการควบคุมทะเบียนโดยผู้ดูแลระบบ
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            ข้อมูลครุภัณฑ์
            ================================================= */}

        <div
          className="
            w-full
            min-w-0
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
          <div
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              📋 ข้อมูลครุภัณฑ์
            </h2>
          </div>

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            {/* รายการครุภัณฑ์ */}

            <div className="min-w-0 sm:col-span-2">
              <label
                htmlFor="name"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                รายการครุภัณฑ์ *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={asset.name}
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
            </div>

            {/* ประเภท */}

            <div className="min-w-0">
              <label
                htmlFor="category"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                ประเภท *
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue={asset.category}
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
              >
                {Object.entries(categoryName).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ยี่ห้อ */}

            <div className="min-w-0">
              <label
                htmlFor="brand"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                ยี่ห้อ
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                defaultValue={asset.brand ?? ""}
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
            </div>

            {/* รุ่น */}

            <div className="min-w-0">
              <label
                htmlFor="model"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                รุ่น
              </label>

              <input
                id="model"
                name="model"
                type="text"
                defaultValue={asset.model ?? ""}
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
            </div>

            {/* Serial Number */}

            <div className="min-w-0">
              <label
                htmlFor="serialNumber"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                Serial Number
              </label>

              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                defaultValue={
                  asset.serialNumber ?? ""
                }
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
            </div>
          </div>
        </div>

        {/* =================================================
            เลขทะเบียนครุภัณฑ์
            ================================================= */}

        <div
          className="
            w-full
            min-w-0
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
          <div
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              🔖 เลขทะเบียนครุภัณฑ์
            </h2>
          </div>

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            {/* GFMIS */}

            <div className="min-w-0">
              <label
                htmlFor="governmentAssetNo"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                รหัส GFMIS
              </label>

              <input
                id="governmentAssetNo"
                name="governmentAssetNo"
                type="text"
                defaultValue={
                  asset.governmentAssetNo ?? ""
                }
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
            </div>

            {/* รหัสครุภัณฑ์ */}

            <div className="min-w-0">
              <label
                htmlFor="officeAssetNo"
                className="
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                "
              >
                รหัสครุภัณฑ์
              </label>

              <input
                id="officeAssetNo"
                name="officeAssetNo"
                type="text"
                defaultValue={
                  asset.officeAssetNo ?? ""
                }
                className="
                  mt-2
                  min-h-[50px]
                  w-full
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
            </div>
          </div>
        </div>

        {/* =================================================
            หน่วยงานและผู้รับผิดชอบ
            ================================================= */}

        <div
          className="
            w-full
            min-w-0
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
          <div
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              👤 หน่วยงานและผู้รับผิดชอบ
            </h2>
          </div>

          <AssetResponsibleFields
            sections={sections}
            officers={officers}
            initialSectionId={
              asset.sectionId
            }
            initialOfficerId={
              asset.officerId
            }
            departmentName={
              asset.department.name
            }
            departmentId={
              departmentIdNumber
            }
          />
        </div>

        {/* =================================================
            หมายเหตุ
            ================================================= */}

        <div
          className="
            w-full
            min-w-0
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
          <div
            className="
              rounded-xl
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-3
            "
          >
            <h2
              className="
                text-lg
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              📝 หมายเหตุ
            </h2>
          </div>

          <div className="mt-4">
            <textarea
              id="remark"
              name="remark"
              rows={4}
              defaultValue={
                asset.remark ?? ""
              }
              className="
                min-h-[120px]
                w-full
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
              placeholder="ระบุรายละเอียดเพิ่มเติม"
            />
          </div>
        </div>

        {/* =================================================
            ปุ่ม
            ================================================= */}

        <div
          className="
            flex
            w-full
            flex-col
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >
          <Link
            href={detailPath}
            className="
              w-full
              rounded-xl
              bg-slate-700
              px-6
              py-3
              text-center
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:bg-slate-800
              sm:w-auto
            "
          >
            ยกเลิก
          </Link>

          <button
            type="submit"
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-6
              py-3
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              hover:from-emerald-700
              hover:to-green-600
              active:scale-[0.98]
              sm:w-auto
            "
          >
            💾 บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </div>
  );
}
