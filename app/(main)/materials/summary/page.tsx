import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import MaterialsSummaryClient from "./MaterialsSummaryClient";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   CATEGORY
========================================================= */

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
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
   CURRENT FISCAL YEAR — THAILAND
   ใช้หลักการเดียวกับหน้า /materials/category/[category]
========================================================= */

function getCurrentFiscalYearEnd(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const fiscalYearGregorian = month >= 10 ? year + 1 : year;

  return new Date(Date.UTC(fiscalYearGregorian, 9, 1, 0, 0, 0, 0));
}

function safeNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function getActualIssuedQty(item: {
  qty: number | null | undefined;
  issuedQty: number | null | undefined;
}): number {
  return safeNumber(item.issuedQty ?? item.qty);
}

/* =========================================================
   PAGE
========================================================= */

export default async function MaterialsSummaryPage() {
  /* =======================================================
     USER
  ======================================================= */

  const user = await getCurrentUser();
  const role = user?.role ?? "VIEWER";

  /* =======================================================
     MATERIALS
     โหลดข้อมูลเหมือนกันทุก Role
  ======================================================= */

  const currentFiscalYearEnd = getCurrentFiscalYearEnd();

  const materials = await prisma.material.findMany({
    orderBy: {
      code: "asc",
    },
    include: {
      receiveItems: {
        orderBy: {
          receive: {
            receiveDate: "desc",
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
      issueItems: {
        where: {
          issue: {
            status: "APPROVED",
            issueDate: {
              lt: currentFiscalYearEnd,
            },
          },
        },
        select: {
          qty: true,
          issuedQty: true,
        },
      },
    },
  });

  /* =======================================================
     PREPARE DATA
     คงเหลือ = รับเข้าก่อนสิ้นปีงบประมาณปัจจุบัน
               - จ่ายจริงที่อนุมัติก่อนสิ้นปีงบประมาณปัจจุบัน
     ราคาล่าสุด = material.latestPrice
  ======================================================= */

  const data = materials.map((material) => {
    const latestReceive = material.receiveItems[0];

    const totalReceive = material.receiveItems.reduce(
      (sum, item) =>
        item.receive.receiveDate < currentFiscalYearEnd
          ? sum + safeNumber(item.qty)
          : sum,
      0
    );

    const totalIssue = material.issueItems.reduce(
      (sum, item) => sum + getActualIssuedQty(item),
      0
    );

    const balance = totalReceive - totalIssue;

    return {
      id: material.id,
      category: material.category,
      code: material.code,
      name: material.name,
      balance,
      unit: material.unit,
      latestPrice:
        material.latestPrice == null
          ? null
          : safeNumber(material.latestPrice),
      latestVendor: latestReceive?.receive.vendor?.name ?? "-",
    };
  });

  /* =======================================================
     UI — คงเดิม
  ======================================================= */

  return (
    <AppPage>
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
            icon={<span aria-hidden="true">←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      <MaterialsSummaryClient
        materials={data}
        categories={categories}
        categoryName={categoryName}
        role={role}
      />
    </AppPage>
  );
}
