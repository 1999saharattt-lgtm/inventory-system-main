"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import fs from "fs/promises";
import path from "path";

/* =========================================================
   FORM ROW COUNT

   พอ.101 มี 18 รายการ
========================================================= */

const ISSUE_ROW_COUNT =
  18;

/* =========================================================
   TYPES
========================================================= */

type IssueRow = {
  materialId: number;
  qty: number;
  remark: string;
};

type FiscalYearInfo = {
  fiscalYearGregorian:
    number;

  fiscalYearThai:
    number;

  fiscalYearThaiShort:
    string;

  startDate:
    Date;

  endDate:
    Date;
};

/* =========================================================
   DATE ONLY

   รับค่าจาก input type="date"

   YYYY-MM-DD

   ไม่ใช้ new Date("YYYY-MM-DD") ตรง ๆ
   ใน logic วันที่
========================================================= */

function parseDateOnly(
  value: string
): Date | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const match =
    trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

  if (
    !Number.isInteger(
      year
    ) ||
    !Number.isInteger(
      month
    ) ||
    !Number.isInteger(
      day
    )
  ) {
    return null;
  }

  if (
    year < 1900 ||
    year > 3000
  ) {
    return null;
  }

  if (
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  if (
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
      )
    );

  /*
   * ตรวจวันที่จริง
   *
   * เช่น:
   * 31 ก.พ.
   * ต้องไม่ผ่าน
   */

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   FISCAL YEAR FROM ISSUE DATE

   ตัวอย่าง:

   30 ก.ย. 2569
   =>
   FY 2569

   1 ต.ค. 2569
   =>
   FY 2570
========================================================= */

function getFiscalYearInfoFromDate(
  date: Date
): FiscalYearInfo {
  /*
   * date มาจาก parseDateOnly()
   * จึงอ่านส่วนวันที่ด้วย UTC
   */

  const year =
    date.getUTCFullYear();

  const month =
    date.getUTCMonth() +
    1;

  const fiscalYearGregorian =
    month >= 10
      ? year + 1
      : year;

  const fiscalYearThai =
    fiscalYearGregorian +
    543;

  const fiscalYearThaiShort =
    String(
      fiscalYearThai
    ).slice(
      -2
    );

  /*
   * ช่วงปีงบประมาณตามเวลาไทย
   *
   * FY 2570:
   *
   * start:
   * 1 ต.ค. 2569 00:00 ไทย
   *
   * end exclusive:
   * 1 ต.ค. 2570 00:00 ไทย
   *
   * เวลาไทย UTC+7
   *
   * 00:00 ไทย
   * =
   * 17:00 UTC วันก่อนหน้า
   */

  const startDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian -
          1,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  return {
    fiscalYearGregorian,

    fiscalYearThai,

    fiscalYearThaiShort,

    startDate,

    endDate,
  };
}

/* =========================================================
   GENERATE ISSUE DOCUMENT NUMBER

   รูปแบบ:
   จ.01/70
   จ.02/70
   จ.03/70

   ทุกวันที่ 1 ตุลาคม:
   เริ่มเลข 01 ใหม่

   สำคัญ:
   - ใช้ issueDate จริง
   - สร้างใน transaction
   - ไม่เชื่อ documentNo จาก browser
========================================================= */

async function generateIssueNo(
  tx: any,
  issueDate: Date
) {
  const fiscal =
    getFiscalYearInfoFromDate(
      issueDate
    );

  /* =======================================================
     LOAD DOCUMENTS IN SAME FISCAL YEAR
  ======================================================= */

  const issues =
    await tx.issue.findMany({
      where: {
        issueDate: {
          gte:
            fiscal.startDate,

          lt:
            fiscal.endDate,
        },

        documentNo: {
          startsWith:
            "จ.",
        },
      },

      select: {
        documentNo:
          true,
      },
    });

  /* =======================================================
     FIND HIGHEST RUNNING NUMBER

     รองรับข้อมูลเดิม:

     จ.1/69
     จ.01/69
     จ.001/69
     จ.01/2569

     เลขใหม่ยังคงสร้างเป็น:
     จ.01/70
  ======================================================= */

  let maxRunning =
    0;

  for (
    const issue of
      issues
  ) {
    const documentNo =
      String(
        issue.documentNo ??
          ""
      ).trim();

    const match =
      documentNo.match(
        /^จ\.(\d+)\/(\d{2}|\d{4})$/
      );

    if (!match) {
      continue;
    }

    const running =
      Number(
        match[1]
      );

    if (
      !Number.isInteger(
        running
      ) ||
      running <= 0
    ) {
      continue;
    }

    if (
      running >
      maxRunning
    ) {
      maxRunning =
        running;
    }
  }

  const nextRunning =
    maxRunning +
    1;

  const documentNo =
    `จ.${String(
      nextRunning
    ).padStart(
      2,
      "0"
    )}/${fiscal.fiscalYearThaiShort}`;

  return {
    documentNo,

    fiscalYearThai:
      fiscal.fiscalYearThai,
  };
}

