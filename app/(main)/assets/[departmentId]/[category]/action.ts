"use server";

import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AssetCategory,
  AssetStatus,
} from "@prisma/client";

/* =========================================================
   VALID CATEGORIES
   ========================================================= */

const validCategories = [
  "DESK",
  "CHAIR",
  "AIR_CONDITIONER",
  "TELEPHONE",
  "CABINET",
  "COMPUTER",
  "PRINTER",
  "OTHER",
  "NO_SYSTEM",
] as const;

/* =========================================================
   VALID STATUSES
   ========================================================= */

const validStatuses = [
  "IN_USE",
  "DAMAGED",
  "DETERIORATED",
  "UNNECESSARY",
  "WAITING_DISPOSAL",
  "DISPOSED",
] as const;

/* =========================================================
   UPDATE ASSET
   ========================================================= */

export async function updateAsset(
  assetId: number,
  formData: FormData
) {
  /* =======================================================
     ตรวจสอบผู้ใช้งาน
     ======================================================= */

  const currentUser = await requireLogin();

  /* =======================================================
     VIEWER ไม่มีสิทธิ์แก้ไข
     ======================================================= */

  if (currentUser.role === "VIEWER") {
    throw new Error(
      "ไม่มีสิทธิ์แก้ไขข้อมูลครุภัณฑ์"
    );
  }

  /* =======================================================
     ตรวจสอบ Asset เดิม
     ======================================================= */

  const asset =
    await prisma.asset.findUnique({
      where: {
        id: assetId,
      },

      select: {
        id: true,
        departmentId: true,
        governmentAssetNo: true,
        officeAssetNo: true,
        sectionId: true,
        officerId: true,
        status: true,
        responsibleName: true,
        brand: true,
        model: true,
        serialNumber: true,
        purchaseDate: true,
        price: true,
        location: true,
        remark: true,
        categoryDetail: true,
        quantity: true,
        unit: true,

      },
    });

  if (!asset) {
    throw new Error(
      "ไม่พบข้อมูลครุภัณฑ์"
    );
  }

  /* =======================================================
     STAFF แก้ได้เฉพาะหน่วยงานตัวเอง
     ======================================================= */

  if (
    currentUser.role === "STAFF" &&
    currentUser.departmentId !==
      asset.departmentId
  ) {
    throw new Error(
      "ไม่มีสิทธิ์แก้ไขครุภัณฑ์ของหน่วยงานนี้"
    );
  }

  /* =======================================================
     รับค่าจาก Form
     ======================================================= */

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const category = String(
    formData.get("category") ?? ""
  ).trim();

  const brand = String(
    formData.get("brand") ?? ""
  ).trim();

  const model = formData.has("model")
    ? String(formData.get("model") ?? "").trim()
    : asset.model ?? "";

  const combinedBrand = [asset.brand, asset.model].filter(Boolean).join(" / ");
  const brandChanged = !formData.has("model") && brand !== combinedBrand;
  const finalBrand = brandChanged ? brand : (formData.has("model") ? brand : asset.brand ?? "");
  const finalModel = brandChanged ? "" : model;

  const serialNumber = formData.has("serialNumber")
    ? String(formData.get("serialNumber") ?? "").trim()
    : asset.serialNumber ?? "";

  const governmentAssetNo = String(
    formData.get("governmentAssetNo") ?? ""
  ).trim();

  const officeAssetNo = String(
    formData.get("officeAssetNo") ?? ""
  ).trim();

  /* =======================================================
     responsibleName

     รองรับข้อมูลเดิมจาก Excel เช่น

     - หน้าห้องผู้อำนวยการ
     - ข้างห้องชั้น 4
     - ห้องประชุม
     - งานการเงิน
     - ชื่อผู้รับผิดชอบเดิม

     Field นี้แยกจาก officerId โดยสมบูรณ์
     ======================================================= */

  const responsibleName = String(
    formData.get("responsibleName") ?? ""
  ).trim();

  /*
   * หน่วยงานไม่สามารถเปลี่ยนจากหน้า Edit
   */
  const departmentId =
    asset.departmentId;

  const departmentIdFromFormRaw =
    String(
      formData.get("departmentId") ?? ""
    ).trim();

  const sectionIdValue = String(
    formData.get("sectionId") ?? ""
  ).trim();

  const officerIdValue = String(
    formData.get("officerId") ?? ""
  ).trim();

  const newOfficerName = String(formData.get("newOfficerName") ?? "").trim().replace(/\s+/g, " ");
  if (newOfficerName && officerIdValue) {
    throw new Error("กรุณาเลือกผู้ครอบครองเดิมหรือเพิ่มชื่อใหม่อย่างใดอย่างหนึ่ง");
  }


  const purchaseDateValue = formData.has("purchaseDate")
    ? String(formData.get("purchaseDate") ?? "").trim()
    : asset.purchaseDate?.toISOString().slice(0, 10) ?? "";

  const priceValue = formData.has("price")
    ? String(formData.get("price") ?? "").trim()
    : asset.price?.toString() ?? "";

  const location = formData.has("location")
    ? String(formData.get("location") ?? "").trim()
    : asset.location ?? "";

  const statusFromForm = String(
    formData.get("status") ?? ""
  ).trim();

  const remark = String(formData.get("remark") ?? "").trim();
  const categoryType = String(formData.get("categoryType") ?? "").trim();
  const previousCategoryLine = (asset.remark ?? "").split("\n")[0] ?? "";
  const previousCategoryType = previousCategoryLine.startsWith("หมวด/ชนิด: ")
    ? previousCategoryLine.slice("หมวด/ชนิด: ".length).trim()
    : "";
  const resolvedCategoryType = formData.has("categoryType")
    ? categoryType
    : (asset.categoryDetail?.trim() || previousCategoryType);
  // เก็บหมวด/ชนิดในฟิลด์เฉพาะ ไม่เขียนซ้ำในหมายเหตุ
  const resolvedRemark = remark;

  const quantityValue = String(formData.get("quantity") ?? asset.quantity).trim();
  const quantity = Number(quantityValue);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("จำนวนครุภัณฑ์ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
  }
  const unit = formData.has("unit")
    ? String(formData.get("unit") ?? "").trim()
    : asset.unit ?? "";

  /* =======================================================
     ตรวจสอบข้อมูลพื้นฐาน
     ======================================================= */

  if (!name) {
    throw new Error(
      "กรุณาระบุรายการครุภัณฑ์"
    );
  }

  if (!category) {
    throw new Error(
      "กรุณาระบุประเภทครุภัณฑ์"
    );
  }

  /* =======================================================
     ตรวจสอบ departmentId จาก Form
     ======================================================= */

  if (departmentIdFromFormRaw) {
    const departmentIdFromForm =
      Number(departmentIdFromFormRaw);

    if (
      !Number.isInteger(
        departmentIdFromForm
      ) ||
      departmentIdFromForm <= 0
    ) {
      throw new Error(
        "ข้อมูลหน่วยงานไม่ถูกต้อง"
      );
    }

    if (
      departmentIdFromForm !==
      departmentId
    ) {
      throw new Error(
        "ไม่สามารถเปลี่ยนหน่วยงานของครุภัณฑ์จากหน้านี้ได้"
      );
    }
  }

  /* =======================================================
     ตรวจสอบประเภทครุภัณฑ์
     ======================================================= */

  if (
    !validCategories.includes(
      category as
        (typeof validCategories)[number]
    )
  ) {
    throw new Error(
      "ประเภทครุภัณฑ์ไม่ถูกต้อง"
    );
  }

  const assetCategory =
    category as AssetCategory;

  /* =======================================================
     STATUS

     ADMIN
     → เปลี่ยนสถานะได้

     STAFF
     → คงสถานะเดิม
     ======================================================= */

  const status =
    currentUser.role === "ADMIN"
      ? statusFromForm
      : asset.status;

  if (
    !validStatuses.includes(
      status as
        (typeof validStatuses)[number]
    )
  ) {
    throw new Error(
      "สถานะครุภัณฑ์ไม่ถูกต้อง"
    );
  }

  const assetStatus =
    status as AssetStatus;

  /* =======================================================
     DEPARTMENT / SECTIONS
     ======================================================= */

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

  /* =======================================================
     SECTION

     ADMIN:
     เลือกหรือไม่เลือกก็ได้

     ข้อมูล responsibleName
     ไม่ขึ้นอยู่กับ Section
     ======================================================= */

  let sectionId: number | null = null;

  if (
    hasSections &&
    sectionIdValue
  ) {
    const parsedSectionId =
      Number(sectionIdValue);

    if (
      !Number.isInteger(
        parsedSectionId
      ) ||
      parsedSectionId <= 0
    ) {
      throw new Error(
        "ข้อมูลกลุ่มงานไม่ถูกต้อง"
      );
    }

    sectionId =
      parsedSectionId;
  }

  /* =======================================================
     ตรวจสอบ Section
     ======================================================= */

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

  /* =======================================================
     STAFF
     ======================================================= */

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

    if (
      staffUser.sectionId === null
    ) {
      throw new Error(
        "ไม่พบกลุ่มงานของผู้ใช้งาน"
      );
    }

    if (
      asset.sectionId !== null &&
      asset.sectionId !==
        staffUser.sectionId
    ) {
      throw new Error(
        "ไม่มีสิทธิ์แก้ไขครุภัณฑ์ของกลุ่มงานนี้"
      );
    }

    if (
      sectionId !==
      staffUser.sectionId
    ) {
      throw new Error(
        "ไม่สามารถเลือกกลุ่มงานอื่นได้"
      );
    }
  }

  /* =======================================================
     OFFICER / ผู้ครอบครอง

     Optional:
     ไม่เลือกได้
     ======================================================= */

  let officerId: number | null =
    null;

  if (officerIdValue) {
    const parsedOfficerId =
      Number(officerIdValue);

    if (
      !Number.isInteger(
        parsedOfficerId
      ) ||
      parsedOfficerId <= 0
    ) {
      throw new Error(
        "ข้อมูลผู้ครอบครองไม่ถูกต้อง"
      );
    }

    officerId =
      parsedOfficerId;
  }

  /* =======================================================
     ตรวจสอบ Officer

     รองรับ Officer ที่ผูก Department โดยตรง
     หรือผูกผ่าน Section
     ======================================================= */

  if (officerId !== null) {
    const officer =
      await prisma.officer.findFirst({
        where: {
          id: officerId,

          OR: [
            {
              departmentId,
            },

            {
              section: {
                departmentId,
              },
            },
          ],

          ...(sectionId !== null
            ? {
                sectionId,
              }
            : {}),
        },

        select: {
          id: true,
          departmentId: true,
          sectionId: true,

          section: {
            select: {
              id: true,
              departmentId: true,
            },
          },
        },
      });

    if (!officer) {
      throw new Error(
        sectionId !== null
          ? "ผู้ครอบครองไม่อยู่ในกลุ่มงานที่เลือก"
          : "ผู้ครอบครองไม่อยู่ในหน่วยงานของครุภัณฑ์"
      );
    }

    /* =====================================================
       ถ้ามี Section แต่ไม่ได้เลือก Section
       และเลือก Officer

       ใช้ Section ของ Officer อัตโนมัติ
       ===================================================== */

    if (
      hasSections &&
      sectionId === null &&
      officer.sectionId !== null
    ) {
      const officerSectionIsValid =
        department.sections.some(
          (section) =>
            section.id ===
            officer.sectionId
        );

      if (!officerSectionIsValid) {
        throw new Error(
          "กลุ่มงานของผู้ครอบครองไม่อยู่ในหน่วยงานของครุภัณฑ์"
        );
      }

      sectionId =
        officer.sectionId;
    }
  }

  // ชื่อใหม่จะถูกสร้างเป็น Officer หลังตรวจสอบข้อมูลอื่นครบแล้ว
  if (newOfficerName && !sectionId && hasSections) {
    throw new Error("กรุณาเลือกกลุ่มงานก่อนเพิ่มผู้ครอบครองใหม่");
  }

  /* =======================================================
     เลขครุภัณฑ์ / GFMIS ในหน้าแก้ไข

     อนุญาตให้แก้เลขเดิมที่บันทึกผิดเป็นเลขที่ผู้ใช้ระบุ
     โดยไม่บล็อกการบันทึกจากการพบเลขซ้ำในรายการอื่น
     (ไม่แก้ไขเลขของครุภัณฑ์รายการอื่น)

     หมายเหตุ: หากฐานข้อมูลกำหนด UNIQUE constraint ไว้
     Prisma ยังอาจปฏิเสธเลขซ้ำด้วย P2002
     ======================================================= */

  /* =======================================================
     วันที่จัดซื้อ
     ======================================================= */

  let purchaseDate: Date | null =
    null;

  if (purchaseDateValue) {
    const parsedDate =
      new Date(
        `${purchaseDateValue}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new Error(
        "วันที่จัดซื้อไม่ถูกต้อง"
      );
    }

    purchaseDate =
      parsedDate;
  }

  /* =======================================================
     ราคาจัดซื้อ
     ======================================================= */

  let price: number | null =
    null;

  if (priceValue) {
    const parsedPrice =
      Number(priceValue);

    if (
      !Number.isFinite(
        parsedPrice
      ) ||
      parsedPrice < 0
    ) {
      throw new Error(
        "ราคาจัดซื้อไม่ถูกต้อง"
      );
    }

    price =
      parsedPrice;
  }

  /* =======================================================
     UPDATE

     โครงสร้างสำคัญ:

     responsibleName
     = ข้อมูลผู้รับผิดชอบเดิม /
       ตำแหน่งจัดเก็บ

     officerId
     = บุคลากรที่เลือกจากระบบ

     ทั้งสอง Field แยกจากกัน
     ======================================================= */

  const updatedAsset = await prisma.$transaction(async (tx) => {
    const resolvedOfficerId = newOfficerName ? null : officerId;
    const previousOfficer = asset.officerId
      ? await tx.officer.findUnique({ where: { id: asset.officerId }, select: { firstName: true, lastName: true } })
      : null;
    const nextOfficer = resolvedOfficerId
      ? await tx.officer.findUnique({ where: { id: resolvedOfficerId }, select: { firstName: true, lastName: true } })
      : null;
    const oldOwnerName = previousOfficer
      ? `${previousOfficer.firstName} ${previousOfficer.lastName}`.trim()
      : (asset.responsibleName ?? "");
    const nextOwnerName = newOfficerName || (nextOfficer
      ? `${nextOfficer.firstName} ${nextOfficer.lastName}`.trim()
      : (responsibleName || ""));
    const ownerChanged = oldOwnerName !== nextOwnerName || asset.officerId !== resolvedOfficerId;
    const updated = await tx.asset.update({
      where: {
        id: assetId,
      },

      data: {
        name,

        category:
          assetCategory,

        brand:
          finalBrand || null,

        model:
          finalModel || null,

        serialNumber:
          serialNumber || null,

        governmentAssetNo:
          governmentAssetNo ||
          null,

        officeAssetNo:
          officeAssetNo ||
          null,

        /*
         * Department เดิม
         */
        departmentId,

        /*
         * กลุ่มงาน
         */
        sectionId,

        /*
         * ผู้ครอบครองจากระบบ
         *
         * Optional
         */
        officerId: resolvedOfficerId,

        /*
         * ผู้รับผิดชอบเดิม /
         * ตำแหน่งจัดเก็บ
         *
         * เช่น
         * "หน้าห้องผู้อำนวยการ"
         *
         * ไม่เกี่ยวกับ officerId
         */
        responsibleName:
          nextOwnerName || (resolvedOfficerId === null && !newOfficerName ? responsibleName : "") || null,

        status:
          assetStatus,

        purchaseDate,

        price,

        location:
          location || null,

        remark:
          resolvedRemark || null,

        categoryDetail:
          resolvedCategoryType || null,

        quantity,
        unit: unit || null,
      },

      select: {
        id: true,
        departmentId: true,
        category: true,
      },
    });
    if (ownerChanged) {
      await tx.assetOwnerHistory.create({
        data: {
          assetId,
          previousOfficerId: asset.officerId,
          nextOfficerId: resolvedOfficerId,
          previousName: oldOwnerName || null,
          nextName: nextOwnerName || null,
          changedById: currentUser.id,
        },
      });
    }
    return updated;
  });

  /* =======================================================
     REVALIDATE
     ======================================================= */

  revalidatePath(
    "/assets"
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}`
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}/all`
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}`
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}/${updatedAsset.id}`
  );

  revalidatePath(
    `/assets/${updatedAsset.departmentId}/${updatedAsset.category}/${updatedAsset.id}/edit`
  );

  /* =======================================================
     REDIRECT
     ======================================================= */

  const rawFiscalYear = String(formData.get("fiscalYear") ?? "").trim();
  const fiscalYearQuery = /^\d{4}$/.test(rawFiscalYear)
    ? `?fiscalYear=${rawFiscalYear}`
    : "";
  // หลังบันทึกสำเร็จ กลับไปยังหน้ารายการของหมวดครุภัณฑ์นั้นเสมอ
  const categoryPath = `/assets/${updatedAsset.departmentId}/${updatedAsset.category.toLowerCase()}`;
  redirect(`${categoryPath}${fiscalYearQuery}`);
}