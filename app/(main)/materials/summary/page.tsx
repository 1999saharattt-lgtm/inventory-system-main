import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MaterialsSummaryClient from "./MaterialsSummaryClient";

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

export default async function MaterialsSummaryPage() {
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
    },
  });

  const data = materials.map((material) => {
    const latestReceive = material.receiveItems[0];

    // จำนวนคงเหลือจริงจากทุกล็อต
    const balance = material.receiveItems.reduce(
      (sum, item) => sum + item.balance,
      0
    );

    return {
      id: material.id,
      category: material.category,
      code: material.code,
      name: material.name,
      balance,
      unit: material.unit,

      // ราคาจากรายการรับเข้าล่าสุด
      latestPrice: latestReceive
        ? Number(latestReceive.unitPrice)
        : null,

      // ผู้จำหน่ายจากรายการรับเข้าล่าสุด
      latestVendor:
        latestReceive?.receive.vendor?.name ?? "-",
    };
  });

  return (
    <div className="space-y-5">
      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          text-white
          shadow-xl
        "
      >
        <div>
          <h1
            className="
              text-4xl
              font-extrabold
              !text-white
            "
          >
            📦 รายการพัสดุทั้งหมด
          </h1>

          <p
            className="
              mt-2
              text-xl
              font-semibold
              text-slate-200
            "
          >
            แสดงข้อมูลล่าสุดจากบัญชี Stock Card
          </p>
        </div>

        <Link
          href="/"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* Search + Categories + Tables */}

      <MaterialsSummaryClient
        materials={data}
        categories={categories}
        categoryName={categoryName}
      />
    </div>
  );
}