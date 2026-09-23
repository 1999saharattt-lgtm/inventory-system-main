import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import MaterialsSummaryClient from "./MaterialsSummaryClient";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<
  string,
  string
> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
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

export default async function MaterialsSummaryPage() {
  /* =======================================================
     USER
  ======================================================= */

  const user =
    await getCurrentUser();

  const role =
    user?.role ?? "VIEWER";

  /* =======================================================
     MATERIALS

     โหลดข้อมูลเหมือนกันทุก Role
     เพื่อให้ Search และจำนวนรายการทำงานจากตัวกลางเดียวกัน
  ======================================================= */

  const materials =
    await prisma.material.findMany({
      orderBy: {
        code: "asc",
      },

      include: {
        receiveItems: {
          orderBy: {
            receive: {
              receiveDate:
                "desc",
            },
          },

          include: {
            receive: {
              include: {
                vendor: true,
              },
            },
          },
        },

        issueItems: true,
      },
    });

  /* =======================================================
     PREPARE DATA
  ======================================================= */

  const data = materials.map(
    (material) => {
      const latestReceive =
        material.receiveItems[0];

      const totalReceive =
        material.receiveItems.reduce(
          (sum, item) =>
            sum + item.qty,
          0
        );

      const totalIssue =
        material.issueItems.reduce(
          (sum, item) =>
            sum + item.qty,
          0
        );

      const balance =
        totalReceive -
        totalIssue;

      return {
        id: material.id,

        category:
          material.category,

        code:
          material.code,

        name:
          material.name,

        balance,

        unit:
          material.unit,

        latestPrice:
          latestReceive
            ? Number(
                latestReceive.unitPrice
              )
            : null,

        latestVendor:
          latestReceive?.receive
            .vendor?.name ??
          "-",
      };
    }
  );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* ===================================================
          HEADER
      =================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle={
          role === "ADMIN"
            ? "แสดงข้อมูลล่าสุดจากบัญชี Stock Card"
            : "เลือกหมวดหมู่เพื่อดูรายการพัสดุ"
        }
        actions={
          <AppButton
            href="/"
            variant="back"
            size="md"
            icon={
              <span aria-hidden="true">
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* ===================================================
          MATERIALS SUMMARY
      =================================================== */}

      <MaterialsSummaryClient
        materials={data}
        categories={categories}
        categoryName={
          categoryName
        }
        role={role}
      />
    </AppPage>
  );
}