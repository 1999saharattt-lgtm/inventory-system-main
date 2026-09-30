import { prisma } from "@/lib/prisma";

import ComputerLotLabelsPdf from "./ComputerLotLabelsPdf";

/* =========================================================
   TYPES
========================================================= */

type LotLabel = {
  id: number;
  materialId: number;

  code: string;
  name: string;
  unit: string;

  balance: number;

  manufacture: string | null;
  expiry: string | null;
  receiveDate: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default async function ComputerLotLabelsPdfPage() {
  /* =======================================================
     LOAD COMPUTER MATERIAL LOTS

     เงื่อนไข:
     - วัสดุคอมพิวเตอร์
     - ยังมีคงเหลือ
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
            receiveDate: true,
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });

  /* =======================================================
     FILTER INK / TONER / DRUM

     ตัวอย่างชื่อที่ต้องการ:
     - หมึกพิมพ์
     - ตลับหมึก
     - หมึกเครื่องพิมพ์
     - ชุดดรัม
     - ตลับดรัม
     - DRUM
     - TONER
  ======================================================= */

  const inkKeywords = [
    "หมึก",
    "ดรัม",
    "drum",
    "toner",
  ];

  const filteredItems =
    receiveItems.filter(
      (item) => {
        const name =
          item.material.name
            .trim()
            .toLowerCase();

        return inkKeywords.some(
          (keyword) =>
            name.includes(
              keyword
            )
        );
      }
    );

  /* =======================================================
     SERIALIZE
  ======================================================= */

  const lots: LotLabel[] =
    filteredItems.map(
      (item) => ({
        id: item.id,

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
      })
    );

  /* =======================================================
     CLIENT PDF
  ======================================================= */

  return (
    <ComputerLotLabelsPdf
      lots={lots}
    />
  );
}