/* =========================================================
   SAFE FILE NAME

   ป้องกัน path separator จากชื่อไฟล์เดิม
========================================================= */

function sanitizeFileName(
  value: string
) {
  return value
    .replace(
      /[\\/]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    )
    .trim();
}

/* =========================================================
   CREATE ISSUE
========================================================= */

export async function createIssue(
  formData: FormData
) {
  /* =======================================================
     HEADER
  ======================================================= */

  const issueDateValue =
    String(
      formData.get(
        "issueDate"
      ) ?? ""
    ).trim();

  const issueDate =
    parseDateOnly(
      issueDateValue
    );

  const departmentId =
    Number(
      formData.get(
        "departmentId"
      )
    );

  const officerIdValue =
    String(
      formData.get(
        "officerId"
      ) ?? ""
    ).trim();

  const officerId =
    officerIdValue
      ? Number(
          officerIdValue
        )
      : null;

  const remark =
    String(
      formData.get(
        "remark"
      ) ?? ""
    ).trim();

  /* =======================================================
     VALIDATE HEADER
  ======================================================= */

  if (
    !issueDateValue ||
    !issueDate
  ) {
    throw new Error(
      "กรุณาระบุวันที่เบิกให้ถูกต้อง"
    );
  }

  if (
    !Number.isInteger(
      departmentId
    ) ||
    departmentId <= 0
  ) {
    throw new Error(
      "กรุณาเลือกหน่วยงาน / กลุ่มงาน"
    );
  }

  if (
    officerId !== null &&
    (
      !Number.isInteger(
        officerId
      ) ||
      officerId <= 0
    )
  ) {
    throw new Error(
      "ข้อมูลผู้ขอเบิกไม่ถูกต้อง"
    );
  }

  /* =======================================================
     ITEMS

     ตอนสร้าง:
     - qty = จำนวนที่ขอ
     - issuedQty = 0
     - receiveItemId = null
     - ยังไม่ตัด Stock
     - ยังไม่ FEFO
  ======================================================= */

  const items:
    IssueRow[] =
    [];

  for (
    let i = 0;
    i <
    ISSUE_ROW_COUNT;
    i++
  ) {
    const materialIdValue =
      formData.get(
        `items[${i}].materialId`
      );

    const qtyValue =
      formData.get(
        `items[${i}].qty`
      );

    const itemRemark =
      String(
        formData.get(
          `items[${i}].remark`
        ) ?? ""
      ).trim();

    const materialId =
      Number(
        materialIdValue
      );

    const qty =
      Number(
        qtyValue
      );

    /* =====================================================
       EMPTY ROW
    ===================================================== */

    if (
      (
        materialIdValue ===
          null ||
        String(
          materialIdValue
        ).trim() ===
          ""
      ) &&
      (
        qtyValue ===
          null ||
        String(
          qtyValue
        ).trim() ===
          ""
      )
    ) {
      continue;
    }

    /* =====================================================
       MATERIAL
    ===================================================== */

    if (
      !Number.isInteger(
        materialId
      ) ||
      materialId <= 0
    ) {
      throw new Error(
        `กรุณาเลือกพัสดุในรายการที่ ${
          i + 1
        }`
      );
    }

    /* =====================================================
       QTY
    ===================================================== */

    if (
      !Number.isFinite(
        qty
      ) ||
      !Number.isInteger(
        qty
      ) ||
      qty <= 0
    ) {
      throw new Error(
        `จำนวนที่ขอเบิกของรายการที่ ${
          i + 1
        } ต้องเป็นจำนวนเต็มมากกว่า 0`
      );
    }

    items.push({
      materialId,

      qty,

      remark:
        itemRemark,
    });
  }

  /* =======================================================
     REQUIRE ITEMS
  ======================================================= */

  if (
    items.length ===
    0
  ) {
    throw new Error(
      "กรุณาเลือกรายการพัสดุ"
    );
  }

  /* =======================================================
     DUPLICATE MATERIAL

     1 ใบเบิก
     ไม่ควรมี Material เดียวกันซ้ำหลายแถว

     ช่วยให้การอนุมัติและตัด FEFO ชัดเจน
  ======================================================= */

  const materialIds =
    items.map(
      (item) =>
        item.materialId
    );

  if (
    new Set(
      materialIds
    ).size !==
    materialIds.length
  ) {
    throw new Error(
      "ไม่สามารถเลือกรายการพัสดุซ้ำกันได้ในใบเบิกเดียวกัน"
    );
  }

  /* =======================================================
     VALIDATE DEPARTMENT
  ======================================================= */

  const department =
    await prisma.department.findUnique({
      where: {
        id:
          departmentId,
      },

      select: {
        id:
          true,
      },
    });

  if (!department) {
    throw new Error(
      "ไม่พบข้อมูลหน่วยงาน / กลุ่มงาน"
    );
  }

  /* =======================================================
     VALIDATE OFFICER
  ======================================================= */

  if (
    officerId !==
    null
  ) {
    const officer =
      await prisma.officer.findUnique({
        where: {
          id:
            officerId,
        },

        select: {
          id:
            true,
        },
      });

    if (!officer) {
      throw new Error(
        "ไม่พบข้อมูลผู้ขอเบิก"
      );
    }
  }

  /* =======================================================
     VALIDATE MATERIALS

     ตรวจว่ามีพัสดุจริง

     ยังไม่ตรวจ ReceiveItem
     ยังไม่ทำ FEFO
     ยังไม่ตัด Stock
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      where: {
        id: {
          in:
            materialIds,
        },
      },

      select: {
        id:
          true,

        name:
          true,
      },
    });

  const existingMaterialIds =
    new Set(
      materials.map(
        (material) =>
          material.id
      )
    );

  for (
    const item of
      items
  ) {
    if (
      !existingMaterialIds.has(
        item.materialId
      )
    ) {
      throw new Error(
        `ไม่พบพัสดุ ID ${item.materialId}`
      );
    }
  }

  /* =======================================================
     UPLOAD PDF

     คงวิธีการเดิมของระบบไว้
  ======================================================= */

  let pdfPath:
    string | null =
    null;

  const fileValue =
    formData.get(
      "pdf"
    );

  const file =
    fileValue instanceof
    File
      ? fileValue
      : null;

  if (
    file &&
    file.size >
      0
  ) {
    /* =====================================================
       PDF VALIDATION
    ===================================================== */

    const originalFileName =
      sanitizeFileName(
        file.name ||
          "document.pdf"
      );

    const isPdfName =
      originalFileName
        .toLowerCase()
        .endsWith(
          ".pdf"
        );

    const isPdfType =
      !file.type ||
      file.type ===
        "application/pdf";

    if (
      !isPdfName ||
      !isPdfType
    ) {
      throw new Error(
        "ไฟล์เอกสารแนบต้องเป็น PDF เท่านั้น"
      );
    }

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(
        bytes
      );

    const uploadDir =
      path.join(
        process.cwd(),
        "public",
        "uploads",
        "issue"
      );

    await fs.mkdir(
      uploadDir,
      {
        recursive:
          true,
      }
    );

    const filename =
      `${Date.now()}-${originalFileName}`;

    const filepath =
      path.join(
        uploadDir,
        filename
      );

    await fs.writeFile(
      filepath,
      buffer
    );

    pdfPath =
      `/uploads/issue/${filename}`;
  }

  /* =======================================================
     FISCAL YEAR FOR REDIRECT
  ======================================================= */

  const fiscal =
    getFiscalYearInfoFromDate(
      issueDate
    );

  /* =======================================================
     CREATE ISSUE

     status = PENDING

     ยังไม่:
     - ตัด stock
     - เลือก ReceiveItem
     - ทำ FEFO
     - สร้าง ISSUE transaction ใน Stock Card
  ======================================================= */

  await prisma.$transaction(
    async (
      tx: any
    ) => {
      /* =================================================
         GENERATE FINAL DOCUMENT NUMBER

         สร้างตอนบันทึกจริง
         จาก issueDate จริง
      ================================================= */

      const generated =
        await generateIssueNo(
          tx,
          issueDate
        );

      const documentNo =
        generated.documentNo;

      /* =================================================
         CREATE ISSUE HEADER
      ================================================= */

      const issue =
        await tx.issue.create({
          data: {
            issueDate,

            documentNo,

            departmentId,

            officerId,

            remark,

            pdf:
              pdfPath,

            status:
              "PENDING",

            approvedAt:
              null,

            approvedById:
              null,
          },
        });

      /* =================================================
         CREATE ISSUE ITEMS

         qty
         =
         จำนวนที่ขอ

         issuedQty
         =
         0

         Admin จะลงจำนวนจ่ายจริงภายหลัง
      ================================================= */

      for (
        const item of
          items
      ) {
        await tx.issueItem.create({
          data: {
            issueId:
              issue.id,

            materialId:
              item.materialId,

            qty:
              item.qty,

            issuedQty:
              0,

            receiveItemId:
              null,

            manufacture:
              null,

            expiry:
              null,

            remark:
              item.remark ||
              null,
          },
        });
      }
    },
    {
      maxWait:
        30000,

      timeout:
        60000,
    }
  );

  /* =======================================================
     REDIRECT

     กลับไปยังปีงบประมาณของใบเบิกที่เพิ่งสร้าง

     30 ก.ย. 2569
     =>
     /issue?fiscalYear=2569

     1 ต.ค. 2569
     =>
     /issue?fiscalYear=2570
  ======================================================= */

  redirect(
    `/issue?fiscalYear=${fiscal.fiscalYearThai}`
  );
}