import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";
import InspectionForm from "./InspectionForm";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

export default async function AssetInspectionPage({
  params,
}: Props) {
  const user = await requireLogin();

  // =====================================================
  // รับ departmentId
  // =====================================================

  const { departmentId } = await params;

  const id = Number(departmentId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  // =====================================================
  // หน้านี้สำหรับ ADMIN เท่านั้น
  // =====================================================

  if (user.role !== "ADMIN") {
    notFound();
  }

  // =====================================================
  // ข้อมูลกลุ่มงาน
  // =====================================================

  const department = await prisma.department.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!department) {
    notFound();
  }

  // =====================================================
  // ครุภัณฑ์ของกลุ่มงาน
  // =====================================================

  const assets = await prisma.asset.findMany({
    where: {
      departmentId: id,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      model: true,
      serialNumber: true,
      governmentAssetNo: true,
      officeAssetNo: true,
      departmentId: true,
      sectionId: true,
      officerId: true,
      status: true,
      purchaseDate: true,
      price: true,
      location: true,
      remark: true,
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
          position: true,
        },
      },
    },
  });

  // =====================================================
  // Officer
  //
  // สำคัญ:
  // ดึง Officer จากทุกกลุ่ม
  // ไม่กรองด้วย departmentId
  // =====================================================

  const officers = await prisma.officer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      type: true,
      departmentId: true,
      sectionId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
        },
      },
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
            🔎 ตรวจสอบรายการครุภัณฑ์
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
            {department.name}
          </p>
        </div>

        <Link
          href={`/assets/${department.id}`}
          className="
            shrink-0
            whitespace-nowrap
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            leading-tight
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-300
          bg-white
          p-4
          shadow-xl
          sm:rounded-3xl
          sm:p-6
          lg:p-8
        "
      >
        <InspectionForm
          department={department}
          assets={assets}
          officers={officers}
        />
      </div>
    </div>
  );
}