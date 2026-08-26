import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateAsset } from "../../action";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
    category: string;
    assetId: string;
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
  SHELF: "ชั้นวาง/ชั้นใส่แฟ้ม",
  OTHER: "อื่น ๆ",
};

const statusName: Record<string, string> = {
  IN_USE: "ยังใช้งาน",
  WAITING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

export default async function EditAssetPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  const departmentIdNumber = Number(departmentId);
  const assetIdNumber = Number(assetId);

  if (
    !Number.isInteger(departmentIdNumber) ||
    !Number.isInteger(assetIdNumber)
  ) {
    notFound();
  }

  // =====================================================
  // ดึงข้อมูลครุภัณฑ์
  // =====================================================

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetIdNumber,
      departmentId: departmentIdNumber,
      category: category as any,
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

  // =====================================================
  // ดึงกลุ่มงานของหน่วยงาน
  // =====================================================

  const sections = await prisma.section.findMany({
    where: {
      departmentId: departmentIdNumber,
    },
    orderBy: {
      id: "asc",
    },
  });

  // =====================================================
  // ดึงผู้ครอบครองของหน่วยงาน
  // =====================================================

  const officers = await prisma.officer.findMany({
    where: {
      departmentId: departmentIdNumber,
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

  async function submitUpdate(formData: FormData) {
    "use server";

    await updateAsset(assetIdForUpdate, formData);
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

        <Link
          href={`/assets/${departmentId}/${category}/${asset.id}`}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            hover:from-emerald-700
            hover:to-green-600
            sm:w-auto
          "
        >
          ← กลับ
        </Link>
      </div>

      <form action={submitUpdate}>
        {/* =====================================================
            ข้อมูลครุภัณฑ์
        ===================================================== */}

        <div
          className="
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-900
            bg-gradient-to-br
            from-slate-900
            to-slate-800
            shadow-xl
          "
        >
          <div
            className="
              border-b
              border-slate-900
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-4
              sm:px-6
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
              🏷️ ข้อมูลครุภัณฑ์
            </h2>
          </div>

          <div
            className="
              grid
              gap-5
              p-4
              sm:grid-cols-2
              sm:p-6
              lg:grid-cols-3
            "
          >
            {/* =================================================
                สถานะครุภัณฑ์
            ================================================= */}

            <div
              className="
                min-w-0
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="status"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                สถานะครุภัณฑ์
              </label>

              <select
                id="status"
                name="status"
                defaultValue={asset.status}
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
              >
                <option value="IN_USE">
                  {statusName.IN_USE}
                </option>

                <option value="WAITING_DISPOSAL">
                  {statusName.WAITING_DISPOSAL}
                </option>

                <option value="DISPOSED">
                  {statusName.DISPOSED}
                </option>
              </select>
            </div>

            {/* =================================================
                รายการครุภัณฑ์
            ================================================= */}

            <div className="min-w-0 lg:col-span-2">
              <div
                className="
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  p-4
                  shadow-md
                "
              >
                <label
                  htmlFor="name"
                  className="
                    text-sm
                    font-extrabold
                    text-slate-700
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

            {/* =================================================
                ประเภท
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="category"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
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

            {/* =================================================
                ยี่ห้อ
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="brand"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
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

            {/* =================================================
                รุ่น
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="model"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
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

            {/* =================================================
                Serial Number
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="serialNumber"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                Serial Number
              </label>

              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                defaultValue={asset.serialNumber ?? ""}
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

            {/* =================================================
                เลขครุภัณฑ์กรม
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="governmentAssetNo"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                เลขครุภัณฑ์กรม
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

            {/* =================================================
                เลขครุภัณฑ์ประจำสำนัก
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="officeAssetNo"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                เลขครุภัณฑ์ประจำสำนัก
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

        {/* =====================================================
            หน่วยงาน / กลุ่มงาน / ผู้ครอบครอง / ตำแหน่ง
        ===================================================== */}

        <div
          className="
            mt-4
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-900
            bg-gradient-to-br
            from-slate-900
            to-slate-800
            shadow-xl
          "
        >
          <div
            className="
              border-b
              border-slate-900
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-4
              sm:px-6
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
              👤 หน่วยงานและผู้ครอบครอง
            </h2>
          </div>

          <div
            className="
              grid
              gap-5
              p-4
              sm:grid-cols-2
              sm:p-6
            "
          >
            {/* =================================================
                หน่วยงาน
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                หน่วยงาน
              </label>

              <div
                className="
                  mt-2
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.department.name}
              </div>

              <input
                type="hidden"
                name="departmentId"
                value={departmentIdNumber}
              />
            </div>

            {/* =================================================
                กลุ่มงาน
            ================================================= */}

            {sections.length > 0 && (
              <div
                className="
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  p-4
                  shadow-md
                "
              >
                <label
                  htmlFor="sectionId"
                  className="
                    text-sm
                    font-extrabold
                    text-slate-700
                  "
                >
                  กลุ่มงาน
                </label>

                <select
                  id="sectionId"
                  name="sectionId"
                  defaultValue={asset.sectionId ?? ""}
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
                >
                  <option value="">
                    -- ไม่ระบุ --
                  </option>

                  {sections.map((section) => (
                    <option
                      key={section.id}
                      value={section.id}
                    >
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sections.length === 0 && (
              <input
                type="hidden"
                name="sectionId"
                value=""
              />
            )}

            {/* =================================================
                ผู้ครอบครอง
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                htmlFor="officerId"
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                ผู้ครอบครอง
              </label>

              <select
                id="officerId"
                name="officerId"
                defaultValue={asset.officerId ?? ""}
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
              >
                <option value="">
                  -- ยังไม่ได้ระบุผู้ครอบครอง --
                </option>

                {officers.map((officer) => (
                  <option
                    key={officer.id}
                    value={officer.id}
                  >
                    {officer.firstName}{" "}
                    {officer.lastName}
                    {" — "}
                    {officer.position}
                  </option>
                ))}
              </select>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                รายชื่อผู้ครอบครองจะแสดงเฉพาะเจ้าหน้าที่ในหน่วยงานนี้
              </p>
            </div>

            {/* =================================================
                ตำแหน่ง
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <label
                className="
                  text-sm
                  font-extrabold
                  text-slate-700
                "
              >
                ตำแหน่ง
              </label>

              <div
                className="
                  mt-2
                  min-h-[48px]
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3
                  font-extrabold
                  text-slate-900
                "
              >
                {asset.officer?.position ?? "-"}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            หมายเหตุ
        ===================================================== */}

        <div
          className="
            mt-4
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-900
            bg-gradient-to-br
            from-slate-900
            to-slate-800
            shadow-xl
          "
        >
          <div
            className="
              border-b
              border-slate-900
              bg-gradient-to-r
              from-slate-800
              to-slate-700
              px-4
              py-4
              sm:px-6
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

          <div className="p-4 sm:p-6">
            <div
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                p-4
                shadow-md
              "
            >
              <textarea
                id="remark"
                name="remark"
                rows={4}
                defaultValue={asset.remark ?? ""}
                className="
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
        </div>

        {/* =====================================================
            ปุ่ม
        ===================================================== */}

        <div
          className="
            mt-4
            flex
            w-full
            flex-col
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >
          <Link
            href={`/assets/${departmentId}/${category}/${asset.id}`}
            className="
              w-full
              rounded-xl
              bg-slate-700
              px-6
              py-3
              text-center
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