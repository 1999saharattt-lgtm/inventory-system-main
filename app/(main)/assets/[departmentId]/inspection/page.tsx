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

/* =========================================================
   SOURCE ORDER

   ใช้ลำดับเดียวกับหน้า /assets/[departmentId]/all

   รูปแบบใน remark:
   SOURCE:DEPARTMENT_1:1
   SOURCE:DEPARTMENT_1:2
   SOURCE:DEPARTMENT_1:3
   ...

   มี SourceOrder
   → เรียงตาม SourceOrder

   ไม่มี SourceOrder
   → อยู่ท้ายรายการ
   → เรียงตาม Asset.id
   ========================================================= */

function getSourceOrder(
  remark: string | null
): number | null {
  if (!remark) {
    return null;
  }

  const match = remark.match(
    /SOURCE:DEPARTMENT_1:(\d+)/
  );

  if (!match) {
    return null;
  }

  const sourceOrder = Number(match[1]);

  if (
    !Number.isInteger(sourceOrder) ||
    sourceOrder <= 0
  ) {
    return null;
  }

  return sourceOrder;
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function AssetInspectionPage({
  params,
}: Props) {
  const user = await requireLogin();

  /* =======================================================
     รับ departmentId
     ======================================================= */

  const { departmentId } = await params;

  const id = Number(departmentId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    notFound();
  }

  /* =======================================================
     หน้านี้สำหรับ ADMIN เท่านั้น
     ======================================================= */

  if (user.role !== "ADMIN") {
    notFound();
  }

  /* =======================================================
     ข้อมูลกลุ่มงาน
     ======================================================= */

  const department =
    await prisma.department.findUnique({
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

  /* =======================================================
     ครุภัณฑ์ของกลุ่มงาน

     สำคัญ:
     ไม่ใช้ orderBy id

     เพราะหน้า /assets/[departmentId]/all
     ใช้ SourceOrder จาก remark เป็นลำดับหลัก

     ดังนั้นหน้านี้ต้องดึง remark มาด้วย
     แล้วค่อย sort หลัง Query
     ======================================================= */

  const assetsFromDatabase =
    await prisma.asset.findMany({
      where: {
        departmentId: id,
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

        /*
         * จำเป็นสำหรับ SourceOrder
         */
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

  /* =======================================================
     เรียงรายการเหมือน /assets/[departmentId]/all

     1. มี SourceOrder ทั้งคู่
        → เรียง SourceOrder จากน้อยไปมาก

     2. A มี SourceOrder แต่ B ไม่มี
        → A อยู่ก่อน

     3. B มี SourceOrder แต่ A ไม่มี
        → B อยู่ก่อน

     4. ไม่มี SourceOrder ทั้งคู่
        → เรียง Asset.id
     ======================================================= */

  const assets = [
    ...assetsFromDatabase,
  ].sort((a, b) => {
    const orderA =
      getSourceOrder(a.remark);

    const orderB =
      getSourceOrder(b.remark);

    if (
      orderA !== null &&
      orderB !== null
    ) {
      return orderA - orderB;
    }

    if (orderA !== null) {
      return -1;
    }

    if (orderB !== null) {
      return 1;
    }

    return a.id - b.id;
  });

  /* =======================================================
     OFFICER

     สำคัญ:
     ดึง Officer จากทุกกลุ่ม
     ไม่กรองด้วย departmentId
     ======================================================= */

  const officers =
    await prisma.officer.findMany({
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

  /* =======================================================
     RENDER
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

      {/* ===================================================
          FORM

          assets ที่ส่งเข้า InspectionForm
          ถูกเรียงตาม SourceOrder แล้ว

          ดังนั้น:
          - ตารางตรวจสอบ
          - index
          - ข้อมูลที่ส่งต่อไป PDF

          จะได้รับลำดับเดียวกับหน้า /all
          =================================================== */}

      <InspectionForm
        department={department}
        assets={assets}
        officers={officers}
      />
    </div>
  );
}