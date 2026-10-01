import { prisma } from "@/lib/prisma";

import ComputerLotLabelsPdf from "./ComputerLotLabelsPdf";

/* =========================================================
   FORCE FRESH DATA

   ดึงข้อมูลใหม่จากฐานข้อมูลทุกครั้งที่เปิด PDF
========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES

   สำคัญ:
   1 ReceiveItem = 1 ล็อตจริง
========================================================= */

type LotLabel = {
  receiveItemId: number;
  receiveId: number;

  materialId: number;

  code: string;
  name: string;
  unit: string;

  balance: number;

  manufacture: string | null;
  expiry: string | null;

  receiveDate: string | null;
  documentNo: string;
};

/* =========================================================
   PAGE
========================================================= */

export default async function ComputerLotLabelsPdfPage() {
  /* =======================================================
     LOAD RECEIVE ITEMS

     ห้ามดึงจาก Material.balance เพื่อสร้างป้าย

     ต้องใช้ ReceiveItem.balance เท่านั้น
     เพราะแต่ละ ReceiveItem คือคนละล็อต
  ======================================================= */

  const receiveItems =
    await prisma.receiveItem.findMany({
      where: {
        balance: {
          gt: 0,
        },

        material: {
          category: "COMPUTER",
        },
      },

      select: {
        id: true,
        receiveId: true,
        materialId: true,

        balance: true,

        manufacture: true,
        expiry: true,

        material: {
          select: {
            code: true,
            name: true,
            unit: true,
          },
        },

        receive: {
          select: {
            id: true,
            receiveDate: true,
            documentNo: true,
          },
        },
      },

      orderBy: [
        {
          materialId: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  /* =======================================================
     FILTER INK / TONER / DRUM

     ยังคงจำกัดเฉพาะวัสดุเกี่ยวกับ
     หมึก / ตลับ / toner / drum
  ======================================================= */

  const inkKeywords = [
    "หมึก",
    "ตลับหมึก",
    "หมึกพิมพ์",
    "หมึกเครื่องพิมพ์",
    "โทนเนอร์",
    "ตลับโทนเนอร์",

    "ดรัม",
    "ชุดดรัม",
    "ตลับดรัม",

    "ink",
    "toner",
    "cartridge",
    "drum",
  ];

  const filteredItems =
    receiveItems.filter((item) => {
      const materialName =
        item.material.name
          .trim()
          .toLowerCase();

      return inkKeywords.some(
        (keyword) =>
          materialName.includes(
            keyword.toLowerCase()
          )
      );
    });

  /* =======================================================
     SERIALIZE

     สำคัญ:
     ไม่รวม ReceiveItem
     ไม่ aggregate balance
     ไม่เลือกวันที่จากล็อตอื่น

     แต่ละ element ด้านล่าง = ReceiveItem จริง 1 รายการ
  ======================================================= */

  const lots: LotLabel[] =
    filteredItems.map((item) => ({
      receiveItemId:
        item.id,

      receiveId:
        item.receiveId,

      materialId:
        item.materialId,

      code:
        item.material.code,

      name:
        item.material.name,

      unit:
        item.material.unit,

      balance:
        Number(
          item.balance ?? 0
        ),

      manufacture:
        item.manufacture
          ? item.manufacture.toISOString()
          : null,

      expiry:
        item.expiry
          ? item.expiry.toISOString()
          : null,

      receiveDate:
        item.receive?.receiveDate
          ? item.receive.receiveDate.toISOString()
          : null,

      documentNo:
        item.receive?.documentNo ??
        "",
    }));

  /* =======================================================
     PDF CLIENT
  ======================================================= */

  return (
    <ComputerLotLabelsPdf
      lots={lots}
    />
  );
}