"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/* จำนวนแถวต้องตรงกับ ReceiveForm */
const RECEIVE_ROW_COUNT = 20;

type ReceiveRow = {
  materialId: number;
  qty: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
};

type FiscalYearInfo = {
  fiscalYearGregorian: number;
  fiscalYearThai: number;
  fiscalYearThaiShort: string;
  startDate: Date;
  endDate: Date;
};

/* แปลง YYYY-MM-DD เป็นเวลา 00:00 น. ประเทศไทย
   โดยตรวจสอบความถูกต้องของวันก่อนแปลง */
function parseDateOnly(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 3000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  // Bangkok UTC+7: เที่ยงคืนไทยคือ 17:00 UTC ของวันก่อนหน้า
  return new Date(Date.UTC(year, month - 1, day - 1, 17, 0, 0, 0));
}

function getFiscalYearInfoFromDate(date: Date): FiscalYearInfo {
  // อ่านวันที่ตามเขตเวลาไทย ไม่ขึ้นอยู่กับ timezone ของ Vercel
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const fiscalYearGregorian = month >= 10 ? year + 1 : year;
  const fiscalYearThai = fiscalYearGregorian + 543;

  return {
    fiscalYearGregorian,
    fiscalYearThai,
    fiscalYearThaiShort: String(fiscalYearThai).slice(-2),
    startDate: new Date(Date.UTC(fiscalYearGregorian - 1, 8, 30, 17, 0, 0, 0)),
    endDate: new Date(Date.UTC(fiscalYearGregorian, 8, 30, 17, 0, 0, 0)),
  };
}

/* เลขเอกสารรับแยกตามปีงบประมาณจากวันที่รับจริง */
async function generateReceiveNo(tx: any, receiveDate: Date) {
  const fiscal = getFiscalYearInfoFromDate(receiveDate);
  const receives = await tx.receive.findMany({
    where: {
      receiveDate: { gte: fiscal.startDate, lt: fiscal.endDate },
      documentNo: { startsWith: "ร." },
    },
    select: { documentNo: true },
  });

  let maxRunning = 0;
  for (const receive of receives) {
    const documentNo = String(receive.documentNo ?? "").trim();
    const match = documentNo.match(/^ร\.(\d+)\/(\d{2}|\d{4})$/);
    if (!match) continue;
    const running = Number(match[1]);
    if (!Number.isInteger(running) || running <= 0) continue;
    if (running > maxRunning) maxRunning = running;
  }

  return {
    documentNo: `ร.${String(maxRunning + 1).padStart(2, "0")}/${fiscal.fiscalYearThaiShort}`,
    fiscalYearThai: fiscal.fiscalYearThai,
  };
}

export async function createReceive(formData: FormData) {
  const receiveDateValue = String(formData.get("receiveDate") ?? "").trim();
  const receiveDate = parseDateOnly(receiveDateValue);
  const vendorId = Number(formData.get("vendorId"));
  const remark = String(formData.get("remark") ?? "").trim();

  // อนุญาตข้อความพิเศษเฉพาะยอดยกเข้าระบบ ตามระบบเดิม
  const submittedDocumentNo = String(formData.get("documentNo") ?? "").trim();
  const isOpeningBalance = submittedDocumentNo === "ยอดยกเข้าระบบ";

  if (!receiveDateValue || !receiveDate) {
    throw new Error("วันที่รับเข้าไม่ถูกต้อง");
  }
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    throw new Error("กรุณาเลือกผู้จำหน่าย");
  }

  const items: ReceiveRow[] = [];

  for (let i = 0; i < RECEIVE_ROW_COUNT; i++) {
    const materialId = Number(formData.get(`items[${i}].materialId`));
    const qty = Number(formData.get(`items[${i}].qty`));
    const unitPrice = Number(formData.get(`items[${i}].unitPrice`));
    const manufactureValue = String(formData.get(`items[${i}].manufacture`) ?? "").trim();
    const expiryValue = String(formData.get(`items[${i}].expiry`) ?? "").trim();

    if (!materialId && !qty) continue;

    if (!Number.isInteger(materialId) || materialId <= 0) {
      throw new Error(`รายการที่ ${i + 1} ยังไม่ได้เลือกพัสดุ`);
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`จำนวนรับเข้าของรายการที่ ${i + 1} ต้องเป็นจำนวนเต็มมากกว่า 0`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`ราคาต่อหน่วยของรายการที่ ${i + 1} ไม่ถูกต้อง`);
    }

    const manufacture = manufactureValue ? parseDateOnly(manufactureValue) : null;
    if (manufactureValue && !manufacture) {
      throw new Error(`วันผลิตของรายการที่ ${i + 1} ไม่ถูกต้อง`);
    }
    const expiry = expiryValue ? parseDateOnly(expiryValue) : null;
    if (expiryValue && !expiry) {
      throw new Error(`วันหมดอายุของรายการที่ ${i + 1} ไม่ถูกต้อง`);
    }
    if (manufacture && expiry && expiry.getTime() < manufacture.getTime()) {
      throw new Error(`วันหมดอายุของรายการที่ ${i + 1} ต้องไม่ก่อนวันผลิต`);
    }

    items.push({ materialId, qty, unitPrice, manufacture, expiry });
  }

  if (items.length === 0) {
    throw new Error("กรุณาเลือกรายการรับเข้าอย่างน้อย 1 รายการ");
  }

  const fiscal = getFiscalYearInfoFromDate(receiveDate);

  await prisma.$transaction(
    async (tx: any) => {
      const vendor = await tx.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, name: true },
      });
      if (!vendor) throw new Error("ไม่พบข้อมูลผู้จำหน่าย");

      const documentNo = isOpeningBalance
        ? "ยอดยกเข้าระบบ"
        : (await generateReceiveNo(tx, receiveDate)).documentNo;

      const receive = await tx.receive.create({
        data: { receiveDate, documentNo, vendorId, remark },
      });

      for (const item of items) {
        await tx.receiveItem.create({
          data: {
            receiveId: receive.id,
            materialId: item.materialId,
            qty: item.qty,
            balance: item.qty,
            unitPrice: item.unitPrice,
            manufacture: item.manufacture,
            expiry: item.expiry,
          },
        });

        const updatedMaterial = await tx.material.update({
          where: { id: item.materialId },
          data: {
            balance: { increment: item.qty },
            latestPrice: item.unitPrice,
          },
          select: { id: true, balance: true },
        });

        // Stock Card ใช้วันรับและเลขเอกสารเดียวกับหัวใบรับ
        await tx.transaction.create({
          data: {
            materialId: item.materialId,
            date: receiveDate,
            type: "RECEIVE",
            documentNo,
            receiveQty: item.qty,
            issueQty: 0,
            balance: updatedMaterial.balance,
            unitPrice: item.unitPrice,
            vendor: vendor.name,
            remark,
          },
        });
      }
    },
    { maxWait: 30000, timeout: 60000 }
  );

  redirect(`/receive?fiscalYear=${fiscal.fiscalYearThai}`);
}
