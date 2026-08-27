import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

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

const inspectionStatusOptions = [
  {
    value: "IN_USE",
    label: "ยังใช้งานอยู่",
  },
  {
    value: "RETURNED",
    label: "ส่งคืน",
  },
  {
    value: "DAMAGED",
    label: "ชำรุด",
  },
  {
    value: "MISSING",
    label: "สูญหาย",
  },
  {
    value: "NOT_FOUND",
    label: "ตรวจไม่พบ",
  },
];

const quarterOptions = [
  {
    value: "Q1",
    label: "ไตรมาส 1",
  },
  {
    value: "Q2",
    label: "ไตรมาส 2",
  },
  {
    value: "Q3",
    label: "ไตรมาส 3",
  },
  {
    value: "Q4",
    label: "ไตรมาส 4",
  },
];

function getCurrentQuarter(): string {
  const month = new Date().getMonth() + 1;

  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

export default async function NewAssetInspectionPage({
  params,
}: Props) {
  const {
    departmentId,
    category,
    assetId,
  } = await params;

  // =====================================================
  // Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

  if (!session) {
    redirect("/login");
  }

  const parsedDepartmentId = Number(departmentId);
  const parsedAssetId = Number(assetId);

  if (
    !Number.isInteger(parsedDepartmentId) ||
    !Number.isInteger(parsedAssetId)
  ) {
    notFound();
  }

  // =====================================================
  // ดึงข้อมูลครุภัณฑ์
  // =====================================================

  const asset = await prisma.asset.findFirst({
    where: {
      id: parsedAssetId,
      departmentId: parsedDepartmentId,
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

  // =====================================================
  // ตรวจสิทธิ์กลุ่มงาน
  // =====================================================

  if (
    session.role !== "ADMIN" &&
    session.departmentId !== asset.departmentId
  ) {
    redirect("/assets");
  }

  // =====================================================
  // ปี / ไตรมาสปัจจุบัน
  // =====================================================

  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();

  // =====================================================
  // ตรวจว่ารอบนี้เคยตรวจแล้วหรือยัง
  // =====================================================

  const existingInspection =
    await prisma.assetInspection.findUnique({
      where: {
        assetId_year_quarter: {
          assetId: asset.id,
          year: currentYear,
          quarter: currentQuarter as any,
        },
      },
    });

  if (existingInspection) {
    redirect(
      `/assets/${asset.departmentId}/${asset.category}/${asset.id}/inspection`
    );
  }

  // =====================================================
  // Server Action
  // =====================================================

  const createInspection = async (
    formData: FormData
  ) => {
    "use server";

    const status = String(
      formData.get("status") ?? ""
    );

    const yearValue = Number(
      formData.get("year")
    );

    const quarter = String(
      formData.get("quarter") ?? ""
    );

    const condition =
      String(formData.get("condition") ?? "").trim() ||
      null;

    const location =
      String(formData.get("location") ?? "").trim() ||
      null;

    const remark =
      String(formData.get("remark") ?? "").trim() ||
      null;

    const inspectorName =
      String(
        formData.get("inspectorName") ?? ""
      ).trim() || null;

    if (
      ![
        "IN_USE",
        "RETURNED",
        "DAMAGED",
        "MISSING",
        "NOT_FOUND",
      ].includes(status)
    ) {
      throw new Error("กรุณาเลือกผลการตรวจสอบ");
    }

    if (
      !Number.isInteger(yearValue) ||
      yearValue < 2000 ||
      yearValue > 2100
    ) {
      throw new Error("ปีที่ตรวจสอบไม่ถูกต้อง");
    }

    if (!["Q1", "Q2", "Q3", "Q4"].includes(quarter)) {
      throw new Error("กรุณาเลือกไตรมาส");
    }

    const latestAsset =
      await prisma.asset.findFirst({
        where: {
          id: parsedAssetId,
          departmentId: parsedDepartmentId,
          category: category as any,
        },
      });

    if (!latestAsset) {
      throw new Error("ไม่พบข้อมูลครุภัณฑ์");
    }

    if (
      session?.role !== "ADMIN" &&
      session?.departmentId !== latestAsset.departmentId
    ) {
      throw new Error("ไม่มีสิทธิ์ตรวจสอบครุภัณฑ์รายการนี้");
    }

    const duplicate =
      await prisma.assetInspection.findUnique({
        where: {
          assetId_year_quarter: {
            assetId: latestAsset.id,
            year: yearValue,
            quarter: quarter as any,
          },
        },
      });

    if (duplicate) {
      throw new Error(
        "ครุภัณฑ์รายการนี้มีผลการตรวจสอบในรอบดังกล่าวแล้ว"
      );
    }

    await prisma.assetInspection.create({
      data: {
        assetId: latestAsset.id,
        year: yearValue,
        quarter: quarter as any,
        status: status as any,
        condition,
        location,
        remark,
        inspectorName,
      },
    });

    redirect(
      `/assets/${latestAsset.departmentId}/${latestAsset.category}/${latestAsset.id}/inspection`
    );
  };

  const ownerName = asset.officer
    ? `${asset.officer.firstName} ${asset.officer.lastName}`
    : "-";

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
            🔍 ตรวจสอบครุภัณฑ์
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
            บันทึกผลการตรวจสอบครุภัณฑ์ประจำรอบ
          </p>
        </div>

        <Link
          href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}/inspection`}
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-slate-700
            to-slate-950
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-[1.02]
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับประวัติการตรวจ
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลครุภัณฑ์
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-4
          text-white
          shadow-xl
          sm:p-6
        "
      >
        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              รายการครุภัณฑ์
            </p>

            <p className="mt-2 break-words text-lg font-extrabold !text-white">
              {asset.name}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              ประเภท
            </p>

            <p className="mt-2 font-extrabold !text-white">
              {categoryName[asset.category] ??
                asset.category}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์กรม
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.governmentAssetNo ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              เลขครุภัณฑ์ประจำสำนัก
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.officeAssetNo ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              กลุ่มงาน
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {asset.section?.name ??
                asset.department.name}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold !text-slate-300">
              ผู้ครอบครอง
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {ownerName}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          แบบฟอร์มตรวจสอบ
      ===================================================== */}

      <form action={createInspection}>
        <div
          className="
            w-full
            min-w-0
            rounded-2xl
            border
            border-slate-300
            bg-white
            p-4
            shadow-lg
            sm:p-6
          "
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {/* ปี */}

            <div>
              <label
                htmlFor="year"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                ปีที่ตรวจสอบ
              </label>

              <input
                id="year"
                name="year"
                type="number"
                defaultValue={currentYear}
                min={2000}
                max={2100}
                required
                className="
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

            {/* ไตรมาส */}

            <div>
              <label
                htmlFor="quarter"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                รอบการตรวจสอบ
              </label>

              <select
                id="quarter"
                name="quarter"
                defaultValue={currentQuarter}
                required
                className="
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
                {quarterOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ผลการตรวจ */}

            <div className="sm:col-span-2">
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                ผลการตรวจสอบ
              </label>

              <select
                id="status"
                name="status"
                required
                defaultValue=""
                className="
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
                <option value="" disabled>
                  -- เลือกผลการตรวจสอบ --
                </option>

                {inspectionStatusOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* สภาพครุภัณฑ์ */}

            <div className="sm:col-span-2">
              <label
                htmlFor="condition"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                สภาพครุภัณฑ์
              </label>

              <input
                id="condition"
                name="condition"
                type="text"
                placeholder="เช่น ใช้งานได้ตามปกติ / ชำรุดเล็กน้อย"
                className="
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
                  placeholder:text-slate-400
                  focus:border-emerald-600
                  focus:ring-2
                  focus:ring-emerald-200
                "
              />
            </div>

            {/* สถานที่ตั้ง */}

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                สถานที่ตั้ง
              </label>

              <input
                id="location"
                name="location"
                type="text"
                defaultValue={asset.location ?? ""}
                placeholder="ระบุสถานที่ตั้ง"
                className="
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
                  placeholder:text-slate-400
                  focus:border-emerald-600
                  focus:ring-2
                  focus:ring-emerald-200
                "
              />
            </div>

            {/* ผู้ตรวจ */}

            <div>
              <label
                htmlFor="inspectorName"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                ผู้ตรวจสอบ
              </label>

              <input
                id="inspectorName"
                name="inspectorName"
                type="text"
                defaultValue={
                  session.fullname ?? ""
                }
                required
                className="
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
                  placeholder:text-slate-400
                  focus:border-emerald-600
                  focus:ring-2
                  focus:ring-emerald-200
                "
              />
            </div>

            {/* หมายเหตุ */}

            <div className="sm:col-span-2">
              <label
                htmlFor="remark"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                หมายเหตุ
              </label>

              <textarea
                id="remark"
                name="remark"
                rows={4}
                placeholder="ระบุรายละเอียดเพิ่มเติม ถ้ามี"
                className="
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
                  transition
                  placeholder:text-slate-400
                  focus:border-emerald-600
                  focus:ring-2
                  focus:ring-emerald-200
                "
              />
            </div>
          </div>

          {/* =====================================================
              ปุ่ม
          ===================================================== */}

          <div
            className="
              mt-6
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >
            <Link
              href={`/assets/${asset.departmentId}/${asset.category}/${asset.id}/inspection`}
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
                text-center
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
              ✅ บันทึกผลการตรวจสอบ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}