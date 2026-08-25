import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AssetResponsibleFields from "./AssetResponsibleFields";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
  }>;
};

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  CABINET: "ตู้",
  COMPUTER: "คอมพิวเตอร์",
  MONITOR: "จอคอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "โทรศัพท์",
  SHELF: "ชั้น/ชั้นวาง",
  OTHER: "อื่น ๆ",
};

const categoryIcon: Record<string, string> = {
  DESK: "🪑",
  CHAIR: "💺",
  CABINET: "🗄️",
  COMPUTER: "💻",
  MONITOR: "🖥️",
  PRINTER: "🖨️",
  TELEPHONE: "☎️",
  SHELF: "🗂️",
  OTHER: "📦",
};

const validCategories = [
  "DESK",
  "CHAIR",
  "CABINET",
  "COMPUTER",
  "MONITOR",
  "PRINTER",
  "TELEPHONE",
  "SHELF",
  "OTHER",
] as const;

type AssetCategoryValue = (typeof validCategories)[number];

export default async function NewAssetPage({
  params,
}: Props) {
  const { departmentId, category } = await params;

  const departmentIdNumber = Number(departmentId);

  if (
    !Number.isInteger(departmentIdNumber) ||
    !validCategories.includes(category as AssetCategoryValue)
  ) {
    notFound();
  }

  const assetCategory = category as AssetCategoryValue;

  const department = await prisma.department.findUnique({
    where: {
      id: departmentIdNumber,
    },
    include: {
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

  async function createAsset(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const model = String(formData.get("model") ?? "").trim();

    const serialNumber = String(
      formData.get("serialNumber") ?? ""
    ).trim();

    const governmentAssetNo = String(
      formData.get("governmentAssetNo") ?? ""
    ).trim();

    const officeAssetNo = String(
      formData.get("officeAssetNo") ?? ""
    ).trim();

    const sectionIdRaw = String(
      formData.get("sectionId") ?? ""
    ).trim();

    const officerIdRaw = String(
      formData.get("officerId") ?? ""
    ).trim();

    const purchaseDateRaw = String(
      formData.get("purchaseDate") ?? ""
    ).trim();

    const priceRaw = String(
      formData.get("price") ?? ""
    ).trim();

    const location = String(
      formData.get("location") ?? ""
    ).trim();

    const remark = String(
      formData.get("remark") ?? ""
    ).trim();

    if (!name) {
      throw new Error("กรุณาระบุชื่อครุภัณฑ์");
    }

    const sectionId = sectionIdRaw
      ? Number(sectionIdRaw)
      : null;

    const officerId = officerIdRaw
      ? Number(officerIdRaw)
      : null;

    if (
      sectionId !== null &&
      !Number.isInteger(sectionId)
    ) {
      throw new Error("กลุ่มงานไม่ถูกต้อง");
    }

    if (
      officerId !== null &&
      !Number.isInteger(officerId)
    ) {
      throw new Error("ผู้ครอบครองไม่ถูกต้อง");
    }

    if (sectionId !== null) {
      const section = await prisma.section.findFirst({
        where: {
          id: sectionId,
          departmentId: departmentIdNumber,
        },
      });

      if (!section) {
        throw new Error(
          "กลุ่มงานไม่อยู่ในหน่วยงานที่เลือก"
        );
      }
    }

    if (officerId !== null) {
      const officer = await prisma.officer.findFirst({
        where: {
          id: officerId,
          departmentId: departmentIdNumber,
          ...(sectionId !== null
            ? {
                sectionId,
              }
            : {}),
      },
      });

      if (!officer) {
        throw new Error(
          sectionId !== null
            ? "ผู้ครอบครองไม่อยู่ในกลุ่มงานที่เลือก"
            : "ผู้ครอบครองไม่อยู่ในหน่วยงานที่เลือก"
        );
      }
    }

    if (governmentAssetNo) {
      const existingGovernment =
        await prisma.asset.findUnique({
          where: {
            governmentAssetNo,
          },
        });

      if (existingGovernment) {
        throw new Error(
          `เลขครุภัณฑ์กรม "${governmentAssetNo}" มีอยู่แล้ว`
        );
      }
    }

    if (officeAssetNo) {
      const existingOffice =
        await prisma.asset.findUnique({
          where: {
            officeAssetNo,
          },
        });

      if (existingOffice) {
        throw new Error(
          `เลขครุภัณฑ์ประจำสำนัก "${officeAssetNo}" มีอยู่แล้ว`
        );
      }
    }

    let price: number | null = null;

    if (priceRaw) {
      price = Number(priceRaw);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("ราคาครุภัณฑ์ไม่ถูกต้อง");
      }
    }

    let purchaseDate: Date | null = null;

    if (purchaseDateRaw) {
      const parsedDate = new Date(
        `${purchaseDateRaw}T00:00:00`
      );

      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("วันที่ได้มาไม่ถูกต้อง");
      }

      purchaseDate = parsedDate;
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        category: assetCategory,

        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,

        governmentAssetNo:
          governmentAssetNo || null,

        officeAssetNo:
          officeAssetNo || null,

        departmentId: departmentIdNumber,

        sectionId,
        officerId,

        status: "IN_USE",

        purchaseDate,
        price,

        location: location || null,
        remark: remark || null,
      },
    });

    redirect(
      `/assets/${departmentIdNumber}/${assetCategory}/${asset.id}`
    );
  }

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
      {/* =====================================================
          Header
      ===================================================== */}

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
            {categoryIcon[category]} เพิ่ม{categoryName[category]}
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
            {department.name} — ทะเบียนคุมครุภัณฑ์
          </p>
        </div>

        <Link
          href={`/assets/${department.id}/${category}`}
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

      {/* =====================================================
          Form
      ===================================================== */}

      <form action={createAsset}>
        <div
          className="
            w-full
            min-w-0
            rounded-2xl
            border
            border-slate-700
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800
            p-4
            shadow-xl
            sm:p-8
          "
        >
          {/* =================================================
              ข้อมูลหลัก
          ================================================= */}

          <div>
            <h2
              className="
                rounded-xl
                bg-gradient-to-r
                from-slate-800
                to-slate-700
                px-4
                py-3
                text-lg
                font-extrabold
                !text-white
              "
            >
              📋 ข้อมูลครุภัณฑ์
            </h2>

            <div
              className="
                mt-4
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-extrabold !text-slate-200"
                >
                  ชื่อครุภัณฑ์{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder={`เช่น ${categoryName[category]}`}
                  className="
                    mt-2
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
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>

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
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>

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
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>
            </div>
          </div>

          {/* =================================================
              เลขทะเบียน
          ================================================= */}

          <div className="mt-6">
            <h2
              className="
                rounded-xl
                bg-gradient-to-r
                from-slate-800
                to-slate-700
                px-4
                py-3
                text-lg
                font-extrabold
                !text-white
              "
            >
              🔖 เลขทะเบียนครุภัณฑ์
            </h2>

            <div
              className="
                mt-4
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <div>
                <label
                  htmlFor="governmentAssetNo"
                  className="block text-sm font-extrabold !text-slate-200"
                >
                  เลขครุภัณฑ์กรม
                </label>

                <input
                  id="governmentAssetNo"
                  name="governmentAssetNo"
                  type="text"
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="officeAssetNo"
                  className="block text-sm font-extrabold !text-slate-200"
                >
                  เลขครุภัณฑ์ประจำสำนัก
                </label>

                <input
                  id="officeAssetNo"
                  name="officeAssetNo"
                  type="text"
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>
            </div>
          </div>

          {/* =================================================
              ผู้รับผิดชอบ
          ================================================= */}

          <div className="mt-6">
            <h2
              className="
                rounded-xl
                bg-gradient-to-r
                from-slate-800
                to-slate-700
                px-4
                py-3
                text-lg
                font-extrabold
                !text-white
              "
            >
              👤 ผู้รับผิดชอบและสถานที่
            </h2>

            <div
              className="
                mt-4
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <AssetResponsibleFields
                sections={department.sections}
              />

              <div>
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
                  placeholder="เช่น ห้อง 301"
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>

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
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-extrabold !text-slate-200"
                >
                  ราคาครุภัณฑ์
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="
                    mt-2
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
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="remark"
                  className="block text-sm font-extrabold !text-slate-200"
                >
                  หมายเหตุ
                </label>

                <textarea
                  id="remark"
                  name="remark"
                  rows={4}
                  className="
                    mt-2
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-3
                    font-semibold
                    text-slate-900
                    outline-none
                    focus:border-emerald-600
                    focus:ring-2
                    focus:ring-emerald-200
                  "
                />
              </div>
            </div>
          </div>

          {/* =================================================
              ปุ่ม
          ================================================= */}

          <div
            className="
              mt-6
              flex
              flex-col-reverse
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >
            <Link
              href={`/assets/${department.id}/${category}`}
              className="
                w-full
                rounded-xl
                bg-slate-700
                px-8
                py-3
                text-center
                text-lg
                font-extrabold
                text-white
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
                hover:scale-105
                hover:from-emerald-700
                hover:to-green-600
                active:scale-[0.98]
                sm:w-auto
              "
            >
              💾 บันทึก
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}