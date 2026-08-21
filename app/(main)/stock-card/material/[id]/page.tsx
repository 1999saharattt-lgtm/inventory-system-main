import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import ExportExcel from "./ExportExcel";
import ExportPdf from "./ExportPdf";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

type StockRow = {
  id: string;
  date: Date;
  documentNo: string;
  type: "RECEIVE" | "ISSUE";
  quantity: number;
  balance: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
  departmentName: string;
  remark: string;
};

type Lot = {
  id: number;
  qty: number;
  balance: number;
  unitPrice: number;
  manufacture: Date | null;
  expiry: Date | null;
  receiveDate: Date;
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("th-TH");
}

function formatNumber(value: number) {
  return value.toLocaleString("th-TH", {
    maximumFractionDigits: 2,
  });
}

function formatPrice(value: number) {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function sortLotsForFefo(lots: Lot[]) {
  return [...lots].sort((a, b) => {
    // ล็อตที่ไม่มีวันหมดอายุให้ไปท้ายสุด
    if (!a.expiry && b.expiry) {
      return 1;
    }

    if (a.expiry && !b.expiry) {
      return -1;
    }

    if (a.expiry && b.expiry) {
      const expiryDiff =
        new Date(a.expiry).getTime() -
        new Date(b.expiry).getTime();

      if (expiryDiff !== 0) {
        return expiryDiff;
      }
    }

    // ถ้า expiry เท่ากัน ให้ดูวันผลิต
    if (!a.manufacture && b.manufacture) {
      return 1;
    }

    if (a.manufacture && !b.manufacture) {
      return -1;
    }

    if (a.manufacture && b.manufacture) {
      const manufactureDiff =
        new Date(a.manufacture).getTime() -
        new Date(b.manufacture).getTime();

      if (manufactureDiff !== 0) {
        return manufactureDiff;
      }
    }

    // สุดท้ายใช้ id
    return a.id - b.id;
  });
}

export default async function StockCardMaterialPage({
  params,
}: Props) {
  const { id } = await params;

  const materialId = Number(id);

  if (!Number.isInteger(materialId)) {
    notFound();
  }

  // =====================================================
  // Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

  // =====================================================
  // Login
  // =====================================================

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // ดึงข้อมูลพัสดุ
  // =====================================================

  const material = await prisma.material.findUnique({
    where: {
      id: materialId,
    },

    include: {
      receiveItems: {
        include: {
          receive: {
            include: {
              vendor: true,
            },
          },
        },

        orderBy: {
          id: "asc",
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
          id: "asc",
        },
      },
    },
  });

  if (!material) {
    notFound();
  }

  // =====================================================
  // สร้างล็อตจาก ReceiveItem
  // =====================================================

  const lots: Lot[] = material.receiveItems.map(
    (item) => ({
      id: item.id,
      qty: Number(item.qty),
      balance: Number(item.balance),
      unitPrice: Number(item.unitPrice),
      manufacture: item.manufacture,
      expiry: item.expiry,
      receiveDate: item.receive.receiveDate,
    })
  );

  // =====================================================
  // จำลอง Stock Card
  //
  // ใช้ FEFO:
  // 1. วันหมดอายุ
  // 2. วันผลิต
  // 3. id
  // =====================================================

  const sortedLots = sortLotsForFefo(lots);

  const workingLots = sortedLots.map((lot) => ({
    ...lot,
    balance: lot.balance,
  }));

  const stockRows: StockRow[] = [];

  // =====================================================
  // รับเข้า
  // =====================================================

  for (const item of material.receiveItems) {
    stockRows.push({
      id: `receive-${item.id}`,
      date: item.receive.receiveDate,
      documentNo: item.receive.documentNo,
      type: "RECEIVE",
      quantity: Number(item.qty),
      balance: 0,
      unitPrice: Number(item.unitPrice),
      manufacture: item.manufacture,
      expiry: item.expiry,
      departmentName:
        item.receive.vendor?.name ?? "-",
      remark: item.receive.remark ?? "",
    });
  }

  // =====================================================
  // เบิกจ่าย
  //
  // จำลองการตัดล็อตตาม FEFO
  // =====================================================

  const issueRows = [...material.issueItems].sort(
    (a, b) => {
      const aTime =
        new Date(a.issue.issueDate).getTime();

      const bTime =
        new Date(b.issue.issueDate).getTime();

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return a.id - b.id;
    }
  );

  for (const item of issueRows) {
    // PENDING / REJECTED ยังไม่ตัด Stock Card
    if (item.issue.status !== "APPROVED") {
      continue;
    }

    let remaining = Number(item.issuedQty);

    if (remaining <= 0) {
      continue;
    }

    const usedLots: Lot[] = [];

    while (remaining > 0) {
      const availableLots =
        sortLotsForFefo(
          workingLots.filter(
            (lot) => lot.balance > 0
          )
        );

      if (availableLots.length === 0) {
        break;
      }

      const lot = availableLots[0];

      const deduct = Math.min(
        lot.balance,
        remaining
      );

      lot.balance -= deduct;
      remaining -= deduct;

      usedLots.push({
        ...lot,
        balance: lot.balance,
      });
    }

    // ===================================================
    // ถ้าเบิกจากหลายล็อต
    // แสดงเป็นหลายบรรทัด
    // ===================================================

    if (usedLots.length === 0) {
      stockRows.push({
        id: `issue-${item.id}`,
        date: item.issue.issueDate,
        documentNo: item.issue.documentNo,
        type: "ISSUE",
        quantity: Number(item.issuedQty),
        balance: 0,
        unitPrice: 0,
        manufacture: null,
        expiry: null,
        departmentName:
          item.issue.department?.name ?? "-",
        remark: "",
      });
    } else {
      let issuedRemaining =
        Number(item.issuedQty);

      for (
        let index = 0;
        index < usedLots.length;
        index++
      ) {
        const usedLot = usedLots[index];

        const previousBalance =
          usedLot.balance +
          Math.min(
            issuedRemaining,
            Number(
              material.receiveItems.find(
                (receiveItem) =>
                  receiveItem.id ===
                  usedLot.id
              )?.balance ?? 0
            )
          );

        const receiveItem =
          material.receiveItems.find(
            (receive) =>
              receive.id === usedLot.id
          );

        const originalBalance =
          Number(
            receiveItem?.balance ?? 0
          );

        const availableBefore =
          Math.max(
            0,
            originalBalance +
              Math.max(
                0,
                Number(item.issuedQty) -
                  issuedRemaining
              )
          );

        const deducted = Math.min(
          availableBefore,
          issuedRemaining
        );

        const quantity =
          deducted > 0
            ? deducted
            : Math.min(
                issuedRemaining,
                Number(
                  receiveItem?.qty ?? 0
                )
              );

        issuedRemaining -= quantity;

        stockRows.push({
          id: `issue-${item.id}-${index}`,
          date: item.issue.issueDate,
          documentNo: item.issue.documentNo,
          type: "ISSUE",
          quantity,
          balance: 0,
          unitPrice: usedLot.unitPrice,
          manufacture: usedLot.manufacture,
          expiry: usedLot.expiry,
          departmentName:
            item.issue.department?.name ?? "-",
          remark: "",
        });

        void previousBalance;
      }
    }
  }

  // =====================================================
  // เรียง Stock Card ตามวันที่
  // =====================================================

  stockRows.sort((a, b) => {
    const dateDiff =
      new Date(a.date).getTime() -
      new Date(b.date).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    if (a.type === "RECEIVE" && b.type === "ISSUE") {
      return -1;
    }

    if (a.type === "ISSUE" && b.type === "RECEIVE") {
      return 1;
    }

    return a.id.localeCompare(b.id);
  });

  // =====================================================
  // คำนวณยอดคงเหลือจากเหตุการณ์
  // =====================================================

  let runningBalance = 0;

  for (const row of stockRows) {
    if (row.type === "RECEIVE") {
      runningBalance += row.quantity;
    } else {
      runningBalance -= row.quantity;
    }

    row.balance = Math.max(
      0,
      runningBalance
    );
  }

  // =====================================================
  // ยอดปัจจุบัน
  //
  // ใช้ผลจำลอง Stock Card เป็นหลัก
  // =====================================================

  const currentBalance = runningBalance;

  // =====================================================
  // ราคาล่าสุด
  // =====================================================

  const latestReceiveItem =
    [...material.receiveItems].sort(
      (a, b) => {
        const aDate =
          new Date(
            a.receive.receiveDate
          ).getTime();

        const bDate =
          new Date(
            b.receive.receiveDate
          ).getTime();

        if (aDate !== bDate) {
          return bDate - aDate;
        }

        return b.id - a.id;
      }
    )[0];

  const latestPrice = latestReceiveItem
    ? Number(latestReceiveItem.unitPrice)
    : Number(material.latestPrice ?? 0);

  // =====================================================
  // ข้อมูลสำหรับ Export
  // =====================================================

  const exportRows = stockRows.map(
    (row) => ({
      date: row.date,
      documentNo: row.documentNo,
      type: row.type,
      quantity: row.quantity,
      balance: row.balance,
      unitPrice: row.unitPrice,
      manufacture: row.manufacture,
      expiry: row.expiry,
      departmentName: row.departmentName,
      remark: row.remark,
    })
  );

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-4
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-4
          py-5
          text-white
          shadow-xl
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0 text-white">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-4xl
            "
          >
            📒 บัญชีพัสดุ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-white
              sm:text-lg
            "
          >
            {material.name}
          </p>
        </div>

        <Link
          href={`/stock-card/${material.category}`}
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-base
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลพัสดุ
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-black
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-4
          text-white
          shadow-xl
          sm:p-6
        "
      >
        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <div>
            <p className="text-sm font-bold text-slate-300">
              รหัสพัสดุ
            </p>

            <p className="mt-1 text-lg font-extrabold text-cyan-300">
              {material.code}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-300">
              หมวดหมู่
            </p>

            <p className="mt-1 font-extrabold text-white">
              {categoryName[
                material.category
              ] ?? material.category}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-300">
              หน่วย
            </p>

            <p className="mt-1 font-extrabold text-white">
              {material.unit}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-300">
              ราคาล่าสุด
            </p>

            <p className="mt-1 font-extrabold text-emerald-300">
              {formatPrice(latestPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          สรุปยอด
      ===================================================== */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-3
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-900
            bg-white
            p-5
            shadow-xl
          "
        >
          <p className="text-sm font-bold text-slate-500">
            จำนวนรับเข้าทั้งหมด
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {formatNumber(
              material.receiveItems.reduce(
                (sum, item) =>
                  sum + Number(item.qty),
                0
              )
            )}
          </p>

          <p className="mt-1 font-semibold text-slate-500">
            {material.unit}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-900
            bg-white
            p-5
            shadow-xl
          "
        >
          <p className="text-sm font-bold text-slate-500">
            จำนวนเบิกจ่ายแล้ว
          </p>

          <p className="mt-2 text-3xl font-extrabold text-rose-600">
            {formatNumber(
              material.issueItems
                .filter(
                  (item) =>
                    item.issue.status ===
                    "APPROVED"
                )
                .reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item.issuedQty
                    ),
                  0
                )
            )}
          </p>

          <p className="mt-1 font-semibold text-slate-500">
            {material.unit}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-emerald-700
            bg-gradient-to-br
            from-emerald-600
            to-green-500
            p-5
            text-white
            shadow-xl
          "
        >
          <p className="text-sm font-bold text-emerald-50">
            คงเหลือปัจจุบัน
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {formatNumber(
              currentBalance
            )}
          </p>

          <p className="mt-1 font-semibold text-emerald-50">
            {material.unit}
          </p>
        </div>
      </div>

      {/* =====================================================
          ปุ่ม Export
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:justify-end
        "
      >
        <ExportExcel
          material={material}
          rows={exportRows}
        />

        <ExportPdf
          material={material}
          rows={exportRows}
        />
      </div>

      {/* =====================================================
          ตารางบัญชีพัสดุ
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-900
          bg-white
          shadow-xl
        "
      >
        <div className="w-full overflow-x-auto">
          <table
            className="
              w-full
              min-w-[1200px]
              border-collapse
              text-sm
            "
          >
            <thead>
              <tr
                className="
                  bg-gradient-to-r
                  from-slate-800
                  to-slate-700
                  text-white
                "
              >
                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  ลำดับ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  วันที่
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  เลขที่เอกสาร
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  รายการ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  จำนวนรับ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  จำนวนเบิก
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  คงเหลือ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  ราคาต่อหน่วย
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  วันผลิต
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  วันหมดอายุ
                </th>

                <th className="border border-black px-3 py-4 text-center font-extrabold">
                  หน่วยงาน
                </th>
              </tr>
            </thead>

            <tbody>
              {stockRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="
                      border
                      border-black
                      px-4
                      py-12
                      text-center
                      font-semibold
                      text-slate-500
                    "
                  >
                    ยังไม่มีข้อมูลในบัญชีพัสดุ
                  </td>
                </tr>
              ) : (
                stockRows.map(
                  (row, index) => (
                    <tr
                      key={row.id}
                      className="
                        transition
                        hover:bg-emerald-50
                      "
                    >
                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                        "
                      >
                        {index + 1}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          whitespace-nowrap
                        "
                      >
                        {formatDate(row.date)}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-semibold
                          whitespace-nowrap
                        "
                      >
                        {row.documentNo || "-"}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                        "
                      >
                        {row.type === "RECEIVE" ? (
                          <span className="text-emerald-700">
                            รับเข้า
                          </span>
                        ) : (
                          <span className="text-rose-700">
                            เบิกจ่าย
                          </span>
                        )}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                        "
                      >
                        {row.type ===
                        "RECEIVE"
                          ? formatNumber(
                              row.quantity
                            )
                          : "-"}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                        "
                      >
                        {row.type === "ISSUE"
                          ? formatNumber(
                              row.quantity
                            )
                          : "-"}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                        "
                      >
                        {formatNumber(
                          row.balance
                        )}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-right
                          font-semibold
                        "
                      >
                        {formatPrice(
                          row.unitPrice
                        )}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          whitespace-nowrap
                        "
                      >
                        {formatDate(
                          row.manufacture
                        )}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          whitespace-nowrap
                        "
                      >
                        {formatDate(
                          row.expiry
                        )}
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-semibold
                        "
                      >
                        {row.departmentName ||
                          "-"}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          หมายเหตุ FEFO
      ===================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-300
          bg-slate-50
          p-4
          text-sm
          font-semibold
          text-slate-700
          shadow
        "
      >
        <p className="font-extrabold text-slate-900">
          หมายเหตุ
        </p>

        <p className="mt-1">
          ระบบคำนวณการตัดล็อตแบบ FEFO โดยพิจารณา
          วันหมดอายุก่อน วันผลิต และรหัสล็อตตามลำดับ
        </p>
      </div>
    </div>
  );
}