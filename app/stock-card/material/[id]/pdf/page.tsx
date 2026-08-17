import { prisma } from "@/lib/prisma";
import PdfAutoExport from "./PdfAutoExport";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StockCardPdfPage({
  params,
}: Props) {
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      vendor: true,

      receiveItems: {
        include: {
          receive: {
            include: {
              vendor: true,
            },
          },
        },

        orderBy: {
          receive: {
            receiveDate: "asc",
          },
        },
      },

      issueItems: {
        include: {
          issue: {
            include: {
              department: true,
            },
          },
        },

        orderBy: {
          issue: {
            issueDate: "asc",
          },
        },
      },
    },
  });

  if (!material) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        ไม่พบข้อมูลพัสดุ
      </div>
    );
  }

  // ==========================================
  // รายการรับเข้าล่าสุด
  // ==========================================

  const latestReceiveItem =
    material.receiveItems.length > 0
      ? material.receiveItems[
          material.receiveItems.length - 1
        ]
      : null;

  const latestPrice =
    latestReceiveItem
      ? Number(latestReceiveItem.unitPrice)
      : 0;

  // ==========================================
  // เตรียมล็อตสำหรับคำนวณรายการเบิกเก่า
  // ==========================================

  const lotBalances = new Map<number, number>();

  for (const receiveItem of material.receiveItems) {
    lotBalances.set(
      receiveItem.id,
      Number(receiveItem.qty)
    );
  }

  // ==========================================
  // รายการเบิกทั้งหมด
  // ==========================================

  const sortedIssueItems = [
    ...material.issueItems,
  ].sort(
    (a, b) =>
      new Date(a.issue.issueDate).getTime() -
      new Date(b.issue.issueDate).getTime()
  );

  // ==========================================
  // หักรายการที่มีล็อตระบุไว้แล้ว
  // ==========================================

  for (const issueItem of sortedIssueItems) {
    if (issueItem.receiveItemId) {
      const current =
        lotBalances.get(
          issueItem.receiveItemId
        ) ?? 0;

      lotBalances.set(
        issueItem.receiveItemId,
        Math.max(
          0,
          current - Number(issueItem.qty)
        )
      );
    }
  }

  // ==========================================
  // รายการเบิกเก่าที่ไม่มีล็อต
  // ==========================================

  const legacyIssues =
    sortedIssueItems.filter(
      (item) => !item.receiveItemId
    );

  // ==========================================
  // เรียงล็อต FEFO
  // ไม่ระบุวันให้มาก่อน
  // ==========================================

  const sortedLots = [
    ...material.receiveItems,
  ].sort((a, b) => {
    const aHasDate =
      !!a.manufacture || !!a.expiry;

    const bHasDate =
      !!b.manufacture || !!b.expiry;

    if (!aHasDate && bHasDate) {
      return -1;
    }

    if (aHasDate && !bHasDate) {
      return 1;
    }

    const aExpiry = a.expiry
      ? new Date(a.expiry).getTime()
      : Number.MAX_SAFE_INTEGER;

    const bExpiry = b.expiry
      ? new Date(b.expiry).getTime()
      : Number.MAX_SAFE_INTEGER;

    if (aExpiry !== bExpiry) {
      return aExpiry - bExpiry;
    }

    const aManufacture = a.manufacture
      ? new Date(a.manufacture).getTime()
      : Number.MAX_SAFE_INTEGER;

    const bManufacture = b.manufacture
      ? new Date(b.manufacture).getTime()
      : Number.MAX_SAFE_INTEGER;

    if (aManufacture !== bManufacture) {
      return (
        aManufacture - bManufacture
      );
    }

    return a.id - b.id;
  });

  // ==========================================
  // จับล็อตให้รายการเบิกเก่า
  // ==========================================

  const legacyIssueLots = new Map<
    number,
    {
      manufacture: Date | null;
      expiry: Date | null;
    }
  >();

  for (const issueItem of legacyIssues) {
    let remainingQty = Number(
      issueItem.qty
    );

    for (const lot of sortedLots) {
      if (remainingQty <= 0) {
        break;
      }

      const available =
        lotBalances.get(lot.id) ?? 0;

      if (available <= 0) {
        continue;
      }

      const issueQty = Math.min(
        remainingQty,
        available
      );

      legacyIssueLots.set(
        issueItem.id,
        {
          manufacture:
            lot.manufacture,
          expiry:
            lot.expiry,
        }
      );

      lotBalances.set(
        lot.id,
        available - issueQty
      );

      remainingQty -= issueQty;
    }
  }

  // ==========================================
  // สร้าง Stock Card
  // ==========================================

  const rows = [
    ...material.receiveItems.map(
      (item) => ({
        date: item.receive.receiveDate,

        documentNo:
          item.receive.documentNo,

        owner:
          item.receive.vendor?.name ??
          "-",

        unitPrice:
          Number(item.unitPrice),

        receiveQty: Number(item.qty),

        issueQty: 0,

        manufacture:
          item.manufacture,

        expiry:
          item.expiry,
      })
    ),

    ...material.issueItems.map(
      (item) => {
        let manufacture =
          item.manufacture;

        let expiry =
          item.expiry;

        if (
          !manufacture &&
          !expiry &&
          !item.receiveItemId
        ) {
          const legacyLot =
            legacyIssueLots.get(
              item.id
            );

          if (legacyLot) {
            manufacture =
              legacyLot.manufacture;

            expiry =
              legacyLot.expiry;
          }
        }

        return {
          date:
            item.issue.issueDate,

          documentNo:
            item.issue.documentNo,

          owner:
            item.issue.department
              ?.name ?? "-",

          unitPrice:
            latestPrice,

          receiveQty: 0,

          issueQty: Number(item.qty),

          manufacture,

          expiry,
        };
      }
    ),
  ].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  // ==========================================
  // คำนวณยอดคงเหลือ
  // ==========================================

  let balance = 0;

  const stockRows = rows.map(
    (row) => {
      balance += Number(
        row.receiveQty
      );

      balance -= Number(
        row.issueQty
      );

      return {
        ...row,
        balance,
      };
    }
  );

  // ==========================================
  // ส่งข้อมูลไปสร้าง PDF
  // ==========================================

  return (
    <PdfAutoExport
      material={{
        ...material,

        vendor:
          latestReceiveItem?.receive
            .vendor ?? null,

        latestPrice,
      }}
      rows={stockRows}
    />
  );
}