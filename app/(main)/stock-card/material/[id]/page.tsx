import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExportPdf from "./ExportPdf";
import ExportExcel from "./ExportExcel";

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

function formatDateAD(date: Date | string) {
  const d = new Date(date);

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export default async function StockCardPage({ params }: Props) {
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
      <div className="rounded-2xl border border-slate-300 bg-white p-8 text-center text-lg font-bold text-slate-600 shadow-lg">
        ไม่พบข้อมูลพัสดุ
      </div>
    );
  }

  // ==========================================
  // รายการรับเข้าล่าสุด
  // ==========================================

  const latestReceiveItem =
    material.receiveItems.length > 0
      ? material.receiveItems[material.receiveItems.length - 1]
      : null;

  const latestVendor =
    latestReceiveItem?.receive.vendor?.name ?? "-";

  const latestPrice = latestReceiveItem
    ? Number(latestReceiveItem.unitPrice)
    : 0;

  // ==========================================
  // สร้างข้อมูลล็อตสำหรับจำลอง FEFO
  // ==========================================

  type Lot = {
    id: number;
    qty: number;
    manufacture: Date | null;
    expiry: Date | null;
  };

  const lots: Lot[] = [];

  // ==========================================
  // รวมรายการรับเข้าและรายการเบิกจ่าย
  // เฉพาะ APPROVED เท่านั้นที่ตัดสต็อก
  // ==========================================

  const events = [
    ...material.receiveItems.map((item) => ({
      type: "receive" as const,
      date: item.receive.receiveDate,
      item,
    })),

    ...material.issueItems
      .filter(
        (item) => item.issue.status === "APPROVED"
      )
      .map((item) => ({
        type: "issue" as const,
        date: item.issue.issueDate,
        item,
      })),
  ].sort((a, b) => {
    const dateDiff =
      new Date(a.date).getTime() -
      new Date(b.date).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    if (
      a.type === "receive" &&
      b.type === "issue"
    ) {
      return -1;
    }

    if (
      a.type === "issue" &&
      b.type === "receive"
    ) {
      return 1;
    }

    return 0;
  });

  // ==========================================
  // เก็บว่ารายการเบิกแต่ละรายการ
  // ถูกตัดออกจากล็อตไหน
  // ==========================================

  const issueLotMap = new Map<
    number,
    {
      manufacture: Date | null;
      expiry: Date | null;
    }
  >();

  // ==========================================
  // จำลองการเคลื่อนไหวของสต็อกตาม FEFO
  // ==========================================

  for (const event of events) {
    if (event.type === "receive") {
      const receiveItem = event.item;

      lots.push({
        id: receiveItem.id,
        qty: Number(receiveItem.qty),
        manufacture: receiveItem.manufacture,
        expiry: receiveItem.expiry,
      });

      continue;
    }

    const issueItem = event.item;

    let remainingQty = Number(
      issueItem.issuedQty ?? issueItem.qty
    );

    const availableLots = lots
      .filter((lot) => lot.qty > 0)
      .sort((a, b) => {
        const aUnspecified =
          !a.manufacture && !a.expiry;

        const bUnspecified =
          !b.manufacture && !b.expiry;

        if (
          aUnspecified &&
          !bUnspecified
        ) {
          return -1;
        }

        if (
          !aUnspecified &&
          bUnspecified
        ) {
          return 1;
        }

        if (
          aUnspecified &&
          bUnspecified
        ) {
          return a.id - b.id;
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
          ? new Date(
              a.manufacture
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bManufacture = b.manufacture
          ? new Date(
              b.manufacture
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (
          aManufacture !==
          bManufacture
        ) {
          return (
            aManufacture -
            bManufacture
          );
        }

        return a.id - b.id;
      });

    let selectedLot: Lot | null = null;

    for (const lot of availableLots) {
      if (remainingQty <= 0) {
        break;
      }

      const issueQty = Math.min(
        remainingQty,
        lot.qty
      );

      if (!selectedLot) {
        selectedLot = lot;
      }

      lot.qty -= issueQty;
      remainingQty -= issueQty;
    }

    if (selectedLot) {
      issueLotMap.set(issueItem.id, {
        manufacture:
          selectedLot.manufacture,
        expiry:
          selectedLot.expiry,
      });
    }
  }

  // ==========================================
  // สร้างข้อมูล Stock Card
  // ==========================================

  const rows = [
    ...material.receiveItems.map((item) => ({
      date: item.receive.receiveDate,

      documentNo:
        item.receive.documentNo,

      owner:
        item.receive.vendor?.name ?? "-",

      unitPrice: Number(item.unitPrice),

      receiveQty: item.qty,

      issueQty: 0,

      manufacture: item.manufacture,

      expiry: item.expiry,
    })),

    ...material.issueItems
      .filter(
        (item) =>
          item.issue.status ===
          "APPROVED"
      )
      .map((item) => {
        const lot = issueLotMap.get(item.id);

        return {
          date: item.issue.issueDate,

          documentNo:
            item.issue.documentNo,

          owner:
            item.issue.department?.name ??
            "-",

          unitPrice: latestPrice,

          receiveQty: 0,

          issueQty: Number(
            item.issuedQty ?? item.qty
          ),

          manufacture:
            lot?.manufacture ?? null,

          expiry:
            lot?.expiry ?? null,
        };
      }),
  ].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  // ==========================================
  // คำนวณยอดคงเหลือ
  // ==========================================

  let balance = 0;

  const stockRows = rows.map((row) => {
    balance += Number(row.receiveQty);
    balance -= Number(row.issueQty);

    return {
      ...row,
      balance,
    };
  });

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
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
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
              !text-slate-200
              sm:mt-3
              sm:text-base
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
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:w-auto
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          รายละเอียดพัสดุ
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          shadow-xl
          sm:p-6
        "
      >
        <div
          className="
            grid
            min-w-0
            grid-cols-1
            gap-4
            sm:gap-6
            md:grid-cols-2
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-200
                sm:text-lg
              "
            >
              รหัสพัสดุ
            </p>

            <p
              className="
                mt-1
                break-words
                text-base
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              {material.code || "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-200
                sm:text-lg
              "
            >
              รายการพัสดุ
            </p>

            <p
              className="
                mt-1
                break-words
                text-base
                font-extrabold
                leading-tight
                !text-white
                sm:text-xl
              "
            >
              {material.name || "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-200
                sm:text-lg
              "
            >
              หมวดหมู่
            </p>

            <p
              className="
                mt-1
                break-words
                text-base
                font-extrabold
                leading-tight
                !text-white
                sm:text-xl
              "
            >
              {categoryName[material.category] ??
                material.category ??
                "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-200
                sm:text-lg
              "
            >
              หน่วย
            </p>

            <p
              className="
                mt-1
                text-base
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              {material.unit || "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-200
                sm:text-lg
              "
            >
              ผู้จำหน่ายล่าสุด
            </p>

            <p
              className="
                mt-1
                break-words
                text-base
                font-extrabold
                leading-tight
                !text-white
                sm:text-xl
              "
            >
              {latestVendor}
            </p>
          </div>

          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                !text-slate-200
                sm:text-lg
              "
            >
              ราคาล่าสุด
            </p>

            <p
              className="
                mt-1
                text-base
                font-extrabold
                !text-white
                sm:text-xl
              "
            >
              {latestReceiveItem
                ? latestPrice.toLocaleString(
                    "th-TH",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )
                : "-"}{" "}
              บาท
            </p>
          </div>
        </div>
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
          bg-white
          shadow-lg
        "
      >
        <div
          className="
            w-full
            max-w-full
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-max
              min-w-[1000px]
              border-collapse
            "
          >
            <thead>
              <tr>
                {[
                  "วันที่",
                  "เลขที่เอกสาร",
                  "ผู้จำหน่าย / หน่วยงาน",
                  "ราคาล่าสุด",
                  "รับเข้า",
                  "เบิกจ่าย",
                  "คงเหลือ",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-2
                      py-2.5
                      text-center
                      text-xs
                      font-extrabold
                      !text-white
                      sm:px-4
                      sm:py-4
                      sm:text-lg
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {stockRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-slate-900
                      py-10
                      text-center
                      text-sm
                      font-bold
                      text-slate-500
                      sm:py-12
                      sm:text-lg
                    "
                  >
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                stockRows.map((row, index) => (
                  <tr
                    key={index}
                    className="
                      hover:bg-blue-50
                    "
                  >
                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-center
                        text-xs
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {formatDateAD(row.date)}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-xs
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.documentNo}
                    </td>

                    <td
                      className="
                        max-w-[180px]
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-xs
                        font-semibold
                        text-slate-700
                        sm:max-w-none
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.owner}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-right
                        text-xs
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {Number(
                        row.unitPrice
                      ).toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-center
                        text-xs
                        font-extrabold
                        text-slate-900
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.receiveQty > 0
                        ? row.receiveQty
                        : "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-center
                        text-xs
                        font-extrabold
                        text-slate-900
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.issueQty > 0
                        ? row.issueQty
                        : "-"}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-center
                        text-xs
                        font-extrabold
                        text-slate-900
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.balance}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-center
                        text-xs
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.manufacture
                        ? formatDateAD(
                            row.manufacture
                          )
                        : "-"}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-slate-900
                        px-2
                        py-2.5
                        text-center
                        text-xs
                        font-semibold
                        text-slate-700
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {row.expiry
                        ? formatDateAD(
                            row.expiry
                          )
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          Export
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-wrap
          gap-2
          sm:gap-3
        "
      >
        <ExportPdf
          material={{
            ...material,
            vendor:
              latestReceiveItem?.receive.vendor ??
              null,
            latestPrice,
          }}
          rows={stockRows}
        />

        <ExportExcel
          material={{
            ...material,
            vendor:
              latestReceiveItem?.receive.vendor ??
              null,
            latestPrice,
          }}
          rows={stockRows}
        />
      </div>
    </div>
  );
}