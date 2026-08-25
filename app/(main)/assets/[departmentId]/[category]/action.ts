"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAsset(
  assetId: number,
  formData: FormData
) {
  const asset = await prisma.asset.findUnique({
    where: {
      id: assetId,
    },
    select: {
      id: true,
      departmentId: true,
    },
  });

  if (!asset) {
    throw new Error("ไม่พบข้อมูลครุภัณฑ์");
  }

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
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

  const departmentId = Number(
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

  if (!name) {
    throw new Error("กรุณาระบุรายการครุภัณฑ์");
  }

  if (!category) {
    throw new Error("กรุณาระบุประเภทครุภัณฑ์");
  }

  if (!Number.isInteger(departmentId)) {
    throw new Error("ข้อมูลหน่วยงานไม่ถูกต้อง");
  }

  if (departmentId !== asset.departmentId) {
    throw new Error("ไม่สามารถเปลี่ยนหน่วยงานของครุภัณฑ์จากหน้านี้ได้");
  }

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
  ];

  if (!validCategories.includes(category)) {
    throw new Error("ประเภทครุภัณฑ์ไม่ถูกต้อง");
  }

  const validStatuses = [
    "IN_USE",
    "WAITING_DISPOSAL",
    "DISPOSED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("สถานะครุภัณฑ์ไม่ถูกต้อง");
  }

  const sectionId =
    sectionIdValue === ""
      ? null
      : Number(sectionIdValue);

  const officerId =
    officerIdValue === ""
      ? null
      : Number(officerIdValue);

  if (
    sectionId !== null &&
    !Number.isInteger(sectionId)
  ) {
    throw new Error("ข้อมูลกลุ่มงานไม่ถูกต้อง");
  }

  if (
    officerId !== null &&
    !Number.isInteger(officerId)
  ) {
    throw new Error("ข้อมูลผู้ครอบครองไม่ถูกต้อง");
  }

  // ตรวจสอบว่ากลุ่มงานอยู่ในหน่วยงานเดียวกัน
  if (sectionId !== null) {
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        departmentId,
      },
      select: {
        id: true,
      },
    });

    if (!section) {
      throw new Error(
        "กลุ่มงานไม่อยู่ในหน่วยงานของครุภัณฑ์"
      );
    }
  }

  // ตรวจสอบว่าผู้ครอบครองอยู่ในหน่วยงานเดียวกัน
  if (officerId !== null) {
    const officer = await prisma.officer.findFirst({
      where: {
        id: officerId,
        departmentId,
      },
      select: {
        id: true,
      },
    });

    if (!officer) {
      throw new Error(
        "ผู้ครอบครองไม่อยู่ในหน่วยงานของครุภัณฑ์"
      );
    }
  }

  const purchaseDate =
    purchaseDateValue === ""
      ? null
      : new Date(`${purchaseDateValue}T00:00:00`);

  if (
    purchaseDate !== null &&
    Number.isNaN(purchaseDate.getTime())
  ) {
    throw new Error("วันที่จัดซื้อไม่ถูกต้อง");
  }

  const price =
    priceValue === ""
      ? null
      : Number(priceValue);

  if (
    price !== null &&
    (!Number.isFinite(price) || price < 0)
  ) {
    throw new Error("ราคาจัดซื้อไม่ถูกต้อง");
  }

  const updatedAsset = await prisma.asset.update({
    where: {
      id: assetId,
    },
    data: {
      name,
      category: category as any,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      governmentAssetNo:
        governmentAssetNo || null,
      officeAssetNo:
        officeAssetNo || null,
      departmentId,
      sectionId,
      officerId,
      status: status as any,
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

  redirect(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}/${updatedAsset.id}`
  );
}