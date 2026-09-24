import { prisma } from "@/lib/prisma";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

import LowStockClient from "./LowStockClient";

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  OFFICE:
    "วัสดุสำนักงาน",

  COMPUTER:
    "วัสดุคอมพิวเตอร์",

  ELECTRIC:
    "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD:
    "วัสดุงานบ้านและงานครัว",

  VEHICLE:
    "วัสดุยานพาหนะ",

  PRINTING:
    "วัสดุสื่อสิ่งพิมพ์",
};

const categories = [
  "OFFICE",
  "COMPUTER",
  "ELECTRIC",
  "HOUSEHOLD",
  "VEHICLE",
  "PRINTING",
];

/* =========================================================
   PAGE
========================================================= */

export default async function LowStockPage() {
  /* =======================================================
     LOAD LOW STOCK MATERIALS

     แสดงเฉพาะพัสดุคงเหลือน้อยกว่า 10

     - หมด = 0 หรือต่ำกว่า
     - ใกล้หมด = 1 - 9
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      where: {
        balance: {
          lt: 10,
        },
      },

      orderBy: [
        {
          category:
            "asc",
        },
        {
          code:
            "asc",
        },
      ],

      include: {
        receiveItems: {
          orderBy: [
            {
              receive: {
                receiveDate:
                  "desc",
              },
            },
            {
              id:
                "desc",
            },
          ],

          include: {
            receive: {
              include: {
                vendor:
                  true,
              },
            },
          },
        },
      },
    });

  /* =======================================================
     PREPARE DATA
  ======================================================= */

  const data =
    materials.map(
      (material) => {
        const latestReceive =
          material.receiveItems[0];

        return {
          id:
            material.id,

          category:
            material.category,

          code:
            material.code,

          name:
            material.name,

          balance:
            Number(
              material.balance
            ),

          unit:
            material.unit,

          latestPrice:
            latestReceive
              ? Number(
                  latestReceive.unitPrice
                )
              : null,

          latestVendor:
            latestReceive
              ?.receive
              .vendor
              ?.name ??
            "-",
        };
      }
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="⚠️"
        title="รายการพัสดุใกล้หมด"
        subtitle="แสดงรายการพัสดุที่มีจำนวนคงเหลือน้อยกว่า 10"
        actions={
          <AppButton
            href="/"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          LOW STOCK CONTENT

          ใช้โครงสร้างเดียวกับ
          /materials/summary

          - AppSearchInput
          - AppTableCard
          - Client-side realtime search
      ===================================================== */}

      <LowStockClient
        materials={data}
        categories={
          categories
        }
        categoryName={
          categoryName
        }
      />
    </AppPage>
  );
}