"use server";

import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

const validStatuses = [
  "IN_USE",
  "WAITING_DISPOSAL",
  "DISPOSED",
] as const;

type AssetCategory = (typeof validCategories)[number];
type AssetStatus = (typeof validStatuses)[number];

export async function updateAsset(
  assetId: number,
  formData: FormData
) {
  // =====================================================
  // ตรวจสอบผู้ใช้งาน
  // =====================================================

  const currentUser = await requireLogin();

  // =====================================================
  // ตรวจสอบ asset เดิม
  // =====================================================

  const asset = await prisma.asset.findUnique({
    where: {
      id: assetId,
    },
    select: {
      id: true,
      departmentId: true,
      sectionId: true,
    },
  });

  if (!asset) {
    throw new Error("ไม่พบข้อมูลครุภัณฑ์");
  }

  // =====================================================
  // STAFF
  //
  // ต้องแก้ไขได้เฉพาะครุภัณฑ์ในหน่วยงานของตัวเอง
  // =====================================================

  if (
    currentUser.role === "STAFF" &&
    currentUser.departmentId !== asset.departmentId
  ) {
    throw new Error(
      "ไม่มีสิทธิ์แก้ไขครุภัณฑ์ของหน่วยงานนี้"
    );
  }

  // =====================================================
  // รับค่าจาก Form
  // =====================================================

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const category = String(
    formData.get("category") ?? ""
  ).trim();

  const brand = String(
    formData.get("brand") ?? ""
  ).trim();

  const model = String(
    formData.get("model") ?? ""
  ).trim();

  const serialNumber = String(
    formData.get("serialNumber") ?? ""
  ).trim();

  const governmentAssetNo = String(
    formData.get("governmentAssetNo") ?? ""
  ).trim();

  const officeAssetNo = String(
    formData.get("officeAssetNo") ?? ""
  ).trim();

  /*
   * หน่วยงานของครุภัณฑ์ไม่สามารถเปลี่ยนจากหน้านี้ได้
   * ใช้ departmentId เดิมจากฐานข้อมูลเป็นหลัก
   */
  const departmentId = asset.departmentId;

  const departmentIdFromForm = Number(
    formData.get("departmentId")
  );

  const sectionIdValue = String(
    formData.get("sectionId") ?? ""
  ).trim();

  const officerIdValue = String(
    formData.get("officerId") ?? ""
  ).trim();

  const purchaseDateValue = String(
    formData.get("purchaseDate") ?? ""
  ).trim();

  const priceValue = String(
    formData.get("price") ?? ""
  ).trim();

  const location = String(
    formData.get("location") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? ""
  ).trim();

  const remark = String(
    formData.get("remark") ?? ""
  ).trim();

  // =====================================================
  // ตรวจสอบข้อมูลพื้นฐาน
  // =====================================================

  if (!name) {
    throw new Error("กรุณาระบุรายการครุภัณฑ์");
  }

  if (!category) {
    throw new Error("กรุณาระบุประเภทครุภัณฑ์");
  }

  // =====================================================
  // ตรวจสอบ departmentId จาก Form
  //
  // ไม่อนุญาตให้เปลี่ยนหน่วยงาน
  // =====================================================

  if (
    Number.isFinite(departmentIdFromForm) &&
    departmentIdFromForm !== departmentId
  ) {
    throw new Error(
      "ไม่สามารถเปลี่ยนหน่วยงานของครุภัณฑ์จากหน้านี้ได้"
    );
  }

  // =====================================================
  // ตรวจสอบประเภทครุภัณฑ์
  // =====================================================

  if (
    !validCategories.includes(
      category as AssetCategory
    )
  ) {
    throw new Error("ประเภทครุภัณฑ์ไม่ถูกต้อง");
  }

  const assetCategory =
    category as AssetCategory;

  // =====================================================
  // ตรวจสอบสถานะ
  // =====================================================

  if (
    !validStatuses.includes(
      status as AssetStatus
    )
  ) {
    throw new Error("สถานะครุภัณฑ์ไม่ถูกต้อง");
  }

  const assetStatus = status as AssetStatus;

  // =====================================================
  // ดึงหน่วยงานจริงจากฐานข้อมูล
  //
  // ใช้ตรวจสอบว่าหน่วยงานมี section หรือไม่
  // =====================================================

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
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

  if (!department) {
    throw new Error(
      "ไม่พบหน่วยงานของครุภัณฑ์"
    );
  }

  const hasSections =
    department.sections.length > 0;

  // =====================================================
  // แปลง sectionId
  //
  // หน่วยงานไม่มี section
  // → บังคับเป็น null
  //
  // หน่วยงานมี section
  // → เลือก section ได้
  // =====================================================

  let sectionId: number | null = null;

  if (hasSections) {
    sectionId =
      sectionIdValue === ""
        ? null
        : Number(sectionIdValue);

    if (
      sectionId !== null &&
      !Number.isInteger(sectionId)
    ) {
      throw new Error(
        "ข้อมูลกลุ่มงานไม่ถูกต้อง"
      );
    }
  }

  // =====================================================
  // STAFF
  //
  // ถ้าหน่วยงานมี section
  // STAFF ต้องใช้ section ของตัวเองเท่านั้น
  // =====================================================

  if (
    currentUser.role === "STAFF" &&
    hasSections
  ) {
    const staffUser =
      await prisma.user.findUnique({
        where: {
          id: currentUser.id,
        },
        select: {
          departmentId: true,
          sectionId: true,
        },
      });

    if (!staffUser) {
      throw new Error(
        "ไม่พบข้อมูลผู้ใช้งาน"
      );
    }

    if (
      staffUser.departmentId !==
      departmentId
    ) {
      throw new Error(
        "ไม่มีสิทธิ์แก้ไขครุภัณฑ์ของหน่วยงานนี้"
      );
    }

    if (!staffUser.sectionId) {
      throw new Error(
        "ไม่พบกลุ่มงานของผู้ใช้งาน"
      );
    }

    if (
      sectionId !== staffUser.sectionId
    ) {
      throw new Error(
        "ไม่สามารถเลือกกลุ่มงานอื่นได้"
      );
    }
  }

  // =====================================================
  // ตรวจสอบ section
  //
  // ต้องเป็น section ของหน่วยงานนี้เท่านั้น
  // =====================================================

  if (sectionId !== null) {
    const sectionExists =
      department.sections.some(
        (section) =>
          section.id === sectionId
      );

    if (!sectionExists) {
      throw new Error(
        "กลุ่มงานไม่อยู่ในหน่วยงานของครุภัณฑ์"
      );
    }
  }

  // =====================================================
  // แปลง officerId
  // =====================================================

  const officerId =
    officerIdValue === ""
      ? null
      : Number(officerIdValue);

  if (
    officerId !== null &&
    !Number.isInteger(officerId)
  ) {
    throw new Error(
      "ข้อมูลผู้ครอบครองไม่ถูกต้อง"
    );
  }

  // =====================================================
  // ตรวจสอบผู้ครอบครอง
  //
  // ต้องอยู่หน่วยงานเดียวกัน
  //
  // ถ้าหน่วยงานมี section และเลือก section:
  // ต้องอยู่ section เดียวกัน
  //
  // ถ้าหน่วยงานไม่มี section:
  // ตรวจเฉพาะ departmentId
  // =====================================================

  if (officerId !== null) {
    const officer =
      await prisma.officer.findFirst({
        where: {
          id: officerId,
          departmentId,
          ...(sectionId !== null
            ? {
                sectionId,
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

    if (!officer) {
      throw new Error(
        sectionId !== null
          ? "ผู้ครอบครองไม่อยู่ในกลุ่มงานที่เลือก"
          : "ผู้ครอบครองไม่อยู่ในหน่วยงานของครุภัณฑ์"
      );
    }
  }

  // =====================================================
  // ตรวจสอบเลขครุภัณฑ์กรมซ้ำ
  //
  // ยกเว้น asset ตัวที่กำลังแก้ไข
  // =====================================================

  if (governmentAssetNo) {
    const existingGovernment =
      await prisma.asset.findFirst({
        where: {
          governmentAssetNo,
          NOT: {
            id: assetId,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingGovernment) {
      throw new Error(
        `เลขครุภัณฑ์กรม "${governmentAssetNo}" มีอยู่แล้ว`
      );
    }
  }

  // =====================================================
  // ตรวจสอบเลขครุภัณฑ์ประจำสำนักซ้ำ
  //
  // ยกเว้น asset ตัวที่กำลังแก้ไข
  // =====================================================

  if (officeAssetNo) {
    const existingOffice =
      await prisma.asset.findFirst({
        where: {
          officeAssetNo,
          NOT: {
            id: assetId,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingOffice) {
      throw new Error(
        `เลขครุภัณฑ์ประจำสำนัก "${officeAssetNo}" มีอยู่แล้ว`
      );
    }
  }

  // =====================================================
  // วันที่จัดซื้อ
  // =====================================================

  const purchaseDate =
    purchaseDateValue === ""
      ? null
      : new Date(
          `${purchaseDateValue}T00:00:00`
        );

  if (
    purchaseDate !== null &&
    Number.isNaN(
      purchaseDate.getTime()
    )
  ) {
    throw new Error(
      "วันที่จัดซื้อไม่ถูกต้อง"
    );
  }

  // =====================================================
  // ราคาจัดซื้อ
  // =====================================================

  const price =
    priceValue === ""
      ? null
      : Number(priceValue);

  if (
    price !== null &&
    (!Number.isFinite(price) ||
      price < 0)
  ) {
    throw new Error(
      "ราคาจัดซื้อไม่ถูกต้อง"
    );
  }

  // =====================================================
  // อัปเดตครุภัณฑ์
  // =====================================================

  const updatedAsset =
    await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        name,
        category: assetCategory,

        brand: brand || null,
        model: model || null,
        serialNumber:
          serialNumber || null,

        governmentAssetNo:
          governmentAssetNo || null,

        officeAssetNo:
          officeAssetNo || null,

        /*
         * คงหน่วยงานเดิม
         */
        departmentId,

        /*
         * หน่วยงานที่ไม่มี section
         * จะเก็บเป็น null
         */
        sectionId,

        officerId,

        status: assetStatus,

        purchaseDate,
        price,

        location: location || null,
        remark: remark || null,
      },
      select: {
        id: true,
        departmentId: true,
        category: true,
      },
    });

  // =====================================================
  // Revalidate
  // =====================================================

  revalidatePath("/assets");

  revalidatePath(
    `/assets/${updatedAsset.departmentId}`
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}`
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}/${updatedAsset.id}`
  );

  // =====================================================
  // กลับหน้ารายละเอียดครุภัณฑ์
  // =====================================================

  redirect(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}/${updatedAsset.id}`
  );
}